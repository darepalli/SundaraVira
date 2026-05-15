class AudioManager {
  constructor() {
    this.context = null;
    this.enabled = true;
    this.masterVolume = 0.12;
    this.audioBuffers = {}; // Preloaded audio files
    this.useAudioFiles = false; // Toggle between synth and files
    this.lastChantAt = 0;
    this.minChantGapMs = 380;
    this.missingAudioFiles = [];
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

  // Load audio file and decode it
  async loadAudioFile(name, filePath) {
    const ctx = this.ensureContext();
    if (!ctx) {
      return false;
    }

    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        if (response.status === 404) {
          this.missingAudioFiles.push(filePath);
        } else {
          console.warn(`[AudioManager] Could not load audio file: ${filePath} (${response.status})`);
        }
        return false;
      }

      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      this.audioBuffers[name] = audioBuffer;
      this.useAudioFiles = true;
      return true;
    } catch (error) {
      console.warn(`[AudioManager] Error loading audio file ${name}: ${error.message}`);
      return false;
    }
  }

  // Preload all audio assets at startup
  async preloadAudioAssets() {
    this.missingAudioFiles = [];

    const assets = [
      { name: "jump", path: "assets/audio/jump-jai-shri-ram.mp3" },
      { name: "collect", path: "assets/audio/collect-jai-shri-ram.mp3" },
      { name: "enemyDefeat", path: "assets/audio/enemy-defeat-jai-siyaram.mp3" },
      { name: "blast", path: "assets/audio/blast-jai-siyaram.mp3" },
      { name: "stageTransition", path: "assets/audio/stage-transition-jai-shri-ram.mp3" },
      { name: "victory", path: "assets/audio/victory-jai-shri-ram.mp3" }
    ];

    let loadedCount = 0;
    for (const asset of assets) {
      const loaded = await this.loadAudioFile(asset.name, asset.path);
      if (loaded) loadedCount++;
    }

    if (loadedCount > 0) {
      console.info(`[AudioManager] Preloaded ${loadedCount}/${assets.length} audio files. Using real audio.`);
      this.useAudioFiles = true;
    } else {
      console.info("[AudioManager] No audio files found. Falling back to tone synthesis.");
      this.useAudioFiles = false;
    }

    if (this.missingAudioFiles.length > 0) {
      console.info(`[AudioManager] Optional audio files missing (${this.missingAudioFiles.length}/${assets.length}).`);
    }
  }

  // Play audio file with fallback to tone synthesis
  playAudioFile(name, synth) {
    if (!this.enabled) {
      return;
    }

    if (this.useAudioFiles && this.audioBuffers[name]) {
      try {
        const ctx = this.ensureContext();
        if (!ctx) {
          synth();
          return;
        }

        const source = ctx.createBufferSource();
        const gainNode = ctx.createGain();

        source.buffer = this.audioBuffers[name];
        gainNode.gain.value = this.masterVolume;

        source.connect(gainNode);
        gainNode.connect(ctx.destination);

        source.start(ctx.currentTime);
      } catch (error) {
        console.warn(`[AudioManager] Error playing audio file ${name}, falling back to synth: ${error.message}`);
        synth();
      }
    } else {
      // Fallback to tone synthesis
      synth();
    }
  }

  speakChant(text) {
    return this.speakText(text, {
      rate: 1.0,
      pitch: 1.0,
      volumeScale: 2.8
    });
  }

  _createSpeechUtterance(synth, text, options = {}) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options.rate ?? 1.0;
    utterance.pitch = options.pitch ?? 1.0;
    const volumeScale = options.volumeScale ?? 2.8;
    utterance.volume = Math.max(0.2, Math.min(1, this.masterVolume * volumeScale));

    const preferredLang = typeof options.lang === "string" && options.lang.length > 0 ? options.lang : "";
    const fallbackLang = typeof options.fallbackLang === "string" && options.fallbackLang.length > 0
      ? options.fallbackLang
      : "";

    const pickVoice = (langCode) => {
      if (!langCode) {
        return null;
      }
      const voices = synth.getVoices?.() || [];
      if (!voices.length) {
        return null;
      }
      const normalized = langCode.toLowerCase();
      const exact = voices.find((v) => (v.lang || "").toLowerCase() === normalized);
      if (exact) {
        return exact;
      }
      return voices.find((v) => (v.lang || "").toLowerCase().startsWith(normalized.split("-")[0]));
    };

    const preferredVoice = pickVoice(preferredLang);
    const fallbackVoice = preferredVoice ? null : pickVoice(fallbackLang);
    const selectedVoice = preferredVoice || fallbackVoice;

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
    } else if (preferredLang) {
      utterance.lang = preferredLang;
    } else if (fallbackLang) {
      utterance.lang = fallbackLang;
    }

    return utterance;
  }

  hasVoiceForLang(langCode) {
    const synth = window.speechSynthesis;
    if (!synth || typeof SpeechSynthesisUtterance === "undefined") {
      return false;
    }

    const voices = synth.getVoices?.() || [];
    if (!voices.length || !langCode) {
      return false;
    }

    const normalized = String(langCode).toLowerCase();
    return voices.some((voice) => {
      const voiceLang = String(voice.lang || "").toLowerCase();
      return voiceLang === normalized || voiceLang.startsWith(normalized.split("-")[0]);
    });
  }

  speakText(text, options = {}) {
    const synth = window.speechSynthesis;
    if (!synth || typeof SpeechSynthesisUtterance === "undefined") {
      return false;
    }

    const now = Date.now();
    const minGapMs = Number.isFinite(options.minGapMs) ? options.minGapMs : this.minChantGapMs;
    if (!options.force && now - this.lastChantAt < minGapMs) {
      return true;
    }
    this.lastChantAt = now;

    try {
      const utterance = this._createSpeechUtterance(synth, text, options);

      if (options.cancelPrevious !== false) {
        synth.cancel();
      }
      synth.speak(utterance);
      return true;
    } catch (_error) {
      return false;
    }
  }

  speakTextAndWait(text, options = {}) {
    const synth = window.speechSynthesis;
    if (!synth || typeof SpeechSynthesisUtterance === "undefined") {
      return Promise.resolve(0);
    }

    const now = Date.now();
    const minGapMs = Number.isFinite(options.minGapMs) ? options.minGapMs : this.minChantGapMs;
    if (!options.force && now - this.lastChantAt < minGapMs) {
      return Promise.resolve(0);
    }
    this.lastChantAt = now;

    const estimatedMs = Number.isFinite(options.estimatedDurationMs)
      ? options.estimatedDurationMs
      : Math.min(14000, Math.max(1800, String(text).length * 95));

    try {
      const utterance = this._createSpeechUtterance(synth, text, options);
      return new Promise((resolve) => {
        const startedAt = Date.now();
        let settled = false;
        const finish = () => {
          if (settled) {
            return;
          }
          settled = true;
          window.clearTimeout(fallbackTimer);
          resolve(Math.max(0, Date.now() - startedAt));
        };

        utterance.onend = finish;
        utterance.onerror = finish;
        const fallbackTimer = window.setTimeout(finish, estimatedMs + 2000);
        if (options.cancelPrevious !== false) {
          synth.cancel();
        }
        synth.speak(utterance);
      });
    } catch (_error) {
      return Promise.resolve(0);
    }
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
    this.playAudioFile("jump", () => {
      this.playTone({ startFreq: 420, endFreq: 620, duration: 0.11, type: "triangle", volume: 0.5 });
    });
  }

  playCollect() {
    this.playAudioFile("collect", () => {
      if (!this.speakChant("Jai Shri Ram")) {
        this.playTone({ startFreq: 620, endFreq: 940, duration: 0.12, type: "sine", volume: 0.55 });
      }
    });
  }

  playEnemyDefeat() {
    this.playAudioFile("enemyDefeat", () => {
      if (!this.speakChant("Jai Siyaram")) {
        this.playTone({ startFreq: 360, endFreq: 220, duration: 0.12, type: "triangle", volume: 0.5 });
      }
    });
  }

  playBlast() {
    this.playAudioFile("blast", () => {
      this.playTone({ startFreq: 220, endFreq: 110, duration: 0.2, type: "sawtooth", volume: 0.7 });
    });
  }

  playStageTransition() {
    this.playAudioFile("stageTransition", () => {
      this.playTone({ startFreq: 330, endFreq: 660, duration: 0.16, type: "triangle", volume: 0.6 });
      window.setTimeout(() => {
        this.playTone({ startFreq: 660, endFreq: 990, duration: 0.16, type: "triangle", volume: 0.5 });
      }, 130);
    });
  }

  playVictory() {
    this.playAudioFile("victory", () => {
      this.playTone({ startFreq: 520, endFreq: 780, duration: 0.2, type: "sine", volume: 0.65 });
      window.setTimeout(() => {
        this.playTone({ startFreq: 780, endFreq: 1040, duration: 0.24, type: "sine", volume: 0.65 });
      }, 170);
    });
  }
}

window.AudioManager = AudioManager;
