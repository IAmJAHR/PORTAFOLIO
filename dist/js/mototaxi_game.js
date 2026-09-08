// 🛺 Mototaxi 3D Simulator - V2 (Texturas, Baches, Personas y Rompemuelles)

(function() {
    // Variables principales
    let scene, camera, renderer;
    let mototaxi, road;
    let obstacles = [];
    let isGameOver = false;
    let score = 0;
    let speed = 1.0;
    let bumpVelocity = 0;
    
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
        const container = document.getElementById('game-container');
        scene = new THREE.Scene();
        
        // Ambiente de "Trocha" / Día polvoriento
        scene.background = new THREE.Color(0xd2b48c);
        scene.fog = new THREE.Fog(0xd2b48c, 30, 150);

        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        container.appendChild(renderer.domElement);

        camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 8, 15);

        // Luces (Día soleado)
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(50, 100, -50);
        dirLight.castShadow = true;
        scene.add(dirLight);

        // Crear el mundo y mototaxi pulida
        createEnvironment();
        createPolishedMototaxi();

        // Event Listeners
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
        // Generar textura procedural de tierra/barro (Trocha)
        const canvas = document.createElement('canvas');
        canvas.width = 512; 
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#8b5a2b'; // Base marrón oscuro
        ctx.fillRect(0, 0, 512, 512);
        
        // Agregar "piedritas" y ruido
        for(let i = 0; i < 15000; i++) {
            ctx.fillStyle = Math.random() > 0.5 ? '#a0522d' : '#6b4226';
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const s = Math.random() * 3;
            ctx.fillRect(x, y, s, s);
        }
        
        const dirtTexture = new THREE.CanvasTexture(canvas);
        dirtTexture.wrapS = THREE.RepeatWrapping;
        dirtTexture.wrapT = THREE.RepeatWrapping;
        dirtTexture.repeat.set(10, 500); // Estirar en el eje Z

        const floorGeo = new THREE.PlaneGeometry(100, 10000);
        const floorMat = new THREE.MeshLambertMaterial({ map: dirtTexture });
        road = new THREE.Mesh(floorGeo, floorMat);
        road.rotation.x = -Math.PI / 2;
        road.receiveShadow = true;
        scene.add(road);
    }

    function createPolishedMototaxi() {
        mototaxi = new THREE.Group();

        const chassisMat = new THREE.MeshLambertMaterial({ color: 0xcc0000 }); // Roja clásica
        const roofMat = new THREE.MeshLambertMaterial({ color: 0xeeeeee }); // Techo blanco
        const blackMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
        const glassMat = new THREE.MeshLambertMaterial({ color: 0xaaddff, transparent: true, opacity: 0.6 });
        const metalMat = new THREE.MeshLambertMaterial({ color: 0x888888 });

        // Cabina Trasera (Pasajeros)
        const cabinGeo = new THREE.BoxGeometry(3.5, 2.5, 3.5);
        const cabin = new THREE.Mesh(cabinGeo, chassisMat);
        cabin.position.set(0, 1.75, 1);
        cabin.castShadow = true;
        mototaxi.add(cabin);

        // Techo (Lona)
        const roofGeo = new THREE.BoxGeometry(3.7, 0.2, 5.5);
        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.set(0, 3.1, 0);
        mototaxi.add(roof);

        // Parabrisas
        const glassGeo = new THREE.PlaneGeometry(2.5, 2);
        const glass = new THREE.Mesh(glassGeo, glassMat);
        glass.position.set(0, 2, -1.8);
        glass.rotation.x = -Math.PI / 8;
        mototaxi.add(glass);

        // Frente (Manubrio / faro)
        const frontGeo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
        const front = new THREE.Mesh(frontGeo, chassisMat);
        front.position.set(0, 1, -1.5);
        mototaxi.add(front);

        // Faro delantero
        const lightGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 16);
        lightGeo.rotateX(Math.PI / 2);
        const light = new THREE.Mesh(lightGeo, new THREE.MeshBasicMaterial({color: 0xffffff}));
        light.position.set(0, 1.2, -2.3);
        mototaxi.add(light);
        
        // SpotLight simulando el faro de la mototaxi
        const headlight = new THREE.SpotLight(0xffffff, 1.5, 50, Math.PI/4, 0.5, 1);
        headlight.position.set(0, 1.2, -2.3);
        headlight.target.position.set(0, 0, -20);
        mototaxi.add(headlight);
        mototaxi.add(headlight.target);

        // Llantas (Función helper)
        function createWheel(x, y, z) {
            const wGroup = new THREE.Group();
            // Neumático
            const wGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.4, 16);
            wGeo.rotateZ(Math.PI / 2);
            const wheel = new THREE.Mesh(wGeo, blackMat);
            // Aro
            const rimGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.42, 16);
            rimGeo.rotateZ(Math.PI / 2);
            const rim = new THREE.Mesh(rimGeo, metalMat);
            
            wGroup.add(wheel);
            wGroup.add(rim);
            wGroup.position.set(x, y, z);
            wGroup.castShadow = true;
            return wGroup;
        }

        mototaxi.add(createWheel(-1.7, 0.6, 2)); // Trasera Izquierda
        mototaxi.add(createWheel(1.7, 0.6, 2));  // Trasera Derecha
        mototaxi.add(createWheel(0, 0.6, -2));   // Delantera

        mototaxi.position.set(0, 0, 0);
        scene.add(mototaxi);
    }

    function spawnObstacle(zPos) {
        const rand = Math.random();
        let obs = new THREE.Group();
        let type = 'crash';
        
        // Carriles disponibles
        const lanes = [-6, -3, 0, 3, 6];
        const lane = lanes[Math.floor(Math.random() * lanes.length)];

        if (rand < 0.25) {
            // 1. BACHE (Hueco en la tierra)
            const geo = new THREE.CylinderGeometry(1.5, 1.5, 0.05, 16);
            const mat = new THREE.MeshBasicMaterial({ color: 0x221100 }); // Barro muy oscuro
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.y = 0.02;
            obs.add(mesh);
            type = 'bache';
        } 
        else if (rand < 0.5) {
            // 2. ROMPEMUELLES
            const geo = new THREE.CylinderGeometry(0.4, 0.4, 6, 16);
            // Textura a rayas amarillas y negras (simulada)
            const mat = new THREE.MeshLambertMaterial({ color: 0xddaa00 });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.rotation.z = Math.PI / 2;
            mesh.position.y = 0.2;
            obs.add(mesh);
            type = 'bump';
        } 
        else if (rand < 0.75) {
            // 3. PERSONA (Peatón cruzando)
            const clothesColors = [0x0044ff, 0xff0044, 0x00ff44, 0xeeeeee];
            const pColor = clothesColors[Math.floor(Math.random() * clothesColors.length)];
            
            const body = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1.5), new THREE.MeshLambertMaterial({color: pColor}));
            body.position.y = 0.75;
            body.castShadow = true;
            
            const head = new THREE.Mesh(new THREE.SphereGeometry(0.35), new THREE.MeshLambertMaterial({color: 0xffcc99}));
            head.position.y = 1.7;
            head.castShadow = true;
            
            obs.add(body);
            obs.add(head);
            type = 'persona';
        } 
        else {
            // 4. ROCA / OBSTÁCULO GRANDE
            const geo = new THREE.DodecahedronGeometry(1.2);
            const mat = new THREE.MeshLambertMaterial({ color: 0x555555 });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.y = 1;
            mesh.castShadow = true;
            obs.add(mesh);
            type = 'roca';
        }

        obs.position.set(lane, 0, zPos);
        obs.userData = { type: type, hit: false };
        scene.add(obs);
        obstacles.push(obs);
    }

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

    function animate() {
        if (isGameOver) return;
        requestAnimationFrame(animate);

        // Movimiento lateral
        const moveSpeed = 0.3 + (speed * 0.1);
        if (keys.ArrowLeft && mototaxi.position.x > -8) {
            mototaxi.position.x -= moveSpeed;
            mototaxi.rotation.z = 0.15;
            mototaxi.rotation.y = 0.1;
        } else if (keys.ArrowRight && mototaxi.position.x < 8) {
            mototaxi.position.x += moveSpeed;
            mototaxi.rotation.z = -0.15;
            mototaxi.rotation.y = -0.1;
        } else {
            mototaxi.rotation.z = THREE.MathUtils.lerp(mototaxi.rotation.z, 0, 0.1);
            mototaxi.rotation.y = THREE.MathUtils.lerp(mototaxi.rotation.y, 0, 0.1);
        }

        // Físicas del salto (rompemuelles)
        if (mototaxi.position.y > 0 || bumpVelocity > 0) {
            mototaxi.position.y += bumpVelocity;
            bumpVelocity -= 0.02; // Gravedad
            
            // Efecto de levantar la llanta delantera al saltar
            mototaxi.rotation.x = THREE.MathUtils.lerp(mototaxi.rotation.x, -0.2, 0.1);
            
            if (mototaxi.position.y <= 0) {
                mototaxi.position.y = 0;
                bumpVelocity = 0;
                mototaxi.rotation.x = 0;
            }
        } else {
            mototaxi.rotation.x = THREE.MathUtils.lerp(mototaxi.rotation.x, 0, 0.1);
        }

        // Avanzar
        mototaxi.position.z -= speed;
        
        // Puntuación
        score += speed * 0.1;
        scoreDisplay.innerText = Math.floor(score);
        speed += 0.0005; // Acelerar progresivamente

        // Mover cámara
        camera.position.z = mototaxi.position.z + 12;
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, mototaxi.position.x * 0.6, 0.1);
        camera.position.y = mototaxi.position.y + 6;

        // Generar obstáculos
        if (obstacles.length < 20) {
            const lastZ = obstacles.length > 0 ? obstacles[obstacles.length-1].position.z : mototaxi.position.z;
            spawnObstacle(lastZ - 20 - Math.random() * 40);
        }

        // Animación de personas y colisiones
        const taxiBox = new THREE.Box3().setFromObject(mototaxi);
        taxiBox.expandByScalar(-0.4); // Hitbox más permisiva

        for (let i = obstacles.length - 1; i >= 0; i--) {
            const obs = obstacles[i];
            
            // Si es persona, hacerla caminar lentamente a través de la pista
            if (obs.userData.type === 'persona') {
                obs.position.x += Math.sin(Date.now() * 0.001 + obs.position.z) * 0.05;
            }

            // Chequeo de colisión
            if (!obs.userData.hit) {
                const obsBox = new THREE.Box3().setFromObject(obs);
                if (obs.userData.type === 'bache' || obs.userData.type === 'bump') {
                    // Los baches y rompemuelles son planos, hacemos su hitbox más chato
                    obsBox.max.y = 1;
                }

                if (taxiBox.intersectsBox(obsBox)) {
                    if (obs.userData.type === 'bump') {
                        // Rompemuelles: Solo hace saltar la mototaxi y reduce la velocidad un poco
                        bumpVelocity = 0.3;
                        speed = Math.max(0.8, speed - 0.2);
                        obs.userData.hit = true;
                    } else {
                        // Bache, Persona o Roca: GAME OVER
                        triggerGameOver();
                        return;
                    }
                }
            }

            // Remover obstáculos que ya pasaron
            if (obs.position.z > camera.position.z + 10) {
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
        isGameOver = false;
        score = 0;
        speed = 1.0;
        bumpVelocity = 0;
        mototaxi.position.set(0, 0, 0);
        mototaxi.rotation.set(0,0,0);
        camera.position.set(0, 8, 15);
        scoreDisplay.innerText = '0';
        
        obstacles.forEach(obs => scene.remove(obs));
        obstacles = [];
        
        gameOverScreen.classList.add('hidden');
        animate();
    }

})();
