/*-------------------------------------------------------------------------
07_LineSegments.js

left mouse button을 click하면 선분을 그리기 시작하고, 
button up을 하지 않은 상태로 마우스를 움직이면 임시 선분을 그리고, 
button up을 하면 최종 선분을 저장하고 임시 선분을 삭제함.

임시 선분의 color는 회색이고, 최종 선분의 color는 빨간색임.

이 과정을 반복하여 여러 개의 선분 (line segment)을 그릴 수 있음. 
---------------------------------------------------------------------------*/
import { resizeAspectRatio, setupText, updateText, Axes } from '../util/util.js';
import { Shader, readShaderFile } from '../util/shader.js';

// Global variables
const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
let isInitialized = false;  // main이 실행되는 순간 true로 change
let shader;
let vao;
let positionBuffer; // 2D position을 위한 VBO (Vertex Buffer Object)
let isDrawing = false; // mouse button을 누르고 있는 동안 true로 change
let startPoint = null;  // mouse button을 누른 위치
let tempEndPoint = null; // mouse를 움직이는 동안의 위치
let lines = []; // 그려진 선분들을 저장하는 array
let textOverlay; // 1st line segment 정보 표시
let textOverlay2; // 2nd line segment 정보 표시
let textOverlay3;
let axes = new Axes(gl, 0.85); // x, y axes 그려주는 object (see util.js)

// DOMContentLoaded event
// 1) 모든 HTML 문서가 완전히 load되고 parsing된 후 발생
// 2) 모든 resource (images, css, js 등) 가 완전히 load된 후 발생
// 3) 모든 DOM 요소가 생성된 후 발생
// DOM: Document Object Model로 HTML의 tree 구조로 표현되는 object model 
// 모든 code를 이 listener 안에 넣는 것은 mouse click event를 원활하게 처리하기 위해서임
// mouse input을 사용할 때 이와 같이 main을 call 한다. 

document.addEventListener('DOMContentLoaded', () => {
    if (isInitialized) { // true인 경우는 main이 이미 실행되었다는 뜻이므로 다시 실행하지 않음
        console.log("Already initialized");
        return;
    }

    main().then(success => { // call main function
        if (!success) {
            console.log('프로그램을 종료합니다.');
            return;
        }
        isInitialized = true;
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
    gl.clearColor(0.1, 0.2, 0.3, 1.0);

    return true;
}

function setupBuffers() {
    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    shader.setAttribPointer('a_position', 2, gl.FLOAT, false, 0, 0); // x, y 2D 좌표

    gl.bindVertexArray(null);
}

// 좌표 변환 함수: 캔버스 좌표를 WebGL 좌표로 변환
// 캔버스 좌표: 캔버스 좌측 상단이 (0, 0), 우측 하단이 (canvas.width, canvas.height)
// WebGL 좌표 (NDC): 캔버스 좌측 하단이 (-1, -1), 우측 상단이 (1, 1)
function convertToWebGLCoordinates(x, y) {
    return [
        (x / canvas.width) * 2 - 1,  // x/canvas.width 는 0 ~ 1 사이의 값, 이것을 * 2 - 1 하면 -1 ~ 1 사이의 값
        -((y / canvas.height) * 2 - 1) // y canvas 좌표는 상하를 뒤집어 주어야 하므로 -1을 곱함
    ];
}

/* 
    browser window
    +----------------------------------------+
    | toolbar, address bar, etc.             |
    +----------------------------------------+
    | browser viewport (컨텐츠 표시 영역)       | 
    | +------------------------------------+ |
    | |                                    | |
    | |    canvas                          | |
    | |    +----------------+              | |
    | |    |                |              | |
    | |    |      *         |              | |
    | |    |                |              | |
    | |    +----------------+              | |
    | |                                    | |
    | +------------------------------------+ |
    +----------------------------------------+

    *: mouse click position

    event.clientX = browser viewport 왼쪽 경계에서 마우스 클릭 위치까지의 거리
    event.clientY = browser viewport 상단 경계에서 마우스 클릭 위치까지의 거리
    rect.left = browser viewport 왼쪽 경계에서 canvas 왼쪽 경계까지의 거리
    rect.top = browser viewport 상단 경계에서 canvas 상단 경계까지의 거리

    x = event.clientX - rect.left  // canvas 내에서의 클릭 x 좌표
    y = event.clientY - rect.top   // canvas 내에서의 클릭 y 좌표
*/

function setupMouseEvents() {
    function handleMouseDown(event) {
        event.preventDefault(); // 이미 존재할 수 있는 기본 동작을 방지
        event.stopPropagation(); // event가 상위 요소 (div, body, html 등)으로 전파되지 않도록 방지

        const rect = canvas.getBoundingClientRect(); // canvas를 나타내는 rect 객체를 반환
        const x = event.clientX - rect.left;  // canvas 내 x 좌표
        const y = event.clientY - rect.top;   // canvas 내 y 좌표

        if (!isDrawing && lines.length < 2) {
            // 1번 또는 2번 선분을 그리고 있는 도중이 아닌 경우 (즉, mouse down 상태가 아닌 경우)
            // 캔버스 좌표를 WebGL 좌표로 변환하여 선분의 시작점을 설정
            let [glX, glY] = convertToWebGLCoordinates(x, y);
            startPoint = [glX, glY];
            isDrawing = true; // 이제 mouse button을 놓을 때까지 계속 true로 둠. 즉, mouse down 상태가 됨
        }
    }

    function handleMouseMove(event) {
        if (isDrawing) { // 1번 또는 2번 선분을 그리고 있는 도중인 경우
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            let [glX, glY] = convertToWebGLCoordinates(x, y);
            tempEndPoint = [glX, glY]; // 임시 선분의 끝 point
            render();
        }
    }

    function handleMouseUp() {
        if (isDrawing && tempEndPoint) {

            // lines.push([...startPoint, ...tempEndPoint])
            //   : startPoint와 tempEndPoint를 펼쳐서 하나의 array로 합친 후 lines에 추가
            // ex) lines = [] 이고 startPoint = [1, 2], tempEndPoint = [3, 4] 이면,
            //     lines = [[1, 2, 3, 4]] 이 됨
            // ex) lines = [[1, 2, 3, 4]] 이고 startPoint = [5, 6], tempEndPoint = [7, 8] 이면,
            //     lines = [[1, 2, 3, 4], [5, 6, 7, 8]] 이 됨

            lines.push([...startPoint, ...tempEndPoint]);

            if (lines.length == 1) {
                updateText(textOverlay, "Circle: center (" + lines[0][0].toFixed(2) + ", " + lines[0][1].toFixed(2) +
                    ") radius = " + (Math.sqrt(Math.pow(lines[0][2] - lines[0][0], 2) + Math.pow(lines[0][3] - lines[0][1], 2))).toFixed(2));
            }
            else { // lines.length == 2
                updateText(textOverlay2, "Line segment: (" + lines[1][0].toFixed(2) + ", " + lines[1][1].toFixed(2) +
                    ") ~ (" + lines[1][2].toFixed(2) + ", " + lines[1][3].toFixed(2) + ")");
            }

            isDrawing = false;
            startPoint = null;
            tempEndPoint = null;
            render();
        }
    }

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    shader.use();

    // 저장된 선들 그리기
    let num = 0;
    for (let line of lines) {
        if (num == 0) { // 첫 번째 선분인 경우, yellow
            shader.setVec4("u_color", [1.0, 1.0, 0.0, 1.0]);
            drawCircle(line[0], line[1], Math.sqrt(Math.pow(line[2] - line[0], 2) + Math.pow(line[3] - line[1], 2)), 1000);
            num = 1;
        }
        else { // num == 1 (2번째 선분인 경우), red
            shader.setVec4("u_color", [1.0, 0.0, 0.0, 1.0]);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(line), gl.STATIC_DRAW);
            gl.bindVertexArray(vao);
            gl.drawArrays(gl.LINES, 0, 2);
            num = 2;
        }

    }
    if (num == 2) {
        solveEquation(lines[0][0], lines[0][1], Math.sqrt(Math.pow(lines[0][2] - lines[0][0], 2) + Math.pow(lines[0][3] - lines[0][1], 2)), lines[1][0], lines[1][1], lines[1][2], lines[1][3]);
    }
    // 임시 선 그리기
    if (isDrawing && startPoint && tempEndPoint) {
        shader.setVec4("u_color", [0.5, 0.5, 0.5, 1.0]); // 임시 선분의 color는 회색
        if (lines.length == 0) { // 아직 아무 선분도 저장되지 않은 경우 (즉, 첫 번째 원을 그릴 차례)
            let dx = tempEndPoint[0] - startPoint[0];
            let dy = tempEndPoint[1] - startPoint[1];
            let radius = Math.sqrt(dx * dx + dy * dy);
            drawCircle(startPoint[0], startPoint[1], radius, 1000);
        } else {
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([...startPoint, ...tempEndPoint]),
                gl.STATIC_DRAW);
            gl.bindVertexArray(vao);
            gl.drawArrays(gl.LINES, 0, 2);
        }
    }

    // axes 그리기
    axes.draw(mat4.create(), mat4.create()); // 두 개의 identity matrix를 parameter로 전달
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
            return false;
        }

        // 셰이더 초기화
        await initShader();

        // 나머지 초기화
        setupBuffers();
        shader.use();

        // 텍스트 초기화
        textOverlay = setupText(canvas, "", 1);
        textOverlay2 = setupText(canvas, "", 2);
        textOverlay3 = setupText(canvas, "", 3);
        // 마우스 이벤트 설정
        setupMouseEvents();

        // 초기 렌더링
        render();

        return true;

    } catch (error) {
        console.error('Failed to initialize program:', error);
        alert('프로그램 초기화에 실패했습니다.');
        return false;
    }
}

function drawCircle(x, y, r, p) {
    let seta = 2 * Math.PI / p;
    for (let i = 0; i < p; i++) {
        let line = [r * Math.cos(i * seta) + x, r * Math.sin(i * seta) + y, r * Math.cos((i + 1) * seta) + x, r * Math.sin((i + 1) * seta) + y];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(line), gl.STATIC_DRAW);
        gl.bindVertexArray(vao);
        gl.drawArrays(gl.LINES, 0, 2);
    }

}

function solveEquation(x1, y1, r, x2, y2, x3, y3) {
    let dx = x3 - x2;
    let dy = y3 - y2;
    let fx = x2 - x1;
    let fy = y2 - y1;

    let a = dx * dx + dy * dy;
    let b = 2 * (fx * dx + fy * dy);
    let c = fx * fx + fy * fy - r * r;

    let discriminant = b * b - 4 * a * c;
    let points = [];

    if (discriminant < 0) {
        updateText(textOverlay3, "No intersection");
    } else if (discriminant === 0) {
        let t = -b / (2 * a);
        if (t >= 0 && t <= 1) {
            let ix = x2 + t * dx;
            let iy = y2 + t * dy;
            points.push([ix, iy]);
        }
    } else {
        let sqrtD = Math.sqrt(discriminant);
        let t1 = (-b - sqrtD) / (2 * a);
        let t2 = (-b + sqrtD) / (2 * a);

        if (t1 >= 0 && t1 <= 1) {
            let ix1 = x2 + t1 * dx;
            let iy1 = y2 + t1 * dy;
            points.push([ix1, iy1]);
        }
        if (t2 >= 0 && t2 <= 1) {
            let ix2 = x2 + t2 * dx;
            let iy2 = y2 + t2 * dy;
            points.push([ix2, iy2]);
        }
    }

    const intersectionNum = points.length;

    if (intersectionNum == 0) {
        updateText(textOverlay3, "No intersection");
    }
    else if (intersectionNum == 1) {
        updateText(textOverlay3, "Intersection Points: 1 Point 1: (" + points[0][0].toFixed(2) + "," + points[0][1].toFixed(2) + ")");
    }
    else {
        updateText(textOverlay3, "Intersection Points: 2 Point 1: (" + points[0][0].toFixed(2) + "," + points[0][1].toFixed(2) + ") Point 2: (" + points[1][0].toFixed(2) + "," + points[1][1].toFixed(2) + ")");
    }

    shader.setVec4("u_color", [0.0, 1.0, 0.0, 1.0]);
    for (let p of points) {
        drawPoint(p[0], p[1]);
    }
}

function drawPoint(x, y) {
    const pointBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([x, y]), gl.STATIC_DRAW);

    gl.bindVertexArray(vao);
    shader.setAttribPointer('a_position', 2, gl.FLOAT, false, 0, 0);
    gl.enable(gl.VERTEX_PROGRAM_POINT_SIZE);
    gl.drawArrays(gl.POINTS, 0, 1);
}

