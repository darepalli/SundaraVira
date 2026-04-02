class VictoryScene extends Phaser.Scene {
  constructor() {
    super("VictoryScene");
  }

  create(data) {
    const summary = data?.summary || "Mission complete.";
    const tip = data?.tip || "Tip: Keep chanting before difficult traversal segments.";

    window.audioManager?.unlock();
    window.audioManager?.playVictory();

    this.cameras.main.setBackgroundColor("#0a1428");

    this.add.text(480, 130, "Victory", {
      color: "#ffd37a",
      fontSize: "44px",
      fontStyle: "bold"
    }).setOrigin(0.5);

    this.add.text(480, 220, summary, {
      color: "#eef3ff",
      fontSize: "22px",
      align: "center",
      wordWrap: { width: 720 }
    }).setOrigin(0.5);

    this.add.text(480, 290, tip, {
      color: "#b8c9ff",
      fontSize: "17px",
      align: "center",
      wordWrap: { width: 720 }
    }).setOrigin(0.5);

    const replayButton = this.add.text(480, 390, "Play Again", {
      color: "#0f172a",
      backgroundColor: "#73ffaa",
      fontSize: "24px",
      padding: { left: 18, right: 18, top: 10, bottom: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    replayButton.on("pointerdown", () => {
      document.getElementById("sv-contribute-overlay")?.remove();
      this.scene.start("MenuScene");
    });

    window.ContributeForm?.maybeShow({ outcome: "victory" });
  }
}

window.VictoryScene = VictoryScene;
