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
  let readyResolve;
  const ready = new Promise((r) => { readyResolve = r; });
  const POWERUP_ICONS = ['👑', '🥚', '💖', '🔥', '🍄', '⚡', '⬆️', '🪽'];
  const POWER_NOTICE_MIN_MS = 100;
  const SNACK_LEVEL_DURATION = 24 * 60 * 60 * 1000;
  const SNACK_TO_POWER_TYPE = {
    snack_bullet: 5,
    snack_block: 3,
    snack_waffle: 7,
    snack_locket: 0,
    snack_goomba: 2,
    snack_flower: 4,
    snack_soda: 5,
    snack_yoshi: 6,
    snack_pasta: 1,
    snack_mushroom: 4,
    snack_star: 0,
    snack_shy: 6,
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

  function show(el) { if (el) el.classList.remove('hidden'); }
  function hide(el) { if (el) el.classList.add('hidden'); }
  function snackName(snackId) {
    return SNACK_BY_ID[snackId]?.name?.zh || snackId || '未知零食';
  }

  function snackEffectText(snackId) {
    const powerType = SNACK_TO_POWER_TYPE[snackId];
    if (typeof powerType !== 'number') return '词条效果';
    const fullName = (typeof POWERUP_NAMES !== 'undefined' && POWERUP_NAMES[powerType])
      ? POWERUP_NAMES[powerType]
      : `效果 ${powerType + 1}`;
    const [, effectDetailRaw] = String(fullName).split(' - ');
    return (effectDetailRaw || fullName || '词条效果').trim();
  }

  function applySnackEffectToPlayer(snackId) {
    if (!player) return;
    const powerType = SNACK_TO_POWER_TYPE[snackId];
    if (typeof powerType !== 'number') return;
    engine.applyPower(player, powerType, { source: 'snack' });
    player.powerTimer = SNACK_LEVEL_DURATION;
  }

  function deactivateSnackEffect({ silent = false } = {}) {
    activeSnackId = null;
    if (player?.powerSource === 'snack') engine.clearPower(player);
    if (!silent) App?.showToast?.('已关闭零食效果');
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
        App?.showToast?.('金币不足');
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
    if (!silent) App?.showToast?.('零食生效，期间不会捡起 Power-up');
    updateSnackPanel();
    updateHUD();
    return true;
  }

  function setSnackPanelOpen(open) {
    snackPanelOpen = !!open;
    const panel = $('snackPanel');
    if (panel) panel.classList.toggle('hidden', !snackPanelOpen);
  }

  function toggleSnackPanel() {
    setSnackPanelOpen(!snackPanelOpen);
  }

  function buildSnackPanelList() {
    const box = $('snackList');
    if (!box || snackListBuilt) return;
    snackListBuilt = true;
    box.innerHTML = '';
    for (const snack of SNACK_LIST) {
      const row = document.createElement('div');
      row.className = 'snack-item';
      row.dataset.snack = snack.id;
      const left = document.createElement('div');
      left.innerHTML = `
        <div class="snack-item-title">${snack.name?.zh || snack.id}</div>
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
  }

  function updateSnackPanel() {
    const coinsEl = $('snackCoins');
    if (coinsEl) coinsEl.textContent = String(profile?.coins ?? bankCoins ?? 0);
    const activeEl = $('snackActiveLabel');
    if (activeEl) activeEl.textContent = activeSnackId ? `当前：${snackName(activeSnackId)}` : '当前：未激活';
    const box = $('snackList');
    if (!box) return;
    box.querySelectorAll('.snack-item-btn').forEach((btn) => {
      const snackId = btn.dataset.snack;
      const snack = SNACK_BY_ID[snackId];
      if (!snack) return;
      const unlocked = !!levelSnackUnlocked[snackId];
      const active = activeSnackId === snackId;
      btn.classList.remove('active', 'unlocked');
      if (active) {
        btn.classList.add('active');
        btn.textContent = '关闭效果';
      } else if (unlocked) {
        btn.classList.add('unlocked');
        btn.textContent = '使用（已解锁）';
      } else {
        btn.textContent = `购买并使用 ${snack.price} 🪙`;
      }
    });
  }

  function totalDisplay() {
    return bankCoins + levelCoins;
  }

  function updateHUD() {
    if (player) levelCoins = player.levelCoins || 0;
    const ld = LEVEL_DATA[currentLevel];
    const label = $('levelLabel');
    if (label && ld) label.textContent = `关卡 ${currentLevel + 1} / 20 - ${ld.name}`;
    const coinEl = $('coinLabel');
    if (coinEl) {
      const replay = isLevelCleared();
      const suffix = replay ? ' (本关金币已领取)' : ` (本关 ${levelCoins})`;
      coinEl.textContent = `金币: ${totalDisplay()}${suffix}`;
    }
    updatePowerNotice(gameState === 'playing');
    const mp = $('mpActions');
    if (mp && remotePlayer && remoteMatch?.level === currentLevel) {
      mp.classList.remove('hidden');
      const opp = $('mpOpponent');
      if (opp) opp.textContent = remoteMatch.opponent || remotePlayer.nickname || '';
    } else if (mp) {
      mp.classList.add('hidden');
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
    const fullName = (typeof POWERUP_NAMES !== 'undefined' && POWERUP_NAMES[player.powerType])
      ? POWERUP_NAMES[player.powerType]
      : `效果 ${player.powerType + 1}`;
    const [headNameRaw, effectDetailRaw] = String(fullName).split(' - ');
    const shortName = (headNameRaw || '').trim();
    const effectDetail = (effectDetailRaw || '').trim();
    const remainText = remainMs >= 1000
      ? `${Math.ceil(remainMs / 1000)}s`
      : `${Math.max(0.1, remainMs / 1000).toFixed(1)}s`;
    const isRandom = player.powerSource === 'random';
    if (player.powerSource === 'snack' && activeSnackId) {
      mainEl.textContent = `当前零食：${snackName(activeSnackId)}`;
      detailEl.textContent = '零食生效中，未拾取 Power-up';
      iconEl.classList.remove('sprite');
      iconEl.style.backgroundPosition = '';
      iconEl.textContent = '🍬';
      return;
    }
    mainEl.textContent = `${isRandom ? '随机加成' : '当前加成'}：${shortName}（${remainText}）`;
    detailEl.textContent = `词条效果：${effectDetail || '效果生效中'}`;
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
    if (fresh) {
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
      show($('victory'));
      if ($('victoryStats')) {
        $('victoryStats').textContent = `共获得 ${App?.countStars?.() || 0} 颗星星，银行金币 ${bankCoins}！`;
      }
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
    engine.spawnDeathSplat(player, profile?.splat);
    const mute = profile?.muteDev;
    gameAudio?.playSting('death', mute);
    App?.onLevelDeath?.();
    const go = $('gameOver');
    show(go);
    go?.classList.add('anim-death');
    if ($('gameOverMsg')) {
      $('gameOverMsg').textContent = reason === 'player'
        ? '碰到了其他玩家！'
        : '泡泡糖爆炸！点击任意处或按R重试';
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
    const ld = LEVEL_DATA[currentLevel];
    let msg = `${ld.name} 完成！`;
    if (earnedStar) msg += ' 获得 ★ 1 颗星星！';
    else msg += ' (本关星星已领取)';
    if (coinsToBank > 0) msg += ` 本关金币 +${coinsToBank} 已存入银行。`;
    else if (alreadyCleared) msg += ' (重复游玩，本关金币已领取)';
    if ($('levelCompleteMsg')) $('levelCompleteMsg').textContent = msg;
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
              App?.showToast?.('零食生效中，未拾取 Power-up');
            }
          },
        });
        engine.updateCamera(player);
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
      e.preventDefault();
      const wasDead = gameState === 'dead';
      restartCurrentLevel();
      if (!wasDead) App?.showToast?.('已按 R 重试当前关卡');
      return;
    }
    if (e.code === 'Space' && !e.repeat) {
      if (gameState === 'complete') { e.preventDefault(); nextLevel(); return; }
      if (gameState === 'victory') { e.preventDefault(); App?.returnToHub?.(); return; }
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
    levelSnackUnlocked = {};
    activeSnackId = null;
    setSnackPanelOpen(false);
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

  $('gameOver')?.addEventListener('click', () => {
    if (gameState === 'dead') restartCurrentLevel();
  });
  $('levelComplete')?.addEventListener('click', () => {
    if (gameState === 'complete') nextLevel();
  });

  $('btnMpGift')?.addEventListener('click', () => {
    const to = remoteMatch?.opponent || remotePlayer?.nickname;
    if (to) Multiplayer.send('gift', to);
  });
  $('btnMpAttack')?.addEventListener('click', () => {
    const to = remoteMatch?.opponent || remotePlayer?.nickname;
    if (to) Multiplayer.send('attack', to);
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
    get currentLevel() { return currentLevel; },
    get player() { return player; },
    get gameState() { return gameState; },
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
