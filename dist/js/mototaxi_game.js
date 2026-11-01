// 🛺 Mototaxi 3D Simulator - Edición Perú Total: Tumán Urbano
// Calles vivas con tiendas, bares, casas de varios pisos y variedad de obstáculos peruanos con ritmo balanceado

(function() {
    // --- VARIABLES DE ESCENA Y ESTADO ---
    let scene, camera, renderer;
    let mototaxi, mototaxiBody, frontFork, choferGroup;
    let frontWheel, rearLeftWheel, rearRightWheel;
    let exhaustPipe, peruvianFlag;
    let road, ground;
    
    let obstacles = [];
    let sceneryBuildings = [];
    let sidewalkProps = [];
    let clouds = [];
    let collectibles = [];
    let smokeParticles = [];
    
    let isGameOver = false;
    let score = 0;
    let solesCollected = 0;
    let speed = 0.65; // Velocidad inicial suave y controlable
    let bumpVelocity = 0;
    let soundEnabled = true;
    let steerAngle = 0;
    let engineVibration = 0;

    // Controles
    let keys = { ArrowLeft: false, ArrowRight: false, a: false, d: false };

    // Elementos UI
    const scoreDisplay = document.getElementById('score-display');
    const coinsDisplay = document.getElementById('coins-display');
    const speedDisplay = document.getElementById('speed-display');
    const gameOverScreen = document.getElementById('game-over-screen');
    const finalScoreDisplay = document.getElementById('final-score');
    const finalCoinsDisplay = document.getElementById('final-coins');
    const btnRestart = document.getElementById('btn-restart');
    const btnSoundToggle = document.getElementById('btn-sound-toggle');
    const btnHorn = document.getElementById('btn-horn');

    // --- SINTETIZADOR WEB AUDIO API ---
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    let audioCtx = null;
    let engineOsc = null;
    let engineGain = null;

    function initAudio() {
        if (!audioCtx) audioCtx = new AudioCtx();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        startEngineSound();
    }

    function startEngineSound() {
        if (!soundEnabled || engineOsc || !audioCtx) return;
        try {
            engineOsc = audioCtx.createOscillator();
            engineGain = audioCtx.createGain();
            engineOsc.type = 'sawtooth';
            engineOsc.frequency.setValueAtTime(54, audioCtx.currentTime);

            const filter = audioCtx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(160, audioCtx.currentTime);

            engineGain.gain.setValueAtTime(0.045, audioCtx.currentTime);

            engineOsc.connect(filter);
            filter.connect(engineGain);
            engineGain.connect(audioCtx.destination);
            engineOsc.start();
        } catch (e) {}
    }

    function updateEngineSound() {
        if (!engineOsc || !audioCtx || !soundEnabled) return;
        const targetFreq = 48 + (speed * 32);
        engineOsc.frequency.setTargetAtTime(targetFreq, audioCtx.currentTime, 0.08);
    }

    function stopEngineSound() {
        if (engineOsc) {
            try { engineOsc.stop(); engineOsc.disconnect(); } catch (e) {}
            engineOsc = null;
            engineGain = null;
        }
    }

    // Claxon / Bocina peruana
    function playHornSound() {
        if (!soundEnabled) return;
        initAudio();
        try {
            const now = audioCtx.currentTime;
            const osc1 = audioCtx.createOscillator();
            const osc2 = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            osc1.type = 'triangle';
            osc2.type = 'sawtooth';
            osc1.frequency.setValueAtTime(440, now);
            osc2.frequency.setValueAtTime(554.37, now);

            gain.gain.setValueAtTime(0.24, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(audioCtx.destination);

            osc1.start(now);
            osc2.start(now);
            osc1.stop(now + 0.3);
            osc2.stop(now + 0.3);
        } catch (e) {}

        scareNearbyAnimals();
    }

    function playBarkSound() {
        if (!soundEnabled || !audioCtx) return;
        try {
            const now = audioCtx.currentTime;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(320, now);
            osc.frequency.exponentialRampToValueAtTime(130, now + 0.12);
            gain.gain.setValueAtTime(0.14, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.13);
        } catch (e) {}
    }

    function playMeowSound() {
        if (!soundEnabled || !audioCtx) return;
        try {
            const now = audioCtx.currentTime;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(500, now);
            osc.frequency.linearRampToValueAtTime(800, now + 0.1);
            osc.frequency.exponentialRampToValueAtTime(400, now + 0.25);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.25);
        } catch (e) {}
    }

    function playBumpSound() {
        if (!soundEnabled || !audioCtx) return;
        try {
            const now = audioCtx.currentTime;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(95, now);
            osc.frequency.exponentialRampToValueAtTime(35, now + 0.18);
            gain.gain.setValueAtTime(0.18, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.18);
        } catch (e) {}
    }

    function playCoinSound() {
        if (!soundEnabled || !audioCtx) return;
        try {
            const now = audioCtx.currentTime;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1046.50, now);
            osc.frequency.setValueAtTime(1567.98, now + 0.08);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.28);
        } catch (e) {}
    }

    function playCrashSound() {
        if (!soundEnabled || !audioCtx) return;
        try {
            const now = audioCtx.currentTime;
            const bufferSize = audioCtx.sampleRate * 0.45;
            const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

            const noise = audioCtx.createBufferSource();
            noise.buffer = buffer;
            const filter = audioCtx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(650, now);
            filter.frequency.exponentialRampToValueAtTime(35, now + 0.45);

            const gain = audioCtx.createGain();
            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(audioCtx.destination);
            noise.start(now);
        } catch (e) {}
    }

    // --- INICIALIZACIÓN ---
    init();
    animate();

    function init() {
        const container = document.getElementById('game-container');
        scene = new THREE.Scene();
        
        // Cielo azul soleado norteño
        const skyColor = 0x62a4d9;
        scene.background = new THREE.Color(skyColor);
        scene.fog = new THREE.Fog(skyColor, 60, 320);

        renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(renderer.domElement);

        camera = new THREE.PerspectiveCamera(56, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 6.8, 13.5);

        // Luz solar
        const ambientLight = new THREE.AmbientLight(0xfff5e6, 0.78);
        scene.add(ambientLight);

        const sunLight = new THREE.DirectionalLight(0xffffff, 0.95);
        sunLight.position.set(45, 90, -50);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 1024;
        sunLight.shadow.mapSize.height = 1024;
        scene.add(sunLight);

        createSkyClouds();
        createTumanRoad();
        createAuthenticToritoMototaxi();

        // Generar edificios iniciales a ambos lados
        for (let z = -20; z > -320; z -= 28) {
            spawnCityRow(z);
        }

        // Generar el PRIMER obstáculo con margen de tiempo (a -85 unidades, ~4 segundos libres)
        spawnBalancedObstacle(-85);
        spawnBalancedObstacle(-160);
        spawnBalancedObstacle(-240);

        // Eventos
        window.addEventListener('resize', onWindowResize);
        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);
        
        if (btnSoundToggle) {
            btnSoundToggle.addEventListener('click', () => {
                soundEnabled = !soundEnabled;
                btnSoundToggle.innerHTML = soundEnabled ? '<i class="fas fa-volume-up"></i>' : '<i class="fas fa-volume-mute"></i>';
                btnSoundToggle.classList.toggle('muted', !soundEnabled);
                if (soundEnabled) initAudio(); else stopEngineSound();
            });
        }

        if (btnHorn) {
            btnHorn.addEventListener('touchstart', (e) => { e.preventDefault(); playHornSound(); });
            btnHorn.addEventListener('mousedown', playHornSound);
        }

        const btnLeft = document.getElementById('btn-left');
        const btnRight = document.getElementById('btn-right');
        if (btnLeft && btnRight) {
            btnLeft.addEventListener('touchstart', (e) => { e.preventDefault(); initAudio(); keys.ArrowLeft = true; });
            btnLeft.addEventListener('touchend', (e) => { e.preventDefault(); keys.ArrowLeft = false; });
            btnLeft.addEventListener('mousedown', () => { initAudio(); keys.ArrowLeft = true; });
            btnLeft.addEventListener('mouseup', () => keys.ArrowLeft = false);
            
            btnRight.addEventListener('touchstart', (e) => { e.preventDefault(); initAudio(); keys.ArrowRight = true; });
            btnRight.addEventListener('touchend', (e) => { e.preventDefault(); keys.ArrowRight = false; });
            btnRight.addEventListener('mousedown', () => { initAudio(); keys.ArrowRight = true; });
            btnRight.addEventListener('mouseup', () => keys.ArrowRight = false);
        }

        btnRestart.addEventListener('click', restartGame);
    }

    function createSkyClouds() {
        const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.82 });
        for (let i = 0; i < 18; i++) {
            const cloud = new THREE.Group();
            for (let j = 0; j < 4; j++) {
                const r = 5 + Math.random() * 7;
                const m = new THREE.Mesh(new THREE.SphereGeometry(r, 6, 6), cloudMat);
                m.position.set(j * 6, (Math.random()-0.5) * 3, (Math.random()-0.5) * 4);
                cloud.add(m);
            }
            cloud.position.set((Math.random() - 0.5) * 300, 55 + Math.random() * 30, -Math.random() * 400);
            scene.add(cloud);
            clouds.push(cloud);
        }
    }

    // --- CARRETERA Y ACERAS ---
    function createTumanRoad() {
        const groundGeo = new THREE.PlaneGeometry(350, 20000);
        const groundMat = new THREE.MeshLambertMaterial({ color: 0xc8b69b });
        ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.05;
        ground.receiveShadow = true;
        scene.add(ground);

        // Asfalto con el Sol y "Av. Micaela Bastidas"
        const canvasRoad = document.createElement('canvas');
        canvasRoad.width = 512; canvasRoad.height = 512;
        const ctx = canvasRoad.getContext('2d');
        
        ctx.fillStyle = '#42464c';
        ctx.fillRect(0, 0, 512, 512);

        for (let i = 0; i < 7000; i++) {
            ctx.fillStyle = Math.random() > 0.5 ? '#373a40' : '#4e525a';
            ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
        }

        // Sol pintado
        ctx.save();
        ctx.strokeStyle = 'rgba(235, 240, 250, 0.45)';
        ctx.lineWidth = 4;
        ctx.translate(256, 256);
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 10) {
            ctx.beginPath();
            ctx.moveTo(Math.cos(a) * 45, Math.sin(a) * 45);
            ctx.lineTo(Math.cos(a) * 110, Math.sin(a) * 110);
            ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(0, 0, 42, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = 'rgba(235, 240, 250, 0.65)';
        ctx.font = 'bold 22px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Av. Micaela Bastidas', 256, 320);

        // Bordillo amarillo y negro
        for (let y = 0; y < 512; y += 32) {
            ctx.fillStyle = (y / 32) % 2 === 0 ? '#ffcc00' : '#111111';
            ctx.fillRect(0, y, 16, 32);
            ctx.fillRect(496, y, 16, 32);
        }

        const roadTex = new THREE.CanvasTexture(canvasRoad);
        roadTex.wrapS = THREE.RepeatWrapping; roadTex.wrapT = THREE.RepeatWrapping;
        roadTex.repeat.set(1, 1000);

        const roadGeo = new THREE.PlaneGeometry(16, 20000);
        const roadMat = new THREE.MeshLambertMaterial({ map: roadTex });
        road = new THREE.Mesh(roadGeo, roadMat);
        road.rotation.x = -Math.PI / 2;
        road.receiveShadow = true;
        scene.add(road);

        // Aceras peatonales
        const sideGeo = new THREE.PlaneGeometry(7, 20000);
        const sideMat = new THREE.MeshLambertMaterial({ color: 0xc4c4c4 });
        
        const sideL = new THREE.Mesh(sideGeo, sideMat);
        sideL.rotation.x = -Math.PI / 2;
        sideL.position.set(-11.5, 0.08, 0);
        scene.add(sideL);

        const sideR = new THREE.Mesh(sideGeo, sideMat);
        sideR.rotation.x = -Math.PI / 2;
        sideR.position.set(11.5, 0.08, 0);
        scene.add(sideR);
    }

    // --- FILAS DE CIUDAD: CASAS DE VARIOS PISOS, TIENDAS Y BARES A AMBOS LADOS ---
    function spawnCityRow(zPos) {
        // Lado Izquierdo
        const bL = createPeruvianUrbanBuilding('left');
        bL.position.set(-19.5, 0, zPos);
        scene.add(bL);
        sceneryBuildings.push(bL);

        // Lado Derecho
        const bR = createPeruvianUrbanBuilding('right');
        bR.position.set(19.5, 0, zPos);
        scene.add(bR);
        sceneryBuildings.push(bR);

        // Props en la acera: Cajas de cerveza, postes con cables, toldos
        if (Math.random() > 0.4) {
            const side = Math.random() > 0.5 ? -1 : 1;
            const beer = createBeerCrates();
            beer.position.set(side * 8.8, 0.08, zPos + (Math.random() - 0.5) * 8);
            scene.add(beer);
            sidewalkProps.push(beer);
        }

        if (Math.random() > 0.5) {
            const side = Math.random() > 0.5 ? -1 : 1;
            const pole = createUtilityPole();
            pole.position.set(side * 9.5, 0, zPos);
            scene.add(pole);
            sidewalkProps.push(pole);
        }
    }

    // Edificio urbano de varios pisos (2, 3 o 4 pisos con bar/tienda/bodega abajo y azotea)
    function createPeruvianUrbanBuilding(side) {
        const group = new THREE.Group();
        const floors = 2 + Math.floor(Math.random() * 3); // 2 a 4 pisos
        const width = 8.5 + Math.random() * 3;
        const depth = 9.5 + Math.random() * 3;
        const floorHeight = 3.6;
        const totalHeight = floors * floorHeight;

        // Tipo de fachada: ladrillo visto sin tarrajear o pintada con color costeño
        const isExposedBrick = Math.random() > 0.55;
        let wallMat;
        if (isExposedBrick) {
            wallMat = new THREE.MeshLambertMaterial({ color: 0xb54c30 }); // Ladrillo arcilla
        } else {
            const colors = [0xf4d06f, 0xfff1e6, 0x90e0ef, 0xf7aef8, 0xd8e2dc];
            wallMat = new THREE.MeshLambertMaterial({ color: colors[Math.floor(Math.random() * colors.length)] });
        }

        const body = new THREE.Mesh(new THREE.BoxGeometry(width, totalHeight, depth), wallMat);
        body.position.y = totalHeight / 2;
        body.castShadow = true;
        group.add(body);

        // Columnas de concreto gris si es ladrillo
        if (isExposedBrick) {
            const colMat = new THREE.MeshLambertMaterial({ color: 0x8a8d94 });
            const colGeo = new THREE.BoxGeometry(0.55, totalHeight, 0.55);
            [-width/2 + 0.3, width/2 - 0.3].forEach(cx => {
                const col = new THREE.Mesh(colGeo, colMat);
                col.position.set(cx, totalHeight / 2, depth/2 - 0.3);
                group.add(col);
            });
        }

        // NEGOCIO EN EL PRIMER PISO (Bares, Tiendas, Pollerías, Cevicherías)
        const signFrontZ = (depth / 2 + 0.05);
        const canvasSign = document.createElement('canvas');
        canvasSign.width = 256; canvasSign.height = 64;
        const ctxS = canvasSign.getContext('2d');

        const businessTypes = [
            { bg: '#d90429', border: '#ffea00', t1: 'BAR LA OFICINA', t2: 'CERVEZA HELADITA 🍻' },
            { bg: '#0047ab', border: '#ffffff', t1: 'BODEGA Y BAZAR', t2: 'DOÑA ROSITA' },
            { bg: '#ff8500', border: '#111111', t1: 'POLLERÍA Y BRASAS', t2: 'EL RICO SABOR 🍗' },
            { bg: '#007f5f', border: '#ffffff', t1: 'BOTICA Y FARMACIA', t2: 'SALUD PARA TODOS' },
            { bg: '#582f0e', border: '#ffcc00', t1: 'BAR Y CANTINA', t2: 'EL DESPECHO' },
            { bg: '#03045e', border: '#00f3ff', t1: 'CEVICHERÍA', t2: 'EL HUARIQUE DEL NORTE' },
            { bg: '#333333', border: '#ffea00', t1: 'LLANTERÍA 24 HORAS', t2: 'PARCHES Y VULCA' }
        ];
        const biz = businessTypes[Math.floor(Math.random() * businessTypes.length)];

        ctxS.fillStyle = biz.bg;
        ctxS.fillRect(0, 0, 256, 64);
        ctxS.lineWidth = 5;
        ctxS.strokeStyle = biz.border;
        ctxS.strokeRect(3, 3, 250, 58);

        ctxS.fillStyle = '#ffffff';
        ctxS.font = 'bold 19px sans-serif';
        ctxS.textAlign = 'center';
        ctxS.fillText(biz.t1, 128, 28);
        ctxS.fillStyle = '#ffea00';
        ctxS.font = 'bold 15px sans-serif';
        ctxS.fillText(biz.t2, 128, 52);

        const signTex = new THREE.CanvasTexture(canvasSign);
        const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(width * 0.8, 1.3), new THREE.MeshBasicMaterial({ map: signTex }));
        signMesh.position.set(0, 3.2, (side === 'left' ? depth/2 + 0.05 : -depth/2 - 0.05));
        if (side === 'right') signMesh.rotation.y = Math.PI;
        group.add(signMesh);

        // Toldo a rayas en el primer piso
        const canvasToldo = document.createElement('canvas');
        canvasToldo.width = 128; canvasToldo.height = 64;
        const ctxT = canvasToldo.getContext('2d');
        const stripeColor = Math.random() > 0.5 ? '#d90429' : '#0047ab';
        for (let x = 0; x < 128; x += 16) {
            ctxT.fillStyle = (x / 16) % 2 === 0 ? stripeColor : '#ffffff';
            ctxT.fillRect(x, 0, 16, 64);
        }
        const toldoTex = new THREE.CanvasTexture(canvasToldo);
        const toldo = new THREE.Mesh(new THREE.PlaneGeometry(width * 0.75, 1.2), new THREE.MeshBasicMaterial({ map: toldoTex }));
        toldo.rotation.x = side === 'left' ? Math.PI / 4 : -Math.PI / 4;
        toldo.position.set(0, 2.3, (side === 'left' ? depth/2 + 0.45 : -depth/2 - 0.45));
        if (side === 'right') toldo.rotation.y = Math.PI;
        group.add(toldo);

        // Ventanas y balcones en pisos superiores
        const winMat = new THREE.MeshBasicMaterial({ color: 0x1b263b });
        for (let f = 1; f < floors; f++) {
            const winY = f * floorHeight + 1.8;
            const w1 = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.8), winMat);
            w1.position.set(-width/4, winY, (side === 'left' ? depth/2 + 0.03 : -depth/2 - 0.03));
            if (side === 'right') w1.rotation.y = Math.PI;
            const w2 = w1.clone();
            w2.position.x = width/4;
            group.add(w1);
            group.add(w2);

            // Baranda de balcón
            const railMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
            const rail = new THREE.Mesh(new THREE.BoxGeometry(width * 0.75, 0.8, 0.3), railMat);
            rail.position.set(0, f * floorHeight + 0.5, (side === 'left' ? depth/2 + 0.25 : -depth/2 - 0.25));
            group.add(rail);
        }

        // Azotea: Tanque de agua Rotoplas y fierros de construcción
        const tankColor = Math.random() > 0.4 ? 0x0047ab : 0x111111;
        const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 1.3, 12), new THREE.MeshLambertMaterial({ color: tankColor }));
        tank.position.set((Math.random() - 0.5) * (width * 0.4), totalHeight + 0.9, 0);
        group.add(tank);

        // Fierros de construcción en las 4 esquinas de la azotea
        const ironGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.5, 6);
        const ironMat = new THREE.MeshBasicMaterial({ color: 0x3d2c1d });
        [
            [-width/2 + 0.4, -depth/2 + 0.4],
            [width/2 - 0.4, -depth/2 + 0.4],
            [-width/2 + 0.4, depth/2 - 0.4],
            [width/2 - 0.4, depth/2 - 0.4]
        ].forEach(([ix, iz]) => {
            const rod = new THREE.Mesh(ironGeo, ironMat);
            rod.position.set(ix, totalHeight + 0.85, iz);
            group.add(rod);
        });

        // Orientar el frente del edificio hacia la pista
        if (side === 'right') {
            group.rotation.y = Math.PI;
        }

        return group;
    }

    // Cajas de cerveza apiladas afuera de los bares / bodegas (Clásico peruano)
    function createBeerCrates() {
        const group = new THREE.Group();
        const crateColor = Math.random() > 0.5 ? 0xffcc00 : 0xd90429; // Cerveza Cristal o Pilsen
        const crateMat = new THREE.MeshLambertMaterial({ color: crateColor });
        for (let y = 0; y < 3; y++) {
            for (let x = 0; x < 2; x++) {
                const crate = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.45, 0.55), crateMat);
                crate.position.set(x * 0.75, y * 0.48 + 0.24, 0);
                group.add(crate);
            }
        }
        return group;
    }

    // Poste de concreto con cruceta
    function createUtilityPole() {
        const poleGroup = new THREE.Group();
        const poleMat = new THREE.MeshLambertMaterial({ color: 0x7b7e84 });
        const pole = new THREE.Mesh(new THREE.BoxGeometry(0.4, 9.5, 0.4), poleMat);
        pole.position.y = 4.75;
        pole.castShadow = true;
        poleGroup.add(pole);

        const cross = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.2, 0.2), poleMat);
        cross.position.y = 8.8;
        poleGroup.add(cross);
        return poleGroup;
    }

    // --- MOTOTAXI TORITO ROJA Y NEGRA REAL (CON CHOFER) ---
    function createAuthenticToritoMototaxi() {
        mototaxi = new THREE.Group();
        mototaxi.position.set(0, 0, 0);
        scene.add(mototaxi);

        mototaxiBody = new THREE.Group();
        mototaxi.add(mototaxiBody);

        const toritoRed = new THREE.MeshLambertMaterial({ color: 0xc41e24 });
        const glossyBlack = new THREE.MeshLambertMaterial({ color: 0x141414 });
        const chromeMetal = new THREE.MeshLambertMaterial({ color: 0xd4d4d4 });
        const blackRubber = new THREE.MeshLambertMaterial({ color: 0x181818 });
        const glassMica = new THREE.MeshLambertMaterial({ color: 0x90caf9, transparent: true, opacity: 0.5 });
        const seatVinyl = new THREE.MeshLambertMaterial({ color: 0x212121 });

        // 1. CARROCERÍA TRASERA CURVA CON VENTANA TRASERA (MICA)
        const backWall = new THREE.Mesh(new THREE.BoxGeometry(3.3, 2.3, 0.2), toritoRed);
        backWall.position.set(0, 1.65, 1.8);
        backWall.castShadow = true;
        mototaxiBody.add(backWall);

        const backWindow = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.1), glassMica);
        backWindow.position.set(0, 1.85, 1.92);
        mototaxiBody.add(backWindow);

        const windowFrame = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.2, 0.05), glossyBlack);
        windowFrame.position.set(0, 1.85, 1.9);
        mototaxiBody.add(windowFrame);

        // Faros traseros y placa
        const tlMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const tlL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.25, 0.1), tlMat);
        tlL.position.set(-1.3, 0.9, 1.92);
        const tlR = tlL.clone(); tlR.position.x = 1.3;
        mototaxiBody.add(tlL); mototaxiBody.add(tlR);

        const canvasPlate = document.createElement('canvas');
        canvasPlate.width = 128; canvasPlate.height = 64;
        const ctxP = canvasPlate.getContext('2d');
        ctxP.fillStyle = '#ffcc00'; ctxP.fillRect(0, 0, 128, 64);
        ctxP.fillStyle = '#000000'; ctxP.font = 'bold 20px sans-serif'; ctxP.textAlign = 'center';
        ctxP.fillText('PERÚ', 64, 22); ctxP.fillText('M5-4291', 64, 52);
        const plateTex = new THREE.CanvasTexture(canvasPlate);
        const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.42), new THREE.MeshBasicMaterial({ map: plateTex }));
        plate.position.set(0, 0.7, 1.93);
        mototaxiBody.add(plate);

        const bumper = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.25, 0.3), glossyBlack);
        bumper.position.set(0, 0.45, 1.85);
        mototaxiBody.add(bumper);

        // 2. LADOS ABIERTOS Y BARRAS ANTIVUELCO
        const barGeo = new THREE.CylinderGeometry(0.05, 0.05, 2.1);
        const barL = new THREE.Mesh(barGeo, glossyBlack);
        barL.position.set(-1.6, 1.7, 0.2);
        const barR = barL.clone(); barR.position.x = 1.6;
        mototaxiBody.add(barL); mototaxiBody.add(barR);

        const passengerSeat = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.5, 1.1), seatVinyl);
        passengerSeat.position.set(0, 0.85, 1.0);
        mototaxiBody.add(passengerSeat);

        // 3. TECHO NEGRO SLOPED / CURVADO
        const roof = new THREE.Mesh(new THREE.BoxGeometry(3.45, 0.22, 4.4), glossyBlack);
        roof.position.set(0, 2.85, 0.1);
        roof.castShadow = true;
        mototaxiBody.add(roof);

        const roofTrim = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.08, 4.45), toritoRed);
        roofTrim.position.set(0, 2.76, 0.1);
        mototaxiBody.add(roofTrim);

        // 4. PARABRISAS DELANTERO
        const frontWindshield = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 1.6), glassMica);
        frontWindshield.position.set(0, 2.0, -1.8);
        frontWindshield.rotation.x = -Math.PI / 8;
        mototaxiBody.add(frontWindshield);

        // 5. ASIENTO DEL CHOFER Y CHOFER 3D
        const driverSeat = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 0.9), seatVinyl);
        driverSeat.position.set(0, 0.9, -0.6);
        mototaxiBody.add(driverSeat);

        choferGroup = new THREE.Group();
        choferGroup.position.set(0, 1.1, -0.6);

        const torso = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.0, 0.5), new THREE.MeshLambertMaterial({ color: 0xffffff }));
        torso.position.y = 0.5; torso.castShadow = true;
        choferGroup.add(torso);

        const skinMat = new THREE.MeshLambertMaterial({ color: 0xc68642 });
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 10), skinMat);
        head.position.set(0, 1.25, 0);
        choferGroup.add(head);

        const capMat = new THREE.MeshLambertMaterial({ color: 0xc41e24 });
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.15, 10), capMat);
        cap.position.set(0, 1.45, 0);
        const visor = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.05, 0.3), capMat);
        visor.position.set(0, 1.45, 0.25);
        choferGroup.add(cap); choferGroup.add(visor);

        const armGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.9);
        const armL = new THREE.Mesh(armGeo, skinMat);
        armL.position.set(-0.55, 0.5, -0.4); armL.rotation.x = -Math.PI / 3; armL.rotation.z = -Math.PI / 6;
        const armR = new THREE.Mesh(armGeo, skinMat);
        armR.position.set(0.55, 0.5, -0.4); armR.rotation.x = -Math.PI / 3; armR.rotation.z = Math.PI / 6;
        choferGroup.add(armL); choferGroup.add(armR);

        mototaxiBody.add(choferGroup);

        // 6. HORQUILLA DELANTERA & RUEDA
        frontFork = new THREE.Group();
        frontFork.position.set(0, 0.7, -1.9);
        mototaxiBody.add(frontFork);

        const barH = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.7), chromeMetal);
        barH.rotation.z = Math.PI / 2; barH.position.set(0, 0.85, 0.2);
        frontFork.add(barH);

        const fender = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 0.45, 12, 1, false, 0, Math.PI), toritoRed);
        fender.rotation.z = Math.PI / 2; fender.position.set(0, 0.3, 0);
        frontFork.add(fender);

        const headlightGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 16);
        headlightGeo.rotateX(Math.PI / 2);
        const headlight = new THREE.Mesh(headlightGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }));
        headlight.position.set(0, 0.75, -0.2);
        frontFork.add(headlight);

        const beam = new THREE.SpotLight(0xfffae0, 2.5, 45, Math.PI / 5, 0.5, 1);
        beam.position.set(0, 0.9, -0.3);
        beam.target.position.set(0, 0, -25);
        frontFork.add(beam); frontFork.add(beam.target);

        function buildWheel() {
            const wGroup = new THREE.Group();
            const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.42, 16).rotateZ(Math.PI/2), blackRubber);
            tire.castShadow = true;
            const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.44, 16).rotateZ(Math.PI/2), chromeMetal);
            wGroup.add(tire); wGroup.add(rim);
            return wGroup;
        }

        frontWheel = buildWheel();
        frontWheel.position.set(0, -0.1, 0);
        frontFork.add(frontWheel);

        rearLeftWheel = buildWheel();
        rearLeftWheel.position.set(-1.65, 0.62, 1.3);
        mototaxiBody.add(rearLeftWheel);

        rearRightWheel = buildWheel();
        rearRightWheel.position.set(1.65, 0.62, 1.3);
        mototaxiBody.add(rearRightWheel);

        const rearFenderGeo = new THREE.BoxGeometry(0.6, 0.5, 1.3);
        const rfL = new THREE.Mesh(rearFenderGeo, toritoRed);
        rfL.position.set(-1.65, 0.85, 1.3);
        const rfR = rfL.clone(); rfR.position.x = 1.65;
        mototaxiBody.add(rfL); mototaxiBody.add(rfR);

        // Tubo de escape
        const pipeGeo = new THREE.CylinderGeometry(0.07, 0.07, 1.2);
        pipeGeo.rotateX(Math.PI / 2);
        exhaustPipe = new THREE.Mesh(pipeGeo, chromeMetal);
        exhaustPipe.position.set(1.4, 0.35, 1.8);
        mototaxiBody.add(exhaustPipe);

        // Banderita del Perú
        const canvasFlag = document.createElement('canvas');
        canvasFlag.width = 96; canvasFlag.height = 64;
        const ctxFlag = canvasFlag.getContext('2d');
        ctxFlag.fillStyle = '#d90429'; ctxFlag.fillRect(0, 0, 32, 64);
        ctxFlag.fillStyle = '#ffffff'; ctxFlag.fillRect(32, 0, 32, 64);
        ctxFlag.fillStyle = '#d90429'; ctxFlag.fillRect(64, 0, 32, 64);
        const flagTex = new THREE.CanvasTexture(canvasFlag);
        peruvianFlag = new THREE.Mesh(new THREE.PlaneGeometry(0.65, 0.42), new THREE.MeshBasicMaterial({ map: flagTex, side: THREE.DoubleSide }));
        peruvianFlag.position.set(1.8, 3.8, 1.8);
        mototaxiBody.add(peruvianFlag);

        const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.8), chromeMetal);
        mast.position.set(1.45, 3.3, 1.8);
        mototaxiBody.add(mast);

        // Loader opcional si el usuario pone un .glb en modelos/mototaxi.glb
        if (typeof THREE.GLTFLoader !== 'undefined') {
            const loader = new THREE.GLTFLoader();
            loader.load('modelos/mototaxi.glb', function(gltf) {
                const extModel = gltf.scene;
                const box = new THREE.Box3().setFromObject(extModel);
                const size = box.getSize(new THREE.Vector3());
                const scale = 5.5 / Math.max(size.x, size.y, size.z);
                extModel.scale.set(scale, scale, scale);
                mototaxi.remove(mototaxiBody);
                mototaxi.add(extModel);
            }, undefined, function() {});
        }
    }

    // --- MONEDAS DE SOLES ---
    function spawnSoles(zPos) {
        const lanes = [-5.0, -2.5, 0, 2.5, 5.0];
        const lane = lanes[Math.floor(Math.random() * lanes.length)];

        const coinGroup = new THREE.Group();
        const canvasCoin = document.createElement('canvas');
        canvasCoin.width = 128; canvasCoin.height = 128;
        const ctxC = canvasCoin.getContext('2d');
        ctxC.fillStyle = '#ffcc00'; ctxC.beginPath(); ctxC.arc(64, 64, 60, 0, Math.PI * 2); ctxC.fill();
        ctxC.lineWidth = 6; ctxC.strokeStyle = '#b8860b'; ctxC.stroke();
        ctxC.fillStyle = '#5c4033'; ctxC.font = 'bold 36px sans-serif'; ctxC.textAlign = 'center';
        ctxC.fillText('S/.', 64, 76);

        const coinTex = new THREE.CanvasTexture(canvasCoin);
        const coinMat = new THREE.MeshLambertMaterial({ map: coinTex, emissive: 0xaa7700, emissiveIntensity: 0.3 });
        const coinMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.12, 16).rotateX(Math.PI/2), coinMat);
        coinGroup.add(coinMesh);

        coinGroup.position.set(lane, 1.2, zPos);
        coinGroup.userData = { collected: false };
        scene.add(coinGroup);
        collectibles.push(coinGroup);
    }

    // --- OBSTÁCULOS VARIADOS PERUANOS (PERROS, GATOS, CARROS TICO, MOTOS, BICICLETAS, BASURA) ---
    function spawnBalancedObstacle(zPos) {
        const rand = Math.random();
        let obs = new THREE.Group();
        let type = 'crash';

        const lanes = [-5.0, -2.5, 0, 2.5, 5.0];
        const lane = lanes[Math.floor(Math.random() * lanes.length)];

        if (rand < 0.20) {
            // 1. FIRULAIS (Perrito callejero)
            const dog = createFirulais();
            obs.add(dog);
            type = 'perrito';
        }
        else if (rand < 0.35) {
            // 2. MICHI (Gato callejero que cruza ágil)
            const cat = createCat();
            obs.add(cat);
            type = 'gato';
        }
        else if (rand < 0.52) {
            // 3. TICO AMARILLO / AUTO TAXI PERUANO
            const tico = createTicoCar();
            obs.add(tico);
            type = 'tico';
        }
        else if (rand < 0.68) {
            // 4. MOTO LINEAL CON MOTOCICLISTA
            const moto = createLinearMoto();
            obs.add(moto);
            type = 'moto_lineal';
        }
        else if (rand < 0.82) {
            // 5. BICICLETA DE TRABAJO (PANADERO / VENDEDOR)
            const bike = createBicycle();
            obs.add(bike);
            type = 'bicicleta';
        }
        else if (rand < 0.92) {
            // 6. MONTÍCULO DE BASURA Y DESMONTE EN LA CALLE
            const trash = createTrashPile();
            obs.add(trash);
            type = 'basura';
        }
        else {
            // 7. ROMPEMUELLE AMARILLO Y NEGRO
            const bumpMat = new THREE.MeshLambertMaterial({ color: 0xffcc00 });
            const bump = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 5.6, 16).rotateZ(Math.PI/2), bumpMat);
            bump.position.y = 0.18;
            obs.add(bump);
            type = 'rompemuelle';
        }

        obs.position.set(lane, 0, zPos);
        obs.userData = { type: type, hit: false, scared: false };
        scene.add(obs);
        obstacles.push(obs);

        // Monedas Soles espaciadas
        if (Math.random() > 0.4) spawnSoles(zPos - 18);
    }

    // 🐕 Firulais
    function createFirulais() {
        const dog = new THREE.Group();
        const caramelMat = new THREE.MeshLambertMaterial({ color: 0xc68642 });
        const darkMat = new THREE.MeshBasicMaterial({ color: 0x221100 });

        const body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 1.1), caramelMat);
        body.position.y = 0.6; body.castShadow = true;
        dog.add(body);

        const head = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.4, 0.45), caramelMat);
        head.position.set(0, 0.95, -0.55);
        dog.add(head);

        const snout = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.2, 0.3), darkMat);
        snout.position.set(0, 0.88, -0.78);
        dog.add(snout);

        const legGeo = new THREE.BoxGeometry(0.16, 0.48, 0.16);
        const lFL = new THREE.Mesh(legGeo, caramelMat);
        lFL.position.set(-0.18, 0.24, -0.35);
        const lFR = lFL.clone(); lFR.position.x = 0.18;
        const lBL = lFL.clone(); lBL.position.z = 0.35;
        const lBR = lFR.clone(); lBR.position.z = 0.35;
        dog.add(lFL); dog.add(lFR); dog.add(lBL); dog.add(lBR);

        const tail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.3, 0.08), caramelMat);
        tail.position.set(0, 0.85, 0.6);
        tail.rotation.x = -Math.PI / 4;
        dog.add(tail);
        return dog;
    }

    // 🐈 Gato callejero ("Michi")
    function createCat() {
        const cat = new THREE.Group();
        const catMat = new THREE.MeshLambertMaterial({ color: 0x1f1f1f }); // Gato negro/gris
        const eyesMat = new THREE.MeshBasicMaterial({ color: 0x76c893 });

        const body = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.75), catMat);
        body.position.y = 0.38; body.castShadow = true;
        cat.add(body);

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), catMat);
        head.position.set(0, 0.62, -0.4);
        cat.add(head);

        // Orejitas
        const earGeo = new THREE.ConeGeometry(0.08, 0.18, 4);
        const earL = new THREE.Mesh(earGeo, catMat);
        earL.position.set(-0.12, 0.85, -0.4);
        const earR = earL.clone(); earR.position.x = 0.12;
        cat.add(earL); cat.add(earR);

        // Cola erguida
        const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5), catMat);
        tail.position.set(0, 0.65, 0.4);
        tail.rotation.x = Math.PI / 6;
        cat.add(tail);
        return cat;
    }

    // 🚕 Auto Tico Amarillo (El clásico taxi de provincia peruana)
    function createTicoCar() {
        const tico = new THREE.Group();
        const yellowMat = new THREE.MeshLambertMaterial({ color: 0xffea00 });
        const blackMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
        const glassMat = new THREE.MeshLambertMaterial({ color: 0x77b5fe, transparent: true, opacity: 0.6 });

        // Chasis del Tico compacto
        const body = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.4, 3.8), yellowMat);
        body.position.y = 1.0; body.castShadow = true;
        tico.add(body);

        // Cabina superior
        const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.1, 2.3), yellowMat);
        cabin.position.set(0, 2.1, 0.1);
        tico.add(cabin);

        // Parabrisas
        const ws = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 1.0), glassMat);
        ws.position.set(0, 2.1, -1.06); ws.rotation.x = -Math.PI / 10;
        tico.add(ws);

        // Letrero TAXI en el techo
        const taxiSign = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.35, 0.35), new THREE.MeshBasicMaterial({ color: 0xffffff }));
        taxiSign.position.set(0, 2.8, 0.1);
        tico.add(taxiSign);

        // 4 Ruedas
        function makeTire(x, z) {
            const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.35).rotateZ(Math.PI/2), blackMat);
            tire.position.set(x, 0.48, z);
            return tire;
        }
        tico.add(makeTire(-1.45, -1.1));
        tico.add(makeTire(1.45, -1.1));
        tico.add(makeTire(-1.45, 1.1));
        tico.add(makeTire(1.45, 1.1));

        tico.rotation.y = Math.PI; // Viene de frente
        return tico;
    }

    // 🏍️ Moto lineal peruana con motociclista
    function createLinearMoto() {
        const moto = new THREE.Group();
        const redMat = new THREE.MeshLambertMaterial({ color: 0xd90429 });
        const blackMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
        const chromeMat = new THREE.MeshLambertMaterial({ color: 0xcccccc });

        // Cuadro y tanque
        const frame = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 2.2), redMat);
        frame.position.y = 0.9;
        moto.add(frame);

        // Ruedas delantera y trasera
        const wF = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.22).rotateZ(Math.PI/2), blackMat);
        wF.position.set(0, 0.55, -1.1);
        const wR = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.22).rotateZ(Math.PI/2), blackMat);
        wR.position.set(0, 0.55, 1.1);
        moto.add(wF); moto.add(wR);

        // Manubrio y faro
        const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.3), chromeMat);
        bar.rotation.z = Math.PI / 2; bar.position.set(0, 1.5, -0.9);
        moto.add(bar);

        // Motociclista con casco
        const rider = new THREE.Group();
        rider.position.set(0, 1.2, 0.1);
        const rTorso = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.8, 0.4), new THREE.MeshLambertMaterial({ color: 0x1d3557 }));
        rTorso.position.y = 0.4;
        const rHelmet = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), new THREE.MeshLambertMaterial({ color: 0xffea00 }));
        rHelmet.position.set(0, 1.05, 0);
        rider.add(rTorso); rider.add(rHelmet);
        moto.add(rider);

        moto.rotation.y = Math.PI;
        return moto;
    }

    // 🚲 Bicicleta de panadero / trabajador
    function createBicycle() {
        const bike = new THREE.Group();
        const frameMat = new THREE.MeshLambertMaterial({ color: 0x0077b6 });
        const blackMat = new THREE.MeshLambertMaterial({ color: 0x111111 });

        const barF = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.6), frameMat);
        barF.rotation.x = Math.PI / 2; barF.position.y = 0.8;
        bike.add(barF);

        // Ruedas delgadas
        const w1 = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.08).rotateZ(Math.PI/2), blackMat);
        w1.position.set(0, 0.52, -0.9);
        const w2 = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.08).rotateZ(Math.PI/2), blackMat);
        w2.position.set(0, 0.52, 0.9);
        bike.add(w1); bike.add(w2);

        // Canastilla o caja de pan en la parte trasera
        const box = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.7), new THREE.MeshLambertMaterial({ color: 0xc89f65 }));
        box.position.set(0, 1.1, 0.9);
        bike.add(box);

        // Ciclista
        const cyclist = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.8, 0.35), new THREE.MeshLambertMaterial({ color: 0xe63946 }));
        cyclist.position.set(0, 1.4, 0.0);
        const cHead = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), new THREE.MeshLambertMaterial({ color: 0xc68642 }));
        cHead.position.set(0, 2.0, 0.0);
        bike.add(cyclist); bike.add(cHead);

        bike.rotation.y = Math.PI;
        return bike;
    }

    // 🗑️ Montículo de basura y desmonte (Típico en esquinas peruanas)
    function createTrashPile() {
        const pile = new THREE.Group();
        const trashMat1 = new THREE.MeshLambertMaterial({ color: 0x1a1a1a }); // Bolsa negra
        const trashMat2 = new THREE.MeshLambertMaterial({ color: 0x0047ab }); // Bolsa azul
        const rubbleMat = new THREE.MeshLambertMaterial({ color: 0xa89f91 }); // Desmonte/cemento

        // Bolsas de basura
        for (let i = 0; i < 4; i++) {
            const bag = new THREE.Mesh(new THREE.SphereGeometry(0.4 + Math.random() * 0.2, 7, 7), i % 2 === 0 ? trashMat1 : trashMat2);
            bag.scale.set(1.2, 0.8, 1.0);
            bag.position.set((Math.random() - 0.5) * 1.4, 0.3, (Math.random() - 0.5) * 1.2);
            pile.add(bag);
        }

        // Piedras / desmonte
        const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5), rubbleMat);
        rock.position.set(0.6, 0.35, 0);
        pile.add(rock);

        // Caja de cartón
        const box = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.7), new THREE.MeshLambertMaterial({ color: 0xbc8a5f }));
        box.position.set(-0.6, 0.3, 0.2);
        pile.add(box);

        return pile;
    }

    function scareNearbyAnimals() {
        obstacles.forEach(obs => {
            if ((obs.userData.type === 'perrito' || obs.userData.type === 'gato') && !obs.userData.scared) {
                const dist = Math.abs(obs.position.z - mototaxi.position.z);
                if (dist < 45) {
                    obs.userData.scared = true;
                    if (obs.userData.type === 'perrito') playBarkSound();
                    else playMeowSound();
                }
            }
        });
    }

    function emitSmoke() {
        if (!exhaustPipe) return;
        const smokeGeo = new THREE.SphereGeometry(0.12, 6, 6);
        const smokeMat = new THREE.MeshBasicMaterial({ color: 0x888888, transparent: true, opacity: 0.55 });
        const p = new THREE.Mesh(smokeGeo, smokeMat);
        const pos = new THREE.Vector3();
        exhaustPipe.getWorldPosition(pos);
        p.position.copy(pos);
        p.position.z += 0.35;
        scene.add(p);
        smokeParticles.push({ mesh: p, life: 1.0, vx: (Math.random()-0.5)*0.02, vy: 0.03 });
    }

    function onKeyDown(e) {
        initAudio();
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.ArrowLeft = true;
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.ArrowRight = true;
        if (e.key === 'h' || e.key === 'H' || e.code === 'Space') {
            e.preventDefault();
            playHornSound();
        }
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

    // --- GAME LOOP ---
    function animate() {
        if (isGameOver) return;
        requestAnimationFrame(animate);

        const now = Date.now() * 0.001;
        updateEngineSound();

        // 1. Conducción con giro suave
        const steerSpeed = 0.28 + (speed * 0.08);
        if (keys.ArrowLeft && mototaxi.position.x > -6.5) {
            mototaxi.position.x -= steerSpeed;
            steerAngle = 0.32;
            mototaxiBody.rotation.z = THREE.MathUtils.lerp(mototaxiBody.rotation.z, 0.16, 0.15);
            if (choferGroup) choferGroup.rotation.z = 0.12;
        } else if (keys.ArrowRight && mototaxi.position.x < 6.5) {
            mototaxi.position.x += steerSpeed;
            steerAngle = -0.32;
            mototaxiBody.rotation.z = THREE.MathUtils.lerp(mototaxiBody.rotation.z, -0.16, 0.15);
            if (choferGroup) choferGroup.rotation.z = -0.12;
        } else {
            steerAngle = 0;
            mototaxiBody.rotation.z = THREE.MathUtils.lerp(mototaxiBody.rotation.z, 0, 0.12);
            if (choferGroup) choferGroup.rotation.z = 0;
        }

        if (frontFork) frontFork.rotation.y = THREE.MathUtils.lerp(frontFork.rotation.y, steerAngle, 0.22);

        // 2. Giro de ruedas
        const spin = speed * 0.22;
        if (frontWheel) frontWheel.rotation.x += spin;
        if (rearLeftWheel) rearLeftWheel.rotation.x += spin;
        if (rearRightWheel) rearRightWheel.rotation.x += spin;

        // 3. Vibración de motor y rebotes
        engineVibration = Math.sin(now * 38) * 0.015;
        if (mototaxi.position.y > 0 || bumpVelocity > 0) {
            mototaxi.position.y += bumpVelocity;
            bumpVelocity -= 0.022;
            mototaxiBody.rotation.x = THREE.MathUtils.lerp(mototaxiBody.rotation.x, -0.2, 0.12);
            if (mototaxi.position.y <= 0) {
                mototaxi.position.y = 0;
                bumpVelocity = 0;
                mototaxiBody.rotation.x = 0;
            }
        } else {
            mototaxiBody.position.y = engineVibration;
            mototaxiBody.rotation.x = THREE.MathUtils.lerp(mototaxiBody.rotation.x, 0, 0.1);
        }

        // 4. Bandera flameando
        if (peruvianFlag) {
            peruvianFlag.rotation.y = Math.sin(now * 14) * 0.28;
            peruvianFlag.rotation.z = Math.cos(now * 10) * 0.08;
        }

        // 5. Humo
        if (Math.random() > 0.5) emitSmoke();
        for (let i = smokeParticles.length - 1; i >= 0; i--) {
            const sp = smokeParticles[i];
            sp.mesh.position.x += sp.vx;
            sp.mesh.position.y += sp.vy;
            sp.mesh.position.z += speed * 0.3;
            sp.mesh.scale.multiplyScalar(1.05);
            sp.life -= 0.035;
            sp.mesh.material.opacity = sp.life * 0.5;
            if (sp.life <= 0) {
                scene.remove(sp.mesh);
                smokeParticles.splice(i, 1);
            }
        }

        // 6. Avance constante y aceleración suave
        mototaxi.position.z -= speed;
        score += speed * 0.12;
        speed += 0.0002; // Aceleración muy progresiva

        scoreDisplay.innerText = Math.floor(score);
        if (speedDisplay) speedDisplay.innerText = Math.floor(25 + speed * 18);

        // Cámara
        camera.position.z = mototaxi.position.z + 13.5;
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, mototaxi.position.x * 0.45, 0.08);
        camera.position.y = mototaxi.position.y + 6.8;

        // 7. Generación balanceada de obstáculos (cada 55 a 85 metros de distancia)
        if (obstacles.length < 10) {
            const lastZ = obstacles.length > 0 ? obstacles[obstacles.length-1].position.z : mototaxi.position.z;
            spawnBalancedObstacle(lastZ - 55 - Math.random() * 35);
        }

        if (sceneryBuildings.length < 20) {
            const lastBZ = sceneryBuildings.length > 0 ? sceneryBuildings[sceneryBuildings.length-1].position.z : mototaxi.position.z;
            spawnCityRow(lastBZ - 28);
        }

        // 8. Colisiones y comportamiento de obstáculos
        const taxiBox = new THREE.Box3().setFromObject(mototaxi);
        taxiBox.expandByScalar(-0.4);

        for (let i = obstacles.length - 1; i >= 0; i--) {
            const obs = obstacles[i];

            // Animales cruzando o huyendo
            if (obs.userData.type === 'perrito') {
                if (obs.userData.scared) obs.position.x += 0.22;
                else obs.position.x += Math.sin(now * 3 + obs.position.z) * 0.03;
            } else if (obs.userData.type === 'gato') {
                if (obs.userData.scared) obs.position.x += 0.32;
                else obs.position.x += Math.sin(now * 4 + obs.position.z) * 0.04;
            } else if (obs.userData.type === 'tico' || obs.userData.type === 'moto_lineal' || obs.userData.type === 'bicicleta') {
                // Vehículos avanzando en sentido contrario
                obs.position.z += 0.2;
            }

            if (!obs.userData.hit) {
                const obsBox = new THREE.Box3().setFromObject(obs);
                if (obs.userData.type === 'rompemuelle') obsBox.max.y = 0.9;

                if (taxiBox.intersectsBox(obsBox)) {
                    if (obs.userData.type === 'rompemuelle') {
                        bumpVelocity = 0.34;
                        speed = Math.max(0.65, speed - 0.15);
                        playBumpSound();
                        obs.userData.hit = true;
                    } else {
                        playCrashSound();
                        triggerGameOver();
                        return;
                    }
                }
            }

            if (obs.position.z > camera.position.z + 10) {
                scene.remove(obs);
                obstacles.splice(i, 1);
            }
        }

        // 9. Monedas
        for (let i = collectibles.length - 1; i >= 0; i--) {
            const coin = collectibles[i];
            coin.rotation.y += 0.06;

            if (!coin.userData.collected) {
                const coinBox = new THREE.Box3().setFromObject(coin);
                if (taxiBox.intersectsBox(coinBox)) {
                    coin.userData.collected = true;
                    solesCollected += 50;
                    score += 80;
                    if (coinsDisplay) coinsDisplay.innerText = solesCollected;
                    scoreDisplay.innerText = Math.floor(score);
                    playCoinSound();
                    scene.remove(coin);
                    collectibles.splice(i, 1);
                    continue;
                }
            }

            if (coin.position.z > camera.position.z + 10) {
                scene.remove(coin);
                collectibles.splice(i, 1);
            }
        }

        // Limpieza de edificios lejanos
        for (let i = sceneryBuildings.length - 1; i >= 0; i--) {
            if (sceneryBuildings[i].position.z > camera.position.z + 30) {
                scene.remove(sceneryBuildings[i]);
                sceneryBuildings.splice(i, 1);
            }
        }
        for (let i = sidewalkProps.length - 1; i >= 0; i--) {
            if (sidewalkProps[i].position.z > camera.position.z + 30) {
                scene.remove(sidewalkProps[i]);
                sidewalkProps.splice(i, 1);
            }
        }

        renderer.render(scene, camera);
    }

    // --- GAME OVER & REINICIO ---
    function triggerGameOver() {
        isGameOver = true;
        stopEngineSound();
        gameOverScreen.classList.remove('hidden');
        finalScoreDisplay.innerText = Math.floor(score);
        if (finalCoinsDisplay) finalCoinsDisplay.innerText = solesCollected;
    }

    function restartGame() {
        isGameOver = false;
        score = 0;
        solesCollected = 0;
        speed = 0.65;
        bumpVelocity = 0;
        steerAngle = 0;

        mototaxi.position.set(0, 0, 0);
        mototaxi.rotation.set(0, 0, 0);
        mototaxiBody.rotation.set(0, 0, 0);
        camera.position.set(0, 6.8, 13.5);

        scoreDisplay.innerText = '0';
        if (coinsDisplay) coinsDisplay.innerText = '0';
        if (speedDisplay) speedDisplay.innerText = '25';

        obstacles.forEach(o => scene.remove(o));
        obstacles = [];
        collectibles.forEach(c => scene.remove(c));
        collectibles = [];
        smokeParticles.forEach(p => scene.remove(p.mesh));
        smokeParticles = [];

        // Generar primeros obstáculos espaciados
        spawnBalancedObstacle(-85);
        spawnBalancedObstacle(-160);
        spawnBalancedObstacle(-240);

        gameOverScreen.classList.add('hidden');
        initAudio();
        animate();
    }

})();
