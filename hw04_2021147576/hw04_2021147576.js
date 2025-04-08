/*-------------------------------------------------------------------------
08_Transformation.js

canvas의 중심에 한 edge의 길이가 0.3인 정사각형을 그리고, 
이를 크기 변환 (scaling), 회전 (rotation), 이동 (translation) 하는 예제임.
    T는 x, y 방향 모두 +0.5 만큼 translation
    R은 원점을 중심으로 2초당 1회전의 속도로 rotate
    S는 x, y 방향 모두 0.3배로 scale
이라 할 때, 
    keyboard 1은 TRS 순서로 적용
    keyboard 2는 TSR 순서로 적용
    keyboard 3은 RTS 순서로 적용
    keyboard 4는 RST 순서로 적용
    keyboard 5는 STR 순서로 적용
    keyboard 6은 SRT 순서로 적용
    keyboard 7은 원래 위치로 돌아옴
---------------------------------------------------------------------------*/
import { resizeAspectRatio, setupText, updateText, Axes } from '../util/util.js';
import { Shader, readShaderFile } from '../util/shader.js';

let isInitialized = false;
const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
let shader;
let vao_sun, vao_earth, vao_moon;
let axes;
let finalTransform;
let rotationAngle = 0;
let currentTransformType = null;
let isAnimating = false;
let lastTime = 0;
let textOverlay; 
let sunMatrix, earthMatrix, moonMatrix;
let sunRotation = 0;
let earthRotation = 0;
let earthRevolution = 0;
let moonRotation = 0;
let moonRevolution = 0;

document.addEventListener('DOMContentLoaded', () => {
    if (isInitialized) {
        console.log("Already initialized");
        return;
    }

    main().then(success => {
        if (!success) {
            console.log('프로그램을 종료합니다.');
            return;
        }
        isInitialized = true;
        requestAnimationFrame(animate);
    }).catch(error => {
        console.error('프로그램 실행 중 오류 발생:', error);
    });
});

function initWebGL() {
    if (!gl) {
        console.error('WebGL 2 is not supported by your browser.');
        return false;
    }

    canvas.width = 700;
    canvas.height = 700;
    resizeAspectRatio(gl, canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.2, 0.3, 0.4, 1.0);
    
    return true;
}

function setupSunBuffers() {
    const cubeVertices = new Float32Array([
        -0.5,  0.5, 0.0,  // 좌상단
        -0.5, -0.5, 0.0,// 좌하단
         0.5, -0.5, 0.0, // 우하단
         0.5,  0.5,  0.0 // 우상단
    ]);

    const indices = new Uint16Array([
        0, 1, 2,    // 첫 번째 삼각형
        0, 2, 3     // 두 번째 삼각형
    ]);

    const cubeColors = new Float32Array([
        1.0, 0.0, 0.0, 1.0,  // 빨간색
        1.0, 0.0, 0.0, 1.0,
        1.0, 0.0, 0.0, 1.0,
        1.0, 0.0, 0.0, 1.0
    ]);

    vao_sun = gl.createVertexArray();
    gl.bindVertexArray(vao_sun);

    // VBO for position
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cubeVertices, gl.STATIC_DRAW);
    shader.setAttribPointer("a_position", 3, gl.FLOAT, false, 0, 0);

    // VBO for color
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cubeColors, gl.STATIC_DRAW);
    shader.setAttribPointer("a_color", 4, gl.FLOAT, false, 0, 0);

    // EBO
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    gl.bindVertexArray(null);
}

function setupEarthBuffers() {
    const cubeVertices = new Float32Array([
        -0.5,  0.5, 0.0,  // 좌상단
        -0.5, -0.5, 0.0,// 좌하단
         0.5, -0.5, 0.0, // 우하단
         0.5,  0.5,  0.0 // 우상단
    ]);

    const indices = new Uint16Array([
        0, 1, 2,    // 첫 번째 삼각형
        0, 2, 3     // 두 번째 삼각형
    ]);

    const cubeColors = new Float32Array([
        0.0, 1.0, 1.0, 1.0,  // 빨간색
        0.0, 1.0, 1.0, 1.0,
        0.0, 1.0, 1.0, 1.0,
        0.0, 1.0, 1.0, 1.0,
    ]);

    vao_earth = gl.createVertexArray();
    gl.bindVertexArray(vao_earth);

    // VBO for position
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cubeVertices, gl.STATIC_DRAW);
    shader.setAttribPointer("a_position", 3, gl.FLOAT, false, 0, 0);

    // VBO for color
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cubeColors, gl.STATIC_DRAW);
    shader.setAttribPointer("a_color", 4, gl.FLOAT, false, 0, 0);

    // EBO
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    gl.bindVertexArray(null);
}

function setupMoonBuffers() {
    const cubeVertices = new Float32Array([
        -0.5,  0.5, 0.0,  // 좌상단
        -0.5, -0.5, 0.0,// 좌하단
         0.5, -0.5, 0.0, // 우하단
         0.5,  0.5,  0.0 // 우상단
    ]);

    const indices = new Uint16Array([
        0, 1, 2,    // 첫 번째 삼각형
        0, 2, 3     // 두 번째 삼각형
    ]);

    const cubeColors = new Float32Array([
        1.0, 1.0, 0.0, 1.0,  // 빨간색
        1.0, 1.0, 0.0, 1.0,
        1.0, 1.0, 0.0, 1.0,
        1.0, 1.0, 0.0, 1.0,
    ]);

    vao_moon = gl.createVertexArray();
    gl.bindVertexArray(vao_moon);

    // VBO for position
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cubeVertices, gl.STATIC_DRAW);
    shader.setAttribPointer("a_position", 3, gl.FLOAT, false, 0, 0);

    // VBO for color
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cubeColors, gl.STATIC_DRAW);
    shader.setAttribPointer("a_color", 4, gl.FLOAT, false, 0, 0);

    // EBO
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    gl.bindVertexArray(null);
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    // draw axes
    axes.draw(mat4.create(), mat4.create()); 

    // draw cube
    shader.use();
    // Sun
    shader.setMat4("u_transform", sunMatrix);
    gl.bindVertexArray(vao_sun);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

    // Earth
    shader.setMat4("u_transform", earthMatrix);
    gl.bindVertexArray(vao_earth);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

    // Moon
    shader.setMat4("u_transform", moonMatrix);
    gl.bindVertexArray(vao_moon);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
}

function animate(currentTime) {

    if (!lastTime) lastTime = currentTime; // if lastTime == 0
    // 이전 frame에서부터의 elapsed time (in seconds)
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    sunRotation += deltaTime * Math.PI / 4;     // 45°/s
    earthRotation += deltaTime * Math.PI;       // 180°/s
    earthRevolution += deltaTime * Math.PI / 6; // 30°/s
    moonRotation += deltaTime * Math.PI;        // 180°/s
    moonRevolution += deltaTime * 2 * Math.PI;  // 360°/s

    // Sun: 자전 + 스케일
    sunMatrix = mat4.create();
    mat4.rotate(sunMatrix, sunMatrix, sunRotation, [0, 0, 1]);
    mat4.scale(sunMatrix, sunMatrix, [0.2, 0.2, 1]);

    // 지구 공전 + 위치 (자전은 뺌 → Moon 기준)
    const earthOrbitMatrix = mat4.create();
    mat4.rotate(earthOrbitMatrix, earthOrbitMatrix, earthRevolution, [0, 0, 1]);
    mat4.translate(earthOrbitMatrix, earthOrbitMatrix, [0.7, 0, 0]);

    // 지구 자전 + 크기 (이건 Earth 본체에만 사용)
    earthMatrix = mat4.clone(earthOrbitMatrix); // 복사
    mat4.rotate(earthMatrix, earthMatrix, earthRotation, [0, 0, 1]);
    mat4.scale(earthMatrix, earthMatrix, [0.1, 0.1, 1]);  // Earth 크기

    // Moon은 earthOrbitMatrix만 기준으로 해야 함!
    const moonLocal = mat4.create();
    mat4.rotate(moonLocal, moonLocal, moonRevolution, [0, 0, 1]); // 공전
    mat4.translate(moonLocal, moonLocal, [0.2, 0, 0]);            // 공전 거리 (보정)
    mat4.rotate(moonLocal, moonLocal, moonRotation, [0, 0, 1]);   // 자전
    mat4.scale(moonLocal, moonLocal, [0.05, 0.05, 1]);              // Moon 크기 (보정)

    // 지구 공전 위치 기준으로 Moon 위치 정함
    moonMatrix = mat4.create();
    mat4.multiply(moonMatrix, earthOrbitMatrix, moonLocal);

    render();

    requestAnimationFrame(animate);
}

async function initShader() {
    const vertexShaderSource = await readShaderFile('shVert.glsl');
    const fragmentShaderSource = await readShaderFile('shFrag.glsl');
    shader = new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

async function main() {
    try {
        if (!initWebGL()) {
            throw new Error('WebGL 초기화 실패');
        }

        
        await initShader();

        setupSunBuffers();
        setupEarthBuffers();
        setupMoonBuffers();
        axes = new Axes(gl, 0.8); 


        return true;
    } catch (error) {
        console.error('Failed to initialize program:', error);
        alert('프로그램 초기화에 실패했습니다.');
        return false;
    }
}
