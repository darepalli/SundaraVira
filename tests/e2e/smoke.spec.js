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
  await expect(page.locator(".stats")).toContainText("Health");
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
    stage.state.beaconChantOffered = true;
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

test("does not render legacy on-screen touch controls", async ({ page }) => {
  await page.goto("/?buttons=1");

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
  await expect(page.locator(".touch-controls")).toHaveCount(0);
  await expect(page.locator(".touch-btn")).toHaveCount(0);
});

test("returns to menu after tutorial completion input", async ({ page }) => {
  await page.goto("/");

  await page.waitForFunction(() => {
    return Boolean(window.game && window.game.scene && window.game.scene.isActive("MenuScene"));
  });

  await page.evaluate(() => {
    window.game.scene.start("StageScene", { stageIndex: 0, tutorial: true });
  });

  await page.waitForFunction(() => {
    return Boolean(window.game && window.game.scene && window.game.scene.isActive("StageScene"));
  });

  await expect(page.locator(".tutorial-overlay")).toBeVisible();

  await page.evaluate(() => {
    const stage = window.game.scene.getScene("StageScene");
    stage.finishTutorialDemo();
  });

  await expect(page.locator(".tutorial-title")).toContainText("Tutorial complete");

  await page.mouse.click(480, 140);

  await page.waitForFunction(() => {
    return Boolean(window.game && window.game.scene && window.game.scene.isActive("MenuScene"));
  }, { timeout: 5000 });
});

test("returns to menu after tutorial goal completion", async ({ page }) => {
  await page.goto("/");

  await page.waitForFunction(() => {
    return Boolean(window.game && window.game.scene && window.game.scene.isActive("MenuScene"));
  });

  await page.evaluate(() => {
    window.game.scene.start("StageScene", { stageIndex: 0, tutorial: true });
  });

  await page.waitForFunction(() => {
    return Boolean(window.game && window.game.scene && window.game.scene.isActive("StageScene"));
  });

  await page.evaluate(() => {
    const stage = window.game.scene.getScene("StageScene");
    stage.state.fragments = stage.targetFragments;
    stage.state.beaconChantOffered = true;
    stage.handleGoalTouch();
  });

  await expect(page.locator(".tutorial-title")).toContainText("Tutorial complete", { timeout: 5000 });

  await page.mouse.click(480, 140);

  await page.waitForFunction(() => {
    return Boolean(window.game && window.game.scene && window.game.scene.isActive("MenuScene"));
  }, { timeout: 5000 });
});
