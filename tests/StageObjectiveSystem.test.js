import { describe, expect, it, beforeAll } from "vitest";

beforeAll(async () => {
  await import("../src/systems/StageObjectiveSystem.js");
});

describe("StageObjectiveSystem", () => {
  it("blocks goal when fragments are missing", () => {
    const system = new window.StageObjectiveSystem(["tip"]);
    const result = system.evaluateGoalTouch({
      stageIndex: 0,
      fragments: 3,
      targetFragments: 5,
      sizeMode: "large",
      hasNextStage: true,
      dharma: 50
    });

    expect(result.type).toBe("missing-fragments");
  });

  it("blocks goal when not in large form", () => {
    const system = new window.StageObjectiveSystem(["tip"]);
    const result = system.evaluateGoalTouch({
      stageIndex: 0,
      fragments: 5,
      targetFragments: 5,
      sizeMode: "normal",
      hasNextStage: true,
      dharma: 50
    });

    expect(result.type).toBe("need-large-form");
  });

  it("returns next stage when requirements are met and next stage exists", () => {
    const system = new window.StageObjectiveSystem(["tip"]);
    const result = system.evaluateGoalTouch({
      stageIndex: 0,
      fragments: 5,
      targetFragments: 5,
      sizeMode: "large",
      hasNextStage: true,
      dharma: 70
    });

    expect(result.type).toBe("next-stage");
  });

  it("returns victory on final stage when requirements are met", () => {
    const system = new window.StageObjectiveSystem(["tip"]);
    const result = system.evaluateGoalTouch({
      stageIndex: 1,
      fragments: 3,
      targetFragments: 3,
      sizeMode: "large",
      hasNextStage: false,
      dharma: 70
    });

    expect(result.type).toBe("victory");
    expect(result.summary).toContain("Mission complete");
  });
});
