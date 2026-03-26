import { describe, expect, it, beforeAll } from "vitest";

beforeAll(async () => {
  await import("../src/data/stageRegistry.js");
  await import("../src/systems/StageLoader.js");
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
