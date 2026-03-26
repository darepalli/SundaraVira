export type ChantResult = {
  success: boolean;
  points: number;
  matched: string | null;
};

export class BhaktiInput {
  private readonly validPhrases = [
    "jai shri ram",
    "jai sriram",
    "hanuman chalisa",
    "sundarakanda",
    "ram"
  ];

  evaluate(input: string): ChantResult {
    const cleaned = input.trim().toLowerCase().replace(/\s+/g, " ");

    if (!cleaned) {
      return { success: false, points: 0, matched: null };
    }

    const match = this.validPhrases.find((phrase) => cleaned.includes(phrase));

    if (!match) {
      return { success: false, points: 0, matched: null };
    }

    const points = Math.min(20, Math.max(8, match.length));
    return { success: true, points, matched: match };
  }
}
