class PlayerActor {
  constructor(scene) {
    this.scene = scene;
    this.sprite = null;
    this.label = null;
    this.sizeMode = "normal";
    this.facingDirection = 1; // 1 = right, -1 = left
    this.lastAttackAt = -1000;
  }

  spawn(x, y) {
    this.sprite = this.scene.physics.add.sprite(x, y, "hanuman");
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setBounce(0.05);

    this.label = this.scene.add.text(this.sprite.x - 6, this.sprite.y - 34, "H", {
      color: "#0f1533",
      fontSize: "18px",
      fontStyle: "bold"
    });
    this.label.setDepth(5);
  }

  syncLabel() {
    if (!this.label || !this.sprite) {
      return;
    }

    this.label.setPosition(this.sprite.x - 6, this.sprite.y - 34);
  }

  getMoveSpeed() {
    if (this.sizeMode === "large") {
      return 150;
    }

    if (this.sizeMode === "small") {
      return 260;
    }

    return 210;
  }

  getJumpPower() {
    if (this.sizeMode === "large") {
      return 320;
    }

    if (this.sizeMode === "small") {
      return 440;
    }

    return 390;
  }

  setHorizontalVelocity(value) {
    this.sprite.setVelocityX(value);
  }

  jump(power) {
    this.sprite.setVelocityY(-power);
  }

  canJump() {
    return Boolean(this.sprite?.body?.blocked?.down);
  }

  applySizeMode(mode) {
    this.sizeMode = mode;

    if (mode === "small") {
      this.sprite.setScale(0.65, 0.65);
      this.label?.setScale(0.9);
      return;
    }

    if (mode === "large") {
      this.sprite.setScale(1.35, 1.25);
      this.label?.setScale(1.3);
      return;
    }

    this.sprite.setScale(1, 1);
    this.label?.setScale(1);
  }

  setFacing(velocityX) {
    if (velocityX !== 0) {
      this.facingDirection = velocityX > 0 ? 1 : -1;
    }
  }

  getAttackReach(heavy) {
    const base = heavy ? 110 : 75;
    if (this.sizeMode === "large") { return base + 30; }
    if (this.sizeMode === "small") { return base - 20; }
    return base;
  }

  getAttackCooldownMs(heavy) {
    if (heavy) { return 700; }
    if (this.sizeMode === "small") { return 300; }
    if (this.sizeMode === "large") { return 580; }
    return 420;
  }

  // Performs a melee strike. Returns true if the cooldown cleared and the attack fired.
  // onHit(enemy, heavy) is called for each enemy inside the hit zone.
  tryAttack(heavy, enemyGroup, onHit) {
    const now = this.scene.time.now;
    if (now - this.lastAttackAt < this.getAttackCooldownMs(heavy)) {
      return false;
    }
    this.lastAttackAt = now;

    const reach = this.getAttackReach(heavy);
    const halfH = heavy ? 32 : 22;
    // Centre the hit zone in front of the player.
    const hitCx = this.sprite.x + this.facingDirection * (reach / 2 + 12);
    const hitCy = this.sprite.y;

    // Visual sweep flash — wider rect, higher initial alpha, longer duration.
    const color = heavy ? 0xff8c00 : 0xffdd44;
    const flash = this.scene.add.rectangle(hitCx, hitCy, reach, halfH * 2, color, 0.75);
    flash.setDepth(8);
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      scaleX: 1.4,
      duration: heavy ? 380 : 250,
      ease: "Sine.out",
      onComplete: () => flash.destroy()
    });

    // Hit detection — immediate bounds test against every active enemy.
    const hitRect = new Phaser.Geom.Rectangle(hitCx - reach / 2, hitCy - halfH, reach, halfH * 2);
    enemyGroup.children.each((enemyObj) => {
      if (!enemyObj.active) { return; }
      if (Phaser.Geom.Intersects.RectangleToRectangle(hitRect, enemyObj.getBounds())) {
        onHit(enemyObj, heavy);
      }
    });

    return true;
  }

  flashDamage(durationMs) {
    this.sprite.setTint(0xff6666);
    this.scene.time.delayedCall(durationMs, () => {
      this.sprite?.clearTint();
    });
  }

  destroy() {
    this.label?.destroy();
    this.sprite?.destroy();
  }
}

window.PlayerActor = PlayerActor;
