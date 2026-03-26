import { describe, expect, it, beforeAll } from "vitest";

beforeAll(async () => {
  await import("../src/systems/BhaktiInput.js");
});

describe("BhaktiInput", () => {
  it("accepts core Jai Shri Ram variants", () => {
    const input = new window.BhaktiInput();
    const result = input.evaluate("Jai Shri Ram");

    expect(result.success).toBe(true);
    expect(result.points).toBeGreaterThan(0);
  });

  it("accepts Devanagari chant", () => {
    const input = new window.BhaktiInput();
    const result = input.evaluate("जय श्री राम");

    expect(result.success).toBe(true);
  });

  it("rejects unrelated text", () => {
    const input = new window.BhaktiInput();
    const result = input.evaluate("hello world");

    expect(result.success).toBe(false);
    expect(result.points).toBe(0);
  });
});
