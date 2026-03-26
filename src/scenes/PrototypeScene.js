const STAGE_ONE_TARGET_FRAGMENTS = 5;
const STAGE_TWO_TARGET_FRAGMENTS = 3;
const ENDGAME_TIPS = [
  "Tip: Build Bhakti with chants before engaging clustered enemies.",
  "Tip: Use small form for quick repositioning between platforms.",
  "Tip: Save Bhakti Blast for tight enemy groups near objectives.",
  "Tip: Large form helps control risky jumps when timing gets tough."
];
const SIZE_SHIFT_WINDOW_MS = 10000;

class PrototypeScene extends Phaser.Scene {
  constructor() {
    super("PrototypeScene");

    this.player = null;
    this.cursors = null;
    this.keys = null;
    this.fragments = null;
    this.enemies = null;
    this.platforms = null;
    this.goal = null;
    this.playerLabel = null;
    this.pointerTargetX = null;
    this.pointerMoveActive = false;
    this.pointerJumpQueued = false;
    this.lastEnemyHitAt = -1000;
    this.enemyHitCooldownMs = 900;
    this.isTypingChant = false;
    this.enemyPausedForTyping = false;
    this.sizeShiftUnlockUntil = 0;
    this.stage = 1;
    this.targetFragments = STAGE_ONE_TARGET_FRAGMENTS;

    this.titleText = null;
    this.controlsText = null;
    this.objectiveText = null;
    this.goalLabelText = null;
    this.mountainShape = null;
    this.stageTransitionCard = null;
    this.decorShapes = [];
    this.cloudClusters = [];

    this.playerPlatformCollider = null;
    this.enemyPlatformCollider = null;
    this.fragmentOverlap = null;
    this.enemyOverlap = null;
    this.goalOverlap = null;

    this.hud = null;
    this.bhaktiInput = new window.BhaktiInput();
    this.state = {
      health: 100,
      bhakti: 0,
      dharma: 50,
      fragments: 0,
      sizeMode: "normal"
    };
  }

  preload() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    this.generateHanumanTexture(g);

    g.fillStyle(0xf6b13e, 1);
    g.fillCircle(10, 10, 10);
    g.generateTexture("fragment", 20, 20);

    g.clear();
    g.fillStyle(0xcc3344, 1);
    g.fillRect(0, 0, 28, 28);
    g.generateTexture("enemy", 28, 28);

    g.destroy();
  }

  create() {
    const keyboard = this.input.keyboard;
    this.cursors = keyboard.createCursorKeys();
    this.keys = {
      left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      up: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      small: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
      large: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
      blast: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F)
    };

    keyboard.enabled = true;
    keyboard.addCapture([
      Phaser.Input.Keyboard.KeyCodes.LEFT,
      Phaser.Input.Keyboard.KeyCodes.RIGHT,
      Phaser.Input.Keyboard.KeyCodes.UP,
      Phaser.Input.Keyboard.KeyCodes.A,
      Phaser.Input.Keyboard.KeyCodes.D,
      Phaser.Input.Keyboard.KeyCodes.W,
      Phaser.Input.Keyboard.KeyCodes.Q,
      Phaser.Input.Keyboard.KeyCodes.E,
      Phaser.Input.Keyboard.KeyCodes.F
    ]);

    this.createWorld();
    this.createEntitiesForStage(this.stage);
    this.bindCollisions();
    this.bindPointerControls();

    this.hud = new window.Hud(
      (value) => this.handleChant(value),
      (active) => {
        if (active) {
          this.hud.setMessage("Voice mode active. Speak clearly.");
        }
      },
      (typing) => {
        this.isTypingChant = typing;
        this.setEnemyPauseForTyping(typing);
      },
      (value) => this.bhaktiInput.evaluate(value).success
    );

    this.updateHud();
    this.hud.hideEndgame();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.hud.destroy();
    });
  }

  update() {
    this.handleMovement();

    if (this.playerLabel) {
      this.playerLabel.setPosition(this.player.x - 6, this.player.y - 34);
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.small)) {
      this.tryApplySizeMode("small");
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.large)) {
      this.tryApplySizeMode("large");
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.blast)) {
      this.useBhaktiBlast();
    }

    if (this.state.health <= 0) {
      this.scene.restart();
    }
  }

  createWorld() {
    this.cameras.main.setBackgroundColor("#0f1533");

    this.platforms = this.physics.add.staticGroup();

    this.titleText = this.add.text(20, 20, "Sundara Vira Prototype", {
      color: "#f7b042",
      fontSize: "22px"
    });

    this.controlsText = this.add.text(20, 52, "Move: A/D, Arrows, or Mouse Hold | Jump: W/Up or Click Above | Chant then Q/E or Wheel (10s) | Beacon/Mainaka require Large form | F/Right Click: Bhakti Blast", {
      color: "#d0d7ff",
      fontSize: "13px"
    });

    this.objectiveText = this.add.text(20, 78, "", {
      color: "#b7c7ff",
      fontSize: "14px"
    });

    this.goalLabelText = this.add.text(740, 135, "", {
      color: "#d8ffe0",
      fontSize: "15px"
    });

    this.configureStageWorld(this.stage);
  }

  configureStageWorld(stage) {
    this.platforms.clear(true, true);
    this.clearDecor();

    if (this.goal) {
      this.goal.destroy();
    }

    if (this.mountainShape) {
      this.mountainShape.destroy();
      this.mountainShape = null;
    }

    if (stage === 1) {
      this.targetFragments = STAGE_ONE_TARGET_FRAGMENTS;
      this.cameras.main.setBackgroundColor("#0f1533");
      this.drawSeaAndClouds(stage);

      this.addPlatform(480, 520, 960, 40, 0x1f2f6f);
      this.addPlatform(180, 400, 240, 20, 0x2d3f87);
      this.addPlatform(520, 320, 260, 20, 0x2d3f87);
      this.addPlatform(830, 250, 220, 20, 0x2d3f87);

      this.goal = this.add.rectangle(900, 180, 40, 70, 0x56d96b);
      this.goalLabelText.setText("Sacred Beacon");
      this.goalLabelText.setPosition(762, 135);
      this.objectiveText.setText("Stage 1: Gather 5 fragments, become Large, and touch the beacon.");
      return;
    }

    this.targetFragments = STAGE_TWO_TARGET_FRAGMENTS;
    this.cameras.main.setBackgroundColor("#10253f");
    this.drawSeaAndClouds(stage);

    this.addPlatform(480, 520, 960, 40, 0x1a3d5f);
    this.addPlatform(210, 430, 220, 20, 0x2a5680);
    this.addPlatform(430, 350, 220, 20, 0x2a5680);
    this.addPlatform(650, 270, 220, 20, 0x2a5680);
    this.addPlatform(840, 190, 200, 20, 0x2a5680);

    this.mountainShape = this.add.triangle(880, 265, 0, 300, 120, 300, 70, 0, 0x4d6e8f);
    this.mountainShape.setAlpha(0.45);

    this.goal = this.add.rectangle(895, 128, 44, 72, 0xa2e0ff);
    this.goalLabelText.setText("Mainaka Peak");
    this.goalLabelText.setPosition(754, 92);
    this.objectiveText.setText("Stage 2: Gather 3 sky fragments, shift to Large form, and reach Mainaka.");
  }

  clearDecor() {
    this.decorShapes.forEach((shape) => {
      this.tweens.killTweensOf(shape);
      shape.destroy();
    });
    this.decorShapes = [];
    this.cloudClusters = [];
  }

  drawSeaAndClouds(stage) {
    const seaBaseColor = stage === 1 ? 0x10395f : 0x0f4666;
    const seaFoamColor = stage === 1 ? 0x6eb8dd : 0x8ed9f5;

    const seaBand = this.add.rectangle(480, 533, 960, 94, seaBaseColor, 0.8);
    seaBand.setDepth(-20);
    this.decorShapes.push(seaBand);

    const seaHighlight = this.add.rectangle(480, 505, 960, 18, seaFoamColor, 0.24);
    seaHighlight.setDepth(-19);
    this.decorShapes.push(seaHighlight);

    [
      [120, 510, 120],
      [320, 514, 140],
      [520, 508, 130],
      [730, 513, 150],
      [900, 509, 110]
    ].forEach(([x, y, width]) => {
      const wave = this.add.ellipse(x, y, width, 16, 0xbde8ff, 0.22);
      wave.setDepth(-18);
      this.decorShapes.push(wave);
    });

    const cloudColor = stage === 1 ? 0xdde8ff : 0xe7f3ff;
    const cloudAlpha = stage === 1 ? 0.28 : 0.34;
    const cloudDefs = stage === 1
      ? [
          [140, 110, 1.0],
          [360, 82, 0.85],
          [620, 120, 1.1],
          [860, 88, 0.95]
        ]
      : [
          [120, 94, 0.95],
          [300, 68, 0.8],
          [540, 104, 1.15],
          [760, 82, 0.9],
          [910, 62, 0.75]
        ];

    cloudDefs.forEach(([x, y, scale], index) => {
      const left = this.add.ellipse(-26 * scale, 2, 58 * scale, 28 * scale, cloudColor, cloudAlpha);
      const mid = this.add.ellipse(0, -6, 72 * scale, 34 * scale, cloudColor, cloudAlpha + 0.04);
      const right = this.add.ellipse(30 * scale, 4, 52 * scale, 24 * scale, cloudColor, cloudAlpha);

      const cloudCluster = this.add.container(x, y, [left, mid, right]);
      cloudCluster.setDepth(-22);

      this.decorShapes.push(cloudCluster);
      this.cloudClusters.push(cloudCluster);

      this.tweens.add({
        targets: cloudCluster,
        x: x + (index % 2 === 0 ? 16 : -16),
        duration: 4200 + index * 500,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut"
      });
    });
  }

  bindPointerControls() {
    this.input.mouse.disableContextMenu();

    this.input.on("pointerdown", (pointer) => {
      if (pointer.rightButtonDown()) {
        this.useBhaktiBlast();
        return;
      }

      this.pointerMoveActive = true;
      this.pointerTargetX = pointer.worldX;
      this.pointerJumpQueued = pointer.worldY < this.player.y - 25;
    });

    this.input.on("pointermove", (pointer) => {
      if (!pointer.isDown) {
        return;
      }

      this.pointerMoveActive = true;
      this.pointerTargetX = pointer.worldX;
    });

    this.input.on("pointerup", () => {
      this.pointerMoveActive = false;
      this.pointerTargetX = null;
      this.pointerJumpQueued = false;
    });

    this.input.on("wheel", (_pointer, _gameObjects, _deltaX, deltaY) => {
      if (deltaY < 0) {
        this.tryApplySizeMode("large");
      } else if (deltaY > 0) {
        this.tryApplySizeMode("small");
      }
    });
  }

  createEntitiesForStage(stage) {
    if (!this.player) {
      this.player = this.physics.add.sprite(70, 460, "hanuman");
      this.player.setCollideWorldBounds(true);
      this.player.setBounce(0.05);

      this.playerLabel = this.add.text(this.player.x - 6, this.player.y - 34, "H", {
        color: "#0f1533",
        fontSize: "18px",
        fontStyle: "bold"
      });
      this.playerLabel.setDepth(5);
    }

    if (this.fragments) {
      this.fragments.clear(true, true);
    }

    if (this.enemies) {
      this.enemies.clear(true, true);
    }

    this.fragments = this.physics.add.group();
    this.enemies = this.physics.add.group();

    const fragmentPoints = stage === 1
      ? [
          [170, 360],
          [270, 360],
          [500, 280],
          [615, 280],
          [830, 210]
        ]
      : [
          [240, 390],
          [500, 310],
          [760, 230]
        ];

    fragmentPoints.forEach(([x, y]) => {
      const orb = this.fragments.create(x, y, "fragment");
      orb.body.setAllowGravity(false);
      this.tweens.add({
        targets: orb,
        y: y - 8,
        duration: 920,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut"
      });
    });

    const enemyPoints = stage === 1
      ? [
          [350, 480],
          [700, 290],
          [820, 220]
        ]
      : [
          [280, 410],
          [560, 330],
          [760, 250],
          [880, 170]
        ];

    enemyPoints.forEach(([x, y], index) => {
      const enemy = this.enemies.create(x, y, "enemy");
      enemy.setCollideWorldBounds(true);
      enemy.setBounce(1, 0);
      enemy.setVelocityX(index % 2 === 0 ? 90 : -90);
    });

    if (stage === 2) {
      this.player.setPosition(70, 460);
      this.player.setVelocity(0, 0);
      this.state.sizeMode = "normal";
      this.applySizeMode("normal");
    }
  }

  bindCollisions() {
    this.playerPlatformCollider?.destroy();
    this.enemyPlatformCollider?.destroy();
    this.fragmentOverlap?.destroy();
    this.enemyOverlap?.destroy();
    this.goalOverlap?.destroy();

    this.playerPlatformCollider = this.physics.add.collider(this.player, this.platforms);
    this.enemyPlatformCollider = this.physics.add.collider(this.enemies, this.platforms);

    this.fragmentOverlap = this.physics.add.overlap(this.player, this.fragments, (_playerObj, fragmentObj) => {
      fragmentObj.destroy();
      this.state.fragments += 1;
      this.state.bhakti += 4;
      this.state.dharma += 2;
      this.hud.setMessage(this.stage === 1 ? "Fragment secured. Bhakti rises." : "Sky fragment secured. Mainaka is closer.");
      this.updateHud();
    });

    this.enemyOverlap = this.physics.add.overlap(this.player, this.enemies, () => {
      if (this.isTypingChant) {
        return;
      }

      const now = this.time.now;
      if (now - this.lastEnemyHitAt < this.enemyHitCooldownMs) {
        return;
      }

      this.lastEnemyHitAt = now;
      this.state.health = Math.max(0, this.state.health - 15);
      this.state.dharma = Math.max(0, this.state.dharma - 1);
      this.player.setTint(0xff6666);
      this.time.delayedCall(this.enemyHitCooldownMs - 80, () => this.player.clearTint());
      this.updateHud();

      if (this.state.health === 0) {
        this.hud.setMessage("Hanuman has fallen. Restarting...");
      }
    });

    this.physics.add.existing(this.goal, true);
    this.goalOverlap = this.physics.add.overlap(this.player, this.goal, () => {
      if (this.state.fragments >= this.targetFragments && this.state.sizeMode === "large" && this.stage === 1) {
        this.startStageTwo();
        return;
      }

      if (this.state.fragments >= this.targetFragments && this.state.sizeMode === "large" && this.stage === 2) {
        const bonus = this.state.dharma >= 60 ? "Sacred Victory" : "Warrior Path";
        const tip = Phaser.Utils.Array.GetRandom(ENDGAME_TIPS);
        const summary = `Congratulations! Mission complete: ${bonus}.`;
        this.hud.setMessage(`${summary} ${tip} Press Play Again to restart.`);
        this.hud.showEndgame(summary, tip);
        this.physics.pause();
      } else if (this.state.fragments < this.targetFragments) {
        this.hud.setMessage(this.stage === 1
          ? "Collect all fragments before reaching the beacon."
          : "Collect all sky fragments before reaching Mainaka.");
      } else {
        this.hud.setMessage(this.stage === 1
          ? "The beacon responds only to Large form. Chant and transform."
          : "Mainaka reveals the path only to Large form. Chant and transform.");
      }
    });
  }

  startStageTwo() {
    this.stage = 2;
    this.state.fragments = 0;
    this.state.bhakti = Math.min(100, this.state.bhakti + 12);
    this.physics.pause();
    this.configureStageWorld(2);
    this.createEntitiesForStage(2);
    this.bindCollisions();
    this.showStageTransitionCard(
      "Stage 2: Mainaka Ascent",
      "The ocean wind rises. Gather sky fragments and awaken Large form to reach Mainaka Peak."
    );
    this.updateHud();
  }

  showStageTransitionCard(title, body) {
    if (this.stageTransitionCard) {
      this.stageTransitionCard.destroy(true);
    }

    const overlay = this.add.rectangle(480, 270, 700, 220, 0x070d1f, 0.84);
    overlay.setStrokeStyle(2, 0x5d73d6, 1);

    const titleText = this.add.text(480, 220, title, {
      color: "#ffd37a",
      fontSize: "30px",
      fontStyle: "bold"
    }).setOrigin(0.5);

    const bodyText = this.add.text(480, 270, body, {
      color: "#d7e2ff",
      fontSize: "17px",
      align: "center",
      wordWrap: { width: 600 }
    }).setOrigin(0.5);

    const hintText = this.add.text(480, 333, "Prepare to leap...", {
      color: "#9cb4ff",
      fontSize: "14px"
    }).setOrigin(0.5);

    this.stageTransitionCard = this.add.container(0, 0, [overlay, titleText, bodyText, hintText]);
    this.stageTransitionCard.setDepth(30);
    this.stageTransitionCard.setAlpha(0);

    this.tweens.add({
      targets: this.stageTransitionCard,
      alpha: 1,
      duration: 320,
      ease: "Sine.out"
    });

    this.time.delayedCall(2500, () => {
      if (!this.stageTransitionCard) {
        this.physics.resume();
        this.cameras.main.flash(220, 130, 200, 255);
        this.hud.setMessage("Stage 2 begins. Reach Mainaka in Large form.");
        return;
      }

      this.tweens.add({
        targets: this.stageTransitionCard,
        alpha: 0,
        duration: 280,
        ease: "Sine.in",
        onComplete: () => {
          if (this.stageTransitionCard) {
            this.stageTransitionCard.destroy(true);
            this.stageTransitionCard = null;
          }

          this.physics.resume();
          this.cameras.main.flash(220, 130, 200, 255);
          this.hud.setMessage("Stage 2 begins. Reach Mainaka in Large form.");
        }
      });
    });
  }

  generateHanumanTexture(g) {
    g.clear();

    g.fillStyle(0x7f4a1e, 1);
    g.fillCircle(40, 16, 7);
    g.fillCircle(44, 21, 6);

    g.fillStyle(0xd3792a, 1);
    g.fillRect(16, 18, 24, 28);

    g.fillStyle(0xe1a35f, 1);
    g.fillCircle(28, 12, 10);

    g.fillStyle(0x1e1e1e, 1);
    g.fillCircle(24, 11, 1.8);
    g.fillCircle(31, 11, 1.8);

    g.fillStyle(0xc52b2b, 1);
    g.fillRect(27, 6, 2, 8);

    g.fillStyle(0xd3792a, 1);
    g.fillRect(11, 21, 6, 18);
    g.fillRect(39, 21, 6, 18);

    g.fillStyle(0xad5f22, 1);
    g.fillRect(18, 46, 7, 12);
    g.fillRect(31, 46, 7, 12);

    g.fillStyle(0xc8992a, 1);
    g.fillRect(43, 30, 3, 16);
    g.fillCircle(44.5, 28, 5);

    g.generateTexture("hanuman", 52, 64);
    g.clear();
  }

  setEnemyPauseForTyping(paused) {
    if (paused === this.enemyPausedForTyping || !this.enemies) {
      return;
    }

    this.enemyPausedForTyping = paused;

    this.enemies.children.each((enemyObj) => {
      const enemy = enemyObj;
      const body = enemy.body;
      if (!body) {
        return;
      }

      if (paused) {
        enemy.setData("resumeVelocityX", body.velocity.x);
        enemy.setVelocityX(0);
        body.moves = false;
        return;
      }

      body.moves = true;
      const resumeVelocityX = enemy.getData("resumeVelocityX");
      const velocityToRestore = typeof resumeVelocityX === "number" ? resumeVelocityX : 90;
      enemy.setVelocityX(velocityToRestore);
    });
  }

  addPlatform(x, y, width, height, color) {
    const shape = this.add.rectangle(x, y, width, height, color);
    this.platforms.add(shape);
  }

  handleMovement() {
    const leftPressed = this.cursors.left.isDown || this.keys.left.isDown;
    const rightPressed = this.cursors.right.isDown || this.keys.right.isDown;
    const upPressed = this.cursors.up.isDown || this.keys.up.isDown;

    const speed = this.state.sizeMode === "large" ? 150 : this.state.sizeMode === "small" ? 260 : 210;
    const jump = this.state.sizeMode === "large" ? 320 : this.state.sizeMode === "small" ? 440 : 390;

    let velocityX = 0;

    if (leftPressed) {
      velocityX = -speed;
    } else if (rightPressed) {
      velocityX = speed;
    }

    if (this.pointerMoveActive && typeof this.pointerTargetX === "number") {
      const deltaX = this.pointerTargetX - this.player.x;
      if (Math.abs(deltaX) > 10) {
        velocityX = Math.sign(deltaX) * speed;
      }
    }

    this.player.setVelocityX(velocityX);

    if (upPressed && this.player.body.blocked.down) {
      this.player.setVelocityY(-jump);
    }

    if (this.pointerJumpQueued && this.player.body.blocked.down) {
      this.player.setVelocityY(-jump);
      this.pointerJumpQueued = false;
    }
  }

  applySizeMode(mode) {
    this.state.sizeMode = mode;

    if (mode === "small") {
      this.player.setScale(0.65, 0.65);
      this.playerLabel.setScale(0.9);
      this.hud.setMessage("Small form: agility and evasion improved.");
      return;
    }

    if (mode === "large") {
      this.player.setScale(1.35, 1.25);
      this.playerLabel.setScale(1.3);
      this.hud.setMessage("Large form: strength increased.");
      return;
    }

    this.player.setScale(1, 1);
    this.playerLabel.setScale(1);
  }

  tryApplySizeMode(mode) {
    if (this.time.now > this.sizeShiftUnlockUntil) {
      this.hud.setMessage("Chant first to unlock size shift for 10 seconds.");
      return;
    }

    this.applySizeMode(mode);
  }

  useBhaktiBlast() {
    if (this.state.bhakti < 20) {
      this.hud.setMessage("Not enough Bhakti. Chant or collect fragments.");
      return;
    }

    this.state.bhakti -= 20;
    this.state.dharma = Math.min(100, this.state.dharma + 1);

    this.enemies.children.each((enemyObj) => {
      const sprite = enemyObj;
      const distance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        sprite.x,
        sprite.y
      );

      if (distance < 180) {
        sprite.destroy();
      }
    });

    this.cameras.main.flash(120, 255, 210, 80);
    this.hud.setMessage("Bhakti Blast released.");
    this.updateHud();
  }

  handleChant(value) {
    const result = this.bhaktiInput.evaluate(value);

    if (!result.success) {
      this.state.dharma = Math.max(0, this.state.dharma - 1);
      this.hud.setMessage("Chant not recognized. Try 'Jai Shri Ram'.");
      this.updateHud();
      return;
    }

    this.state.bhakti = Math.min(100, this.state.bhakti + result.points);
    this.state.health = Math.min(100, this.state.health + 4);
    this.state.dharma = Math.min(100, this.state.dharma + 2);
    this.sizeShiftUnlockUntil = this.time.now + SIZE_SHIFT_WINDOW_MS;

    if (this.state.bhakti >= 75) {
      this.applySizeMode("large");
      this.hud.setMessage("Anjaneya surge active. Large form empowered. Size shift unlocked for 10 seconds.");
    } else {
      this.hud.setMessage(`Chant accepted: ${result.matched}. +${result.points} Bhakti. Size shift unlocked for 10 seconds.`);
    }

    this.updateHud();
  }

  updateHud() {
    this.hud.updateStats({
      health: this.state.health,
      bhakti: this.state.bhakti,
      dharma: this.state.dharma,
      fragments: this.state.fragments,
      targetFragments: this.targetFragments
    });
  }
}

window.PrototypeScene = PrototypeScene;
