/**
 * Warm ambient background music generator using Web Audio API
 */
export class AmbientSynth {
  private isPlaying = false;
  private intervalId: any = null;
  private activeNodes: any[] = [];
  private currentChordIndex = 0;

  // A minor progression: Am, F, C, G
  private chords = [
    { name: "Am", notes: [45, 57, 60, 64, 69] }, // A2, A3, C4, E4, A4
    { name: "F", notes: [41, 53, 57, 60, 65] },  // F2, F3, A3, C4, F4
    { name: "C", notes: [36, 48, 52, 55, 60] },  // C2, C3, E3, G3, C4
    { name: "G", notes: [43, 55, 59, 62, 67] }   // G2, G3, B3, D4, G4
  ];

  constructor() {}

  public createSynthNode(audioCtx: AudioContext): { gain: GainNode; start: () => void; stop: () => void } {
    const synthGain = audioCtx.createGain();
    // Start at a modest volume so voice is prominent
    synthGain.gain.setValueAtTime(0.12, audioCtx.currentTime);

    let stepCount = 0;

    const playStep = () => {
      if (!this.isPlaying) return;
      const now = audioCtx.currentTime;

      // Trigger chord progression every 4 beats
      if (stepCount % 4 === 0) {
        const chord = this.chords[this.currentChordIndex];
        this.currentChordIndex = (this.currentChordIndex + 1) % this.chords.length;

        // Play smooth pad notes
        chord.notes.forEach((midi, idx) => {
          try {
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            const filterNode = audioCtx.createBiquadFilter();

            // Root notes are deep sines; upper notes are warm triangles with a low-pass filter
            osc.type = idx === 0 ? "sine" : "triangle";
            const freq = 440 * Math.pow(2, (midi - 69) / 12);
            osc.frequency.setValueAtTime(freq, now);

            // Configure warm synth filter to remove harsh frequencies
            filterNode.type = "lowpass";
            filterNode.frequency.setValueAtTime(idx === 0 ? 300 : 700, now);

            // Ultra-slow cinematic attack (fade in)
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(idx === 0 ? 0.05 : 0.03, now + 1.8);
            
            // Sustain then smooth decay
            gainNode.gain.setValueAtTime(idx === 0 ? 0.05 : 0.03, now + 3.5);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 5.5);

            // Connect routing
            osc.connect(filterNode).connect(gainNode).connect(synthGain);
            
            osc.start(now);
            osc.stop(now + 6.0);

            this.activeNodes.push(osc, gainNode, filterNode);
          } catch (e) {
            console.error("Error scheduling pad note:", e);
          }
        });

        // Add a gentle acoustic arpeggio pluck for extra detail
        setTimeout(() => {
          if (!this.isPlaying) return;
          try {
            const pluckMidi = chord.notes[2] + 12; // An octave higher
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            osc.type = "sine";
            const freq = 440 * Math.pow(2, (pluckMidi - 69) / 12);
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

            gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1.8);

            osc.connect(gainNode).connect(synthGain);
            osc.start();
            osc.stop(audioCtx.currentTime + 2.0);

            this.activeNodes.push(osc, gainNode);
          } catch (e) {}
        }, 600);

        // Add a second arpeggio pluck for rhythm
        setTimeout(() => {
          if (!this.isPlaying) return;
          try {
            const pluckMidi = chord.notes[3] + 12; // High harmony note
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            osc.type = "sine";
            const freq = 440 * Math.pow(2, (pluckMidi - 69) / 12);
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

            gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1.5);

            osc.connect(gainNode).connect(synthGain);
            osc.start();
            osc.stop(audioCtx.currentTime + 1.8);

            this.activeNodes.push(osc, gainNode);
          } catch (e) {}
        }, 1200);
      }

      stepCount++;
    };

    const start = () => {
      if (this.isPlaying) return;
      this.isPlaying = true;
      this.currentChordIndex = 0;
      stepCount = 0;
      
      // Let the audio context resume if suspended (iOS/Chrome security policy)
      if (audioCtx.state === "suspended") {
        audioCtx.resume();
      }

      playStep();
      // Schedule tick every 1.5 seconds (representing a 100 BPM heartbeat vibe)
      this.intervalId = setInterval(playStep, 1500); 
    };

    const stop = () => {
      this.isPlaying = false;
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
      this.activeNodes.forEach((node) => {
        try {
          node.disconnect();
          if (typeof node.stop === "function") {
            node.stop();
          }
        } catch (e) {}
      });
      this.activeNodes = [];
    };

    return { gain: synthGain, start, stop };
  }
}
