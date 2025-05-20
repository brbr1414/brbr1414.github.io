import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import Stats from 'three/addons/libs/stats.module.js';

const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

// Cameras
const perspectiveCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const orthographicCamera = new THREE.OrthographicCamera(
    window.innerWidth / -20,
    window.innerWidth / 20,
    window.innerHeight / 20,
    window.innerHeight / -20,
    0.1,
    1000
);
let currentCamera = perspectiveCamera;
currentCamera.position.z = 150;

const controls = new OrbitControls(currentCamera, renderer.domElement);

// Light
const light = new THREE.PointLight(0xffffff, 3);
light.position.set(0, 0, 0);
scene.add(light);
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

// Stats
const stats = new Stats();
document.body.appendChild(stats.dom);

// Sun
const sunGeometry = new THREE.SphereGeometry(10, 32, 32);
// Use MeshBasicMaterial with emissive effect for enhanced appearance
const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00, emissive: 0xffff00 });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

// Texture Loader
const textureLoader = new THREE.TextureLoader();

// Ensure all texture image files (Mercury.jpg, Venus.jpg, etc.) are in the same directory as this JS file
const planetsData = [
    { name: 'Mercury', radius: 1.5, distance: 20, color: '#a6a6a6', rotationSpeed: 0.02, orbitSpeed: 0.02, texture: './Mercury.jpg' },
    { name: 'Venus', radius: 3, distance: 35, color: '#e39e1c', rotationSpeed: 0.015, orbitSpeed: 0.015, texture: './Venus.jpg' },
    { name: 'Earth', radius: 3.5, distance: 50, color: '#3498db', rotationSpeed: 0.01, orbitSpeed: 0.01, texture: './Earth.jpg' },
    { name: 'Mars', radius: 2.5, distance: 65, color: '#c0392b', rotationSpeed: 0.008, orbitSpeed: 0.008, texture: './Mars.jpg' },
];

const planets = [];
const gui = new GUI();
// Add a label for the Sun in the GUI for consistency
gui.add({ Sun: 'Sun (Radius 10)' }, 'Sun');

planetsData.forEach(data => {
    const planetGroup = new THREE.Group();

    const texture = textureLoader.load(data.texture);
    // Ensure the texture is treated as sRGB so colors aren't crushed to black
    texture.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.MeshStandardMaterial({ map: texture });
    const geometry = new THREE.SphereGeometry(data.radius, 32, 32);
    const mesh = new THREE.Mesh(geometry, material);
    // Keep the planet centered in its pivot group; the group itself orbits the Sun
    mesh.position.x = 0;
    planetGroup.add(mesh);

    data.angle = Math.random() * Math.PI * 2; // start angle
    data.mesh = mesh;
    data.group = planetGroup;
    scene.add(planetGroup);
    planets.push(data);

    const folder = gui.addFolder(data.name);
    folder.add(data, 'rotationSpeed', 0, 2.0).step(0.001);
    folder.add(data, 'orbitSpeed', 0, 2.0).step(0.001);
});

// Camera projection toggle (Perspective <-> Orthographic)
const cameraFolder = gui.addFolder('Camera');
const cameraSettings = { projection: 'Perspective' }; // default

cameraFolder
    .add(cameraSettings, 'projection', ['Perspective', 'Orthographic'])
    .name('Projection')
    .onChange(value => {
        currentCamera = value === 'Perspective' ? perspectiveCamera : orthographicCamera;
        currentCamera.position.z = 150;
        controls.object = currentCamera;
    });

// Animation
function animate() {
    requestAnimationFrame(animate);

    planets.forEach(p => {
        p.mesh.rotation.y += p.rotationSpeed;
        p.angle += p.orbitSpeed;
        p.group.position.x = Math.cos(p.angle) * p.distance;
        p.group.position.z = Math.sin(p.angle) * p.distance;
    });

    stats.update();
    controls.update();
    renderer.render(scene, currentCamera);
}
animate();

// Resize
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    perspectiveCamera.aspect = window.innerWidth / window.innerHeight;
    perspectiveCamera.updateProjectionMatrix();
    orthographicCamera.left = window.innerWidth / -20;
    orthographicCamera.right = window.innerWidth / 20;
    orthographicCamera.top = window.innerHeight / 20;
    orthographicCamera.bottom = window.innerHeight / -20;
    orthographicCamera.updateProjectionMatrix();
});
