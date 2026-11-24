import { AmbienceId } from '../types/cafe';

class CafeAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeNodes: AudioNode[] = [];
  private activeTimers: number[] = [];
  private currentAmbience: AmbienceId = 'silent';
  private volume = 0.45;
  private isPlaying = false;

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    if (!this.masterGain) {
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  public setVolume(nextVolume: number): void {
    this.volume = Math.max(0, Math.min(1, nextVolume));
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.08);
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public start(ambience: AmbienceId, nextVolume?: number): void {
    if (typeof nextVolume === 'number') {
      this.volume = Math.max(0, Math.min(1, nextVolume));
    }

    if (ambience === 'silent') {
      this.stop();
      this.currentAmbience = 'silent';
      return;
    }

    if (this.isPlaying && this.currentAmbience === ambience) {
      this.setVolume(this.volume);
      return;
    }

    this.stop();
    const ctx = this.ensureContext();
    if (!this.masterGain) return;

    this.currentAmbience = ambience;
    this.isPlaying = true;
    this.masterGain.gain.setValueAtTime(0.001, ctx.currentTime);
    this.masterGain.gain.exponentialRampToValueAtTime(
      Math.max(0.01, this.volume),
      ctx.currentTime + 0.6
    );

    if (ambience === 'rain') {
      this.buildRainSoundscape(ctx, this.masterGain);
    } else if (ambience === 'espresso') {
      this.buildEspressoBarSoundscape(ctx, this.masterGain);
    } else if (ambience === 'fireplace') {
      this.buildFireplaceSoundscape(ctx, this.masterGain);
    } else if (ambience === 'jazz') {
      this.buildJazzSoundscape(ctx, this.masterGain);
    }
  }

  public stop(): void {
    this.activeTimers.forEach((id) => window.clearInterval(id));
    this.activeTimers = [];

    this.activeNodes.forEach((node) => {
      try {
        if ('stop' in node && typeof (node as AudioScheduledSourceNode).stop === 'function') {
          (node as AudioScheduledSourceNode).stop();
        }
        node.disconnect();
      } catch {
        // Ignore already stopped nodes
      }
    });
    this.activeNodes = [];
    this.isPlaying = false;
  }

  public playCompletionChime(): void {
    try {
      const ctx = this.ensureContext();
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // Warm Cmaj7 chime arpeggio

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.14);

        gain.gain.setValueAtTime(0.0001, now + idx * 0.14);
        gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.14 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.14 + 1.6);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.14);
        osc.stop(now + idx * 0.14 + 1.7);
      });
    } catch {
      // Ignore audio errors if blocked by browser policy
    }
  }

  private createNoiseBuffer(ctx: AudioContext, type: 'pink' | 'brown', seconds = 4): AudioBuffer {
    const bufferSize = ctx.sampleRate * seconds;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);

    if (type === 'pink') {
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.05;
        b6 = white * 0.115926;
      }
    } else {
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 1.8;
      }
    }
    return buffer;
  }

  private buildRainSoundscape(ctx: AudioContext, destination: AudioNode): void {
    const pinkSource = ctx.createBufferSource();
    pinkSource.buffer = this.createNoiseBuffer(ctx, 'pink', 5);
    pinkSource.loop = true;

    const rainFilter = ctx.createBiquadFilter();
    rainFilter.type = 'bandpass';
    rainFilter.frequency.value = 1100;
    rainFilter.Q.value = 0.45;

    const rainGain = ctx.createGain();
    rainGain.gain.value = 0.45;

    // Gentle breeze modulation
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.12;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 260;
    lfo.connect(lfoGain);
    lfoGain.connect(rainFilter.frequency);

    // Warm indoor room bed
    const brownSource = ctx.createBufferSource();
    brownSource.buffer = this.createNoiseBuffer(ctx, 'brown', 5);
    brownSource.loop = true;
    const warmFilter = ctx.createBiquadFilter();
    warmFilter.type = 'lowpass';
    warmFilter.frequency.value = 280;
    const warmGain = ctx.createGain();
    warmGain.gain.value = 0.35;

    pinkSource.connect(rainFilter);
    rainFilter.connect(rainGain);
    rainGain.connect(destination);

    brownSource.connect(warmFilter);
    warmFilter.connect(warmGain);
    warmGain.connect(destination);

    pinkSource.start();
    brownSource.start();
    lfo.start();

    this.activeNodes.push(pinkSource, rainFilter, rainGain, lfo, lfoGain, brownSource, warmFilter, warmGain);
  }

  private buildEspressoBarSoundscape(ctx: AudioContext, destination: AudioNode): void {
    const murmurSource = ctx.createBufferSource();
    murmurSource.buffer = this.createNoiseBuffer(ctx, 'pink', 5);
    murmurSource.loop = true;

    const murmurFilter = ctx.createBiquadFilter();
    murmurFilter.type = 'bandpass';
    murmurFilter.frequency.value = 420;
    murmurFilter.Q.value = 0.9;

    const murmurGain = ctx.createGain();
    murmurGain.gain.value = 0.52;

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.25;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.12;
    lfo.connect(lfoGain);
    lfoGain.connect(murmurGain.gain);

    murmurSource.connect(murmurFilter);
    murmurFilter.connect(murmurGain);
    murmurGain.connect(destination);

    murmurSource.start();
    lfo.start();
    this.activeNodes.push(murmurSource, murmurFilter, murmurGain, lfo, lfoGain);

    // Occasional delicate ceramic cup clink or steam puff
    const timer = window.setInterval(() => {
      if (!this.isPlaying || !this.ctx || !this.masterGain) return;
      const now = this.ctx.currentTime;
      if (Math.random() > 0.45) {
        const clinkOsc = this.ctx.createOscillator();
        const clinkGain = this.ctx.createGain();
        clinkOsc.type = 'sine';
        clinkOsc.frequency.setValueAtTime(2200 + Math.random() * 900, now);
        clinkGain.gain.setValueAtTime(0.0001, now);
        clinkGain.gain.linearRampToValueAtTime(0.025, now + 0.008);
        clinkGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
        clinkOsc.connect(clinkGain);
        clinkGain.connect(this.masterGain);
        clinkOsc.start(now);
        clinkOsc.stop(now + 0.2);
      }
    }, 3200);
    this.activeTimers.push(timer);
  }

  private buildFireplaceSoundscape(ctx: AudioContext, destination: AudioNode): void {
    const brownSource = ctx.createBufferSource();
    brownSource.buffer = this.createNoiseBuffer(ctx, 'brown', 5);
    brownSource.loop = true;

    const lowFilter = ctx.createBiquadFilter();
    lowFilter.type = 'lowpass';
    lowFilter.frequency.value = 340;

    const rumbleGain = ctx.createGain();
    rumbleGain.gain.value = 0.55;

    brownSource.connect(lowFilter);
    lowFilter.connect(rumbleGain);
    rumbleGain.connect(destination);
    brownSource.start();

    this.activeNodes.push(brownSource, lowFilter, rumbleGain);

    // Gentle hearth crackle bursts
    const timer = window.setInterval(() => {
      if (!this.isPlaying || !this.ctx || !this.masterGain) return;
      const bursts = 1 + Math.floor(Math.random() * 2);
      for (let i = 0; i < bursts; i++) {
        const delay = Math.random() * 0.9;
        const now = this.ctx.currentTime + delay;
        const buffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.03), this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let j = 0; j < data.length; j++) {
          data[j] = (Math.random() * 2 - 1) * Math.exp(-j / (data.length * 0.25));
        }
        const crackle = this.ctx.createBufferSource();
        crackle.buffer = buffer;
        const hp = this.ctx.createBiquadFilter();
        hp.type = 'bandpass';
        hp.frequency.value = 1800 + Math.random() * 2200;
        const cGain = this.ctx.createGain();
        cGain.gain.value = 0.08 + Math.random() * 0.08;
        crackle.connect(hp);
        hp.connect(cGain);
        cGain.connect(this.masterGain);
        crackle.start(now);
      }
    }, 1100);
    this.activeTimers.push(timer);
  }

  private buildJazzSoundscape(ctx: AudioContext, destination: AudioNode): void {
    // Subtle vinyl warmth
    const vinylSource = ctx.createBufferSource();
    vinylSource.buffer = this.createNoiseBuffer(ctx, 'brown', 4);
    vinylSource.loop = true;
    const vinylFilter = ctx.createBiquadFilter();
    vinylFilter.type = 'lowpass';
    vinylFilter.frequency.value = 320;
    const vinylGain = ctx.createGain();
    vinylGain.gain.value = 0.18;

    vinylSource.connect(vinylFilter);
    vinylFilter.connect(vinylGain);
    vinylGain.connect(destination);
    vinylSource.start();
    this.activeNodes.push(vinylSource, vinylFilter, vinylGain);

    const chords = [
      [261.63, 329.63, 392.0, 493.88], // Cmaj7
      [220.0, 261.63, 329.63, 392.0], // Am7
      [174.61, 220.0, 261.63, 329.63], // Fmaj7
      [196.0, 246.94, 293.66, 349.23], // G7
    ];

    let step = 0;
    const playChord = () => {
      if (!this.isPlaying || !this.ctx || !this.masterGain) return;
      const now = this.ctx.currentTime;
      const chord = chords[step % chords.length];
      step++;

      chord.forEach((freq, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = idx === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        filter.type = 'lowpass';
        filter.frequency.value = 780;

        gain.gain.setValueAtTime(0.0001, now + idx * 0.06);
        gain.gain.linearRampToValueAtTime(0.065, now + idx * 0.06 + 0.18);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 3.1);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 3.2);
      });
    };

    playChord();
    const timer = window.setInterval(playChord, 3400);
    this.activeTimers.push(timer);
  }
}

export const cafeAudioEngine = new CafeAudioEngine();
