/**
 * Bubble Gum Factory - Main Game Controller
 */
(() => {
  const canvas = document.getElementById('gameCanvas');
  if (!canvas) return;
  const engine = new GameEngine(canvas);

  let currentLevel = 0;
  let player = null;
  let bankCoins = 0;
  let levelCoins = 0;
  let gameState = 'idle';
  let lastTime = 0;
  let animId = null;
  let profile = null;
  let remotePlayer = null;
  let remoteMatch = null;
  let animTimer = null;
  let earnedStar = false;
  let imagesReady = false;
  let snackPanelOpen = false;
  let levelSnackUnlocked = {};
  let activeSnackId = null;
  let blockedPowerupToastAt = 0;
  let snackListBuilt = false;
  let levelDeathCount = 0;
  let snackOfferVisible = false;
  let hoveredSnackPreviewId = null;
  let lastDeathReason = null;
  let readyResolve;
  const ready = new Promise((r) => { readyResolve = r; });
  const POWERUP_ICONS = ['👑', '🥚', '💖', '🔥', '🍄', '⚡', '⬆️', '🪽'];
  const POWER_NOTICE_MIN_MS = 100;
  const SNACK_LEVEL_DURATION = 24 * 60 * 60 * 1000;
  const SNACK_EFFECTS = {
    snack_bullet: {
      iconType: 5,
      label: { zh: { head: '炮弹变身', detail: '变身为炮弹，移动速度 ×3' }, en: { head: 'Bullet Form', detail: 'Become a bullet — 3× move speed' } },
      apply(p) { p.bulletForm = true; },
    },
    snack_block: {
      iconType: 4,
      label: { zh: { head: '砖块糖粉', detail: '可顶碎砖块' }, en: { head: 'Block Powder', detail: 'Smash bricks from below' } },
      apply(p) { p.canBreakBricks = true; p.big = true; },
    },
    snack_waffle: {
      iconType: 7,
      label: { zh: { head: '管道滑行', detail: '起跳后向前滑行、缓慢飘落' }, en: { head: 'Pipe Slide', detail: 'Jump, slide forward, float down slowly' } },
      apply(p) { p.waffleGlide = true; },
    },
    snack_locket: {
      iconType: 0,
      label: { zh: { head: '力量吊坠', detail: '短暂无敌 + 闪光' }, en: { head: 'Power Locket', detail: 'Brief invincibility' } },
      apply(p, eng) { p.invincible = 8000; p.sparkleFx = true; eng.triggerCameraShake(180, 3); },
    },
    snack_goomba: {
      iconType: 2,
      label: { zh: { head: '栗宝宝软糖', detail: '踩扁敌人 + 恢复生命' }, en: { head: 'Goomba Gummies', detail: 'Stomp foes + heal' } },
      apply(p) { p.canStompEnemies = true; p.lives = Math.min(p.lives + 1, 5); },
    },
    snack_flower: {
      iconType: 3,
      label: { zh: { head: '火之花糖', detail: '触碰烧灭敌人 + 耳旁冒烟' }, en: { head: 'Fire Flower', detail: 'Burn enemies on touch' } },
      apply(p) { p.fireTouch = true; p.smokeFx = true; },
    },
    snack_soda: {
      iconType: 5,
      label: { zh: { head: '花卉苏打', detail: '加速 + 饱嗝震屏' }, en: { head: 'Flower Soda', detail: 'Speed boost + screen shake' } },
      apply(p, eng) { p.speedBoost = true; eng.triggerCameraShake(520, 8); },
    },
    snack_yoshi: {
      iconType: 6,
      label: { zh: { head: '耀西特调', detail: '高跳 + 滞空飘浮' }, en: { head: "Yoshi's Drink", detail: 'High jump + flutter' } },
      apply(p) { p.highJump = true; p.flutterJump = true; },
    },
    snack_pasta: {
      iconType: 3,
      label: { zh: { head: '库巴烈火面', detail: '辣跑加速 + 灼烧敌人' }, en: { head: 'Fire Pasta', detail: 'Sprint + burn enemies' } },
      apply(p) { p.speedBoost = true; p.fireTouch = true; p.spinFx = true; },
    },
    snack_mushroom: {
      iconType: 4,
      label: { zh: { head: '超级蘑菇糖', detail: '变大 + 抵挡一次伤害' }, en: { head: 'Super Mushroom', detail: 'Grow big + one hit shield' } },
      apply(p) { p.big = true; p.hitShield = true; },
    },
    snack_star: {
      iconType: 0,
      label: { zh: { head: '星星糖', detail: '本关无敌' }, en: { head: 'Star Candy', detail: 'Invincible this level' } },
      apply(p) { p.invincible = SNACK_LEVEL_DURATION; p.sparkleFx = true; },
    },
    snack_shy: {
      iconType: 7,
      label: { zh: { head: '嘿呵糖浆', detail: '轻飘跳跃 + 嘿呵叫声' }, en: { head: 'Shy Guy Syrup', detail: 'Floaty jumps + squeak' } },
      apply(p) { p.lowGravSnack = true; p.canGlide = true; },
    },
  };
  const SNACK_LIST = (typeof SHOP_CATALOG !== 'undefined' && Array.isArray(SHOP_CATALOG.snacks))
    ? SHOP_CATALOG.snacks
    : [];
  const SNACK_BY_ID = Object.fromEntries(SNACK_LIST.map((s) => [s.id, s]));
  const POWERUP_SPRITE_POS = [
    '0% 0%',
    '33.333% 0%',
    '66.666% 0%',
    '100% 0%',
    '0% 33.333%',
    '33.333% 33.333%',
    '66.666% 33.333%',
    '100% 33.333%',
  ];

  const input = { left: false, right: false, jump: false, interact: false };
  const $ = (id) => document.getElementById(id);

  function resetInputState() {
    input.left = input.right = input.jump = input.interact = false;
  }

  async function unlockAudio() {
    if (typeof gameAudio !== 'undefined') {
      await gameAudio.unlock();
    }
  }

  const LEVEL_NAMES_EN = [
    'Bouncy Bubble Gum', 'Gel Slow Zone', 'Bubble Gum Vents', 'Bubble Monsters', 'Cross Factory',
    'Melting Candy', 'Galaxy Elements', 'Moving Platforms', 'Rest Stop', 'Spinning Rollers',
    'Fake Platform Trap', 'Elevators', 'Pipe Maze', 'Power-up Gauntlet', 'Spike Array',
    'Low Gravity Zone', 'Switch Chain', 'Bubble Chase', 'Ultimate Mix', 'Factory Summit',
  ];

  const POWERUP_LABELS = {
    zh: [
      { head: '超级皇冠', detail: '短暂无敌' },
      { head: '耀西蛋', detail: '额外生命' },
      { head: '心之花', detail: '恢复生命' },
      { head: '火焰花', detail: '火焰强化' },
      { head: '紫蘑菇', detail: '变大' },
      { head: '加速蘑菇', detail: '速度提升' },
      { head: '高跳蘑菇', detail: '跳跃强化' },
      { head: 'Peachette', detail: '滑翔' },
    ],
    en: [
      { head: 'Super Crown', detail: 'Brief invincibility' },
      { head: 'Yoshi Egg', detail: 'Extra life' },
      { head: 'Heart Flower', detail: 'Heal' },
      { head: 'Fire Flower', detail: 'Fire boost' },
      { head: 'Mega Mushroom', detail: 'Grow big' },
      { head: 'Speed Mushroom', detail: 'Speed boost' },
      { head: 'High Jump Mushroom', detail: 'High jump' },
      { head: 'Peachette', detail: 'Glide' },
    ],
  };

  const GAME_UI = {
    level_label: { zh: '关卡 {n} / 20 - {name}', en: 'Level {n} / 20 - {name}' },
    coins_label: { zh: '金币: {total}{suffix}', en: 'Coins: {total}{suffix}' },
    coins_replay_suffix: { zh: ' (本关金币已领取)', en: ' (level coins claimed)' },
    coins_level_suffix: { zh: ' (本关 {n})', en: ' (this run {n})' },
    return_hub: { zh: '返回大厅', en: 'Back to Hub' },
    mp_gift: { zh: '送礼', en: 'Gift' },
    mp_attack: { zh: '攻击', en: 'Attack' },
    mp_no_opponent: { zh: '暂无对手', en: 'No opponent' },
    mp_no_opponent_toast: { zh: '暂无在线对手', en: 'No online opponent' },
    touch_jump: { zh: '跳', en: 'Jump' },
    touch_interact: { zh: 'E', en: 'E' },
    power_snack_active: { zh: '当前零食：{name}', en: 'Active snack: {name}' },
    power_snack_detail: { zh: '零食生效中，未拾取 Power-up', en: 'Snack active; Power-ups blocked' },
    power_random: { zh: '随机加成', en: 'Random boost' },
    power_current: { zh: '当前加成', en: 'Active boost' },
    power_timer: { zh: '{name}（{time}）', en: '{name} ({time})' },
    power_effect: { zh: '词条效果：{detail}', en: 'Effect: {detail}' },
    power_effect_active: { zh: '效果生效中', en: 'Effect active' },
    death_player: { zh: '碰到了其他玩家！', en: 'You bumped into another player!' },
    death_default: { zh: '泡泡糖爆炸！点击任意处或按空格/R重试', en: 'Bubble gum burst! Tap anywhere or press Space/R to retry' },
    game_over_title: { zh: '再试一次!', en: 'Try Again!' },
    level_complete_title: { zh: '关卡完成!', en: 'Level Complete!' },
    level_complete_hint: { zh: '按空格或点击任意处继续', en: 'Press Space or tap anywhere to continue' },
    btn_next: { zh: '下一关', en: 'Next Level' },
    complete_msg: { zh: '{name} 完成！', en: '{name} cleared!' },
    complete_star: { zh: ' 获得 ★ 1 颗星星！', en: ' Earned ★ 1 star!' },
    complete_star_claimed: { zh: ' (本关星星已领取)', en: ' (star already claimed)' },
    complete_coins: { zh: ' 本关金币 +{n} 已存入银行。', en: ' +{n} coins saved to the bank.' },
    complete_coins_claimed: { zh: ' (重复游玩，本关金币已领取)', en: ' (replay; level coins already claimed)' },
    victory_title: { zh: '工厂之巅!', en: 'Factory Summit!' },
    victory_body: { zh: '马力欧吐掉了最后一口泡泡糖。混乱的噩梦结束了！', en: 'Mario spat out the last piece of bubble gum. The chaotic nightmare is over!' },
    victory_stats: { zh: '共获得 {stars} 颗星星，银行金币 {coins}！', en: 'Total {stars} stars, {coins} coins in the bank!' },
    victory_hub: { zh: '返回地图', en: 'Back to Map' },
    snack_offer_title: { zh: '要不要试一试「零食」？', en: 'Want to try a snack?' },
    snack_offer_body: { zh: '本关已经失败了 3 次。按空格打开零食菜单，用词条加成再挑战一次。', en: 'You have failed this level 3 times. Press Space to open snacks and boost your next attempt.' },
    snack_offer_hint: { zh: '按空格打开零食 · 点击取消将重新开始本关', en: 'Press Space for snacks · Cancel restarts the level' },
    snack_offer_cancel: { zh: '取消', en: 'Cancel' },
    toast_snack_off: { zh: '已关闭零食效果', en: 'Snack effect turned off' },
    toast_no_coins: { zh: '金币不足', en: 'Not enough coins' },
    toast_snack_on: { zh: '零食生效，期间不会捡起 Power-up', en: 'Snack active; Power-ups will be blocked' },
    toast_powerup_blocked: { zh: '零食生效中，未拾取 Power-up', en: 'Snack active; Power-up not collected' },
    toast_retry_r: { zh: '已按 R 重试当前关卡', en: 'Retried current level (R)' },
    unknown_snack: { zh: '未知零食', en: 'Unknown snack' },
  };

  function show(el) { if (el) el.classList.remove('hidden'); }
  function hide(el) { if (el) el.classList.add('hidden'); }

  function showSnackOfferDialog() {
    snackOfferVisible = true;
    updateSnackOfferUi();
    show($('snackOfferDialog'));
  }

  function hideSnackOfferDialog() {
    snackOfferVisible = false;
    hide($('snackOfferDialog'));
  }

  function gameUi(key) {
    const lang = snackLang();
    return GAME_UI[key]?.[lang] || GAME_UI[key]?.zh || key;
  }

  function gameUiFormat(key, vars = {}) {
    let text = gameUi(key);
    Object.entries(vars).forEach(([k, v]) => {
      text = text.replaceAll(`{${k}}`, String(v));
    });
    return text;
  }

  function levelDisplayName(levelIndex = currentLevel) {
    const ld = LEVEL_DATA[levelIndex];
    if (!ld) return '';
    if (snackLang() === 'en') return LEVEL_NAMES_EN[levelIndex] || ld.name;
    return ld.name;
  }

  function powerupLabel(powerType) {
    const lang = snackLang();
    const list = POWERUP_LABELS[lang] || POWERUP_LABELS.zh;
    return list[powerType] || { head: `${gameUi('power_effect_active')} ${powerType + 1}`, detail: gameUi('power_effect_active') };
  }

  function updateSnackOfferUi() {
    const title = $('snackOfferTitle');
    if (title) title.textContent = gameUi('snack_offer_title');
    const body = $('snackOfferBody');
    if (body) body.innerHTML = snackLang() === 'en'
      ? 'You have failed this level 3 times. Press <strong>Space</strong> to open snacks and boost your next attempt.'
      : '本关已经失败了 3 次。按<strong>空格</strong>打开零食菜单，用词条加成再挑战一次。';
    const hint = $('snackOfferHint');
    if (hint) hint.textContent = gameUi('snack_offer_hint');
    const cancel = $('btnSnackOfferCancel');
    if (cancel) cancel.textContent = gameUi('snack_offer_cancel');
  }

  function updateGameOverUi() {
    const title = $('gameOverTitle');
    if (title) title.textContent = gameUi('game_over_title');
    const msg = $('gameOverMsg');
    if (msg) {
      msg.textContent = lastDeathReason === 'player'
        ? gameUi('death_player')
        : gameUi('death_default');
    }
  }

  function updateLevelCompleteUi() {
    const title = $('levelCompleteTitle');
    if (title) title.textContent = gameUi('level_complete_title');
    const hint = $('levelCompleteHint');
    if (hint) hint.textContent = gameUi('level_complete_hint');
    const btn = $('btnNext');
    if (btn) btn.textContent = gameUi('btn_next');
    const msgEl = $('levelCompleteMsg');
    if (!msgEl) return;
    const ls = profile?.levelStars || [];
    const alreadyCleared = !!ls[currentLevel];
    const coinsToBank = alreadyCleared ? 0 : levelCoins;
    let msg = gameUiFormat('complete_msg', { name: levelDisplayName(currentLevel) });
    if (earnedStar) msg += gameUi('complete_star');
    else msg += gameUi('complete_star_claimed');
    if (coinsToBank > 0) msg += gameUiFormat('complete_coins', { n: coinsToBank });
    else if (alreadyCleared) msg += gameUi('complete_coins_claimed');
    msgEl.textContent = msg;
  }

  function updateVictoryUi() {
    const title = $('victoryTitle');
    if (title) title.textContent = gameUi('victory_title');
    const body = $('victoryBody');
    if (body) body.textContent = gameUi('victory_body');
    const stats = $('victoryStats');
    if (stats) {
      stats.textContent = gameUiFormat('victory_stats', {
        stars: App?.countStars?.() || 0,
        coins: bankCoins,
      });
    }
    const hubBtn = $('btnVictoryHub');
    if (hubBtn) hubBtn.textContent = gameUi('victory_hub');
  }

  function updateGameChrome() {
    updateSnackPanelChrome();
    updateSnackOfferUi();
    const hubBtn = $('btnHub');
    if (hubBtn) hubBtn.textContent = gameUi('return_hub');
    const giftBtn = $('btnMpGift');
    if (giftBtn) giftBtn.textContent = gameUi('mp_gift');
    const attackBtn = $('btnMpAttack');
    if (attackBtn) attackBtn.textContent = gameUi('mp_attack');
    const snackToggle = $('btnSnackPanel');
    if (snackToggle) snackToggle.textContent = snackUi('btn_toggle');
    const jumpBtn = $('btnJump');
    if (jumpBtn) jumpBtn.textContent = gameUi('touch_jump');
    const interactBtn = $('btnInteract');
    if (interactBtn) interactBtn.textContent = gameUi('touch_interact');
    updateGameOverUi();
    updateLevelCompleteUi();
    updateVictoryUi();
  }

  function refreshGameUi() {
    updateGameChrome();
    updateHUD();
    updateSnackPanel();
  }

  const SNACK_UI = {
    panel_title: { zh: '零食词条（局内）', en: 'In-level Snacks' },
    panel_tip: { zh: '局内零食词条（一次仅生效一个）', en: 'Only one snack effect at a time.' },
    active_none: { zh: '当前：未激活', en: 'Active: None' },
    active_prefix: { zh: '当前：', en: 'Active: ' },
    btn_toggle: { zh: '零食(Q)', en: 'Snacks (Q)' },
    btn_close: { zh: '关闭', en: 'Close' },
    btn_deactivate: { zh: '关闭效果', en: 'Turn off' },
    btn_use_unlocked: { zh: '使用（已解锁）', en: 'Use (unlocked)' },
    btn_buy_use: { zh: '购买并使用', en: 'Buy & use' },
    effect_fallback: { zh: '词条效果', en: 'Snack effect' },
  };

  const POWERUP_EFFECT = {
    zh: ['短暂无敌', '额外生命', '恢复生命', '火焰强化', '变大', '速度提升', '跳跃强化', '滑翔'],
    en: ['Brief invincibility', 'Extra life', 'Heal', 'Fire boost', 'Grow big', 'Speed boost', 'High jump', 'Glide'],
  };

  function snackLang() {
    return App?.settings?.lang === 'en' ? 'en' : 'zh';
  }

  function snackUi(key) {
    const lang = snackLang();
    return SNACK_UI[key]?.[lang] || SNACK_UI[key]?.zh || key;
  }

  function snackLocalizedName(snackId) {
    const snack = SNACK_BY_ID[snackId];
    const lang = snackLang();
    return snack?.name?.[lang] || snack?.name?.zh || snackId || '';
  }

  function snackName(snackId) {
    return snackLocalizedName(snackId) || snackId || gameUi('unknown_snack');
  }

  function snackDescText(snackId) {
    const snack = SNACK_BY_ID[snackId];
    const lang = snackLang();
    return snack?.desc?.[lang] || snack?.desc?.zh || '';
  }

  function snackImageUrl(snackId) {
    const name = SNACK_BY_ID[snackId]?.name?.zh;
    return name ? `images/snack/${name}.png` : '';
  }

  function updateSnackPreviewText(snackId) {
    const nameEl = $('snackPreviewName');
    const descEl = $('snackPreviewDesc');
    if (!snackId) {
      if (nameEl) nameEl.textContent = '';
      if (descEl) descEl.textContent = '';
      return;
    }
    if (nameEl) nameEl.textContent = snackLocalizedName(snackId);
    if (descEl) descEl.textContent = snackDescText(snackId);
  }

  function clearSnackPreview() {
    hoveredSnackPreviewId = null;
    const preview = $('snackPreview');
    const img = $('snackPreviewImg');
    if (img) {
      img.removeAttribute('src');
      img.alt = '';
    }
    updateSnackPreviewText(null);
    preview?.classList.add('is-idle');
  }

  function showSnackPreview(snackId) {
    if (!snackId) {
      clearSnackPreview();
      return;
    }
    const img = $('snackPreviewImg');
    const url = snackImageUrl(snackId);
    if (!img || !url) return;
    hoveredSnackPreviewId = snackId;
    $('snackPreview')?.classList.remove('is-idle');
    img.src = url;
    img.alt = snackName(snackId);
    updateSnackPreviewText(snackId);
  }

  function refreshSnackPreview() {
    if (hoveredSnackPreviewId && SNACK_BY_ID[hoveredSnackPreviewId]) {
      showSnackPreview(hoveredSnackPreviewId);
    } else {
      clearSnackPreview();
    }
  }

  function snackEffectLabel(snackId) {
    const fx = SNACK_EFFECTS[snackId];
    const lang = snackLang();
    return fx?.label?.[lang] || fx?.label?.zh || { head: snackUi('effect_fallback'), detail: '' };
  }

  function snackEffectText(snackId) {
    const { detail, head } = snackEffectLabel(snackId);
    return detail || head || snackUi('effect_fallback');
  }

  function updateSnackPanelChrome() {
    const titleEl = $('snackPanelTitle');
    if (titleEl) titleEl.textContent = snackUi('panel_title');
    const tipEl = $('snackPanelTip');
    if (tipEl) tipEl.textContent = snackUi('panel_tip');
    const closeBtn = $('btnSnackClose');
    if (closeBtn) closeBtn.textContent = snackUi('btn_close');
    const toggleBtn = $('btnSnackPanel');
    if (toggleBtn) toggleBtn.textContent = snackUi('btn_toggle');
  }

  function refreshSnackPanel() {
    updateSnackPanelChrome();
    refreshSnackPreview();
    updateSnackPanel();
  }

  function applySnackEffectToPlayer(snackId) {
    if (!player) return;
    const fx = SNACK_EFFECTS[snackId];
    if (!fx) return;
    engine.clearPower(player);
    if (profile?.jumpBoots) player.highJump = true;
    player.powerType = fx.iconType ?? 0;
    player.powerSource = 'snack';
    player.snackId = snackId;
    player.powerTimer = SNACK_LEVEL_DURATION;
    fx.apply(player, engine);
    if (typeof gameAudio !== 'undefined') {
      if (snackId === 'snack_shy') gameAudio.playJump();
      else if (snackId === 'snack_bullet') gameAudio.playPowerup(5);
      else gameAudio.playPowerup(fx.iconType ?? 0);
    }
  }

  function deactivateSnackEffect({ silent = false } = {}) {
    activeSnackId = null;
    if (player?.powerSource === 'snack') engine.clearPower(player);
    if (player && profile?.jumpBoots) player.highJump = true;
    if (!silent) App?.showToast?.(gameUi('toast_snack_off'));
    updateSnackPanel();
    updateHUD();
  }

  function activateSnack(snackId, options = {}) {
    const { skipCost = false, silent = false } = options;
    const snack = SNACK_BY_ID[snackId];
    if (!snack || !profile) return false;
    if (!levelSnackUnlocked[snackId] && !skipCost) {
      const price = Number(snack.price) || 0;
      if ((profile.coins || 0) < price) {
        App?.showToast?.(gameUi('toast_no_coins'));
        return false;
      }
      profile.coins -= price;
      bankCoins = profile.coins;
      levelSnackUnlocked[snackId] = true;
      App?.saveProfile?.();
    } else if (skipCost) {
      levelSnackUnlocked[snackId] = true;
    }
    activeSnackId = snackId;
    applySnackEffectToPlayer(snackId);
    showSnackPreview(snackId);
    if (!silent) App?.showToast?.(gameUi('toast_snack_on'));
    updateSnackPanel();
    updateHUD();
    return true;
  }

  function setSnackPanelOpen(open) {
    snackPanelOpen = !!open;
    const panel = $('snackPanel');
    if (panel) panel.classList.toggle('hidden', !snackPanelOpen);
    if (snackPanelOpen) {
      updateSnackPanelChrome();
      clearSnackPreview();
      updateSnackPanel();
    } else {
      clearSnackPreview();
    }
  }

  function toggleSnackPanel() {
    setSnackPanelOpen(!snackPanelOpen);
  }

  function buildSnackPanelList() {
    const box = $('snackList');
    if (!box || snackListBuilt) return;
    snackListBuilt = true;
    const panel = $('snackPanel');
    if (panel && !panel.dataset.previewBound) {
      panel.dataset.previewBound = '1';
      panel.addEventListener('mouseleave', clearSnackPreview);
    }
    box.innerHTML = '';
    for (const snack of SNACK_LIST) {
      const row = document.createElement('div');
      row.className = 'snack-item';
      row.dataset.snack = snack.id;
      row.addEventListener('mouseenter', () => showSnackPreview(snack.id));
      const left = document.createElement('div');
      left.dataset.snackText = snack.id;
      left.innerHTML = `
        <div class="snack-item-title">${snackLocalizedName(snack.id)}</div>
        <div class="snack-item-sub">${snack.price} 🪙 · ${snackEffectText(snack.id)}</div>
      `;
      const btn = document.createElement('button');
      btn.className = 'snack-item-btn';
      btn.dataset.snack = snack.id;
      btn.type = 'button';
      btn.addEventListener('click', () => {
        if (activeSnackId === snack.id) {
          deactivateSnackEffect({ silent: true });
          return;
        }
        activateSnack(snack.id);
      });
      row.appendChild(left);
      row.appendChild(btn);
      box.appendChild(row);
    }
    clearSnackPreview();
    updateSnackPanel();
  }

  function updateSnackPanel() {
    const coinsEl = $('snackCoins');
    if (coinsEl) coinsEl.textContent = String(profile?.coins ?? bankCoins ?? 0);
    const activeEl = $('snackActiveLabel');
    if (activeEl) {
      activeEl.textContent = activeSnackId
        ? `${snackUi('active_prefix')}${snackName(activeSnackId)}`
        : snackUi('active_none');
    }
    const box = $('snackList');
    if (!box) return;
    box.querySelectorAll('[data-snack-text]').forEach((el) => {
      const snackId = el.dataset.snackText;
      const snack = SNACK_BY_ID[snackId];
      if (!snack) return;
      const titleEl = el.querySelector('.snack-item-title');
      const subEl = el.querySelector('.snack-item-sub');
      if (titleEl) titleEl.textContent = snackLocalizedName(snackId);
      if (subEl) subEl.textContent = `${snack.price} 🪙 · ${snackEffectText(snackId)}`;
    });
    box.querySelectorAll('.snack-item-btn').forEach((btn) => {
      const snackId = btn.dataset.snack;
      const snack = SNACK_BY_ID[snackId];
      if (!snack) return;
      const unlocked = !!levelSnackUnlocked[snackId];
      const active = activeSnackId === snackId;
      btn.classList.remove('active', 'unlocked');
      if (active) {
        btn.classList.add('active');
        btn.textContent = snackUi('btn_deactivate');
      } else if (unlocked) {
        btn.classList.add('unlocked');
        btn.textContent = snackUi('btn_use_unlocked');
      } else {
        btn.textContent = `${snackUi('btn_buy_use')} ${snack.price} 🪙`;
      }
    });
  }

  function totalDisplay() {
    return bankCoins + levelCoins;
  }

  function updateHUD() {
    if (player) levelCoins = player.levelCoins || 0;
    if (activeSnackId && player?.powerSource !== 'snack') {
      activeSnackId = null;
    }
    const ld = LEVEL_DATA[currentLevel];
    const label = $('levelLabel');
    if (label && ld) {
      label.textContent = gameUiFormat('level_label', {
        n: currentLevel + 1,
        name: levelDisplayName(currentLevel),
      });
    }
    const coinEl = $('coinLabel');
    if (coinEl) {
      const replay = isLevelCleared();
      const suffix = replay
        ? gameUi('coins_replay_suffix')
        : gameUiFormat('coins_level_suffix', { n: levelCoins });
      coinEl.textContent = gameUiFormat('coins_label', { total: totalDisplay(), suffix });
    }
    updatePowerNotice(gameState === 'playing');
    const mp = $('mpActions');
    if (mp) {
      if (gameState === 'idle') {
        mp.classList.add('hidden');
      } else {
        mp.classList.remove('hidden');
        const opp = $('mpOpponent');
        if (opp) {
          if (remotePlayer && remoteMatch?.level === currentLevel) {
            opp.textContent = remoteMatch.opponent || remotePlayer.nickname || '';
          } else {
            opp.textContent = gameUi('mp_no_opponent');
          }
        }
      }
    }
    updateSnackPanel();
  }

  function updatePowerNotice(allowShow = true) {
    const notice = $('powerNotice');
    const mainEl = $('powerNoticeMain');
    const detailEl = $('powerNoticeDetail');
    const iconEl = $('powerNoticeIcon');
    if (!notice || !mainEl || !detailEl || !iconEl) return;
    const remainMs = Math.max(0, Number(player?.powerTimer) || 0);
    if (!allowShow || !player || player.powerType < 0 || remainMs < POWER_NOTICE_MIN_MS) {
      notice.classList.add('hidden');
      mainEl.textContent = '';
      detailEl.textContent = '';
      iconEl.classList.remove('sprite');
      iconEl.style.backgroundPosition = '';
      iconEl.textContent = '';
      return;
    }
    if (notice.classList.contains('hidden')) {
      notice.classList.remove('hidden');
    }
    const { head: shortName, detail: effectDetail } = powerupLabel(player.powerType);
    const remainText = remainMs >= 1000
      ? `${Math.ceil(remainMs / 1000)}s`
      : `${Math.max(0.1, remainMs / 1000).toFixed(1)}s`;
    const isRandom = player.powerSource === 'random';
    if (player.powerSource === 'snack' && activeSnackId) {
      const snackLabel = snackEffectLabel(activeSnackId);
      mainEl.textContent = gameUiFormat('power_snack_active', { name: snackName(activeSnackId) });
      detailEl.textContent = snackLabel.detail || gameUi('power_snack_detail');
      iconEl.classList.remove('sprite');
      iconEl.style.backgroundPosition = '';
      iconEl.textContent = '🍬';
      return;
    }
    mainEl.textContent = gameUiFormat('power_timer', {
      name: `${isRandom ? gameUi('power_random') : gameUi('power_current')}: ${shortName}`,
      time: remainText,
    });
    detailEl.textContent = gameUiFormat('power_effect', {
      detail: effectDetail || gameUi('power_effect_active'),
    });
    const spritePos = POWERUP_SPRITE_POS[player.powerType];
    if (spritePos) {
      iconEl.classList.add('sprite');
      iconEl.style.backgroundPosition = spritePos;
      iconEl.textContent = '';
    } else {
      iconEl.classList.remove('sprite');
      iconEl.style.backgroundPosition = '';
      iconEl.textContent = POWERUP_ICONS[player.powerType] || '✨';
    }
  }

  function applyProfile(p) {
    profile = p;
    bankCoins = p?.coins || 0;
    if (player) {
      player.skin = p?.skin || 'skin_default';
      player.trail = p?.trail || 'none';
      player.splat = p?.splat || 'default';
      if (p?.jumpBoots) player.highJump = true;
      player.nickname = p?.nickname || '';
    }
  }

  function isLevelCleared(levelIndex = currentLevel) {
    return !!(profile?.levelStars?.[levelIndex]);
  }

  function startLevel(levelIndex, fresh = true) {
    resetInputState();
    hideSnackOfferDialog();
    if (fresh) {
      levelDeathCount = 0;
      levelSnackUnlocked = {};
      activeSnackId = null;
      blockedPowerupToastAt = 0;
      setSnackPanelOpen(false);
    }
    currentLevel = levelIndex;
    if (fresh) levelCoins = 0;
    const ld = LEVEL_DATA[currentLevel];
    engine.initLevel(ld, levelIndex);
    engine.setCoinRewardsEnabled(!isLevelCleared(levelIndex));
    player = engine.createPlayer(ld.spawn);
    player.levelCoins = 0;
    applyProfile(profile);
    if (!fresh && activeSnackId) {
      applySnackEffectToPlayer(activeSnackId);
    }
    player.displayCoins = totalDisplay;
    gameState = 'playing';
    earnedStar = false;
    clearTimeout(animTimer);
    hide($('levelComplete'));
    hide($('gameOver'));
    hide($('victory'));
    $('gameOver')?.classList.remove('anim-death');
    $('levelComplete')?.classList.remove('anim-win');
    if (typeof gameAudio !== 'undefined') {
      gameAudio.startLevelBGM(currentLevel);
    }
    updateGameChrome();
    updateHUD();
    engine.render(player);
  }

  async function startLevelFromHub(index, userProfile) {
    await ready;

    document.querySelectorAll('[data-screen]').forEach((el) => el.classList.add('hidden'));
    document.body.dataset.appScreen = 'game';

    const wrapper = $('game-wrapper');
    if (wrapper) wrapper.classList.remove('hidden');

    await new Promise((r) => requestAnimationFrame(r));
    engine.resize();
    engine.refreshCanvas();
    lastTime = performance.now();

    if (!animId) animId = requestAnimationFrame(gameLoop);

    applyProfile(userProfile);
    startLevel(index, true);
    engine.render(player);

    await unlockAudio();
    gameAudio?.startLevelBGM(index);
  }

  function restartCurrentLevel() {
    levelCoins = 0;
    engine.resetCollectibles();
    startLevel(currentLevel, false);
  }

  function nextLevel() {
    if (currentLevel >= LEVEL_DATA.length - 1) {
      gameState = 'victory';
      updateVictoryUi();
      show($('victory'));
      gameAudio?.playSting('victory');
      return;
    }
    startLevel(currentLevel + 1, true);
  }

  function finishAnimThen(fn, delay = 2200) {
    clearTimeout(animTimer);
    animTimer = setTimeout(fn, delay);
  }

  function onDeath(reason) {
    if (gameState !== 'playing') return;
    gameState = 'dead';
    resetInputState();
    levelCoins = 0;
    levelDeathCount += 1;
    lastDeathReason = reason;
    engine.spawnDeathSplat(player, profile?.splat);
    const mute = profile?.muteDev;
    gameAudio?.playSting('death', mute);
    App?.onLevelDeath?.();
    const go = $('gameOver');
    show(go);
    go?.classList.add('anim-death');
    updateGameOverUi();
    if (levelDeathCount >= 3 && levelDeathCount % 3 === 0) {
      showSnackOfferDialog();
    }
    updateHUD();
  }

  function onComplete() {
    if (gameState !== 'playing') return;
    gameState = 'complete';
    const ls = profile?.levelStars || [];
    const alreadyCleared = !!ls[currentLevel];
    earnedStar = !alreadyCleared;
    const coinsToBank = alreadyCleared ? 0 : levelCoins;
    const lc = $('levelComplete');
    show(lc);
    lc?.classList.add('anim-win');
    gameAudio?.playSting('win');
    updateLevelCompleteUi();
    if (coinsToBank > 0) {
      bankCoins += coinsToBank;
      if (profile) profile.coins = bankCoins;
    }
    App?.onLevelComplete?.(currentLevel, coinsToBank, earnedStar);
    levelCoins = 0;
    updateHUD();
    finishAnimThen(() => {}, 2500);
  }

  function setRemotePlayer(opp, match) {
    remotePlayer = opp;
    remoteMatch = match;
    engine.setRemotePlayer(opp, match?.level === currentLevel ? match : null);
  }

  function triggerRemoteHit() {
    if (gameState === 'playing') onDeath('player');
  }

  function gameLoop(timestamp) {
    const dt = Math.min(Math.max(timestamp - lastTime, 0), 50);
    lastTime = timestamp;

    try {
      if (gameState === 'playing' && player) {
        engine.emitTrail(player);
        engine.updateMovingPlatforms(player, dt);
        const pStatus = engine.updatePlayer(player, input, dt);
        const wStatus = engine.updateWorld(player, dt, {
          shouldBlockPowerupPickup: () => !!activeSnackId,
          onPowerupBlocked: () => {
            const now = performance.now();
            if (now - blockedPowerupToastAt > 1200) {
              blockedPowerupToastAt = now;
              App?.showToast?.(gameUi('toast_powerup_blocked'));
            }
          },
        });
        engine.updateCamera(player, dt);
        updateHUD();
        if (pStatus === 'dead' || wStatus === 'dead') onDeath();
        else if (wStatus === 'complete') onComplete();
      }
    } catch (err) {
      console.error('gameLoop update error', err);
    }

    try {
      if (player && engine.level) engine.render(player);
    } catch (err) {
      console.error('gameLoop render error', err);
    }

    animId = requestAnimationFrame(gameLoop);
  }

  const keyMap = {
    ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'jump', ArrowDown: 'interact',
    KeyA: 'left', KeyD: 'right', KeyW: 'jump', KeyS: 'interact',
    Space: 'jump', KeyE: 'interact',
  };

  window.addEventListener('keydown', (e) => {
    unlockAudio();
    if (e.code === 'Space' && !e.repeat && snackOfferVisible) {
      e.preventDefault();
      hideSnackOfferDialog();
      setSnackPanelOpen(true);
      updateSnackPanel();
      return;
    }
    if (e.code === 'KeyQ' && !e.repeat && gameState === 'playing') {
      e.preventDefault();
      toggleSnackPanel();
      return;
    }
    if (e.code === 'Escape' && gameState !== 'idle') {
      e.preventDefault();
      if (snackPanelOpen) {
        setSnackPanelOpen(false);
        return;
      }
      returnToHubFromGame();
      return;
    }
    if (e.code === 'KeyR' && !e.repeat && gameState !== 'idle') {
      if (snackOfferVisible) return;
      e.preventDefault();
      const wasDead = gameState === 'dead';
      restartCurrentLevel();
      if (!wasDead) App?.showToast?.(gameUi('toast_retry_r'));
      return;
    }
    if (e.code === 'Space' && !e.repeat) {
      if (gameState === 'complete') { e.preventDefault(); nextLevel(); return; }
      if (gameState === 'victory') { e.preventDefault(); App?.returnToHub?.(); return; }
      if (gameState === 'dead' && !snackOfferVisible) { e.preventDefault(); restartCurrentLevel(); return; }
    }
    if (gameState !== 'playing') return;
    const action = keyMap[e.code];
    if (action) { input[action] = true; e.preventDefault(); }
  });

  window.addEventListener('keyup', (e) => {
    if (gameState !== 'playing') return;
    const action = keyMap[e.code];
    if (action) { input[action] = false; e.preventDefault(); }
  });

  function bindTouch(btnId, action) {
    const btn = $(btnId);
    if (!btn) return;
    const down = (e) => { e.preventDefault(); unlockAudio(); input[action] = true; };
    const up = () => { input[action] = false; };
    btn.addEventListener('touchstart', down, { passive: false });
    btn.addEventListener('touchend', up);
    btn.addEventListener('touchcancel', up);
    btn.addEventListener('mousedown', down);
    btn.addEventListener('mouseup', up);
    btn.addEventListener('mouseleave', up);
  }

  bindTouch('btnLeft', 'left');
  bindTouch('btnRight', 'right');
  bindTouch('btnJump', 'jump');
  bindTouch('btnInteract', 'interact');

  function returnToHubFromGame() {
    gameState = 'idle';
    resetInputState();
    levelDeathCount = 0;
    hideSnackOfferDialog();
    levelSnackUnlocked = {};
    activeSnackId = null;
    setSnackPanelOpen(false);
    $('mpActions')?.classList.add('hidden');
    gameAudio?.stopBGM();
    updatePowerNotice(false);
    App?.returnToHub?.();
  }

  $('btnNext')?.addEventListener('click', () => nextLevel());
  $('btnRetry')?.addEventListener('click', () => restartCurrentLevel());
  $('btnHub')?.addEventListener('click', () => returnToHubFromGame());
  $('btnVictoryHub')?.addEventListener('click', () => App?.returnToHub?.());
  $('btnSnackPanel')?.addEventListener('click', () => toggleSnackPanel());
  $('btnSnackClose')?.addEventListener('click', () => setSnackPanelOpen(false));
  $('btnSnackOfferCancel')?.addEventListener('click', () => {
    hideSnackOfferDialog();
    restartCurrentLevel();
  });

  $('gameOver')?.addEventListener('click', () => {
    if (snackOfferVisible) return;
    if (gameState === 'dead') restartCurrentLevel();
  });
  $('levelComplete')?.addEventListener('click', () => {
    if (gameState === 'complete') nextLevel();
  });

  $('btnMpGift')?.addEventListener('click', () => {
    const to = remoteMatch?.opponent || remotePlayer?.nickname;
    if (to) Multiplayer.send('gift', to);
    else App?.showToast?.(gameUi('mp_no_opponent_toast'));
  });
  $('btnMpAttack')?.addEventListener('click', () => {
    const to = remoteMatch?.opponent || remotePlayer?.nickname;
    if (to) Multiplayer.send('attack', to);
    else App?.showToast?.(gameUi('mp_no_opponent_toast'));
  });

  window.addEventListener('resize', () => engine.resize());
  document.body.addEventListener('touchmove', (e) => {
    if (gameState === 'playing') e.preventDefault();
  }, { passive: false });

  async function init() {
    engine.resize();
    await engine.loadImages();
    imagesReady = true;
    buildSnackPanelList();
    updateGameChrome();
    setSnackPanelOpen(false);

    player = engine.createPlayer({ x: 80, y: 460 });
    engine.initLevel(LEVEL_DATA[0], 0);
    gameState = 'idle';
    lastTime = performance.now();

    engine.render(player);
    animId = requestAnimationFrame(gameLoop);

    if (readyResolve) readyResolve();
  }

  window.GameController = {
    init,
    ready,
    startLevelFromHub,
    restartCurrentLevel,
    nextLevel,
    setRemotePlayer,
    triggerRemoteHit,
    refreshSnackPreview,
    refreshSnackPanel,
    refreshGameUi,
    get currentLevel() { return currentLevel; },
    get player() { return player; },
    get gameState() { return gameState; },
    get bankCoins() { return bankCoins; },
  };

  if (window.__DEV_MODE__) {
    window.GameApp = {
      getCurrentLevel: () => currentLevel,
      getGameState: () => gameState,
      goToLevel(index) {
        if (index < 0 || index >= LEVEL_DATA.length) return;
        resetInputState();
        startLevel(index, true);
        const devEl = document.getElementById('devLevel');
        if (devEl) devEl.textContent = String(currentLevel + 1);
      },
      startDev() {
        ready.then(() => {
          unlockAudio().then(() => startLevel(0, true));
          const devEl = document.getElementById('devLevel');
          if (devEl) devEl.textContent = '1';
        });
      },
    };
  }
})();
