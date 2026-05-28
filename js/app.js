/**
 * App shell: login, title/lore, hub map, shop, settings
 */
const App = {
  profile: null,
  settings: { music: true, lang: 'zh', langChosen: false },
  screen: 'login',
  API: (() => {
    const path = window.location.pathname || '/';
    const base = path.endsWith('/') ? path : path.replace(/\/[^/]*$/, '/');
    return base + 'api/';
  })(),
  _saveTimer: null,
  _saveInFlight: false,
  _saveQueued: false,

  t(key) {
    const table = {
      login_title: { zh: '登录 / 注册', en: 'Login / Register' },
      nickname: { zh: '昵称', en: 'Nickname' },
      password: { zh: '密码', en: 'Password' },
      login: { zh: '登录', en: 'Login' },
      register: { zh: '注册', en: 'Register' },
      hub: { zh: '泡泡糖山谷地图', en: 'Hubba-Dubba Map' },
      shop: { zh: '商店', en: 'Shop' },
      rank: { zh: '排行榜', en: 'Leaderboard' },
      settings: { zh: '设置', en: 'Settings' },
      profile: { zh: '个人中心', en: 'Profile' },
      rules: { zh: '规则', en: 'Rules' },
      back: { zh: '返回地图', en: 'Back to Map' },
      press_continue: { zh: '按空格或点击继续', en: 'Press Space or tap to continue' },
      controls_hint: { zh: '方向键/WASD移动，空格/W跳跃，E互动', en: 'Arrows/WASD move, Space/W jump, E interact' },
      touch_hint: { zh: '触屏使用屏幕按键；失败时点击任意处重试', en: 'Use touch buttons; tap anywhere to retry on death' },
    };
    const lang = this.settings.lang;
    return table[key]?.[lang] || table[key]?.zh || key;
  },

  parseApiResponse(text) {
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch (e) { /* fall through */ }
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch (e) { /* fall through */ }
    }
    return null;
  },

  async api(path, data = {}) {
    try {
      const res = await fetch(this.API + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const text = await res.text();
      const parsed = this.parseApiResponse(text);
      if (parsed) return parsed;
      return {
        ok: false,
        error: '服务器返回异常，请确认 api/data 目录可写且 PHP 已启用。',
      };
    } catch (e) {
      return {
        ok: false,
        error: '无法连接服务器，请检查网络或 API 地址是否正确。',
      };
    }
  },

  $(id) { return document.getElementById(id); },

  showScreen(name) {
    this.screen = name;
    document.querySelectorAll('[data-screen]').forEach((el) => {
      el.classList.toggle('hidden', el.dataset.screen !== name);
    });
    document.body.dataset.appScreen = name;
    if (name === 'hub') this.renderHub();
    if (name === 'shop') this.renderShop();
    if (name === 'leaderboard') this.loadLeaderboard();
    if (name === 'profile') this.renderProfile();
    if (name === 'settings') this.syncSettingsUi();
  },

  setLoginLoading(loading) {
    const btns = ['btnLogin', 'btnRegister', 'btnDemoLogin'];
    btns.forEach((id) => {
      const b = this.$(id);
      if (!b) return;
      b.disabled = loading;
      b.style.opacity = loading ? '0.65' : '';
    });
    const demo = this.$('btnDemoLogin');
    if (demo && loading) demo.textContent = '登录中…';
    else if (demo) demo.textContent = '一键登录 Demo';
  },

  enterHub() {
    try {
      Multiplayer.start(this.profile, () => ({
        level: GameController?.currentLevel ?? -1,
        x: GameController?.player?.x ?? 0,
        y: GameController?.player?.y ?? 0,
        playing: GameController?.gameState === 'playing',
      }));
    } catch (e) { /* offline */ }
    this.showScreen('hub');
    gameAudio?.unlock?.();
    this.showToast(`欢迎，${this.profile?.nickname || '玩家'}！`);
  },

  showToast(msg) {
    const el = this.$('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(this._toastT);
    this._toastT = setTimeout(() => el.classList.remove('show'), 2800);
  },

  updateOnlineBadge(n) {
    const el = this.$('onlineBadge');
    if (el) el.textContent = n > 0 ? `${n} 在线` : '';
  },

  loadSettings() {
    try {
      const s = JSON.parse(localStorage.getItem('bgf_settings') || '{}');
      const lang = s.langChosen === true && s.lang === 'en' ? 'en' : 'zh';
      this.settings = {
        music: s.music !== false,
        lang,
        langChosen: s.langChosen === true,
      };
    } catch (e) {
      this.settings = { music: true, lang: 'zh', langChosen: false };
    }
    this.applyAudioSettings();
    this.syncSettingsUi();
  },

  syncSettingsUi() {
    const musicEl = this.$('settingMusic');
    if (musicEl) musicEl.checked = this.settings.music;
    const langEl = this.$('settingLang');
    if (langEl) langEl.value = this.settings.lang === 'en' ? 'en' : 'zh';
    window.GameController?.refreshSnackPanel?.();
  },

  applyAudioSettings() {
    const on = this.settings?.music !== false;
    const ga = window.gameAudio;
    if (!ga) return;
    if (typeof ga.setEnabled === 'function') {
      ga.setEnabled(on);
    } else {
      ga.enabled = on;
      if (!on && typeof ga.stopBGM === 'function') ga.stopBGM();
    }
  },

  saveSettings() {
    localStorage.setItem('bgf_settings', JSON.stringify(this.settings));
    this.applyAudioSettings();
  },

  saveSession() {
    if (this.profile?.token) {
      localStorage.setItem('bgf_session', JSON.stringify({
        token: this.profile.token,
        nickname: this.profile.nickname,
      }));
    }
  },

  hasSeenLore(nickname = this.profile?.nickname) {
    const nick = (nickname || '').trim();
    if (nick && localStorage.getItem(`bgf_seen_lore_${nick}`) === '1') return true;
    return localStorage.getItem('bgf_seen_intro') === '1';
  },

  markSeenLore(nickname = this.profile?.nickname) {
    const nick = (nickname || '').trim();
    if (nick) localStorage.setItem(`bgf_seen_lore_${nick}`, '1');
    localStorage.setItem('bgf_seen_intro', '1');
  },

  progressCacheKey(nickname) {
    return `bgf_progress_${(nickname || '').trim().toLowerCase()}`;
  },

  cacheProgress(profile = this.profile) {
    if (!profile?.nickname) return;
    try {
      localStorage.setItem(this.progressCacheKey(profile.nickname), JSON.stringify({
        levelStars: profile.levelStars || [],
        coins: profile.coins || 0,
        stars: profile.stars || 0,
        maxLevel: profile.maxLevel ?? 0,
        currentLevel: profile.currentLevel ?? 0,
        skin: profile.skin || 'skin_default',
        trail: profile.trail || 'none',
        owned: profile.owned || ['skin_default'],
        updated: Date.now(),
      }));
    } catch (e) { /* quota */ }
  },

  loadCachedProgress(nickname) {
    try {
      return JSON.parse(localStorage.getItem(this.progressCacheKey(nickname)) || 'null');
    } catch (e) {
      return null;
    }
  },

  normalizeProfile(profile) {
    if (!profile) return null;
    const p = { ...profile };
    p.levelStars = Array.isArray(p.levelStars) ? p.levelStars.map(Boolean) : [];
    p.coins = Number(p.coins) || 0;
    p.stars = p.levelStars.filter(Boolean).length || Number(p.stars) || 0;
    p.currentLevel = Math.max(0, Math.min(19, Number(p.currentLevel) || 0));
    p.trail = p.trail || 'none';
    this.syncMaxLevel(p);
    const max = this.highestUnlockedLevel(p);
    if (p.currentLevel > max) p.currentLevel = max;
    return p;
  },

  mergeProgress(server, cached) {
    if (!cached) return server;
    const sLs = Array.isArray(server.levelStars) ? server.levelStars.map(Boolean) : [];
    const cLs = Array.isArray(cached.levelStars) ? cached.levelStars.map(Boolean) : [];
    const merged = [];
    const len = Math.max(sLs.length, cLs.length, 20);
    for (let i = 0; i < len; i++) merged[i] = !!(sLs[i] || cLs[i]);
    const sOwned = Array.isArray(server.owned) ? server.owned : [];
    const cOwned = Array.isArray(cached.owned) ? cached.owned : [];
    const mergedOwned = Array.from(new Set([...sOwned, ...cOwned]));
    const cachedCoins = Number(cached.coins);
    const serverCoins = Number(server.coins);
    const cachedLevel = Number(cached.currentLevel);
    const serverLevel = Number(server.currentLevel);
    const out = {
      ...server,
      levelStars: merged,
      // Local-first: cached progress always wins over server snapshot when present.
      coins: Number.isFinite(cachedCoins) ? cachedCoins : (Number.isFinite(serverCoins) ? serverCoins : 0),
      stars: merged.filter(Boolean).length,
      currentLevel: Number.isFinite(cachedLevel) ? cachedLevel : (Number.isFinite(serverLevel) ? serverLevel : 0),
      owned: mergedOwned.length ? mergedOwned : (server.owned || ['skin_default']),
      skin: cached.skin || server.skin || 'skin_default',
      trail: cached.trail || server.trail || 'none',
    };
    return this.normalizeProfile(out);
  },

  adoptProfile(rawProfile, nickname) {
    const nick = nickname || rawProfile?.nickname || '';
    const base = this.normalizeProfile(rawProfile || { nickname: nick });
    const serverStars = base.levelStars.filter(Boolean).length;
    const serverCoins = Number(rawProfile?.coins) || 0;
    const serverLevel = Number(rawProfile?.currentLevel) || 0;
    let profile = base;
    const cached = this.loadCachedProgress(nick);
    if (cached) profile = this.mergeProgress(profile, cached);
    this.profile = profile;
    this.cacheProgress(profile);
    const needsSync = profile.levelStars.filter(Boolean).length > serverStars
      || (profile.coins || 0) > serverCoins
      || (profile.currentLevel || 0) > serverLevel;
    return { profile, needsSync };
  },

  getSavePayload() {
    return {
      action: 'save',
      token: this.profile.token,
      stars: this.profile.stars,
      coins: this.profile.coins,
      levelStars: this.profile.levelStars,
      maxLevel: this.profile.maxLevel,
      currentLevel: this.profile.currentLevel ?? 0,
      skin: this.profile.skin,
      trail: this.profile.trail,
      owned: this.profile.owned,
      muteDev: this.profile.muteDev,
      achievements: this.profile.achievements,
    };
  },

  scheduleProfileUpload(delay = 900) {
    if (!this.profile?.token || this.profile.token === 'demo_local_offline') return;
    clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => {
      this.flushProfileUpload();
    }, delay);
  },

  async flushProfileUpload() {
    if (!this.profile?.token || this.profile.token === 'demo_local_offline') return { ok: true, localOnly: true };
    if (this._saveInFlight) {
      this._saveQueued = true;
      return { ok: true, queued: true };
    }
    this._saveInFlight = true;
    try {
      const res = await this.api('leaderboard.php', this.getSavePayload());
      if (this._saveQueued) {
        this._saveQueued = false;
        this.scheduleProfileUpload(150);
      }
      return res;
    } finally {
      this._saveInFlight = false;
    }
  },

  async saveProfile(options = {}) {
    if (!this.profile?.token) return { ok: false };
    this.syncMaxLevel(this.profile);
    this.cacheProgress();
    if (this.profile.token === 'demo_local_offline') return { ok: true, localOnly: true };
    if (options.immediate) {
      return this.flushProfileUpload();
    }
    this.scheduleProfileUpload(options.delay ?? 900);
    return { ok: true, queued: true };
  },

  countStars() {
    const ls = this.profile?.levelStars || [];
    return Array.isArray(ls) ? ls.filter(Boolean).length : (this.profile?.stars || 0);
  },

  /** 最高可进入的关卡 index：新玩家仅第 1 关；通关第 n 关后解锁第 n+1 关 */
  highestUnlockedLevel(profile = this.profile) {
    const ls = profile?.levelStars || [];
    let lastCompleted = -1;
    for (let i = ls.length - 1; i >= 0; i--) {
      if (ls[i]) { lastCompleted = i; break; }
    }
    if (lastCompleted < 0) return 0;
    return Math.min(lastCompleted + 1, 19);
  },

  highestCompletedLevel(profile = this.profile) {
    const ls = profile?.levelStars || [];
    for (let i = ls.length - 1; i >= 0; i--) {
      if (ls[i]) return i;
    }
    return -1;
  },

  syncMaxLevel(profile = this.profile) {
    if (!profile) return;
    profile.maxLevel = this.highestUnlockedLevel(profile);
  },

  async init() {
    this.bindAuth();
    this.bindHub();
    this.bindShop();
    this.bindLore();
    this.bindGlobalHotkeys();
    this.bindSettings();
    this.loadSettings();

    const session = JSON.parse(localStorage.getItem('bgf_session') || 'null');
    if (session?.nickname && this.$('loginNick')) {
      this.$('loginNick').value = session.nickname;
    }

    if (window.__DEV_MODE__) {
      this.profile = {
        nickname: 'Dev',
        token: 'dev',
        coins: 999,
        stars: 5,
        levelStars: [true, true, true],
        maxLevel: 19,
        skin: 'skin_default',
        owned: ['skin_default'],
        muteDev: false,
      };
      this.showScreen('hub');
      GameController?.init?.();
      return;
    }

    this.showScreen('login');
    window.GameController?.init?.();
  },

  bindAuth() {
    this.$('btnLogin')?.addEventListener('click', () => this.doLogin());
    this.$('btnRegister')?.addEventListener('click', () => this.doRegister());
    this.$('btnDemoLogin')?.addEventListener('click', () => this.doDemoLogin());
  },

  async doDemoLogin() {
    if (this.$('loginNick')) this.$('loginNick').value = 'demo';
    if (this.$('loginPass')) this.$('loginPass').value = 'demo123';
    await this.doLogin();
  },

  async doLogin(options = {}) {
    const nick = (this.$('loginNick')?.value || '').trim();
    const pass = this.$('loginPass')?.value || '';
    const err = this.$('loginError');
    if (err) err.textContent = '';
    if (!nick || !pass) {
      if (err) err.textContent = '请输入昵称和密码';
      return;
    }

    this.setLoginLoading(true);
    try {
      let res = await this.api('auth.php', { action: 'login', nickname: nick, password: pass });

      if ((!res || !res.ok) && nick === 'demo' && pass === 'demo123') {
        res = {
          ok: true,
          token: 'demo_local_offline',
          profile: {
            nickname: 'demo',
            token: 'demo_local_offline',
            stars: 3,
            coins: 500,
            levelStars: [true, true, true],
            maxLevel: 2,
            skin: 'skin_default',
            owned: ['skin_default'],
          },
        };
      }

      if (!res || !res.ok) {
        if (err) err.textContent = res?.error || '登录失败';
        return;
      }

      this.profile = res.profile || { nickname: nick, token: res.token };
      if (!this.profile.nickname) this.profile.nickname = nick;
      if (!this.profile.token) this.profile.token = res.token;
      const { needsSync } = this.adoptProfile(this.profile, nick);
      if (needsSync) await this.saveProfile({ immediate: true });
      this.saveSession();

      if (options.skipIntro) {
        this.enterHub();
      } else {
        this.startIntro();
      }
    } catch (e) {
      if (err) err.textContent = '登录出错：' + (e.message || '未知错误');
    } finally {
      this.setLoginLoading(false);
    }
  },

  async doRegister() {
    const nick = (this.$('loginNick')?.value || '').trim();
    const pass = this.$('loginPass')?.value || '';
    const err = this.$('loginError');
    if (err) err.textContent = '';
    this.setLoginLoading(true);
    try {
      const chk = await this.api('auth.php', { action: 'check', nickname: nick });
      if (chk?.exists) { if (err) err.textContent = '昵称已被使用'; return; }
      const res = await this.api('auth.php', { action: 'register', nickname: nick, password: pass });
      if (!res?.ok) { if (err) err.textContent = res?.error || '注册失败'; return; }
      this.profile = res.profile || { nickname: nick, token: res.token, coins: 0, stars: 0, levelStars: [] };
      if (!this.profile.nickname) this.profile.nickname = nick;
      if (!this.profile.token) this.profile.token = res.token;
      this.adoptProfile(this.profile, nick);
      this.saveSession();
      this.startIntro();
    } catch (e) {
      if (err) err.textContent = '注册出错：' + (e.message || '未知错误');
    } finally {
      this.setLoginLoading(false);
    }
  },

  startIntro() {
    this.showScreen('title');
    try {
      Multiplayer.start(this.profile, () => ({
        level: GameController?.currentLevel ?? -1,
        x: GameController?.player?.x ?? 0,
        y: GameController?.player?.y ?? 0,
        playing: GameController?.gameState === 'playing',
      }));
    } catch (e) { /* ignore */ }
    gameAudio?.unlock?.();
    gameAudio?.playSting?.('title');
  },

  bindLore() {
    const scenes = [
      { id: 'lore1', dur: 4500 },
      { id: 'lore2', dur: 4500 },
      { id: 'lore3', dur: 5000 },
      { id: 'lore4', dur: 4000 },
    ];
    let idx = 0;
    let loreTimers = [];

    const clearLoreTimers = () => {
      loreTimers.forEach((t) => clearTimeout(t));
      loreTimers = [];
    };

    const updateLoreSkipBtn = () => {
      const btn = this.$('btnSkipLore');
      if (!btn) return;
      btn.textContent = this.settings.lang === 'en' ? 'Skip' : '跳过';
      btn.classList.toggle('hidden', !this.hasSeenLore());
    };

    const showScene = (i) => {
      idx = i;
      scenes.forEach((s, j) => {
        const el = this.$(s.id);
        if (el) el.classList.toggle('active', j === i);
      });
      gameAudio?.playSting('lore' + (i + 1));
      if (i >= scenes.length - 1) {
        loreTimers.push(setTimeout(() => {
          this.markSeenLore();
          this.showScreen('controls');
        }, scenes[i].dur));
      } else {
        loreTimers.push(setTimeout(() => showScene(i + 1), scenes[i].dur));
      }
    };

    const startLore = () => {
      clearLoreTimers();
      this.showScreen('lore');
      updateLoreSkipBtn();
      showScene(0);
    };

    const skipLore = () => {
      clearLoreTimers();
      this.enterHub();
    };

    const advanceTitle = () => {
      if (this.screen !== 'title') return;
      startLore();
    };

    this.$('titleScreen')?.addEventListener('click', advanceTitle);
    this.$('btnSkipLore')?.addEventListener('click', (e) => {
      e.stopPropagation();
      skipLore();
    });
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && this.screen === 'title') {
        e.preventDefault();
        advanceTitle();
      }
      if (e.code === 'Space' && this.screen === 'controls') {
        e.preventDefault();
        this.markSeenLore();
        this.showScreen('hub');
      }
    });

    this.$('loreScreen')?.addEventListener('click', (e) => {
      if (e.target.closest('#btnSkipLore')) return;
      clearLoreTimers();
      if (idx < scenes.length - 1) showScene(idx + 1);
      else {
        this.markSeenLore();
        this.showScreen('controls');
      }
    });
    this.$('btnToHub')?.addEventListener('click', () => {
      this.markSeenLore();
      this.showScreen('hub');
    });
  },

  bindHub() {
    this.$('btnContinue')?.addEventListener('click', () => {
      const max = this.highestUnlockedLevel(this.profile);
      const idx = Math.max(0, Math.min(max, Number(this.profile?.currentLevel) || 0));
      this.startLevel(idx);
    });
    this.$('navShop')?.addEventListener('click', () => {
      this.showScreen('shop');
    });
    this.$('navRank')?.addEventListener('click', () => this.showScreen('leaderboard'));
    this.$('navSettings')?.addEventListener('click', () => this.showScreen('settings'));
    this.$('navProfile')?.addEventListener('click', () => this.showScreen('profile'));
    this.$('navRules')?.addEventListener('click', () => this.showScreen('rules'));
    document.querySelectorAll('[data-back-hub]').forEach((b) => {
      b.addEventListener('click', () => this.showScreen('hub'));
    });
  },

  bindGlobalHotkeys() {
    const hubBackScreens = new Set(['shop', 'leaderboard', 'settings', 'profile', 'rules']);
    window.addEventListener('keydown', (e) => {
      if (e.code !== 'Escape' || e.defaultPrevented) return;
      // In-game Escape is handled by GameController.
      if (document.body.dataset.appScreen === 'game') return;
      if (!hubBackScreens.has(this.screen)) return;
      e.preventDefault();
      this.showScreen('hub');
    });
  },

  renderHub() {
    const map = this.$('levelMap');
    if (!map) return;
    map.innerHTML = '';
    const stars = this.profile?.levelStars || [];
    const max = this.highestUnlockedLevel(this.profile);
    const current = Math.max(0, Math.min(max, Number(this.profile?.currentLevel) || 0));
    const contNum = this.$('continueLevelNum');
    if (contNum) contNum.textContent = String(current + 1);
    for (let i = 0; i < 20; i++) {
      const node = document.createElement('button');
      node.className = 'map-node';
      node.style.left = `${8 + (i % 5) * 18}%`;
      node.style.top = `${12 + Math.floor(i / 5) * 20}%`;
      if (stars[i]) node.classList.add('starred');
      if (i === current) node.classList.add('current');
      if (i > max) node.classList.add('locked');
      node.innerHTML = `<span class="node-num">${i + 1}</span>${stars[i] ? '<span class="node-star">★</span>' : ''}`;
      node.addEventListener('click', () => {
        if (i > max) { this.showToast('请先完成前面的关卡'); return; }
        this.startLevel(i);
      });
      map.appendChild(node);
    }
    const info = this.$('hubStats');
    if (info) {
      info.textContent = `${this.profile?.nickname} | ★ ${this.countStars()} | 🪙 ${this.profile?.coins || 0}`;
    }
  },

  startLevel(index) {
    if (!window.GameController) {
      this.showToast('游戏未初始化');
      return;
    }
    if (this.profile) {
      this.profile.currentLevel = index;
      this.cacheProgress();
    }
    GameController.ready.then(() => {
      GameController.startLevelFromHub(index, this.profile);
      this.saveProfile();
    });
  },

  returnToHub() {
    gameAudio?.stopBGM();
    this.$('game-wrapper')?.classList.add('hidden');
    document.body.dataset.appScreen = 'hub';
    this.showScreen('hub');
    this.renderHub();
    this.saveProfile();
  },

  onLevelComplete(levelIndex, levelCoins, newStar) {
    if (newStar) {
      if (!this.profile.levelStars) this.profile.levelStars = [];
      this.profile.levelStars[levelIndex] = true;
      this.profile.stars = this.countStars();
      this.profile.currentLevel = Math.min(levelIndex + 1, 19);
    } else {
      this.profile.currentLevel = levelIndex;
    }
    this.syncMaxLevel(this.profile);
    this.cacheProgress();
    this.saveProfile();
  },

  onLevelDeath() {
    /* level coins already cleared in GameController */
  },

  bindShop() {
    this.shopIndex = 0;
    const skins = SHOP_CATALOG.skins || [];
    const equippedIdx = skins.findIndex((s) => s.id === this.profile?.skin);
    if (equippedIdx >= 0) this.shopIndex = equippedIdx;
    this.trailIndex = 0;
    const trails = SHOP_CATALOG.trails || [];
    const equippedTrailIdx = trails.findIndex((t) => t.id === (this.profile?.trail || 'none'));
    if (equippedTrailIdx >= 0) this.trailIndex = equippedTrailIdx;

    this.$('skinPrev')?.addEventListener('click', () => this.shopStep(-1));
    this.$('skinNext')?.addEventListener('click', () => this.shopStep(1));
    this.$('skinAction')?.addEventListener('click', () => this.shopAction());
    this.$('trailPrev')?.addEventListener('click', () => this.trailStep(-1));
    this.$('trailNext')?.addEventListener('click', () => this.trailStep(1));
    this.$('trailAction')?.addEventListener('click', () => this.trailAction());
    this.$('trailUnequip')?.addEventListener('click', () => this.unequipTrail());
    this.$('btnDebugCoins')?.addEventListener('click', () => this.debugAddCoins(100));
    this.startTrailPreviewLoop();

    document.addEventListener('keydown', (e) => {
      if (this.screen !== 'shop') return;
      if (e.code === 'ArrowLeft') { e.preventDefault(); this.shopStep(-1); }
      else if (e.code === 'ArrowRight') { e.preventDefault(); this.shopStep(1); }
      else if (e.code === 'Enter' || e.code === 'Space') { e.preventDefault(); this.shopAction(); }
    });

    const carousel = this.$('skinCarousel');
    if (carousel) {
      let startX = 0;
      let active = false;
      const SWIPE = 40;
      carousel.addEventListener('touchstart', (e) => {
        if (!e.touches[0]) return;
        startX = e.touches[0].clientX;
        active = true;
      }, { passive: true });
      carousel.addEventListener('touchend', (e) => {
        if (!active) return;
        active = false;
        const endX = e.changedTouches[0]?.clientX ?? startX;
        const dx = endX - startX;
        if (dx <= -SWIPE) this.shopStep(1);
        else if (dx >= SWIPE) this.shopStep(-1);
      });
    }
    const trailCarousel = this.$('trailCarousel');
    if (trailCarousel) {
      let startX = 0;
      let active = false;
      const SWIPE = 40;
      trailCarousel.addEventListener('touchstart', (e) => {
        if (!e.touches[0]) return;
        startX = e.touches[0].clientX;
        active = true;
      }, { passive: true });
      trailCarousel.addEventListener('touchend', (e) => {
        if (!active) return;
        active = false;
        const endX = e.changedTouches[0]?.clientX ?? startX;
        const dx = endX - startX;
        if (dx <= -SWIPE) this.trailStep(1);
        else if (dx >= SWIPE) this.trailStep(-1);
      });
    }
  },

  renderShop() {
    const coinsEl = this.$('shopCoins');
    if (coinsEl) coinsEl.textContent = this.profile?.coins || 0;
    this.renderSkinCarousel();
    this.renderTrailCarousel();
  },

  renderSkinCarousel() {
    const skins = SHOP_CATALOG.skins || [];
    if (!skins.length) return;
    const total = skins.length;
    if (this.shopIndex == null) this.shopIndex = 0;
    this.shopIndex = ((this.shopIndex % total) + total) % total;
    const item = skins[this.shopIndex];

    const lang = this.settings.lang;
    const owned = (this.profile?.owned || []).includes(item.id);
    const equipped = this.profile?.skin === item.id;

    const preview = this.$('skinPreview');
    if (preview && item.grid) {
      preview.style.backgroundPosition = `${item.grid[0] * 50}% ${item.grid[1] * 50}%`;
    }

    const nameEl = this.$('skinName');
    if (nameEl) nameEl.textContent = item.name[lang] || item.name.zh || item.id;

    const descEl = this.$('skinDesc');
    if (descEl) descEl.textContent = item.desc ? (item.desc[lang] || item.desc.zh || '') : '';

    const priceEl = this.$('skinPrice');
    if (priceEl) {
      priceEl.textContent = item.price > 0 ? `${item.price} 🪙` : '免费';
    }

    const actionEl = this.$('skinAction');
    if (actionEl) {
      actionEl.classList.remove('equipped');
      actionEl.disabled = false;
      if (equipped) {
        actionEl.textContent = '已装备 ✓';
        actionEl.classList.add('equipped');
        actionEl.disabled = true;
      } else if (owned) {
        actionEl.textContent = '装备';
      } else {
        actionEl.textContent = `购买 ${item.price} 🪙`;
      }
    }

    const idxEl = this.$('skinIndex');
    if (idxEl) idxEl.textContent = `${this.shopIndex + 1} / ${total}`;
  },

  renderTrailCarousel() {
    const trails = SHOP_CATALOG.trails || [];
    if (!trails.length) return;
    const total = trails.length;
    if (this.trailIndex == null) this.trailIndex = 0;
    this.trailIndex = ((this.trailIndex % total) + total) % total;
    const item = trails[this.trailIndex];
    const lang = this.settings.lang;
    const owned = (this.profile?.owned || []).includes(item.id);
    const equipped = (this.profile?.trail || 'none') === item.id;
    const hasTrailEquipped = (this.profile?.trail || 'none') !== 'none';
    const descMap = {
      trail_glitter: {
        zh: '奔跑时留下闪亮糖粉尾迹。',
        en: 'Sparkling glitter follows each step.',
      },
      trail_bubble: {
        zh: '一串轻盈泡泡跟随移动。',
        en: 'A stream of bubbles trails behind you.',
      },
      trail_wrappers: {
        zh: '彩色包装纸碎片在身后飘散。',
        en: 'Candy wrapper confetti drifts behind.',
      },
    };
    const trailColors = {
      trail_glitter: ['#ffd700', '#ff69b4', '#ffffff'],
      trail_bubble: ['#ffb6d9', '#ffffff', '#ffdff0'],
      trail_wrappers: ['#ff3366', '#33cc33', '#ffd700'],
    };

    const preview = this.$('trailPreviewBox');
    if (preview) {
      preview.className = `trail-preview ${item.id}`;
    }
    this.trailPreviewType = item.id;
    const palette = this.$('trailPalette');
    if (palette) {
      const swatches = Array.from(palette.querySelectorAll('.trail-swatch'));
      const colors = trailColors[item.id] || ['#cccccc', '#dddddd', '#eeeeee'];
      swatches.forEach((el, idx) => {
        el.style.background = colors[idx] || colors[colors.length - 1] || '#ddd';
      });
    }
    const nameEl = this.$('trailName');
    if (nameEl) nameEl.textContent = item.name[lang] || item.name.zh || item.id;
    const descEl = this.$('trailDesc');
    if (descEl) descEl.textContent = descMap[item.id]?.[lang] || descMap[item.id]?.zh || '';
    const priceEl = this.$('trailPrice');
    if (priceEl) priceEl.textContent = `${item.price} 🪙`;

    const actionEl = this.$('trailAction');
    if (actionEl) {
      actionEl.classList.remove('equipped');
      actionEl.disabled = false;
      if (equipped) {
        actionEl.textContent = '已装备 ✓';
        actionEl.classList.add('equipped');
        actionEl.disabled = true;
      } else if (owned) {
        actionEl.textContent = '装备';
      } else {
        actionEl.textContent = `购买 ${item.price} 🪙`;
      }
    }
    const unequipEl = this.$('trailUnequip');
    if (unequipEl) {
      unequipEl.disabled = !hasTrailEquipped;
      unequipEl.textContent = hasTrailEquipped ? '卸下拖尾' : '未装备';
    }

    const idxEl = this.$('trailIndex');
    if (idxEl) idxEl.textContent = `${this.trailIndex + 1} / ${total}`;
  },

  shopStep(delta) {
    const skins = SHOP_CATALOG.skins || [];
    if (!skins.length) return;
    this.shopIndex = (((this.shopIndex || 0) + delta) % skins.length + skins.length) % skins.length;
    const preview = this.$('skinPreview');
    if (preview) {
      const cls = delta > 0 ? 'swipe-left' : 'swipe-right';
      preview.classList.add(cls);
      setTimeout(() => preview.classList.remove(cls), 150);
    }
    this.renderShop();
  },

  trailStep(delta) {
    const trails = SHOP_CATALOG.trails || [];
    if (!trails.length) return;
    this.trailIndex = (((this.trailIndex || 0) + delta) % trails.length + trails.length) % trails.length;
    const preview = this.$('trailPreviewBox');
    if (preview) {
      const cls = delta > 0 ? 'swipe-left' : 'swipe-right';
      preview.classList.add(cls);
      setTimeout(() => preview.classList.remove(cls), 150);
    }
    this.renderTrailCarousel();
  },

  startTrailPreviewLoop() {
    if (this._trailPreviewRaf) return;
    this._trailPreviewState = this._trailPreviewState || {
      particles: [],
      lastTs: 0,
      trailTimer: 0,
      player: { x: 70, y: 18, w: 32, h: 48, trail: 'trail_glitter' },
    };
    const tick = (ts) => {
      this.drawTrailPreview(ts);
      this._trailPreviewRaf = requestAnimationFrame(tick);
    };
    this._trailPreviewRaf = requestAnimationFrame(tick);
  },

  drawTrailPreview(ts) {
    const canvas = this.$('trailPreviewCanvas');
    if (!canvas || this.screen !== 'shop') return;
    const st = this._trailPreviewState;
    if (!st) return;
    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.clientWidth || 260;
    const cssH = canvas.clientHeight || 96;
    const w = Math.max(1, Math.floor(cssW * dpr));
    const h = Math.max(1, Math.floor(cssH * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const dt = st.lastTs ? Math.min(34, ts - st.lastTs) : 16;
    st.lastTs = ts;
    const trailId = this.trailPreviewType || 'trail_glitter';
    st.player.trail = trailId;

    ctx.clearRect(0, 0, cssW, cssH);
    const bg = ctx.createLinearGradient(0, 0, cssW, 0);
    bg.addColorStop(0, '#fff7f3');
    bg.addColorStop(1, '#fff1f8');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, cssW, cssH);

    // Keep a fixed in-preview player anchor (no movement, full transparent).
    st.player.x = Math.round(cssW * 0.46);
    st.player.y = 22;

    // Same trail emit logic as engine.emitTrail
    st.trailTimer = (st.trailTimer || 0) + 1;
    if (st.player.trail !== 'none' && st.trailTimer % 4 === 0) {
      const colors = {
        trail_glitter: ['#ffd700', '#ff69b4', '#fff'],
        trail_bubble: ['#ffb6d9', '#fff'],
        trail_wrappers: ['#ff3366', '#33cc33', '#ffd700'],
      };
      const pal = colors[st.player.trail] || ['#ffb6d9'];
      const color = pal[st.trailTimer % pal.length];
      // Same particle spawn params as engine.spawnParticles(..., 2)
      for (let i = 0; i < 2; i++) {
        st.particles.push({
          x: st.player.x + st.player.w / 2,
          y: st.player.y + st.player.h,
          vx: (Math.random() - 0.5) * 6,
          vy: (Math.random() - 0.5) * 6 - 2,
          life: 400 + Math.random() * 300,
          color,
          size: 3 + Math.random() * 4,
        });
      }
    }

    // Same particle update as engine.updateWorld
    st.particles = st.particles.filter((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2;
      p.life -= dt;
      return p.life > 0;
    });

    // Same particle draw style as engine.render
    for (const p of st.particles) {
      ctx.globalAlpha = p.life / 700;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  },

  async shopAction() {
    const skins = SHOP_CATALOG.skins || [];
    const item = skins[this.shopIndex];
    if (!item || !this.profile?.token) return;
    const owned = (this.profile.owned || []).includes(item.id);
    const equipped = this.profile.skin === item.id;
    if (equipped) return;
    const localRes = this.shopActionLocal(item, owned);
    if (!localRes.ok) { this.showToast(localRes.error); return; }
    this.showToast(owned ? '已装备' : '购买成功！');
    this.renderShop();
    this.saveProfile();
  },

  async trailAction() {
    const trails = SHOP_CATALOG.trails || [];
    const item = trails[this.trailIndex];
    if (!item || !this.profile?.token) return;
    const owned = (this.profile.owned || []).includes(item.id);
    const equipped = (this.profile.trail || 'none') === item.id;
    if (equipped) return;
    const localRes = this.trailActionLocal(item, owned);
    if (!localRes.ok) { this.showToast(localRes.error); return; }
    this.showToast(owned ? '拖尾已装备' : '购买成功！');
    this.renderShop();
    this.saveProfile();
  },

  async unequipTrail() {
    if (!this.profile) return;
    if ((this.profile.trail || 'none') === 'none') return;
    this.profile.trail = 'none';
    this.showToast('已卸下拖尾');
    this.renderShop();
    this.saveProfile();
  },

  debugAddCoins(amount = 100) {
    if (!this.profile) return;
    this.profile.coins = (Number(this.profile.coins) || 0) + amount;
    this.showToast(`+${amount} 🪙`);
    this.renderShop();
    this.saveProfile();
  },

  shopActionLocal(item, owned) {
    if (owned) {
      this.profile.skin = item.id;
      return { ok: true };
    }
    const coins = Number(this.profile.coins) || 0;
    const price = Number(item.price) || 0;
    if (coins < price) return { ok: false, error: '金币不足' };
    this.profile.coins = coins - price;
    const ownedList = Array.isArray(this.profile.owned) ? [...this.profile.owned] : [];
    if (!ownedList.includes(item.id)) ownedList.push(item.id);
    this.profile.owned = ownedList;
    this.profile.skin = item.id;
    return { ok: true };
  },

  trailActionLocal(item, owned) {
    if (owned) {
      this.profile.trail = item.id;
      return { ok: true };
    }
    const coins = Number(this.profile.coins) || 0;
    const price = Number(item.price) || 0;
    if (coins < price) return { ok: false, error: '金币不足' };
    this.profile.coins = coins - price;
    const ownedList = Array.isArray(this.profile.owned) ? [...this.profile.owned] : [];
    if (!ownedList.includes(item.id)) ownedList.push(item.id);
    this.profile.owned = ownedList;
    this.profile.trail = item.id;
    return { ok: true };
  },

  async loadLeaderboard() {
    const list = this.$('leaderboardList');
    if (!list) return;
    list.innerHTML = '<p>加载中…</p>';
    const res = await this.api('leaderboard.php', { action: 'list' });
    if (!res.ok) { list.innerHTML = '<p>加载失败</p>'; return; }
    list.innerHTML = '';
    res.leaderboard.forEach((row, i) => {
      const li = document.createElement('li');
      li.innerHTML = `<span class="rank">#${i + 1}</span> <strong>${row.nickname}</strong> ★${row.stars} 🪙${row.coins} Lv${(row.maxLevel || 0) + 1}`;
      list.appendChild(li);
    });
  },

  renderProfile() {
    const el = this.$('profileBody');
    if (!el || !this.profile) return;
    const skinName = SHOP_CATALOG.skins.find((s) => s.id === this.profile.skin)?.name?.zh || '默认';
    el.innerHTML = `
      <div class="profile-avatar skin-${this.profile.skin || 'default'}"></div>
      <h3>${this.profile.nickname}</h3>
      <p>皮肤: ${skinName}</p>
      <p>★ ${this.countStars()} | 🪙 ${this.profile.coins || 0}</p>
      <p>最高通关: ${Math.max(0, this.highestCompletedLevel(this.profile) + 1)}</p>
      <p>当前关卡: ${(Number(this.profile.currentLevel) || 0) + 1}</p>
    `;
  },

  bindSettings() {
    this.$('settingMusic')?.addEventListener('change', (e) => {
      this.settings.music = e.target.checked;
      this.saveSettings();
    });
    this.$('settingLang')?.addEventListener('change', (e) => {
      this.settings.lang = e.target.value === 'en' ? 'en' : 'zh';
      this.settings.langChosen = true;
      this.saveSettings();
      window.GameController?.refreshSnackPanel?.();
    });
  },
};

document.addEventListener('DOMContentLoaded', () => App.init());

window.App = App;
