const ENDGAME_TIPS = [
  "Tip: Build Bhakti with chants before engaging clustered enemies.",
  "Tip: Use small form for quick repositioning between platforms.",
  "Tip: Save Bhakti Blast for tight enemy groups near objectives.",
  "Tip: Large form helps control risky jumps when timing gets tough."
];
const SIZE_SHIFT_WINDOW_MS = 10000;

function isTransitionDebugEnabled() {
  const fromWindow = Boolean(window.__SV_DEBUG_TRANSITIONS__);
  const fromQuery = new URLSearchParams(window.location.search).get("debug") === "1";
  return fromWindow || fromQuery;
}

class StageScene extends Phaser.Scene {
  constructor() {
    super("StageScene");

    this.stageIndex = 0;
    this.stageData = null;
    this.targetFragments = 0;

    this.player = null;
    this.playerLabel = null;
    this.playerActor = null;
    this.platforms = null;
    this.fragments = null;
    this.enemies = null;
    this.enemyManager = null;
    this.goal = null;

    this.cursors = null;
    this.keys = null;
    this.pointerTargetX = null;
    this.pointerMoveActive = false;
    this.pointerJumpQueued = false;
    this.touchLeft = false;
    this.touchRight = false;
    this.touchJumpQueued = false;
    this.touchDiag = false;
    this._touchAttackPending = false;
    this._touchHeavyPending = false;
    this._touchBlastPending = false;
    this._touchSmallPending = false;
    this._touchLargePending = false;
    this._touchTutorialShown = false;

    this.lastEnemyHitAt = -1000;
    this.enemyHitCooldownMs = 900;
    this.isTypingChant = false;
    this.enemyPausedForTyping = false;
    this.sizeShiftUnlockUntil = 0;

    this.titleText = null;
    this.controlsText = null;
    this.objectiveText = null;
    this.goalLabelText = null;
    this.debugText = null;
    this.debugLastGoalResult = "-";
    this.debugTransitionsEnabled = false;
    this.stageTransitionCard = null;
    this.backgroundLayer = null;
    this.objectiveSystem = null;

    this.playerPlatformCollider = null;
    this.enemyPlatformCollider = null;
    this.fragmentOverlap = null;
    this.enemyOverlap = null;
    this.goalOverlap = null;
    this.goalResolved = false;
    this.isStageTransitioning = false;
    this.isGameOver = false;
    this.transitionFallbackTimeoutId = null;
    this.capturedKeyCodes = [
      Phaser.Input.Keyboard.KeyCodes.LEFT,
      Phaser.Input.Keyboard.KeyCodes.RIGHT,
      Phaser.Input.Keyboard.KeyCodes.UP,
      Phaser.Input.Keyboard.KeyCodes.A,
      Phaser.Input.Keyboard.KeyCodes.D,
      Phaser.Input.Keyboard.KeyCodes.W,
      Phaser.Input.Keyboard.KeyCodes.Q,
      Phaser.Input.Keyboard.KeyCodes.E,
      Phaser.Input.Keyboard.KeyCodes.F,
      Phaser.Input.Keyboard.KeyCodes.J,
      Phaser.Input.Keyboard.KeyCodes.K,
      Phaser.Input.Keyboard.KeyCodes.ENTER
    ];

    this.hud = null;
    this.gyroInput = null;
    this.bhaktiInput = new window.BhaktiInput();
    this.objectiveSystem = new window.StageObjectiveSystem(ENDGAME_TIPS);
    this.state = {
      health: 100,
      bhakti: 0,
      dharma: 50,
      fragments: 0,
      sizeMode: "normal"
    };
  }

  init(data) {
    this.debugTransitionsEnabled = isTransitionDebugEnabled();
    this.stageIndex = Number(data?.stageIndex ?? 0);
    this.stageData = window.StageLoader.getStageData(this.game, this.stageIndex);
    if (!this.stageData) {
      this.stageIndex = 0;
      this.stageData = window.StageLoader.getStageData(this.game, 0);
    }

    this.state.health = 100;
    this.state.bhakti = 0;
    this.state.dharma = 50;
    this.state.fragments = 0;
    this.state.sizeMode = "normal";
    this.sizeShiftUnlockUntil = 0;
    this.goalResolved = false;
    this.pointerMoveActive = false;
    this.pointerTargetX = null;
    this.pointerJumpQueued = false;
    this.touchLeft = false;
    this.touchRight = false;
    this.touchJumpQueued = false;
    this.touchDiag = false;
    this._touchAttackPending = false;
    this._touchHeavyPending = false;
    this._touchBlastPending = false;
    this._touchSmallPending = false;
    this._touchLargePending = false;
    this.lastEnemyHitAt = -1000;
    this.isTypingChant = false;
    this.enemyPausedForTyping = false;
    this.isStageTransitioning = false;
    this.isGameOver = false;
    if (this.transitionFallbackTimeoutId) {
      window.clearTimeout(this.transitionFallbackTimeoutId);
      this.transitionFallbackTimeoutId = null;
    }

    this.targetFragments = this.stageData?.targetFragments || 0;
    this.debugLastGoalResult = "init";
  }

  preload() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    this.generateHanumanTexture(g);
    this.generateFragmentTexture(g);
    this.generateEnemyTexture(g);
    g.destroy();
  }

  generateFragmentTexture(g) {
    // Divine gem — golden diamond with inner glow layers
    g.clear();
    // Outer glow aura
    g.fillStyle(0xffe090, 0.28);
    g.fillCircle(14, 14, 14);
    // Mid glow
    g.fillStyle(0xffd050, 0.55);
    g.fillCircle(14, 14, 10);
    // Gem body (diamond polygon)
    g.fillStyle(0xffb800, 1);
    g.fillPoints([
      { x: 14, y: 2 },
      { x: 24, y: 10 },
      { x: 24, y: 18 },
      { x: 14, y: 26 },
      { x: 4,  y: 18 },
      { x: 4,  y: 10 }
    ], true);
    // Bright facet highlight
    g.fillStyle(0xfffbe0, 0.75);
    g.fillPoints([
      { x: 14, y: 2 },
      { x: 20, y: 8 },
      { x: 14, y: 12 },
      { x: 8,  y: 8 }
    ], true);
    g.generateTexture("fragment", 28, 28);
    g.clear();
  }

  generateEnemyTexture(g) {
    // Rakshasa demon — hunched dark warrior
    g.clear();
    // Body (dark maroon, slightly wider than tall)
    g.fillStyle(0x5a0a10, 1);
    g.fillRect(6, 14, 22, 22);
    // Head
    g.fillStyle(0x7a1018, 1);
    g.fillRect(9, 6, 16, 14);
    // Left horn
    g.fillStyle(0x3a0608, 1);
    g.fillTriangle(10, 6, 7, -2, 14, 6);
    // Right horn
    g.fillTriangle(24, 6, 21, 6, 27, -2);
    // Arms
    g.fillStyle(0x4e0a10, 1);
    g.fillRect(1, 16, 6, 16);
    g.fillRect(27, 16, 6, 16);
    // Clawed fists
    g.fillStyle(0x3a0608, 1);
    g.fillRect(0, 30, 7, 5);
    g.fillRect(27, 30, 7, 5);
    // Eyes — yellow glow
    g.fillStyle(0xffe030, 1);
    g.fillCircle(14, 12, 2.8);
    g.fillCircle(21, 12, 2.8);
    // Eye slit pupils
    g.fillStyle(0x200000, 1);
    g.fillRect(13, 11, 2, 4);
    g.fillRect(20, 11, 2, 4);
    // Mouth grimace
    g.fillStyle(0xff4040, 0.8);
    g.fillRect(12, 17, 10, 2);
    g.generateTexture("enemy", 34, 38);
    g.clear();
  }

  create() {
    window.audioManager?.unlock();

    // Re-initialise gyro each time the scene starts (page reload resets all state).
    this.gyroInput?.destroy();
    this.gyroInput = new window.GyroInput();
    this.gyroInput.enableSwipe(); // swipe always active; tilt/shake require toggle

    this.createInput();
    this.backgroundLayer = new window.BackgroundLayer(this);
    this.createWorld();
    this.createEntitiesFromStage();
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
        if (this.input?.keyboard) {
          this.input.keyboard.enabled = !typing;
          if (typing) {
            this.input.keyboard.removeCapture(this.capturedKeyCodes);
          } else {
            this.input.keyboard.addCapture(this.capturedKeyCodes);
          }
        }
      },
      (value) => this.bhaktiInput.evaluate(value).success
    );

    this._bindTouchControls();
    this.updateHud();
    this.showTouchTutorialIfNeeded();
    // Show gyro toggle button whenever DeviceOrientationEvent is available.
    if (this.gyroInput.isSupported) {
      this.hud.showGyroToggle(true);
    }

    // Determine whether the player has a coarse-pointer (touch) device.
    const _isTouchDevice = window.matchMedia("(pointer: coarse)").matches ||
      "ontouchstart" in window;
    const _forceButtons = new URLSearchParams(window.location.search).get("buttons") === "1";

    if (!_forceButtons) {
      if (!_isTouchDevice) {
        // PC / keyboard device: hide all on-screen buttons.
        this.hud.hideTouchControls();
      } else {
        // Mobile: hide only the navigation cluster — gyro/swipe handles movement.
        // Action buttons (attack, size, blast) remain visible.
        this.hud.hideNavCluster();
      }
    }

    // Auto-activate gyro on devices that fire orientation events without a
    // permission prompt (Android, desktop with a sensor).  The first real
    // event that carries a non-null gamma value is enough to confirm the
    // phone is actually moving; at that point we hide the D-pad buttons and
    // switch to tilt-steering automatically.
    //
    // iOS 13+ requires an explicit user-gesture permission call, so we skip
    // auto-detection there (DeviceOrientationEvent.requestPermission exists).
    const needsPermissionPrompt =
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof DeviceOrientationEvent.requestPermission === "function";

    if (this.gyroInput.isSupported && !needsPermissionPrompt) {
      const onFirstOrientation = (event) => {
        if (event.gamma === null) return; // no real data yet
        window.removeEventListener("deviceorientation", onFirstOrientation, true);
        window.clearTimeout(swipeNavFallbackId);
        if (!this.gyroInput || this.gyroInput.active) return;
        this.gyroInput.disableSwipeNav();
        this.gyroInput.start();
        this.hud.setGyroActive(true);
      };
      window.addEventListener("deviceorientation", onFirstOrientation, true);

      // If no real orientation data arrives within 3 s, fall back to swipe navigation.
      const swipeNavFallbackId = window.setTimeout(() => {
        window.removeEventListener("deviceorientation", onFirstOrientation, true);
        if (!this.gyroInput || this.gyroInput.active) return;
        this.gyroInput.enableSwipeNav();
      }, 3000);

      // Clean up both when the scene shuts down.
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        window.removeEventListener("deviceorientation", onFirstOrientation, true);
        window.clearTimeout(swipeNavFallbackId);
      });
    } else if (needsPermissionPrompt) {
      // iOS 13+: show a one-time modal asking to enable tilt controls.
      this._promptIosGyroPermission();
    } else {
      // DeviceOrientationEvent not available at all — swipe nav only.
      this.gyroInput.enableSwipeNav();
    }

    if (this.debugTransitionsEnabled) {
      this.createDebugOverlay();
      this.updateDebugOverlay();
    }
    this.hud.hideEndgame();
    this.setEnemyPauseForTyping(this.isTypingChant);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (this.transitionFallbackTimeoutId) {
        window.clearTimeout(this.transitionFallbackTimeoutId);
        this.transitionFallbackTimeoutId = null;
      }
      this.hud?.destroy();
      this.gyroInput?.destroy();
      this.gyroInput = null;
    });
  }

  createInput() {
    const keyboard = this.input.keyboard;
    this.cursors = keyboard.createCursorKeys();
    this.keys = {
      left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      up: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      small: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
      large: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
      blast: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F),
      attack: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J),
      heavyAttack: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K),
      retry: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
    };

    keyboard.enabled = true;
    keyboard.addCapture(this.capturedKeyCodes);
  }

  update() {
    if (this.debugTransitionsEnabled) {
      this.updateDebugOverlay();
    }

    if (this.isGameOver) {
      this.playerActor?.setHorizontalVelocity(0);
      this.playerActor?.syncLabel();

      if (Phaser.Input.Keyboard.JustDown(this.keys.retry)) {
        this.hud.triggerEndgameReplay();
      }
      return;
    }

    if (this.isStageTransitioning) {
      this.playerActor?.setHorizontalVelocity(0);
      this.playerActor?.syncLabel();
      return;
    }

    this.handleMovement();
    this.checkGoalContactFallback();

    this.playerActor?.syncLabel();

    if (Phaser.Input.Keyboard.JustDown(this.keys.small) || this._touchSmallPending || this.gyroInput?.consumeSwipeDown()) {
      this._touchSmallPending = false;
      this.tryApplySizeMode("small");
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.large) || this._touchLargePending || this.gyroInput?.consumeSwipeUp()) {
      this._touchLargePending = false;
      this.tryApplySizeMode("large");
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.blast) || this._touchBlastPending) {
      this._touchBlastPending = false;
      this.useBhaktiBlast();
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.attack) || this._touchAttackPending) {
      this._touchAttackPending = false;
      this.triggerMeleeAttack(false);
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.heavyAttack) || this._touchHeavyPending) {
      this._touchHeavyPending = false;
      this.triggerMeleeAttack(true);
    }

    if (this.state.health <= 0 && !this.isGameOver) {
      this.enterGameOver();
    }

    // Update gyro tilt indicator (cosmetic, always safe to run)
    if (this.gyroInput?.active) {
      this.hud.updateGyroIndicator(this.gyroInput.getTiltX());
    }
  }

  checkGoalContactFallback() {
    if (this.goalResolved || !this.player || !this.goal || !this.player.body) {
      return;
    }

    const playerBounds = this.player.getBounds();
    const goalBounds = this.goal.getBounds();
    if (!Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, goalBounds)) {
      return;
    }

    this.handleGoalTouch();
  }

  createWorld() {
    this.cameras.main.setBackgroundColor(this.stageData.backgroundColor);
    this.platforms = this.physics.add.staticGroup();
    const compactViewport = window.innerWidth <= 900 || window.innerHeight <= 760;
    const tinyViewport = window.innerWidth <= 480 || window.innerHeight <= 640;
    const shortViewport = window.innerHeight <= 500;

    this.titleText = this.add.text(20, 16, "Sundara Vira", {
      color: "#ffd060",
      fontSize: "22px",
      fontStyle: "bold",
      fontFamily: "'Georgia','Times New Roman',serif",
      stroke: "#7a3800",
      strokeThickness: 3,
      shadow: { offsetX: 0, offsetY: 0, color: "#ffaa00", blur: 12, stroke: true, fill: true }
    });

    this.controlsText = this.add.text(20, 50, "Move: A/D/Arrows | Jump: W/Up | Attack: J (light) K (heavy) | Size: Q/E after chant | F: Bhakti Blast", {
      color: "#8894b8",
      fontSize: compactViewport ? "11px" : "12px",
      wordWrap: { width: compactViewport ? 520 : 900 }
    });

    this.objectiveText = this.add.text(20, 72, this.stageData.objectiveText, {
      color: "#c8d4ff",
      fontSize: compactViewport ? "12px" : "13px",
      fontStyle: "italic",
      wordWrap: { width: compactViewport ? 460 : 780 }
    });

    if (compactViewport) {
      this.titleText.setFontSize(tinyViewport ? "14px" : "16px");
      this.controlsText.setVisible(false);
      this.objectiveText.setY(42);
    }

    if (shortViewport) {
      this.titleText.setVisible(false);
      this.controlsText.setVisible(false);
      this.objectiveText.setFontSize("11px");
      this.objectiveText.setY(16);
      this.objectiveText.setAlpha(0.85);
    }

    this.goalLabelText = this.add.text(this.stageData.goal.labelX, this.stageData.goal.labelY, this.stageData.goal.label, {
      color: "#d8ffe0",
      fontSize: "14px",
      fontStyle: "bold",
      stroke: "#004422",
      strokeThickness: 2,
      shadow: { offsetX: 0, offsetY: 0, color: "#80ffb0", blur: 10, fill: true }

    });

    this.backgroundLayer.render(this.stageData);
    this.createPlatforms();
    this.createGoal();
  }

  createPlatforms() {
    this.stageData.platforms.forEach((platform) => {
      this.addPlatform(platform[0], platform[1], platform[2], platform[3], platform[4]);
    });
  }

  createGoal() {
    const goal = this.stageData.goal;
    // Outer radiant glow (large, low alpha)
    const outerGlow = this.add.rectangle(goal.x, goal.y, goal.width + 28, goal.height + 28, goal.color, 0.18);
    outerGlow.setDepth(1);
    this.tweens.add({
      targets: outerGlow,
      alpha: { from: 0.18, to: 0.38 },
      scaleX: { from: 1, to: 1.12 },
      scaleY: { from: 1, to: 1.12 },
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut'
    });
    // Mid glow ring
    const midGlow = this.add.rectangle(goal.x, goal.y, goal.width + 10, goal.height + 10, goal.color, 0.40);
    midGlow.setDepth(2);
    this.tweens.add({
      targets: midGlow,
      alpha: { from: 0.40, to: 0.65 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut'
    });
    // Core beacon pillar
    this.goal = this.add.rectangle(goal.x, goal.y, goal.width, goal.height, goal.color);
    this.goal.setDepth(3);
    // Bright top cap
    const cap = this.add.ellipse(goal.x, goal.y - goal.height / 2 - 4, goal.width + 6, 12, 0xffffff, 0.55);
    cap.setDepth(4);
    this.tweens.add({
      targets: cap,
      alpha: { from: 0.55, to: 0.90 },
      scaleX: { from: 1, to: 1.2 },
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut'
    });
  }


  _bindTouchControls() {
    this.hud.createTouchControls({
      onLeftDown:      () => { this.touchLeft = true; },
      onLeftUp:        () => { this.touchLeft = false; },
      onRightDown:     () => { this.touchRight = true; },
      onRightUp:       () => { this.touchRight = false; },
      onJump:          () => { this.touchJumpQueued = true; },
      onDiagDown:      () => { this.touchDiag = true; },
      onDiagUp:        () => { this.touchDiag = false; },
      onAttack:        () => { this._touchAttackPending = true; },
      onHeavy:         () => { this._touchHeavyPending = true; },
      onBlast:         () => { this._touchBlastPending = true; },
      onSmall:         () => { this._touchSmallPending = true; },
      onLarge:         () => { this._touchLargePending = true; },
      onGyroToggle:    () => { this._onGyroToggle(); },
      onGyroCalibrate: () => { this.gyroInput?.calibrate(); this.hud.setMessage("Gyro recalibrated to current tilt."); }
    });
    document.body.classList.add("touch-active");
  }

  /**
   * iOS 13+: show the one-time tilt-permission modal.
   * Reads/writes localStorage key "sv_gyro_permission_v1" so the modal only
   * appears once.  Subsequent visits use the stored answer immediately.
   */
  async _promptIosGyroPermission() {
    const STORAGE_KEY = "sv_gyro_permission_v1";
    let stored = null;
    try { stored = window.localStorage?.getItem(STORAGE_KEY); } catch (_) {}

    if (stored === "granted") {
      const ok = await this.gyroInput?.requestPermission();
      if (ok && this.gyroInput) {
        this.gyroInput.disableSwipeNav();
        this.gyroInput.start();
        this.hud.setGyroActive(true);
        return;
      }
    }

    if (stored === "denied") {
      this.gyroInput?.enableSwipeNav();
      return;
    }

    // First time: enable swipe-nav as an interim fallback so the player can
    // act immediately while the modal is visible.
    this.gyroInput?.enableSwipeNav();

    this.hud.showGyroPermissionModal(
      async () => {
        // Player tapped "Enable Tilt"
        const granted = await this.gyroInput?.requestPermission();
        try { window.localStorage?.setItem(STORAGE_KEY, granted ? "granted" : "denied"); } catch (_) {}
        if (granted && this.gyroInput) {
          this.gyroInput.disableSwipeNav();
          this.gyroInput.start();
          this.hud.setGyroActive(true);
        } else {
          this.hud.setMessage("Motion access denied. Swipe left/right to move, tap to stop.");
        }
      },
      () => {
        // Player tapped "Skip"
        try { window.localStorage?.setItem(STORAGE_KEY, "denied"); } catch (_) {}
        // swipe-nav is already active — nothing more to do
      }
    );
  }

  async _onGyroToggle() {
    if (!this.gyroInput) return;
    if (this.gyroInput.active) {
      this.gyroInput.stop();
      this.gyroInput.enableSwipeNav(); // fall back to swipe navigation
      this.hud.setGyroActive(false);
      this.hud.setMessage("Gyro off — swipe left/right to move, tap to stop.");
    } else {
      const granted = await this.gyroInput.requestPermission();
      if (!granted) {
        this.hud.setMessage("Gyro permission denied. Allow motion sensors in browser settings.");
        return;
      }
      this.gyroInput.disableSwipeNav(); // gyro takes over movement
      this.gyroInput.start();
      this.hud.setGyroActive(true);
      this.hud.setMessage("Gyro on — tilt to move, shake up to jump, swipe up/down to resize.");
    }
  }

  showTouchTutorialIfNeeded() {
    if (this._touchTutorialShown) {
      return;
    }

    const tutorialKey = "sv_touch_tutorial_seen_v1";
    try {
      if (window.localStorage?.getItem(tutorialKey) === "1") {
        this._touchTutorialShown = true;
        return;
      }
    } catch (_error) {
      // localStorage may be disabled in privacy mode; continue without persistence.
    }

    this._touchTutorialShown = true;
    this.hud.setMessage("Touch controls: left pad moves, up jumps, diagonal does forward-jump, right pad triggers size/attacks/blast.");

    this.time.delayedCall(5200, () => {
      if (!this.scene.isActive("StageScene") || this.isGameOver || this.isStageTransitioning) {
        return;
      }
      this.hud.setMessage(this.stageData.objectiveText);
    });

    try {
      window.localStorage?.setItem(tutorialKey, "1");
    } catch (_error) {
      // Ignore persistence errors.
    }
  }

  bindPointerControls() {
    this.input.mouse.disableContextMenu();

    this.input.on("pointerdown", (pointer) => {
      window.audioManager?.unlock();

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

  createEntitiesFromStage() {
    this.playerActor?.destroy();
    this.playerActor = new window.PlayerActor(this);
    this.playerActor.spawn(70, 460);
    this.player = this.playerActor.sprite;
    this.playerLabel = this.playerActor.label;

    this.fragments = this.physics.add.group();
    this.stageData.fragments.forEach(([x, y]) => {
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

    this.enemyManager = this.enemyManager || new window.EnemyManager(this);
    this.enemyManager.rebuild(this.stageData.enemies);
    this.enemies = this.enemyManager.group;
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
      window.audioManager?.playCollect();
      this.hud.setMessage(this.objectiveSystem.getFragmentMessage(this.stageIndex));
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
      this.playerActor.flashDamage(this.enemyHitCooldownMs - 80);
      this.updateHud();


    });

    this.physics.add.existing(this.goal, true);
    this.goalOverlap = this.physics.add.overlap(this.player, this.goal, () => {
      this.handleGoalTouch();
    });
  }

  handleGoalTouch() {
    if (this.goalResolved) {
      return;
    }

    const result = this.objectiveSystem.evaluateGoalTouch({
      stageIndex: this.stageIndex,
      fragments: this.state.fragments,
      targetFragments: this.targetFragments,
      sizeMode: this.state.sizeMode,
      hasNextStage: window.StageLoader.hasNextStage(this.stageIndex),
      dharma: this.state.dharma
    });

    if (result.type === "next-stage") {
      this.debugLastGoalResult = "next-stage";
      this.goalResolved = true;
      this.startNextStage();
      return;
    }

    if (result.type === "victory") {
      this.debugLastGoalResult = "victory";
      this.goalResolved = true;
      this.scene.start("VictoryScene", {
        summary: result.summary,
        tip: result.tip
      });
      return;
    }

    this.debugLastGoalResult = result.type;
    this.hud.setMessage(result.message);
  }

  startNextStage() {
    const nextStageIndex = Number(this.stageIndex) + 1;
    const nextStageData = window.StageLoader.getStageData(this.game, nextStageIndex);
    if (this.debugTransitionsEnabled) {
      console.info("[StageScene] startNextStage", {
        currentStageIndex: this.stageIndex,
        nextStageIndex,
        nextStageId: nextStageData?.id || null
      });
    }

    if (!nextStageData) {
      this.goalResolved = false;
      this.debugLastGoalResult = "missing-next-stage-data";
      this.hud.setMessage("Next stage data is missing. Returning to menu.");
      this.time.delayedCall(900, () => {
        this.scene.start("MenuScene");
      });
      return;
    }

    window.audioManager?.playStageTransition();
    this.isStageTransitioning = true;
    this.debugLastGoalResult = "transitioning";
    this.physics.pause();
    this.showStageTransitionCard(nextStageData.title, nextStageData.objectiveText, () => {
      if (this.debugTransitionsEnabled) {
        console.info("[StageScene] transition complete callback", {
          toStageIndex: nextStageIndex,
          toStageId: nextStageData?.id || null
        });
      }
      this.loadStageInPlace(nextStageIndex, nextStageData);
    });
  }

  loadStageInPlace(stageIndex, stageData) {
    if (!stageData) {
      this.debugLastGoalResult = "load-stage-failed";
      this.isStageTransitioning = false;
      this.goalResolved = false;
      this.physics.resume();
      this.hud.setMessage("Unable to load next stage data.");
      return;
    }

    this.clearStageRuntimeObjects();

    this.stageIndex = Number(stageIndex);
    this.stageData = stageData;
    this.targetFragments = this.stageData?.targetFragments || 0;

    this.state.health = 100;
    this.state.bhakti = 0;
    this.state.dharma = 50;
    this.state.fragments = 0;
    this.state.sizeMode = "normal";
    this.sizeShiftUnlockUntil = 0;
    this.lastEnemyHitAt = -1000;
    this.pointerMoveActive = false;
    this.pointerTargetX = null;
    this.pointerJumpQueued = false;
    this.touchLeft = false;
    this.touchRight = false;
    this.touchJumpQueued = false;
    this.touchDiag = false;
    this._touchAttackPending = false;
    this._touchHeavyPending = false;
    this._touchBlastPending = false;
    this._touchSmallPending = false;
    this._touchLargePending = false;

    this.goalResolved = false;
    this.isStageTransitioning = false;
    this.isGameOver = false;
    this.debugLastGoalResult = "stage-loaded-in-place";

    this.physics.resume();
    this.createWorld();
    this.createEntitiesFromStage();
    this.bindCollisions();
    this.setEnemyPauseForTyping(this.isTypingChant);
    this._bindTouchControls();
    this.updateHud();
    if (this.debugTransitionsEnabled) {
      this.updateDebugOverlay();
    }
    this.hud.setMessage(this.stageData.objectiveText);

    if (this.debugTransitionsEnabled) {
      console.info("[StageScene] loadStageInPlace complete", {
        stageIndex: this.stageIndex,
        stageId: this.stageData?.id || null
      });
    }
  }

  clearStageRuntimeObjects() {
    this.playerPlatformCollider?.destroy();
    this.enemyPlatformCollider?.destroy();
    this.fragmentOverlap?.destroy();
    this.enemyOverlap?.destroy();
    this.goalOverlap?.destroy();
    this.playerPlatformCollider = null;
    this.enemyPlatformCollider = null;
    this.fragmentOverlap = null;
    this.enemyOverlap = null;
    this.goalOverlap = null;

    this.playerActor?.destroy();
    this.playerActor = null;
    this.player = null;
    this.playerLabel = null;

    this.fragments?.clear(true, true);
    this.fragments = null;

    this.enemyManager?.group?.clear(true, true);
    this.enemies = null;

    this.platforms?.clear(true, true);
    this.platforms = null;

    this.goal?.destroy();
    this.goal = null;

    this.titleText?.destroy();
    this.titleText = null;
    this.controlsText?.destroy();
    this.controlsText = null;
    this.objectiveText?.destroy();
    this.objectiveText = null;
    this.goalLabelText?.destroy();
    this.goalLabelText = null;

    this.stageTransitionCard?.destroy(true);
    this.stageTransitionCard = null;
  }

  showStageTransitionCard(title, body, onComplete) {
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

    let completed = false;
    const completeOnce = () => {
      if (completed) {
        return;
      }

      completed = true;
      if (this.transitionFallbackTimeoutId) {
        window.clearTimeout(this.transitionFallbackTimeoutId);
        this.transitionFallbackTimeoutId = null;
      }

      if (!this.scene.isActive("StageScene")) {
        return;
      }

      this.debugLastGoalResult = "transition-complete";
      try {
        onComplete();
      } catch (error) {
        this.debugLastGoalResult = "transition-callback-error";
        this.isStageTransitioning = false;
        this.goalResolved = false;
        this.physics.resume();
        if (this.debugTransitionsEnabled) {
          console.error("[StageScene] transition callback failed", error);
        }
      }
    };

    this.time.delayedCall(2500, () => {
      if (!this.stageTransitionCard) {
        completeOnce();
        return;
      }

      this.tweens.add({
        targets: this.stageTransitionCard,
        alpha: 0,
        duration: 280,
        ease: "Sine.in",
        onComplete: () => {
          this.stageTransitionCard?.destroy(true);
          this.stageTransitionCard = null;
          completeOnce();
        }
      });
    });

    // Hard guarantee: advance stage even if tween callbacks are interrupted.
    this.time.delayedCall(3200, () => {
      if (this.stageTransitionCard) {
        this.stageTransitionCard.destroy(true);
        this.stageTransitionCard = null;
      }

      completeOnce();
    });

    // Browser timer fallback independent of Phaser's internal clock/tween lifecycle.
    this.transitionFallbackTimeoutId = window.setTimeout(() => {
      if (this.stageTransitionCard) {
        this.stageTransitionCard.destroy(true);
        this.stageTransitionCard = null;
      }

      this.debugLastGoalResult = "window-fallback-fired";
      completeOnce();
    }, 3800);
  }

  createDebugOverlay() {
    if (this.debugText) {
      return;
    }

    this.debugText = this.add.text(14, 102, "", {
      color: "#9ef3bf",
      fontSize: "12px",
      backgroundColor: "rgba(8, 12, 26, 0.65)",
      padding: { left: 6, right: 6, top: 4, bottom: 4 }
    });
    this.debugText.setDepth(60);
    this.debugText.setScrollFactor(0);
  }

  updateDebugOverlay() {
    if (!this.debugText) {
      return;
    }

    const stageId = this.stageData?.id || "none";
    const transitionCard = this.stageTransitionCard ? "shown" : "hidden";
    const currentSceneKey = this.scene.key || "unknown";
    const debugLine = [
      `DBG scene=${currentSceneKey}`,
      `stageIndex=${this.stageIndex}`,
      `stageId=${stageId}`,
      `goal=${this.debugLastGoalResult}`,
      `transitioning=${this.isStageTransitioning}`,
      `goalResolved=${this.goalResolved}`,
      `card=${transitionCard}`
    ].join(" | ");

    this.debugText.setText(debugLine);
  }

  generateHanumanTexture(g) {
    // Hanuman: 64 × 80 px — heroic monkey-god warrior
    g.clear();

    // ── Tail (drawn first so it's behind body) ────────────────────────
    // Large sweeping tail curving up and right
    g.fillStyle(0xb56820, 1);
    g.fillEllipse(58, 38, 14, 36, 0xff);   // tail base arch
    g.fillEllipse(64, 20, 12, 22, 0xff);   // tail upper curve
    g.fillStyle(0xe8a040, 1);
    g.fillEllipse(60, 36, 8, 26, 0xff);    // inner tail highlight
    g.fillEllipse(65, 21, 7, 14, 0xff);    // inner upper

    // Tail tip — flame-shaped
    g.fillStyle(0xffd060, 1);
    g.fillTriangle(60, 10, 55, 4, 66, 6);

    // ── Legs (below body) ─────────────────────────────────────────────
    g.fillStyle(0xc07030, 1);
    g.fillRect(19, 54, 10, 18);   // left leg
    g.fillRect(33, 54, 10, 18);   // right leg
    // Feet
    g.fillStyle(0x8a4c1e, 1);
    g.fillEllipse(24, 73, 14, 8);
    g.fillEllipse(38, 73, 14, 8);

    // ── Body / torso ──────────────────────────────────────────────────
    // Skin base
    g.fillStyle(0xd8862c, 1);
    g.fillRect(14, 26, 34, 32);  // torso
    // Golden dhoti (waist cloth)
    g.fillStyle(0xf5c030, 1);
    g.fillRect(14, 50, 34, 8);
    g.fillStyle(0xe0a820, 1);
    g.fillRect(14, 50, 34, 3);   // dhoti top band

    // Chest armour plate (kavach)
    g.fillStyle(0xe8b040, 1);
    g.fillRect(18, 28, 26, 20);
    // Armour shading
    g.fillStyle(0xffdf80, 0.5);
    g.fillRect(20, 28, 10, 18);  // left highlight
    g.fillStyle(0xa07018, 0.4);
    g.fillRect(36, 28, 8, 18);   // right shadow
    // Necklace
    g.fillStyle(0xfff070, 1);
    g.fillPoints([
      { x: 18, y: 28 }, { x: 26, y: 32 }, { x: 31, y: 32 }, { x: 44, y: 28 }
    ], false);

    // ── Arms ──────────────────────────────────────────────────────────
    g.fillStyle(0xd8862c, 1);
    g.fillRect(5,  28, 10, 20);   // left upper arm
    g.fillRect(47, 28, 10, 20);   // right upper arm
    // Bracelets
    g.fillStyle(0xf5c030, 1);
    g.fillRect(4, 44, 12, 5);    // left bracelet
    g.fillRect(46, 44, 12, 5);   // right bracelet
    // Forearms (slightly lighter)
    g.fillStyle(0xc07030, 1);
    g.fillRect(4,  48, 11, 14);
    g.fillRect(47, 48, 11, 14);
    // Fists (in ready fighting stance)
    g.fillStyle(0x8a4c1e, 1);
    g.fillEllipse(9, 63, 13, 11);
    g.fillEllipse(53, 63, 13, 11);

    // ── Neck ──────────────────────────────────────────────────────────
    g.fillStyle(0xd8862c, 1);
    g.fillRect(24, 18, 14, 10);

    // ── Head ──────────────────────────────────────────────────────────
    // Head shape (monkey: wider jaw, slightly elongated)
    g.fillStyle(0xe1955e, 1);
    g.fillEllipse(31, 14, 26, 22);
    g.fillStyle(0xd8862c, 1);
    g.fillEllipse(31, 18, 20, 14);  // lower jaw broadening

    // Monkey snout
    g.fillStyle(0xc07030, 1);
    g.fillEllipse(31, 20, 14, 9);
    // Nostrils
    g.fillStyle(0x6a2c0a, 1);
    g.fillCircle(28, 20, 1.5);
    g.fillCircle(34, 20, 1.5);

    // Eyes — alert, determined
    g.fillStyle(0xfffff0, 1);
    g.fillEllipse(24, 13, 7, 6);
    g.fillEllipse(38, 13, 7, 6);
    g.fillStyle(0x2a1400, 1);
    g.fillCircle(25, 13, 2.2);
    g.fillCircle(39, 13, 2.2);
    // Eye shine
    g.fillStyle(0xffffff, 1);
    g.fillCircle(26, 12, 0.8);
    g.fillCircle(40, 12, 0.8);

    // Fierce eyebrows
    g.fillStyle(0x6a2c0a, 1);
    g.fillRect(20, 8, 8, 3);
    g.fillRect(34, 8, 8, 3);

    // Ears
    g.fillStyle(0xc07030, 1);
    g.fillCircle(19, 14, 5);
    g.fillCircle(43, 14, 5);
    g.fillStyle(0xe1955e, 1);
    g.fillCircle(19, 14, 3);
    g.fillCircle(43, 14, 3);

    // ── Mukuta (golden crown) ─────────────────────────────────────────
    // Crown band
    g.fillStyle(0xf5c030, 1);
    g.fillRect(18, 3, 26, 6);
    // Crown spires
    g.fillStyle(0xf5c030, 1);
    g.fillTriangle(20, 3, 18, -6, 22, 3);  // left spike
    g.fillTriangle(31, 3, 29, -9, 33, 3);  // centre spike (tallest)
    g.fillTriangle(42, 3, 40, -6, 44, 3);  // right spike
    // Crown gem
    g.fillStyle(0xff4040, 1);
    g.fillCircle(31, 1, 3);
    g.fillStyle(0xff9090, 0.7);
    g.fillCircle(30, 0, 1.5);

    g.generateTexture("hanuman", 70, 80);
    g.clear();
  }

  setEnemyPauseForTyping(paused) {
    if (paused === this.enemyPausedForTyping || !this.enemyManager) {
      return;
    }

    this.enemyPausedForTyping = paused;
    this.enemyManager.setPaused(paused);
  }

  addPlatform(x, y, width, height, color) {
    // Main stone slab
    const shape = this.add.rectangle(x, y, width, height, color);
    this.platforms.add(shape);
    // Top-edge highlight (lighter)
    const highlight = this.add.rectangle(x, y - height / 2 + 2, width, 4, 0xffffff, 0.18);
    highlight.setDepth(0);
    // Bottom-edge shadow (darker)
    const shadow = this.add.rectangle(x, y + height / 2 - 2, width, 4, 0x000000, 0.30);
    shadow.setDepth(0);
    // Subtle crack line in middle of wide platforms
    if (width > 140) {
      const crack = this.add.rectangle(x, y, 1, height - 4, 0x000000, 0.14);
      crack.setDepth(0);
    }
  }

  handleMovement() {
    // Gyro tilt: normalised [-1, 1]; 0 when gyro inactive or within dead-zone.
    const gyroTilt = this.gyroInput?.active ? this.gyroInput.getTiltX() : 0;
    // Swipe-nav direction: -1/0/+1 (persists until tap or reverse swipe).
    const swipeNavDir = this.gyroInput?.getSwipeNavDir() ?? 0;

    const leftPressed  = this.cursors.left.isDown  || this.keys.left.isDown  || this.touchLeft  || gyroTilt < 0 || swipeNavDir < 0;
    const rightPressed = this.cursors.right.isDown || this.keys.right.isDown || this.touchRight || this.touchDiag || gyroTilt > 0 || swipeNavDir > 0;
    const upPressed    = this.cursors.up.isDown    || this.keys.up.isDown    || this.touchDiag;

    const speed = this.playerActor.getMoveSpeed();
    const jump  = this.playerActor.getJumpPower();

    let velocityX = 0;
    if (leftPressed) {
      // Gyro tilt gives proportional speed; button input gives full speed.
      velocityX = gyroTilt < 0 ? gyroTilt * speed : -speed;
    } else if (rightPressed) {
      velocityX = gyroTilt > 0 ? gyroTilt * speed : speed;
    }

    if (this.pointerMoveActive && typeof this.pointerTargetX === "number") {
      const deltaX = this.pointerTargetX - this.player.x;
      if (Math.abs(deltaX) > 10) {
        velocityX = Math.sign(deltaX) * speed;
      }
    }

    this.playerActor.setFacing(velocityX);
    this.playerActor.setHorizontalVelocity(velocityX);

    if (upPressed && this.playerActor.canJump()) {
      window.audioManager?.playJump();
      this.playerActor.jump(jump);
    }

    if (this.pointerJumpQueued && this.playerActor.canJump()) {
      window.audioManager?.playJump();
      this.playerActor.jump(jump);
      this.pointerJumpQueued = false;
    }

    if (this.touchJumpQueued && this.playerActor.canJump()) {
      window.audioManager?.playJump();
      this.playerActor.jump(jump);
      this.touchJumpQueued = false;
    }

    // Gyro shake up → jump
    if (this.gyroInput?.consumeShake() && this.playerActor.canJump()) {
      window.audioManager?.playJump();
      this.playerActor.jump(jump);
    }
  }

  applySizeMode(mode) {
    this.state.sizeMode = mode;
    this.playerActor.applySizeMode(mode);

    if (mode === "small") {
      this.hud.setMessage("Small form: agility and evasion improved.");
      return;
    }

    if (mode === "large") {
      this.hud.setMessage("Large form: strength increased.");
    }
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
    this.enemyManager.destroyWithinRadius(this.player.x, this.player.y, 180);
    window.audioManager?.playBlast();

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

  triggerMeleeAttack(heavy) {
    if (!this.playerActor || !this.enemies) { return; }

    const fired = this.playerActor.tryAttack(heavy, this.enemies, (enemy, isHeavy) => {
      // Brief white flash before the enemy is destroyed.
      enemy.setTint(0xffffff);
      this.time.delayedCall(70, () => {
        if (enemy.active) { enemy.destroy(); }
      });

      const bhaktiGain = isHeavy ? 3 : 2;
      const dharmaGain = isHeavy ? 2 : 1;
      this.state.bhakti = Math.min(100, this.state.bhakti + bhaktiGain);
      this.state.dharma = Math.min(100, this.state.dharma + dharmaGain);
      this.updateHud();
    });

    if (fired) {
      // Light screen shake to signal the strike landed or missed.
      this.cameras.main.shake(50, heavy ? 0.006 : 0.003);
    }
  }

  enterGameOver() {
    this.isGameOver = true;
    this.physics.pause();
    this.setEnemyPauseForTyping(true);
    this.hud.forceStopListening();

    window.ContributeForm?.maybeShow({ outcome: "game-over" });

    this.hud.showEndgame(
      "Hanuman has fallen.",
      "Gather devotion and rise again.",
      {
        title: "Game Over",
        buttonText: "Try Again (Enter)",
        onReplay: () => {
          window.location.reload();
        }
      }
    );
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

window.StageScene = StageScene;
