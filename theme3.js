import * as THREE from 'three';
import * as Util from './util.js'

let planeVertexShader = `
    varying float x;
    varying float y;
    varying float z;
    varying vec3 vUv;
    uniform float u_time;
    uniform float u_amplitude;
    uniform float[64] u_data_arr;
    void main() {
    vUv = position;
    x = abs(position.x);
    y = abs(position.y);
    float floor_x = round(x);
    float floor_y = round(y);
    z = sin(u_data_arr[int(floor_x)] / 50.0 + u_data_arr[int(floor_y)] / 50.0) * u_amplitude * u_amplitude / 600.0;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position.x, position.y, z, 1.0);
    }
`;

let planeFragmentShader = `
    varying float x;
    varying float y;
    varying float z;
    varying vec3 vUv;
    uniform float u_time;
    uniform float u_amplitude;
    void main() {
    gl_FragColor = vec4((10.0+ u_amplitude/1.3 - abs(x)) / 60.0, (20.0 + u_amplitude/1.5 - abs(y)) / 60.0, (abs(x + y) / 2.0) / 24.0, 1.0);
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
let freqBins;
let current_sensitivity;
let planeMesh;

const freqBinsPosition = {
    x:
    {
      type: "f",
      value: -40
    },
    y:
    {
      type: "f",
      value: 30
    },
    z:
    {
      type: "f",
      value: 0
    }
  }

export function play(in_scene, in_renderer, in_analyser, in_dataArray){
    scene = in_scene;
    renderer = in_renderer;
    analyser = in_analyser;
    dataArray = in_dataArray;

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

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 100);
    camera.lookAt(scene.position);
    scene.add(camera);

    var ambientLight = new THREE.AmbientLight(0xffffff);
    scene.add(ambientLight);

    freqBins = makeFreqBins();
    freqBins.position.set(freqBinsPosition.x.value, freqBinsPosition.y.value, freqBinsPosition.z.value);
    scene.add(freqBins);

    var plane = makePlane();
    scene.add(plane);

    window.addEventListener('resize', onWindowResize, false);

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

export function render() {
    if (analyser.fftSize != current_sensitivity)
    {
        scene.remove(freqBins);
        freqBins = makeFreqBins();
        freqBins.position.set(freqBinsPosition.x.value, freqBinsPosition.y.value, freqBinsPosition.z.value);
        scene.add(freqBins);
    }
    analyser.getByteFrequencyData(dataArray);
    updateFreqBins(freqBins, dataArray);

    uniforms.u_amplitude.value = Util.avg(dataArray);
    // console.log(uniforms.u_amplitude.value);
    planeMesh.rotation.z += 0.002;
    renderer.render(scene, camera);
}

function makeFreqBins()
{
    var binGroup = new THREE.Group();
    const totalWidth = 80;
    
    var binGeometry = new THREE.PlaneGeometry(totalWidth/analyser.frequencyBinCount, 2, 5, 5); //analyser.frequencyBinCount
    var binMaterial = new THREE.MeshLambertMaterial({
        color: 0xfefe0b,
        side: THREE.DoubleSide,
        wireframe: true
    });
    
    var binPos = 0;
    for (var i=0; i<analyser.frequencyBinCount; i++)
    {
    var binMesh = new THREE.Mesh(binGeometry, binMaterial);
    binMesh.name = "bin"+i;
    binMesh.position.x = binPos;
    binPos += totalWidth/analyser.frequencyBinCount;
    binGroup.add(binMesh);
    }
    
    return binGroup;
}

function updateFreqBins(binGroup, dataArr)
{
    for (var i=0; i<binGroup.children.length; i++)
    {
    var bin = binGroup.getObjectByName("bin"+i);
    var binHeight = dataArr[i];
    
    bin.scale.set(1, 1/bin.scale.y, 1);
    bin.scale.set(1, binHeight/50, 1);
    }
}

function makePlane()
{
    const planeGeometry = new THREE.PlaneGeometry(36, 36, 40, 40);
    const planeMaterial = new THREE.ShaderMaterial({
        uniforms: uniforms, // dataArray, time
        vertexShader: planeVertexShader,
        fragmentShader: planeFragmentShader,
        wireframe: true,
        });
    planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
    planeMesh.rotation.x = -Math.PI / 2 + Math.PI / 4;
    planeMesh.scale.x = 1.4;
    planeMesh.scale.y = 1.4;
    planeMesh.scale.z = 1.4;
    planeMesh.position.y = 0;
    scene.add(planeMesh);
}