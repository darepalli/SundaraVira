class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  _getUiLanguage() {
    const saved = window.localStorage.getItem("sv.uiLanguage") || "en";
    return ["en", "hi", "te"].includes(saved) ? saved : "en";
  }

  _setUiLanguage(language) {
    const safeLanguage = ["en", "hi", "te"].includes(language) ? language : "en";
    window.localStorage.setItem("sv.uiLanguage", safeLanguage);
    return safeLanguage;
  }

  _getVersionLabel() {
    const version = window.SV_VERSION || { major: 1, minor: 0, build: 1 };
    return `Version ${version.major}.${version.minor}  Build ${version.build}`;
  }

  create(data = {}) {
    // Force scale manager to recalculate canvas bounds in case DOM layout changed
    // (e.g. HUD element was removed during scene shutdown from StageScene).
    this.scale.refresh();
    const W = 960, H = 540;
    const cx = W / 2;
    const copy = {
      en: {
        languageLabel: "Language",
        titleSubline: "— सुन्दरवीर —",
        tagline: "Devotion powers the leap. Chant to ascend Lanka.",
        start: "  Begin the Journey  ",
        hint: "Offer a chant to open the beacon path.\nCollect fragments, reach the beacon, and ascend Mainaka.",
        controls: "Arrows — Move  |  Mouse drag — Move  |  Up/Space — Jump  |  PgUp/PgDn or wheel — Size  |  Ctrl/Shift or click — Attack  |  Alt/Middle — Blast",
        community: "🌐 Join Our Community"
      },
      hi: {
        languageLabel: "भाषा",
        titleSubline: "— सुन्दरवीर —",
        tagline: "भक्ति से शक्ति मिलती है। जप करके लंका की ओर बढ़ें।",
        start: "  यात्रा आरंभ करें  ",
        hint: "बीकन मार्ग खोलने के लिए मंत्र अर्पित करें।\nफ्रैगमेंट्स एकत्र करें, बीकन तक पहुंचें, और मैनाक पर चढ़ें।",
        controls: "एरो — चलें  |  माउस ड्रैग — चलें  |  Up/Space — कूदें  |  PgUp/PgDn या wheel — आकार  |  Ctrl/Shift या click — हमला  |  Alt/Middle — भक्ति ब्लास्ट",
        community: "🌐 समुदाय से जुड़ें"
      },
      te: {
        languageLabel: "భాష",
        titleSubline: "— సుందరవీర —",
        tagline: "భక్తే శక్తి. జపంతో లంక యాత్రను కొనసాగించండి.",
        start: "  యాత్ర ప్రారంభం  ",
        hint: "బీకన్ మార్గం తెరవడానికి జపం సమర్పించండి.\nఫ్రాగ్మెంట్లు సేకరించి, బీకన్ చేరి, మైనాకం అధిరోహించండి.",
        controls: "Arrows — కదలిక  |  Mouse drag — కదలిక  |  Up/Space — జంప్  |  PgUp/PgDn లేదా wheel — పరిమాణం  |  Ctrl/Shift లేదా click — దాడి  |  Alt/Middle — భక్తి బ్లాస్ట్",
        community: "🌐 సమాజానికి చేరండి"
      }
    };
    let currentLanguage = this._getUiLanguage();

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

    // Keep version next to title so it is immediately visible on launch.
    const versionTag = this.add.text(0, 0, this._getVersionLabel(), {
      color: "#f0d8a0",
      fontSize: "14px",
      fontStyle: "bold",
      fontFamily: "'Trebuchet MS','Segoe UI',sans-serif",
      stroke: "#3a1a00",
      strokeThickness: 2
    }).setDepth(10).setAlpha(0.9);
    versionTag.setPosition(
      title.x + (title.width * 0.5) + 14,
      title.y - 6
    );

    // Language selector (interface + chant recognition mode)
    const languageLabel = this.add.text(cx - 130, 222, `${copy[currentLanguage].languageLabel}:`, {
      color: "#f0d8a0",
      fontSize: "16px",
      fontStyle: "bold",
      fontFamily: "'Trebuchet MS','Segoe UI',sans-serif"
    }).setOrigin(0.5).setDepth(10);

    const languageButtons = [
      { code: "en", label: "English" },
      { code: "te", label: "తెలుగు" },
      { code: "hi", label: "हिंदी" }
    ];

    const languageButtonNodes = languageButtons.map((item, index) => {
      const node = this.add.text(cx - 20 + (index * 90), 222, item.label, {
        color: item.code === currentLanguage ? "#0f172a" : "#f3d9a0",
        backgroundColor: item.code === currentLanguage ? "#f5a030" : "#4a2a10",
        fontSize: "14px",
        fontStyle: "bold",
        fontFamily: "'Trebuchet MS','Segoe UI',sans-serif",
        padding: { left: 8, right: 8, top: 4, bottom: 4 }
      }).setOrigin(0.5).setDepth(10).setInteractive({ useHandCursor: true });

      node.on("pointerdown", () => {
        currentLanguage = this._setUiLanguage(item.code);
        languageLabel.setText(`${copy[currentLanguage].languageLabel}:`);
        titleSubline.setText(copy[currentLanguage].titleSubline);
        taglineText.setText(copy[currentLanguage].tagline);
        startButton.setText(copy[currentLanguage].start);
        hintText.setText(copy[currentLanguage].hint);
        controlsText.setText(copy[currentLanguage].controls);
        communityButton.setText(copy[currentLanguage].community);
        languageButtonNodes.forEach((btn, btnIndex) => {
          const code = languageButtons[btnIndex].code;
          btn.setStyle({
            color: code === currentLanguage ? "#0f172a" : "#f3d9a0",
            backgroundColor: code === currentLanguage ? "#f5a030" : "#4a2a10"
          });
        });
      });

      return node;
    });

    // Sanskrit sub-line
    const titleSubline = this.add.text(cx, 192, copy[currentLanguage].titleSubline, {
      color: "#e8b060", fontSize: "22px",
      fontFamily: "'Georgia','Times New Roman',serif",
      alpha: 0.85
    }).setOrigin(0.5).setDepth(10);

    // Lore tagline
    const taglineText = this.add.text(cx, 250, copy[currentLanguage].tagline, {
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

    const startButton = this.add.text(cx, 324, copy[currentLanguage].start, {
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
      this.scene.start("StageScene", { stageIndex: 0, uiLanguage: currentLanguage });
    });

    // Keyboard shortcuts: B = Begin, T = Tutorial (bypasses pointer events, uses Phaser input)
    this.input.keyboard.on("keydown-B", () => {
      this.scene.start("StageScene", { stageIndex: 0, uiLanguage: currentLanguage });
    });
    this.input.keyboard.on("keydown-T", () => {
      this.scene.start("StageScene", { stageIndex: 0, uiLanguage: currentLanguage, tutorial: true });
    });

    const tutorialButton = this.add.text(cx, 364, "  Tutorial Demo  ", {
      color: "#0f172a",
      backgroundColor: "#4ab0d0",
      fontSize: "18px",
      fontStyle: "bold",
      fontFamily: "'Trebuchet MS','Segoe UI',sans-serif",
      padding: { left: 18, right: 18, top: 10, bottom: 10 },
      stroke: "#1a7088", strokeThickness: 1,
      shadow: { offsetX: 0, offsetY: 2, color: "#000", blur: 4, fill: true }
    }).setOrigin(0.5).setDepth(10).setInteractive({ useHandCursor: true });

    tutorialButton.on("pointerover", () => tutorialButton.setScale(1.04).setColor("#100820"));
    tutorialButton.on("pointerout", () => tutorialButton.setScale(1).setColor("#0f172a"));
    tutorialButton.on("pointerdown", () => {
      this.scene.start("StageScene", { stageIndex: 0, uiLanguage: currentLanguage, tutorial: true });
    });

    // ── Hint text ────────────────────────────────────────────────────
    const hintText = this.add.text(cx, 410, copy[currentLanguage].hint, {
      color: "#8896cc", fontSize: "15px",
      fontFamily: "'Trebuchet MS','Segoe UI',sans-serif",
      wordWrap: { width: 680 }, align: "center"
    }).setOrigin(0.5).setDepth(10);

    // Controls reminder
    const controlsText = this.add.text(cx, 454, copy[currentLanguage].controls, {
      color: "#525c88", fontSize: "12px",
      fontFamily: "'Trebuchet MS','Segoe UI',sans-serif"
    }).setOrigin(0.5).setDepth(10);

    // ── Decorative divider line ───────────────────────────────────────
    this.add.rectangle(cx, 268, 500, 1, 0xf5c030, 0.30).setDepth(10);
    this.add.rectangle(cx, 360, 500, 1, 0xf5c030, 0.20).setDepth(10);

    // ── Community/WhatsApp link button ────────────────────────────────
    const communityButton = this.add.text(cx, 485, copy[currentLanguage].community, {
      color: "#0f172a",
      backgroundColor: "#25d366",
      fontSize: "14px",
      fontStyle: "bold",
      fontFamily: "'Trebuchet MS','Segoe UI',sans-serif",
      padding: { left: 12, right: 12, top: 6, bottom: 6 },
      stroke: "#0b8a3a", strokeThickness: 1,
      shadow: { offsetX: 0, offsetY: 1, color: "#000", blur: 3, fill: true }
    }).setOrigin(0.5).setDepth(10).setInteractive({ useHandCursor: true });

    communityButton.on("pointerover", () => {
      communityButton.setScale(1.08).setColor("#000814");
      communityButton.setBackgroundColor("#20c657");
    });
    communityButton.on("pointerout", () => {
      communityButton.setScale(1).setColor("#0f172a");
      communityButton.setBackgroundColor("#25d366");
    });
    communityButton.on("pointerdown", () => {
      window.open("https://chat.whatsapp.com/JNsjJMKmzNSI7gytj3wwau", "_blank");
    });

  }
}

window.MenuScene = MenuScene;

