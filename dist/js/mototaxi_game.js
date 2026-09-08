// 🛺 Mototaxi 3D Simulator - V4 (Camino delimitado y Cerros)

(function() {
    // Variables principales
    let scene, camera, renderer;
    let mototaxi, road, ground;
    let obstacles = [];
    let mountains = [];
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
        scene.fog = new THREE.Fog(0xd2b48c, 30, 250);

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

        // Crear el mundo y mototaxi
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
        // 1. TERRENO EXTERIOR (Tierra/Pasto)
        const canvasDirt = document.createElement('canvas');
        canvasDirt.width = 512; canvasDirt.height = 512;
        const ctxDirt = canvasDirt.getContext('2d');
        ctxDirt.fillStyle = '#6b4226';
        ctxDirt.fillRect(0, 0, 512, 512);
        for(let i = 0; i < 20000; i++) {
            ctxDirt.fillStyle = Math.random() > 0.5 ? '#8b5a2b' : '#556b2f';
            ctxDirt.fillRect(Math.random()*512, Math.random()*512, 3, 3);
        }
        const dirtTex = new THREE.CanvasTexture(canvasDirt);
        dirtTex.wrapS = THREE.RepeatWrapping; dirtTex.wrapT = THREE.RepeatWrapping;
        dirtTex.repeat.set(50, 1000);

        const groundGeo = new THREE.PlaneGeometry(400, 20000);
        const groundMat = new THREE.MeshLambertMaterial({ map: dirtTex });
        ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.1;
        ground.receiveShadow = true;
        scene.add(ground);

        // 2. PISTA CENTRAL (Trocha delimitada)
        const canvasRoad = document.createElement('canvas');
        canvasRoad.width = 512; canvasRoad.height = 512;
        const ctxRoad = canvasRoad.getContext('2d');
        ctxRoad.fillStyle = '#9e8c78'; 
        ctxRoad.fillRect(0, 0, 512, 512);
        for(let i = 0; i < 10000; i++) {
            ctxRoad.fillStyle = Math.random() > 0.5 ? '#c3b091' : '#8b7355';
            ctxRoad.fillRect(Math.random()*512, Math.random()*512, 2, 2);
        }
        // Bordes más oscuros para delimitar
        ctxRoad.fillStyle = '#4a3b2c';
        ctxRoad.fillRect(0, 0, 15, 512);
        ctxRoad.fillRect(497, 0, 15, 512);

        const roadTex = new THREE.CanvasTexture(canvasRoad);
        roadTex.wrapS = THREE.RepeatWrapping; roadTex.wrapT = THREE.RepeatWrapping;
        roadTex.repeat.set(1, 1000);

        const roadGeo = new THREE.PlaneGeometry(16, 20000);
        const roadMat = new THREE.MeshLambertMaterial({ map: roadTex });
        road = new THREE.Mesh(roadGeo, roadMat);
        road.rotation.x = -Math.PI / 2;
        road.receiveShadow = true;
        scene.add(road);
    }

    function spawnMountain(zPos) {
        const sides = Math.floor(Math.random() * 3) + 4;
        const radius = 30 + Math.random() * 60;
        const height = 40 + Math.random() * 80;
        
        const geo = new THREE.ConeGeometry(radius, height, sides);
        const color = new THREE.Color().setHSL(0.08, 0.4, 0.3 + Math.random() * 0.1);
        const mat = new THREE.MeshLambertMaterial({ color: color, flatShading: true });
        
        const mtn = new THREE.Mesh(geo, mat);
        
        // Alejar los cerros dependiendo de su radio para que NO invadan la pista (ancho 16)
        const side = Math.random() > 0.5 ? 1 : -1;
        const margin = 20; // Espacio libre desde el centro
        const xPos = side * (radius + margin + Math.random() * 50);
        
        mtn.position.set(xPos, height / 2 - 5, zPos);
        scene.add(mtn);
        mountains.push(mtn);
    }

    function createPolishedMototaxi() {
        mototaxi = new THREE.Group();
        mototaxi.position.set(0, 0, 0);
        scene.add(mototaxi);

        // --- MODELO TEMPORAL (MIENTRAS CARGA EL 3D REAL) ---
        const placeholderGroup = new THREE.Group();
        const chassisMat = new THREE.MeshLambertMaterial({ color: 0xcc0000 });
        const roofMat = new THREE.MeshLambertMaterial({ color: 0xeeeeee });
        const blackMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
        const glassMat = new THREE.MeshLambertMaterial({ color: 0xaaddff, transparent: true, opacity: 0.6 });
        const metalMat = new THREE.MeshLambertMaterial({ color: 0x888888 });

        const cabin = new THREE.Mesh(new THREE.BoxGeometry(3.5, 2.5, 3.5), chassisMat);
        cabin.position.set(0, 1.75, 1);
        cabin.castShadow = true;
        placeholderGroup.add(cabin);

        const roof = new THREE.Mesh(new THREE.BoxGeometry(3.7, 0.2, 5.5), roofMat);
        roof.position.set(0, 3.1, 0);
        placeholderGroup.add(roof);

        const glass = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 2), glassMat);
        glass.position.set(0, 2, -1.8);
        glass.rotation.x = -Math.PI / 8;
        placeholderGroup.add(glass);

        const front = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 1.5), chassisMat);
        front.position.set(0, 1, -1.5);
        placeholderGroup.add(front);

        const lightGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 16);
        lightGeo.rotateX(Math.PI / 2);
        const light = new THREE.Mesh(lightGeo, new THREE.MeshBasicMaterial({color: 0xffffff}));
        light.position.set(0, 1.2, -2.3);
        placeholderGroup.add(light);
        
        function createWheel(x, y, z) {
            const wGroup = new THREE.Group();
            const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.4, 16).rotateZ(Math.PI/2), blackMat);
            const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.42, 16).rotateZ(Math.PI/2), metalMat);
            wGroup.add(wheel);
            wGroup.add(rim);
            wGroup.position.set(x, y, z);
            wGroup.castShadow = true;
            return wGroup;
        }

        placeholderGroup.add(createWheel(-1.7, 0.6, 2));
        placeholderGroup.add(createWheel(1.7, 0.6, 2));
        placeholderGroup.add(createWheel(0, 0.6, -2));

        mototaxi.add(placeholderGroup);

        // --- FARO DELANTERO ---
        const headlight = new THREE.SpotLight(0xffffff, 1.5, 50, Math.PI/4, 0.5, 1);
        headlight.position.set(0, 1.5, -2.3);
        headlight.target.position.set(0, 0, -20);
        mototaxi.add(headlight);
        mototaxi.add(headlight.target);

        // --- CARGAR EL MODELO COLLADA (DAE) DE 3D WAREHOUSE ---
        if (typeof THREE.ColladaLoader !== 'undefined') {
            const loader = new THREE.ColladaLoader();
            loader.load('modelos/model.dae', function (collada) {
                const dae = collada.scene;
                
                const box = new THREE.Box3().setFromObject(dae);
                const size = box.getSize(new THREE.Vector3());
                const maxDim = Math.max(size.x, size.y, size.z);
                const targetSize = 6; 
                const scale = targetSize / maxDim;
                dae.scale.set(scale, scale, scale);
                
                const center = box.getCenter(new THREE.Vector3());
                dae.position.x = -center.x * scale;
                dae.position.y = (-box.min.y * scale); 
                dae.position.z = -center.z * scale;
                
                const wrapper = new THREE.Group();
                wrapper.add(dae);
                // Si la mototaxi carga de costado, rotar aquí: wrapper.rotation.y = Math.PI / 2;
                // Si carga mirando al jugador, rotar aquí: wrapper.rotation.y = Math.PI;
                
                dae.traverse(function (child) {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                mototaxi.remove(placeholderGroup);
                mototaxi.add(wrapper);
                console.log("¡Modelo 3D cargado con éxito!");
            }, 
            function (xhr) {
                console.log((xhr.loaded / xhr.total * 100) + '% cargado');
            }, 
            function (error) {
                console.error("No se pudo cargar el modelo DAE. Se usará el temporal.", error);
            });
        }
    }

    function spawnObstacle(zPos) {
        const rand = Math.random();
        let obs = new THREE.Group();
        let type = 'crash';
        
        // Carriles disponibles en la pista (Ancho 16, carriles de -6 a 6)
        const lanes = [-6, -3, 0, 3, 6];
        const lane = lanes[Math.floor(Math.random() * lanes.length)];

        if (rand < 0.25) {
            const geo = new THREE.CylinderGeometry(1.5, 1.5, 0.05, 16);
            const mat = new THREE.MeshBasicMaterial({ color: 0x221100 }); 
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.y = 0.02;
            obs.add(mesh);
            type = 'bache';
        } 
        else if (rand < 0.5) {
            const geo = new THREE.CylinderGeometry(0.4, 0.4, 6, 16);
            const mat = new THREE.MeshLambertMaterial({ color: 0xddaa00 });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.rotation.z = Math.PI / 2;
            mesh.position.y = 0.2;
            obs.add(mesh);
            type = 'bump';
        } 
        else if (rand < 0.75) {
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

        if (mototaxi.position.y > 0 || bumpVelocity > 0) {
            mototaxi.position.y += bumpVelocity;
            bumpVelocity -= 0.02; 
            mototaxi.rotation.x = THREE.MathUtils.lerp(mototaxi.rotation.x, -0.2, 0.1);
            
            if (mototaxi.position.y <= 0) {
                mototaxi.position.y = 0;
                bumpVelocity = 0;
                mototaxi.rotation.x = 0;
            }
        } else {
            mototaxi.rotation.x = THREE.MathUtils.lerp(mototaxi.rotation.x, 0, 0.1);
        }

        mototaxi.position.z -= speed;
        score += speed * 0.1;
        scoreDisplay.innerText = Math.floor(score);
        speed += 0.0005; 

        camera.position.z = mototaxi.position.z + 12;
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, mototaxi.position.x * 0.6, 0.1);
        camera.position.y = mototaxi.position.y + 6;

        if (obstacles.length < 20) {
            const lastZ = obstacles.length > 0 ? obstacles[obstacles.length-1].position.z : mototaxi.position.z;
            spawnObstacle(lastZ - 20 - Math.random() * 40);
        }

        if (mountains.length < 15) {
            const lastMZ = mountains.length > 0 ? mountains[mountains.length-1].position.z : mototaxi.position.z;
            spawnMountain(lastMZ - 80 - Math.random() * 100);
        }

        const taxiBox = new THREE.Box3().setFromObject(mototaxi);
        taxiBox.expandByScalar(-0.4); 

        for (let i = obstacles.length - 1; i >= 0; i--) {
            const obs = obstacles[i];
            
            if (obs.userData.type === 'persona') {
                obs.position.x += Math.sin(Date.now() * 0.001 + obs.position.z) * 0.05;
            }

            if (!obs.userData.hit) {
                const obsBox = new THREE.Box3().setFromObject(obs);
                if (obs.userData.type === 'bache' || obs.userData.type === 'bump') {
                    obsBox.max.y = 1;
                }

                if (taxiBox.intersectsBox(obsBox)) {
                    if (obs.userData.type === 'bump') {
                        bumpVelocity = 0.3;
                        speed = Math.max(0.8, speed - 0.2);
                        obs.userData.hit = true;
                    } else {
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
        
        for (let i = mountains.length - 1; i >= 0; i--) {
            if (mountains[i].position.z > camera.position.z + 50) {
                scene.remove(mountains[i]);
                mountains.splice(i, 1);
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
        
        mountains.forEach(mtn => scene.remove(mtn));
        mountains = [];
        
        gameOverScreen.classList.add('hidden');
        animate();
    }

})();
