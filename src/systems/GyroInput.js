/**
 * GyroInput — Device-orientation navigation + shake jump + swipe size-change.
 *
 * Movement  : Tilt phone left/right (DeviceOrientationEvent.gamma)
 * Jump      : Shake phone upward  (DeviceMotionEvent acceleration spike)
 * Size large: Swipe up  on the game canvas
 * Size small: Swipe down on the game canvas
 *
 * Usage:
 *   const gyro = new GyroInput();
 *   gyro.enableSwipe();            // always-on swipe detection (no permission)
 *   await gyro.requestPermission() // iOS 13+ gate
 *   gyro.start()                   // begin orientation + motion + swipe
 *   gyro.stop()                    // pause orientation/motion (swipe stays)
 *   gyro.destroy()                 // remove all listeners
 */
class GyroInput {
  constructor() {
    /** True while deviceorientation + devicemotion listeners are active. */
    this.active = false;
    /** True while swipe touch listeners are active. */
    this._swipeListening = false;

    // Current tilt values
    this.gamma = 0; // left/right tilt, degrees (-90 … +90)

    // Calibration offset (subtracted from gamma each frame)
    this._gammaOffset = 0;

    // Shake detection
    this._lastShakeAt = -1000;
    this._shakeThreshold = 18;   // m/s²
    this._shakeCooldownMs = 450;
    this.shakeFired = false;     // consumed by scene each frame

    // Swipe detection
    this._swipeStartY = null;
    this._swipeStartX = null;
    this._swipeMinDist = 55;     // px minimum vertical travel for a swipe
    this.swipeUpFired = false;   // consumed by scene each frame
    this.swipeDownFired = false;

    // Tilt config
    this.deadZone = 8;   // degrees of tilt ignored (standing-still tolerance)
    this.maxTilt = 40;   // degrees at which full speed is applied

    // Bind once so we can remove the exact same reference later
    this._onOrientation = this._onOrientation.bind(this);
    this._onMotion      = this._onMotion.bind(this);
    this._onTouchStart  = this._onTouchStart.bind(this);
    this._onTouchEnd    = this._onTouchEnd.bind(this);
  }

  // ── Public API ────────────────────────────────────────────────────

  /** True if the DeviceOrientationEvent API is present in this browser. */
  get isSupported() {
    return typeof DeviceOrientationEvent !== "undefined";
  }

  /**
   * Request motion sensor permission (iOS 13+ only).
   * On Android / non-iOS browsers returns true immediately if the API exists.
   * @returns {Promise<boolean>}
   */
  async requestPermission() {
    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof DeviceOrientationEvent.requestPermission === "function"
    ) {
      try {
        const result = await DeviceOrientationEvent.requestPermission();
        return result === "granted";
      } catch (_e) {
        return false;
      }
    }
    return this.isSupported;
  }

  /**
   * Start swipe-only detection (no orientation/motion permission required).
   * Safe to call always so swipe works even in button-navigation mode.
   */
  enableSwipe() {
    if (this._swipeListening) return;
    document.addEventListener("touchstart", this._onTouchStart, { passive: true });
    document.addEventListener("touchend",   this._onTouchEnd,   { passive: true });
    this._swipeListening = true;
  }

  /**
   * Start full gyro: orientation (tilt), motion (shake) and swipe.
   * Calls enableSwipe() internally — safe if already enabled.
   */
  start() {
    if (this.active) return;
    this.enableSwipe();
    window.addEventListener("deviceorientation", this._onOrientation, true);
    window.addEventListener("devicemotion",      this._onMotion,      true);
    this._gammaOffset = this.gamma; // calibrate to current resting position
    this.active = true;
  }

  /**
   * Stop tilt/shake tracking.  Swipe detection remains active.
   * Call start() again to resume tilt/shake.
   */
  stop() {
    if (!this.active) return;
    window.removeEventListener("deviceorientation", this._onOrientation, true);
    window.removeEventListener("devicemotion",      this._onMotion,      true);
    this.active = false;
  }

  /**
   * Remove ALL listeners (orientation, motion, swipe).
   * Call before discarding the instance.
   */
  destroy() {
    this.stop();
    if (this._swipeListening) {
      document.removeEventListener("touchstart", this._onTouchStart);
      document.removeEventListener("touchend",   this._onTouchEnd);
      this._swipeListening = false;
    }
  }

  /**
   * Set current tilt angle as the new "neutral" position.
   * Call when the player has the phone in their preferred resting hold.
   */
  calibrate() {
    this._gammaOffset = this.gamma;
  }

  /**
   * Returns a normalised horizontal tilt value in [-1, 1].
   *   0   = within dead-zone (no movement)
   *  -1   = full left
   *  +1   = full right
   * Multiply by player speed to get velocity.
   */
  getTiltX() {
    if (!this.active) return 0;
    const adjusted = this.gamma - this._gammaOffset;
    const abs = Math.abs(adjusted);
    if (abs <= this.deadZone) return 0;
    const range = this.maxTilt - this.deadZone;
    return Math.sign(adjusted) * Math.min((abs - this.deadZone) / range, 1);
  }

  /** Returns and clears the shake flag (true once per qualifying shake). */
  consumeShake() {
    const v = this.shakeFired;
    this.shakeFired = false;
    return v;
  }

  /** Returns and clears the swipe-up flag (large-form trigger). */
  consumeSwipeUp() {
    const v = this.swipeUpFired;
    this.swipeUpFired = false;
    return v;
  }

  /** Returns and clears the swipe-down flag (small-form trigger). */
  consumeSwipeDown() {
    const v = this.swipeDownFired;
    this.swipeDownFired = false;
    return v;
  }

  // ── Private event handlers ─────────────────────────────────────────

  _onOrientation(event) {
    this.gamma = event.gamma ?? 0;
  }

  _onMotion(event) {
    const accel = event.accelerationIncludingGravity ?? event.acceleration;
    if (!accel) return;
    // On most phones held portrait, a sharp upward thrust gives a positive Y spike.
    const y = accel.y ?? 0;
    const now = Date.now();
    if (y > this._shakeThreshold && now - this._lastShakeAt > this._shakeCooldownMs) {
      this._lastShakeAt = now;
      this.shakeFired = true;
    }
  }

  _onTouchStart(event) {
    if (event.touches.length !== 1) return;
    // Ignore touches that start on the on-screen button clusters so that
    // button taps are never misread as swipes.
    const target = event.target;
    if (target?.closest?.(".touch-controls")) {
      this._swipeStartY = null;
      this._swipeStartX = null;
      return;
    }
    this._swipeStartY = event.touches[0].clientY;
    this._swipeStartX = event.touches[0].clientX;
  }

  _onTouchEnd(event) {
    if (this._swipeStartY === null) return;
    const touch = event.changedTouches[0];
    if (!touch) return;

    const dy = touch.clientY - this._swipeStartY;
    const dx = touch.clientX - this._swipeStartX;

    this._swipeStartY = null;
    this._swipeStartX = null;

    const absDy = Math.abs(dy);
    const absDx = Math.abs(dx);

    // Must travel at least _swipeMinDist vertically
    if (absDy < this._swipeMinDist) return;
    // Must be more vertical than horizontal (reject diagonal drags)
    if (absDx > absDy * 0.6) return;

    if (dy < 0) {
      this.swipeUpFired = true;   // finger moved up → large form
    } else {
      this.swipeDownFired = true; // finger moved down → small form
    }
  }
}

window.GyroInput = GyroInput;
