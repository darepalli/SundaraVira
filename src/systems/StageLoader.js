class StageLoader {
  static getStageKey(index) {
    const safeIndex = Number(index);
    if (!Number.isFinite(safeIndex) || safeIndex < 0) {
      return null;
    }

    return window.stageRegistry[safeIndex] || null;
  }

  static getStageData(game, index) {
    const key = StageLoader.getStageKey(index);
    if (!key) {
      return null;
    }

    return game.cache.json.get(key) || null;
  }

  static hasNextStage(index) {
    const safeIndex = Number(index);
    if (!Number.isFinite(safeIndex)) {
      return false;
    }

    return safeIndex + 1 < window.stageRegistry.length;
  }
}

window.StageLoader = StageLoader;
