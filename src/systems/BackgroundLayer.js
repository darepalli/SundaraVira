class BackgroundLayer {
  constructor(scene) {
    this.scene = scene;
    this.decorShapes = [];
    this.mountainShape = null;
  }

  clear() {
    this.decorShapes.forEach((shape) => {
      this.scene.tweens.killTweensOf(shape);
      shape.destroy();
    });
    this.decorShapes = [];

    if (this.mountainShape) {
      this.mountainShape.destroy();
      this.mountainShape = null;
    }
  }

  _track(obj) {
    this.decorShapes.push(obj);
    return obj;
  }

  render(stageData) {
    this.clear();

    // ── Sky gradient layers (deep → horizon) ──────────────────────────
    const skyDeep = this.scene.add.rectangle(480, 120, 960, 240, 0x04081a, 1);
    skyDeep.setDepth(-30);
    this._track(skyDeep);

    const skyMid = this.scene.add.rectangle(480, 290, 960, 200, 0x0a122e, 1);
    skyMid.setDepth(-30);
    this._track(skyMid);

    const skyHorizon = this.scene.add.rectangle(480, 430, 960, 160, 0x1a1040, 1);
    skyHorizon.setDepth(-30);
    this._track(skyHorizon);

    // Horizon warm glow (Lanka fire on the horizon)
    const horizonGlow = this.scene.add.ellipse(480, 496, 960, 100, 0x6a1a00, 0.45);
    horizonGlow.setDepth(-29);
    this._track(horizonGlow);

    const horizonGlow2 = this.scene.add.ellipse(480, 494, 680, 60, 0xc43800, 0.22);
    horizonGlow2.setDepth(-28);
    this._track(horizonGlow2);

    // ── Starfield ─────────────────────────────────────────────────────
    const starPositions = [
      [52, 18], [130, 44], [210, 12], [290, 55], [370, 22],
      [450, 8],  [530, 38], [610, 16], [690, 47], [770, 24],
      [850, 11], [920, 52], [80, 72], [160, 80], [240, 65],
      [340, 92], [430, 74], [510, 88], [600, 70], [680, 85],
      [760, 60], [840, 78], [900, 94], [30, 100], [110, 112],
      [200, 98], [310, 108], [390, 122], [480, 96], [560, 115],
      [650, 102], [740, 118], [820, 96], [940, 106], [65, 130],
      [145, 145], [250, 136], [350, 148], [470, 130], [570, 143],
      [660, 135], [750, 152], [870, 138], [18, 160], [95, 172],
      [185, 158], [275, 174], [460, 162]
    ];

    starPositions.forEach(([x, y], i) => {
      const size = (i % 3 === 0) ? 2 : 1.2;
      const alpha = 0.5 + Math.random() * 0.45;
      const star = this.scene.add.circle(x, y, size, 0xfff8e8, alpha);
      star.setDepth(-27);
      this._track(star);

      if (i % 4 === 0) {
        this.scene.tweens.add({
          targets: star,
          alpha: { from: alpha, to: alpha * 0.3 },
          duration: 1200 + (i * 137) % 1800,
          yoyo: true,
          repeat: -1,
          ease: "Sine.inOut"
        });
      }
    });

    // ── Crescent moon ─────────────────────────────────────────────────
    const moonCx = 820, moonCy = 48, moonR = 22;
    const moonBase = this.scene.add.circle(moonCx, moonCy, moonR, 0xf5e8a0, 0.92);
    moonBase.setDepth(-26);
    this._track(moonBase);

    // Glow halo
    const moonHalo = this.scene.add.circle(moonCx, moonCy, moonR + 10, 0xf5e8a0, 0.12);
    moonHalo.setDepth(-27);
    this._track(moonHalo);

    // Dark bite to make crescent
    const moonBite = this.scene.add.circle(moonCx + 14, moonCy - 6, moonR - 4, 0x04081a, 1);
    moonBite.setDepth(-25);
    this._track(moonBite);

    // Gentle moon pulse
    this.scene.tweens.add({
      targets: moonHalo,
      alpha: { from: 0.12, to: 0.22 },
      duration: 2800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut"
    });

    // ── Distant Lanka fortress silhouette ─────────────────────────────
    const lankaX = 680;
    // Towers
    [[lankaX - 60, 450, 18, 80], [lankaX - 30, 458, 22, 72],
     [lankaX,     445, 26, 88], [lankaX + 32, 456, 22, 76],
     [lankaX + 62, 448, 18, 84]].forEach(([tx, ty, tw, th]) => {
      const tower = this.scene.add.rectangle(tx, ty, tw, th, 0x1e0808, 0.78);
      tower.setDepth(-24);
      this._track(tower);
      // Crown battlements
      const crown = this.scene.add.rectangle(tx, ty - th / 2 - 4, tw + 4, 8, 0x2a0c0c, 0.82);
      crown.setDepth(-24);
      this._track(crown);
    });
    // Lanka base wall
    const lankaWall = this.scene.add.rectangle(lankaX, 490, 200, 22, 0x1a0606, 0.85);
    lankaWall.setDepth(-24);
    this._track(lankaWall);
    // Lanka amber fire glow behind fortress
    const lankaFire = this.scene.add.ellipse(lankaX, 476, 180, 40, 0xff5500, 0.14);
    lankaFire.setDepth(-25);
    this._track(lankaFire);
    this.scene.tweens.add({
      targets: lankaFire,
      alpha: { from: 0.14, to: 0.24 },
      scaleX: { from: 1, to: 1.06 },
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut"
    });

    // ── Ocean depth layers ─────────────────────────────────────────────
    const seaDeep = this.scene.add.rectangle(480, 545, 960, 90, 0x020d18, 1);
    seaDeep.setDepth(-23);
    this._track(seaDeep);

    const seaMid = this.scene.add.rectangle(480, 518, 960, 36, stageData.sea.baseColor, 0.85);
    seaMid.setDepth(-22);
    this._track(seaMid);

    const seaSurface = this.scene.add.rectangle(480, 502, 960, 14, stageData.sea.foamColor, 0.30);
    seaSurface.setDepth(-21);
    this._track(seaSurface);

    // Animated foam crests
    const waveDefs = [
      [90,  504, 110], [240, 508, 130], [410, 502, 100],
      [590, 506, 140], [740, 504, 120], [888, 507, 100]
    ];
    waveDefs.forEach(([x, y, w], i) => {
      const wave = this.scene.add.ellipse(x, y, w, 9, 0xc8eeff, 0.20);
      wave.setDepth(-20);
      this._track(wave);
      this.scene.tweens.add({
        targets: wave,
        x: x + (i % 2 === 0 ? 18 : -18),
        alpha: { from: 0.20, to: 0.38 },
        duration: 2600 + i * 400,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut"
      });
    });

    // Ocean surface moon reflection streak
    const reflection = this.scene.add.rectangle(740, 510, 80, 6, 0xf5e8a0, 0.18);
    reflection.setDepth(-19);
    this._track(reflection);
    this.scene.tweens.add({
      targets: reflection,
      alpha: { from: 0.18, to: 0.06 },
      scaleX: { from: 1, to: 0.6 },
      duration: 2200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut"
    });

    // ── Clouds ────────────────────────────────────────────────────────
    stageData.clouds.groups.forEach(([x, y, scale], index) => {
      const color = stageData.clouds.color;
      const alpha = stageData.clouds.alpha;
      const left  = this.scene.add.ellipse(-28 * scale, 2,   62 * scale, 28 * scale, color, alpha * 0.8);
      const mid   = this.scene.add.ellipse(0, -8,              76 * scale, 36 * scale, color, alpha + 0.05);
      const right = this.scene.add.ellipse(32 * scale, 3,   54 * scale, 24 * scale, color, alpha * 0.85);
      // Thin inner highlight
      const glow  = this.scene.add.ellipse(0, -8,              52 * scale, 18 * scale, 0xffffff, 0.06);
      const cluster = this.scene.add.container(x, y, [left, mid, right, glow]);
      cluster.setDepth(-22);
      this._track(cluster);

      this.scene.tweens.add({
        targets: cluster,
        x: x + (index % 2 === 0 ? 20 : -20),
        duration: 4500 + index * 480,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut"
      });
    });

    // ── Mountain (Mainaka) ────────────────────────────────────────────
    if (stageData.mountain) {
      const m = stageData.mountain;
      this.mountainShape = this.scene.add.triangle(
        m.x, m.y,
        m.points[0], m.points[1],
        m.points[2], m.points[3],
        m.points[4], m.points[5],
        m.color
      );
      this.mountainShape.setAlpha(m.alpha);
      // Snow cap highlight
      const capTip = this.scene.add.triangle(
        m.x, m.y,
        m.points[4] - 14, m.points[5] + 52,
        m.points[2],      m.points[3],
        m.points[4] + 14, m.points[5] + 52,
        0xe8f4ff
      );
      capTip.setAlpha(0.35);
      this._track(capTip);
    }
  }
}

window.BackgroundLayer = BackgroundLayer;
