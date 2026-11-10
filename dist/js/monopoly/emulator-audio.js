// =========================================================================
// 🔊 EMULATOR AUDIO SYNTH — Patrón: Singleton & Facade
// Sintetizador Chiptune 8-Bit en Web Audio API (Cero dependencias externas)
// =========================================================================
(function() {
  class EmulatorAudio {
    constructor() {
      if (EmulatorAudio.instance) return EmulatorAudio.instance;
      this.ctx = null;
      this.muted = false;
      this.bgmTimer = null;
      this.bgmStep = 0;
      EmulatorAudio.instance = this;
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    }

    toggleMute() {
      this.init();
      this.muted = !this.muted;
      if (this.muted) this.stopBGM();
      return this.muted;
    }

    beep(freq = 440, dur = 0.08, type = 'square', vol = 0.07, slide = null) {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);
        if (slide) osc.frequency.exponentialRampToValueAtTime(slide, now + dur);
        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + dur);
      } catch (e) {}
    }

    bootRom() {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
        setTimeout(() => this.beep(f, 0.12, 'square', 0.08), i * 85);
      });
    }

    diceRoll() {
      for (let i = 0; i < 6; i++) {
        setTimeout(() => this.beep(220 + Math.random() * 480, 0.045, 'triangle', 0.08), i * 50);
      }
    }

    stepHop() {
      this.beep(380, 0.05, 'square', 0.05, 540);
    }

    buyProperty() {
      [587.33, 783.99, 987.77, 1174.66].forEach((f, i) => {
        setTimeout(() => this.beep(f, 0.11, 'square', 0.08), i * 70);
      });
    }

    payRent() {
      [440, 392, 330, 261.63].forEach((f, i) => {
        setTimeout(() => this.beep(f, 0.1, 'sawtooth', 0.06), i * 75);
      });
    }

    jailSiren() {
      this.beep(620, 0.2, 'sawtooth', 0.08, 320);
      setTimeout(() => this.beep(320, 0.25, 'sawtooth', 0.08, 620), 210);
    }

    startBGM() {
      if (this.muted || this.bgmTimer) return;
      this.init();
      const notes = [
        261.63, 329.63, 392.00, 523.25, 392.00, 329.63, 293.66, 349.23,
        440.00, 587.33, 440.00, 349.23, 329.63, 392.00, 493.88, 659.25
      ];
      this.bgmTimer = setInterval(() => {
        if (this.muted) return;
        const n = notes[this.bgmStep % notes.length];
        this.beep(n, 0.11, 'triangle', 0.025);
        this.bgmStep++;
      }, 240);
    }

    stopBGM() {
      if (this.bgmTimer) {
        clearInterval(this.bgmTimer);
        this.bgmTimer = null;
      }
    }
  }

  window.EmulatorAudio = new EmulatorAudio();
})();
