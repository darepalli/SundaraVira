import { beforeEach } from "vitest";

if (!globalThis.window) {
  globalThis.window = {};
}

if (!globalThis.Phaser) {
  globalThis.Phaser = {
    Utils: {
      Array: {
        GetRandom: (items) => items[0]
      }
    },
    Geom: {
      Intersects: {
        RectangleToRectangle: (a, b) => {
          return !(
            a.right < b.left ||
            a.left > b.right ||
            a.bottom < b.top ||
            a.top > b.bottom
          );
        }
      }
    }
  };
}

beforeEach(() => {
  globalThis.window.stageRegistry = [];
});
