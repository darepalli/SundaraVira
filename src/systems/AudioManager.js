class AudioManager {
  constructor() {
    this.context = null;
    this.enabled = true;
    this.masterVolume = 0.12;
  }

  ensureContext() {
    if (this.context) {
      return this.context;
    }

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) {
      this.enabled = false;
      return null;
    }

    this.context = new AudioCtx();
    return this.context;
  }

  unlock() {
    const ctx = this.ensureContext();
    if (!ctx) {
      return;
    }

    if (ctx.state === "suspended") {
      ctx.resume();
    }
  }

  setVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  playTone(options) {
    if (!this.enabled) {
      return;
    }

    const ctx = this.ensureContext();
    if (!ctx) {
      return;
    }

    const now = ctx.currentTime;
    const duration = options.duration ?? 0.12;
    const startFreq = options.startFreq ?? 440;
    const endFreq = options.endFreq ?? startFreq;
    const type = options.type ?? "sine";
    const volume = (options.volume ?? 0.6) * this.masterVolume;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.linearRampToValueAtTime(endFreq, now + duration);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.03);
  }

  playJump() {
    this.playTone({ startFreq: 420, endFreq: 620, duration: 0.11, type: "triangle", volume: 0.5 });
  }

  playCollect() {
    this.playTone({ startFreq: 620, endFreq: 940, duration: 0.12, type: "sine", volume: 0.55 });
  }

  playBlast() {
    this.playTone({ startFreq: 220, endFreq: 110, duration: 0.2, type: "sawtooth", volume: 0.7 });
  }

  playStageTransition() {
    this.playTone({ startFreq: 330, endFreq: 660, duration: 0.16, type: "triangle", volume: 0.6 });
    window.setTimeout(() => {
      this.playTone({ startFreq: 660, endFreq: 990, duration: 0.16, type: "triangle", volume: 0.5 });
    }, 130);
  }

  playVictory() {
    this.playTone({ startFreq: 520, endFreq: 780, duration: 0.2, type: "sine", volume: 0.65 });
    window.setTimeout(() => {
      this.playTone({ startFreq: 780, endFreq: 1040, duration: 0.24, type: "sine", volume: 0.65 });
    }, 170);
  }
}

window.AudioManager = AudioManager;
