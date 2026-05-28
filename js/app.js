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
      game_title: { zh: '马里奥的黏腻处境', en: "Mario's Sticky Situation" },
      game_subtitle: { zh: "Mario's Sticky Situation", en: '马里奥的黏腻处境' },
      login_title: { zh: '登录 / 注册', en: 'Login / Register' },
      nickname: { zh: '昵称', en: 'Nickname' },
      password: { zh: '密码', en: 'Password' },
      login: { zh: '登录', en: 'Login' },
      register: { zh: '注册', en: 'Register' },
      demo_login: { zh: '一键登录 Demo', en: 'Quick Login Demo' },
      logging_in: { zh: '登录中…', en: 'Logging in…' },
      err_need_credentials: { zh: '请输入昵称和密码', en: 'Please enter nickname and password' },
      err_login_failed: { zh: '登录失败', en: 'Login failed' },
      err_register_failed: { zh: '注册失败', en: 'Registration failed' },
      err_nick_taken: { zh: '昵称已被使用', en: 'Nickname already taken' },
      err_login_unknown: { zh: '未知错误', en: 'Unknown error' },
      hub: { zh: '泡泡糖山谷地图', en: 'Hubba-Dubba Map' },
      hub_title: { zh: '泡泡糖山谷', en: 'Hubba-Dubba Valley' },
      continue_level: { zh: '继续第 {n} 关', en: 'Continue Level {n}' },
      hub_welcome: { zh: '欢迎，{name}！', en: 'Welcome, {name}!' },
      player_default: { zh: '玩家', en: 'Player' },
      hub_locked_level: { zh: '请先完成前面的关卡', en: 'Complete earlier levels first' },
      game_not_ready: { zh: '游戏未初始化', en: 'Game not initialized' },
      online_badge: { zh: '{n} 在线', en: '{n} online' },
      shop: { zh: '商店', en: 'Shop' },
      shop_title: { zh: '皮肤商店', en: 'Skin Shop' },
      shop_free: { zh: '免费', en: 'Free' },
      shop_equipped: { zh: '已装备 ✓', en: 'Equipped ✓' },
      shop_equip: { zh: '装备', en: 'Equip' },
      shop_buy: { zh: '购买 {price} 🪙', en: 'Buy {price} 🪙' },
      trail_unequip_active: { zh: '卸下拖尾', en: 'Remove trail' },
      trail_unequip_btn: { zh: '卸下', en: 'Remove' },
      trail_not_equipped: { zh: '未装备', en: 'Not equipped' },
      settings_music: { zh: '音乐', en: 'Music' },
      settings_language: { zh: '语言', en: 'Language' },
      leaderboard_loading: { zh: '加载中…', en: 'Loading…' },
      leaderboard_failed: { zh: '加载失败', en: 'Failed to load' },
      profile_skin: { zh: '皮肤:', en: 'Skin:' },
      profile_highest: { zh: '最高通关:', en: 'Highest cleared:' },
      profile_current: { zh: '当前关卡:', en: 'Current level:' },
      profile_default_skin: { zh: '默认', en: 'Default' },
      toast_equipped: { zh: '已装备', en: 'Equipped' },
      toast_purchase_ok: { zh: '购买成功！', en: 'Purchase successful!' },
      toast_trail_equipped: { zh: '拖尾已装备', en: 'Trail equipped' },
      toast_trail_removed: { zh: '已卸下拖尾', en: 'Trail removed' },
      err_insufficient_coins: { zh: '金币不足', en: 'Not enough coins' },
      debug_coins_title: { zh: '测试用：+100 金币', en: 'Debug: +100 coins' },
      rank: { zh: '排行榜', en: 'Leaderboard' },
      settings: { zh: '设置', en: 'Settings' },
      profile: { zh: '个人中心', en: 'Profile' },
      rules: { zh: '规则', en: 'Rules' },
      rules_p1: { zh: '失败只重试当前关卡。本关获得的金币在失败时清零，重试也不能再拿已收集的金币。', en: 'Death restarts the current level only. Coins collected in that run are lost on death and cannot be collected again on retry.' },
      rules_p2: { zh: '每关首次通关获得1颗星星，不可重复。商店里用金币购买皮肤。', en: 'First-time clears award one star per level; stars cannot be farmed. Spend coins in the shop for skins.' },
      rules_p3: { zh: '有其他玩家在线时，系统会随机匹配两人在同一关；碰到对方即失败。可送礼物或攻击。', en: 'When other players are online, you may be matched on the same level; touching them means death. You can send gifts or attacks.' },
      rules_p4: { zh: '这是陷阱游戏——别相信任何看起来安全的东西。', en: "This is a trap game—don't trust anything that looks safe." },
      back: { zh: '返回', en: 'Back' },
      press_continue: { zh: '按空格或点击继续', en: 'Press Space or tap to continue' },
      controls_title: { zh: '操作说明', en: 'Controls' },
      controls_pc_label: { zh: '电脑:', en: 'PC:' },
      controls_pc_text: { zh: '方向键 / WASD 移动，空格 / W 跳跃，E 互动', en: 'Arrows / WASD to move, Space / W to jump, E to interact' },
      controls_touch_label: { zh: '手机 / iPad:', en: 'Mobile / iPad:' },
      controls_touch_text: { zh: '使用屏幕虚拟按键；失败时点击任意处重试', en: 'Use on-screen buttons; tap anywhere to retry after death' },
      controls_enter_hint: { zh: '按空格或点击下方按钮进入地图', en: 'Press Space or tap the button below to enter the map' },
      enter_hub: { zh: '进入泡泡糖山谷', en: 'Enter Hubba-Dubba Valley' },
      controls_hint: { zh: '方向键/WASD移动，空格/W跳跃，E互动', en: 'Arrows/WASD move, Space/W jump, E interact' },
      touch_hint: { zh: '触屏使用屏幕按键；失败时点击任意处重试', en: 'Use touch buttons; tap anywhere to retry on death' },
    };
    const lang = this.settings.lang;
    return table[key]?.[lang] || table[key]?.zh || key;
  },

  tFormat(key, vars = {}) {
    let text = this.t(key);
    Object.entries(vars).forEach(([k, v]) => {
      text = text.replaceAll(`{${k}}`, String(v));
    });
    return text;
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

  isDemoUser() {
    const nick = String(this.profile?.nickname || '').trim().toLowerCase();
    return nick === 'demo';
  },

  syncDebugCoinsButton() {
    const btn = this.$('btnDebugCoins');
    if (btn) btn.classList.toggle('hidden', !this.isDemoUser());
  },

  setLanguage(lang) {
    const next = lang === 'en' ? 'en' : 'zh';
    this.settings.lang = next;
    this.settings.langChosen = true;
    this.saveSettings();
    this.applyUiLanguage();
  },

  syncLangToggle() {
    const zhBtn = this.$('langBtnZh');
    const enBtn = this.$('langBtnEn');
    if (zhBtn) zhBtn.classList.toggle('active', this.settings.lang === 'zh');
    if (enBtn) enBtn.classList.toggle('active', this.settings.lang === 'en');
  },

  applyUiLanguage() {
    document.documentElement.lang = this.settings.lang === 'en' ? 'en' : 'zh-CN';
    this.syncLangToggle();
    this.syncSettingsUi();
    this.syncPageChrome();
    const skipBtn = this.$('btnSkipLore');
    if (skipBtn && this.screen === 'lore') {
      skipBtn.textContent = this.settings.lang === 'en' ? 'Skip' : '跳过';
    }
    if (this.screen === 'login') this.renderLoginUi();
    else if (this.screen === 'title') this.renderTitleUi();
    else if (this.screen === 'controls') this.renderControlsUi();
    else if (this.screen === 'hub') this.renderHub();
    else if (this.screen === 'shop') this.renderShop();
    else if (this.screen === 'profile') this.renderProfile();
    else if (this.screen === 'leaderboard') this.loadLeaderboard();
    else if (this.screen === 'rules') this.renderRulesUi();
    window.GameController?.refreshGameUi?.();
  },

  syncPageChrome() {
    document.querySelectorAll('[data-back-hub]').forEach((btn) => {
      btn.textContent = this.t('back');
    });
    const titles = {
      shopTitle: 'shop_title',
      leaderboardTitle: 'rank',
      settingsTitle: 'settings',
      profileTitle: 'profile',
      rulesTitle: 'rules',
    };
    Object.entries(titles).forEach(([id, key]) => {
      const el = this.$(id);
      if (el) el.textContent = this.t(key);
    });
    const musicText = this.$('settingMusicText');
    if (musicText) musicText.textContent = this.t('settings_music');
    const langLabel = this.$('settingLangLabel');
    if (langLabel) langLabel.textContent = this.t('settings_language');
    const dbg = this.$('btnDebugCoins');
    if (dbg) dbg.title = this.t('debug_coins_title');
  },

  renderLoginUi() {
    const title = this.$('loginMainTitle');
    if (title) title.textContent = this.t('game_title');
    const sub = this.$('loginSubtitle');
    if (sub) sub.textContent = this.t('game_subtitle');
    const nickLabel = this.$('loginLabelNick');
    if (nickLabel) nickLabel.textContent = this.t('nickname');
    const passLabel = this.$('loginLabelPass');
    if (passLabel) passLabel.textContent = this.t('password');
    const loginBtn = this.$('btnLogin');
    if (loginBtn && !loginBtn.disabled) loginBtn.textContent = this.t('login');
    const regBtn = this.$('btnRegister');
    if (regBtn && !regBtn.disabled) regBtn.textContent = this.t('register');
    const demoBtn = this.$('btnDemoLogin');
    if (demoBtn && !demoBtn.disabled) demoBtn.textContent = this.t('demo_login');
    const hint = this.$('loginDemoHint');
    if (hint) {
      hint.innerHTML = this.settings.lang === 'en'
        ? 'Demo: <strong>demo</strong> / <strong>demo123</strong> — tap the button below to <strong>go to the map</strong>'
        : 'Demo：<strong>demo</strong> / <strong>demo123</strong> — 点下方按钮<strong>直接进入地图</strong>';
    }
  },

  renderTitleUi() {
    const name = this.$('titleLocalName');
    if (name) name.textContent = this.t('game_title');
    const hint = this.$('titleHint');
    if (hint) hint.textContent = this.t('press_continue');
  },

  renderControlsUi() {
    const title = this.$('controlsTitle');
    if (title) title.textContent = this.t('controls_title');
    const pcLabel = this.$('controlsPcLabel');
    if (pcLabel) pcLabel.textContent = this.t('controls_pc_label');
    const pcText = this.$('controlsPcText');
    if (pcText) pcText.textContent = this.t('controls_pc_text');
    const touchLabel = this.$('controlsTouchLabel');
    if (touchLabel) touchLabel.textContent = this.t('controls_touch_label');
    const touchText = this.$('controlsTouchText');
    if (touchText) touchText.textContent = this.t('controls_touch_text');
    const hint = this.$('controlsHint');
    if (hint) hint.textContent = this.t('controls_enter_hint');
    const hubBtn = this.$('btnToHub');
    if (hubBtn) hubBtn.textContent = this.t('enter_hub');
  },

  renderRulesUi() {
    const p1 = this.$('rulesP1');
    if (p1) p1.textContent = this.t('rules_p1');
    const p2 = this.$('rulesP2');
    if (p2) p2.textContent = this.t('rules_p2');
    const p3 = this.$('rulesP3');
    if (p3) p3.textContent = this.t('rules_p3');
    const p4 = this.$('rulesP4');
    if (p4) p4.textContent = this.t('rules_p4');
  },

  bindLangToggle() {
    this.$('langBtnZh')?.addEventListener('click', () => this.setLanguage('zh'));
    this.$('langBtnEn')?.addEventListener('click', () => this.setLanguage('en'));
  },

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
    if (name === 'settings') this.syncPageChrome();
    if (name === 'login') this.renderLoginUi();
    if (name === 'title') this.renderTitleUi();
    if (name === 'controls') this.renderControlsUi();
    if (name === 'rules') this.renderRulesUi();
    this.syncPageChrome();
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
    if (demo && loading) demo.textContent = this.t('logging_in');
    else if (demo) demo.textContent = this.t('demo_login');
    const loginBtn = this.$('btnLogin');
    if (loginBtn && !loading) loginBtn.textContent = this.t('login');
    const regBtn = this.$('btnRegister');
    if (regBtn && !loading) regBtn.textContent = this.t('register');
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
    this.showToast(this.tFormat('hub_welcome', {
      name: this.profile?.nickname || this.t('player_default'),
    }));
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
    if (el) el.textContent = n > 0 ? this.tFormat('online_badge', { n }) : '';
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
    this.syncLangToggle();
    window.GameController?.refreshGameUi?.();
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
      if (res?.ok && res.profile && this.profile) {
        const token = this.profile.token;
        this.profile = this.normalizeProfile({ ...this.profile, ...res.profile, token });
        this.cacheProgress();
      }
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
    this.bindLangToggle();
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
      if (err) err.textContent = this.t('err_need_credentials');
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
        if (err) err.textContent = res?.error || this.t('err_login_failed');
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
      if (err) err.textContent = `${this.t('err_login_failed')}: ${e.message || this.t('err_login_unknown')}`;
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
      if (chk?.exists) { if (err) err.textContent = this.t('err_nick_taken'); return; }
      const res = await this.api('auth.php', { action: 'register', nickname: nick, password: pass });
      if (!res?.ok) { if (err) err.textContent = res?.error || this.t('err_register_failed'); return; }
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

  renderHubUi(currentLevel = 1) {
    const title = this.$('hubTitle');
    if (title) title.textContent = this.t('hub_title');
    const continueLabel = this.$('continueLevelLabel');
    if (continueLabel) continueLabel.textContent = this.tFormat('continue_level', { n: currentLevel });
    const navShop = this.$('navShop');
    if (navShop) navShop.textContent = this.t('shop');
    const navRank = this.$('navRank');
    if (navRank) navRank.textContent = this.t('rank');
    const navSettings = this.$('navSettings');
    if (navSettings) navSettings.textContent = this.t('settings');
    const navProfile = this.$('navProfile');
    if (navProfile) navProfile.textContent = this.t('profile');
    const navRules = this.$('navRules');
    if (navRules) navRules.textContent = this.t('rules');
  },

  renderHub() {
    const map = this.$('levelMap');
    if (!map) return;
    map.innerHTML = '';
    const stars = this.profile?.levelStars || [];
    const max = this.highestUnlockedLevel(this.profile);
    const current = Math.max(0, Math.min(max, Number(this.profile?.currentLevel) || 0));
    this.renderHubUi(current + 1);
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
        if (i > max) { this.showToast(this.t('hub_locked_level')); return; }
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
      this.showToast(this.t('game_not_ready'));
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
    if (!this.profile) return;
    if (newStar) {
      if (!this.profile.levelStars) this.profile.levelStars = [];
      this.profile.levelStars[levelIndex] = true;
      this.profile.currentLevel = Math.min(levelIndex + 1, 19);
    } else {
      this.profile.currentLevel = levelIndex;
    }
    if (typeof GameController?.bankCoins === 'number') {
      this.profile.coins = GameController.bankCoins;
    } else if (levelCoins > 0) {
      this.profile.coins = (Number(this.profile.coins) || 0) + levelCoins;
    }
    this.profile.stars = this.countStars();
    this.syncMaxLevel(this.profile);
    this.cacheProgress();
    this.saveProfile({ immediate: true });
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
    this.syncDebugCoinsButton();
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
      priceEl.textContent = item.price > 0 ? `${item.price} 🪙` : this.t('shop_free');
    }

    const actionEl = this.$('skinAction');
    if (actionEl) {
      actionEl.classList.remove('equipped');
      actionEl.disabled = false;
      if (equipped) {
        actionEl.textContent = this.t('shop_equipped');
        actionEl.classList.add('equipped');
        actionEl.disabled = true;
      } else if (owned) {
        actionEl.textContent = this.t('shop_equip');
      } else {
        actionEl.textContent = this.tFormat('shop_buy', { price: item.price });
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
        actionEl.textContent = this.t('shop_equipped');
        actionEl.classList.add('equipped');
        actionEl.disabled = true;
      } else if (owned) {
        actionEl.textContent = this.t('shop_equip');
      } else {
        actionEl.textContent = this.tFormat('shop_buy', { price: item.price });
      }
    }
    const unequipEl = this.$('trailUnequip');
    if (unequipEl) {
      unequipEl.disabled = !hasTrailEquipped;
      unequipEl.textContent = hasTrailEquipped ? this.t('trail_unequip_btn') : this.t('trail_not_equipped');
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
    this.showToast(owned ? this.t('toast_equipped') : this.t('toast_purchase_ok'));
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
    this.showToast(owned ? this.t('toast_trail_equipped') : this.t('toast_purchase_ok'));
    this.renderShop();
    this.saveProfile();
  },

  async unequipTrail() {
    if (!this.profile) return;
    if ((this.profile.trail || 'none') === 'none') return;
    this.profile.trail = 'none';
    this.showToast(this.t('toast_trail_removed'));
    this.renderShop();
    this.saveProfile();
  },

  debugAddCoins(amount = 100) {
    if (!this.isDemoUser()) return;
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
    if (coins < price) return { ok: false, error: this.t('err_insufficient_coins') };
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
    if (coins < price) return { ok: false, error: this.t('err_insufficient_coins') };
    this.profile.coins = coins - price;
    const ownedList = Array.isArray(this.profile.owned) ? [...this.profile.owned] : [];
    if (!ownedList.includes(item.id)) ownedList.push(item.id);
    this.profile.owned = ownedList;
    this.profile.trail = item.id;
    return { ok: true };
  },

  async loadLeaderboard() {
    this.syncPageChrome();
    const list = this.$('leaderboardList');
    if (!list) return;
    list.innerHTML = `<p>${this.t('leaderboard_loading')}</p>`;
    const res = await this.api('leaderboard.php', { action: 'list' });
    if (!res.ok) { list.innerHTML = `<p>${this.t('leaderboard_failed')}</p>`; return; }
    list.innerHTML = '';
    res.leaderboard.forEach((row, i) => {
      const li = document.createElement('li');
      li.innerHTML = `<span class="rank">#${i + 1}</span> <strong>${row.nickname}</strong> ★${row.stars} 🪙${row.coins} Lv${(row.maxLevel || 0) + 1}`;
      list.appendChild(li);
    });
  },

  renderProfile() {
    this.syncPageChrome();
    const el = this.$('profileBody');
    if (!el || !this.profile) return;
    const lang = this.settings.lang;
    const skin = SHOP_CATALOG.skins.find((s) => s.id === this.profile.skin);
    const skinName = skin?.name?.[lang] || skin?.name?.zh || this.t('profile_default_skin');
    el.innerHTML = `
      <div class="profile-avatar skin-${this.profile.skin || 'default'}"></div>
      <h3>${this.profile.nickname}</h3>
      <p>${this.t('profile_skin')} ${skinName}</p>
      <p>★ ${this.countStars()} | 🪙 ${this.profile.coins || 0}</p>
      <p>${this.t('profile_highest')} ${Math.max(0, this.highestCompletedLevel(this.profile) + 1)}</p>
      <p>${this.t('profile_current')} ${(Number(this.profile.currentLevel) || 0) + 1}</p>
    `;
  },

  bindSettings() {
    this.$('settingMusic')?.addEventListener('change', (e) => {
      this.settings.music = e.target.checked;
      this.saveSettings();
    });
    this.$('settingLang')?.addEventListener('change', (e) => {
      this.setLanguage(e.target.value);
    });
  },
};

document.addEventListener('DOMContentLoaded', () => App.init());

window.App = App;
