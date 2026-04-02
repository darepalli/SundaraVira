/**
 * ContributeForm — post-game contribution & notification opt-in.
 *
 * Shows once per browser after a game ends (victory or game over).
 * Persists responses in localStorage["sv_feedback_data"] (JSON array).
 * If window.SV_FEEDBACK_ENDPOINT is set, also POSTs the payload there.
 *
 * Usage:
 *   ContributeForm.maybeShow({ outcome: "victory" });
 *   ContributeForm.maybeShow({ outcome: "game-over" });
 */
class ContributeForm {
  static get _SUBMITTED_KEY() { return "sv_feedback_submitted"; }
  static get _DATA_KEY()      { return "sv_feedback_data"; }
  static get _SKIP_KEY()      { return "sv_feedback_skip_until"; }

  /**
   * Show the form if the user hasn't already submitted or recently skipped.
   * Silently does nothing if localStorage is unavailable.
   * @param {Object} [context]  Meta passed to the stored record (e.g. { outcome: "victory" })
   */
  static maybeShow(context = {}) {
    try {
      if (window.localStorage.getItem(ContributeForm._SUBMITTED_KEY) === "1") return;
      const skipUntil = Number(window.localStorage.getItem(ContributeForm._SKIP_KEY) || 0);
      if (skipUntil > Date.now()) return;
    } catch (_e) {
      // localStorage blocked (private mode, etc.) — show anyway
    }
    // Small delay so the game-end screen settles first
    window.setTimeout(() => ContributeForm._show(context), 1400);
  }

  static _show(context = {}) {
    if (document.getElementById("sv-contribute-overlay")) return; // guard re-entry

    // ── Overlay backdrop ──────────────────────────────────────────────
    const overlay = document.createElement("div");
    overlay.id = "sv-contribute-overlay";
    overlay.className = "sv-cf-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "sv-cf-heading");

    // ── Card ──────────────────────────────────────────────────────────
    const card = document.createElement("div");
    card.className = "sv-cf-card";

    const heading = document.createElement("h2");
    heading.id = "sv-cf-heading";
    heading.className = "sv-cf-heading";
    heading.textContent = "Want to help shape Sundara Vira?";

    const sub = document.createElement("p");
    sub.className = "sv-cf-sub";
    sub.textContent = "Tell us how you'd like to contribute:";

    // ── Role pills ────────────────────────────────────────────────────
    const rolesWrap = document.createElement("div");
    rolesWrap.className = "sv-cf-roles";

    const ROLES = [
      { value: "player",    label: "🎮 Player",       hint: "Play & give feedback" },
      { value: "tester",    label: "🧪 Tester",        hint: "Find bugs & edge cases" },
      { value: "developer", label: "💻 Developer",     hint: "Code / art / music" },
      { value: "ideas",     label: "💡 Ideas",         hint: "Story, design & concepts" },
      { value: "other",     label: "✨ Other",          hint: "Surprise us!" },
      { value: "none",      label: "🙏 Not right now", hint: "" },
    ];

    const selectedRoles = new Set();

    ROLES.forEach(({ value, label, hint }) => {
      const pill = document.createElement("button");
      pill.type = "button";
      pill.className = "sv-cf-role-pill";
      pill.dataset.role = value;
      pill.setAttribute("aria-pressed", "false");

      const labelSpan = document.createElement("span");
      labelSpan.textContent = label;
      pill.append(labelSpan);

      if (hint) {
        const hintSpan = document.createElement("span");
        hintSpan.className = "sv-cf-role-hint";
        hintSpan.textContent = hint;
        pill.append(hintSpan);
      }

      pill.addEventListener("click", () => {
        if (value === "none") {
          // Exclusive — deselect everything else
          selectedRoles.clear();
          rolesWrap.querySelectorAll(".sv-cf-role-pill").forEach((p) => {
            p.classList.remove("sv-cf-role-selected");
            p.setAttribute("aria-pressed", "false");
          });
          selectedRoles.add("none");
          pill.classList.add("sv-cf-role-selected");
          pill.setAttribute("aria-pressed", "true");
          contactSection.hidden = true;
          validationMsg.hidden = true;
        } else {
          // Deselect "none" when any real role is chosen
          const nonePill = rolesWrap.querySelector("[data-role='none']");
          if (nonePill) {
            nonePill.classList.remove("sv-cf-role-selected");
            nonePill.setAttribute("aria-pressed", "false");
            selectedRoles.delete("none");
          }
          if (selectedRoles.has(value)) {
            selectedRoles.delete(value);
            pill.classList.remove("sv-cf-role-selected");
            pill.setAttribute("aria-pressed", "false");
          } else {
            selectedRoles.add(value);
            pill.classList.add("sv-cf-role-selected");
            pill.setAttribute("aria-pressed", "true");
          }
          contactSection.hidden = selectedRoles.size === 0;
          validationMsg.hidden = true;
        }
      });

      rolesWrap.append(pill);
    });

    // ── Contact section ───────────────────────────────────────────────
    const contactSection = document.createElement("div");
    contactSection.className = "sv-cf-contact";
    contactSection.hidden = true;

    const contactLabel = document.createElement("label");
    contactLabel.className = "sv-cf-contact-label";
    contactLabel.htmlFor = "sv-cf-contact-input";
    contactLabel.textContent = "Notify me when a new version launches:";

    const contactInput = document.createElement("input");
    contactInput.id = "sv-cf-contact-input";
    contactInput.className = "sv-cf-contact-input";
    contactInput.type = "text";
    contactInput.placeholder = "email  or  WhatsApp number (+91…)";
    contactInput.autocomplete = "off";
    contactInput.setAttribute("autocorrect", "off");
    contactInput.setAttribute("autocapitalize", "none");
    contactInput.setAttribute("spellcheck", "false");
    // Prevent the chant keyboard-capture logic from swallowing keys here
    contactInput.addEventListener("keydown", (e) => { e.stopPropagation(); });

    const contactNote = document.createElement("p");
    contactNote.className = "sv-cf-contact-note";
    contactNote.textContent = "Only used to notify you about new releases. No spam, ever.";

    contactSection.append(contactLabel, contactInput, contactNote);

    // ── Validation message ────────────────────────────────────────────
    const validationMsg = document.createElement("p");
    validationMsg.className = "sv-cf-validation";
    validationMsg.setAttribute("role", "alert");
    validationMsg.hidden = true;

    // ── Actions ───────────────────────────────────────────────────────
    const actions = document.createElement("div");
    actions.className = "sv-cf-actions";

    const submitBtn = document.createElement("button");
    submitBtn.type = "button";
    submitBtn.className = "sv-cf-submit";
    submitBtn.textContent = "Send";

    const skipBtn = document.createElement("button");
    skipBtn.type = "button";
    skipBtn.className = "sv-cf-skip";
    skipBtn.textContent = "Maybe later";

    actions.append(submitBtn, skipBtn);
    card.append(heading, sub, rolesWrap, contactSection, validationMsg, actions);
    overlay.append(card);
    document.body.append(overlay);

    // Initial focus
    window.setTimeout(() => rolesWrap.querySelector(".sv-cf-role-pill")?.focus(), 60);

    // ── Submit handler ────────────────────────────────────────────────
    let nudgeShown = false;
    submitBtn.addEventListener("click", () => {
      if (selectedRoles.size === 0) {
        validationMsg.textContent = "Please choose at least one option above.";
        validationMsg.hidden = false;
        return;
      }

      const roles = [...selectedRoles];
      const contact = contactInput.value.trim();

      // If they chose real roles but left contact blank — nudge once, not hard-block
      if (!roles.includes("none") && !contact && !nudgeShown) {
        nudgeShown = true;
        validationMsg.textContent = "Add a contact to be notified, or tap Send again to skip it.";
        validationMsg.hidden = false;
        contactInput.focus();
        return;
      }

      validationMsg.hidden = true;
      ContributeForm._submit({ roles, contact, context });
      ContributeForm._showThanks(card, overlay);
    });

    // ── Skip / later ──────────────────────────────────────────────────
    skipBtn.addEventListener("click", () => {
      try {
        // Suppress for 7 days
        const suppress = Date.now() + 7 * 24 * 60 * 60 * 1000;
        window.localStorage.setItem(ContributeForm._SKIP_KEY, String(suppress));
      } catch (_e) { /* ignore */ }
      overlay.remove();
    });

    // Close on backdrop click
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.remove();
    });

    // Escape key
    const onKey = (e) => {
      if (e.key === "Escape") {
        overlay.remove();
        document.removeEventListener("keydown", onKey);
      }
    };
    document.addEventListener("keydown", onKey);
  }

  static _submit({ roles, contact, context }) {
    // Persist locally
    try {
      window.localStorage.setItem(ContributeForm._SUBMITTED_KEY, "1");
      const existing = JSON.parse(
        window.localStorage.getItem(ContributeForm._DATA_KEY) || "[]"
      );
      existing.push({ roles, contact, context, ts: new Date().toISOString() });
      window.localStorage.setItem(ContributeForm._DATA_KEY, JSON.stringify(existing));
    } catch (_e) { /* localStorage unavailable */ }

    // Optional: POST to a backend — set window.SV_FEEDBACK_ENDPOINT to enable
    const endpoint = window.SV_FEEDBACK_ENDPOINT;
    if (endpoint && typeof endpoint === "string") {
      const body = JSON.stringify({ roles, contact, context });
      try {
        if (navigator.sendBeacon) {
          navigator.sendBeacon(endpoint, new Blob([body], { type: "application/json" }));
        } else {
          fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
            keepalive: true
          }).catch(() => { /* best-effort */ });
        }
      } catch (_e) { /* network errors are non-fatal */ }
    }
  }

  static _showThanks(card, overlay) {
    card.innerHTML = "";
    card.className = "sv-cf-card sv-cf-card-thanks";

    const icon = document.createElement("div");
    icon.className = "sv-cf-thanks-icon";
    icon.textContent = "🙏";

    const title = document.createElement("h2");
    title.className = "sv-cf-heading";
    title.textContent = "Thank you!";

    const msg = document.createElement("p");
    msg.className = "sv-cf-sub";
    msg.textContent = "Your response has been noted. We'll reach out when there's something new.";

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "sv-cf-submit";
    closeBtn.textContent = "Back to game";
    closeBtn.addEventListener("click", () => overlay.remove());

    card.append(icon, title, msg, closeBtn);

    // Auto-dismiss after 5 seconds
    window.setTimeout(() => overlay.remove(), 5000);
  }
}

window.ContributeForm = ContributeForm;
