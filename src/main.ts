import Phaser from "phaser";
import "./style.css";
import { PrototypeScene } from "./scenes/PrototypeScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "app",
  width: 960,
  height: 540,
  backgroundColor: "#0b1020",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 800, x: 0 },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [PrototypeScene]
};

new Phaser.Game(config);
