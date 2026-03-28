import { test, expect } from "@playwright/test";

test("loads menu and starts gameplay scene", async ({ page }) => {
  await page.goto("/");

  await page.waitForFunction(() => {
    return Boolean(window.game && window.game.scene && window.game.scene.isActive("MenuScene"));
  });

  await page.evaluate(() => {
    window.game.scene.start("StageScene", { stageIndex: 0 });
  });

  await page.waitForFunction(() => {
    return Boolean(window.game && window.game.scene && window.game.scene.isActive("StageScene"));
  });

  await expect(page.locator(".hud")).toBeVisible();
  await expect(page.locator(".stats")).toContainText("Health:");
});

test("transitions from stage 1 to stage 2 when objectives are met", async ({ page }) => {
  await page.goto("/");

  await page.waitForFunction(() => {
    return Boolean(window.game && window.game.scene && window.game.scene.isActive("MenuScene"));
  });

  await page.evaluate(() => {
    window.game.scene.start("StageScene", { stageIndex: 0 });
  });

  await page.waitForFunction(() => {
    return Boolean(window.game && window.game.scene && window.game.scene.isActive("StageScene"));
  });

  const marker = `scene-marker-${Date.now()}`;
  await page.evaluate((markerValue) => {
    const stage = window.game.scene.getScene("StageScene");
    stage.__e2eMarker = markerValue;
    stage.state.fragments = stage.targetFragments;
    stage.applySizeMode("large");
    stage.handleGoalTouch();
  }, marker);

  await page.waitForFunction(() => {
    if (!window.game || !window.game.scene || !window.game.scene.isActive("StageScene")) {
      return false;
    }

    const stage = window.game.scene.getScene("StageScene");
    return stage.stageIndex === 1 && stage.stageData && stage.stageData.id === "stage2-mainaka";
  }, { timeout: 7000 });

  const transitionState = await page.evaluate((markerValue) => {
    const stage = window.game.scene.getScene("StageScene");
    return {
      stageIndex: stage.stageIndex,
      stageId: stage.stageData?.id,
      markerPreserved: stage.__e2eMarker === markerValue
    };
  }, marker);

  expect(transitionState.stageIndex).toBe(1);
  expect(transitionState.stageId).toBe("stage2-mainaka");
  expect(transitionState.markerPreserved).toBe(true);

  await expect(page.locator(".message")).toContainText(/Mainaka|Sky|fragment/i);
});

test("shows on-screen touch controls in gameplay", async ({ page }) => {
  await page.goto("/");

  await page.waitForFunction(() => {
    return Boolean(window.game && window.game.scene && window.game.scene.isActive("MenuScene"));
  });

  await page.evaluate(() => {
    window.game.scene.start("StageScene", { stageIndex: 0 });
  });

  await page.waitForFunction(() => {
    return Boolean(window.game && window.game.scene && window.game.scene.isActive("StageScene"));
  });

  await expect(page.locator(".touch-controls")).toBeVisible();
  await expect(page.locator(".touch-btn")).toHaveCount(9);
});
