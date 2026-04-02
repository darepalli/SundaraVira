import { describe, expect, it, beforeAll, beforeEach } from "vitest";

beforeAll(async () => {
  await import("../src/systems/StageLoader.js");
});

// setup.js resets window.stageRegistry = [] in its own beforeEach.
// Re-populate it here so tests always see the real registry.
beforeEach(() => {
  window.stageRegistry = ["stage1", "stage2-mainaka"];
});

describe("StageLoader", () => {
  it("resolves stage keys by index", () => {
    expect(window.StageLoader.getStageKey(0)).toBe("stage1");
    expect(window.StageLoader.getStageKey(1)).toBe("stage2-mainaka");
    expect(window.StageLoader.getStageKey(2)).toBeNull();
  });

  it("reports whether next stage exists", () => {
    expect(window.StageLoader.hasNextStage(0)).toBe(true);
    expect(window.StageLoader.hasNextStage(1)).toBe(false);
  });

  it("reads stage data from game cache", () => {
    const fakeData = { id: "stage1", targetFragments: 5 };
    const game = {
      cache: {
        json: {
          get: (key) => (key === "stage1" ? fakeData : null)
        }
      }
    };

    const data = window.StageLoader.getStageData(game, 0);
    expect(data).toEqual(fakeData);
  });
});
