import Phaser from "phaser";
import { BhaktiInput } from "../systems/BhaktiInput";
import { Hud } from "../ui/Hud";

type PlayerState = {
  health: number;
  bhakti: number;
  dharma: number;
  fragments: number;
  sizeMode: "small" | "normal" | "large";
};

const TARGET_FRAGMENTS = 5;

export class PrototypeScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private fragments!: Phaser.Physics.Arcade.Group;
  private enemies!: Phaser.Physics.Arcade.Group;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private goal!: Phaser.GameObjects.Rectangle;

  private hud!: Hud;
  private bhaktiInput = new BhaktiInput();
  private state: PlayerState = {
    health: 100,
    bhakti: 0,
    dharma: 50,
    fragments: 0,
    sizeMode: "normal"
  };

  constructor() {
    super("PrototypeScene");
  }

  preload(): void {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    g.fillStyle(0xf6b13e, 1);
    g.fillCircle(10, 10, 10);
    g.generateTexture("fragment", 20, 20);

    g.clear();
    g.fillStyle(0x5ad6ff, 1);
    g.fillRect(0, 0, 36, 48);
    g.generateTexture("hanuman", 36, 48);

    g.clear();
    g.fillStyle(0xcc3344, 1);
    g.fillRect(0, 0, 28, 28);
    g.generateTexture("enemy", 28, 28);

    g.destroy();
  }

  create(): void {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = {
      left: this.input.keyboard!.addKey("A"),
      right: this.input.keyboard!.addKey("D"),
      up: this.input.keyboard!.addKey("W"),
      small: this.input.keyboard!.addKey("Q"),
      large: this.input.keyboard!.addKey("E"),
      blast: this.input.keyboard!.addKey("F")
    };

    this.createWorld();
    this.createEntities();
    this.bindCollisions();

    this.hud = new Hud(
      (value) => this.handleChant(value),
      (active) => {
        if (active) {
          this.hud.setMessage("Voice mode active. Speak clearly.");
        }
      }
    );

    this.updateHud();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.hud.destroy();
    });
  }

  update(): void {
    this.handleMovement();

    if (Phaser.Input.Keyboard.JustDown(this.keys.small)) {
      this.applySizeMode("small");
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.large)) {
      this.applySizeMode("large");
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.blast)) {
      this.useBhaktiBlast();
    }

    if (this.state.health <= 0) {
      this.scene.restart();
    }
  }

  private createWorld(): void {
    this.cameras.main.setBackgroundColor("#0f1533");

    this.platforms = this.physics.add.staticGroup();

    this.addPlatform(480, 520, 960, 40, 0x1f2f6f);
    this.addPlatform(180, 400, 240, 20, 0x2d3f87);
    this.addPlatform(520, 320, 260, 20, 0x2d3f87);
    this.addPlatform(830, 250, 220, 20, 0x2d3f87);

    this.goal = this.add.rectangle(900, 180, 40, 70, 0x56d96b);
    this.add.text(762, 135, "Sacred Beacon", {
      color: "#d8ffe0",
      fontSize: "15px"
    });

    this.add.text(20, 20, "Sundara Vira Prototype", {
      color: "#f7b042",
      fontSize: "22px"
    });

    this.add.text(20, 52, "Move: A/D or Arrows | Jump: W/Up | Q/E: Size | F: Bhakti Blast", {
      color: "#d0d7ff",
      fontSize: "13px"
    });
  }

  private createEntities(): void {
    this.player = this.physics.add.sprite(70, 460, "hanuman");
    this.player.setCollideWorldBounds(true);
    this.player.setBounce(0.05);

    this.fragments = this.physics.add.group();
    const fragmentPoints: Array<[number, number]> = [
      [170, 360],
      [270, 360],
      [500, 280],
      [615, 280],
      [830, 210]
    ];

    fragmentPoints.forEach(([x, y]) => {
      const orb = this.fragments.create(x, y, "fragment") as Phaser.Physics.Arcade.Sprite;
      orb.body.setAllowGravity(false);
      this.tweens.add({
        targets: orb,
        y: y - 6,
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut"
      });
    });

    this.enemies = this.physics.add.group();
    [
      [350, 480],
      [700, 290],
      [820, 220]
    ].forEach(([x, y], index) => {
      const enemy = this.enemies.create(x, y, "enemy") as Phaser.Physics.Arcade.Sprite;
      enemy.setCollideWorldBounds(true);
      enemy.setBounce(1, 0);
      enemy.setVelocityX(index % 2 === 0 ? 90 : -90);
    });
  }

  private bindCollisions(): void {
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.enemies, this.platforms);

    this.physics.add.overlap(this.player, this.fragments, (_playerObj, fragmentObj) => {
      fragmentObj.destroy();
      this.state.fragments += 1;
      this.state.bhakti += 4;
      this.state.dharma += 2;
      this.hud.setMessage("Fragment secured. Bhakti rises.");
      this.updateHud();
    });

    this.physics.add.overlap(this.player, this.enemies, () => {
      this.state.health = Math.max(0, this.state.health - 15);
      this.state.dharma = Math.max(0, this.state.dharma - 1);
      this.player.setTint(0xff6666);
      this.time.delayedCall(120, () => this.player.clearTint());
      this.updateHud();

      if (this.state.health === 0) {
        this.hud.setMessage("Hanuman has fallen. Restarting...");
      }
    });

    this.physics.add.existing(this.goal, true);
    this.physics.add.overlap(this.player, this.goal, () => {
      if (this.state.fragments >= TARGET_FRAGMENTS) {
        const bonus = this.state.dharma >= 60 ? "Sacred Victory" : "Warrior Path";
        this.hud.setMessage(`Mission complete: ${bonus}. Press F5 to play again.`);
        this.physics.pause();
      } else {
        this.hud.setMessage("Collect all fragments before reaching the beacon.");
      }
    });
  }

  private addPlatform(
    x: number,
    y: number,
    width: number,
    height: number,
    color: number
  ): void {
    const shape = this.add.rectangle(x, y, width, height, color);
    this.platforms.add(shape);
  }

  private handleMovement(): void {
    const leftPressed = this.cursors.left.isDown || this.keys.left.isDown;
    const rightPressed = this.cursors.right.isDown || this.keys.right.isDown;
    const upPressed = this.cursors.up.isDown || this.keys.up.isDown;

    const speed = this.state.sizeMode === "large" ? 150 : this.state.sizeMode === "small" ? 260 : 210;
    const jump = this.state.sizeMode === "large" ? 320 : this.state.sizeMode === "small" ? 440 : 390;

    if (leftPressed) {
      this.player.setVelocityX(-speed);
    } else if (rightPressed) {
      this.player.setVelocityX(speed);
    } else {
      this.player.setVelocityX(0);
    }

    if (upPressed && this.player.body.blocked.down) {
      this.player.setVelocityY(-jump);
    }
  }

  private applySizeMode(mode: PlayerState["sizeMode"]): void {
    this.state.sizeMode = mode;

    if (mode === "small") {
      this.player.setScale(0.65, 0.65);
      this.hud.setMessage("Small form: agility and evasion improved.");
      return;
    }

    if (mode === "large") {
      this.player.setScale(1.35, 1.25);
      this.hud.setMessage("Large form: strength increased.");
      return;
    }

    this.player.setScale(1, 1);
  }

  private useBhaktiBlast(): void {
    if (this.state.bhakti < 20) {
      this.hud.setMessage("Not enough Bhakti. Chant or collect fragments.");
      return;
    }

    this.state.bhakti -= 20;
    this.state.dharma = Math.min(100, this.state.dharma + 1);

    this.enemies.children.each((enemyObj) => {
      const sprite = enemyObj as Phaser.Physics.Arcade.Sprite;
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

  private handleChant(value: string): void {
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

    if (this.state.bhakti >= 75) {
      this.applySizeMode("large");
      this.hud.setMessage("Anjaneya surge active. Large form empowered.");
    } else {
      this.hud.setMessage(`Chant accepted: ${result.matched}. +${result.points} Bhakti`);
    }

    this.updateHud();
  }

  private updateHud(): void {
    this.hud.updateStats({
      health: this.state.health,
      bhakti: this.state.bhakti,
      dharma: this.state.dharma,
      fragments: this.state.fragments,
      targetFragments: TARGET_FRAGMENTS
    });
  }
}
