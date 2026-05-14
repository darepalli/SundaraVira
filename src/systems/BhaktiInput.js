class BhaktiInput {
  constructor() {
    this.phrasesByLanguage = {
      en: [
        "jai shri ram", "jai sri ram", "jai shree ram", "jai shree raam",
        "jay shri ram", "jay sri ram", "jai sriram", "jai shriram",
        "jai shri ram ji", "shri ram", "shree ram", "sri ram", "ram",
        "sita ram", "sitaram", "siya ram", "siyaram", "jai siyaram", "jai sita ram", "jai siya ram",
        "jai hanuman", "jai bajrang", "bajrang bali", "jai bajrangbali",
        "hanuman chalisa", "hanuman chalisha", "hanuman chalise",
        "sunderkand", "sundarkand", "sundara kanda", "sundar kand", "sundra kanda", "sunder kand"
      ],
      hi: [
        "जय श्री राम", "जय श्रीराम", "जय सिया राम", "जय सियाराम", "सिया राम", "राम",
        "जय हनुमान", "हनुमान चालीसा", "बजरंग बली", "सुन्दरकाण्ड", "सुंदरकांड"
      ],
      te: [
        "జై శ్రీరామ్", "జై శ్రీ రామ్", "శ్రీరామ్", "రామ్", "జై సీతారామ్", "జై సియా రామ్",
        "జై హనుమాన్", "హనుమాన్ చాలీసా", "బజరంగ్ బలి", "సుందరకాండ"
      ]
    };

    this.normalizedPhraseSets = {
      en: new Set(this.phrasesByLanguage.en.map((p) => this.normalizeInput(p))),
      hi: new Set(this.phrasesByLanguage.hi.map((p) => this.normalizeInput(p))),
      te: new Set(this.phrasesByLanguage.te.map((p) => this.normalizeInput(p)))
    };
  }

  evaluate(input) {
    const englishResult = this.evaluateForLanguage(input, "en", { strict: false });
    if (englishResult.success) {
      return englishResult;
    }

    const hindiResult = this.evaluateForLanguage(input, "hi", { strict: false });
    if (hindiResult.success) {
      return hindiResult;
    }

    return this.evaluateForLanguage(input, "te", { strict: false });
  }

  evaluateForLanguage(input, language = "en", options = {}) {
    const strict = options.strict !== false;
    const normalizedLanguage = ["en", "hi", "te"].includes(language) ? language : "en";
    const cleaned = this.normalizeInput(input);
    if (!cleaned) {
      return { success: false, points: 0, matched: null };
    }

    const directMatch = this._directMatch(cleaned, normalizedLanguage);
    if (directMatch) {
      return directMatch;
    }

    if (normalizedLanguage === "hi") {
      return this._evaluateHindi(cleaned, strict);
    }

    if (normalizedLanguage === "te") {
      return this._evaluateTelugu(cleaned, strict);
    }

    return this._evaluateEnglish(cleaned, strict);
  }

  _directMatch(cleaned, language) {
    const phraseSet = this.normalizedPhraseSets[language] || this.normalizedPhraseSets.en;
    for (const phrase of phraseSet) {
      if (cleaned.includes(phrase)) {
        return { success: true, points: this._phrasePoints(phrase), matched: phrase };
      }
    }
    return null;
  }

  _evaluateEnglish(cleaned, strict) {
    const tokens = new Set(cleaned.split(" "));
    const tokenArr = [...tokens];

    // Shri Ram family
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

    // Hanuman family
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

    // Sundara Kanda family
    const hasSundar =
      tokenArr.some((t) => t.startsWith("sunder") || t.startsWith("sundar") || t.startsWith("sundra"));
    const hasKand =
      tokens.has("kand") || tokens.has("kanda") ||
      tokenArr.some((t) => t.startsWith("kand"));
    if (hasSundar && (hasKand || cleaned.includes("kand"))) {
      return { success: true, points: 18, matched: "sundarakanda" };
    }

    // Sita / Siya Ram family
    const hasSita =
      tokens.has("sita") || tokens.has("siya") || tokens.has("seeta") || tokens.has("seetha");
    if (hasSita && hasRamFamily) {
      return { success: true, points: 14, matched: "sita ram" };
    }

    // Bajrang Bali family
    if (tokens.has("bajrang") || tokenArr.some((t) => t.startsWith("bajr"))) {
      return { success: true, points: 16, matched: "bajrang bali" };
    }

    if (!strict && this._phoneticFallback(cleaned)) {
      return { success: true, points: 10, matched: "jai shri ram" };
    }

    return { success: false, points: 0, matched: null };
  }

  _evaluateHindi(cleaned, strict) {
    const hasDevanagari = /[\u0900-\u097F]/.test(cleaned);
    if (strict && !hasDevanagari) {
      return { success: false, points: 0, matched: null };
    }

    const hasJai = cleaned.includes("जय");
    const hasRam = cleaned.includes("राम") || cleaned.includes("श्रीराम") || cleaned.includes("सियाराम");
    const hasShri = cleaned.includes("श्री") || cleaned.includes("श्रीराम");
    const hasSiya = cleaned.includes("सिया") || cleaned.includes("सीता") || cleaned.includes("सियाराम");

    if (hasJai && (hasShri || hasRam)) {
      return { success: true, points: 18, matched: "जय श्री राम" };
    }
    if (hasSiya && hasRam) {
      return { success: true, points: 14, matched: "सिया राम" };
    }
    if (cleaned.includes("हनुमान") && (cleaned.includes("चालीसा") || cleaned.includes("चालिसा"))) {
      return { success: true, points: 20, matched: "हनुमान चालीसा" };
    }
    if (cleaned.includes("सुन्दरकाण्ड") || cleaned.includes("सुंदरकांड")) {
      return { success: true, points: 18, matched: "सुन्दरकाण्ड" };
    }
    if (cleaned.includes("बजरंग")) {
      return { success: true, points: 16, matched: "बजरंग बली" };
    }
    if (cleaned.includes("राम")) {
      return { success: true, points: 8, matched: "राम" };
    }

    return { success: false, points: 0, matched: null };
  }

  _evaluateTelugu(cleaned, strict) {
    const hasTelugu = /[\u0C00-\u0C7F]/.test(cleaned);
    if (strict && !hasTelugu) {
      return { success: false, points: 0, matched: null };
    }

    const hasJai = cleaned.includes("జై");
    const hasRam = cleaned.includes("రామ్") || cleaned.includes("శ్రీరామ్") || cleaned.includes("సీతారామ్");

    if (hasJai && hasRam) {
      return { success: true, points: 18, matched: "జై శ్రీరామ్" };
    }
    if (cleaned.includes("హనుమాన్") && (cleaned.includes("చాలీసా") || cleaned.includes("చలీసా"))) {
      return { success: true, points: 20, matched: "హనుమాన్ చాలీసా" };
    }
    if (cleaned.includes("సుందరకాండ")) {
      return { success: true, points: 18, matched: "సుందరకాండ" };
    }
    if (cleaned.includes("బజరంగ్")) {
      return { success: true, points: 16, matched: "బజరంగ్ బలి" };
    }
    if (cleaned.includes("రామ్")) {
      return { success: true, points: 8, matched: "రామ్" };
    }

    return { success: false, points: 0, matched: null };
  }

  _phrasePoints(phrase) {
    const map = {
      "hanuman chalisa": 20, "hanuman chalisha": 20, "hanuman chalise": 20,
      "हनुमान चालीसा": 20,
      "హనుమాన్ చాలీసా": 20,
      "sunderkand": 18, "sundarkand": 18, "sundara kanda": 18,
      "sundar kand": 18, "सुन्दरकाण्ड": 18, "सुंदरकांड": 18, "సుందరకాండ": 18,
      "jai shri ram": 18, "jai sri ram": 18, "jai shree ram": 18,
      "जय श्री राम": 18, "जय श्रीराम": 18, "जय सियाराम": 18,
      "జై శ్రీరామ్": 18, "జై శ్రీ రామ్": 18,
      "jaisriram": 16, "jaishriram": 16, "jai siyaram": 16, "bajrang bali": 16,
      "बजरंग बली": 16, "బజరంగ్ బలి": 16, "shri ram": 14, "shree ram": 14, "sri ram": 14,
      "sita ram": 14, "sitaram": 14, "siya ram": 14, "jai hanuman": 14,
      "जय हनुमान": 14, "सिया राम": 14,
      "జై హనుమాన్": 14,
      "hi shri ram": 12, "i shri ram": 12, "j shri ram": 12,
      "ram": 8, "राम": 8, "రామ్": 8
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
