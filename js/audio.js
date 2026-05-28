/**
 * Game audio - SFX, per-level BGM, win/lose stings
 */
class GameAudio {
  constructor() {
    this.ctx = null;
    this.sfxGain = null;
    this.bgmGain = null;
    this.unlocked = false;
    this.enabled = true;
    this.bgmPlaying = false;
    this.bgmTimer = null;
    this.bgmStep = 0;
    this.currentLevel = 0;
    this.resumeBgmAfterFocus = false;
    this.levelThemes = this._buildThemes();
    this._bindFocusHandlers();
  }

  setEnabled(on) {
    this.enabled = on;
    if (!on) {
      this.resumeBgmAfterFocus = false;
      this.stopBGM();
    }
  }

  _bindFocusHandlers() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    window.addEventListener('blur', () => this._handleWindowFocus(false));
    window.addEventListener('focus', () => this._handleWindowFocus(true));
    document.addEventListener('visibilitychange', () => {
      this._handleWindowFocus(!document.hidden);
    });
  }

  async _handleWindowFocus(focused) {
    if (!focused) {
      if (this.bgmPlaying) {
        this.resumeBgmAfterFocus = true;
        this.stopBGM(false);
      }
      if (this.ctx && this.ctx.state === 'running') {
        try { await this.ctx.suspend(); } catch (e) { /* ignore */ }
      }
      return;
    }

    if (!this.enabled) {
      this.resumeBgmAfterFocus = false;
      return;
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      try { await this.ctx.resume(); } catch (e) { /* ignore */ }
    }
    if (this.resumeBgmAfterFocus) {
      this.resumeBgmAfterFocus = false;
      this.startLevelBGM(this.currentLevel);
    }
  }

  _buildThemes() {
    const themes = [];
    for (let i = 0; i < 20; i++) {
      const base = 220 + (i % 5) * 40;
      themes.push([
        base, base * 1.25, base * 1.5, base * 1.25,
        base * 1.12, base * 1.25, base,
        base * 1.25, base * 1.5, base * 2, base * 1.5, base * 1.25,
      ]);
    }
    return themes;
  }

  async unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.sfxGain = this.ctx.createGain();
      this.bgmGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.45;
      this.bgmGain.gain.value = 0.2;
      this.sfxGain.connect(this.ctx.destination);
      this.bgmGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    this.unlocked = true;
  }

  tone(freq, duration, options = {}) {
    if (!this.unlocked || !this.ctx || !this.enabled) return;
    const { type = 'square', volume = 0.3, dest = this.sfxGain, freqEnd = null, delay = 0 } = options;
    const t = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (freqEnd) osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), t + duration);
    g.gain.setValueAtTime(volume, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(g);
    g.connect(dest);
    osc.start(t);
    osc.stop(t + duration + 0.05);
  }

  playJump() { this.tone(280, 0.1, { volume: 0.22, freqEnd: 520 }); }
  playBounce() {
    this.tone(160, 0.14, { type: 'sine', volume: 0.38, freqEnd: 480 });
    this.tone(480, 0.1, { volume: 0.18, delay: 0.06, freqEnd: 640 });
  }
  playCoin() {
    this.tone(988, 0.07, { type: 'square', volume: 0.18, freqEnd: 1318 });
    this.tone(1568, 0.09, { type: 'triangle', volume: 0.16, delay: 0.04, freqEnd: 1760 });
  }
  playCollectible(kind) {
    if (kind === 'lumalee') {
      this.tone(740, 0.11, { type: 'triangle', volume: 0.17, freqEnd: 880 });
      this.tone(988, 0.1, { type: 'sine', volume: 0.14, delay: 0.05, freqEnd: 1175 });
    } else if (kind === 'question') {
      this.tone(392, 0.08, { type: 'square', volume: 0.16, freqEnd: 494 });
      this.tone(622, 0.09, { type: 'triangle', volume: 0.15, delay: 0.05, freqEnd: 740 });
    }
  }
  playPowerup(type) {
    switch (type) {
      case 0: // 超级皇冠 - 短暂无敌
        [784, 988, 1175].forEach((f, i) => this.tone(f, 0.09, { type: 'triangle', volume: 0.16, delay: i * 0.04 }));
        break;
      case 1: // 耀西蛋 - 额外生命
        this.tone(523, 0.1, { type: 'sine', volume: 0.15, freqEnd: 659 });
        this.tone(784, 0.13, { type: 'triangle', volume: 0.16, delay: 0.06, freqEnd: 988 });
        break;
      case 2: // 心之花 - 恢复生命
        this.tone(466, 0.11, { type: 'sine', volume: 0.15, freqEnd: 554 });
        this.tone(698, 0.14, { type: 'sine', volume: 0.14, delay: 0.07, freqEnd: 831 });
        break;
      case 3: // 火焰花 - 火焰强化
        this.tone(330, 0.1, { type: 'sawtooth', volume: 0.16, freqEnd: 523 });
        this.tone(622, 0.12, { type: 'square', volume: 0.14, delay: 0.06, freqEnd: 698 });
        break;
      case 4: // 紫蘑菇 - 变大
        this.tone(262, 0.14, { type: 'square', volume: 0.16, freqEnd: 330 });
        this.tone(392, 0.12, { type: 'triangle', volume: 0.14, delay: 0.08, freqEnd: 440 });
        break;
      case 5: // 加速蘑菇 - 速度提升
        this.tone(659, 0.07, { type: 'square', volume: 0.14, freqEnd: 988 });
        this.tone(988, 0.07, { type: 'square', volume: 0.13, delay: 0.03, freqEnd: 1318 });
        this.tone(1318, 0.07, { type: 'triangle', volume: 0.12, delay: 0.06, freqEnd: 1568 });
        break;
      case 6: // 高跳蘑菇 - 跳跃强化
        this.tone(349, 0.08, { type: 'triangle', volume: 0.14, freqEnd: 523 });
        this.tone(523, 0.1, { type: 'triangle', volume: 0.14, delay: 0.05, freqEnd: 784 });
        this.tone(784, 0.11, { type: 'sine', volume: 0.13, delay: 0.1, freqEnd: 1047 });
        break;
      case 7: // Peachette - 滑翔
        this.tone(440, 0.16, { type: 'sine', volume: 0.13, freqEnd: 523 });
        this.tone(659, 0.2, { type: 'triangle', volume: 0.13, delay: 0.08, freqEnd: 740 });
        break;
      default:
        this.tone(523, 0.1, { type: 'triangle', volume: 0.14, freqEnd: 659 });
        break;
    }
  }

  startLevelBGM(level) {
    this.currentLevel = level;
    this.stopBGM();
    if (!this.enabled) return;
    this.bgmPlaying = true;
    this.bgmStep = 0;
    this._playBGMStep();
  }

  startBGM() { this.startLevelBGM(0); }

  stopBGM(clearResumeFlag = true) {
    this.bgmPlaying = false;
    if (clearResumeFlag) this.resumeBgmAfterFocus = false;
    if (this.bgmTimer) { clearTimeout(this.bgmTimer); this.bgmTimer = null; }
  }

  _playBGMStep() {
    if (!this.bgmPlaying) return;
    const melody = this.levelThemes[this.currentLevel % this.levelThemes.length];
    const beat = 0.16 + (this.currentLevel % 3) * 0.02;
    const idx = this.bgmStep % melody.length;
    this.tone(melody[idx], beat, { type: 'triangle', volume: 0.12, dest: this.bgmGain });
    if (idx % 2 === 0) {
      this.tone(melody[idx] * 0.5, beat * 1.1, { type: 'sine', volume: 0.08, dest: this.bgmGain });
    }
    this.bgmStep++;
    this.bgmTimer = setTimeout(() => this._playBGMStep(), beat * 1000);
  }

  playSting(kind, muteMock = false) {
    if (!this.enabled) return;
    if (kind === 'death' && !muteMock) {
      this.tone(120, 0.2, { type: 'sawtooth', volume: 0.35 });
      this.tone(90, 0.35, { type: 'sine', volume: 0.3, delay: 0.15 });
      this.tone(200, 0.08, { volume: 0.2, delay: 0.05 });
    } else if (kind === 'death') {
      this.tone(100, 0.15, { type: 'sine', volume: 0.15 });
    } else if (kind === 'win') {
      [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.15, { volume: 0.25, delay: i * 0.12 }));
    } else if (kind === 'victory') {
      [392, 523, 659, 784, 988].forEach((f, i) => this.tone(f, 0.2, { volume: 0.22, delay: i * 0.15 }));
    } else if (kind === 'title') {
      [659, 784, 988].forEach((f, i) => this.tone(f, 0.25, { type: 'triangle', volume: 0.18, delay: i * 0.2 }));
    } else if (kind.startsWith('lore')) {
      this.tone(330 + (parseInt(kind.replace('lore', ''), 10) || 0) * 40, 0.3, { type: 'sine', volume: 0.12 });
    }
  }
}

const gameAudio = new GameAudio();
window.gameAudio = gameAudio;
