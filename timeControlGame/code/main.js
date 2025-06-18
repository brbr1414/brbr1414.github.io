// 기본 변수들
let scene, camera, renderer;
let bridge, player;
let timeScale = 1.0; // sets the speed of the time
let gameTime = 0;
let moveSpeed = 0.05;
let playerHeight = 1.7; // 플레이어의 눈 높이
let composer; // 후처리 효과를 위한 변수
let isDead = false; // 죽음 상태 체크

// 점프 관련 변수
let velocity = 0;
let gravity = 0.01;
let jumpForce = 0.17;
let isGrounded = false;
let groundY = 0.2; // 바닥에서의 높이
/*
    오브젝트 관련 변수들
*/

// 플랫폼 관련 값들
const PLATFORM_WIDTH_Z = 30; // 플랫폼의 Z축 너비
const PLATFORM_WIDTH_X = 10; // 플랫폼의 X축 너비   
const PLATFORM_HEIGHT_Y = 100; // 플랫폼의 높이

// 다리 관련 변수
const BRIDGE_SIZE = 1.5; // 다리의 크기

// 첫 번째 다리 관련 값들
const BRIDGE_START_X = 8 - PLATFORM_WIDTH_X / 2 - BRIDGE_SIZE / 2; // 시작 위치 (오른쪽 플랫폼의 끝)
const BRIDGE_END_X = -8 + PLATFORM_WIDTH_X / 2 + BRIDGE_SIZE / 2; // 도착 위치 (왼쪽 플랫폼의 끝)
const BRIDGE_START_Y = -1; // 시작 높이를 포탈과 같은 높이로 설정
const BRIDGE_END_Y = -1; // 최종 높이 (바닥)
let bridgeVisible = true;
let bridgeState = 'bridgeMovingXaxis'; // 'moving', 'rising', 'stopped'
// bridge2To3 관련 변수
let bridge2To3Time = 0;
const bridge2To3StartX = 24 - PLATFORM_WIDTH_X / 2 - BRIDGE_SIZE / 2;
const bridge2To3EndX = 8 + PLATFORM_WIDTH_X / 2 + BRIDGE_SIZE / 2;
const bridge2To3Y = -1;
const bridge2To3Speed = 1.0; // 주기 속도 조절
// bridge3To4 관련 변수
let bridge3To4Time = 0;
const bridge3To4StartX = 40 - PLATFORM_WIDTH_X / 2 - BRIDGE_SIZE / 2;
const bridge3To4EndX = 24 + PLATFORM_WIDTH_X / 2 + BRIDGE_SIZE / 2;
const bridge3To4Y = -1;
const bridge3To4Speed = 0.05; // 주기 속도 조정

// 벽 관련 상수
const WALL_HEIGHT = 200;
const WALL_WIDTH = 1;
const WALL_DEPTH = 100;
const CEILING_HEIGHT = 20; // 천장 높이
const wall_Y = 0;

const backWall_X = -8 - PLATFORM_WIDTH_X / 2;
const backWall_Z = 0;

const leftRightWall_X = 8;
const leftWall_Z = PLATFORM_WIDTH_Z / 2;
const rightWall_Z = -PLATFORM_WIDTH_Z / 2;

let frontWall;
const frontWall_X = 40 + PLATFORM_WIDTH_X / 2;
const frontWall_Z = 0;

// 용암 관련 변수
const LAVA_WIDTH = 100;
const LAVA_DEPTH = 100;
let lava;
let lavaLight;

// 목적지 관련 변수
let goal;
let isGameComplete = false;

// 시점 관련 변수
let euler = new THREE.Euler(0, 0, 0, 'YXZ');

// 시간 제어 관련 변수
let isTimePaused = false;
let lastTimeScale = 1.0;
let moveMentDirection = 1.0; // sets the direction of the movement of the bridge depending on Reversed time

// ir포탈 관련 변수
let portalParticles = [];
const PORTAL_PARTICLE_COUNT = 50;
const PORTAL_HEIGHT = 4;
const PORTAL_RADIUS = 1.5;

// 시간 상태 UI 관련 변수
let timeStatusUI;

// 게임 상태 변수들
let isTimeReversed = false;
let bridgeStartTime = Date.now();
let keys = {}; // 키보드 상태를 저장할 객체

// 플레이어 관련 변수 추가
let leftHand, rightHand;
let handSwingAngle = 0;
let handSwingSpeed = 0.2;
let handSwingAmount = 0.5;
// 오디오 관련 변수
let backgroundMusic;
let audioStartTime = 7; // 시작 시간 (초)
let walkingSound;
let gunshotSound;
let slowMotionSound;
let fastTimeSound;
let isWalking = false;
let lastStepTime = 0;
const stepInterval = 500; // 발소리 간격 (밀리초)

let bridge2To3; // 전역 변수로 선언
let bridge3To4; // 전역 변수로 선언

// 로봇 관련 변수
let robot;
let bullets = [];
const BULLET_SPEED = 0.5;
const BULLET_LIFETIME = 2000; // 총알이 2초 동안만 존재
const ROBOT_SHOOT_INTERVAL = 2000; // 2초마다 발사
let lastShootTime = 0;
let isRobotFalling = false;
let robotFallAngle = 0;
const ROBOT_FALL_SPEED = 0.05;

// 플레이어 총관련 값들
let playerBullets = [];

// 초기화 함수
function init() {
    // 씬 설정
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);

    // 카메라 설정 (1인칭 시점)
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(-8, playerHeight + groundY, 0);

    // 초기 시점 설정 (+x 방향)
    euler = new THREE.Euler(0, 0, 0, 'YXZ');
    camera.quaternion.setFromEuler(euler);

    // 렌더러 설정
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    document.body.appendChild(renderer.domElement);

    // 후처리 효과 설정
    composer = new THREE.EffectComposer(renderer);
    const renderPass = new THREE.RenderPass(scene, camera);
    composer.addPass(renderPass);

    // 빨간색 효과를 위한 셰이더 패스
    const redEffect = {
        uniforms: {
            "tDiffuse": { value: null },
            "redIntensity": { value: 0.0 }
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform sampler2D tDiffuse;
            uniform float redIntensity;
            varying vec2 vUv;
            void main() {
                vec4 color = texture2D(tDiffuse, vUv);
                // 빨간색 채널을 더 강하게 증가
                color.r = min(1.0, color.r + redIntensity * 2.0);
                // 녹색과 파란색 채널을 약간 감소
                color.g = max(0.0, color.g - redIntensity * 0.5);
                color.b = max(0.0, color.b - redIntensity * 0.5);
                gl_FragColor = color;
            }
        `
    };

    const redPass = new THREE.ShaderPass(redEffect);
    redPass.renderToScreen = true;
    composer.addPass(redPass);

    // 조명 설정
    scene.add(new THREE.AmbientLight(0x404040, 1.0)); // 주변광 강도 증가

    // 스포트라이트 추가
    const spotLight1 = new THREE.SpotLight(0x808080, 0.6);
    spotLight1.position.set(8, 19, 0);
    spotLight1.angle = Math.PI / 4;
    spotLight1.penumbra = 0.1;
    spotLight1.decay = 2;
    spotLight1.distance = 50;
    spotLight1.castShadow = true;
    spotLight1.shadow.mapSize.width = 1024;
    spotLight1.shadow.mapSize.height = 1024;
    spotLight1.target.position.set(8, 0, 0); // 빛이 아래를 향하도록 설정
    scene.add(spotLight1.target);
    scene.add(spotLight1);

    const spotLight2 = new THREE.SpotLight(0x808080, 0.6);
    spotLight2.position.set(24, 19, 0);
    spotLight2.angle = Math.PI / 4;
    spotLight2.penumbra = 0.1;
    spotLight2.decay = 2;
    spotLight2.distance = 50;
    spotLight2.castShadow = true;
    spotLight2.shadow.mapSize.width = 1024;
    spotLight2.shadow.mapSize.height = 1024;
    spotLight2.target.position.set(24, 0, 0); // 빛이 아래를 향하도록 설정
    scene.add(spotLight2.target);
    scene.add(spotLight2);

    const spotLight3 = new THREE.SpotLight(0x808080, 0.6);
    spotLight3.position.set(40, 19, 0);
    spotLight3.angle = Math.PI / 4;
    spotLight3.penumbra = 0.1;
    spotLight3.decay = 2;
    spotLight3.distance = 50;
    spotLight3.castShadow = true;
    spotLight3.shadow.mapSize.width = 1024;
    spotLight3.shadow.mapSize.height = 1024;
    spotLight3.target.position.set(40, 0, 0); // 빛이 아래를 향하도록 설정
    scene.add(spotLight3.target);
    scene.add(spotLight3);

    // 전구 추가
    const lightBulb1 = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.5, 0.5),
        new THREE.MeshStandardMaterial({
            color: 0x808080,
            emissive: 0x808080,
            emissiveIntensity: 0.5
        })
    );
    lightBulb1.position.set(8, 19, 0);
    scene.add(lightBulb1);

    const lightBulb2 = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.5, 0.5),
        new THREE.MeshStandardMaterial({
            color: 0x808080,
            emissive: 0x808080,
            emissiveIntensity: 0.5
        })
    );
    lightBulb2.position.set(24, 19, 0);
    scene.add(lightBulb2);

    const lightBulb3 = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.5, 0.5),
        new THREE.MeshStandardMaterial({
            color: 0x808080,
            emissive: 0x808080,
            emissiveIntensity: 0.5
        })
    );
    lightBulb3.position.set(40, 19, 0);
    scene.add(lightBulb3);

    // 포인트라이트 추가
    const pointLight = new THREE.PointLight(0x4a6b8a, 0.8); // 강도 증가
    pointLight.position.set(8, 40, 0);
    pointLight.distance = 100;
    pointLight.decay = 2;
    pointLight.castShadow = true;
    scene.add(pointLight);

    // 두 번째 포인트라이트 추가
    const pointLight2 = new THREE.PointLight(0x4a6b8a, 0.8); // 강도 증가
    pointLight2.position.set(-8, 20, 0);
    pointLight2.distance = 100;
    pointLight2.decay = 2;
    pointLight2.castShadow = true;
    scene.add(pointLight2);

    // 세 번째 포인트라이트 추가
    const pointLight3 = new THREE.PointLight(0x4a6b8a, 0.8); // 강도 증가
    pointLight3.position.set(-8, 20, 0);
    pointLight3.distance = 100;
    pointLight3.decay = 2;
    pointLight3.castShadow = true;
    scene.add(pointLight3);

    // 텍스처 로더 생성
    const textureLoader = new THREE.TextureLoader();
    const floorTexture = textureLoader.load('src/texture/floor.png');
    const bridgeTexture = textureLoader.load('src/texture/bridge.png');
    const wallTexture = textureLoader.load('src/texture/wall.png');
    const lavaTexture = textureLoader.load('src/texture/lava.jpg');

    // 텍스처 반복 설정
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(10, 40);

    bridgeTexture.wrapS = THREE.RepeatWrapping;
    bridgeTexture.wrapT = THREE.RepeatWrapping;
    bridgeTexture.repeat.set(1, 1);

    wallTexture.wrapS = THREE.RepeatWrapping;
    wallTexture.wrapT = THREE.RepeatWrapping;
    wallTexture.repeat.set(40, 80);

    lavaTexture.wrapS = THREE.RepeatWrapping;
    lavaTexture.wrapT = THREE.RepeatWrapping;
    lavaTexture.repeat.set(4, 4);

    // 첫 번째 플랫폼
    const startPlatformGeometry = new THREE.BoxGeometry(PLATFORM_WIDTH_X, PLATFORM_HEIGHT_Y, PLATFORM_WIDTH_Z); // z축 길이를 20으로 증가
    startPlatformGeometry.attributes.uv2 = startPlatformGeometry.attributes.uv;
    const startPlatformMaterial = new THREE.MeshStandardMaterial({
        map: floorTexture,
        roughness: 0.7,
        metalness: 0.1
    });
    const startPlatform = new THREE.Mesh(startPlatformGeometry, startPlatformMaterial);
    startPlatform.position.set(-8, -1 - PLATFORM_HEIGHT_Y / 2, 0);
    scene.add(startPlatform);

    // 두 번째 플랫폼
    const endPlatformGeometry = new THREE.BoxGeometry(PLATFORM_WIDTH_X, PLATFORM_HEIGHT_Y, PLATFORM_WIDTH_Z); // z축 길이를 20으로 증가
    endPlatformGeometry.attributes.uv2 = endPlatformGeometry.attributes.uv;
    const endPlatformMaterial = new THREE.MeshStandardMaterial({
        map: floorTexture,
        roughness: 0.7,
        metalness: 0.1
    });
    const endPlatform = new THREE.Mesh(endPlatformGeometry, endPlatformMaterial);
    endPlatform.position.set(8, -1 - PLATFORM_HEIGHT_Y / 2, 0);
    scene.add(endPlatform);

    // 세 번째 플랫폼  
    const thirdPlatformGeometry = new THREE.BoxGeometry(PLATFORM_WIDTH_X, PLATFORM_HEIGHT_Y, PLATFORM_WIDTH_Z); // z축 길이를 20으로 증가
    thirdPlatformGeometry.attributes.uv2 = thirdPlatformGeometry.attributes.uv;
    const thirdPlatformMaterial = new THREE.MeshStandardMaterial({
        map: floorTexture,
        roughness: 0.7,
        metalness: 0.1
    });
    const thirdPlatform = new THREE.Mesh(thirdPlatformGeometry, thirdPlatformMaterial);
    thirdPlatform.position.set(24, -1 - PLATFORM_HEIGHT_Y / 2, 0);
    scene.add(thirdPlatform);

    // 네 번째 플랫폼
    const fourthPlatformGeometry = new THREE.BoxGeometry(PLATFORM_WIDTH_X, PLATFORM_HEIGHT_Y, PLATFORM_WIDTH_Z); // z축 길이를 20으로 증가
    fourthPlatformGeometry.attributes.uv2 = fourthPlatformGeometry.attributes.uv;
    const fourthPlatformMaterial = new THREE.MeshStandardMaterial({
        map: floorTexture,
        roughness: 0.7,
        metalness: 0.1
    });
    const fourthPlatform = new THREE.Mesh(fourthPlatformGeometry, fourthPlatformMaterial);
    fourthPlatform.position.set(40, -1 - PLATFORM_HEIGHT_Y / 2, 0);
    scene.add(fourthPlatform);

    // 이동 평면 생성
    const platformGeometry = new THREE.BoxGeometry(BRIDGE_SIZE, 0.2, BRIDGE_SIZE); // z축 길이를 20으로 증가
    platformGeometry.attributes.uv2 = platformGeometry.attributes.uv;
    const platformMaterial = new THREE.MeshStandardMaterial({
        map: bridgeTexture,
        roughness: 0.7,
        metalness: 0.1
    });
    // 다리 1
    bridge = new THREE.Mesh(platformGeometry, platformMaterial);
    bridge.position.set(BRIDGE_START_X, bridge2To3Y, 0);
    scene.add(bridge);
    // 다리 2
    bridge2To3 = new THREE.Mesh(platformGeometry, platformMaterial); // 전역 변수에 할당
    bridge2To3.position.set(bridge2To3StartX, bridge2To3Y, 0);
    scene.add(bridge2To3);

    // 다리 3
    bridge3To4 = new THREE.Mesh(platformGeometry, platformMaterial); // 전역 변수에 할당
    bridge3To4.position.set(bridge3To4StartX, bridge3To4Y, PLATFORM_WIDTH_Z / 2 - 3);
    scene.add(bridge3To4);

    // 목적지 생성
    const portalGeometry = new THREE.CylinderGeometry(PORTAL_RADIUS, PORTAL_RADIUS, PORTAL_HEIGHT, 32);
    const portalMaterial = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 },
            color1: { value: new THREE.Color(0x00ff00) },
            color2: { value: new THREE.Color(0x00ffff) }
        },
        vertexShader: `
            varying vec2 vUv;
            varying float vHeight;
            void main() {
                vUv = uv;
                vHeight = position.y;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float time;
            uniform vec3 color1;
            uniform vec3 color2;
            varying vec2 vUv;
            varying float vHeight;
            void main() {
                float heightFactor = (vHeight + 2.0) / 4.0;
                vec3 color = mix(color1, color2, heightFactor);
                float alpha = 0.7 + 0.3 * sin(time * 2.0 + vUv.x * 10.0);
                gl_FragColor = vec4(color, alpha);
            }
        `,
        transparent: true,
        side: THREE.DoubleSide
    });
    goal = new THREE.Mesh(portalGeometry, portalMaterial);
    goal.position.set(40, 0, 0);
    scene.add(goal);

    // 포탈 파티클 생성
    const particleGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const particleMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        transparent: true,
        opacity: 0.6
    });

    for (let i = 0; i < PORTAL_PARTICLE_COUNT; i++) {
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        resetParticle(particle);
        scene.add(particle);
        portalParticles.push(particle);
    }

    // 시간 상태 UI 생성
    timeStatusUI = document.createElement('div');
    timeStatusUI.style.position = 'fixed';
    timeStatusUI.style.top = '20px';
    timeStatusUI.style.left = '50%';
    timeStatusUI.style.transform = 'translateX(-50%)';
    timeStatusUI.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    timeStatusUI.style.color = 'white';
    timeStatusUI.style.padding = '10px 20px';
    timeStatusUI.style.borderRadius = '5px';
    timeStatusUI.style.fontSize = '18px';
    timeStatusUI.style.fontFamily = 'Arial, sans-serif';
    timeStatusUI.style.zIndex = '1000';
    document.body.appendChild(timeStatusUI);

    // 이벤트 리스너 설정
    window.addEventListener('resize', onWindowResize, false);
    setupControls();
    setupMouseControls();

    // 벽 생성
    const wallGeometry = new THREE.BoxGeometry(WALL_WIDTH, WALL_HEIGHT, WALL_DEPTH);
    const wallMaterial = new THREE.MeshStandardMaterial({
        map: wallTexture,
        roughness: 0.7,
        metalness: 0.2
    });

    const wallYPos = -WALL_HEIGHT / 4;
    // 오른쪽 벽
    const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
    rightWall.position.set(13, wallYPos, -PLATFORM_WIDTH_Z / 2);
    rightWall.rotation.y = Math.PI / 2 + Math.PI;
    scene.add(rightWall);

    // 왼쪽 벽
    const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
    leftWall.position.set(13, wallYPos, PLATFORM_WIDTH_Z / 2);
    leftWall.rotation.y = Math.PI / 2;
    scene.add(leftWall);

    // 뒤쪽 벽 (-x축 방향에 수직)
    const backWall = new THREE.Mesh(wallGeometry, wallMaterial);
    backWall.position.set(-8 - PLATFORM_WIDTH_X / 2, wallYPos, 0);
    backWall.rotation.y = 0;
    scene.add(backWall);

    // +x 방향 벽
    const frontWall = new THREE.Mesh(wallGeometry, wallMaterial);
    frontWall.position.set(frontWall_X, wallYPos, 0);
    frontWall.rotation.y = 0;
    scene.add(frontWall);

    // 천장 생성
    const ceilingGeometry = new THREE.BoxGeometry(LAVA_WIDTH, 1, LAVA_DEPTH);
    const ceilingTexture = new THREE.TextureLoader().load('src/texture/celieng.png');
    ceilingTexture.wrapS = THREE.RepeatWrapping;
    ceilingTexture.wrapT = THREE.RepeatWrapping;
    ceilingTexture.repeat.set(20, 20); // 텍스처 반복 횟수
    const ceilingMaterial = new THREE.MeshStandardMaterial({
        map: ceilingTexture,
        roughness: 0.7,
        metalness: 0.2
    });
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.position.set(0, CEILING_HEIGHT, 0);
    scene.add(ceiling);

    // 용암 효과 추가
    const lavaGeometry = new THREE.BoxGeometry(LAVA_WIDTH, 0.5, LAVA_DEPTH);
    const lavaMaterial = new THREE.MeshStandardMaterial({
        map: lavaTexture,
        emissive: 0x8B0000,
        emissiveIntensity: 0.3,
        roughness: 0.2,
        metalness: 0.9
    });
    lava = new THREE.Mesh(lavaGeometry, lavaMaterial);
    lava.position.set(0, -10, 0);
    scene.add(lava);

    // 용암 조명 추가
    lavaLight = new THREE.PointLight(0x8B0000, 1, 20);
    lavaLight.position.set(0, -9, 0);
    scene.add(lavaLight);

    // 플레이어 생성
    createPlayer();

    // 오디오 리스너 설정
    const listener = new THREE.AudioListener();
    camera.add(listener);

    // 오디오 로더 생성
    const audioLoader = new THREE.AudioLoader();

    // 배경음악 로드
    backgroundMusic = new THREE.Audio(listener);
    audioLoader.load('src/soundeffect/backgroundMachine.mp3', function (buffer) {
        backgroundMusic.setBuffer(buffer);
        backgroundMusic.setVolume(0.5);
        backgroundMusic.setLoop(true);
        backgroundMusic.offset = audioStartTime;
        backgroundMusic.play();
    });

    backgroundMusic2 = new THREE.Audio(listener);
    audioLoader.load('src/soundeffect/backgroundMusic.mp3', function (buffer) {
        backgroundMusic2.setBuffer(buffer);
        backgroundMusic2.setVolume(0.5);
        backgroundMusic2.setLoop(true);
        backgroundMusic2.offset = audioStartTime;
        backgroundMusic2.play();
    });

    // 발소리 로드
    walkingSound = new THREE.Audio(listener);
    audioLoader.load('src/soundeffect/walking.mp3', function (buffer) {
        walkingSound.setBuffer(buffer);
        walkingSound.setVolume(0.5);
        walkingSound.setLoop(true);
    });

    gunshotSound = new THREE.Audio(listener);
    audioLoader.load('src/soundeffect/gunshot.mp3', function (buffer) {
        gunshotSound.setBuffer(buffer);
        gunshotSound.setVolume(0.5);
        gunshotSound.setLoop(false);
    });

    // 슬로우모션 효과음 로드
    slowMotionSound = new THREE.Audio(listener);
    audioLoader.load('src/soundeffect/slowmotion.mp3', function (buffer) {
        slowMotionSound.setBuffer(buffer);
        slowMotionSound.setVolume(0.5);
        slowMotionSound.setLoop(true);
        slowMotionSound.offset = 0.7; // 0.7초부터 시작
        slowMotionSound.duration = 4.3; // 5초까지 재생 (5 - 0.7 = 4.3)
        slowMotionSound.setLoopPoints(0.7, 5.0); // 반복 구간 명시적 설정
    });

    // fasttime 효과음 로드
    fastTimeSound = new THREE.Audio(listener);
    audioLoader.load('src/soundeffect/fasttime.mp3', function (buffer) {
        fastTimeSound.setBuffer(buffer);
        fastTimeSound.setVolume(0.5);
        fastTimeSound.setLoop(true);
        fastTimeSound.offset = 0.5; // 0.5초부터 시작
        fastTimeSound.duration = 1.5; // 2초까지 재생 (2 - 0.5 = 1.5)
        fastTimeSound.setLoopPoints(0.5, 2.0); // 반복 구간 명시적 설정
    });

    createRobot();
}

// 창 크기 조절 처리
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// 마우스 컨트롤 설정
function setupMouseControls() {
    let isPointerLocked = false;

    // 마우스 이동 이벤트 처리
    document.addEventListener('mousemove', (event) => {
        if (!isPointerLocked || isGameComplete) return;

        const movementX = event.movementX || 0;
        const movementY = event.movementY || 0;

        // 좌우 회전 (감도 감소)
        euler.y -= movementX * 0.002;

        // 상하 회전 (감도 감소)
        euler.x -= movementY * 0.002;

        // 상하 회전 제한
        euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, euler.x));

        // 카메라 회전 적용
        camera.quaternion.setFromEuler(euler);
    });

    // 포인터 잠금 상태 변경 이벤트
    document.addEventListener('pointerlockchange', () => {
        isPointerLocked = document.pointerLockElement === document.body;
    });

    // 클릭 시 포인터 잠금
    document.addEventListener('click', () => {
        if (!isPointerLocked) {
            document.body.requestPointerLock();
        }
    });

    // ESC 키로 포인터 잠금 해제 시 처리
    document.addEventListener('keydown', (event) => {
        if (event.code === 'Escape' && isPointerLocked) {
            document.exitPointerLock();
        }
    });
}

// 컨트롤 설정
function setupControls() {
    // 키보드 이벤트
    window.addEventListener('keydown', (e) => {
        keys[e.code] = true;

        switch (e.code) {
            case 'KeyQ': // 시간 흐름 뒤집기
                isTimeReversed = !isTimeReversed;
                if (isTimeReversed) {
                    moveMentDirection = -1.0;
                } else {
                    moveMentDirection = 1.0;
                }
                break;
            case 'KeyT': // 시간 빠르게
                timeScale = Math.max(0, timeScale + 0.05);
                lastTimeScale = Math.max(0, lastTimeScale + 0.05);
                updateSlowMotionSound();
                break;
            case 'KeyF': // 시간 느리게
                timeScale = Math.max(0, timeScale - 0.05);
                lastTimeScale = Math.max(0, lastTimeScale - 0.05);
                updateSlowMotionSound();
                break;
            case 'KeyP': // 시간 멈춤/재개
                if (isTimePaused) {
                    timeScale = lastTimeScale;
                    isTimePaused = false;
                } else {
                    timeScale = 0;
                    isTimePaused = true;
                }
                updateSlowMotionSound();
                break;
            case 'KeyR': // 게임 다시 시작
                const overlay = document.querySelector('.death-overlay');
                const deathMessage = document.querySelector('.death-message');
                if (overlay) document.body.removeChild(overlay);
                if (deathMessage) document.body.removeChild(deathMessage);
                resetGame();
                break;
            case 'KeyG': // 총 발사
                shootPlayerGun();
                break;
        }
        updateTimeStatusUI();
    });

    window.addEventListener('keyup', (e) => {
        keys[e.code] = false;
    });
}

// 시간 상태 UI 업데이트
function updateTimeStatusUI() {
    let statusText = '';
    if (isTimePaused) {
        statusText = `⏸️ 시간 정지 (속도: ${lastTimeScale > 0 ? '▶️' : '◀️'} ${Math.abs(lastTimeScale).toFixed(1)}x)`;
    } else if (!isTimeReversed) {
        statusText = `▶️ 시간 순행 (${timeScale.toFixed(1)}x)`;
    } else if (isTimeReversed) {
        statusText = `◀️ 시간 역행 (${Math.abs(timeScale).toFixed(1)}x)`;
    } else {
        statusText = '⏸️ 시간 정지';
    }
    timeStatusUI.textContent = statusText;
}

// 파티클 리셋 함수
function resetParticle(particle) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * PORTAL_RADIUS;
    particle.position.set(
        40 + Math.cos(angle) * radius,
        Math.random() * PORTAL_HEIGHT - PORTAL_HEIGHT / 2,
        Math.sin(angle) * radius
    );
    particle.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.02,
        Math.random() * 0.02,
        (Math.random() - 0.5) * 0.02
    );
}

// 애니메이션 업데이트
function update() {
    if (isGameComplete) return;

    // 이전 위치 저장 (충돌 발생 시 복원용)
    const prevPosition = camera.position.clone();

    // 시간이 멈춰있지 않을 때만 게임 시간 업데이트
    if (!isTimePaused) {
        gameTime += 0.01 * timeScale;
        updateTimeStatusUI();
    }

    // 슬로우모션 효과음 상태 업데이트
    updateSlowMotionSound();

    // 포탈 셰이더 업데이트
    if (goal.material.uniforms) {
        goal.material.uniforms.time.value = gameTime;
    }

    // 포탈 파티클 업데이트
    portalParticles.forEach(particle => {
        particle.position.add(particle.velocity);
        particle.position.y += Math.sin(gameTime * 2 + particle.position.x) * 0.01;

        if (Math.abs(particle.position.x - BRIDGE_END_X) > PORTAL_RADIUS ||
            Math.abs(particle.position.y) > PORTAL_HEIGHT / 2 ||
            Math.abs(particle.position.z) > PORTAL_RADIUS) {
            resetParticle(particle);
        }
    });

    // 이동 평면 애니메이션
    if (bridgeVisible) {
        if (isTimeReversed) { // 시간 역행시 bridge의 움직임
            if (bridgeState === 'bridgeMovingXaxis') {
                bridge.position.x -= 0.05 * timeScale * moveMentDirection;
                bridge.position.y = BRIDGE_START_Y;

                if (bridge.position.x >= BRIDGE_START_X) {
                    bridge.position.x = BRIDGE_START_X;
                    bridgeState = 'stopped';
                }
            }
            else if (bridgeState === 'bridgeMovingYaxis') {
                bridge.position.y -= 0.05 * timeScale * moveMentDirection;
                bridge.position.x = BRIDGE_END_X;

                if (bridge.position.y >= BRIDGE_START_Y) {
                    bridge.position.y = BRIDGE_START_Y;
                    bridgeState = 'bridgeMovingXaxis';
                }
            }
        }
        else { // 시간 순행시 bridge의 움직임
            if (bridgeState === 'stopped') {
                bridgeState = 'bridgeMovingXaxis';
            }
            if (bridgeState === 'bridgeMovingXaxis') {
                // x축 방향으로 이동 (시간 제어 적용)
                bridge.position.x -= 0.05 * timeScale * moveMentDirection;
                bridge.position.y = BRIDGE_START_Y;

                // 평면이 시작 플랫폼의 끝에 닿으면 떨어지기 시작
                if (bridge.position.x <= BRIDGE_END_X) {
                    bridge.position.x = BRIDGE_END_X; // 정확한 위치로 조정
                    bridgeState = 'bridgeMovingYaxis';
                }
            } else if (bridgeState === 'bridgeMovingYaxis') {
                // y축 방향으로 떨어지기 (시간 제어 적용)
                bridge.position.y -= 0.1 * timeScale * moveMentDirection;

                // 바닥에 닿으면 사라짐
                if (bridge.position.y <= -10) {
                    bridgeState = 'disappear';
                    bridgeVisible = false;
                    bridge.visible = false;
                }
            }
        }
    } else {
        if (Math.sin(gameTime) < -0.9) { // 평면이 사라진 후 일정 시간이 지나면 다시 나타남
            bridgeVisible = true;
            bridgeState = 'bridgeMovingXaxis';
            bridge.visible = true;
            bridge.position.set(BRIDGE_START_X, BRIDGE_START_Y, 0);
        }
    }
    // bridge2To3 움직임 업데이트
    bridge2To3Time += bridge2To3Speed * timeScale;
    const bridge2To3Range = (bridge2To3StartX - bridge2To3EndX) / 2;
    const bridge2To3Center = (bridge2To3StartX + bridge2To3EndX) / 2;
    bridge2To3.position.x = bridge2To3Center + Math.sin(bridge2To3Time) * bridge2To3Range;

    // bridge3To4 움직임 업데이트
    bridge3To4Time += bridge3To4Speed * timeScale;
    const bridge3To4Range = (bridge3To4StartX - bridge3To4EndX) / 2;
    const bridge3To4Center = (bridge3To4StartX + bridge3To4EndX) / 2;
    bridge3To4.position.x = bridge3To4Center + Math.sin(bridge3To4Time) * bridge3To4Range;

    // 다리의 현재 속도 계산
    const bridgeVelocity = bridgeState === 'bridgeMovingXaxis' ? -0.05 * timeScale * moveMentDirection : 0;
    const bridge2To3Velocity = Math.cos(bridge2To3Time) * bridge2To3Speed * timeScale * bridge2To3Range;
    const bridge3To4Velocity = Math.cos(bridge3To4Time) * bridge3To4Speed * timeScale * bridge3To4Range;
    // 플레이어가 플랫폼이나 다리 위에 있는지 확인
    const isOnPlatform = isPlayerOnPlatform();
    const isOnBridge = isPlayerOnBridge();
    const isOnBridge2To3 = isPlayerOnBridge2To3();
    const isOnBridge3To4 = isPlayerOnBridge3To4();
    isGrounded = isOnPlatform || isOnBridge || isOnBridge2To3 || isOnBridge3To4;

    // 다리 위에 있을 때 다리의 속도만큼 플레이어의 위치를 변경
    if (isOnBridge) {
        camera.position.x += bridgeVelocity;
    }
    if (isOnBridge2To3) {
        camera.position.x += bridge2To3Velocity;
    }
    if (isOnBridge3To4) {
        camera.position.x += bridge3To4Velocity;
    }

    // 점프 처리
    if (keys['Space'] && isGrounded) {
        velocity = jumpForce * 1.0;
        isGrounded = false;
    }

    // 중력 적용
    if (!isGrounded) {
        velocity -= gravity * 1.0;
        camera.position.y += velocity;

        if (camera.position.y < -10) {
            showDeathEffect();
            return;
        }
    } else {
        velocity = 0;
    }

    // 플레이어 이동 (WASD로 제어)
    const moveDirection = new THREE.Vector3();
    let isMoving = false;

    if (keys['KeyW']) {
        moveDirection.z -= 1;
        isMoving = true;
    }
    if (keys['KeyS']) {
        moveDirection.z += 1;
        isMoving = true;
    }
    if (keys['KeyA']) {
        moveDirection.x -= 1;
        isMoving = true;
    }
    if (keys['KeyD']) {
        moveDirection.x += 1;
        isMoving = true;
    }

    // 손 위치 업데이트
    const cameraPosition = camera.position.clone();
    const cameraDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const handOffset = new THREE.Vector3(0, -0.5, 0);

    // 왼손 위치 설정
    leftHand.position.copy(cameraPosition);
    leftHand.position.add(cameraDirection.clone().multiplyScalar(1.2));
    leftHand.position.add(new THREE.Vector3(-1.5, 0, 0).applyQuaternion(camera.quaternion));
    leftHand.position.add(handOffset);
    leftHand.quaternion.copy(camera.quaternion);

    // 오른손 위치 설정
    rightHand.position.copy(cameraPosition);
    rightHand.position.add(cameraDirection.clone().multiplyScalar(1.2));
    rightHand.position.add(new THREE.Vector3(1.5, 0, 0).applyQuaternion(camera.quaternion));
    rightHand.position.add(handOffset);
    rightHand.quaternion.copy(camera.quaternion);

    // 손 흔들기 애니메이션
    if (isMoving && isGrounded) {
        handSwingAngle += handSwingSpeed * 1.0;
        const swing = Math.sin(handSwingAngle) * handSwingAmount;

        // 카메라의 위쪽 방향 벡터를 가져옴
        const cameraUp = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);

        // 왼손 위치 조정
        leftHand.position.add(cameraUp.clone().multiplyScalar(swing * 0.3));

        // 오른손 위치 조정
        rightHand.position.add(cameraUp.clone().multiplyScalar(-swing * 0.3));
    } else {
        // 멈췄을 때 손을 자연스럽게 내리기
        const cameraUp = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
        leftHand.position.copy(cameraPosition);
        leftHand.position.add(cameraDirection.clone().multiplyScalar(1.2));
        leftHand.position.add(new THREE.Vector3(-1.5, 0, 0).applyQuaternion(camera.quaternion));
        leftHand.position.add(handOffset);
        leftHand.quaternion.copy(camera.quaternion);

        rightHand.position.copy(cameraPosition);
        rightHand.position.add(cameraDirection.clone().multiplyScalar(1.2));
        rightHand.position.add(new THREE.Vector3(1.5, 0, 0).applyQuaternion(camera.quaternion));
        rightHand.position.add(handOffset);
        rightHand.quaternion.copy(camera.quaternion);
    }

    moveDirection.normalize();
    moveDirection.applyQuaternion(camera.quaternion);
    moveDirection.y = 0;

    camera.position.x += moveDirection.x * moveSpeed;
    camera.position.z += moveDirection.z * moveSpeed;

    // 걸을 때 발소리 재생 (버퍼 로드 여부와 재생 상태 확인)
    if (isMoving) {
        if (!walkingSound.isPlaying) walkingSound.play();
    } else {
        if (walkingSound.isPlaying) walkingSound.stop();
    }

    // 목적지 도착 확인
    checkGoal();
    checkCollisions(prevPosition);
    // 로봇이 플레이어를 향해 회전
    if (robot) {
        const direction = new THREE.Vector3();
        direction.subVectors(camera.position, robot.position).normalize();
        robot.lookAt(camera.position);

        // 일정 간격으로 총알 발사
        const currentTime = Date.now();
        if (((currentTime - lastShootTime) * timeScale) > ROBOT_SHOOT_INTERVAL && !isTimeReversed) {
            createBulletRobot();
            lastShootTime = currentTime;
        }
    }

    // 로봇 총알 업데이트
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        if (!isTimeReversed) {
            bullet.position.x -= BULLET_SPEED * timeScale * moveMentDirection; // x축 방향으로 이동
        }
        else {
            if (bullet.position.x > robot.position.x) { // 총알이 거꾸로 돌아옴
                bullet.position.x += BULLET_SPEED * timeScale * moveMentDirection; // x축 방향으로 이동
            }
            else {
                if (robot.position.x - bullet.position.x > 0.1)
                    bullet.position.x -= BULLET_SPEED * timeScale * moveMentDirection; // x축 방향으로 이동
                else
                    bullet.position.x = robot.position.x + 0.1;
            }
        }

        // 플레이어와 총알 충돌 체크
        const playerPosition = new THREE.Vector3(
            camera.position.x,
            camera.position.y - playerHeight, // 플레이어의 실제 위치 (카메라 높이에서 플레이어 높이를 뺌)
            camera.position.z
        );

        if (bullet.position.distanceTo(playerPosition) < 1.0) { // 충돌 범위를 늘림
            showDeathEffect();
            return;
        }
    }

    // 플레이어 총알 업데이트
    for (let i = playerBullets.length - 1; i >= 0; i--) {
        const bullet = playerBullets[i];
        if (!isTimeReversed) {
            // 총알이 바라보는 방향으로 이동
            bullet.position.add(bullet.userData.direction.clone().multiplyScalar(bullet.userData.speed * timeScale));
        } else {
            // 시간 역행 시 시작 위치까지만 돌아오기
            const distanceToStart = bullet.position.distanceTo(bullet.userData.startPosition);
            if (distanceToStart > 0.1) {
                bullet.position.sub(bullet.userData.direction.clone().multiplyScalar(bullet.userData.speed * timeScale));
            } else {
                bullet.position.copy(bullet.userData.startPosition);
            }
        }

        // 로봇과 총알 충돌 체크
        if (robot && !isRobotFalling && bullet.position.distanceTo(robot.position) < 1.0) {
            scene.remove(bullet);
            playerBullets.splice(i, 1);
            // 로봇 쓰러지기 시작
            isRobotFalling = true;
            robotFallAngle = 0;
        }
    }

    // 로봇 쓰러지는 애니메이션 업데이트
    if (isRobotFalling && robot) {
        robotFallAngle += ROBOT_FALL_SPEED * timeScale;
        if (robotFallAngle >= Math.PI / 2) {
            robotFallAngle = Math.PI / 2;
        }
        robot.rotation.x = robotFallAngle;
    }
}

// 플레이어가 플랫폼 위에 있는지 확인하는 함수
function isPlayerOnPlatform() {
    // 첫 번째 플랫폼 체크
    const leftPlatformX = -8;
    const leftPlatformZ = 0;
    const platformHalfWidth_X = PLATFORM_WIDTH_X / 2;
    const platformHalfWidth_Z = PLATFORM_WIDTH_Z / 2;

    const isOnLeftPlatform =
        Math.abs(camera.position.x - leftPlatformX) < platformHalfWidth_X &&
        Math.abs(camera.position.z - leftPlatformZ) < platformHalfWidth_Z &&
        Math.abs(camera.position.y - (playerHeight + groundY)) < 0.1;

    // 두 번째 플랫폼 체랫
    const rightPlatformX = 8;
    const rightPlatformZ = 0;

    const isOnRightPlatform =
        Math.abs(camera.position.x - rightPlatformX) < platformHalfWidth_X &&
        Math.abs(camera.position.z - rightPlatformZ) < platformHalfWidth_Z &&
        Math.abs(camera.position.y - (playerHeight + groundY)) < 0.1;

    // 세 번째 플랫폼 체크
    const platform3X = 24;
    const platform3Z = 0;

    const isOnPlatform3 =
        Math.abs(camera.position.x - platform3X) < platformHalfWidth_X &&
        Math.abs(camera.position.z - platform3Z) < platformHalfWidth_Z &&
        Math.abs(camera.position.y - (playerHeight + groundY)) < 0.1;

    // 네 번째 플랫폼 체크
    const platform4X = 40;
    const platform4Z = 0;

    const isOnPlatform4 =
        Math.abs(camera.position.x - platform4X) < platformHalfWidth_X &&
        Math.abs(camera.position.z - platform4Z) < platformHalfWidth_Z &&
        Math.abs(camera.position.y - (playerHeight + groundY)) < 0.1;

    return isOnLeftPlatform || isOnRightPlatform || isOnPlatform3 || isOnPlatform4;
}

// 다리 위에 있는지 확인하는 함수
function isPlayerOnBridge() {
    const relativeX = camera.position.x - bridge.position.x;
    const relativeZ = camera.position.z - bridge.position.z;

    return Math.abs(relativeX) < BRIDGE_SIZE / 2 && Math.abs(relativeZ) < BRIDGE_SIZE / 2;
}

// 다리 2 위에 있는지 확인 
function isPlayerOnBridge2To3() {
    const relativeX = camera.position.x - bridge2To3.position.x;
    const relativeZ = camera.position.z - bridge2To3.position.z;

    return Math.abs(relativeX) < BRIDGE_SIZE / 2 && Math.abs(relativeZ) < BRIDGE_SIZE / 2;
}

function isPlayerOnBridge3To4() {
    const relativeX = camera.position.x - bridge3To4.position.x;
    const relativeZ = camera.position.z - bridge3To4.position.z;

    return Math.abs(relativeX) < BRIDGE_SIZE / 2 && Math.abs(relativeZ) < BRIDGE_SIZE / 2;
}

// 목적지 도착 확인
function checkGoal() {
    if (isGameComplete) return;

    const distance = Math.sqrt(
        Math.pow(camera.position.x - goal.position.x, 2) +
        Math.pow(camera.position.z - goal.position.z, 2)
    );

    // 포탈 안에 들어갔는지 확인 (높이도 체크)
    if (distance < PORTAL_RADIUS &&
        Math.abs(camera.position.y - goal.position.y) < PORTAL_HEIGHT / 2) {
        isGameComplete = true;
        showGameComplete();
    }
}

// 게임 리셋 함수
function resetGame() {
    // 게임 상태 초기화
    isGameComplete = false;
    isTimeReversed = false;
    isDead = false;
    gameTime = 0;
    timeScale = 1.0;
    isTimePaused = false;
    lastTimeScale = 1.0;
    moveMentDirection = 1.0;
    bridgeVisible = true;
    bridgeState = 'bridgeMovingXaxis';
    bridge.visible = true;
    bridge.position.set(BRIDGE_START_X, BRIDGE_START_Y, 0);

    // 모든 총알 제거
    // 로봇 총알 제거
    bullets.forEach(bullet => {
        scene.remove(bullet);
    });
    bullets = [];

    // 플레이어 총알 제거
    playerBullets.forEach(bullet => {
        scene.remove(bullet);
    });
    playerBullets = [];

    // 로봇 상태 초기화
    isRobotFalling = false;
    robotFallAngle = 0;
    if (robot) {
        robot.rotation.x = 0;
    } else {
        createRobot();
    }

    // 플레이어 위치 초기화
    camera.position.set(-8, playerHeight + groundY, 0);
    euler.set(0, 0, 0, 'YXZ');
    camera.quaternion.setFromEuler(euler);

    // 시간 상태 UI 업데이트
    updateTimeStatusUI();

    // 모든 게임 관련 메시지 제거
    const existingMessages = document.querySelectorAll('.game-complete-message, .death-message, .death-overlay');
    existingMessages.forEach(message => {
        if (message.parentNode) {
            document.body.removeChild(message);
        }
    });

    // 배경음악 재시작
    if (backgroundMusic) {
        backgroundMusic.stop();
        backgroundMusic.offset = audioStartTime; // 시작 시간 재설정
        backgroundMusic.play();
    }

    if (slowMotionSound.isPlaying) {
        slowMotionSound.stop();
    }
    if (fastTimeSound.isPlaying) {
        fastTimeSound.stop();
    }
}

// 게임 완료 메시지 표시
function showGameComplete() {
    const message = document.createElement('div');
    message.className = 'game-complete-message';
    message.style.position = 'fixed';
    message.style.top = '50%';
    message.style.left = '50%';
    message.style.transform = 'translate(-50%, -50%)';
    message.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    message.style.color = 'white';
    message.style.padding = '20px';
    message.style.borderRadius = '10px';
    message.style.fontSize = '24px';
    message.style.textAlign = 'center';
    message.style.zIndex = '1000';
    message.innerHTML = '목적지에 도착했습니다!<br>게임 클리어!<br><br>R 키를 눌러 다시 시작할 수 있습니다.';
    document.body.appendChild(message);
}

// 죽음 효과 표시
function showDeathEffect() {
    isDead = true;
    let intensity = 0;

    // 빨간색 필터를 적용할 오버레이 생성
    const overlay = document.createElement('div');
    overlay.className = 'death-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(255, 0, 0, 0)';
    overlay.style.transition = 'background-color 0.5s';
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = '999';
    document.body.appendChild(overlay);

    // 죽음 메시지 생성
    const message = document.createElement('div');
    message.className = 'death-message';
    message.style.position = 'fixed';
    message.style.top = '50%';
    message.style.left = '50%';
    message.style.transform = 'translate(-50%, -50%)';
    message.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    message.style.color = 'white';
    message.style.padding = '30px 50px';
    message.style.borderRadius = '15px';
    message.style.fontSize = '36px';
    message.style.fontFamily = 'Arial, sans-serif';
    message.style.textAlign = 'center';
    message.style.zIndex = '1000';
    message.style.opacity = '0';
    message.style.transition = 'opacity 0.5s';
    message.innerHTML = 'YOU DIED<br><br><span style="font-size: 24px;">R 키를 눌러 다시 시작</span>';
    document.body.appendChild(message);

    // 애니메이션 효과
    const animate = () => {
        if (!isDead) return;

        intensity = Math.min(0.175, intensity + 0.005); // 최대 강도를 0.175로 낮추고, 증가 속도도 조정
        overlay.style.backgroundColor = `rgba(255, 0, 0, ${intensity})`;

        if (intensity < 0.175) {
            requestAnimationFrame(animate);
        }
    };
    animate();

    setTimeout(() => {
        message.style.opacity = '1';
    }, 100);

    // 3초 후 리셋
    setTimeout(() => {
        resetGame();
        if (overlay.parentNode) document.body.removeChild(overlay);
        if (message.parentNode) document.body.removeChild(message);
    }, 3000);
}

// 애니메이션 루프
function animate() {
    requestAnimationFrame(animate);

    // 용암 출렁임 효과
    if (lava && lavaLight) {
        const time = Date.now() * 0.001;
        lava.position.y = -10 + Math.sin(time * 2) * 0.2;
        lavaLight.position.y = lava.position.y + 1;
    }

    update();
    if (composer) {
        composer.render();
    } else {
        renderer.render(scene, camera);
    }
}

// 게임 시작
init();
animate();

// 플레이어 생성 함수 수정
function createPlayer() {
    // 플레이어 본체 (보이지 않게 설정)
    const playerGeometry = new THREE.BoxGeometry(1, playerHeight, 1);
    const playerMaterial = new THREE.MeshStandardMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0
    });
    player = new THREE.Mesh(playerGeometry, playerMaterial);
    player.position.set(-8, playerHeight + groundY, 0);
    player.castShadow = true;
    scene.add(player);

    // 왼손 생성
    const handGeometry = new THREE.BoxGeometry(0.3, 1.2, 0.3);

    const textureLoader = new THREE.TextureLoader();
    const handTexture = textureLoader.load('src/texture/hand.png');
    const handMaterial = new THREE.MeshStandardMaterial({
        map: handTexture,
        roughness: 0.7,
        metalness: 0.1
    });

    leftHand = new THREE.Mesh(handGeometry, handMaterial);

    // 왼손 버텍스 위치 조정
    const leftHandPositions = leftHand.geometry.attributes.position;
    for (let i = 0; i < leftHandPositions.count; i++) {
        const y = leftHandPositions.getY(i);
        const z = leftHandPositions.getZ(i);
        leftHandPositions.setZ(i, z - (y + 0.4) * 0.3 + (y < 0 ? 0.2 : 0));
    }
    leftHandPositions.needsUpdate = true;
    scene.add(leftHand);

    // 오른손 생성
    rightHand = new THREE.Mesh(handGeometry, handMaterial);

    // 오른손 버텍스 위치 조정
    const rightHandPositions = rightHand.geometry.attributes.position;
    for (let i = 0; i < rightHandPositions.count; i++) {
        const y = rightHandPositions.getY(i);
        const z = rightHandPositions.getZ(i);
        rightHandPositions.setZ(i, z - (y + 0.4) * 0.3 + (y < 0 ? 0.2 : 0));
    }
    rightHandPositions.needsUpdate = true;
    scene.add(rightHand);

    // 총 생성
    const gunGroup = new THREE.Group();

    // 총 몸체
    const gunBodyGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.4);
    const gunMaterial = new THREE.MeshStandardMaterial({ color: 0x404040 });
    const gunBody = new THREE.Mesh(gunBodyGeometry, gunMaterial);
    gunBody.position.z = -0.2; // z값을 반대로 변경
    gunGroup.add(gunBody);

    // 총 손잡이
    const gunHandleGeometry = new THREE.BoxGeometry(0.08, 0.15, 0.08);
    const gunHandle = new THREE.Mesh(gunHandleGeometry, gunMaterial);
    gunHandle.position.set(0, -0.1, 0);
    gunGroup.add(gunHandle);

    // 총구
    const gunBarrelGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.2, 8);
    const gunBarrel = new THREE.Mesh(gunBarrelGeometry, gunMaterial);
    gunBarrel.rotation.x = Math.PI / 2;
    gunBarrel.position.set(0, 0, -0.4); // z값을 반대로 변경
    gunGroup.add(gunBarrel);

    // 총을 오른손에 추가
    rightHand.add(gunGroup);
    gunGroup.position.set(0, 0.6, -0.25);
    gunGroup.rotation.x = Math.PI / 6; // 총을 약간 위로 기울임
}

// 충돌 체크 함수 수정
function checkCollisions(prevPosition) {
    const playerPosition = new THREE.Vector3(
        camera.position.x,
        camera.position.y - playerHeight,
        camera.position.z
    );
    const playerSize = new THREE.Vector3(0.5, playerHeight, 0.5);

    // 벽과의 충돌 체크
    const rightWallPosition = new THREE.Vector3(leftRightWall_X, wall_Y, rightWall_Z);
    const leftWallPosition = new THREE.Vector3(leftRightWall_X, wall_Y, leftWall_Z);
    const backWallPosition = new THREE.Vector3(backWall_X, wall_Y, backWall_Z);
    const frontWallPosition = new THREE.Vector3(frontWall_X, wall_Y, frontWall_Z);
    // 좌‧우 벽은 Y축으로 90° 회전되어 있으므로 X축이 길고 Z축이 얇다
    const sideWallSize = new THREE.Vector3(WALL_DEPTH, WALL_HEIGHT, WALL_WIDTH);   // (50, 200, 1)

    // 뒤쪽 벽은 회전되지 않았으므로 X축이 얇고 Z축이 길다
    const backWallSize = new THREE.Vector3(WALL_WIDTH, WALL_HEIGHT, WALL_DEPTH);   // (1, 200, 50)
    const frontWallSize = new THREE.Vector3(WALL_WIDTH, WALL_HEIGHT, WALL_DEPTH);   // (1, 200, 50)

    // 충돌 감지
    if (
        isColliding(playerPosition, rightWallPosition, playerSize, sideWallSize) ||
        isColliding(playerPosition, leftWallPosition, playerSize, sideWallSize) ||
        isColliding(playerPosition, backWallPosition, playerSize, backWallSize) ||
        isColliding(playerPosition, frontWallPosition, playerSize, frontWallSize)
    ) {
        camera.position.copy(prevPosition);
        velocity = 0;
    }
}

// 충돌 감지 함수
function isColliding(pos1, pos2, size1, size2) {
    // 각 축에 대한 충돌 체크
    const xCollision = Math.abs(pos1.x - pos2.x) < (size1.x + size2.x) / 2;
    const yCollision = Math.abs(pos1.y - pos2.y) < (size1.y + size2.y) / 2;
    const zCollision = Math.abs(pos1.z - pos2.z) < (size1.z + size2.z) / 2;

    // 모든 축에서 충돌이 발생하면 true 반환
    return xCollision && yCollision && zCollision;
}

// 로봇 생성 함수
function createRobot() {
    // 로봇 본체
    const bodyGeometry = new THREE.BoxGeometry(1, 2, 1);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);

    // 로봇 머리
    const headGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0x404040 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.5;

    // 로봇 총
    const gunGeometry = new THREE.BoxGeometry(0.2, 0.2, 1);
    const gunMaterial = new THREE.MeshStandardMaterial({ color: 0x202020 });
    const gun = new THREE.Mesh(gunGeometry, gunMaterial);
    gun.position.set(0, 0.5, 0.6);

    // 로봇 그룹 생성
    robot = new THREE.Group();
    robot.add(body);
    robot.add(head);
    robot.add(gun);
    robot.position.set(40, 0, PLATFORM_WIDTH_Z / 2 - 3); // 4번째 플랫폼 위에 위치
    scene.add(robot);
}

// 로봇이 총 쏘는 함수
function createBulletRobot() {
    if (!isTimeReversed && !isTimePaused && !isRobotFalling) {
        // 총알 개수가 20개 이상이면 가장 오래된 총알 제거
        if (bullets.length >= 20) {
            const oldestBullet = bullets.shift();
            scene.remove(oldestBullet);
        }

        const bulletGeometry = new THREE.SphereGeometry(0.1, 16, 16);
        const bulletMaterial = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 0.5
        });
        const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);

        // 총알의 시작 위치를 로봇의 총구 위치로 설정
        bullet.position.copy(robot.position);
        bullet.position.x -= 1; // -x 방향으로 발사

        // 총알의 생성 시간 기록
        bullet.userData = {
            createdAt: Date.now()
        };

        scene.add(bullet);
        bullets.push(bullet);
        // 총 쏘는 소리 재생 (거리에 따른 볼륨 조절)
        if (gunshotSound.isPlaying) gunshotSound.stop();

        // 로봇과 플레이어 사이의 거리 계산
        const distance = camera.position.distanceTo(robot.position);
        // 거리에 따른 볼륨 계산 (거리가 멀수록 소리가 작아짐)
        const volume = Math.max(0, 1 - (distance / 60)); // 50 유닛 이상에서는 소리가 들리지 않음
        gunshotSound.setVolume(volume);
        gunshotSound.play();
    }
}
// 플레이어 총 발사 함수
function shootPlayerGun() {
    // 총알 개수가 20개 이상이면 가장 오래된 총알 제거
    if (playerBullets.length >= 20) {
        const oldestBullet = playerBullets.shift();
        scene.remove(oldestBullet);
    }

    const bulletGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const bulletMaterial = new THREE.MeshStandardMaterial({
        color: 0xff0000,
        emissive: 0xff0000,
        emissiveIntensity: 0.5
    });
    const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);

    // 카메라의 위치와 방향을 가져옴
    const cameraDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const bulletStartPosition = camera.position.clone();

    // 총알의 시작 위치를 카메라 앞쪽으로 설정
    bulletStartPosition.add(cameraDirection.clone().multiplyScalar(1.5));
    bullet.position.copy(bulletStartPosition);

    // 총알의 방향과 속도 정보 저장
    bullet.userData = {
        direction: cameraDirection,
        speed: 0.5,
        startPosition: bulletStartPosition.clone() // 시작 위치 저장
    };

    scene.add(bullet);
    playerBullets.push(bullet);

    if (gunshotSound.isPlaying) gunshotSound.stop();
    gunshotSound.play();
}

// 슬로우모션 효과음 제어 함수 수정
function updateSlowMotionSound() {
    if (timeScale < 1 && timeScale > 0) {
        if (!slowMotionSound.isPlaying) {
            slowMotionSound.play();
            slowMotionSound.offset = 0.7;
        }
        if (fastTimeSound.isPlaying) {
            fastTimeSound.stop();
        }
    } else if (timeScale > 1) {
        if (!fastTimeSound.isPlaying) {
            fastTimeSound.play();
            fastTimeSound.offset = 0.5;
        }
        if (slowMotionSound.isPlaying) {
            slowMotionSound.stop();
        }
    } else {
        if (slowMotionSound.isPlaying) {
            slowMotionSound.stop();
        }
        if (fastTimeSound.isPlaying) {
            fastTimeSound.stop();
        }
    }
}
