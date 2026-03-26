class EnemyManager {
  constructor(scene) {
    this.scene = scene;
    this.group = this.scene.physics.add.group();
    this.paused = false;
  }

  rebuild(enemyPoints) {
    this.group.clear(true, true);

    enemyPoints.forEach(([x, y], index) => {
      const enemy = this.group.create(x, y, "enemy");
      enemy.setCollideWorldBounds(true);
      enemy.setBounce(1, 0);
      enemy.setVelocityX(index % 2 === 0 ? 90 : -90);
    });
  }

  setPaused(paused) {
    if (this.paused === paused) {
      return;
    }

    this.paused = paused;
    this.group.children.each((enemyObj) => {
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
      enemy.setVelocityX(typeof resumeVelocityX === "number" ? resumeVelocityX : 90);
    });
  }

  destroyWithinRadius(x, y, radius) {
    this.group.children.each((enemyObj) => {
      const enemy = enemyObj;
      const distance = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
      if (distance < radius) {
        enemy.destroy();
      }
    });
  }
}

window.EnemyManager = EnemyManager;
