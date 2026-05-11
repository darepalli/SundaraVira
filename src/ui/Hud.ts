type HudStats = {
  health: number;
  bhakti: number;
  dharma: number;
  fragments: number;
  targetFragments: number;
};

export class Hud {
  private readonly root: HTMLDivElement;
  private readonly stats: HTMLDivElement;
  private readonly tutorial: HTMLDivElement;
  private readonly tutorialTitle: HTMLDivElement;
  private readonly tutorialBody: HTMLDivElement;
  private readonly tutorialProgress: HTMLDivElement;
  private readonly chantPanel: HTMLDivElement;
  private readonly chantInput: HTMLInputElement;
  private readonly chantButton: HTMLButtonElement;
  private readonly micButton: HTMLButtonElement;
  private readonly message: HTMLDivElement;
  private speech: any = null;

  constructor(
    onChant: (value: string) => void,
    onVoiceState: (active: boolean) => void
  ) {
    this.root = document.createElement("div");
    this.root.className = "hud";

    this.stats = document.createElement("div");
    this.stats.className = "stats";

    this.tutorial = document.createElement("div");
    this.tutorial.className = "tutorial-card";
    this.tutorial.hidden = true;

    this.tutorialTitle = document.createElement("div");
    this.tutorialTitle.className = "tutorial-title";

    this.tutorialBody = document.createElement("div");
    this.tutorialBody.className = "tutorial-body";

    this.tutorialProgress = document.createElement("div");
    this.tutorialProgress.className = "tutorial-progress";

    this.tutorial.append(this.tutorialTitle, this.tutorialBody, this.tutorialProgress);

    this.chantPanel = document.createElement("div");
    this.chantPanel.className = "chant-panel";
    this.chantPanel.hidden = true;

    this.chantInput = document.createElement("input");
    this.chantInput.className = "chant-input";
    this.chantInput.placeholder = "Chant to open the Sacred Door";

    this.chantButton = document.createElement("button");
    this.chantButton.textContent = "Open Gate";
    this.chantButton.onclick = () => {
      onChant(this.chantInput.value);
      this.chantInput.value = "";
    };

    this.micButton = document.createElement("button");
    this.micButton.textContent = "Use Mic";
    this.micButton.onclick = () => {
      this.toggleSpeech(onChant, onVoiceState);
    };

    this.message = document.createElement("div");
    this.message.className = "message";
    this.message.textContent = "Collect 5 fragments and reach the goal.";

    this.chantInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        onChant(this.chantInput.value);
        this.chantInput.value = "";
      }
    });

    this.chantPanel.append(this.chantInput, this.chantButton, this.micButton);
    this.root.append(this.stats, this.tutorial, this.chantPanel, this.message);
    document.body.append(this.root);
  }

  updateStats(data: HudStats): void {
    this.stats.innerHTML =
      `Health: ${data.health} | Bhakti: ${data.bhakti} | Dharma: ${data.dharma} | ` +
      `Fragments: ${data.fragments}/${data.targetFragments}`;
  }

  setMessage(text: string): void {
    this.message.textContent = text;
  }

  setTutorial(title: string, detail: string, progress = ""): void {
    this.tutorial.hidden = false;
    this.tutorialTitle.textContent = title;
    this.tutorialBody.textContent = detail;
    this.tutorialProgress.textContent = progress;
    this.tutorialProgress.hidden = progress.length === 0;
  }

  hideTutorial(): void {
    this.tutorial.hidden = true;
  }

  showGateChant(): void {
    this.chantPanel.hidden = false;
    this.chantInput.value = "";
    this.chantInput.focus();
  }

  hideGateChant(): void {
    this.chantPanel.hidden = true;
    this.chantInput.value = "";
  }

  destroy(): void {
    this.speech?.stop();
    this.root.remove();
  }

  private toggleSpeech(
    onChant: (value: string) => void,
    onVoiceState: (active: boolean) => void
  ): void {
    const speechWindow = window as unknown as {
      SpeechRecognition?: new () => any;
      webkitSpeechRecognition?: new () => any;
    };
    const SpeechApi = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;

    if (!SpeechApi) {
      this.setMessage("Mic input not supported in this browser. Use typing mode.");
      return;
    }

    if (this.speech) {
      this.speech.stop();
      this.speech = null;
      onVoiceState(false);
      this.micButton.textContent = "Use Mic";
      return;
    }

    this.speech = new SpeechApi();
    this.speech.continuous = false;
    this.speech.lang = "en-IN";
    this.speech.interimResults = false;

    this.speech.onstart = () => {
      onVoiceState(true);
      this.micButton.textContent = "Stop Mic";
      this.setMessage("Listening... chant now.");
    };

    this.speech.onresult = (event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => {
      const transcript = event.results[0][0].transcript;
      onChant(transcript);
    };

    this.speech.onerror = () => {
      this.setMessage("Mic error. Try typing the chant.");
    };

    this.speech.onend = () => {
      onVoiceState(false);
      this.micButton.textContent = "Use Mic";
      this.speech = null;
    };

    this.speech.start();
  }
}
