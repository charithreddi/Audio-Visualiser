import * as Util from './util.js';
import * as THREE from 'three';
import { createNoise2D } from './node_modules/simplex-noise/dist/esm/simplex-noise.js';
import { createNoise3D } from './node_modules/simplex-noise/dist/esm/simplex-noise.js';

var noise2D = new createNoise2D();
var noise3D = new createNoise3D();

// Simplex Noise Algorithm Provided from https://stegu.github.io/webgl-noise/webdemo/

var ballVertexShader = `
  vec3 mod289(vec3 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
  }

  vec4 mod289(vec4 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
  }

  vec4 permute(vec4 x) {
      return mod289(((x*34.0)+10.0)*x);
  }

  vec4 taylorInvSqrt(vec4 r)
  {
    return 1.79284291400159 - 0.85373472095314 * r;
  }

  float snoise(vec3 v)
  { 
    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 =   v - i + dot(i, C.xxx) ;

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
    vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y

    i = mod289(i); 
    vec4 p = permute( permute( permute( 
              i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
            + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

    float n_ = 0.142857142857; // 1.0/7.0
    vec3  ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );

    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.5 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 105.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                  dot(p2,x2), dot(p3,x3) ) );
  }

  varying float x;
  varying float y;
  varying float z;
  varying float rf;
  varying float distance;
  varying vec3 vertexPos;

  uniform float u_time;
  uniform float u_amplitude;
  uniform float[64] u_data_arr;
    
  void main()
  {
    vertexPos = position;
    x = abs(position.x);
    y = abs(position.y);
    y = abs(position.z);

    float floor_x = round(x);
    float floor_y = round(y);
    float floor_z = round(z);

    rf = 0.07;
    distance = (sin(snoise(vec3(u_data_arr[int(floor_x)] / 50.0 * rf * 1.1, u_data_arr[int(floor_y)] / 50.0 * rf * 1.1, u_data_arr[int(floor_z)] / 50.0 * rf * 1.2)) ) + 1.0);
    vec4 ViewPosition= modelViewMatrix * vec4(position.x * distance, position.y * distance, position.z * distance, 1.0);
    gl_Position=projectionMatrix * ViewPosition;
  }
`;

var ballFragmentShader= `
    varying float distance;
    varying vec3 vNormal;

    uniform float u_time;

    void main()
    {
        gl_FragColor = vec4(distance - 1.0 / 2.0, 0.0, 1.0 - distance / 2.0, 1.0);
    }
`;

let analyser;
let scene;
let dataArray;
let renderer;
let opt_out = false;
let uniforms;
let plane2;
let group;
let camera;

export function play(in_scene, in_renderer, in_analyser, in_dataArray) {
    scene = in_scene;
    renderer = in_renderer;
    analyser = in_analyser;
    dataArray = in_dataArray;
    
    group = new THREE.Group();
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 100);
    camera.lookAt(scene.position);
    scene.add(camera);

    uniforms =
    {
      u_time:
      {
        type: "f",
        value: 1.0,
      },
      u_amplitude: {
        type: "f",
        value: 1.0,
      },
      u_data_arr: {
        type: "float[64]",
        value: dataArray,
      },
    };

    var planeGeometry = new THREE.PlaneGeometry(800, 800, 20, 20);
    var planeMaterial = new THREE.MeshLambertMaterial({
      color: 0x6904ce,
      side: THREE.DoubleSide,
      wireframe: true
    });

    var plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -0.5 * Math.PI;
    plane.position.set(0, 30, 0);

    plane2 = new THREE.Mesh(planeGeometry, planeMaterial);
    plane2.rotation.x = -0.5 * Math.PI;
    plane2.position.set(0, -30, 0);
    group.add(plane2);

    var icosahedronGeometry = new THREE.IcosahedronGeometry(15, 5);
    var shaderMaterial = new THREE.ShaderMaterial({
      uniforms: uniforms, // dataArray, time
      vertexShader: ballVertexShader,
      fragmentShader: ballFragmentShader,
      wireframe: true,
    });

    var ball = new THREE.Mesh(icosahedronGeometry, shaderMaterial);
    ball.position.set(0, 0, 0);
    group.add(ball);

    var ambientLight = new THREE.AmbientLight(0xaaaaaa);
    scene.add(ambientLight);

    var spotLight = new THREE.SpotLight(0xffffff);
    spotLight.intensity = 0.9;
    spotLight.position.set(-10, 40, 20);
    spotLight.lookAt(ball);
    spotLight.castShadow = true;
    scene.add(spotLight);

    scene.add(group);    

    document.getElementById('out').appendChild(renderer.domElement);
    window.addEventListener('resize', onWindowResize, false);

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
  }

  export function render() {
    analyser.getByteFrequencyData(dataArray);

    var lowerHalfArray = dataArray.slice(0, (analyser.frequencyBinCount / 2) - 1);
    var lowerMax = Util.max(lowerHalfArray);
    var lowerMaxFr = lowerMax / lowerHalfArray.length;

    vibrateGround(plane2, Util.modulate(lowerMaxFr, 0, 1, 0.5, 4));

    group.rotation.y += 0.003;
    
    uniforms.u_time.value = window.performance.now();
    uniforms.u_data_arr.value = dataArray;
  
    renderer.render(scene, camera);   
  }

  function vibrateGround(mesh, distortionFr) {
    for (let i = 0; i < mesh.geometry.attributes.position.count; i++) {
      var position = new THREE.Vector3();

      var amp = 1.5;
      var time = Date.now();
      var vertex = position.fromBufferAttribute(mesh.geometry.attributes.position, i);
      var distance = (noise2D(vertex.x + time * 0.0003, vertex.y + time * 0.0001) + 0) * distortionFr * amp;
      mesh.geometry.attributes.position.setZ(i, distance);
    }

    mesh.geometry.computeVertexNormals();
    mesh.geometry.attributes.position.needsUpdate = true;
  }