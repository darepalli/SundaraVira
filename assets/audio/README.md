# Audio Assets for Sundara Vira

This folder contains audio files for game sound effects featuring "Jai Shri Ram" and "Jai Siyaram" chants.

## Audio Files Needed

The game expects the following audio files (MP3 format recommended for browser compatibility):

### 1. **jump-jai-shri-ram.mp3**
- **Trigger**: Played when the player jumps
- **Duration**: ~0.5-1 second
- **Content**: Quick "Jai Shri Ram" chant or related mantra
- **Tone**: Energetic, uplifting

### 2. **collect-jai-shri-ram.mp3**
- **Trigger**: Played when collecting fragments or items
- **Duration**: ~0.5-1 second
- **Content**: "Jai Shri Ram" chant
- **Tone**: Positive, rewarding

### 3. **blast-jai-siyaram.mp3**
- **Trigger**: Played when using Bhakti Blast (destroying demons)
- **Duration**: ~1-2 seconds
- **Content**: "Jai Siyaram" chant or powerful mantra recitation
- **Tone**: Powerful, triumphant

### 4. **stage-transition-jai-shri-ram.mp3**
- **Trigger**: Played when transitioning to the next stage
- **Duration**: ~1-2 seconds
- **Content**: "Jai Shri Ram" chant
- **Tone**: Celebratory, progressing

### 5. **victory-jai-shri-ram.mp3**
- **Trigger**: Played when completing the game
- **Duration**: ~2-3 seconds
- **Content**: "Jai Shri Ram" chant or extended mantra
- **Tone**: Triumphant, victorious

## How to Add Audio Files

1. **Obtain Audio Files**:
   - Record or source "Jai Shri Ram" and "Jai Siyaram" chants
   - Keep files at 128-192 kbps MP3 for web optimization
   - Test in browser for cross-platform compatibility

2. **Place Files**:
   - Save all audio files (MP3 format) in this `assets/audio/` directory
   - Use the exact filenames listed above

3. **Verification**:
   - Open the game in browser console (F12 → Console)
   - Check for log messages:
     - `[AudioManager] Preloaded X/5 audio files. Using real audio.` — files loaded successfully
     - `[AudioManager] No audio files found. Falling back to tone synthesis.` — files missing; using synth

4. **Fallback Behavior**:
   - If audio files are not found, the game automatically uses tone synthesis
   - No errors; game works smoothly either way

## Audio Recording Tips

- **Recording Quality**: Use a quiet environment; capture clear chant recordings
- **Length**: Keep each sound bite concise (0.5-3 seconds)
- **Volume Normalization**: Normalize to -3dB to avoid clipping
- **Format**: Export as MP3 at 128-192 kbps
- **Licensing**: Ensure you have rights to use the chants/recordings

## Supported Formats

- **Primary**: MP3 (best cross-browser support)
- **Alternative**: WAV, OGG (check browser support)

## Testing

1. Add audio files to this directory
2. Open the game in a browser
3. Check console logs for audio loading status
4. Play the game and verify sounds play during:
   - Jumping
   - Collecting fragments
   - Using Bhakti Blast
   - Stage transitions
   - Victory screen

## Troubleshooting

- **Audio not playing**: Check file paths and ensure files are named exactly as specified
- **Sounds cut off**: Audio files may be too compressed or in unsupported format
- **Silence**: Verify audio file volume levels; they may be recorded too quietly
- **Browser cache**: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R) to reload audio assets

---

For more information on chants, visit [Bhakti references] or consult cultural/spiritual resources.
