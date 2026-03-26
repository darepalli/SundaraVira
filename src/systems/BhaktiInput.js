class BhaktiInput {
  constructor() {
    this.validPhrases = [
      // Full standard romanized forms
      "jai shri ram", "jai sri ram", "jai shree ram", "jai shree raam",
      "jay shri ram", "jay sri ram", "jai sriram", "jai shriram",
      "jai shri ram ji",
      // Run-together / merged (common browser mic output)
      "jaisri ram", "jaisriram", "jaishriram", "jaisriraam", "jaishriraam",
      // Browser mishears "jai" as "hi", "i", "j", "a"
      "hi shri ram", "i shri ram", "j shri ram", "a shri ram",
      "shri ram", "shree ram", "sri ram",
      // Sita-Ram
      "sita ram", "sitaram", "siya ram", "siyaram",
      "jai siyaram", "jai sita ram", "jai siya ram",
      // Hanuman / Bajrang
      "jai hanuman", "jai bajrang", "bajrang bali", "jai bajrangbali",
      // Longer devotional texts
      "hanuman chalisa", "hanuman chalisha", "hanuman chalise",
      "sunderkand", "sundarkand", "sundara kanda",
      "sundar kand", "sundra kanda", "sunder kand",
      // Devanagari
      "जय श्री राम", "जय श्रीराम", "जय सियाराम", "जय सिया राम",
      "हनुमान चालीसा", "सुन्दरकाण्ड", "सुंदरकांड",
      "राम", "सिया राम", "जय हनुमान", "बजरंग बली",
      "ram"
    ];
  }

  evaluate(input) {
    const cleaned = this.normalizeInput(input);
    if (!cleaned) {
      return { success: false, points: 0, matched: null };
    }

    // 1. Direct phrase inclusion check
    const directMatch = this.validPhrases.find((p) => cleaned.includes(p));
    if (directMatch) {
      return { success: true, points: this._phrasePoints(directMatch), matched: directMatch };
    }

    const tokens = new Set(cleaned.split(" "));
    const tokenArr = [...tokens];

    // 2. Shri Ram — no longer requires "jai" prefix (browser often drops the first word)
    const hasShriFamily =
      tokens.has("shri") || tokens.has("sri") || tokens.has("shree") || tokens.has("sree") ||
      tokenArr.some((t) => t.startsWith("shri") || t.startsWith("sri") || t === "shriram" || t === "sriram");
    const hasRamFamily =
      tokens.has("ram") || tokens.has("raam") ||
      tokenArr.some((t) => t.includes("ram") && t.length > 2);
    const hasJaiFamily =
      tokens.has("jai") || tokens.has("jay") || tokens.has("hi") ||
      tokens.has("j") || tokens.has("i") || tokens.has("a");

    if (hasShriFamily && hasRamFamily) {
      const points = hasJaiFamily ? 18 : 14;
      return { success: true, points, matched: "jai shri ram" };
    }

    // 3. Hanuman Chalisa
    const hasHanuman =
      tokens.has("hanuman") ||
      tokenArr.some((t) => t.startsWith("hanam") || t.startsWith("hanm") || t.startsWith("hanum"));
    const hasChalisa =
      tokens.has("chalisa") || tokens.has("chalisha") || tokens.has("chalise") ||
      tokenArr.some((t) => t.startsWith("chali"));
    if (hasHanuman && hasChalisa) {
      return { success: true, points: 20, matched: "hanuman chalisa" };
    }
    if (hasHanuman && hasJaiFamily) {
      return { success: true, points: 14, matched: "jai hanuman" };
    }

    // 4. Sundara Kanda
    const hasSundar =
      tokenArr.some((t) => t.startsWith("sunder") || t.startsWith("sundar") || t.startsWith("sundra"));
    const hasKand =
      tokens.has("kand") || tokens.has("kanda") ||
      tokenArr.some((t) => t.startsWith("kand"));
    if (hasSundar && (hasKand || cleaned.includes("kand"))) {
      return { success: true, points: 18, matched: "sundarakanda" };
    }

    // 5. Sita / Siya Ram
    const hasSita =
      tokens.has("sita") || tokens.has("siya") || tokens.has("seeta") || tokens.has("seetha");
    if (hasSita && hasRamFamily) {
      return { success: true, points: 14, matched: "sita ram" };
    }

    // 6. Bajrang Bali
    if (tokens.has("bajrang") || tokenArr.some((t) => t.startsWith("bajr"))) {
      return { success: true, points: 16, matched: "bajrang bali" };
    }

    // 7. Devanagari
    const hasJaiD = tokens.has("जय");
    const hasRamD = tokens.has("राम") || tokens.has("श्रीराम") || tokens.has("सियाराम");
    const hasShriD = tokens.has("श्री") || tokens.has("श्रीराम");

    if (hasJaiD && (hasShriD || hasRamD)) {
      return { success: true, points: 18, matched: "जय श्री राम" };
    }
    if (tokens.has("हनुमान") && (tokens.has("चालीसा") || tokens.has("चालिसा"))) {
      return { success: true, points: 20, matched: "हनुमान चालीसा" };
    }
    const hasSundarD =
      cleaned.includes("सुन्दरकाण्ड") || cleaned.includes("सुंदरकांड") ||
      ((tokens.has("सुन्दर") || tokens.has("सुंदर")) &&
       (tokens.has("काण्ड") || tokens.has("कांड")));
    if (hasSundarD) {
      return { success: true, points: 18, matched: "सुन्दरकाण्ड" };
    }
    if (tokens.has("राम")) {
      return { success: true, points: 8, matched: "राम" };
    }
    if ((tokens.has("सिया") || tokens.has("सीता")) && hasRamD) {
      return { success: true, points: 14, matched: "सिया राम" };
    }
    if (tokens.has("बजरंग")) {
      return { success: true, points: 16, matched: "बजरंग बली" };
    }
    if (tokens.has("हनुमान") && hasJaiD) {
      return { success: true, points: 14, matched: "जय हनुमान" };
    }

    // 8. Phonetic fallback — catches heavily distorted recognition output
    if (this._phoneticFallback(cleaned)) {
      return { success: true, points: 10, matched: "jai shri ram" };
    }

    return { success: false, points: 0, matched: null };
  }

  _phrasePoints(phrase) {
    const map = {
      "hanuman chalisa": 20, "hanuman chalisha": 20, "hanuman chalise": 20,
      "हनुमान चालीसा": 20,
      "sunderkand": 18, "sundarkand": 18, "sundara kanda": 18,
      "sundar kand": 18, "सुन्दरकाण्ड": 18, "सुंदरकांड": 18,
      "jai shri ram": 18, "jai sri ram": 18, "jai shree ram": 18,
      "जय श्री राम": 18, "जय श्रीराम": 18, "जय सियाराम": 18,
      "jaisriram": 16, "jaishriram": 16, "jai siyaram": 16, "bajrang bali": 16,
      "बजरंग बली": 16, "shri ram": 14, "shree ram": 14, "sri ram": 14,
      "sita ram": 14, "sitaram": 14, "siya ram": 14, "jai hanuman": 14,
      "जय हनुमान": 14, "सिया राम": 14,
      "hi shri ram": 12, "i shri ram": 12, "j shri ram": 12,
      "ram": 8, "राम": 8
    };
    return map[phrase] ?? Math.min(20, Math.max(8, phrase.length));
  }

  // Catches distorted transcripts that still phonetically resemble chants
  _phoneticFallback(cleaned) {
    const srPatterns = ["shri", "sri", "shree", "shr", "sh r"];
    const ramPatterns = ["ram", "raam", "rum"];
    const hasSrLike = srPatterns.some((p) => cleaned.includes(p));
    const hasRamLike = ramPatterns.some((p) => cleaned.includes(p));
    if (hasSrLike && hasRamLike) {
      return true;
    }
    const hanumanPatterns = ["hanuma", "hanum", "anuman", "hanam", "hanm"];
    if (hanumanPatterns.some((p) => cleaned.includes(p))) {
      return true;
    }
    const sundarPatterns = ["sunder", "sundar", "sundra"];
    const kandPatterns = ["kand", "kanda"];
    if (sundarPatterns.some((p) => cleaned.includes(p)) &&
        kandPatterns.some((p) => cleaned.includes(p))) {
      return true;
    }
    return false;
  }

  normalizeInput(input) {
    return input
      .trim()
      .toLowerCase()
      .replace(/[.,!?;:'"()\[\]{}|/\\_\-।।…]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
}

window.BhaktiInput = BhaktiInput;
