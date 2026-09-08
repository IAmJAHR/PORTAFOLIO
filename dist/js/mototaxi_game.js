// 🚀 Mototaxi 3D Simulator - Lógica Principal

(function() {
    // Variables principales
    let scene, camera, renderer;
    let mototaxi, road;
    let obstacles = [];
    let isGameOver = false;
    let score = 0;
    let speed = 1.0;
    
    // Controles
    let keys = { ArrowLeft: false, ArrowRight: false, a: false, d: false };
    
    // UI Elements
    const scoreDisplay = document.getElementById('score-display');
    const gameOverScreen = document.getElementById('game-over-screen');
    const finalScoreDisplay = document.getElementById('final-score');
    const btnRestart = document.getElementById('btn-restart');
    
    init();
    animate();

    function init() {
        // 1. Escena y Renderizador
        const container = document.getElementById('game-container');
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x050505);
        scene.fog = new THREE.Fog(0x050505, 50, 300);

        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        container.appendChild(renderer.domElement);

        // 2. Cámara
        camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        // La cámara mirará desde atrás y arriba de la mototaxi
        camera.position.set(0, 10, 20);

        // 3. Luces
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0x00f3ff, 0.8);
        dirLight.position.set(50, 100, 50);
        dirLight.castShadow = true;
        scene.add(dirLight);
        
        const accentLight = new THREE.DirectionalLight(0xbc13fe, 0.5);
        accentLight.position.set(-50, 50, -50);
        scene.add(accentLight);

        // 4. Crear el mundo
        createEnvironment();
        createMototaxi();

        // 5. Event Listeners
        window.addEventListener('resize', onWindowResize);
        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);
        
        // Mobile Controls
        const btnLeft = document.getElementById('btn-left');
        const btnRight = document.getElementById('btn-right');
        
        if (btnLeft && btnRight) {
            btnLeft.addEventListener('touchstart', (e) => { e.preventDefault(); keys.ArrowLeft = true; });
            btnLeft.addEventListener('touchend', (e) => { e.preventDefault(); keys.ArrowLeft = false; });
            btnLeft.addEventListener('mousedown', () => keys.ArrowLeft = true);
            btnLeft.addEventListener('mouseup', () => keys.ArrowLeft = false);
            
            btnRight.addEventListener('touchstart', (e) => { e.preventDefault(); keys.ArrowRight = true; });
            btnRight.addEventListener('touchend', (e) => { e.preventDefault(); keys.ArrowRight = false; });
            btnRight.addEventListener('mousedown', () => keys.ArrowRight = true);
            btnRight.addEventListener('mouseup', () => keys.ArrowRight = false);
        }

        btnRestart.addEventListener('click', restartGame);
    }

    function createEnvironment() {
        // Pista (Grid)
        const gridHelper = new THREE.GridHelper(200, 50, 0x00f3ff, 0x222222);
        gridHelper.position.y = 0;
        scene.add(gridHelper);

        // Suelo invisible para recibir sombras
        const floorGeo = new THREE.PlaneGeometry(200, 1000);
        const floorMat = new THREE.MeshLambertMaterial({ color: 0x050505 });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -0.1;
        floor.receiveShadow = true;
        scene.add(floor);
    }

    function createMototaxi() {
        mototaxi = new THREE.Group();

        // Materiales Cyberpunk
        const bodyMat = new THREE.MeshPhongMaterial({ color: 0xbc13fe, flatShading: true });
        const cabinMat = new THREE.MeshPhongMaterial({ color: 0x000000, transparent: true, opacity: 0.8 });
        const wheelMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
        const neonMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff });

        // Chasis principal (Parte trasera)
        const backGeo = new THREE.BoxGeometry(4, 3, 5);
        const back = new THREE.Mesh(backGeo, bodyMat);
        back.position.set(0, 2.5, 0);
        back.castShadow = true;
        mototaxi.add(back);

        // Techo de lona
        const roofGeo = new THREE.BoxGeometry(4.2, 0.5, 5.2);
        const roof = new THREE.Mesh(roofGeo, bodyMat);
        roof.position.set(0, 4.25, 0);
        mototaxi.add(roof);

        // Cabina delantera
        const frontGeo = new THREE.BoxGeometry(2, 3, 3);
        const front = new THREE.Mesh(frontGeo, cabinMat);
        front.position.set(0, 2.5, -4);
        front.castShadow = true;
        mototaxi.add(front);
        
        // Luz Neón Inferior
        const neonGeo = new THREE.BoxGeometry(3.8, 0.2, 4.8);
        const neon = new THREE.Mesh(neonGeo, neonMat);
        neon.position.set(0, 0.8, 0);
        mototaxi.add(neon);

        // Llantas traseras
        const wheelGeo = new THREE.CylinderGeometry(1, 1, 0.5, 16);
        wheelGeo.rotateZ(Math.PI / 2);
        
        const wheelRL = new THREE.Mesh(wheelGeo, wheelMat);
        wheelRL.position.set(-2.2, 1, 1);
        mototaxi.add(wheelRL);
        
        const wheelRR = new THREE.Mesh(wheelGeo, wheelMat);
        wheelRR.position.set(2.2, 1, 1);
        mototaxi.add(wheelRR);

        // Llanta delantera
        const wheelF = new THREE.Mesh(wheelGeo, wheelMat);
        wheelF.position.set(0, 1, -4.5);
        mototaxi.add(wheelF);

        mototaxi.position.set(0, 0, 0);
        scene.add(mototaxi);
    }

    function spawnObstacle(zPos) {
        const obsGeo = new THREE.BoxGeometry(4, 4, 4);
        
        // Colores aleatorios neon
        const colors = [0xff003c, 0x00f3ff, 0xbc13fe, 0x00ff66];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        const obsMat = new THREE.MeshPhongMaterial({ color: randomColor, emissive: randomColor, emissiveIntensity: 0.3 });
        
        const obstacle = new THREE.Mesh(obsGeo, obsMat);
        
        // Posición X aleatoria (carriles)
        const lanes = [-10, -5, 0, 5, 10];
        const randomLane = lanes[Math.floor(Math.random() * lanes.length)];
        
        obstacle.position.set(randomLane, 2, zPos);
        obstacle.castShadow = true;
        
        // Caja delimitadora (Bounding Box) para colisiones
        obstacle.geometry.computeBoundingBox();
        
        scene.add(obstacle);
        obstacles.push(obstacle);
    }

    // Input handlers
    function onKeyDown(e) {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.ArrowLeft = true;
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.ArrowRight = true;
    }

    function onKeyUp(e) {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.ArrowLeft = false;
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.ArrowRight = false;
    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // Lógica principal
    function animate() {
        if (isGameOver) return;
        requestAnimationFrame(animate);

        // Movimiento lateral (Jugador)
        const moveSpeed = 0.5;
        if (keys.ArrowLeft && mototaxi.position.x > -12) {
            mototaxi.position.x -= moveSpeed;
            mototaxi.rotation.z = 0.1; // Inclinación
            mototaxi.rotation.y = 0.1;
        } else if (keys.ArrowRight && mototaxi.position.x < 12) {
            mototaxi.position.x += moveSpeed;
            mototaxi.rotation.z = -0.1;
            mototaxi.rotation.y = -0.1;
        } else {
            // Regresar a posición recta
            mototaxi.rotation.z = THREE.MathUtils.lerp(mototaxi.rotation.z, 0, 0.1);
            mototaxi.rotation.y = THREE.MathUtils.lerp(mototaxi.rotation.y, 0, 0.1);
        }

        // Avanzar la mototaxi en el eje -Z
        mototaxi.position.z -= speed;
        
        // Aumentar velocidad y puntaje poco a poco
        score += speed * 0.1;
        scoreDisplay.innerText = Math.floor(score);
        speed += 0.001; // Dificultad incremental

        // Actualizar cámara para que siga a la mototaxi
        camera.position.z = mototaxi.position.z + 20;
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, mototaxi.position.x * 0.5, 0.1);

        // Generar obstáculos adelante
        if (obstacles.length < 15) {
            // Spawnear obstáculo lejos en -Z
            const lastZ = obstacles.length > 0 ? obstacles[obstacles.length-1].position.z : mototaxi.position.z;
            spawnObstacle(lastZ - 40 - Math.random() * 60);
        }

        // Checar colisiones y remover obstáculos viejos
        const taxiBox = new THREE.Box3().setFromObject(mototaxi);
        // Reducimos un poco el hitbox de la mototaxi para ser generosos
        taxiBox.expandByScalar(-0.5); 

        for (let i = obstacles.length - 1; i >= 0; i--) {
            const obs = obstacles[i];
            
            // Colisión
            const obsBox = new THREE.Box3().setFromObject(obs);
            if (taxiBox.intersectsBox(obsBox)) {
                triggerGameOver();
                return;
            }

            // Si el obstáculo quedó atrás de la cámara, borrarlo
            if (obs.position.z > camera.position.z) {
                scene.remove(obs);
                obstacles.splice(i, 1);
            }
        }

        renderer.render(scene, camera);
    }

    function triggerGameOver() {
        isGameOver = true;
        gameOverScreen.classList.remove('hidden');
        finalScoreDisplay.innerText = Math.floor(score);
    }

    function restartGame() {
        // Reset variables
        isGameOver = false;
        score = 0;
        speed = 1.0;
        mototaxi.position.set(0, 0, 0);
        camera.position.set(0, 10, 20);
        scoreDisplay.innerText = '0';
        
        // Limpiar obstáculos
        obstacles.forEach(obs => scene.remove(obs));
        obstacles = [];
        
        gameOverScreen.classList.add('hidden');
        
        animate(); // Reanudar loop
    }

})();
