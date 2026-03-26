class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create() {
    const W = 960, H = 540;
    const cx = W / 2;

    // ── Deep night sky gradient (layered rects) ───────────────────────
    this.add.rectangle(cx, 135, W, 270, 0x03071a, 1).setDepth(-10);
    this.add.rectangle(cx, 340, W, 200, 0x0a0d22, 1).setDepth(-10);
    this.add.rectangle(cx, 490, W, 100, 0x1a0608, 1).setDepth(-10);

    // Horizon glow — Lanka fire
    this.add.ellipse(cx, 490, W, 120, 0x8b1a00, 0.45).setDepth(-9);
    this.add.ellipse(cx, 490, 550, 70, 0xcc3300, 0.22).setDepth(-9);

    // ── Starfield ────────────────────────────────────────────────────
    const stars = [
      [55,18,1.5],[140,42,1],[220,10,2],[310,52,1],[395,20,1.5],[470,8,1],
      [550,35,2],[630,14,1],[715,48,1.5],[800,22,1],[880,9,2],[935,50,1],
      [88,72,1],[175,78,1.5],[265,62,1],[360,90,2],[445,72,1],[525,85,1.5],
      [605,68,1],[690,83,2],[770,58,1],[855,76,1.5],[910,92,1],[32,102,1],
      [115,114,1.5],[205,100,1],[315,110,2],[400,122,1],[485,96,1.5],
      [565,118,1],[650,105,2],[745,120,1.5],[825,98,1],[945,108,1],[70,132,1.5],
      [150,148,1],[255,138,2],[355,150,1],[472,132,1.5],[578,145,1],[665,138,2],
      [752,154,1.5],[872,140,1]
    ];

    stars.forEach(([x, y, r], i) => {
      const a = 0.5 + (i % 5) * 0.09;
      const dot = this.add.circle(x, y, r, 0xfff8e8, a).setDepth(-8);
      if (i % 3 === 0) {
        this.tweens.add({
          targets: dot,
          alpha: { from: a, to: a * 0.25 },
          duration: 1100 + (i * 173) % 1600,
          yoyo: true, repeat: -1, ease: "Sine.inOut"
        });
      }
    });

    // ── Moon ──────────────────────────────────────────────────────────
    this.add.circle(820, 52, 26, 0xf5e8a0, 0.92).setDepth(-7);
    this.add.circle(820, 52, 38, 0xf5e8a0, 0.10).setDepth(-8);  // halo
    this.add.circle(835, 46, 20, 0x03071a, 1).setDepth(-6);      // crescent bite

    // ── Lanka fortress silhouette ─────────────────────────────────────
    [[680,428,18,80],[710,436,22,72],[740,420,28,96],[772,432,22,80],[803,425,18,88]].forEach(([tx,ty,tw,th]) => {
      this.add.rectangle(tx, ty, tw, th, 0x1a0404, 0.85).setDepth(-5);
      this.add.rectangle(tx, ty - th/2 - 4, tw + 4, 8, 0x240808, 0.88).setDepth(-5);
    });
    this.add.rectangle(742, 468, 220, 26, 0x160404, 0.90).setDepth(-5);

    // ── Ocean ────────────────────────────────────────────────────────
    this.add.rectangle(cx, 515, W, 50, 0x02090f, 1).setDepth(-6);
    this.add.rectangle(cx, 496, W, 18, 0x0f2a3a, 0.88).setDepth(-5);
    this.add.rectangle(cx, 488, W, 8, 0x4ab0d0, 0.18).setDepth(-4);

    // ── Title ────────────────────────────────────────────────────────
    // Outer glow shadow behind title
    this.add.text(cx, 142, "Sundara Vira", {
      color: "#a04000", fontSize: "54px", fontStyle: "bold",
      fontFamily: "'Georgia','Times New Roman',serif",
      stroke: "#000000", strokeThickness: 10
    }).setOrigin(0.5).setDepth(8).setAlpha(0.7);

    const title = this.add.text(cx, 138, "Sundara Vira", {
      color: "#ffd060",
      fontSize: "54px",
      fontStyle: "bold",
      fontFamily: "'Georgia','Times New Roman',serif",
      stroke: "#7a3800",
      strokeThickness: 4,
      shadow: { offsetX: 0, offsetY: 0, color: "#ffa020", blur: 22, stroke: true, fill: true }
    }).setOrigin(0.5).setDepth(10);

    // Title pulse glow
    this.tweens.add({
      targets: title,
      alpha: { from: 1, to: 0.82 },
      duration: 1800, yoyo: true, repeat: -1, ease: "Sine.inOut"
    });

    // Sanskrit sub-line
    this.add.text(cx, 192, "— सुन्दरवीर —", {
      color: "#e8b060", fontSize: "22px",
      fontFamily: "'Georgia','Times New Roman',serif",
      alpha: 0.85
    }).setOrigin(0.5).setDepth(10);

    // Lore tagline
    this.add.text(cx, 232, "Devotion powers the leap. Chant to ascend Lanka.", {
      color: "#b8c8ff", fontSize: "17px",
      fontFamily: "'Trebuchet MS','Segoe UI',sans-serif"
    }).setOrigin(0.5).setDepth(10);

    // ── Start button ─────────────────────────────────────────────────
    // Button glow backing
    const btnBg = this.add.ellipse(cx, 314, 220, 56, 0xf08010, 0.22).setDepth(9);
    this.tweens.add({
      targets: btnBg,
      alpha: { from: 0.22, to: 0.44 },
      scaleX: { from: 1, to: 1.06 },
      duration: 1000, yoyo: true, repeat: -1, ease: "Sine.inOut"
    });

    const startButton = this.add.text(cx, 314, "  Begin the Journey  ", {
      color: "#0f172a",
      backgroundColor: "#f5a030",
      fontSize: "24px",
      fontStyle: "bold",
      fontFamily: "'Trebuchet MS','Segoe UI',sans-serif",
      padding: { left: 22, right: 22, top: 12, bottom: 12 },
      stroke: "#a05800", strokeThickness: 1,
      shadow: { offsetX: 0, offsetY: 2, color: "#000", blur: 6, fill: true }
    }).setOrigin(0.5).setDepth(10).setInteractive({ useHandCursor: true });

    startButton.on("pointerover", () => startButton.setScale(1.04).setColor("#100820"));
    startButton.on("pointerout", () => startButton.setScale(1).setColor("#0f172a"));
    startButton.on("pointerdown", () => {
      this.scene.start("StageScene", { stageIndex: 0 });
    });

    // ── Hint text ────────────────────────────────────────────────────
    this.add.text(cx, 390, "Chant or type to unlock size-shift.\nCollect fragments, reach the beacon, and ascend Mainaka.", {
      color: "#8896cc", fontSize: "15px",
      fontFamily: "'Trebuchet MS','Segoe UI',sans-serif",
      wordWrap: { width: 680 }, align: "center"
    }).setOrigin(0.5).setDepth(10);

    // Controls reminder
    this.add.text(cx, 454, "WASD/Arrows — Move  |  Space/W — Jump  |  J/K — Attack  |  Q/E — Size Shift  |  F — Bhakti Blast", {
      color: "#525c88", fontSize: "12px",
      fontFamily: "'Trebuchet MS','Segoe UI',sans-serif"
    }).setOrigin(0.5).setDepth(10);

    // ── Decorative divider line ───────────────────────────────────────
    this.add.rectangle(cx, 268, 500, 1, 0xf5c030, 0.30).setDepth(10);
    this.add.rectangle(cx, 360, 500, 1, 0xf5c030, 0.20).setDepth(10);
  }
}

window.MenuScene = MenuScene;

