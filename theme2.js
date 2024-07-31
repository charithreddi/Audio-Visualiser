import { AudioListener, Audio, AudioLoader, AudioAnalyser, Clock } from './build/three.module.js';
import { Scene, SphereGeometry, Vector3, PerspectiveCamera, WebGLRenderer, Color, MeshBasicMaterial, MeshStandardMaterial, Mesh } from 'three';
import { OrbitControls } from 'https://unpkg.com/three@0.146/examples/jsm/controls/OrbitControls.js';
import { createSculptureWithGeometry } from 'https://unpkg.com/shader-park-core/dist/shader-park-core.esm.js';
import * as Util from './util.js'

var spCode = `
let audio = input();
      let pointerDown = input();
      
      
      setMaxIterations(5);
      let s = getSpace();
      let r = getRayDirection();
      
      let n1 = noise(r * 4 +vec3(0, audio, vec3(0, audio, audio))*.5 );
      let n = noise(s + vec3(0, 0, audio+time*.1) + n1);
      
      metal(n*.5+.5);
      shine(n*.5+.5);
      
      color(normal * .1 + vec3(0, 0, 1));
      displace(mouse.x * 2, mouse.y * 2, 0);
      boxFrame(vec3(2), abs(n) * .1 + .04 );
      mixGeo(pointerDown);
      sphere(n * .5 + .8);
    `;

let scene;
let renderer;
let analyser;
let dataArray;
let clock;
let state;
let camera;
let controls;

export function play(in_scene, in_renderer, in_analyser, in_dataArray) {
  scene = in_scene;
  renderer = in_renderer;
  analyser = in_analyser;
  dataArray = in_dataArray;

camera = new PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
camera.position.z = 1.5;

// let renderer = new WebGLRenderer({ antialias: true, transparent: true });
// renderer.setSize( window.innerWidth, window.innerHeight );
// renderer.setPixelRatio( window.devicePixelRatio );
// renderer.setClearColor( new Color(1, 1, 1), 0);
// document.body.appendChild( renderer.domElement );


clock = new Clock();


state = {
  mouse : new Vector3(),
  currMouse : new Vector3(),
  pointerDown: 0.0,
  currPointerDown: 0.0,
  audio: 0.0,
  currAudio: 0.0,
  time: 0.0
}

window.addEventListener( 'pointermove', (event) => {
  state.currMouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	state.currMouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}, false );

window.addEventListener( 'pointerdown', (event) => state.currPointerDown = 1.0, false );
window.addEventListener( 'pointerup', (event) => state.currPointerDown = 0.0, false );


let geometry  = new SphereGeometry(2, 45, 45);

// // // Create Shader Park Sculpture
let mesh = createSculptureWithGeometry(geometry, spCode, () => ( {
  time: state.time,
  pointerDown: state.pointerDown,
  audio: state.audio,
  mouse: state.mouse,
  _scale : .5
} ));

scene.add(mesh);

// Add Controlls
controls = new OrbitControls( camera, renderer.domElement, {
  enableDamping : true,
  dampingFactor : 0.25,
  zoomSpeed : 0.5,
  rotateSpeed : 0.5
} );

let onWindowResize = () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
}

window.addEventListener( 'resize', onWindowResize );

// let render = () => {
//   requestAnimationFrame( render );
//   state.time += clock.getDelta();
//   controls.update();
//   if(analyser) {
//     state.currAudio += Math.pow((analyser.getFrequencyData()[2] / 255) * .81, 8) + clock.getDelta() * .5;
//     state.audio = .2 * state.currAudio + .8 * state.audio;
//   }
//   state.pointerDown = .1 * state.currPointerDown + .9 * state.pointerDown;
//   state.mouse.lerp(state.currMouse, .05 );
//   renderer.render( scene, camera );
// };
}

export function render() {
  state.time += clock.getDelta();
  controls.update();
  if(analyser) {
    analyser.getByteFrequencyData(dataArray);
    var overallAvg = Util.avg(dataArray);
    state.currAudio += Math.pow((overallAvg/65) * 0.35, 2) + clock.getDelta() * 0.1;
    state.audio = .4 * state.currAudio + .4 * state.audio;
  }
  state.pointerDown = .1 * state.currPointerDown + .5 * state.pointerDown;
  state.mouse.lerp(state.currMouse, .05 );
  renderer.render( scene, camera );
  // requestAnimationFrame( render );
}