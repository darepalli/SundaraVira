class StageObjectiveSystem {
  constructor(endgameTips) {
    this.endgameTips = endgameTips;
  }

  getFragmentMessage(stageIndex) {
    return stageIndex === 0
      ? "Fragment secured. Bhakti rises."
      : "Sky fragment secured. Mainaka is closer.";
  }

  evaluateGoalTouch(params) {
    const { stageIndex, fragments, targetFragments, sizeMode, hasNextStage, dharma } = params;

    if (fragments < targetFragments) {
      return {
        type: "missing-fragments",
        message: stageIndex === 0
          ? "Collect all fragments before reaching the beacon."
          : "Collect all sky fragments before reaching Mainaka."
      };
    }

    if (sizeMode !== "large") {
      return {
        type: "need-large-form",
        message: stageIndex === 0
          ? "The beacon responds only to Large form. Chant and transform."
          : "Mainaka reveals the path only to Large form. Chant and transform."
      };
    }

    if (hasNextStage) {
      return { type: "next-stage" };
    }

    const bonus = dharma >= 60 ? "Sacred Victory" : "Warrior Path";
    const tip = Phaser.Utils.Array.GetRandom(this.endgameTips);
    return {
      type: "victory",
      summary: `Congratulations! Mission complete: ${bonus}.`,
      tip
    };
  }
}

window.StageObjectiveSystem = StageObjectiveSystem;
