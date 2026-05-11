# Audio System Implementation

## Overview

The audio system has been upgraded to support real audio asset files featuring "Jai Shri Ram" and "Jai Siyaram" chants instead of pure tone synthesis.

## Architecture

### Two-Tier Audio Playback

1. **Primary**: Real Audio Files (MP3/WAV)
   - If audio files are present in `assets/audio/`, they are preloaded and used
   - Expected format: MP3 files with "Jai Shri Ram"/"Jai Siyaram" chants

2. **Fallback**: Tone Synthesis
   - If no audio files are found, the system automatically falls back to WebAudio API tone synthesis
   - Ensures the game always produces sound (synth tones as backup)
   - No errors or disruptions; seamless switching

## Audio Files Structure

Location: `assets/audio/`

### Required Files

| File | Trigger | Type |
|------|---------|------|
| `jump-jai-shri-ram.mp3` | Player jump | Quick chant |
| `collect-jai-shri-ram.mp3` | Fragment collection | Positive mantra |
| `blast-jai-siyaram.mp3` | Bhakti Blast attack | Powerful chant |
| `stage-transition-jai-shri-ram.mp3` | Stage transition | Celebratory |
| `victory-jai-shri-ram.mp3` | Game victory | Triumphant |

See `assets/audio/README.md` for detailed guidance on recording/adding files.

## Code Changes

### AudioManager (`src/systems/AudioManager.js`)

**New Methods:**
- `loadAudioFile(name, filePath)` — Fetches and decodes audio file
- `preloadAudioAssets()` — Preloads all 5 audio files at startup
- `playAudioFile(name, synth)` — Plays audio file or falls back to synth callback

**Modified Methods:**
- `playJump()`, `playCollect()`, `playBlast()`, `playStageTransition()`, `playVictory()`
  - Now call `playAudioFile()` with synth fallback lambda

### BootScene (`src/scenes/BootScene.js`)

- Added async `preloadAudioAssets()` call after AudioManager initialization
- Happens in background; game starts immediately with synth fallback

## Console Logging

When the game starts, check the browser console (F12 → Console) for:

**Success:**
```
[AudioManager] Preloaded 5/5 audio files. Using real audio.
```

**Fallback:**
```
[AudioManager] No audio files found. Falling back to tone synthesis.
```

**Partial Success:**
```
[AudioManager] Preloaded 3/5 audio files. Using real audio.
```

## Usage

### For Players

1. Add audio files to `assets/audio/` as MP3 files
2. Refresh the browser (hard refresh: Ctrl+Shift+R)
3. Audio files will be preloaded and used automatically
4. If files missing, game uses synth sounds (no error)

### For Developers

**Check Audio Status:**
```javascript
console.log(window.audioManager.useAudioFiles); // true if audio files loaded
console.log(window.audioManager.audioBuffers); // inspect loaded buffers
```

**Adjust Volume:**
```javascript
window.audioManager.setVolume(0.2); // 0 (silent) to 1 (full)
```

## Performance Impact

- **Preload Time**: Audio files downloaded and decoded in background (~1-2 seconds)
- **Game Start**: Not blocked; MenuScene loads immediately
- **Audio Playback**: <10ms latency for synth; <50ms for audio files (first-time decode)
- **Memory**: ~2-5 MB for 5 audio files (depending on quality/length)

## Troubleshooting

### Audio Files Not Loading

1. **Check File Names**: Must match exactly (case-sensitive on Linux/Mac)
   - `jump-jai-shri-ram.mp3` (not `Jump-Jai-Shri-Ram.mp3`)

2. **Check File Location**: Must be in `assets/audio/` relative to `index.html`

3. **Check Browser Console**: Look for `[AudioManager]` warnings

4. **Network Issues**: Audio fetch may fail if CORS headers block it
   - Test with `py -m http.server` from project root

5. **Audio Format**: Ensure files are valid MP3; try re-encoding if necessary

### Synth Fallback Not Working

- Ensure browser supports WebAudio API (all modern browsers)
- Check browser console for `AudioContext` errors
- Try in a different browser

### Volume Too Low/High

- Adjust with: `window.audioManager.setVolume(0.3)`
- Default: 0.12 (12% of max to avoid clipping)

## Future Enhancements

- Add background music (separate from UI sounds)
- Support for multiple audio formats (WAV, OGG for wider compatibility)
- Audio sprite sheets for multiple chants in one file
- In-game audio settings menu
- Localization: different languages/chants

## References

- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [AudioContext.decodeAudioData](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/decodeAudioData)
- [Audio Formats and Codecs](https://developer.mozilla.org/en-US/docs/Web/Media/Formats)
