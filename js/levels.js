/**
 * 20 Level definitions for Bubble Gum Factory Adventure
 * Background: level N uses images/backgroundN.jpg (auto-assigned in engine)
 * Level 2 (rotating rollers) moved to level 10
 * Level 8 boss removed; level 9 simplified
 */

/** Level 19 mix segment — tiled ×10 for level 20 */
const LEVEL20_MIX_SEGMENT = {
  platforms: [
    { x: 0, y: 520, w: 200, h: 80, type: 'bouncy' },
    { x: 250, y: 520, w: 150, h: 80, type: 'gel' },
    { x: 450, y: 480, w: 80, h: 30, type: 'normal' },
    { x: 600, y: 520, w: 200, h: 80, type: 'melting', meltDelay: 3 },
    { x: 850, y: 420, w: 80, h: 30, type: 'moving', moveX: [850, 1100], speed: 2 },
    { x: 1200, y: 520, w: 150, h: 80, type: 'normal' },
    { x: 1400, y: 460, w: 80, h: 30, type: 'fake', vanishDelay: 0.5 },
    { x: 1550, y: 400, w: 80, h: 30, type: 'normal' },
    { x: 1700, y: 520, w: 200, h: 80, type: 'bouncy' },
    { x: 1950, y: 450, w: 80, h: 30, type: 'normal' },
    { x: 2100, y: 520, w: 300, h: 80, type: 'gel' },
    { x: 2450, y: 400, w: 80, h: 30, type: 'normal' },
    { x: 2600, y: 520, w: 800, h: 80, type: 'normal' },
  ],
  vents: [
    { x: 1100, y: 350, w: 80, h: 120, dir: 1, power: 14 },
    { x: 2300, y: 320, w: 80, h: 120, dir: -1, power: 12 },
  ],
  rollers: [
    { x: 1680, y: 490, r: 35, speed: 3, dir: 1, moveX: [1680, 2550], oneWay: true, patrolSpeed: 2.2 },
  ],
  hazards: [
    { x: 1300, y: 560, w: 50, h: 20, type: 'spike' },
  ],
  enemies: [
    { x: 1600, y: 470, w: 55, h: 55, type: 'bubble', patrol: [1500, 1900], speed: 2.5 },
  ],
  collectibles: [
    { x: 300, y: 470, type: 'coin' },
    { x: 900, y: 370, type: 'question' },
    { x: 2000, y: 400, type: 'coin' },
    { x: 2550, y: 350, type: 'coin' },
  ],
  powerups: [{ x: 2200, y: 470, type: 7 }],
};

function offsetX(obj, dx, keys = ['x']) {
  const o = { ...obj };
  keys.forEach((k) => {
    if (o[k] != null) o[k] += dx;
  });
  if (o.moveX) o.moveX = [o.moveX[0] + dx, o.moveX[1] + dx];
  if (o.patrol) o.patrol = [o.patrol[0] + dx, o.patrol[1] + dx];
  return o;
}

function buildLevel20() {
  const SEG_W = 3400;
  const REPEATS = 3;
  const seg = LEVEL20_MIX_SEGMENT;
  const out = {
    name: '工厂之巅',
    desc: '终极融合 ×3 — 穿越整个泡泡糖工厂！',
    width: SEG_W * REPEATS,
    theme: 'victory',
    timeLimit: 180,
    platforms: [],
    vents: [],
    rollers: [],
    hazards: [],
    enemies: [],
    collectibles: [],
    powerups: [],
    switches: [],
    doors: [],
    spawn: { x: 50, y: 460 },
    exit: { x: SEG_W * REPEATS - 80, y: 460 },
  };

  for (let i = 0; i < REPEATS; i++) {
    const dx = i * SEG_W;
    out.platforms.push(...seg.platforms.map((p) => offsetX(p, dx)));
    out.vents.push(...seg.vents.map((v) => offsetX(v, dx)));
    out.rollers.push(...seg.rollers.map((r) => offsetX({
      ...r,
      speed: r.speed + i * 0.12,
      patrolSpeed: (r.patrolSpeed || 2.2) + i * 0.08,
    }, dx)));
    out.hazards.push(...seg.hazards.map((h) => offsetX(h, dx)));
    if (i >= 2) {
      out.hazards.push(offsetX({ x: 700, y: 560, w: 60, h: 20, type: 'spike' }, dx));
    }
    out.enemies.push(...seg.enemies.map((e) => offsetX({
      ...e,
      speed: e.speed + i * 0.18,
    }, dx)));
    if (i >= 4) {
      out.enemies.push(offsetX({
        x: 2700, y: 470, w: 52, h: 52, type: 'bubble',
        patrol: [2500 + dx, 3200 + dx], speed: 2.8 + i * 0.15,
      }, dx));
    }
    if (i >= 7) {
      out.enemies.push(offsetX({
        x: 1200, y: 470, w: 55, h: 55, type: 'bubble',
        patrol: [900 + dx, 3100 + dx], speed: 3 + i * 0.12, chase: true,
      }, dx));
    }
    out.collectibles.push(...seg.collectibles.map((c) => offsetX(c, dx)));
    if (i % 2 === 1) {
      out.collectibles.push(offsetX({ x: 1800, y: 470, type: 'coin' }, dx));
    }
    if (i === 2) out.powerups.push(offsetX({ x: 2200, y: 470, type: 0 }, dx));
    if (i === 5) out.powerups.push(offsetX({ x: 2200, y: 470, type: 4 }, dx));
    if (i === 8) out.powerups.push(offsetX({ x: 2200, y: 470, type: 7 }, dx));
  }

  out.powerups.push({ x: out.width - 450, y: 470, type: 0 });
  out.collectibles.push({ x: out.width - 320, y: 430, type: 'question' });
  return out;
}

const LEVEL_DATA = [
  // 1 - Bouncy bubble gum ground
  {
    name: '弹跳泡泡糖',
    desc: '利用泡泡糖地面的弹力抵达高处开关',
    width: 2400,
    theme: 'factory',
    platforms: [
      { x: 0, y: 520, w: 400, h: 80, type: 'bouncy' },
      { x: 450, y: 480, w: 120, h: 40, type: 'bouncy' },
      { x: 620, y: 420, w: 100, h: 40, type: 'bouncy' },
      { x: 780, y: 360, w: 100, h: 40, type: 'bouncy' },
      { x: 940, y: 300, w: 120, h: 40, type: 'normal' },
      { x: 1100, y: 260, w: 80, h: 40, type: 'bouncy' },
      { x: 1240, y: 220, w: 100, h: 40, type: 'bouncy' },
      { x: 1400, y: 180, w: 200, h: 40, type: 'normal' },
      { x: 1650, y: 520, w: 750, h: 80, type: 'normal' },
      { x: 1700, y: 400, w: 60, h: 120, type: 'pipe' },
      { x: 1900, y: 350, w: 80, h: 30, type: 'normal' },
      { x: 2050, y: 300, w: 100, h: 30, type: 'normal' },
    ],
    switches: [],
    doors: [],
    hazards: [],
    enemies: [],
    collectibles: [
      { x: 500, y: 430, type: 'coin' },
      { x: 850, y: 310, type: 'coin' },
      { x: 1150, y: 210, type: 'question' },
      { x: 1800, y: 480, type: 'lumalee' },
    ],
    powerups: [{ x: 1300, y: 170, type: 4 }],
    spawn: { x: 80, y: 460 },
    exit: { x: 2320, y: 400 },
  },

  // 2 - Gel slow zone (was level 3)
  {
    name: '凝胶缓速区',
    desc: '在粘稠凝胶中缓慢前行，跳跃穿越平台',
    width: 2600,
    theme: 'factory',
    platforms: [
      { x: 0, y: 520, w: 300, h: 80, type: 'normal' },
      { x: 350, y: 520, w: 200, h: 80, type: 'gel' },
      { x: 600, y: 480, w: 80, h: 30, type: 'normal' },
      { x: 750, y: 440, w: 80, h: 30, type: 'normal' },
      { x: 900, y: 400, w: 80, h: 30, type: 'normal' },
      { x: 1050, y: 520, w: 250, h: 80, type: 'gel' },
      { x: 1350, y: 460, w: 70, h: 30, type: 'normal' },
      { x: 1480, y: 400, w: 70, h: 30, type: 'normal' },
      { x: 1610, y: 340, w: 70, h: 30, type: 'normal' },
      { x: 1740, y: 520, w: 300, h: 80, type: 'gel' },
      { x: 2100, y: 480, w: 100, h: 30, type: 'normal' },
      { x: 2250, y: 420, w: 100, h: 30, type: 'normal' },
      { x: 2400, y: 520, w: 200, h: 80, type: 'normal' },
    ],
    switches: [],
    doors: [],
    hazards: [
      { x: 1100, y: 560, w: 150, h: 20, type: 'spike' },
    ],
    enemies: [],
    collectibles: [
      { x: 400, y: 470, type: 'coin' },
      { x: 780, y: 390, type: 'coin' },
      { x: 1200, y: 470, type: 'question' },
      { x: 2150, y: 430, type: 'coin' },
    ],
    powerups: [{ x: 1650, y: 300, type: 5 }],
    spawn: { x: 50, y: 460 },
    exit: { x: 2520, y: 460 },
  },

  // 3 - Wind gust vents (was level 4)
  {
    name: '泡泡糖气流',
    desc: '把握时机穿越强力气流风口',
    width: 2800,
    theme: 'sunset',
    platforms: [
      { x: 0, y: 520, w: 250, h: 80, type: 'normal' },
      { x: 300, y: 480, w: 60, h: 30, type: 'normal' },
      { x: 420, y: 440, w: 60, h: 30, type: 'normal' },
      { x: 540, y: 400, w: 60, h: 30, type: 'normal' },
      { x: 700, y: 520, w: 400, h: 80, type: 'normal' },
      { x: 1150, y: 460, w: 60, h: 30, type: 'normal' },
      { x: 1270, y: 400, w: 60, h: 30, type: 'normal' },
      { x: 1390, y: 340, w: 60, h: 30, type: 'normal' },
      { x: 1550, y: 520, w: 500, h: 80, type: 'normal' },
      { x: 2100, y: 450, w: 80, h: 30, type: 'normal' },
      { x: 2250, y: 380, w: 80, h: 30, type: 'normal' },
      { x: 2400, y: 520, w: 400, h: 80, type: 'normal' },
    ],
    vents: [
      { x: 650, y: 350, w: 80, h: 120, dir: -1, power: 12 },
      { x: 900, y: 300, w: 80, h: 120, dir: 1, power: 14 },
      { x: 1500, y: 280, w: 80, h: 120, dir: -1, power: 16 },
      { x: 1900, y: 320, w: 80, h: 120, dir: 1, power: 13 },
    ],
    switches: [],
    doors: [],
    hazards: [],
    enemies: [],
    collectibles: [
      { x: 350, y: 430, type: 'coin' },
      { x: 750, y: 470, type: 'coin' },
      { x: 1200, y: 410, type: 'question' },
      { x: 2300, y: 330, type: 'coin' },
    ],
    powerups: [{ x: 1800, y: 470, type: 6 }],
    spawn: { x: 50, y: 460 },
    exit: { x: 2700, y: 460 },
  },

  // 4 - Bubble monsters (was level 5)
  {
    name: '泡泡怪出没',
    desc: '躲避巨型泡泡怪，安全通过',
    width: 2600,
    theme: 'factory',
    platforms: [
      { x: 0, y: 520, w: 2600, h: 80, type: 'normal' },
      { x: 200, y: 420, w: 100, h: 30, type: 'normal' },
      { x: 400, y: 360, w: 100, h: 30, type: 'normal' },
      { x: 600, y: 420, w: 100, h: 30, type: 'normal' },
      { x: 900, y: 380, w: 80, h: 30, type: 'normal' },
      { x: 1100, y: 320, w: 80, h: 30, type: 'normal' },
      { x: 1400, y: 400, w: 120, h: 30, type: 'normal' },
      { x: 1700, y: 350, w: 100, h: 30, type: 'normal' },
      { x: 2000, y: 400, w: 100, h: 30, type: 'normal' },
      { x: 2300, y: 350, w: 100, h: 30, type: 'normal' },
    ],
    switches: [],
    doors: [],
    hazards: [],
    enemies: [
      { x: 500, y: 470, w: 50, h: 50, type: 'bubble', patrol: [400, 700], speed: 1.5 },
      { x: 1000, y: 470, w: 60, h: 60, type: 'bubble', patrol: [900, 1300], speed: 2 },
      { x: 1500, y: 470, w: 55, h: 55, type: 'bubble', patrol: [1400, 1800], speed: 1.8 },
      { x: 2100, y: 470, w: 65, h: 65, type: 'bubble', patrol: [2000, 2400], speed: 2.2 },
    ],
    collectibles: [
      { x: 250, y: 470, type: 'coin' },
      { x: 450, y: 310, type: 'coin' },
      { x: 950, y: 330, type: 'question' },
      { x: 1750, y: 300, type: 'coin' },
      { x: 2350, y: 300, type: 'coin' },
    ],
    powerups: [{ x: 1150, y: 270, type: 3 }],
    spawn: { x: 50, y: 460 },
    exit: { x: 2520, y: 460 },
  },

  // 5 - Multi-layer factory hidden paths (was level 6)
  {
    name: '交错厂房',
    desc: '发现隐藏的阶梯泡泡通路',
    width: 3000,
    theme: 'town',
    platforms: [
      { x: 0, y: 520, w: 400, h: 80, type: 'normal' },
      { x: 500, y: 520, w: 200, h: 80, type: 'normal' },
      { x: 800, y: 520, w: 200, h: 80, type: 'normal' },
      { x: 1100, y: 520, w: 200, h: 80, type: 'normal' },
      { x: 600, y: 400, w: 60, h: 20, type: 'hidden', reveal: 600 },
      { x: 750, y: 340, w: 60, h: 20, type: 'hidden', reveal: 750 },
      { x: 900, y: 280, w: 60, h: 20, type: 'hidden', reveal: 900 },
      { x: 1050, y: 220, w: 60, h: 20, type: 'hidden', reveal: 1050 },
      { x: 1200, y: 160, w: 200, h: 30, type: 'normal' },
      { x: 1500, y: 520, w: 300, h: 80, type: 'normal' },
      { x: 1900, y: 450, w: 80, h: 30, type: 'normal' },
      { x: 2050, y: 380, w: 80, h: 30, type: 'normal' },
      { x: 2200, y: 310, w: 80, h: 30, type: 'normal' },
      { x: 2400, y: 520, w: 600, h: 80, type: 'normal' },
    ],
    switches: [],
    doors: [],
    hazards: [
      { x: 450, y: 560, w: 50, h: 20, type: 'spike' },
      { x: 1400, y: 560, w: 100, h: 20, type: 'spike' },
    ],
    enemies: [],
    collectibles: [
      { x: 550, y: 470, type: 'lumalee' },
      { x: 630, y: 350, type: 'question' },
      { x: 1950, y: 400, type: 'coin' },
      { x: 2500, y: 470, type: 'coin' },
    ],
    powerups: [{ x: 780, y: 290, type: 7 }],
    spawn: { x: 50, y: 460 },
    exit: { x: 2920, y: 460 },
  },

  // 6 - Melting ground (was level 7)
  {
    name: '融化糖体',
    desc: '在地面塌陷前快速通过',
    width: 2400,
    theme: 'sunset',
    timeLimit: 45,
    platforms: [
      { x: 0, y: 520, w: 200, h: 80, type: 'normal' },
      { x: 250, y: 520, w: 150, h: 80, type: 'melting', meltDelay: 2 },
      { x: 450, y: 520, w: 150, h: 80, type: 'melting', meltDelay: 3 },
      { x: 650, y: 520, w: 150, h: 80, type: 'melting', meltDelay: 2.5 },
      { x: 850, y: 480, w: 80, h: 30, type: 'normal' },
      { x: 1000, y: 420, w: 80, h: 30, type: 'normal' },
      { x: 1150, y: 520, w: 150, h: 80, type: 'melting', meltDelay: 2 },
      { x: 1350, y: 520, w: 150, h: 80, type: 'melting', meltDelay: 1.5 },
      { x: 1550, y: 480, w: 80, h: 30, type: 'normal' },
      { x: 1700, y: 420, w: 80, h: 30, type: 'normal' },
      { x: 1850, y: 520, w: 150, h: 80, type: 'melting', meltDelay: 2 },
      { x: 2050, y: 520, w: 350, h: 80, type: 'normal' },
    ],
    switches: [],
    doors: [],
    hazards: [],
    enemies: [],
    collectibles: [
      { x: 300, y: 470, type: 'coin' },
      { x: 900, y: 430, type: 'question' },
      { x: 1600, y: 370, type: 'coin' },
    ],
    powerups: [{ x: 1050, y: 370, type: 0 }],
    spawn: { x: 50, y: 460 },
    exit: { x: 2320, y: 460 },
  },

  // 7 - P1 elements collection intro
  {
    name: '银河元素',
    desc: '收集银河场景中的金币与问号块',
    width: 2200,
    theme: 'galaxy',
    platforms: [
      { x: 0, y: 520, w: 2200, h: 80, type: 'normal' },
      { x: 300, y: 420, w: 200, h: 30, type: 'brick' },
      { x: 600, y: 380, w: 40, h: 40, type: 'brick' },
      { x: 660, y: 380, w: 40, h: 40, type: 'question' },
      { x: 720, y: 380, w: 40, h: 40, type: 'brick' },
      { x: 780, y: 380, w: 40, h: 40, type: 'brick' },
      { x: 1000, y: 350, w: 80, h: 30, type: 'normal' },
      { x: 1300, y: 400, w: 60, h: 120, type: 'pipe' },
      { x: 1600, y: 420, w: 100, h: 30, type: 'normal' },
      { x: 1800, y: 360, w: 100, h: 30, type: 'normal' },
    ],
    switches: [],
    doors: [],
    hazards: [],
    enemies: [],
    collectibles: [
      { x: 350, y: 370, type: 'coin' },
      { x: 400, y: 370, type: 'coin' },
      { x: 450, y: 370, type: 'coin' },
      { x: 680, y: 330, type: 'question' },
      { x: 1050, y: 300, type: 'coin' },
      { x: 1100, y: 300, type: 'coin' },
      { x: 1150, y: 300, type: 'coin' },
      { x: 1650, y: 370, type: 'coin' },
      { x: 1850, y: 310, type: 'question' },
    ],
    powerups: [{ x: 1400, y: 350, type: 2 }],
    spawn: { x: 50, y: 460 },
    exit: { x: 2100, y: 460 },
  },

  // 8 - Moving platforms
  {
    name: '移动平台',
    desc: '跳上移动的平台穿越工厂',
    width: 2800,
    theme: 'factory',
    platforms: [
      { x: 0, y: 520, w: 200, h: 80, type: 'normal' },
      { x: 280, y: 520, w: 100, h: 30, type: 'moving', moveX: [280, 500], speed: 2 },
      { x: 520, y: 450, w: 120, h: 30, type: 'moving', moveY: [350, 450], speed: 1.5 },
      { x: 850, y: 520, w: 80, h: 30, type: 'normal' },
      { x: 1000, y: 400, w: 100, h: 30, type: 'moving', moveX: [1000, 1300], speed: 2.5 },
      { x: 1400, y: 520, w: 80, h: 30, type: 'normal' },
      { x: 1550, y: 380, w: 100, h: 30, type: 'moving', moveY: [280, 380], speed: 2 },
      { x: 1750, y: 520, w: 80, h: 30, type: 'normal' },
      { x: 1900, y: 420, w: 100, h: 30, type: 'moving', moveX: [1900, 2200], speed: 3 },
      { x: 2300, y: 520, w: 500, h: 80, type: 'normal' },
    ],
    switches: [],
    doors: [],
    hazards: [
      { x: 250, y: 600, w: 30, h: 200, type: 'pit' },
      { x: 500, y: 600, w: 40, h: 200, type: 'pit' },
      { x: 950, y: 600, w: 50, h: 200, type: 'pit' },
      { x: 1350, y: 600, w: 50, h: 200, type: 'pit' },
      { x: 1700, y: 600, w: 50, h: 200, type: 'pit' },
    ],
    enemies: [],
    collectibles: [
      { x: 320, y: 495, type: 'coin' },
      { x: 1050, y: 350, type: 'question' },
      { x: 2000, y: 370, type: 'coin' },
    ],
    powerups: [{ x: 1600, y: 330, type: 1 }],
    spawn: { x: 50, y: 460 },
    exit: { x: 2700, y: 460 },
  },

  // 9 - Simplified level (user requested)
  {
    name: '休息站',
    desc: '简短的休息关卡，收集道具后前进',
    width: 1200,
    theme: 'factory',
    platforms: [
      { x: 0, y: 520, w: 1200, h: 80, type: 'normal' },
      { x: 400, y: 420, w: 120, h: 30, type: 'normal' },
      { x: 700, y: 380, w: 100, h: 30, type: 'normal' },
    ],
    switches: [],
    doors: [],
    hazards: [],
    enemies: [],
    collectibles: [
      { x: 200, y: 470, type: 'coin' },
      { x: 300, y: 470, type: 'coin' },
      { x: 450, y: 370, type: 'question' },
      { x: 750, y: 330, type: 'coin' },
    ],
    powerups: [{ x: 550, y: 470, type: 4 }],
    spawn: { x: 50, y: 460 },
    exit: { x: 1100, y: 460 },
  },

  // 10 - Rotating bubble rollers (moved from level 2)
  {
    name: '旋转滚筒',
    desc: '躲避滚动糖筒前进',
    width: 3000,
    theme: 'factory',
    platforms: [
      { x: 0, y: 520, w: 300, h: 80, type: 'normal' },
      { x: 400, y: 520, w: 400, h: 80, type: 'normal' },
      { x: 900, y: 520, w: 400, h: 80, type: 'normal' },
      { x: 1400, y: 520, w: 400, h: 80, type: 'normal' },
      { x: 1900, y: 520, w: 400, h: 80, type: 'normal' },
      { x: 2400, y: 520, w: 600, h: 80, type: 'normal' },
      { x: 500, y: 400, w: 80, h: 30, type: 'normal' },
      { x: 1100, y: 380, w: 80, h: 30, type: 'normal' },
      { x: 1700, y: 400, w: 80, h: 30, type: 'normal' },
      { x: 2200, y: 450, w: 80, h: 30, type: 'normal' },
    ],
    rollers: [
      { x: 620, y: 490, r: 35, speed: 3, dir: 1 },
      { x: 750, y: 490, r: 40, speed: 2.5, dir: -1 },
      { x: 1050, y: 490, r: 38, speed: 3.5, dir: 1 },
      { x: 1350, y: 490, r: 42, speed: 2.8, dir: -1 },
      { x: 1650, y: 490, r: 36, speed: 3.2, dir: 1 },
      { x: 1950, y: 490, r: 40, speed: 3, dir: -1 },
      { x: 2100, y: 490, r: 38, speed: 3.5, dir: 1 },
    ],
    switches: [],
    doors: [],
    hazards: [],
    enemies: [],
    collectibles: [
      { x: 350, y: 470, type: 'coin' },
      { x: 550, y: 350, type: 'question' },
      { x: 1150, y: 330, type: 'coin' },
      { x: 1750, y: 350, type: 'coin' },
    ],
    powerups: [{ x: 1250, y: 330, type: 5 }],
    spawn: { x: 50, y: 460 },
    exit: { x: 2920, y: 460 },
  },

  // 11 - Fake platforms (Level Devil style)
  {
    name: '假平台陷阱',
    desc: '小心！有些平台会消失',
    width: 2600,
    theme: 'town',
    platforms: [
      { x: 0, y: 520, w: 200, h: 80, type: 'normal' },
      { x: 250, y: 480, w: 80, h: 30, type: 'fake', vanishDelay: 0.5 },
      { x: 380, y: 440, w: 80, h: 30, type: 'normal' },
      { x: 510, y: 400, w: 80, h: 30, type: 'fake', vanishDelay: 0.3 },
      { x: 640, y: 360, w: 80, h: 30, type: 'normal' },
      { x: 770, y: 520, w: 200, h: 80, type: 'normal' },
      { x: 1020, y: 460, w: 80, h: 30, type: 'fake', vanishDelay: 0.4 },
      { x: 1150, y: 400, w: 80, h: 30, type: 'normal' },
      { x: 1280, y: 340, w: 80, h: 30, type: 'fake', vanishDelay: 0.6 },
      { x: 1410, y: 520, w: 300, h: 80, type: 'normal' },
      { x: 1760, y: 450, w: 80, h: 30, type: 'normal' },
      { x: 1890, y: 380, w: 80, h: 30, type: 'fake', vanishDelay: 0.5 },
      { x: 2020, y: 520, w: 580, h: 80, type: 'normal' },
    ],
    switches: [],
    doors: [],
    hazards: [
      { x: 350, y: 560, w: 30, h: 20, type: 'spike' },
      { x: 1100, y: 560, w: 30, h: 20, type: 'spike' },
    ],
    enemies: [],
    collectibles: [
      { x: 420, y: 390, type: 'coin' },
      { x: 1200, y: 350, type: 'question' },
      { x: 1950, y: 330, type: 'coin' },
    ],
    powerups: [{ x: 700, y: 320, type: 6 }],
    spawn: { x: 50, y: 460 },
    exit: { x: 2520, y: 460 },
  },

  // 12 - Factory lifts
  {
    name: '升降电梯',
    desc: '乘坐泡泡糖电梯上下穿梭',
    width: 2400,
    theme: 'factory',
    platforms: [
      { x: 0, y: 520, w: 300, h: 80, type: 'normal' },
      { x: 380, y: 520, w: 120, h: 30, type: 'moving', moveY: [290, 520], speed: 1.8 },
      { x: 530, y: 290, w: 160, h: 30, type: 'normal' },
      { x: 850, y: 520, w: 100, h: 30, type: 'moving', moveY: [270, 520], speed: 2.2 },
      { x: 1050, y: 270, w: 150, h: 30, type: 'normal' },
      { x: 1300, y: 520, w: 100, h: 30, type: 'moving', moveY: [220, 520], speed: 2.5 },
      { x: 1500, y: 220, w: 200, h: 30, type: 'normal' },
      { x: 1800, y: 520, w: 600, h: 80, type: 'normal' },
    ],
    switches: [],
    doors: [],
    hazards: [],
    enemies: [],
    collectibles: [
      { x: 620, y: 240, type: 'coin' },
      { x: 1100, y: 220, type: 'question' },
      { x: 1550, y: 170, type: 'coin' },
    ],
    powerups: [{ x: 900, y: 220, type: 0 }],
    spawn: { x: 50, y: 460 },
    exit: { x: 2320, y: 460 },
  },

  // 13 - Pipe maze
  {
    name: '管道迷宫',
    desc: '在工厂管道间找到出路',
    width: 3200,
    theme: 'factory',
    platforms: [
      { x: 0, y: 520, w: 200, h: 80, type: 'normal' },
      { x: 250, y: 520, w: 60, h: 150, type: 'pipe' },
      { x: 400, y: 450, w: 200, h: 30, type: 'normal' },
      { x: 650, y: 520, w: 60, h: 120, type: 'pipe' },
      { x: 800, y: 400, w: 200, h: 30, type: 'normal' },
      { x: 1050, y: 520, w: 60, h: 150, type: 'pipe' },
      { x: 1200, y: 350, w: 200, h: 30, type: 'normal' },
      { x: 1450, y: 520, w: 60, h: 180, type: 'pipe' },
      { x: 1600, y: 300, w: 200, h: 30, type: 'normal' },
      { x: 1850, y: 520, w: 60, h: 200, type: 'pipe' },
      { x: 2000, y: 250, w: 200, h: 30, type: 'normal' },
      { x: 2250, y: 520, w: 950, h: 80, type: 'normal' },
    ],
    switches: [],
    doors: [],
    hazards: [
      { x: 350, y: 560, w: 50, h: 20, type: 'spike' },
      { x: 750, y: 560, w: 50, h: 20, type: 'spike' },
    ],
    enemies: [
      { x: 500, y: 400, w: 40, h: 40, type: 'bubble', patrol: [400, 600], speed: 1.5 },
    ],
    collectibles: [
      { x: 450, y: 400, type: 'coin' },
      { x: 850, y: 350, type: 'question' },
      { x: 1250, y: 300, type: 'coin' },
      { x: 2050, y: 200, type: 'coin' },
    ],
    powerups: [{ x: 1650, y: 250, type: 3 }],
    spawn: { x: 50, y: 460 },
    exit: { x: 3120, y: 460 },
  },

  // 14 - Power-up heavy
  {
    name: '强化大收集',
    desc: '收集各种强化道具增强能力',
    width: 2800,
    theme: 'galaxy',
    platforms: [
      { x: 0, y: 520, w: 2800, h: 80, type: 'normal' },
      { x: 200, y: 420, w: 100, h: 30, type: 'normal' },
      { x: 400, y: 360, w: 100, h: 30, type: 'normal' },
      { x: 600, y: 300, w: 100, h: 30, type: 'normal' },
      { x: 900, y: 420, w: 100, h: 30, type: 'normal' },
      { x: 1100, y: 360, w: 100, h: 30, type: 'normal' },
      { x: 1300, y: 300, w: 100, h: 30, type: 'normal' },
      { x: 1600, y: 420, w: 100, h: 30, type: 'normal' },
      { x: 1800, y: 360, w: 100, h: 30, type: 'normal' },
      { x: 2000, y: 300, w: 100, h: 30, type: 'normal' },
      { x: 2300, y: 400, w: 100, h: 30, type: 'normal' },
    ],
    switches: [],
    doors: [],
    hazards: [],
    enemies: [
      { x: 800, y: 470, w: 45, h: 45, type: 'bubble', patrol: [700, 1000], speed: 2 },
      { x: 1500, y: 470, w: 45, h: 45, type: 'bubble', patrol: [1400, 1700], speed: 2 },
    ],
    collectibles: [
      { x: 250, y: 370, type: 'coin' },
      { x: 450, y: 310, type: 'coin' },
      { x: 650, y: 250, type: 'question' },
      { x: 950, y: 370, type: 'coin' },
      { x: 1400, y: 470, type: 'lumalee' },
      { x: 1650, y: 370, type: 'coin' },
      { x: 2350, y: 350, type: 'question' },
    ],
    powerups: [
      { x: 350, y: 470, type: 0 },
      { x: 750, y: 470, type: 1 },
      { x: 1150, y: 470, type: 2 },
      { x: 1550, y: 470, type: 3 },
      { x: 1950, y: 470, type: 4 },
      { x: 2500, y: 470, type: 5 },
    ],
    spawn: { x: 50, y: 460 },
    exit: { x: 2700, y: 460 },
  },

  // 15 - Spike obstacle course
  {
    name: '尖刺阵',
    desc: '精准跳跃避开尖刺陷阱',
    width: 2600,
    theme: 'sunset',
    platforms: [
      { x: 0, y: 520, w: 150, h: 80, type: 'normal' },
      { x: 200, y: 480, w: 60, h: 30, type: 'normal' },
      { x: 320, y: 440, w: 60, h: 30, type: 'normal' },
      { x: 440, y: 520, w: 100, h: 80, type: 'normal' },
      { x: 600, y: 460, w: 60, h: 30, type: 'normal' },
      { x: 720, y: 400, w: 60, h: 30, type: 'normal' },
      { x: 840, y: 520, w: 100, h: 80, type: 'normal' },
      { x: 1000, y: 440, w: 60, h: 30, type: 'normal' },
      { x: 1120, y: 380, w: 60, h: 30, type: 'normal' },
      { x: 1240, y: 520, w: 200, h: 80, type: 'normal' },
      { x: 1500, y: 450, w: 60, h: 30, type: 'normal' },
      { x: 1620, y: 380, w: 60, h: 30, type: 'normal' },
      { x: 1740, y: 520, w: 860, h: 80, type: 'normal' },
    ],
    switches: [],
    doors: [],
    hazards: [
      { x: 180, y: 560, w: 20, h: 20, type: 'spike' },
      { x: 300, y: 560, w: 20, h: 20, type: 'spike' },
      { x: 420, y: 560, w: 20, h: 20, type: 'spike' },
      { x: 580, y: 560, w: 20, h: 20, type: 'spike' },
      { x: 700, y: 560, w: 20, h: 20, type: 'spike' },
      { x: 820, y: 560, w: 20, h: 20, type: 'spike' },
      { x: 980, y: 560, w: 20, h: 20, type: 'spike' },
      { x: 1100, y: 560, w: 20, h: 20, type: 'spike' },
      { x: 1480, y: 560, w: 20, h: 20, type: 'spike' },
      { x: 1600, y: 560, w: 20, h: 20, type: 'spike' },
    ],
    enemies: [],
    collectibles: [
      { x: 250, y: 430, type: 'coin' },
      { x: 650, y: 410, type: 'question' },
      { x: 1050, y: 390, type: 'coin' },
      { x: 1550, y: 400, type: 'coin' },
    ],
    powerups: [{ x: 1180, y: 340, type: 7 }],
    spawn: { x: 50, y: 460 },
    exit: { x: 2520, y: 460 },
  },

  // 16 - Low gravity zones
  {
    name: '低重力区',
    desc: '在低重力区域中飘浮跳跃',
    width: 2600,
    theme: 'town',
    platforms: [
      { x: 0, y: 520, w: 200, h: 80, type: 'normal' },
      { x: 250, y: 520, w: 400, h: 80, type: 'lowgrav' },
      { x: 700, y: 400, w: 80, h: 30, type: 'normal' },
      { x: 850, y: 320, w: 80, h: 30, type: 'normal' },
      { x: 1000, y: 240, w: 80, h: 30, type: 'normal' },
      { x: 1150, y: 520, w: 400, h: 80, type: 'lowgrav' },
      { x: 1600, y: 380, w: 80, h: 30, type: 'normal' },
      { x: 1750, y: 300, w: 80, h: 30, type: 'normal' },
      { x: 1900, y: 520, w: 700, h: 80, type: 'normal' },
    ],
    switches: [],
    doors: [],
    hazards: [],
    enemies: [],
    collectibles: [
      { x: 350, y: 470, type: 'coin' },
      { x: 750, y: 350, type: 'question' },
      { x: 1250, y: 470, type: 'coin' },
      { x: 1800, y: 250, type: 'coin' },
    ],
    powerups: [{ x: 1650, y: 330, type: 2 }],
    spawn: { x: 50, y: 460 },
    exit: { x: 2520, y: 460 },
  },

  // 17 - Chain switches
  {
    name: '连锁开关',
    desc: '激活所有开关才能打开大门',
    width: 3000,
    theme: 'factory',
    platforms: [
      { x: 0, y: 520, w: 3000, h: 80, type: 'normal' },
      { x: 300, y: 420, w: 100, h: 30, type: 'normal' },
      { x: 700, y: 380, w: 100, h: 30, type: 'normal' },
      { x: 1100, y: 420, w: 100, h: 30, type: 'normal' },
      { x: 1500, y: 360, w: 100, h: 30, type: 'normal' },
      { x: 1900, y: 400, w: 100, h: 30, type: 'normal' },
      { x: 2300, y: 350, w: 100, h: 30, type: 'normal' },
    ],
    switches: [],
    doors: [],
    hazards: [
      { x: 500, y: 560, w: 150, h: 20, type: 'spike' },
      { x: 1300, y: 560, w: 150, h: 20, type: 'spike' },
    ],
    enemies: [
      { x: 600, y: 470, w: 50, h: 50, type: 'bubble', patrol: [500, 900], speed: 2 },
      { x: 1700, y: 470, w: 50, h: 50, type: 'bubble', patrol: [1600, 2000], speed: 2.5 },
    ],
    collectibles: [
      { x: 400, y: 470, type: 'coin' },
      { x: 800, y: 330, type: 'question' },
      { x: 1550, y: 310, type: 'coin' },
      { x: 2350, y: 300, type: 'coin' },
    ],
    powerups: [{ x: 1950, y: 350, type: 4 }],
    spawn: { x: 50, y: 460 },
    exit: { x: 2920, y: 460 },
  },

  // 18 - Fast bubble chase
  {
    name: '泡泡追逐',
    desc: '快速移动的泡泡怪在追赶你',
    width: 3200,
    theme: 'sunset',
    platforms: [
      { x: 0, y: 520, w: 3200, h: 80, type: 'normal' },
      { x: 400, y: 420, w: 80, h: 30, type: 'normal' },
      { x: 800, y: 380, w: 80, h: 30, type: 'normal' },
      { x: 1200, y: 420, w: 80, h: 30, type: 'normal' },
      { x: 1600, y: 360, w: 80, h: 30, type: 'normal' },
      { x: 2000, y: 400, w: 80, h: 30, type: 'normal' },
      { x: 2400, y: 350, w: 80, h: 30, type: 'normal' },
      { x: 2800, y: 400, w: 80, h: 30, type: 'normal' },
    ],
    switches: [],
    doors: [],
    hazards: [],
    enemies: [
      { x: 1200, y: 470, w: 55, h: 55, type: 'bubble', patrol: [900, 3100], speed: 3.2, chase: true },
      { x: 1500, y: 470, w: 50, h: 50, type: 'bubble', patrol: [1400, 2000], speed: 3.5 },
      { x: 2500, y: 470, w: 60, h: 60, type: 'bubble', patrol: [2400, 3000], speed: 3.8 },
    ],
    collectibles: [
      { x: 450, y: 370, type: 'coin' },
      { x: 850, y: 330, type: 'question' },
      { x: 1650, y: 310, type: 'coin' },
      { x: 2450, y: 300, type: 'coin' },
    ],
    powerups: [{ x: 1250, y: 370, type: 0 }],
    spawn: { x: 50, y: 460 },
    exit: { x: 3100, y: 460 },
  },

  // 19 - Ultimate mix
  {
    name: '终极融合',
    desc: '所有机制的终极考验',
    width: 3400,
    theme: 'town',
    timeLimit: 90,
    platforms: [
      { x: 0, y: 520, w: 200, h: 80, type: 'bouncy' },
      { x: 250, y: 520, w: 150, h: 80, type: 'gel' },
      { x: 450, y: 480, w: 80, h: 30, type: 'normal' },
      { x: 600, y: 520, w: 200, h: 80, type: 'melting', meltDelay: 3 },
      { x: 850, y: 420, w: 80, h: 30, type: 'moving', moveX: [850, 1100], speed: 2 },
      { x: 1200, y: 520, w: 150, h: 80, type: 'normal' },
      { x: 1400, y: 460, w: 80, h: 30, type: 'fake', vanishDelay: 0.5 },
      { x: 1550, y: 400, w: 80, h: 30, type: 'normal' },
      { x: 1700, y: 520, w: 200, h: 80, type: 'bouncy' },
      { x: 1950, y: 450, w: 80, h: 30, type: 'normal' },
      { x: 2100, y: 520, w: 300, h: 80, type: 'gel' },
      { x: 2450, y: 400, w: 80, h: 30, type: 'normal' },
      { x: 2600, y: 520, w: 800, h: 80, type: 'normal' },
    ],
    vents: [
      { x: 1100, y: 350, w: 80, h: 120, dir: 1, power: 14 },
      { x: 2300, y: 320, w: 80, h: 120, dir: -1, power: 12 },
    ],
    rollers: [
      { x: 1680, y: 490, r: 35, speed: 3, dir: 1, moveX: [1680, 2550], oneWay: true, patrolSpeed: 2.2 },
    ],
    switches: [],
    doors: [],
    hazards: [
      { x: 1300, y: 560, w: 50, h: 20, type: 'spike' },
    ],
    enemies: [
      { x: 1600, y: 470, w: 55, h: 55, type: 'bubble', patrol: [1500, 1900], speed: 2.5 },
    ],
    collectibles: [
      { x: 300, y: 470, type: 'coin' },
      { x: 900, y: 370, type: 'question' },
      { x: 2000, y: 400, type: 'coin' },
      { x: 2550, y: 350, type: 'coin' },
    ],
    powerups: [{ x: 2200, y: 470, type: 7 }],
    spawn: { x: 50, y: 460 },
    exit: { x: 3320, y: 460 },
  },

  // 20 - Final level — 3× level-19 mix gauntlet
  buildLevel20(),
];

const POWERUP_NAMES = [
  '超级皇冠 - 短暂无敌',
  '耀西蛋 - 额外生命',
  '心之花 - 恢复生命',
  '火焰花 - 火焰强化',
  '紫蘑菇 - 变大',
  '加速蘑菇 - 速度提升',
  '高跳蘑菇 - 跳跃强化',
  'Peachette - 滑翔',
];

const POWERUP_DURATION = 8000;
