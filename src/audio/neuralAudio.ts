/**
 * Procedural Web Audio API sound synthesizer for neural dynamics.
 * Zero external audio files or dependencies.
 */

class NeuralAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private droneOsc: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;
  private lfoOsc: OscillatorNode | null = null;

  constructor() {
    // AudioContext will be initialized on first user gesture
  }

  private initCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.droneGain) {
      this.droneGain.gain.setValueAtTime(0, this.ctx?.currentTime || 0);
    }
  }

  /**
   * Crystalline shockwave chime triggered when clicking the brain
   */
  public playShockwave(strength: number = 1.0) {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    
    // Main chime oscillator
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine';
    const baseFreq = 520 + Math.random() * 240; // E/A/B resonant frequencies
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 2.2, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.9, now + 0.45);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.Q.setValueAtTime(4.0, now);

    const masterGain = Math.min(0.25, 0.15 * strength);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(masterGain, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.7);

    // Harmonic overtone sparkle
    const overtone = ctx.createOscillator();
    const overGain = ctx.createGain();
    overtone.type = 'triangle';
    overtone.frequency.setValueAtTime(baseFreq * 3.0, now);
    overtone.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.3);

    overGain.gain.setValueAtTime(0, now);
    overGain.gain.linearRampToValueAtTime(masterGain * 0.4, now + 0.015);
    overGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

    overtone.connect(overGain);
    overGain.connect(ctx.destination);

    overtone.start(now);
    overtone.stop(now + 0.4);
  }

  /**
   * Sound effect for quantum scatter explosion and snap-back
   */
  public playScatter() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    
    // Low sub whoosh
    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(160, now);
    sub.frequency.exponentialRampToValueAtTime(45, now + 0.5);

    subGain.gain.setValueAtTime(0.2, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    sub.connect(subGain);
    subGain.connect(ctx.destination);
    sub.start(now);
    sub.stop(now + 0.55);

    // Cosmic shimmer
    const shimmer = ctx.createOscillator();
    const sGain = ctx.createGain();
    shimmer.type = 'sawtooth';
    shimmer.frequency.setValueAtTime(880, now);
    shimmer.frequency.linearRampToValueAtTime(2200, now + 0.25);
    shimmer.frequency.exponentialRampToValueAtTime(440, now + 0.6);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, now);
    filter.frequency.linearRampToValueAtTime(4000, now + 0.2);
    filter.frequency.exponentialRampToValueAtTime(600, now + 0.6);

    sGain.gain.setValueAtTime(0.08, now);
    sGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);

    shimmer.connect(filter);
    filter.connect(sGain);
    sGain.connect(ctx.destination);

    shimmer.start(now);
    shimmer.stop(now + 0.7);
  }

  /**
   * Re-assemble snap sound when scattered particles return
   */
  public playReassemble() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(740, now + 0.3);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.5);
  }

  /**
   * Holographic shape morph transposition sound
   */
  public playMorphSound() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Multi-tone ascending crystalline arpeggio
    const freqs = [330, 440, 660, 880, 1320];
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(f, now + idx * 0.06);
      osc.frequency.exponentialRampToValueAtTime(f * 1.5, now + idx * 0.06 + 0.35);

      gain.gain.setValueAtTime(0, now + idx * 0.06);
      gain.gain.linearRampToValueAtTime(0.09, now + idx * 0.06 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.5);
    });
  }

  /**
   * Neural electric pulse ripple
   */
  public playPulse() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(640, now + 0.15);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  /**
   * Star Wars Turbolaser / Blaster Fire Sound Effect
   */
  public playBlasterFire() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(2400, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.22);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1800, now);
    filter.frequency.exponentialRampToValueAtTime(320, now + 0.22);
    filter.Q.setValueAtTime(5.0, now);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  /**
   * Star Wars Hyperspace Jump Sound Effect (Turbine spool-up + warp boom)
   */
  public playHyperspace() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Spool-up turbine whine
    const spool = ctx.createOscillator();
    const spoolGain = ctx.createGain();
    spool.type = 'sine';
    spool.frequency.setValueAtTime(140, now);
    spool.frequency.exponentialRampToValueAtTime(1850, now + 0.55);

    spoolGain.gain.setValueAtTime(0.01, now);
    spoolGain.gain.linearRampToValueAtTime(0.2, now + 0.5);
    spoolGain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    spool.connect(spoolGain);
    spoolGain.connect(ctx.destination);
    spool.start(now);
    spool.stop(now + 0.7);

    // Deep sub-bass warp explosion
    const warp = ctx.createOscillator();
    const warpGain = ctx.createGain();
    warp.type = 'sawtooth';
    warp.frequency.setValueAtTime(380, now + 0.5);
    warp.frequency.exponentialRampToValueAtTime(38, now + 1.2);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now + 0.5);
    filter.frequency.exponentialRampToValueAtTime(90, now + 1.2);

    warpGain.gain.setValueAtTime(0, now);
    warpGain.gain.setValueAtTime(0.3, now + 0.5);
    warpGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.25);

    warp.connect(filter);
    filter.connect(warpGain);
    warpGain.connect(ctx.destination);
    warp.start(now + 0.5);
    warp.stop(now + 1.3);
  }

  /**
   * Star Wars Lightsaber Plasma Ignition Hum
   */
  public playSaberIgnite() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.45);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(750, now);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.55);
  }

  /**
   * Set ambient brainwave binaural frequency
   */
  public updateBrainwaveDrone(frequencyHz: number) {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    if (!this.droneOsc) {
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(108, ctx.currentTime); // Low soothing A2-ish drone

        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(frequencyHz, ctx.currentTime); // brainwave rhythm
        lfoGain.gain.setValueAtTime(0.015, ctx.currentTime);

        gain.gain.setValueAtTime(0.03, ctx.currentTime);

        lfo.connect(lfoGain);
        lfoGain.connect(gain.gain);
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        lfo.start();

        this.droneOsc = osc;
        this.droneGain = gain;
        this.lfoOsc = lfo;
      } catch (e) {
        console.warn('Audio drone init error', e);
      }
    } else if (this.lfoOsc) {
      this.lfoOsc.frequency.setTargetAtTime(frequencyHz, ctx.currentTime, 0.2);
    }
  }

  /**
   * The Force Push - Mystical deep telekinetic rumble and ethereal high harmonic swell
   */
  public playForcePush() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Deep telekinetic sub rumble
    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.type = 'triangle';
    sub.frequency.setValueAtTime(80, now);
    sub.frequency.exponentialRampToValueAtTime(32, now + 0.65);

    subGain.gain.setValueAtTime(0, now);
    subGain.gain.linearRampToValueAtTime(0.28, now + 0.08);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    sub.connect(subGain);
    subGain.connect(ctx.destination);
    sub.start(now);
    sub.stop(now + 0.75);

    // Ethereal choral harmonic shimmer (The Force aura)
    [320, 480, 640].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);
      osc.frequency.linearRampToValueAtTime(freq * 1.25, now + 0.5);

      gain.gain.setValueAtTime(0, now + idx * 0.04);
      gain.gain.linearRampToValueAtTime(0.08, now + idx * 0.04 + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.04);
      osc.stop(now + 0.65);
    });
  }

  /**
   * Death Star Superlaser charge-up crescendo and planet-shattering beam blast
   */
  public playSuperlaser() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;

    // 8 tributary beams charging crescendo (pitch rises dramatically)
    const charge = ctx.createOscillator();
    const chargeGain = ctx.createGain();
    charge.type = 'sawtooth';
    charge.frequency.setValueAtTime(140, now);
    charge.frequency.exponentialRampToValueAtTime(2400, now + 0.5);

    const chargeFilter = ctx.createBiquadFilter();
    chargeFilter.type = 'bandpass';
    chargeFilter.frequency.setValueAtTime(300, now);
    chargeFilter.frequency.exponentialRampToValueAtTime(3000, now + 0.5);
    chargeFilter.Q.setValueAtTime(6.0, now);

    chargeGain.gain.setValueAtTime(0.05, now);
    chargeGain.gain.linearRampToValueAtTime(0.25, now + 0.48);
    chargeGain.gain.setValueAtTime(0, now + 0.52);

    charge.connect(chargeFilter);
    chargeFilter.connect(chargeGain);
    chargeGain.connect(ctx.destination);
    charge.start(now);
    charge.stop(now + 0.53);

    // Superlaser main beam detonation boom
    const boom = ctx.createOscillator();
    const boomGain = ctx.createGain();
    boom.type = 'square';
    boom.frequency.setValueAtTime(420, now + 0.5);
    boom.frequency.exponentialRampToValueAtTime(45, now + 1.2);

    const boomFilter = ctx.createBiquadFilter();
    boomFilter.type = 'lowpass';
    boomFilter.frequency.setValueAtTime(1600, now + 0.5);
    boomFilter.frequency.exponentialRampToValueAtTime(100, now + 1.2);

    boomGain.gain.setValueAtTime(0, now);
    boomGain.gain.setValueAtTime(0.35, now + 0.5);
    boomGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.3);

    boom.connect(boomFilter);
    boomFilter.connect(boomGain);
    boomGain.connect(ctx.destination);
    boom.start(now + 0.5);
    boom.stop(now + 1.35);
  }

  /**
   * Violent lightsaber plasma clash with crackling electrical sparks
   */
  public playSaberClash() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Metallic plasma impact snap
    const snap = ctx.createOscillator();
    const snapGain = ctx.createGain();
    snap.type = 'sawtooth';
    snap.frequency.setValueAtTime(1200, now);
    snap.frequency.exponentialRampToValueAtTime(180, now + 0.12);

    snapGain.gain.setValueAtTime(0.3, now);
    snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    snap.connect(snapGain);
    snapGain.connect(ctx.destination);
    snap.start(now);
    snap.stop(now + 0.22);

    // Crackling electrical sizzle
    const sizzle = ctx.createOscillator();
    const sGain = ctx.createGain();
    sizzle.type = 'triangle';
    sizzle.frequency.setValueAtTime(580, now);
    sizzle.frequency.linearRampToValueAtTime(1400, now + 0.18);
    sizzle.frequency.exponentialRampToValueAtTime(220, now + 0.4);

    sGain.gain.setValueAtTime(0.18, now);
    sGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

    sizzle.connect(sGain);
    sGain.connect(ctx.destination);
    sizzle.start(now);
    sizzle.stop(now + 0.5);
  }

  /**
   * Imperial TIE Fighter howling twin ion engine flyby scream
   */
  public playTIEFlyby() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    // Doppler roar: high pitch approaching, falling pitch departing
    osc.frequency.setValueAtTime(780, now);
    osc.frequency.exponentialRampToValueAtTime(1350, now + 0.25);
    osc.frequency.exponentialRampToValueAtTime(260, now + 0.75);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(950, now);
    filter.frequency.exponentialRampToValueAtTime(1600, now + 0.25);
    filter.frequency.exponentialRampToValueAtTime(340, now + 0.75);
    filter.Q.setValueAtTime(3.5, now);

    gain.gain.setValueAtTime(0.02, now);
    gain.gain.linearRampToValueAtTime(0.24, now + 0.25);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.85);
  }

  /**
   * Starship hull/shield impact with electric spark sizzle
   */
  public playShipHit() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(840, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.14);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1800, now);
    filter.frequency.exponentialRampToValueAtTime(320, now + 0.14);
    filter.Q.setValueAtTime(3.0, now);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  /**
   * Massive starship explosion: deep sub bass detonation boom, roaring fireball, and debris crackle
   */
  public playShipExplosion() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;

    // 1. Deep sub rumble bass drop
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(140, now);
    subOsc.frequency.exponentialRampToValueAtTime(28, now + 0.85);

    subGain.gain.setValueAtTime(0.4, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

    subOsc.connect(subGain);
    subGain.connect(ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 0.95);

    // 2. Roaring noise detonation blast
    const bufferSize = Math.floor(ctx.sampleRate * 0.7);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(950, now);
    filter.frequency.exponentialRampToValueAtTime(60, now + 0.7);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.35, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    whiteNoise.start(now);
    whiteNoise.stop(now + 0.75);
  }

  /**
   * Rewarding arcade point score chime (+1 point ding!)
   */
  public playPointScore(combo: number = 1) {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const baseFreq = 880 * Math.pow(1.05946, Math.min(12, combo)); // Chromatic pitch step with combo streak

    // Dual harmonized bell chimes (octave + fifth)
    [1, 1.5, 2.0].forEach((harmonic, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      const freq = baseFreq * harmonic;
      osc.frequency.setValueAtTime(freq, now + idx * 0.025);

      const amp = 0.18 / (idx + 1);
      gain.gain.setValueAtTime(0, now + idx * 0.025);
      gain.gain.linearRampToValueAtTime(amp, now + idx * 0.025 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.025);
      osc.stop(now + 0.5);
    });
  }

  /**
   * Imperial starfighter incoming blaster fire screech (enemy shooting at user)
   */
  public playEnemyBlasterFire() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1420, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.16);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2600, now);
    filter.frequency.exponentialRampToValueAtTime(450, now + 0.16);
    filter.Q.setValueAtTime(4.0, now);

    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  /**
   * Starfighter deflector shield deflection ripple (when enemy blaster hits player shield)
   */
  public playShieldDeflect() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Resonant shield barrier harmonic ping + electric sizzle
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.linearRampToValueAtTime(880, now + 0.06);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.35);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2400, now);
    filter.frequency.exponentialRampToValueAtTime(600, now + 0.3);

    gain.gain.setValueAtTime(0.32, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.36);
  }

  /**
   * Starfighter cockpit warning klaxon / lock-on alert
   */
  public playAlarmWarning() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    [0, 0.14].forEach((delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(740, now + delay);
      osc.frequency.linearRampToValueAtTime(980, now + delay + 0.08);

      gain.gain.setValueAtTime(0.18, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.11);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + 0.12);
    });
  }

  /**
   * Epic Proton Torpedo / Hyper Counter-Strike salvo
   */
  public playSuperCounterStrike() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Heavy launch whoosh + explosive charge release
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sawtooth';
    subOsc.frequency.setValueAtTime(220, now);
    subOsc.frequency.exponentialRampToValueAtTime(40, now + 0.6);

    subGain.gain.setValueAtTime(0.4, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    subOsc.connect(subGain);
    subGain.connect(ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 0.75);

    // Multi-staggered laser chirps
    [0.08, 0.18, 0.28, 0.38].forEach((offset, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1600 - idx * 150, now + offset);
      osc.frequency.exponentialRampToValueAtTime(240, now + offset + 0.18);

      gain.gain.setValueAtTime(0.25, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.19);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.2);
    });
  }

  /**
   * Sector Victory Celebration Rebel Fanfare
   */
  public playVictoryFanfare() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Ascending triumphant Star Wars motif: C4 - G4 - C5 - E5 - G5
    const notes = [261.63, 392.0, 523.25, 659.25, 783.99];
    notes.forEach((freq, idx) => {
      const time = now + idx * 0.12;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      const dur = idx === notes.length - 1 ? 0.8 : 0.22;
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.22, time + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + dur + 0.05);
    });
  }

  /**
   * Lock-on countdown warning beep (escalates in pitch and urgency as lock nears completion)
   */
  public playLockOnBeep(secondsRemaining: number = 3) {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Pitch increases as lock-on gets closer to 0
    const freq = secondsRemaining <= 1 ? 1320 : secondsRemaining <= 2 ? 1080 : 880;
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.linearRampToValueAtTime(freq * 1.25, now + 0.08);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  /**
   * Imperial heavy plasma core-strike firing sound
   */
  public playCoreStrikeFired() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Heavy charged plasma screech + menacing sub-bass discharge
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.32);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3200, now);
    filter.frequency.exponentialRampToValueAtTime(300, now + 0.3);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  }

  /**
   * Catastrophic Core Reactor impact shudder & electrical spark discharge
   */
  public playCoreDamage(isHeavy: boolean = false) {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Sub-bass hull shudder
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(isHeavy ? 120 : 160, now);
    subOsc.frequency.exponentialRampToValueAtTime(30, now + (isHeavy ? 0.65 : 0.45));

    subGain.gain.setValueAtTime(isHeavy ? 0.5 : 0.35, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + (isHeavy ? 0.7 : 0.5));

    subOsc.connect(subGain);
    subGain.connect(ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + (isHeavy ? 0.75 : 0.55));

    // Crackling electrical spark discharge noise
    const bufferSize = ctx.sampleRate * (isHeavy ? 0.35 : 0.22);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
    }
    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(isHeavy ? 1800 : 2600, now);
    filter.Q.setValueAtTime(5, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(isHeavy ? 0.35 : 0.25, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + (isHeavy ? 0.35 : 0.22));

    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    whiteNoise.start(now);
    whiteNoise.stop(now + (isHeavy ? 0.38 : 0.25));
  }

  /**
   * Catastrophic Core Reactor Breach & Starfighter Explosion sequence
   */
  public playReactorBreach() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;

    // 1. Rising siren / reactor whine prior to detonation
    const whineOsc = ctx.createOscillator();
    const whineGain = ctx.createGain();
    whineOsc.type = 'sawtooth';
    whineOsc.frequency.setValueAtTime(300, now);
    whineOsc.frequency.exponentialRampToValueAtTime(1600, now + 0.4);

    whineGain.gain.setValueAtTime(0.3, now);
    whineGain.gain.linearRampToValueAtTime(0.45, now + 0.38);
    whineGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    whineOsc.connect(whineGain);
    whineGain.connect(ctx.destination);
    whineOsc.start(now);
    whineOsc.stop(now + 0.46);

    // 2. Massive sub-atomic core detonation at +0.4s
    const boomTime = now + 0.4;
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(140, boomTime);
    subOsc.frequency.exponentialRampToValueAtTime(22, boomTime + 1.8);

    subGain.gain.setValueAtTime(0.65, boomTime);
    subGain.gain.exponentialRampToValueAtTime(0.0001, boomTime + 2.0);

    subOsc.connect(subGain);
    subGain.connect(ctx.destination);
    subOsc.start(boomTime);
    subOsc.stop(boomTime + 2.1);

    // 3. Extended roaring explosion debris noise
    const bufferSize = ctx.sampleRate * 1.5;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.5);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, boomTime);
    filter.frequency.exponentialRampToValueAtTime(120, boomTime + 1.5);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.5, boomTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, boomTime + 1.6);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(boomTime);
    noise.stop(boomTime + 1.7);
  }

  /**
   * Energetic Core Reactor Cell pickup recharge chime
   */
  public playPickupCollect() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Rapid ascending synth arpeggio: 523.25 (C5) -> 659.25 (E5) -> 783.99 (G5) -> 1046.50 (C6)
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const time = now + idx * 0.055;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.2, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + 0.32);
    });
  }

  /**
   * Procedural Astromech Droid chatter, chirps, whistles, and warning trills
   */
  public playDroidChirp(mood: 'chatter' | 'warning' | 'happy' | 'tip' = 'chatter') {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;

    if (mood === 'warning') {
      // Rapid urgent astromech warning whistle (R2-D2 danger scream/trill)
      const freqs = [1400, 950, 1600, 1100, 1750];
      freqs.forEach((freq, idx) => {
        const time = now + idx * 0.045;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, time);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.2, time + 0.04);

        gain.gain.setValueAtTime(0.18, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + 0.055);
      });
    } else if (mood === 'happy') {
      // Playful ascending astromech whistle
      const freqs = [920, 1180, 1540, 2020];
      freqs.forEach((freq, idx) => {
        const time = now + idx * 0.06;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        osc.frequency.linearRampToValueAtTime(freq * 1.15, time + 0.055);

        gain.gain.setValueAtTime(0.16, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.07);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + 0.08);
      });
    } else if (mood === 'tip') {
      // Friendly informational dual-chirp
      const freqs = [840, 1320];
      freqs.forEach((freq, idx) => {
        const time = now + idx * 0.08;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, time);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.1, time + 0.06);

        gain.gain.setValueAtTime(0.14, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.07);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + 0.08);
      });
    } else {
      // General inquisitive robotic chatter
      const freqs = [1100, 1450, 1050];
      freqs.forEach((freq, idx) => {
        const time = now + idx * 0.05;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.9, time + 0.045);

        gain.gain.setValueAtTime(0.15, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.055);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + 0.06);
      });
    }
  }

  /**
   * Crackling fiery thermal blaster bolt discharge
   */
  public playFireBlaster() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(480, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.18);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    // Fire crackle noise
    const bufferSize = ctx.sampleRate * 0.18;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.5));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.Q.setValueAtTime(3, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.28, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.19);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  /**
   * Violent thermal fire impact & sizzling cockpit burn
   */
  public playThermalBurnImpact() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.type = 'triangle';
    sub.frequency.setValueAtTime(180, now);
    sub.frequency.exponentialRampToValueAtTime(45, now + 0.4);

    subGain.gain.setValueAtTime(0.45, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    sub.connect(subGain);
    subGain.connect(ctx.destination);
    sub.start(now);
    sub.stop(now + 0.48);

    // Incendiary flame sizzle noise
    const bufferSize = ctx.sampleRate * 0.4;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.8;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2200, now);
    filter.frequency.linearRampToValueAtTime(600, now + 0.35);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.35, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.42);
  }

  /**
   * Electromagnetic Ion EMP Wave shock & systems freeze sound
   */
  public playEmpDisruptor() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.6);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.7);
  }

  /**
   * Plasma Mirror Deflector reflecting projectiles back at enemy
   */
  public playPlasmaReflector() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.linearRampToValueAtTime(1760, now + 0.2);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.38);
  }

  /**
   * Power unlocked notification fanfare
   */
  public playPowerUnlocked() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const chords = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    chords.forEach((freq, idx) => {
      const time = now + idx * 0.08;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.25, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + 0.35);
    });
  }

  /**
   * Enemy homing missile ignition & launch whoosh
   */
  public playEnemyMissileLaunch() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Low rocket ignition growl + ascending whoosh
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.45);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, now);
    filter.frequency.linearRampToValueAtTime(1400, now + 0.4);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.35, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.58);
  }

  /**
   * Pulse alarm tone when an enemy missile is homing in on the player
   */
  public playEnemyMissileWarning() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(980, now);
    osc.frequency.setValueAtTime(720, now + 0.08);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  /**
   * Crisp explosion when player intercepts and detonates an incoming missile mid-air
   */
  public playMissileInterception() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    // High-energy blast
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(650, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.35);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.42);
  }

  public dispose() {
    if (this.droneOsc) {
      try {
        this.droneOsc.stop();
        this.lfoOsc?.stop();
      } catch {}
      this.droneOsc = null;
      this.lfoOsc = null;
    }
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}

export const neuralAudio = new NeuralAudioEngine();
