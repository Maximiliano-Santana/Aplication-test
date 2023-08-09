import './style.css';
import coordinates from '/coordinates.js';

import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'

import GUI from 'lil-gui';
import gsap from 'gsap';

THREE.ColorManagement.enabled = false;

//Sizes 
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

//Resize

window.addEventListener('resize', ()=>{
  //Update Sizes 
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  //Update camera
  camera.aspect = sizes.width/sizes.height;
  camera.updateProjectionMatrix();
  //Update Renderer
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

//------------- Loaders

const loadingManager = new THREE.LoadingManager();
loadingManager.onLoad = ()=>{
  console.log('assets loaded');
  console.log('initializing project')
  initProject();
}
loadingManager.onProgress = (progress)=>{
  console.log(progress);
}
 
const textureLoader = new THREE.TextureLoader(loadingManager);
const fbxLoader = new FBXLoader(loadingManager);

let car = null;
fbxLoader.load('/model/s13.fbx', (fbx)=>{
  car = fbx.children[0];
})

//Scene 
const scene = new THREE.Scene();

//Camera 
const camera = new THREE.PerspectiveCamera(50, sizes.width/sizes.height, 0.01, 500);

//Renderer
const canvas = document.querySelector('.experience')
const renderer = new THREE.WebGLRenderer({canvas: canvas});
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(sizes.width, sizes.height);

function initProject(){
  
  //Controls 
  const orbitControls = new OrbitControls(camera, canvas);
  orbitControls.enableDamping = true;
  orbitControls.enabled = true;
  
  //Lights

  const ambientLight = new THREE.AmbientLight('0xffffff', 4);
  scene.add(ambientLight)

  //Objects
  scene.add(car)
  car.scale.set(1, 1, 1)
  car.position.set(0, 0, 0)
  
  //Line from coordinates  
  const vector2CoordinatesArray = []
  const vector3CoordinatesArray = []
  let curveScale = 100000

  for (const coord of coordinates){
    vector2CoordinatesArray.push(new THREE.Vector2(coord[0]*curveScale, coord[1]*curveScale));
    vector3CoordinatesArray.push(new THREE.Vector3(coord[0]*curveScale, 0, coord[1]*curveScale));
  }


  //--------CatmulRomCurve
  const curve = new THREE.CatmullRomCurve3(vector3CoordinatesArray, true, 'chordal');
  
  const points = curve.getPoints(90); // Cambia el valor para ajustar la cantidad de puntos en la línea
  
  const lineMaterial = new THREE.LineBasicMaterial( { color: 0xffffff} )
  const curveGeometry = new THREE.BufferGeometry().setFromPoints(points)
  curveGeometry.center();
  
  const curveMesh = new THREE.Line(curveGeometry, lineMaterial)

  scene.add(curveMesh)
  
  //--------Coordinates curve
  
  const coordsShape = new THREE.Shape(vector2CoordinatesArray);
  coordsShape.closePath();
  
  const coordsLineGeometry = new THREE.BufferGeometry().setFromPoints(coordsShape.getPoints());
  coordsLineGeometry.center();
  
  const coordsLine = new THREE.Line(coordsLineGeometry, lineMaterial);
  coordsLine.rotation.x = Math.PI/2;
  scene.add(coordsLine)
  coordsLine.visible = false;
  


  
  //Car initial position

  car.position.x = curveMesh.geometry.attributes.position.array[0]
  car.position.y = curveMesh.geometry.attributes.position.array[1]
  car.position.z = curveMesh.geometry.attributes.position.array[2]

  //car.rotation.copy(new THREE.Euler(0, Math.PI/2, 0))
  //car.setRotationFromAxisAngle(new THREE.Vector3(-1, 0, 0), Math.PI/2);

  car.rotation.reorder('YXZ')
  car.lookAt(new THREE.Vector3(0, 0, 0))
  car.rotation.x = -Math.PI/2
  car.rotation.z = Math.PI
  //car.rotation.y = Math.PI/2
  

  let index = 0;
  
  const animateCar = ()=>{
    car.lookAt(new THREE.Vector3(
      curveMesh.geometry.attributes.position.array[((index)*3)+0],
      curveMesh.geometry.attributes.position.array[((index)*3)+1],
      curveMesh.geometry.attributes.position.array[((index)*3)+2],
    ))    

    car.rotation.x = -Math.PI/2
    car.rotation.z = Math.PI

    gsap.to(car.position, {duration: 0.5, delay: 0, ease:'linear' ,x: curveMesh.geometry.attributes.position.array[index*3+0]});
    gsap.to(car.position, {duration: 0.5, delay: 0, ease:'linear' ,y: curveMesh.geometry.attributes.position.array[index*3+1]});
    gsap.to(car.position, {duration: 0.5, delay: 0, ease:'linear' ,z: curveMesh.geometry.attributes.position.array[index*3+2]})
      .then(()=>{
        index++;
      if (index >= curveMesh.geometry.attributes.position.array.length/3){
        index = 0;
      }
      animateCar();   
      });
    }
    animateCar();

  
  //Scene Configuration
  
  camera.position.set(12, 15, 12)
  
  //Gui
  
  //Animate
  const clock = new THREE.Clock();
  let lastTime = 0;

  const tick = ()=>{
    //Clock
    const time = clock.getElapsedTime();
    const deltaTime = time - lastTime;
    lastTime = time;

    //Animate car 
    
    //Controls
    // const cameraOffset = new THREE.Vector3(0, 3, 10); // Ajusta la posición vertical y la distancia
    // const cameraPosition = car.position.clone().add(cameraOffset);
    // camera.position.copy(cameraPosition);

    orbitControls.target = car.position 


    orbitControls.update();
    //Render
    renderer.render(scene, camera);
    window.requestAnimationFrame(tick);
  }
  setGui(curveMesh, coordsLine);
  tick();

}

function setGui(curveMesh, coordsLine){
  const gui = new GUI();
  gui.add(car, 'visible').name('car visible');
  gui.add(coordsLine, 'visible').name('coords');
  gui.add(curveMesh, 'visible').name('curve');

}