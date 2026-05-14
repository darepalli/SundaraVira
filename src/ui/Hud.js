class Hud {
  constructor(onChant, onVoiceState, onTypingStateChange = () => {}, canAutoOffer = () => false, uiLanguage = "en") {
    this.uiLanguage = ["en", "hi", "te"].includes(uiLanguage) ? uiLanguage : "en";
    this.speech = null;
    this.isMicListening = false;
    this.shouldKeepListening = false;
    this.manualChantBuffer = "";
    this.lastAutoSubmittedText = "";
    this.lastFinalTranscript = "";
    this.lastFinalAt = 0;
    this.noSpeechErrorCount = 0;
    this.micRetryCount = 0;
    this.maxMicRetries = 7;
    this.restartDelayMs = 300;
    this.restartTimer = null;
    this.isMicStarting = false;
    this.currentSessionId = 0;
    this.lastMicErrorCode = "";
    this.micAccessGranted = false;
    this.endgameReplayHandler = null;
    this.speechRecognitionSupported = Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
    this.allowedChants = [
      "jai shri ram",
      "shri ram",
      "jai siya ram",
      "sita ram",
      "siyaram",
      "jai hanuman",
      "bajrang bali",
      "jai hanuman jai shri ram",
      "sundara kandam"
    ];

    this.root = document.createElement("div");
    this.root.className = "hud";

    this.stats = document.createElement("div");
    this.stats.className = "stats";
    this._healthBar = this._makeStatBar(this.stats, "\u2764 Health", "stat-bar-health");
    this._dharmaBar = this._makeStatBar(this.stats, "\u2606 Dharma", "stat-bar-dharma");
    this._fragmentsText = document.createElement("div");
    this._fragmentsText.className = "stat-fragments";
    this.stats.append(this._fragmentsText);

    // Vertical Bhakti column — fixed to left edge, fill rises from bottom
    this._bhaktiColumn = document.createElement("div");
    this._bhaktiColumn.className = "bhakti-column";

    const bhaktiValueEl = document.createElement("div");
    bhaktiValueEl.className = "bhakti-value-text";
    bhaktiValueEl.textContent = "0";
    this._bhaktiValueEl = bhaktiValueEl;

    const bhaktiTrack = document.createElement("div");
    bhaktiTrack.className = "bhakti-track";

    const bhaktiFill = document.createElement("div");
    bhaktiFill.className = "bhakti-fill";
    bhaktiFill.style.height = "0%";
    this._bhaktiFill = bhaktiFill;

    const bhaktiLabel = document.createElement("div");
    bhaktiLabel.className = "bhakti-label";
    bhaktiLabel.textContent = "\u2726 Bhakti";

    bhaktiTrack.append(bhaktiFill);
    this._bhaktiColumn.append(bhaktiValueEl, bhaktiTrack, bhaktiLabel);
    document.body.append(this._bhaktiColumn);

    this.chantPanel = document.createElement("div");
    this.chantPanel.className = "chant-panel";

    this.chantInput = document.createElement("input");
    this.chantInput.className = "chant-input";
    this.chantInput.placeholder = "Choose a chant below or use mic";
    this.chantInput.autocomplete = "off";
    this.chantInput.spellcheck = false;
    this.chantInput.readOnly = true;
    this.chantInput.inputMode = "text";
    this.chantInput.enterKeyHint = "done";
    this.chantInput.type = "text";
    this.chantInput.name = "chant";
    this.chantInput.lang = "en";
    this.chantInput.setAttribute("spellcheck", "false");
    this.chantInput.setAttribute("autocorrect", "off");
    this.chantInput.setAttribute("autocapitalize", "none");
    this.chantInput.setAttribute("data-gramm", "false");
    this.chantInput.setAttribute("data-gramm_editor", "false");
    this.chantInput.setAttribute("data-enable-grammarly", "false");
    this.chantInput.setAttribute("aria-autocomplete", "none");
    this.chantInput.setAttribute("autocomplete", "off");

    this.chantPresetSelect = document.createElement("select");
    this.chantPresetSelect.className = "chant-preset";

    const defaultPresetOption = document.createElement("option");
    defaultPresetOption.value = "";
    defaultPresetOption.textContent = "Select an allowed chant";
    this.chantPresetSelect.append(defaultPresetOption);

    this.allowedChants.forEach((phrase) => {
      const option = document.createElement("option");
      option.value = phrase;
      option.textContent = phrase;
      this.chantPresetSelect.append(option);
    });

    this.chantPresetSelect.addEventListener("change", () => {
      if (!this.chantPresetSelect.value) {
        return;
      }
      this.manualChantBuffer = this.chantPresetSelect.value;
      this.syncChantInput();
    });

    this.micLanguageSelect = document.createElement("select");
    this.micLanguageSelect.className = "mic-language";

    [
      { value: "hi-IN", label: "Hindi (India)" },
      { value: "en-IN", label: "English (India)" },
      { value: "mr-IN", label: "Marathi (India)" },
      { value: "ta-IN", label: "Tamil (India)" },
      { value: "te-IN", label: "Telugu (India)" },
      { value: "en-US", label: "English (US)" },
      { value: "sa-IN", label: "Sanskrit/Indic" }
    ].forEach((optionData) => {
      const option = document.createElement("option");
      option.value = optionData.value;
      option.textContent = optionData.label;
      this.micLanguageSelect.append(option);
    });
    const recognitionLangByUi = {
      en: "en-IN",
      hi: "hi-IN",
      te: "te-IN"
    };
    this.micLanguageSelect.value = recognitionLangByUi[this.uiLanguage] || "en-IN";

    this.chantButton = document.createElement("button");
    this.chantButton.type = "button";
    this.chantButton.textContent = "Offer Chant";
    this.chantButton.onclick = () => {
      this.submitChant(onChant);
    };

    this.micButton = document.createElement("button");
    this.micButton.type = "button";
    this.micButton.textContent = "Start Listening";
    this.micButton.onclick = async () => {
      await this.toggleSpeech(onChant, onVoiceState, canAutoOffer);
    };

    this.message = document.createElement("div");
    this.message.className = "message";
    this.message.textContent = "Collect 5 fragments and reach the goal.";

    this.micStatus = document.createElement("div");
    this.micStatus.className = "mic-status";
    this.micStatus.textContent = "Mic status: idle";

    this.browserHint = document.createElement("div");
    this.browserHint.className = "browser-hint";
    this.browserHint.hidden = true;

    this.endgameOverlay = document.createElement("div");
    this.endgameOverlay.className = "endgame-overlay";
    this.endgameOverlay.hidden = true;

    this.endgameCard = document.createElement("div");
    this.endgameCard.className = "endgame-card";

    this.endgameTitle = document.createElement("h2");
    this.endgameTitle.className = "endgame-title";
    this.endgameTitle.textContent = "Victory";

    this.endgameSummary = document.createElement("p");
    this.endgameSummary.className = "endgame-summary";

    this.endgameTip = document.createElement("p");
    this.endgameTip.className = "endgame-tip";

    this.endgameReplayButton = document.createElement("button");
    this.endgameReplayButton.type = "button";
    this.endgameReplayButton.textContent = "Play Again";
    this.endgameReplayButton.onclick = () => {
      if (typeof this.endgameReplayHandler === "function") {
        this.endgameReplayHandler();
        return;
      }

      window.location.reload();
    };

    this.tutorialOverlay = document.createElement("div");
    this.tutorialOverlay.className = "tutorial-overlay";
    this.tutorialOverlay.hidden = true;

    this.tutorialCard = document.createElement("div");
    this.tutorialCard.className = "tutorial-card";

    this.tutorialTitle = document.createElement("div");
    this.tutorialTitle.className = "tutorial-title";

    this.tutorialBody = document.createElement("div");
    this.tutorialBody.className = "tutorial-body";

    this.tutorialProgress = document.createElement("div");
    this.tutorialProgress.className = "tutorial-progress";

    this.tutorialControls = document.createElement("div");
    this.tutorialControls.className = "tutorial-controls";

    this.tutorialControlNodes = {};
    [
      ["move", "Arrows"],
      ["jump", "Jump"],
      ["size", "Size"],
      ["chant", "Chant"],
      ["attack", "Attack"],
      ["blast", "Blast"]
    ].forEach(([key, label]) => {
      const chip = document.createElement("span");
      chip.className = "tutorial-key";
      chip.textContent = label;
      this.tutorialControlNodes[key] = chip;
      this.tutorialControls.append(chip);
    });

    this.tutorialActionButton = document.createElement("button");
    this.tutorialActionButton.type = "button";
    this.tutorialActionButton.className = "tutorial-action";
    this.tutorialActionButton.textContent = "Skip tutorial";
    this.tutorialActionHandler = null;
    this.tutorialActionButton.onclick = () => {
      if (typeof this.tutorialActionHandler === "function") {
        this.tutorialActionHandler();
        return;
      }

      this.hideTutorialOverlay();
    };

    this.chantInput.addEventListener("keydown", (event) => {
      if (event.isComposing) {
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        this.submitChant(onChant);
        return;
      }
    });

    // On some mobile browsers, explicit focus from a touch gesture is needed
    // for the on-screen keyboard to appear reliably.
    this.chantInput.addEventListener("touchend", () => {
      this.chantInput.focus({ preventScroll: true });
    }, { passive: true });

    this.chantInput.addEventListener("click", () => {
      this.chantInput.focus({ preventScroll: true });
    });


    this.chantInput.addEventListener("focus", () => {
      onTypingStateChange(true);
    });

    this.chantInput.addEventListener("blur", () => {
      onTypingStateChange(false);
    });

    this.endgameCard.append(
      this.endgameTitle,
      this.endgameSummary,
      this.endgameTip,
      this.endgameReplayButton
    );
    this.endgameOverlay.append(this.endgameCard);

    this.tutorialCard.append(
      this.tutorialTitle,
      this.tutorialBody,
      this.tutorialProgress,
      this.tutorialControls,
      this.tutorialActionButton
    );
    this.tutorialOverlay.append(this.tutorialCard);

    if (!this.speechRecognitionSupported) {
      this.micLanguageSelect.disabled = true;
      this.micButton.disabled = true;
      this.browserHint.hidden = false;
      this.browserHint.textContent = "Voice chant needs Chrome or Edge. Firefox can play the game, but speech recognition is unavailable here.";
      this.setMicStatus("unsupported in this browser");
    }

    this.chantPanel.append(this.chantPresetSelect, this.chantInput, this.chantButton, this.micLanguageSelect, this.micButton);
    this.root.append(this.stats, this.chantPanel, this.message, this.micStatus, this.browserHint);
    document.body.append(this.root);
    document.body.append(this.endgameOverlay);
    document.body.append(this.tutorialOverlay);
  }

  _makeStatBar(parent, label, modifierClass) {
    const row = document.createElement("div");
    row.className = "stat-bar-row";

    const labelEl = document.createElement("span");
    labelEl.className = "stat-label";
    labelEl.textContent = label;

    const track = document.createElement("div");
    track.className = "stat-bar-track";

    const fill = document.createElement("div");
    fill.className = `stat-bar-fill ${modifierClass}`;
    fill.style.width = "0%";

    const valueEl = document.createElement("span");
    valueEl.className = "stat-value";
    valueEl.textContent = "0";

    track.append(fill);
    row.append(labelEl, track, valueEl);
    parent.append(row);
    return { fill, value: valueEl };
  }

  updateStats(data) {
    this._healthBar.fill.style.width = `${data.health}%`;
    this._healthBar.value.textContent = data.health;
    this._bhaktiFill.style.height = `${data.bhakti}%`;
    this._bhaktiValueEl.textContent = data.bhakti;
    this._dharmaBar.fill.style.width = `${data.dharma}%`;
    this._dharmaBar.value.textContent = data.dharma;
    this._fragmentsText.textContent = `Fragments: ${data.fragments} / ${data.targetFragments}`;
  }

  setMessage(text) {
    this.message.textContent = text;
  }

  setMicStatus(text) {
    const prefixByLang = {
      en: "Mic status",
      hi: "माइक स्थिति",
      te: "మైక్ స్థితి"
    };
    const prefix = prefixByLang[this.uiLanguage] || prefixByLang.en;
    this.micStatus.textContent = `${prefix}: ${text}`;
  }

  flashAutoOfferSuccess() {
    this.root.classList.remove("auto-offer-success");
    void this.root.offsetWidth;
    this.root.classList.add("auto-offer-success");

    window.clearTimeout(this.autoOfferFlashTimeout);
    this.autoOfferFlashTimeout = window.setTimeout(() => {
      this.root.classList.remove("auto-offer-success");
    }, 700);
  }

  syncChantInput(interim = false) {
    this.chantInput.value = this.manualChantBuffer;
    if (interim) {
      this.chantInput.classList.add("interim");
    } else {
      this.chantInput.classList.remove("interim");
    }
    const cursorPos = this.chantInput.value.length;
    this.chantInput.setSelectionRange(cursorPos, cursorPos);
  }

  clearChantInput() {
    this.manualChantBuffer = "";
    this.chantInput.classList.remove("interim");
    if (this.chantPresetSelect) {
      this.chantPresetSelect.value = "";
    }
    this.syncChantInput();
  }

  isAllowedChant(text) {
    if (!text) return false;
    const normalized = this.normalizeTranscript(text).toLowerCase().trim();
    const isAllowed = this.allowedChants.some(chant => {
      const chantNorm = chant.toLowerCase().trim();
      return chantNorm === normalized;
    });
    return isAllowed;
  }

  setChantPanelHidden(hidden) {
    if (this.chantPanel) {
      this.chantPanel.style.display = hidden ? "none" : "flex";
    }
  }

  hideChantPanelCompletely() {
    if (this.chantPanel) {
      this.chantPanel.style.display = "none";
    }
  }

  submitChant(onChant) {
    const chosen = (this.chantPresetSelect?.value || "").trim();
    const typedOrMic = (this.manualChantBuffer || "").trim();
    const value = chosen || typedOrMic;

    if (!value) {
      this.setMessage("Pick an allowed chant from the list or use mic.");
      return;
    }

    onChant(value);
    this.clearChantInput();
    this.collapseChantKeyboard();
  }

  collapseChantKeyboard() {
    this.chantInput.blur();
  }

  showEndgame(summary, tip, options = {}) {
    const title = options.title || "Victory";
    const buttonText = options.buttonText || "Play Again";
    this.endgameReplayHandler = typeof options.onReplay === "function" ? options.onReplay : null;

    this.endgameTitle.textContent = title;
    this.endgameReplayButton.textContent = buttonText;
    this.endgameSummary.textContent = summary;
    this.endgameTip.textContent = tip;
    this.endgameOverlay.hidden = false;
  }

  hideEndgame() {
    this.endgameReplayHandler = null;
    this.endgameOverlay.hidden = true;
  }

  showTutorialOverlay(options = {}) {
    const {
      title = "Tutorial",
      body = "",
      progress = "",
      activeControls = [],
      actionText = "Skip tutorial",
      onAction = null
    } = options;

    this.tutorialTitle.textContent = title;
    this.tutorialBody.textContent = body;
    this.tutorialProgress.textContent = progress;
    this.tutorialProgress.hidden = !progress;
    this.tutorialActionButton.textContent = actionText;
    this.tutorialActionHandler = typeof onAction === "function" ? onAction : null;

    Object.entries(this.tutorialControlNodes).forEach(([key, node]) => {
      node.classList.toggle("active", activeControls.includes(key));
    });

    this.tutorialOverlay.hidden = false;
  }

  hideTutorialOverlay() {
    this.tutorialActionHandler = null;
    this.tutorialOverlay.hidden = true;
  }

  updateTutorialOverlay(options = {}) {
    if (options.title !== undefined) {
      this.tutorialTitle.textContent = options.title;
    }
    if (options.body !== undefined) {
      this.tutorialBody.textContent = options.body;
    }
    if (options.progress !== undefined) {
      this.tutorialProgress.textContent = options.progress;
      this.tutorialProgress.hidden = !options.progress;
    }
    if (options.actionText !== undefined) {
      this.tutorialActionButton.textContent = options.actionText;
    }
    if (options.onAction !== undefined) {
      this.tutorialActionHandler = typeof options.onAction === "function" ? options.onAction : null;
    }
    if (options.activeControls !== undefined) {
      Object.entries(this.tutorialControlNodes).forEach(([key, node]) => {
        node.classList.toggle("active", options.activeControls.includes(key));
      });
    }
  }

  triggerEndgameReplay() {
    if (typeof this.endgameReplayHandler === "function") {
      this.endgameReplayHandler();
      return;
    }

    window.location.reload();
  }

  forceStopListening() {
    this.shouldKeepListening = false;
    this.currentSessionId += 1;
    this.isMicStarting = false;
    this.isMicListening = false;
    this.lastMicErrorCode = "";
    window.clearTimeout(this.restartTimer);

    try {
      this.speech?.stop();
    } catch (_error) {
      // Ignore browser-specific stop() errors during teardown.
    }

    this.micButton.textContent = "Start Listening";
    this.micButton.disabled = false;
    this.micLanguageSelect.disabled = false;
    this.setMicStatus("idle");
  }

  createTouchControls(_callbacks) {
    // On-screen gameplay buttons were removed in favor of gestures/gyro.
  }

  destroyTouchControls() {
    this._touchControlsEl?.remove();
    this._touchControlsEl = null;
    this._gyroPanel = null;
    this._gyroBall = null;
    this._dpadEls = null;
    this._gyroToggleBtn = null;
  }

  hideTouchControls() {
    // On-screen controls removed; retained for compatibility.
  }

  showTouchControls() {
    // On-screen controls removed; retained for compatibility.
  }

  showGyroPermissionModal(onAccept, onSkip) {
    if (this._gyroModal) return; // guard against double-call

    const overlay = document.createElement("div");
    overlay.className = "endgame-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Enable tilt controls");

    const card = document.createElement("div");
    card.className = "endgame-card";

    const title = document.createElement("h2");
    title.className = "endgame-title";
    title.textContent = "Tilt to Move";

    const body = document.createElement("p");
    body.className = "endgame-summary";
    body.textContent = "This game can use your phone\u2019s motion sensors so you steer by tilting \u2014 no buttons needed. Allow motion access?";

    const hint = document.createElement("p");
    hint.className = "endgame-tip";
    hint.textContent = "If you skip, swipe and touch movement remain available.";

    const btnRow = document.createElement("div");
    btnRow.style.cssText = "display:flex;gap:12px;justify-content:center;margin-top:4px";

    const acceptBtn = document.createElement("button");
    acceptBtn.type = "button";
    acceptBtn.textContent = "Enable Tilt";
    acceptBtn.style.cssText = "flex:1;max-width:180px";

    const skipBtn = document.createElement("button");
    skipBtn.type = "button";
    skipBtn.textContent = "Skip";
    skipBtn.style.cssText = "flex:1;max-width:120px;opacity:0.7";

    const dismiss = () => {
      overlay.remove();
      this._gyroModal = null;
    };

    acceptBtn.addEventListener("click", () => { dismiss(); onAccept(); });
    skipBtn.addEventListener("click",   () => { dismiss(); onSkip();   });

    btnRow.append(acceptBtn, skipBtn);
    card.append(title, body, hint, btnRow);
    overlay.append(card);
    document.body.append(overlay);
    this._gyroModal = overlay;
  }

  showGyroToggle(_visible) {
    // Retained for scene compatibility; no on-screen controls exist now.
  }

  setGyroActive(_active) {
    // Retained for scene compatibility; no on-screen controls exist now.
  }

  /**
   * Visually move the indicator ball to reflect current tilt.
   * @param {number} tiltX  Normalised value in [-1, 1]
   */
  updateGyroIndicator(_tiltX) {
    // Retained for scene compatibility; indicator UI was removed.
  }

  destroy() {
    this.shouldKeepListening = false;
    this.currentSessionId += 1;
    window.clearTimeout(this.restartTimer);
    this.speech?.stop();
    window.clearTimeout(this.autoOfferFlashTimeout);
    this.root.remove();
    this.endgameOverlay.remove();
    this.tutorialOverlay.remove();
    this._bhaktiColumn.remove();
    this._gyroModal?.remove();
    this._gyroModal = null;
    this.destroyTouchControls();
    document.body.classList.remove("touch-active");
  }

  async toggleSpeech(onChant, onVoiceState, canAutoOffer) {
    if (this.isMicStarting) {
      return;
    }

    const host = window.location.hostname;
    const isLocalhost = host === "localhost" || host === "127.0.0.1";
    const isSecureContext = window.location.protocol === "https:" || isLocalhost;
    if (!isSecureContext) {
      this.setMicStatus("blocked - requires localhost or https");
      this.setMessage("Mic requires https or localhost. Run with a local server.");
      return;
    }

    const speechWindow = window;
    const SpeechApi = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;

    if (!SpeechApi) {
      this.setMicStatus("unsupported in this browser");
      this.setMessage("Mic input is supported best in Chrome or Edge on localhost/https.");
      return;
    }

    this.isMicStarting = true;
    this.micButton.disabled = true;

    const micReady = await this.ensureMicrophoneAccess();
    if (!micReady) {
      this.isMicStarting = false;
      this.micButton.disabled = false;
      return;
    }

    this.setMicStatus("permission granted");

    if (this.speech && this.isMicListening) {
      this.shouldKeepListening = false;
      this.currentSessionId += 1;
      window.clearTimeout(this.restartTimer);
      this.setMicStatus("stopping");
      this.speech.stop();
      this.isMicStarting = false;
      this.micButton.disabled = false;
      return;
    }

    this.shouldKeepListening = true;
    this.lastAutoSubmittedText = "";
    this.lastFinalTranscript = "";
    this.lastFinalAt = 0;
    this.noSpeechErrorCount = 0;
    this.micRetryCount = 0;
    this.lastMicErrorCode = "";
    this.restartDelayMs = 300;
    window.clearTimeout(this.restartTimer);
    this.clearChantInput();
    this.setMessage("Listening started. Previous chant cleared.");
    this.currentSessionId += 1;
    this.micLanguageSelect.disabled = true;
    this.isMicStarting = false;
    this.micButton.disabled = false;
    this.startSpeechSession(SpeechApi, onChant, onVoiceState, canAutoOffer);
  }

  startSpeechSession(SpeechApi, onChant, onVoiceState, canAutoOffer) {
    if (!this.shouldKeepListening) {
      return;
    }

    const sessionId = this.currentSessionId;

    this.speech = new SpeechApi();
    this.speech.continuous = true;
    this.speech.lang = this.micLanguageSelect.value || "hi-IN";
    this.speech.interimResults = true;
    this.speech.maxAlternatives = 5;

    this.speech.onstart = () => {
      if (sessionId !== this.currentSessionId) {
        return;
      }

      this.isMicListening = true;
      this.setMicStatus("listening");
      onVoiceState(true);
      this.micButton.textContent = "Stop Listening";
      this.setMessage(`Listening in ${this.micLanguageSelect.options[this.micLanguageSelect.selectedIndex].text}... chant now.`);
    };

    this.speech.onresult = (event) => {
      if (sessionId !== this.currentSessionId) {
        return;
      }

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];

        // Interim: show live hearing feedback so user knows mic is picking their voice up
        if (!result.isFinal) {
          const interimText = this.normalizeTranscript(result[0]?.transcript || "");
          if (interimText) {
            this.manualChantBuffer = interimText;
            this.syncChantInput(true);
            this.setMicStatus(`hearing: "${interimText}"`);
          }
          continue;
        }

        // Final: loop all alternatives — prefer whichever one matches a chant
        let finalTranscript = null;
        let matchedViaAlternative = false;
        for (let k = 0; k < result.length; k++) {
          const alt = result[k];
          const altText = this.normalizeTranscript(alt?.transcript || "");
          if (!altText) {
            continue;
          }
          // Skip very low-confidence non-primary alts to avoid noise
          if (k > 0 && (alt.confidence || 0) < 0.15) {
            continue;
          }
          if (!finalTranscript) {
            finalTranscript = altText;
          }
          if (canAutoOffer(altText)) {
            finalTranscript = altText;
            matchedViaAlternative = true;
            break;
          }
        }

        if (!finalTranscript) {
          continue;
        }

        const now = Date.now();
        const normalizedTranscript = finalTranscript.toLowerCase();
        const isDuplicate =
          normalizedTranscript === this.lastFinalTranscript &&
          now - this.lastFinalAt < 1200;
        if (isDuplicate) {
          continue;
        }

        this.lastFinalTranscript = normalizedTranscript;
        this.lastFinalAt = now;
        this.noSpeechErrorCount = 0;
        this.micRetryCount = 0;
        this.restartDelayMs = 300;

        this.manualChantBuffer = finalTranscript;
        this.syncChantInput(false);
        this.setMicStatus("transcript captured");
        this.setMessage(`Heard: "${finalTranscript}"`);

        if (normalizedTranscript !== this.lastAutoSubmittedText &&
            (matchedViaAlternative || canAutoOffer(finalTranscript))) {
          this.lastAutoSubmittedText = normalizedTranscript;
          this.setMicStatus("chant offered!");
          this.setMessage(`Chant offered: "${finalTranscript}" — Bhakti gained!`);
          this.flashAutoOfferSuccess();
          onChant(finalTranscript);
          this.clearChantInput();
        }
      }
    };

    this.speech.onerror = (event) => {
      if (sessionId !== this.currentSessionId) {
        return;
      }

      const code = event?.error || "unknown";
      this.lastMicErrorCode = code;

      if (code === "not-allowed" || code === "service-not-allowed") {
        this.shouldKeepListening = false;
        this.setMicStatus("permission denied");
        this.setMessage("Microphone permission denied. Allow mic access in browser settings.");
      } else if (code === "audio-capture") {
        this.shouldKeepListening = false;
        this.setMicStatus("no microphone detected");
        this.setMessage("No microphone detected. Connect a mic and try again.");
      } else if (code === "no-speech") {
        this.noSpeechErrorCount += 1;
        this.setMicStatus("no speech detected");
        this.restartDelayMs = Math.min(1500, this.restartDelayMs + 220);
        if (this.noSpeechErrorCount >= 3) {
          this.setMessage("No speech detected repeatedly. Move closer to mic and reduce background noise.");
        } else {
          this.setMessage("No speech detected. Keep chanting; listening will continue.");
        }
      } else if (code === "aborted") {
        this.setMicStatus("session interrupted");
        this.setMessage("Mic session interrupted. Reconnecting...");
        this.restartDelayMs = Math.min(1300, this.restartDelayMs + 180);
      } else if (code === "network") {
        this.setMicStatus("network issue");
        this.setMessage("Network issue while processing speech. Retrying...");
        this.restartDelayMs = Math.min(1400, this.restartDelayMs + 250);
      } else {
        this.setMicStatus(`error - ${code}`);
        this.setMessage("Mic error. Try typing the chant.");
        this.restartDelayMs = Math.min(1600, this.restartDelayMs + 350);
      }
    };

    this.speech.onend = () => {
      if (sessionId !== this.currentSessionId) {
        return;
      }

      if (!this.shouldKeepListening) {
        this.setMicStatus("idle");
        this.setMessage("Stopped listening.");

        this.isMicListening = false;
        onVoiceState(false);
        this.micButton.textContent = "Start Listening";
        this.micLanguageSelect.disabled = false;
        this.speech = null;
        return;
      }

      this.micRetryCount += 1;
      if (this.micRetryCount > this.maxMicRetries) {
        this.shouldKeepListening = false;
        this.setMicStatus("retry limit reached");
        this.setMessage("Mic became unstable after multiple reconnect attempts. Press Start Listening to try again.");
        this.isMicListening = false;
        onVoiceState(false);
        this.micButton.textContent = "Start Listening";
        this.micLanguageSelect.disabled = false;
        this.speech = null;
        return;
      }

      this.isMicListening = false;
      this.speech = null;
      this.setMicStatus("restarting listener");
      window.clearTimeout(this.restartTimer);
      this.restartTimer = window.setTimeout(() => {
        if (!this.shouldKeepListening || sessionId !== this.currentSessionId) {
          return;
        }

        this.startSpeechSession(SpeechApi, onChant, onVoiceState, canAutoOffer);
      }, this.restartDelayMs);
    };

    try {
      this.speech.start();
    } catch (error) {
      this.shouldKeepListening = false;
      this.isMicListening = false;
      this.speech = null;
      this.setMicStatus("failed to start");
      this.setMessage(`Unable to start microphone (${error?.name || "UnknownError"}). Try again in Chrome or Edge.`);
      this.micButton.textContent = "Start Listening";
      this.micLanguageSelect.disabled = false;
      onVoiceState(false);
    }
  }

  async ensureMicrophoneAccess() {
    if (this.micAccessGranted) {
      return true;
    }

    const mediaDevices = navigator.mediaDevices;
    if (!mediaDevices?.getUserMedia) {
      this.setMessage("This browser does not expose microphone access. Try Chrome or Edge.");
      return false;
    }

    try {
      const stream = await mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      this.micAccessGranted = true;
      this.setMicStatus("permission granted");
      return true;
    } catch (error) {
      const name = error?.name || "UnknownError";
      if (name === "NotAllowedError" || name === "SecurityError") {
        this.setMicStatus("permission denied");
        this.setMessage("Microphone permission is blocked. Allow mic access for this site in the browser address bar/site settings.");
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        this.setMicStatus("no microphone found");
        this.setMessage("No microphone device was found. Connect a mic and try again.");
      } else if (name === "NotReadableError") {
        this.setMicStatus("microphone busy");
        this.setMessage("Microphone is busy or unavailable. Close other apps using it and try again.");
      } else {
        this.setMicStatus(`access failed - ${name}`);
        this.setMessage("Could not access microphone. Check browser permissions and try Chrome or Edge.");
      }

      return false;
    }
  }

  normalizeTranscript(value) {
    return String(value)
      .trim()
      .replace(/[\n\r\t]+/g, " ")
      .replace(/[.,!?;:।।…,]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
}

window.Hud = Hud;
