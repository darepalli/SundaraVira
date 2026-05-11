class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    this.load.json("stage1", "./assets/data/stages/stage1.json");
    this.load.json("stage2-mainaka", "./assets/data/stages/stage2-mainaka.json");
  }

  create() {
    if (!window.audioManager) {
      window.audioManager = new window.AudioManager();
      // Preload audio assets asynchronously; game starts immediately with synthesis fallback
      window.audioManager.preloadAudioAssets().catch(err => {
        console.warn("[BootScene] Audio preload error:", err);
      });
    }

    this.scene.start("MenuScene");
  }
}

window.BootScene = BootScene;
