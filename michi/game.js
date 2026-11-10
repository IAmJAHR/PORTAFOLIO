/* ============================================================================
   SUPER MICHI BROS. — MOTOR 2D EDICIÓN CELULAR & PC (SÚPER FÁCIL EN MÓVIL)
   - Modo Auto-Correr ("🏃‍♀️ Auto: ON/OFF", estilo Super Mario Run) para jugar
     con 1 sola mano en el celular: Michi corre sola y salta automáticamente
     tuberías bajas si te distraes.
   - Tocar cualquier parte del escenario (Canvas) salta inmediatamente.
   - D-Pad Táctil Deslizable (puedes deslizar el pulgar entre ◀, ▼ y ▶ sin levantarlo).
   - "Coyote Time" y "Jump Buffer" para que ningún salto falle en pantalla táctil.
   - Imán suave de monedas para recogerlas súper fácil al pasar cerca.
   ============================================================================ */

(() => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  // Canvases secundarios para mostrar a Michi 2D de Cuerpo Completo
  const poseCanvas = document.getElementById('poseShowcaseCanvas');
  const poseCtx = poseCanvas ? poseCanvas.getContext('2d') : null;

  const introMichiCanvas = document.getElementById('introMichiCanvas');
  const introMichiCtx = introMichiCanvas ? introMichiCanvas.getContext('2d') : null;

  const titleMichiCanvas = document.getElementById('titleMichiCanvas');
  const titleMichiCtx = titleMichiCanvas ? titleMichiCanvas.getContext('2d') : null;

  const pauseMichiCanvas = document.getElementById('pauseMichiCanvas');
  const pauseMichiCtx = pauseMichiCanvas ? pauseMichiCanvas.getContext('2d') : null;

  // Referencias UI
  const hudScore = document.getElementById('hud-score');
  const hudCoins = document.getElementById('hud-coins');
  const hudMemories = document.getElementById('hud-memories');
  const hudWorld = document.getElementById('hud-world');
  const btnAutorun = document.getElementById('btn-autorun');

  const introOverlay = document.getElementById('intro-overlay');
  const introSlideImg = document.getElementById('intro-slide-img');
  const introImgCaption = document.getElementById('intro-img-caption');
  const introChapter = document.getElementById('intro-chapter');
  const introTitle = document.getElementById('intro-title');
  const introText = document.getElementById('intro-text');
  const introPrevBtn = document.getElementById('intro-prev-btn');
  const introNextBtn = document.getElementById('intro-next-btn');
  const introSkipBtn = document.getElementById('intro-skip-btn');

  const titleScreen = document.getElementById('title-screen');
  const albumModal = document.getElementById('album-modal');
  const levelSelectModal = document.getElementById('level-select-modal');
  const stageClearModal = document.getElementById('stage-clear-modal');
  const stageClearTitle = document.getElementById('stage-clear-title');
  const stageClearQuote = document.getElementById('stage-clear-quote');
  const pauseModal = document.getElementById('pause-modal');
  const poseModal = document.getElementById('pose-modal');
  const memoriesModal = document.getElementById('memories-modal');
  const memoriesList = document.getElementById('memories-list');
  const tributeScreen = document.getElementById('tribute-screen');
  const tributeStats = document.getElementById('tribute-stats');

  // Imágenes de Michi
  const imgCape = new Image();
  imgCape.src = '/michi/muchi_cape.jpg';
  const imgReal = new Image();
  imgReal.src = '/michi/muchi_real.jpg';
  const imgFullMeadow = new Image();
  imgFullMeadow.src = '/michi/muchi_full_meadow.png';
  const imgFullHero = new Image();
  imgFullHero.src = '/michi/muchi_full_hero.png';
  const imgFullStar = new Image();
  imgFullStar.src = '/michi/muchi_full_starlight.png';

  // ==========================================================================
  // 1. HISTORIA DE LA INTRO CINEMÁTICA DE CUERPO COMPLETO (4 CAPÍTULOS)
  // ==========================================================================
  const INTRO_SLIDES = [
    {
      chapter: 'CAPÍTULO 1 / 4 — NUESTRA MICHI DE CUERPO ENTERO',
      title: 'Había una vez una gatita calicó única llamada Michi...',
      text: 'Con sus ojitos verdes esmeralda, su manchita negra en la naricita rosada, sus cuatro calcetines blancos y el pechito blanco más suave del mundo, Michi llenó cada día de ternura y amor verdadero.',
      img: '/michi/muchi_cape.jpg',
      fallback: '/michi/muchi_cape.jpg',
      caption: 'Michi de Cuerpo Completo',
      pose2D: 'belly'
    },
    {
      chapter: 'CAPÍTULO 2 / 4 — EL PECHITO BLANCO QUE TANTO AMABAS',
      title: 'Cada caricia tuya quedó guardada en su corazón...',
      text: 'Cuando la tomabas entre tus manos y veías su pechito blanco y sus patitas suaves, ella te regalaba su ronroneo más cálido y sincero.',
      img: '/michi/muchi_real.jpg',
      fallback: '/michi/muchi_real.jpg',
      caption: 'Su Pechito Blanco y Mirada Tierna',
      pose2D: 'wink'
    },
    {
      chapter: 'CAPÍTULO 3 / 4 — LA GUARDIANA DE LA CAPA MÁGICA',
      title: '«No estés triste porque ya no estoy físicamente...»',
      text: '«Ahora llevo mi capa negra con bordes rojos y broche de oro. Mírame de cuerpo entero correr entre las estrellas: cada vez que sientas que te faltan fuerzas, te hago un guiño 😉 para que sigas adelante.»',
      img: '/michi/muchi_full_hero.png',
      fallback: '/michi/muchi_cape.jpg',
      caption: 'Michi Guardiana Estelar',
      pose2D: 'hero'
    },
    {
      chapter: 'CAPÍTULO 4 / 4 — SUPER MICHI BROS.',
      title: '¡Fácil de jugar en Celular y en PC!',
      text: 'En celular puedes tocar cualquier parte del cielo para saltar, deslizar el dedo en las flechas o activar el modo «🏃‍♀️ Auto-Correr» para jugar con una sola mano mientras escuchas sus ronroneos.',
      img: '/michi/muchi_full_meadow.png',
      fallback: '/michi/muchi_cape.jpg',
      caption: 'Aventura de Cuerpo Completo',
      pose2D: 'run'
    }
  ];

  let currentIntroSlide = 0;

  function renderIntroSlide(index) {
    currentIntroSlide = (index + INTRO_SLIDES.length) % INTRO_SLIDES.length;
    const s = INTRO_SLIDES[currentIntroSlide];
    introChapter.textContent = s.chapter;
    introTitle.textContent = s.title;
    introText.textContent = s.text;
    introImgCaption.textContent = s.caption;
    introSlideImg.onerror = () => {
      introSlideImg.onerror = null;
      introSlideImg.src = s.fallback;
    };
    introSlideImg.src = s.img;

    document.querySelectorAll('.cinema-dots .dot').forEach((d, idx) => {
      d.classList.toggle('active', idx === currentIntroSlide);
    });

    introNextBtn.textContent = currentIntroSlide === INTRO_SLIDES.length - 1 ? '✨ IR AL MENÚ ▶' : 'SIGUIENTE ▶';
  }

  // ==========================================================================
  // 2. SINTETIZADOR MUSICAL + MAULLIDOS DULCES + RONRONEO REAL DE MICHI
  // ==========================================================================
  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.muted = false;
      this.bgmTimer = null;
      this.step = 0;
      this.mode = 'adventure';
      this.lastPurrTime = 0;
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    toggleMute() {
      this.init();
      this.muted = !this.muted;
      document.getElementById('btn-music').textContent = this.muted ? '🔇' : '🎵';
      if (this.muted) {
        this.stopBGM();
      } else {
        this.startBGM(this.mode);
      }
    }

    playTone(freq, type, duration, vol = 0.11, slideTo = null) {
      if (this.muted || !this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (slideTo) {
        osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
      }
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + duration);
    }

    jump() {
      this.init();
      this.playTone(330, 'square', 0.16, 0.075, 680);
    }

    coin() {
      this.init();
      this.playTone(987.77, 'square', 0.07, 0.075);
      setTimeout(() => this.playTone(1318.51, 'square', 0.2, 0.075), 65);
    }

    stomp() {
      this.init();
      this.playTone(420, 'triangle', 0.14, 0.12, 140);
    }

    winkSound() {
      this.init();
      this.playTone(880, 'sine', 0.09, 0.1, 1760);
      setTimeout(() => this.playTone(1760, 'sine', 0.16, 0.08, 2200), 75);
    }

    meow(variant = 0) {
      this.init();
      if (this.muted || !this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc2.type = 'sine';

      const base = variant === 1 ? 610 : 540;
      const peak = variant === 1 ? 1050 : 940;
      const end = variant === 1 ? 740 : 640;

      osc.frequency.setValueAtTime(base, now);
      osc.frequency.exponentialRampToValueAtTime(peak, now + 0.13);
      osc.frequency.exponentialRampToValueAtTime(end, now + 0.38);

      osc2.frequency.setValueAtTime(base * 2, now);
      osc2.frequency.exponentialRampToValueAtTime(peak * 2, now + 0.13);
      osc2.frequency.exponentialRampToValueAtTime(end * 2, now + 0.38);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.41);

      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc2.start(now);
      osc.stop(now + 0.42);
      osc2.stop(now + 0.42);
    }

    purr(duration = 1.4) {
      this.init();
      if (this.muted || !this.ctx) return;
      const now = this.ctx.currentTime;
      if (now - this.lastPurrTime < 1.1) return;
      this.lastPurrTime = now;

      const carrier = this.ctx.createOscillator();
      const sub = this.ctx.createOscillator();
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      const masterGain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      carrier.type = 'sawtooth';
      carrier.frequency.setValueAtTime(58, now);
      carrier.frequency.linearRampToValueAtTime(64, now + duration * 0.5);
      carrier.frequency.linearRampToValueAtTime(55, now + duration);

      sub.type = 'triangle';
      sub.frequency.setValueAtTime(116, now);

      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(24, now);
      lfoGain.gain.setValueAtTime(0.08, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(210, now);

      masterGain.gain.setValueAtTime(0.01, now);
      masterGain.gain.linearRampToValueAtTime(0.13, now + 0.2);
      masterGain.gain.setValueAtTime(0.12, now + duration - 0.25);
      masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      carrier.connect(filter);
      sub.connect(filter);
      filter.connect(masterGain);
      lfo.connect(lfoGain);
      lfoGain.connect(masterGain.gain);
      masterGain.connect(this.ctx.destination);

      carrier.start(now);
      sub.start(now);
      lfo.start(now);

      carrier.stop(now + duration);
      sub.stop(now + duration);
      lfo.stop(now + duration);
    }

    memoryFanfare() {
      this.init();
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((n, i) => {
        setTimeout(() => this.playTone(n, 'triangle', 0.2, 0.1), i * 75);
      });
    }

    startBGM(mode = 'adventure') {
      this.init();
      this.mode = mode;
      if (this.bgmTimer) clearInterval(this.bgmTimer);
      if (this.muted) return;

      const adventureMelody = [
        659.25, 659.25, 0, 659.25, 0, 523.25, 659.25, 0,
        783.99, 0, 0, 0, 392.00, 0, 0, 0,
        523.25, 0, 0, 392.00, 0, 0, 329.63, 0,
        0, 440.00, 0, 493.88, 0, 466.16, 440.00, 0,
        392.00, 659.25, 783.99, 880.00, 0, 698.46, 783.99, 0,
        659.25, 0, 523.25, 587.33, 493.88, 0, 0, 0
      ];
      const adventureBass = [
        130.81, 0, 196.00, 0, 130.81, 0, 196.00, 0,
        196.00, 0, 246.94, 0, 196.00, 0, 130.81, 0,
        130.81, 0, 164.81, 0, 196.00, 0, 130.81, 0,
        174.61, 0, 174.61, 0, 196.00, 0, 196.00, 0,
        130.81, 0, 196.00, 0, 174.61, 0, 196.00, 0,
        130.81, 0, 196.00, 0, 130.81, 0, 0, 0
      ];
      const starlightMelody = [
        587.33, 0, 880.00, 0, 783.99, 698.46, 659.25, 0,
        523.25, 0, 783.99, 0, 698.46, 659.25, 587.33, 0,
        659.25, 783.99, 880.00, 987.77, 1046.50, 0, 783.99, 0,
        880.00, 783.99, 698.46, 659.25, 587.33, 0, 0, 0
      ];
      const tributeMelody = [
        523.25, 659.25, 783.99, 1046.50, 987.77, 783.99, 659.25, 0,
        587.33, 698.46, 880.00, 1174.66, 1046.50, 783.99, 659.25, 0,
        523.25, 659.25, 783.99, 1318.51, 1174.66, 1046.50, 880.00, 698.46,
        783.99, 659.25, 587.33, 493.88, 523.25, 0, 0, 0
      ];

      this.step = 0;
      const tempoMs = mode === 'tribute' ? 250 : 145;

      this.bgmTimer = setInterval(() => {
        if (this.muted || !this.ctx || (gameState !== 'playing' && gameState !== 'tribute')) return;
        if (this.mode === 'adventure') {
          const note = adventureMelody[this.step % adventureMelody.length];
          const bass = adventureBass[this.step % adventureBass.length];
          if (note > 0) this.playTone(note, 'square', 0.11, 0.038);
          if (bass > 0) this.playTone(bass, 'triangle', 0.13, 0.05);
        } else if (this.mode === 'starlight') {
          const note = starlightMelody[this.step % starlightMelody.length];
          if (note > 0) this.playTone(note, 'triangle', 0.16, 0.055);
        } else {
          const note = tributeMelody[this.step % tributeMelody.length];
          if (note > 0) this.playTone(note, 'sine', 0.42, 0.07);
        }
        this.step++;
      }, tempoMs);
    }

    stopBGM() {
      if (this.bgmTimer) {
        clearInterval(this.bgmTimer);
        this.bgmTimer = null;
      }
    }
  }

  const sound = new SoundEngine();

  // Desbloqueo universal de Audio en navegadores móviles (iOS Safari / Android Chrome) al primer toque
  const unlockMobileAudio = () => {
    sound.init();
    window.removeEventListener('touchstart', unlockMobileAudio);
    window.removeEventListener('pointerdown', unlockMobileAudio);
  };
  window.addEventListener('touchstart', unlockMobileAudio, { passive: true });
  window.addEventListener('pointerdown', unlockMobileAudio, { passive: true });

  // ==========================================================================
  // 3. TODOS LOS MENSAJES PROFUNDOS DE MICHI
  // ==========================================================================
  const MICHI_MESSAGES = [
    {
      title: "🌟 Michi Dice #1: Mi Pechito Blanco",
      text: "«¿Recuerdas lo suave y blanquito que era mi pecho cuando me cargabas entre tus manos? Cada caricia tuya la guardé en mi alma. ¡Sigue adelante con esa ternura!»"
    },
    {
      title: "🌟 Michi Dice #2: Un Guiño Desde el Cielo 😉",
      text: "«Mis ojitos verdes siguen cuidándote. Cuando sientas que el día pesa mucho, mira hacia arriba: soy tu Michi haciéndote un guiño para decirte que tú puedes con todo.»"
    },
    {
      title: "🌟 Michi Dice #3: Mi Capa de Guerrera",
      text: "«Ahora llevo mi capa mágica con broche dorado y el emblema del toro valiente. Soy tu guardiana estelar; toma mi fuerza y nunca te rindas.»"
    },
    {
      title: "🌟 Michi Dice #4: El Dolor se Transforma en Luz",
      text: "«Sé que mi partida dejó un silencio grande en casa, pero el amor verdadero jamás desaparece. Convierte cada lágrima en un paso más hacia tus metas.»"
    },
    {
      title: "🌟 Michi Dice #5: Mis 4 Patitas Blancas junto a Ti",
      text: "«Mis cuatro calcetines blancos ya no hacen ruido en el piso, pero caminan invisibles a tu lado cada mañana. ¡Corre, salta y vive bonito por los dos!»"
    },
    {
      title: "🌟 Michi Dice #6: Mi Ronroneo en tu Corazón",
      text: "«Escucha mi ronroneo... Prrrr 🤍 ¿Lo sientes? Es mi forma de abrazarte desde el cielo y decirte que todo va a estar bien. Estoy muy orgullosa de ti.»"
    },
    {
      title: "🌟 Michi Dice #7: La Manchita en mi Nariz",
      text: "«Cada vez que veas una foto mía y mires el puntito negro en mi naricita rosada, sonríe: porque tuvimos la suerte de encontrarnos en esta vida.»"
    },
    {
      title: "🌟 Michi Dice #8: La Promesa de Seguir Adelante",
      text: "«Gracias por haber sido mi hogar y mi vida entera. El mejor homenaje que puedes darme es ser feliz y seguir adelante. ¡Te amo por siempre, tu Michi!»"
    }
  ];

  function populateMemoriesVault() {
    memoriesList.innerHTML = '';
    MICHI_MESSAGES.forEach(m => {
      const div = document.createElement('div');
      div.className = 'memory-item';
      div.innerHTML = `<h4>${m.title}</h4><p>${m.text}</p>`;
      memoriesList.appendChild(div);
    });
  }
  populateMemoriesVault();

  // ==========================================================================
  // 4. DIBUJANTE 2D DE CUERPO COMPLETO DE MICHI
  // ==========================================================================
  function drawMichiFullBody(c, x, y, scale, state) {
    c.save();
    c.translate(x, y);
    if (state.facing === -1) {
      c.scale(-scale, scale);
    } else {
      c.scale(scale, scale);
    }

    const t = state.animTimer || 0;
    const pose = state.pose || 'idle';
    const isRunning = pose === 'run';
    const isJumping = pose === 'jump';
    const isWinking = pose === 'wink' || (state.winkTimer && state.winkTimer > 0);
    const isHero = pose === 'hero';
    const isBelly = pose === 'belly' || pose === 'chest';
    const isGroom = pose === 'groom';
    const isStretch = pose === 'stretch';

    const purrVib = (state.purrTimer && state.purrTimer > 0) ? Math.sin(t * 1.8) * 0.7 : 0;
    const bounceY = isRunning ? Math.abs(Math.sin(t * 0.38)) * -5 : Math.sin(t * 0.08) * 1.5;
    c.translate(purrVib, bounceY);

    c.fillStyle = 'rgba(0, 0, 0, 0.25)';
    c.beginPath();
    c.ellipse(0, 0, 20, 4, 0, 0, Math.PI * 2);
    c.fill();

    if (state.goldenAura || isHero || isWinking || isBelly) {
      const grad = c.createRadialGradient(0, -28, 6, 0, -28, 46);
      grad.addColorStop(0, 'rgba(255, 235, 140, 0.45)');
      grad.addColorStop(1, 'rgba(255, 215, 0, 0)');
      c.fillStyle = grad;
      c.beginPath();
      c.arc(0, -28, 46, 0, Math.PI * 2);
      c.fill();
    }

    const tailWag = Math.sin(t * (isRunning ? 0.35 : 0.12)) * 12;
    c.save();
    c.translate(-15, -18);
    c.rotate((tailWag * Math.PI) / 180);
    c.lineCap = 'round';
    c.lineWidth = 7;
    c.strokeStyle = '#1e1b24';
    c.beginPath();
    c.moveTo(0, 0);
    c.quadraticCurveTo(-18, -8, -26, -24);
    c.stroke();

    c.lineWidth = 5.5;
    c.strokeStyle = '#f48c25';
    c.beginPath();
    c.moveTo(-10, -5);
    c.quadraticCurveTo(-20, -14, -27, -25);
    c.stroke();
    c.restore();

    const capeWave = Math.sin(t * (isRunning ? 0.42 : 0.14)) * (isRunning || isHero ? 8 : 3);
    c.fillStyle = '#191520';
    c.strokeStyle = '#d92b3a';
    c.lineWidth = 2.4;
    c.beginPath();
    c.moveTo(-10, -34);
    c.quadraticCurveTo(-28 - capeWave, -18, -30 - capeWave * 1.3, -3);
    c.lineTo(14, -4);
    c.quadraticCurveTo(16, -20, 10, -34);
    c.closePath();
    c.fill();
    c.stroke();

    const swing = isRunning ? Math.sin(t * 0.45) * 9 : (isJumping ? -6 : (isStretch ? 6 : 0));
    drawFullLeg(c, -13 - swing * 0.7, -16, 16, '#1e1b24', '#f48c25', '#ffffff');
    drawFullLeg(c, -6 + swing * 0.6, -15, 15, '#f48c25', '#1e1b24', '#ffffff');

    c.fillStyle = '#1e1b24';
    c.beginPath();
    if (isBelly) {
      c.ellipse(0, -22, 14, 16, 0, 0, Math.PI * 2);
    } else {
      c.ellipse(-1, -20, 16, 13, -0.08, 0, Math.PI * 2);
    }
    c.fill();

    c.fillStyle = '#f48c25';
    c.beginPath();
    c.ellipse(-7, -23, 7, 6, 0.2, 0, Math.PI * 2);
    c.fill();

    c.save();
    c.translate(5, -21);
    if (isBelly) c.scale(1.22, 1.25);
    c.fillStyle = '#ffffff';
    c.beginPath();
    c.ellipse(0, 0, 10, 12.5, 0.08, 0, Math.PI * 2);
    c.fill();

    c.strokeStyle = '#e5e0d8';
    c.lineWidth = 1.1;
    c.beginPath();
    c.arc(1, -2, 6, 0.3, Math.PI - 0.3);
    c.moveTo(-4, 4);
    c.quadraticCurveTo(0, 7, 5, 4);
    c.stroke();
    c.restore();

    drawFullLeg(c, 2 + swing * 0.8, -15, 15, '#1e1b24', '#f48c25', '#ffffff');

    if (isGroom || isBelly) {
      c.save();
      c.translate(11, -24 + Math.sin(t * 0.3) * 2.5);
      c.fillStyle = '#f48c25';
      c.beginPath();
      c.roundRect(-3.5, -2, 7, 11, 3.5);
      c.fill();
      c.fillStyle = '#ffffff';
      c.beginPath();
      c.arc(0, -3, 5, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#f7a8b8';
      c.beginPath();
      c.arc(0, -3, 2, 0, Math.PI * 2);
      c.fill();
      c.restore();
    } else {
      drawFullLeg(c, 9 - swing * 0.8, -15, 15, '#f48c25', '#f48c25', '#ffffff');
    }

    c.fillStyle = '#251e2b';
    c.strokeStyle = '#d92b3a';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(-12, -33);
    c.quadraticCurveTo(2, -26, 13, -33);
    c.lineTo(11, -24);
    c.quadraticCurveTo(0, -20, -13, -24);
    c.closePath();
    c.fill();
    c.stroke();

    c.fillStyle = '#d92b3a';
    c.beginPath();
    c.arc(-6, -24, 2.5, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#d92b3a';
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(-9, -27);
    c.quadraticCurveTo(-6, -24, -3, -27);
    c.stroke();

    c.fillStyle = '#ffd700';
    c.beginPath();
    c.arc(2.5, -28.5, 3, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#b8860b';
    c.lineWidth = 1;
    c.stroke();

    c.save();
    const headTilt = isWinking ? 0.13 : (isBelly ? -0.08 : 0);
    c.translate(3, -42);
    c.rotate(headTilt);

    c.fillStyle = '#1e1b24';
    c.beginPath();
    c.moveTo(-12, -6); c.lineTo(-16, -24); c.lineTo(-3, -13);
    c.closePath();
    c.fill();
    c.fillStyle = '#e89999';
    c.beginPath();
    c.moveTo(-11, -8); c.lineTo(-14, -19); c.lineTo(-5, -13);
    c.closePath();
    c.fill();

    c.fillStyle = '#1e1b24';
    c.beginPath();
    c.moveTo(3, -13); c.lineTo(15, -24); c.lineTo(12, -6);
    c.closePath();
    c.fill();
    c.fillStyle = '#e89999';
    c.beginPath();
    c.moveTo(5, -13); c.lineTo(13, -19); c.lineTo(10, -8);
    c.closePath();
    c.fill();

    c.fillStyle = '#1e1b24';
    c.beginPath();
    c.ellipse(0, -4, 14.5, 12.5, 0, 0, Math.PI * 2);
    c.fill();

    c.fillStyle = '#f48c25';
    c.beginPath();
    c.ellipse(-6.5, -7.5, 6, 4.8, -0.3, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.ellipse(7.5, -2, 5.5, 4.2, 0.3, 0, Math.PI * 2);
    c.fill();

    c.fillStyle = '#ffffff';
    c.beginPath();
    c.moveTo(0, -11);
    c.quadraticCurveTo(-6.5, 1, -8.5, 5.5);
    c.quadraticCurveTo(0, 8.5, 8.5, 5.5);
    c.quadraticCurveTo(6.5, 1, 0, -11);
    c.closePath();
    c.fill();

    c.fillStyle = '#1e1b24';
    c.beginPath();
    c.ellipse(1.2, -5.8, 2.3, 4.0, 0.15, 0, Math.PI * 2);
    c.fill();

    const autoBlink = (Math.floor(t) % 160 < 5);
    if (autoBlink) {
      drawClosedEye(c, -5.8, -3.8);
    } else {
      drawEmeraldEye(c, -5.8, -3.8);
    }

    if (isWinking || autoBlink) {
      drawWinkEye(c, 5.8, -3.8);
    } else {
      drawEmeraldEye(c, 5.8, -3.8);
    }

    c.fillStyle = '#f7a8b8';
    c.beginPath();
    c.moveTo(-2.7, 1.5); c.lineTo(2.7, 1.5); c.lineTo(0, 4.4);
    c.closePath();
    c.fill();

    c.fillStyle = '#1e1b24';
    c.beginPath();
    c.arc(-0.8, 2.4, 1.15, 0, Math.PI * 2);
    c.fill();

    c.strokeStyle = '#4a3540';
    c.lineWidth = 1.3;
    c.beginPath();
    c.moveTo(0, 4.4); c.quadraticCurveTo(-2.8, 6.5, -4.8, 5.0);
    c.moveTo(0, 4.4); c.quadraticCurveTo(2.8, 6.5, 4.8, 5.0);
    c.stroke();

    c.strokeStyle = 'rgba(255, 255, 255, 0.92)';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(-6, 3); c.lineTo(-18, 1);
    c.moveTo(-6, 4.8); c.lineTo(-17, 4.8);
    c.moveTo(6, 3); c.lineTo(18, 1);
    c.moveTo(6, 4.8); c.lineTo(17, 4.8);
    c.stroke();

    if (isWinking) {
      c.fillStyle = '#ffd700';
      c.font = 'bold 12px sans-serif';
      c.fillText('✨', 12, -10);
      c.fillStyle = '#ff6b9d';
      c.fillText('♥', -19, -12);
    }

    c.restore();
    c.restore();
  }

  function drawFullLeg(c, x, topY, height, upperColor, midColor, sockColor) {
    c.fillStyle = upperColor;
    c.beginPath();
    c.roundRect(x - 3.8, topY, 7.6, height * 0.55, 3);
    c.fill();

    c.fillStyle = midColor;
    c.beginPath();
    c.roundRect(x - 3.5, topY + height * 0.35, 7, height * 0.35, 2);
    c.fill();

    c.fillStyle = sockColor;
    c.beginPath();
    c.roundRect(x - 4, topY + height * 0.62, 8.2, height * 0.38, 3.5);
    c.fill();

    c.strokeStyle = '#d8d2c9';
    c.lineWidth = 0.8;
    c.beginPath();
    c.moveTo(x - 1, topY + height - 3);
    c.lineTo(x - 1, topY + height);
    c.moveTo(x + 1.5, topY + height - 3);
    c.lineTo(x + 1.5, topY + height);
    c.stroke();
  }

  function drawEmeraldEye(c, x, y) {
    c.fillStyle = '#b5e61d';
    c.beginPath();
    c.ellipse(x, y, 3.8, 3.5, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#111';
    c.beginPath();
    c.ellipse(x, y, 1.35, 2.9, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#fff';
    c.beginPath();
    c.arc(x - 1.2, y - 1.2, 1.15, 0, Math.PI * 2);
    c.fill();
  }

  function drawWinkEye(c, x, y) {
    c.strokeStyle = '#ffd700';
    c.lineWidth = 2.3;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(x - 3.6, y - 1);
    c.quadraticCurveTo(x, y - 4.2, x + 3.6, y - 1);
    c.stroke();
  }

  function drawClosedEye(c, x, y) {
    c.strokeStyle = '#b5e61d';
    c.lineWidth = 1.8;
    c.beginPath();
    c.moveTo(x - 3, y);
    c.lineTo(x + 3, y);
    c.stroke();
  }

  // ==========================================================================
  // 5. LOS 4 MUNDOS CON SUS MENSAJES EN LOS CARTELES "🐾 MICHI DICE:"
  // ==========================================================================
  const LEVELS = [
    {
      id: '1-1',
      name: 'Pradera de las Caricias',
      music: 'adventure',
      skyTop: '#3b6ef5',
      skyBottom: '#8ec5fc',
      groundTop: '#4cd137',
      groundFill: '#c2642d',
      length: 2600,
      clearQuote: '«¡Cruzamos la Pradera de las Caricias! Viste cómo brillaba mi cuerpo entero y mi pechito blanco al sol. ¡Vamos al Mundo 1-2!»',
      signposts: [
        {
          x: 240,
          title: '🐾 MICHI DICE: Mi Pechito Blanco 🤍',
          text: '«¿Recuerdas lo suave y blanquito que era mi pecho cuando me cargabas entre tus manos? ¡Sigue adelante con esa ternura!»'
        },
        {
          x: 980,
          title: '🐾 MICHI DICE: Un Guiño Desde el Cielo 😉',
          text: '«Mis ojitos verdes siguen cuidándote. Cuando el día pese mucho, recuerda mi guiño: ¡tú puedes con todo!»'
        },
        {
          x: 1740,
          title: '🐾 MICHI DICE: Mi Ronroneo Contigo 🎶',
          text: '«Escucha mi ronroneo al pasar... Prrrr 🤍 Es mi abrazo invisible diciéndote que siempre camino a tu lado.»'
        }
      ]
    },
    {
      id: '1-2',
      name: 'Atardecer de los Guiños',
      music: 'adventure',
      skyTop: '#4a1c5c',
      skyBottom: '#f48c25',
      groundTop: '#f5b041',
      groundFill: '#873600',
      length: 2650,
      clearQuote: '«¡El atardecer nunca fue tan bonito como cuando estábamos juntos! Presiona 😉 cuando quieras verme guiñar y ronronear.»',
      signposts: [
        {
          x: 240,
          title: '🐾 MICHI DICE: Mi Capa de Guerrera 🦸‍♀️',
          text: '«Ahora llevo mi capa mágica con broche dorado y el emblema del toro valiente. Soy tu guardiana; nunca te rindas.»'
        },
        {
          x: 1020,
          title: '🐾 MICHI DICE: Transforma la Tristeza 🌸',
          text: '«Sé que mi partida dejó un silencio grande, pero el amor verdadero jamás se apaga. Salta sobre la tristeza y vuélvela flores.»'
        },
        {
          x: 1780,
          title: '🐾 MICHI DICE: Mis 4 Calcetines Blancos 🐾',
          text: '«Mis cuatro patitas blancas ya no suenan en el piso, pero dan cada paso contigo hacia tus sueños.»'
        }
      ]
    },
    {
      id: '1-3',
      name: 'Noche de la Capa Mágica',
      music: 'starlight',
      skyTop: '#0b0726',
      skyBottom: '#2d1b69',
      groundTop: '#6c5ce7',
      groundFill: '#22184f',
      length: 2750,
      clearQuote: '«¡Con mi capa negra de bordes rojos y broche de oro ninguna noche da miedo! Ya casi llegamos al Altar Estelar.»',
      signposts: [
        {
          x: 240,
          title: '🐾 MICHI DICE: La Manchita en mi Nariz ✨',
          text: '«Cada vez que mires mi foto y veas el puntito negro en mi naricita rosada, sonríe por todo el amor que nos dimos.»'
        },
        {
          x: 1040,
          title: '🐾 MICHI DICE: Una Estrella con Ronroneo 🌟',
          text: '«En las noches estrelladas soy la luz más brillante haciéndote un guiño 😉. Respira hondo y sigue adelante.»'
        },
        {
          x: 1820,
          title: '🐾 MICHI DICE: Estoy Orgullosa de Ti ❤️',
          text: '«Cada día que te levantas y sigues luchando por tus metas, mi corazón calicó ronronea de alegría.»'
        }
      ]
    },
    {
      id: '1-4',
      name: 'Puente Estelar de Michi',
      music: 'starlight',
      skyTop: '#160a33',
      skyBottom: '#9b4dca',
      groundTop: '#ffd700',
      groundFill: '#4a235a',
      length: 2800,
      clearQuote: '«¡Llegamos al Altar Celestial! Aquí tienes mi carta eterna.»',
      signposts: [
        {
          x: 240,
          title: '🐾 MICHI DICE: El Puente del Amor Eterno 🌈',
          text: '«Gracias por haber sido mi hogar y mi vida entera. Tus manos fueron el lugar más seguro del mundo.»'
        },
        {
          x: 1060,
          title: '🐾 MICHI DICE: Mi Pechito Blanco Brilla 🤍',
          text: '«Ya nada me duele. Corro libre de cuerpo entero y te cuido en cada amanecer.»'
        },
        {
          x: 1840,
          title: '🐾 MICHI DICE: La Promesa Final ✨',
          text: '«El mejor homenaje que puedes darme es ser feliz y seguir adelante. ¡Entra al Altar para leer mi carta!»'
        }
      ]
    }
  ];

  const GRAVITY = 0.54;
  const GROUND_Y = 430;

  let gameState = 'intro';
  let currentLevelIdx = 0;
  let score = 0;
  let totalCoinsCollected = 0;
  let levelMemoriesCollected = 0;
  let totalMemoriesInLevel = 3;
  let cameraX = 0;
  let globalTick = 0;

  // Modo Auto-Correr para jugar con 1 sola mano en celular
  let autoRunEnabled = false;

  const keys = { left: false, right: false, up: false, down: false };
  let jumpBufferTimer = 0;
  let coyoteTimer = 0;

  const michi = {
    x: 110,
    y: GROUND_Y,
    vx: 0,
    vy: 0,
    w: 40,
    h: 56,
    onGround: true,
    facing: 1,
    pose: 'idle',
    animTimer: 0,
    winkTimer: 0,
    purrTimer: 0,
    poseLockTimer: 0,
    idleTime: 0,
    goldenAura: false,
    auraTimer: 0,
    speechText: '¡Miau! Prrrr... 🤍🐾',
    speechTimer: 160
  };

  let particles = [];
  let floatingTexts = [];
  let blocks = [];
  let platforms = [];
  let pipes = [];
  let coins = [];
  let enemies = [];
  let checkpoints = [];

  function toggleAutoRun(forceState = null) {
    autoRunEnabled = forceState !== null ? forceState : !autoRunEnabled;
    btnAutorun.textContent = autoRunEnabled ? '🏃‍♀️ Auto: ON' : '🏃‍♀️ Auto: OFF';
    btnAutorun.classList.toggle('active-autorun', autoRunEnabled);
    if (autoRunEnabled && gameState === 'playing') {
      michi.speechText = '¡Modo 1 Mano Activo! Toca para saltar 🐾';
      michi.speechTimer = 130;
    }
  }

  function spawnSparkles(x, y, color = '#ffd700', count = 10) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 4;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        size: 2.5 + Math.random() * 3.5,
        color,
        life: 30 + Math.random() * 25,
        maxLife: 55,
        type: Math.random() > 0.35 ? 'star' : 'heart'
      });
    }
  }

  function addFloatingText(x, y, text, color = '#ffd700') {
    floatingTexts.push({ x, y, text, color, life: 60 });
  }

  function isCoinPositionClear(cx, cy, radius = 24) {
    for (const p of pipes) {
      if (cx + radius > p.x - 14 && cx - radius < p.x + p.w + 14 &&
          cy + radius > p.y - 14 && cy - radius < p.y + p.h + 14) {
        return false;
      }
    }
    for (const pl of platforms) {
      if (cx + radius > pl.x - 10 && cx - radius < pl.x + pl.w + 10 &&
          cy + radius > pl.y - 10 && cy - radius < pl.y + pl.h + 10) {
        return false;
      }
    }
    for (const b of blocks) {
      if (cx + radius > b.x - 14 && cx - radius < b.x + b.w + 14 &&
          cy + radius > b.y - 14 && cy - radius < b.y + b.h + 14) {
        return false;
      }
    }
    for (const cp of checkpoints) {
      if (Math.abs(cx - cp.x) < 55) {
        return false;
      }
    }
    for (const c of coins) {
      if (Math.hypot(cx - c.x, cy - c.y) < 36) {
        return false;
      }
    }
    return true;
  }

  function addSafeCoin(cx, cy) {
    if (isCoinPositionClear(cx, cy)) {
      coins.push({ x: cx, y: cy, r: 14, collected: false });
    }
  }

  function loadLevel(idx) {
    currentLevelIdx = idx;
    const lvl = LEVELS[idx];
    cameraX = 0;
    levelMemoriesCollected = 0;
    totalMemoriesInLevel = lvl.signposts.length;

    particles = [];
    floatingTexts = [];
    blocks = [];
    platforms = [];
    pipes = [];
    coins = [];
    enemies = [];
    checkpoints = lvl.signposts.map(sp => ({ ...sp, visited: false }));

    michi.x = 90;
    michi.y = GROUND_Y;
    michi.vx = 0;
    michi.vy = 0;
    michi.facing = 1;
    michi.pose = 'idle';
    michi.winkTimer = 90;
    michi.purrTimer = 90;
    michi.speechText = `¡Mundo ${lvl.id}: ${lvl.name}! Prrrr 🤍`;
    michi.speechTimer = 170;

    // 1. Tuberías bajas y accesibles
    const pipeXs = [460, 1240, 2000];
    pipeXs.forEach((px, i) => {
      const h = 62 + ((i * 14 + idx * 10) % 22);
      pipes.push({ x: px, y: GROUND_Y - h, w: 58, h });
    });

    // 2. Plataformas amplias
    const platXs = [750, 1510];
    platXs.forEach(plx => {
      platforms.push({ x: plx, y: 330, w: 165, h: 20 });
    });

    // 3. Escalera final suave hacia el Altar Celestial
    const stairStart = lvl.length - 420;
    for (let s = 0; s < 4; s++) {
      platforms.push({
        x: stairStart + s * 56,
        y: GROUND_Y - (s + 1) * 36,
        w: 60,
        h: 20
      });
    }

    // 4. Bloques (?) de Bonus No-Intrusivos
    const blockXs = [610, 1380];
    blockXs.forEach((bx, i) => {
      const by = 285;
      blocks.push({
        x: bx, y: by, w: 42, h: 42,
        type: 'memory',
        used: false,
        bounce: 0,
        quote: i === 0 ? '¡Prrrr! ¡Mi pechito blanco te da fuerzas! 🤍 +300' : '¡Miau! ¡Sigue adelante, yo te cuido! 😉✨ +300'
      });
      blocks.push({ x: bx - 46, y: by, w: 42, h: 42, type: 'brick', used: false, bounce: 0 });
      blocks.push({ x: bx + 46, y: by, w: 42, h: 42, type: 'brick', used: false, bounce: 0 });
    });

    // 5. Monedas al nivel del suelo para recogerlas simplemente caminando
    for (let cx = 150; cx < lvl.length - 480; cx += 52) {
      addSafeCoin(cx, GROUND_Y - 22);
    }

    platforms.forEach(pl => {
      if (pl.x < stairStart) {
        addSafeCoin(pl.x + 32, pl.y - 22);
        addSafeCoin(pl.x + 82, pl.y - 22);
        addSafeCoin(pl.x + 132, pl.y - 22);
      }
    });

    // 6. Sombras de Tristeza
    const enemyRanges = [
      { min: 530, max: 920, start: 700 },
      { min: 1310, max: 1700, start: 1500 },
      { min: 2070, max: stairStart - 30, start: 2150 }
    ];
    enemyRanges.forEach(er => {
      enemies.push({
        x: er.start,
        y: GROUND_Y,
        w: 36,
        h: 32,
        vx: -(1.15 + idx * 0.14),
        minX: er.min,
        maxX: er.max,
        healed: false
      });
    });

    updateHUD();
  }

  function updateHUD() {
    const lvl = LEVELS[currentLevelIdx];
    hudScore.textContent = String(score).padStart(6, '0');
    hudCoins.textContent = `🐾 ${String(totalCoinsCollected).padStart(2, '0')}`;
    hudMemories.textContent = `⭐ ${levelMemoriesCollected}/${totalMemoriesInLevel}`;
    hudWorld.textContent = lvl.id;
  }

  // ==========================================================================
  // 6. POSES, GUIÑOS, MAULLIDOS Y RONRONEO EN TIEMPO REAL
  // ==========================================================================
  const POSE_QUOTES = [
    "¡Guiño de Michi y ronroneo! 😉✨ Prrrr...",
    "¡Mira mi pechito blanco! 🤍 Prrrr...",
    "¡De cuerpo entero contigo! 🐾",
    "¡Sigue adelante! 🌟 Miau 🤍",
    "¡Te amo mucho! ❤️ Prrrr..."
  ];

  function triggerWinkAndPose() {
    if (gameState !== 'playing') return;
    michi.winkTimer = 95;
    michi.purrTimer = 95;
    michi.poseLockTimer = 60;
    const poses = ['wink', 'belly', 'hero', 'stretch'];
    michi.pose = poses[Math.floor(Math.random() * poses.length)];
    michi.speechText = POSE_QUOTES[Math.floor(Math.random() * POSE_QUOTES.length)];
    michi.speechTimer = 115;
    sound.winkSound();
    sound.purr(1.3);
    spawnSparkles(michi.x, michi.y - 30, '#ffd700', 14);
    score += 50;
    updateHUD();
  }

  function triggerMeow() {
    if (gameState !== 'playing') return;
    sound.meow(Math.random() > 0.5 ? 1 : 0);
    setTimeout(() => sound.purr(1.2), 280);
    michi.winkTimer = 65;
    michi.purrTimer = 90;
    michi.speechText = "¡Miau! Prrrr... 🐾🤍 ¡Ánimo, sigue adelante!";
    michi.speechTimer = 115;
    spawnSparkles(michi.x + michi.facing * 18, michi.y - 34, '#ff85c0', 12);

    enemies.forEach(en => {
      if (!en.healed && Math.hypot(en.x - michi.x, en.y - michi.y) < 170) {
        healEnemy(en);
      }
    });
  }

  function healEnemy(en) {
    en.healed = true;
    sound.stomp();
    score += 200;
    updateHUD();
    spawnSparkles(en.x, en.y - 16, '#a8ffb2', 15);
    addFloatingText(en.x, en.y - 35, '¡Tristeza Superada! 🌸 +200', '#a8ffb2');
  }

  function requestJump() {
    jumpBufferTimer = 10; // Permite que el salto responda aunque toques un instante antes de tocar el piso
  }

  // ==========================================================================
  // 7. FÍSICA CON ASISTENCIA MÓVIL (COYOTE TIME, JUMP BUFFER, IMÁN DE MONEDAS)
  // ==========================================================================
  function updateGame() {
    globalTick++;
    if (gameState !== 'playing') return;

    const lvl = LEVELS[currentLevelIdx];

    michi.animTimer++;
    if (michi.winkTimer > 0) michi.winkTimer--;
    if (michi.purrTimer > 0) michi.purrTimer--;
    if (michi.speechTimer > 0) michi.speechTimer--;
    if (jumpBufferTimer > 0) jumpBufferTimer--;
    if (michi.onGround) {
      coyoteTimer = 8;
    } else if (coyoteTimer > 0) {
      coyoteTimer--;
    }

    if (michi.auraTimer > 0) {
      michi.auraTimer--;
      michi.goldenAura = true;
    } else {
      michi.goldenAura = false;
    }

    const accel = 0.55;
    const maxSpeed = michi.goldenAura ? 5.4 : 4.5;

    const moveLeft = keys.left;
    const moveRight = keys.right || (autoRunEnabled && !keys.left && !keys.down);

    if (moveLeft) {
      michi.vx = Math.max(michi.vx - accel, -maxSpeed);
      michi.facing = -1;
      michi.idleTime = 0;
    } else if (moveRight) {
      michi.vx = Math.min(michi.vx + accel, maxSpeed);
      michi.facing = 1;
      michi.idleTime = 0;
    } else {
      michi.vx *= 0.8;
      if (Math.abs(michi.vx) < 0.1) michi.vx = 0;
      michi.idleTime++;
    }

    if (keys.up) {
      jumpBufferTimer = 8;
    }

    // Ejecutar salto con Coyote Time + Jump Buffer (súper cómodo en pantalla táctil)
    if (jumpBufferTimer > 0 && coyoteTimer > 0) {
      michi.vy = -12.6;
      michi.onGround = false;
      coyoteTimer = 0;
      jumpBufferTimer = 0;
      michi.idleTime = 0;
      sound.jump();
      spawnSparkles(michi.x, michi.y, '#ffffff', 5);
    }

    if (keys.down && michi.onGround && globalTick % 80 === 0) {
      sound.purr(1.2);
      michi.purrTimer = 60;
      addFloatingText(michi.x, michi.y - 60, 'Prrrr... 🤍', '#ffea85');
    }

    michi.vy += GRAVITY;
    michi.x += michi.vx;
    michi.y += michi.vy;

    if (michi.x < 30) michi.x = 30;

    michi.onGround = false;
    if (michi.y >= GROUND_Y) {
      michi.y = GROUND_Y;
      michi.vy = 0;
      michi.onGround = true;
    }

    // Colisión con Tuberías (+ Auto-Salto de ayuda si choca corriendo en celular)
    pipes.forEach(p => {
      const halfW = michi.w * 0.45;
      if (michi.x + halfW > p.x && michi.x - halfW < p.x + p.w) {
        if (michi.vy >= 0 && michi.y >= p.y && michi.y - michi.vy <= p.y + 10) {
          michi.y = p.y;
          michi.vy = 0;
          michi.onGround = true;
        } else if (michi.y > p.y + 6) {
          if (michi.x < p.x + p.w / 2) {
            michi.x = p.x - halfW;
            // Si está en Auto-Correr en celular, salta sola la tubería como en Super Mario Run
            if (autoRunEnabled && michi.onGround) {
              michi.vy = -12.5;
              michi.onGround = false;
              sound.jump();
            }
          } else {
            michi.x = p.x + p.w + halfW;
          }
        }
      }
    });

    platforms.forEach(pl => {
      const halfW = michi.w * 0.42;
      if (
        michi.vy >= 0 &&
        michi.x + halfW > pl.x &&
        michi.x - halfW < pl.x + pl.w &&
        michi.y >= pl.y &&
        michi.y - michi.vy <= pl.y + 12
      ) {
        michi.y = pl.y;
        michi.vy = 0;
        michi.onGround = true;
      }
    });

    blocks.forEach(b => {
      if (b.bounce > 0) b.bounce -= 1.5;
      const halfW = michi.w * 0.42;
      const overlapX = michi.x + halfW > b.x && michi.x - halfW < b.x + b.w;
      const headY = michi.y - michi.h;

      if (overlapX && michi.vy < 0 && headY <= b.y + b.h && headY - michi.vy >= b.y + b.h - 15) {
        michi.vy = 2.5;
        b.bounce = 10;
        if (b.type === 'memory' && !b.used) {
          b.used = true;
          score += 300;
          michi.auraTimer = 320;
          michi.winkTimer = 110;
          michi.purrTimer = 110;
          michi.speechText = b.quote;
          michi.speechTimer = 140;
          sound.memoryFanfare();
          sound.meow(1);
          setTimeout(() => sound.purr(1.4), 250);
          spawnSparkles(b.x + b.w / 2, b.y, '#ffd700', 22);
          addFloatingText(b.x + 20, b.y - 14, '+300 ✨ Prrrr 🤍', '#ffd700');
          updateHUD();
        } else if (b.type === 'brick' && !b.used) {
          b.used = true;
          score += 100;
          totalCoinsCollected++;
          sound.coin();
          spawnSparkles(b.x + b.w / 2, b.y, '#f48c25', 10);
          addFloatingText(b.x + 20, b.y - 10, '+100 🐾', '#ffd700');
          updateHUD();
        } else {
          sound.stomp();
        }
      }

      if (overlapX && michi.vy >= 0 && michi.y >= b.y && michi.y - michi.vy <= b.y + 12) {
        michi.y = b.y;
        michi.vy = 0;
        michi.onGround = true;
      }
    });

    // RECOLECCIÓN DE MONEDAS CON IMÁN SUAVE + CAJA DE CUERPO COMPLETO
    const michiLeft = michi.x - 28;
    const michiRight = michi.x + 28;
    const michiTop = michi.y - 62;
    const michiBottom = michi.y + 6;

    coins.forEach(c => {
      if (c.collected) return;
      // Imán suave cuando Michi pasa cerca para que sea muy satisfactorio en celular
      const distCenter = Math.hypot(michi.x - c.x, (michi.y - 25) - c.y);
      if (distCenter < 75) {
        c.x += (michi.x - c.x) * 0.18;
        c.y += ((michi.y - 25) - c.y) * 0.18;
      }

      const closestX = Math.max(michiLeft, Math.min(c.x, michiRight));
      const closestY = Math.max(michiTop, Math.min(c.y, michiBottom));
      const dist = Math.hypot(c.x - closestX, c.y - closestY);

      if (dist <= c.r + 8) {
        c.collected = true;
        totalCoinsCollected++;
        score += 50;
        sound.coin();
        spawnSparkles(c.x, c.y, '#ffd700', 6);
        addFloatingText(c.x, c.y - 14, '+50', '#ffea85');
        updateHUD();
      }
    });

    // Carteles "🐾 MICHI DICE:"
    checkpoints.forEach(cp => {
      if (Math.abs(michi.x - cp.x) < 110 && !cp.visited) {
        cp.visited = true;
        levelMemoriesCollected++;
        score += 250;
        michi.winkTimer = 95;
        michi.purrTimer = 110;
        sound.meow(0);
        setTimeout(() => sound.purr(1.5), 220);
        spawnSparkles(cp.x, GROUND_Y - 60, '#ffd700', 16);
        addFloatingText(cp.x, GROUND_Y - 85, '¡Michi ronronea para ti! Prrrr 🤍', '#a8ffb2');
        updateHUD();
      }
    });

    // Sombras de Tristeza (Perdonadoras en celular: si las rozas o saltas cerca se transforman en flores)
    enemies.forEach(en => {
      if (en.healed) return;
      en.x += en.vx;
      if (en.x < en.minX || en.x > en.maxX) en.vx *= -1;

      const distX = Math.abs(michi.x - en.x);
      const distY = Math.abs((michi.y - 18) - (en.y - 16));

      if (distX < 32 && distY < 32) {
        if (michi.vy > -1 || michi.y < en.y - 6 || michi.goldenAura || autoRunEnabled) {
          michi.vy = -9.5;
          healEnemy(en);
        } else {
          michi.vy = -8;
          michi.vx = -michi.facing * 4;
          michi.winkTimer = 70;
          michi.speechText = "¡Mi capa nos protege! ¡Sigue adelante! ✨";
          michi.speechTimer = 110;
          sound.winkSound();
          spawnSparkles(michi.x, michi.y - 22, '#ffd700', 12);
        }
      }
    });

    if (michi.poseLockTimer > 0) {
      michi.poseLockTimer--;
    } else if (!michi.onGround) {
      michi.pose = 'jump';
    } else if (Math.abs(michi.vx) > 0.35) {
      michi.pose = 'run';
    } else if (keys.down) {
      michi.pose = 'groom';
    } else if (michi.idleTime > 130) {
      michi.pose = (Math.floor(globalTick / 90) % 2 === 0) ? 'belly' : 'wink';
    } else {
      michi.pose = 'idle';
    }

    const targetCamX = Math.max(0, Math.min(michi.x - 260, lvl.length - canvas.width + 220));
    cameraX += (targetCamX - cameraX) * 0.12;

    if (michi.x >= lvl.length - 90) {
      completeCurrentLevel();
    }

    particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.life--; });
    particles = particles.filter(p => p.life > 0);

    floatingTexts.forEach(ft => { ft.y -= 0.9; ft.life--; });
    floatingTexts = floatingTexts.filter(ft => ft.life > 0);
  }

  function completeCurrentLevel() {
    sound.memoryFanfare();
    sound.purr(1.6);
    const lvl = LEVELS[currentLevelIdx];

    if (currentLevelIdx < LEVELS.length - 1) {
      gameState = 'stage_clear';
      stageClearTitle.textContent = `¡Michi completó el Mundo ${lvl.id}: ${lvl.name}!`;
      stageClearQuote.textContent = lvl.clearQuote;
      stageClearModal.classList.remove('hidden');
    } else {
      gameState = 'tribute';
      sound.startBGM('tribute');
      tributeStats.textContent = `PUNTUACIÓN: ${score}  |  MONEDAS: ${totalCoinsCollected}  |  4 MUNDOS COMPLETADOS 🐾`;
      tributeScreen.classList.remove('hidden');
    }
  }

  // ==========================================================================
  // 8. RENDERIZADO 2D
  // ==========================================================================
  function renderGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const lvl = LEVELS[currentLevelIdx];

    const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGrad.addColorStop(0, lvl.skyTop);
    skyGrad.addColorStop(1, lvl.skyBottom);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
    for (let i = 0; i < 38; i++) {
      const sx = ((i * 197 - cameraX * 0.1) % canvas.width + canvas.width) % canvas.width;
      const sy = 18 + ((i * 67) % 210);
      const twinkle = Math.sin(globalTick * 0.05 + i) * 1.1 + 1.7;
      ctx.beginPath();
      ctx.arc(sx, sy, twinkle, 0, Math.PI * 2);
      ctx.fill();
    }

    drawParallaxScenery();

    ctx.save();
    ctx.translate(-cameraX, 0);

    checkpoints.forEach(cp => drawSignpostBase(cp.x, GROUND_Y, cp.visited));

    platforms.forEach(pl => {
      ctx.fillStyle = '#d97724';
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(pl.x, pl.y, pl.w, pl.h, 6);
      ctx.fill();
      ctx.stroke();
    });

    pipes.forEach(p => {
      const pipeGrad = ctx.createLinearGradient(p.x, 0, p.x + p.w, 0);
      pipeGrad.addColorStop(0, '#1e7e34');
      pipeGrad.addColorStop(0.35, '#5cd85a');
      pipeGrad.addColorStop(1, '#145523');
      ctx.fillStyle = pipeGrad;
      ctx.fillRect(p.x + 4, p.y + 22, p.w - 8, p.h - 22);
      ctx.strokeStyle = '#0c3b17';
      ctx.lineWidth = 2;
      ctx.strokeRect(p.x + 4, p.y + 22, p.w - 8, p.h - 22);
      ctx.fillRect(p.x, p.y, p.w, 22);
      ctx.strokeRect(p.x, p.y, p.w, 22);
    });

    blocks.forEach(b => {
      const by = b.y - b.bounce;
      if (b.type === 'memory') {
        ctx.fillStyle = b.used ? '#8d7b68' : '#ffd700';
        ctx.strokeStyle = '#6b4400';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(b.x, by, b.w, b.h, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = b.used ? '#ccc' : '#7a2e00';
        ctx.font = 'bold 18px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(b.used ? '♥' : '?', b.x + b.w / 2, by + 29);
      } else {
        ctx.fillStyle = b.used ? '#7d6b5d' : '#c84b31';
        ctx.strokeStyle = '#3d1e10';
        ctx.lineWidth = 2;
        ctx.fillRect(b.x, by, b.w, b.h);
        ctx.strokeRect(b.x, by, b.w, b.h);
      }
    });

    coins.forEach(c => {
      if (c.collected) return;
      const bob = Math.sin(globalTick * 0.08 + c.x) * 3;
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(c.x, c.y + bob, c.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#b86b00';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#8b4500';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🐾', c.x, c.y + bob + 4);
    });

    enemies.forEach(en => {
      if (en.healed) {
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🌸', en.x, en.y - 4);
      } else {
        ctx.fillStyle = '#433d5c';
        ctx.beginPath();
        ctx.arc(en.x, en.y - 15, 16, Math.PI, 0, false);
        ctx.lineTo(en.x + 16, en.y);
        ctx.lineTo(en.x - 16, en.y);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(en.x - 5, en.y - 14, 3, 0, Math.PI * 2);
        ctx.arc(en.x + 5, en.y - 14, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    drawCelestialSanctuary(lvl.length, GROUND_Y, currentLevelIdx === LEVELS.length - 1);

    ctx.fillStyle = lvl.groundTop;
    ctx.fillRect(0, GROUND_Y, lvl.length + 600, 14);
    ctx.fillStyle = lvl.groundFill;
    ctx.fillRect(0, GROUND_Y + 14, lvl.length + 600, canvas.height - GROUND_Y);

    drawMichiFullBody(ctx, michi.x, michi.y, 1.32, michi);

    particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.font = `${Math.round(p.size * 4)}px sans-serif`;
      ctx.fillText(p.type === 'heart' ? '♥' : '✦', p.x, p.y);
      ctx.restore();
    });

    floatingTexts.forEach(ft => {
      ctx.save();
      ctx.fillStyle = ft.color;
      ctx.font = 'bold 12px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });

    const readingSignpost = checkpoints.find(cp => Math.abs(michi.x - cp.x) < 165);
    if (!readingSignpost && michi.speechTimer > 0 && michi.speechText) {
      drawSpeechBubble(ctx, michi.x, michi.y - 82, michi.speechText);
    }

    ctx.restore();

    if (readingSignpost) {
      drawMichiSaysBannerTop(readingSignpost);
    }
  }

  function drawParallaxScenery() {
    for (let i = 0; i < 12; i++) {
      const cx = ((i * 380 - cameraX * 0.35) % 2400 + 2400) % 2400 - 100;
      const cy = 58 + (i % 3) * 42;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.beginPath();
      ctx.arc(cx, cy, 22, 0, Math.PI * 2);
      ctx.arc(cx + 20, cy - 7, 26, 0, Math.PI * 2);
      ctx.arc(cx + 42, cy, 20, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = 0; i < 12; i++) {
      const hx = i * 480 - (cameraX * 0.5) % 480;
      ctx.fillStyle = 'rgba(46, 139, 87, 0.42)';
      ctx.beginPath();
      ctx.arc(hx, GROUND_Y, 140, Math.PI, 0, false);
      ctx.fill();
    }
  }

  function drawSignpostBase(x, y, visited) {
    ctx.fillStyle = '#8b5a2b';
    ctx.fillRect(x - 4, y - 48, 8, 48);
    ctx.fillStyle = visited ? '#fff3b0' : '#deb887';
    ctx.strokeStyle = visited ? '#ffd700' : '#5c3a18';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(x - 52, y - 74, 104, 30, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#3b230c';
    ctx.font = 'bold 11px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(visited ? '🤍 MICHI DICE ✨' : '🐾 MICHI DICE:', x, y - 55);
  }

  function drawMichiSaysBannerTop(cp) {
    ctx.save();
    const boxW = 780;
    const boxH = 84;
    const bx = (canvas.width - boxW) / 2;
    const by = 12;

    ctx.fillStyle = 'rgba(18, 12, 40, 0.95)';
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(bx, by, boxW, boxH, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 11px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${cp.title}   •   🔊 Prrrr...`, canvas.width / 2, by + 25);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px Nunito, sans-serif';
    const words = cp.text.split(' ');
    let line1 = '';
    let line2 = '';
    words.forEach(w => {
      if ((line1 + ' ' + w).length < 78) {
        line1 += (line1 ? ' ' : '') + w;
      } else {
        line2 += (line2 ? ' ' : '') + w;
      }
    });

    ctx.fillText(line1, canvas.width / 2, by + 50);
    if (line2) {
      ctx.fillStyle = '#ffea85';
      ctx.fillText(line2, canvas.width / 2, by + 71);
    }
    ctx.restore();
  }

  function drawCelestialSanctuary(x, y, isFinalLevel) {
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(x - 56, y - 260, 8, 260);
    ctx.beginPath();
    ctx.arc(x - 52, y - 265, 11, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(24, 17, 52, 0.95)';
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.roundRect(x, y - 230, 210, 230, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 10px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(isFinalLevel ? 'ALTAR DE MICHI' : 'META DEL MUNDO', x + 105, y - 204);

    const imgToDraw = (imgFullHero.complete && imgFullHero.naturalWidth > 0) ? imgFullHero : imgCape;
    if (imgToDraw.complete && imgToDraw.naturalWidth > 0) {
      ctx.drawImage(imgToDraw, x + 35, y - 190, 140, 145);
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 35, y - 190, 140, 145);
    }

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px Nunito, sans-serif';
    ctx.fillText(isFinalLevel ? '✨ Carta Final ✨' : '✨ Siguiente Mundo ✨', x + 105, y - 20);
  }

  function drawSpeechBubble(c, x, y, text) {
    c.save();
    c.font = 'bold 13px Nunito, sans-serif';
    const w = Math.max(120, c.measureText(text).width + 24);
    c.fillStyle = 'rgba(255, 252, 245, 0.96)';
    c.strokeStyle = '#ffd700';
    c.lineWidth = 2;
    c.beginPath();
    c.roundRect(x - w / 2, y - 34, w, 28, 10);
    c.fill();
    ctx.stroke();

    c.fillStyle = '#1b1430';
    c.textAlign = 'center';
    c.fillText(text, x, y - 15);
    c.restore();
  }

  let showcasePose = 'wink';

  function renderSecondaryCanvases() {
    if (introMichiCtx && !introOverlay.classList.contains('hidden')) {
      introMichiCtx.clearRect(0, 0, introMichiCanvas.width, introMichiCanvas.height);
      const slidePose = INTRO_SLIDES[currentIntroSlide]?.pose2D || 'belly';
      drawMichiFullBody(introMichiCtx, introMichiCanvas.width / 2, 162, 2.2, {
        facing: 1,
        pose: slidePose,
        animTimer: globalTick,
        winkTimer: 10,
        goldenAura: true
      });
    }

    if (titleMichiCtx && !titleScreen.classList.contains('hidden')) {
      titleMichiCtx.clearRect(0, 0, titleMichiCanvas.width, titleMichiCanvas.height);
      const cyclePoses = ['belly', 'wink', 'hero', 'groom'];
      const p = cyclePoses[Math.floor(globalTick / 100) % cyclePoses.length];
      drawMichiFullBody(titleMichiCtx, titleMichiCanvas.width / 2, 134, 1.95, {
        facing: 1,
        pose: p,
        animTimer: globalTick,
        winkTimer: p === 'wink' ? 10 : 0,
        goldenAura: true
      });
    }

    if (pauseMichiCtx && !pauseModal.classList.contains('hidden')) {
      pauseMichiCtx.clearRect(0, 0, pauseMichiCanvas.width, pauseMichiCanvas.height);
      drawMichiFullBody(pauseMichiCtx, pauseMichiCanvas.width / 2, 130, 1.9, {
        facing: 1,
        pose: 'groom',
        animTimer: globalTick,
        winkTimer: 10,
        goldenAura: true
      });
    }

    if (poseCtx && !poseModal.classList.contains('hidden')) {
      poseCtx.clearRect(0, 0, poseCanvas.width, poseCanvas.height);
      poseCtx.fillStyle = '#3d2c6e';
      poseCtx.fillRect(0, 180, poseCanvas.width, 40);
      poseCtx.strokeStyle = '#ffd700';
      poseCtx.lineWidth = 2;
      poseCtx.beginPath();
      poseCtx.moveTo(0, 180);
      poseCtx.lineTo(poseCanvas.width, 180);
      poseCtx.stroke();

      drawMichiFullBody(poseCtx, poseCanvas.width / 2, 180, 2.45, {
        facing: 1,
        pose: showcasePose,
        animTimer: globalTick,
        winkTimer: showcasePose === 'wink' ? 10 : 0,
        goldenAura: true
      });

      poseCtx.fillStyle = '#ffea85';
      poseCtx.font = 'bold 13px Nunito, sans-serif';
      poseCtx.textAlign = 'center';
      const labels = {
        wink: '😉 Cuerpo Completo + Guiño Esmeralda + Mancha en la Nariz',
        belly: '🤍 Erguida Mostrando Todo su Pechito Blanco y sus 4 Patitas Blancas',
        hero: '🦸‍♀️ Capa Negra con Bordes Rojos, Broche de Oro y Toro Rojo',
        groom: '🐾 Sentada de Cuerpo Entero Acicalando su Patita',
        stretch: '🐈 Estiramiento Felino Completo de Pies a Cola',
        run: '🏃‍♀️ Galope Calicó con sus 4 Calcetines Blancos',
        jump: '🚀 Súper Salto Estilo Super Michi Bros.'
      };
      poseCtx.fillText(labels[showcasePose] || '', poseCanvas.width / 2, 206);
    }
  }

  // ==========================================================================
  // 9. NAVEGACIÓN DE MENÚS, PAUSA Y CONTROLES TÁCTILES AVANZADOS
  // ==========================================================================
  function hideAllOverlays() {
    introOverlay.classList.add('hidden');
    titleScreen.classList.add('hidden');
    albumModal.classList.add('hidden');
    levelSelectModal.classList.add('hidden');
    stageClearModal.classList.add('hidden');
    pauseModal.classList.add('hidden');
    poseModal.classList.add('hidden');
    memoriesModal.classList.add('hidden');
    tributeScreen.classList.add('hidden');
  }

  function showMainMenu() {
    hideAllOverlays();
    titleScreen.classList.remove('hidden');
    gameState = 'menu';
    sound.stopBGM();
  }

  function startLevel(idx) {
    hideAllOverlays();
    loadLevel(idx);
    gameState = 'playing';
    sound.startBGM(LEVELS[idx].music);
    sound.meow(0);
    setTimeout(() => sound.purr(1.3), 260);
  }

  function togglePause() {
    if (gameState === 'playing') {
      gameState = 'paused';
      keys.left = false;
      keys.right = false;
      keys.up = false;
      pauseModal.classList.remove('hidden');
      sound.purr(1.2);
    } else if (gameState === 'paused') {
      pauseModal.classList.add('hidden');
      gameState = 'playing';
    }
  }

  introPrevBtn.addEventListener('click', () => {
    sound.winkSound();
    renderIntroSlide(currentIntroSlide - 1);
  });

  introNextBtn.addEventListener('click', () => {
    sound.winkSound();
    if (currentIntroSlide < INTRO_SLIDES.length - 1) {
      renderIntroSlide(currentIntroSlide + 1);
    } else {
      showMainMenu();
    }
  });

  introSkipBtn.addEventListener('click', () => {
    sound.winkSound();
    showMainMenu();
  });

  document.querySelectorAll('.cinema-dots .dot').forEach(d => {
    d.addEventListener('click', () => renderIntroSlide(Number(d.dataset.slide)));
  });

  document.getElementById('start-btn').addEventListener('click', () => {
    score = 0;
    totalCoinsCollected = 0;
    startLevel(0);
  });

  document.getElementById('start-autorun-btn').addEventListener('click', () => {
    score = 0;
    totalCoinsCollected = 0;
    toggleAutoRun(true);
    startLevel(0);
  });

  btnAutorun.addEventListener('click', () => toggleAutoRun());

  document.getElementById('btn-fullscreen').addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  });

  document.getElementById('worldmap-btn').addEventListener('click', () => {
    sound.winkSound();
    levelSelectModal.classList.remove('hidden');
  });

  document.getElementById('close-levels-btn').addEventListener('click', () => {
    levelSelectModal.classList.add('hidden');
  });

  document.querySelectorAll('.level-card').forEach(card => {
    card.addEventListener('click', () => startLevel(Number(card.dataset.level)));
  });

  document.getElementById('gallery-btn').addEventListener('click', () => {
    sound.purr(1.2);
    poseModal.classList.remove('hidden');
  });

  document.getElementById('close-pose-modal').addEventListener('click', () => {
    poseModal.classList.add('hidden');
  });

  document.getElementById('album-btn').addEventListener('click', () => {
    sound.winkSound();
    albumModal.classList.remove('hidden');
  });

  document.getElementById('close-album-btn').addEventListener('click', () => {
    albumModal.classList.add('hidden');
  });

  document.getElementById('memories-btn').addEventListener('click', () => {
    sound.purr(1.2);
    memoriesModal.classList.remove('hidden');
  });

  document.getElementById('close-memories-btn').addEventListener('click', () => {
    memoriesModal.classList.add('hidden');
  });

  document.getElementById('rewatch-intro-btn').addEventListener('click', () => {
    sound.winkSound();
    hideAllOverlays();
    renderIntroSlide(0);
    introOverlay.classList.remove('hidden');
    gameState = 'intro';
  });

  document.getElementById('next-level-btn').addEventListener('click', () => startLevel(currentLevelIdx + 1));
  document.getElementById('stage-menu-btn').addEventListener('click', showMainMenu);

  document.getElementById('btn-pause').addEventListener('click', () => {
    if (gameState === 'playing' || gameState === 'paused') {
      togglePause();
    } else {
      showMainMenu();
    }
  });
  document.getElementById('resume-btn').addEventListener('click', togglePause);
  document.getElementById('restart-level-btn').addEventListener('click', () => startLevel(currentLevelIdx));
  document.getElementById('pause-levels-btn').addEventListener('click', () => {
    pauseModal.classList.add('hidden');
    levelSelectModal.classList.remove('hidden');
  });
  document.getElementById('pause-album-btn').addEventListener('click', () => {
    pauseModal.classList.add('hidden');
    albumModal.classList.remove('hidden');
  });
  document.getElementById('pause-home-btn').addEventListener('click', showMainMenu);

  document.getElementById('replay-btn').addEventListener('click', () => {
    score = 0;
    totalCoinsCollected = 0;
    startLevel(0);
  });
  document.getElementById('tribute-menu-btn').addEventListener('click', showMainMenu);

  document.querySelectorAll('.pose-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.pose-chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      showcasePose = btn.dataset.pose;
      sound.winkSound();
      sound.purr(1.0);
    });
  });

  document.getElementById('btn-music').addEventListener('click', () => sound.toggleMute());

  // Teclado para PC
  window.addEventListener('keydown', e => {
    const code = e.code;
    if (code === 'ArrowLeft' || code === 'KeyA') keys.left = true;
    if (code === 'ArrowRight' || code === 'KeyD') keys.right = true;
    if (code === 'ArrowUp' || code === 'KeyW' || code === 'Space') {
      keys.up = true;
      requestJump();
      if (gameState === 'playing') e.preventDefault();
    }
    if (code === 'ArrowDown' || code === 'KeyS') keys.down = true;

    if (code === 'Escape') {
      if (gameState === 'playing' || gameState === 'paused') togglePause();
    }
    if (code === 'KeyP' || code === 'KeyG') {
      if (gameState === 'playing') triggerWinkAndPose();
    }
    if (code === 'KeyC' || code === 'KeyE') {
      if (gameState === 'playing') triggerMeow();
    }
    if (code === 'KeyM') {
      sound.toggleMute();
    }
  });

  window.addEventListener('keyup', e => {
    const code = e.code;
    if (code === 'ArrowLeft' || code === 'KeyA') keys.left = false;
    if (code === 'ArrowRight' || code === 'KeyD') keys.right = false;
    if (code === 'ArrowUp' || code === 'KeyW' || code === 'Space') keys.up = false;
    if (code === 'ArrowDown' || code === 'KeyS') keys.down = false;
  });

  // ==========================================================================
  // 10. CONTROLES TÁCTILES DE CELULAR (DESLIZAR PULGAR + TOCAR CIELO PARA SALTAR)
  // ==========================================================================
  const btnLeft = document.getElementById('t-left');
  const btnDown = document.getElementById('t-down');
  const btnRight = document.getElementById('t-right');
  const btnJump = document.getElementById('t-jump');
  const btnPose = document.getElementById('t-pose');
  const btnMeow = document.getElementById('t-meow');
  const dpadZone = document.getElementById('dpad-zone');

  // Permite deslizar el pulgar izquierdo entre Izquierda (◀), Sentarse (▼) y Derecha (▶) sin levantar el dedo
  function handleDpadTouch(e) {
    e.preventDefault();
    let leftActive = false;
    let downActive = false;
    let rightActive = false;

    for (let i = 0; i < e.touches.length; i++) {
      const t = e.touches[i];
      const el = document.elementFromPoint(t.clientX, t.clientY);
      if (!el) continue;
      if (el === btnLeft || btnLeft.contains(el)) leftActive = true;
      if (el === btnDown || btnDown.contains(el)) downActive = true;
      if (el === btnRight || btnRight.contains(el)) rightActive = true;
    }

    keys.left = leftActive;
    keys.down = downActive;
    keys.right = rightActive;

    btnLeft.classList.toggle('pressed', leftActive);
    btnDown.classList.toggle('pressed', downActive);
    btnRight.classList.toggle('pressed', rightActive);
  }

  dpadZone.addEventListener('touchstart', handleDpadTouch, { passive: false });
  dpadZone.addEventListener('touchmove', handleDpadTouch, { passive: false });
  dpadZone.addEventListener('touchend', handleDpadTouch, { passive: false });
  dpadZone.addEventListener('touchcancel', handleDpadTouch, { passive: false });

  // Soporte ratón en PC para los mismos botones
  const bindMouseHold = (btn, keyName) => {
    btn.addEventListener('mousedown', () => { keys[keyName] = true; btn.classList.add('pressed'); });
    window.addEventListener('mouseup', () => { keys[keyName] = false; btn.classList.remove('pressed'); });
  };
  bindMouseHold(btnLeft, 'left');
  bindMouseHold(btnDown, 'down');
  bindMouseHold(btnRight, 'right');

  // Botón Gigante de SALTO
  btnJump.addEventListener('touchstart', e => {
    e.preventDefault();
    keys.up = true;
    requestJump();
    btnJump.classList.add('pressed');
  }, { passive: false });

  btnJump.addEventListener('touchend', e => {
    e.preventDefault();
    keys.up = false;
    btnJump.classList.remove('pressed');
  }, { passive: false });

  btnJump.addEventListener('mousedown', () => {
    keys.up = true;
    requestJump();
    btnJump.classList.add('pressed');
  });
  window.addEventListener('mouseup', () => {
    keys.up = false;
    btnJump.classList.remove('pressed');
  });

  // Tocar directamente el escenario (Canvas) en celular también hace saltar a Michi
  canvas.addEventListener('touchstart', e => {
    if (gameState !== 'playing') return;
    e.preventDefault();
    keys.up = true;
    requestJump();
  }, { passive: false });

  canvas.addEventListener('touchend', e => {
    if (gameState !== 'playing') return;
    e.preventDefault();
    keys.up = false;
  }, { passive: false });

  btnPose.addEventListener('touchstart', e => { e.preventDefault(); triggerWinkAndPose(); }, { passive: false });
  btnPose.addEventListener('click', () => triggerWinkAndPose());

  btnMeow.addEventListener('touchstart', e => { e.preventDefault(); triggerMeow(); }, { passive: false });
  btnMeow.addEventListener('click', () => triggerMeow());

  // Inicializar
  loadLevel(0);
  renderIntroSlide(0);

  function loop() {
    updateGame();
    renderGame();
    renderSecondaryCanvases();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
