class GameOverScene extends Phaser.Scene {
  constructor() {
    super("GameOverScene");
  }

  create(data) {
    const stageIndex = data?.stageIndex ?? 0;

    window.audioManager?.unlock();

    this.cameras.main.setBackgroundColor("#100608");

    this.add.text(480, 110, "Fallen", {
      color: "#ff6666",
      fontSize: "52px",
      fontStyle: "bold"
    }).setOrigin(0.5);

    this.add.text(480, 210, "Hanuman has fallen.\nCourage and devotion will restore the path.", {
      color: "#eef3ff",
      fontSize: "20px",
      align: "center",
      wordWrap: { width: 720 }
    }).setOrigin(0.5);

    const tryAgainBtn = this.add.text(380, 345, "Try Again", {
      color: "#0f172a",
      backgroundColor: "#ff8888",
      fontSize: "24px",
      padding: { left: 20, right: 20, top: 10, bottom: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    tryAgainBtn.on("pointerover", () => tryAgainBtn.setStyle({ backgroundColor: "#ffaaaa" }));
    tryAgainBtn.on("pointerout",  () => tryAgainBtn.setStyle({ backgroundColor: "#ff8888" }));
    tryAgainBtn.on("pointerdown", () => {
      this.scene.start("StageScene", { stageIndex });
    });

    const menuBtn = this.add.text(580, 345, "Menu", {
      color: "#0f172a",
      backgroundColor: "#8899ff",
      fontSize: "24px",
      padding: { left: 20, right: 20, top: 10, bottom: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    menuBtn.on("pointerover", () => menuBtn.setStyle({ backgroundColor: "#aabbff" }));
    menuBtn.on("pointerout",  () => menuBtn.setStyle({ backgroundColor: "#8899ff" }));
    menuBtn.on("pointerdown", () => {
      this.scene.start("MenuScene");
    });
  }
}

window.GameOverScene = GameOverScene;
