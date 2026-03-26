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
    }

    this.scene.start("MenuScene");
  }
}

window.BootScene = BootScene;
