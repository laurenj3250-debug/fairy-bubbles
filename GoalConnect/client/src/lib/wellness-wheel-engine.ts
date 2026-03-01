// Wonderland Wellness Wheel — Canvas Engine
// Extracted from wheel/index.html for React integration
// This is vanilla JS wrapped in a TypeScript module. The engine uses
// mutable globals and imperative DOM manipulation by design (2000+ lines
// of canvas rendering). We inject storage + container to decouple from
// localStorage and static HTML.

/* eslint-disable */
// @ts-nocheck — This file is intentionally untyped vanilla JS wrapped for module export.
// The canvas engine uses 30+ mutable closure variables and imperative patterns
// that would require a full rewrite to properly type.

export interface WheelStorageAdapter {
  get(key: string, fallback: any): any;
  set(key: string, val: any): void;
}

export function initWheelEngine(
  container: HTMLElement,
  storage: WheelStorageAdapter,
  assetBasePath: string = '/wheel/',
): { destroy: () => void; getCupLevels: () => number[] } {

  let _destroyed = false;
  let _animFrame: number | null = null;

// ═══════════════════════════════════════════════
//  WONDERLAND WELLNESS WHEEL — DROP 4
//  Drops 1-3: visual wheel, interaction, logger,
//  nudge cards, data export.
//  Drop 4: desaturation cascade, audio, sparklines,
//  onboarding, Siri URL shortcuts.
// ═══════════════════════════════════════════════

const CUPS = [
  { name: 'Body',      color: '#C2546A', hex: [194, 84, 106], deep: [65, 18, 28],   bright: [235, 140, 165] },
  { name: 'Adventure', color: '#3A9DAF', hex: [58, 157, 175], deep: [12, 48, 58],   bright: [105, 215, 235] },
  { name: 'Novelty',   color: '#C45990', hex: [196, 89, 144], deep: [60, 18, 42],   bright: [238, 145, 200] },
  { name: 'Soul',      color: '#8E50AF', hex: [142, 80, 175], deep: [42, 18, 55],   bright: [190, 135, 228] },
  { name: 'People',    color: '#CFA050', hex: [207, 160, 80], deep: [72, 50, 18],   bright: [248, 218, 130] },
  { name: 'Mastery',   color: '#4FA070', hex: [79, 160, 112], deep: [18, 52, 30],   bright: [130, 208, 160] },
];

// ── Asset Loading ────────────────────────────
const ASSETS = {};
const ASSET_KEYS = [
  ['forest-overlay', assetBasePath + 'assets/forest-overlay.png'],
  ['rim-ornate',     assetBasePath + 'assets/rim-ornate.png'],
  ['spoke-vine-a',   assetBasePath + 'assets/spoke-vine-a.png'],
  ['spoke-vine-b',   assetBasePath + 'assets/spoke-vine-b.png'],
  ['mushroom',       assetBasePath + 'assets/mushroom-cluster.png'],
  ['center-orb',     assetBasePath + 'assets/center-orb.png'],
  ['motif-body',     assetBasePath + 'assets/motif-body.png'],
  ['motif-adventure',assetBasePath + 'assets/motif-adventure.png'],
  ['motif-novelty',  assetBasePath + 'assets/motif-novelty.png'],
  ['motif-soul',     assetBasePath + 'assets/motif-soul.png'],
  ['motif-people',   assetBasePath + 'assets/motif-people.png'],
  ['motif-mastery',  assetBasePath + 'assets/motif-mastery.png'],
];
const CUP_MOTIF_KEYS = ['motif-body','motif-adventure','motif-novelty','motif-soul','motif-people','motif-mastery'];
let assetsReady = false;
function loadAssets(callback) {
  let loaded = 0;
  for (const [key, path] of ASSET_KEYS) {
    const img = new Image();
    img.onload = img.onerror = () => { ASSETS[key] = img; if (++loaded === ASSET_KEYS.length) { assetsReady = true; callback(); } };
    img.src = path;
  }
}

// ── Pre-scaled Buffers ──────────────────────
const BUFFERS = {};
function prepareBuffers() {
  if (!assetsReady) return;
  const sz = Math.ceil(outerR * 2.6);
  // Forest overlay buffer with radial fade
  if (ASSETS['forest-overlay'] && ASSETS['forest-overlay'].naturalWidth) {
    const c = document.createElement('canvas'); c.width = c.height = sz;
    const bx = c.getContext('2d');
    bx.drawImage(ASSETS['forest-overlay'], 0, 0, sz, sz);
    // Radial fade — soft edges
    bx.globalCompositeOperation = 'destination-in';
    const g = bx.createRadialGradient(sz/2, sz/2, sz*0.25, sz/2, sz/2, sz*0.50);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.6, 'rgba(255,255,255,0.9)');
    g.addColorStop(0.85, 'rgba(255,255,255,0.5)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    bx.fillStyle = g; bx.fillRect(0, 0, sz, sz);
    BUFFERS['forest-overlay'] = c;
  }
  // Rim buffer
  if (ASSETS['rim-ornate'] && ASSETS['rim-ornate'].naturalWidth) {
    const rimSz = Math.ceil(outerR * 2.15);
    const c = document.createElement('canvas'); c.width = c.height = rimSz;
    const bx = c.getContext('2d');
    bx.drawImage(ASSETS['rim-ornate'], 0, 0, rimSz, rimSz);
    BUFFERS['rim-ornate'] = c;
  }
  // Center orb buffer
  if (ASSETS['center-orb'] && ASSETS['center-orb'].naturalWidth) {
    const orbSz = Math.ceil(innerR * 2.2);
    const c = document.createElement('canvas'); c.width = c.height = orbSz;
    const bx = c.getContext('2d');
    bx.drawImage(ASSETS['center-orb'], 0, 0, orbSz, orbSz);
    BUFFERS['center-orb'] = c;
  }
}

const LEVEL_LABELS = ['Empty','Low','Okay','Good','Full'];

const NUDGES = {
  gentle: [
    "Your body\u2019s been still too long. Even 20 minutes would help.",
    "When\u2019s the last time something scared you in a good way?",
    "Everything\u2019s felt the same. Try one new thing today, even small.",
    "You haven\u2019t made anything or felt anything beautiful in a while.",
    "You\u2019re drifting. Reach out to someone. Not about work.",
    "Your brain needs something harder than autopilot.",
  ],
  urgent: [
    "This is affecting everything else. Move today, even 30 minutes.",
    "You\u2019re suffocating. Plan something with real stakes this week.",
    "Every day is the same and it\u2019s killing you. Break one pattern today.",
    "When did you last feel something beautiful? Fix that tonight.",
    "Call someone. Not a text. A real voice. Now.",
    "You\u2019re rusting. Pick one hard thing and do it for 20 minutes.",
  ]
};

// ── Storage Helpers ─────────────────────────
// storage.get and storage.set are provided by the adapter — original localStorage functions removed







function formatDate(d) { return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function todayStr() { return formatDate(new Date()); }

// Daily snapshot: on first load of a new day, save levels for all missed days
function dailySnapshot(levels) {
  const lastCheck = storage.get('ww-checked-today', '');
  const today = todayStr();
  if (lastCheck && lastCheck !== today) {
    // Fill every day from lastCheck through yesterday with last-known levels
    const d = new Date(lastCheck + 'T12:00:00'); // noon avoids DST edge
    const end = new Date(today + 'T12:00:00');
    while (d < end) {
      const ds = formatDate(d);
      if (!storage.get('ww-history:' + ds, null)) {
        storage.set('ww-history:' + ds, [...levels]);
      }
      d.setDate(d.getDate() + 1);
    }
  }
}

// ── State ───────────────────────────────────
const defaultLevels = [3, 3, 3, 3, 3, 3];
const savedLevels = storage.get('ww-cup-levels', defaultLevels);
dailySnapshot(savedLevels);
const cupLevels   = savedLevels;
const cupAnimated = [...savedLevels];

let checkedToday = storage.get('ww-checked-today', '') === todayStr();

function persistLevels(changedCup) {
  storage.set('ww-cup-levels', cupLevels);
  // Keep ww-history:today in sync so historical data reflects final state
  if (storage.get('ww-history:' + todayStr(), null)) {
    storage.set('ww-history:' + todayStr(), [...cupLevels]);
  }
  if (changedCup !== undefined && !checkInActive) {
    // Individual timestamps only for ad-hoc changes outside check-in
    const ts = storage.get('ww-cup-timestamps', {});
    ts[CUPS[changedCup].name.toLowerCase()] = new Date().toISOString();
    storage.set('ww-cup-timestamps', ts);
  }
  if (!checkedToday && !checkInActive) { checkedToday = true; storage.set('ww-checked-today', todayStr()); }
}

const ORB_NX = 0.50, ORB_NY = 0.43;
const OUTER_R = 0.34, INNER_R = 0.10;
const WEDGE = Math.PI / 3;
const RING_W = 3.5;

const frame = container.querySelector('#phone-frame');
const canvas = container.querySelector('#wheel-canvas');
let ctx = canvas.getContext('2d');
const bgImg = container.querySelector('#bg');
const panel = container.querySelector('#detail-panel');
const panelName = container.querySelector('#panel-cup-name');
const panelNudge = container.querySelector('#panel-nudge');
const panelLevels = container.querySelector('#panel-levels');

let orbX=0, orbY=0, outerR=0, innerR=0, dpr=1, depth=0;
let startTime = performance.now();

// Cascade globals
let gSpeed=1, gParticles=1, gGlow=1, gRandom=1, gSaturation=1;

// Interaction
let pressTimer=null, pressPos=null, panelOpen=false, activeCup=-1;
let orbMode=0, lastInteraction=0, logPanelOpen=false; // orbMode: 0=normal, 1=levels, 2=sparklines, 3=heatmap

// Check-in mode
let checkInActive=false;
const checkInTouched=[false,false,false,false,false,false];

// Onboarding
let onboardingActive=false, onboardingPhase=0, onboardingStart=0;
const onboardingCupAlphas=[0,0,0,0,0,0];

// ── Sparkle Particles ───────────────────────
const sparkles = [];
const MAX_SPARKLES = 250;

function spawnSparkle(ci) {
  const level = cupAnimated[ci];
  if (level < 0.8 || sparkles.length >= MAX_SPARKLES) return;
  const [r,g,b] = cupDesat[ci].bright;
  const sA = (-Math.PI/2) + ci * WEDGE;
  const angle = sA + 0.06 + Math.random() * (WEDGE - 0.12);
  const bandDepth = depth / 5;
  const litBands = Math.min(level, 5);
  const maxR = innerR + litBands * bandDepth;
  const sr = innerR + (maxR - innerR) * (0.1 + Math.random()*0.85);
  sparkles.push({
    x: _cx+Math.cos(angle)*sr, y: _cy+Math.sin(angle)*sr,
    vx: (Math.random()-0.5)*0.07*gRandom,
    vy: (Math.random()-0.5)*0.07*gRandom,
    life:0, maxLife: 2.5+Math.random()*4,
    r,g,b, size: 0.6+Math.random()*2.0, ci,
  });
}

function updateSparkles(dt) {
  for(let i=0;i<6;i++){
    const rate = ((cupAnimated[i]-0.5)/4.5)*1.8*gParticles*gSpeed;
    if(Math.random()<rate*dt) spawnSparkle(i);
    if(Math.random()<rate*dt*0.5) spawnSparkle(i);
  }
  for(let i=sparkles.length-1;i>=0;i--){
    const p=sparkles[i];
    p.life+=dt*gSpeed;
    const ang=Math.atan2(p.y-_cy,p.x-_cx);
    const tA=ang+Math.PI/2;
    p.vx+=(Math.cos(tA)*0.004*gRandom)*gSpeed;
    p.vy+=(Math.sin(tA)*0.004*gRandom)*gSpeed;
    p.vx*=0.99; p.vy*=0.99;
    p.x+=p.vx; p.y+=p.vy;
    // Kill sparkles that drift inside the inner ring (swap-and-pop for O(1))
    const sDist=Math.sqrt((p.x-_cx)**2+(p.y-_cy)**2);
    if(sDist<innerR+2 || p.life>=p.maxLife){sparkles[i]=sparkles[sparkles.length-1];sparkles.pop();}
  }
}


// ── Atmospheric Motes (Fireflies) ───────────
const motes = [];
const MAX_MOTES = 35;

function spawnMote() {
  if (motes.length >= MAX_MOTES) return;
  const angle = Math.random() * Math.PI * 2;
  const dist = outerR * (0.85 + Math.random() * 0.45);
  // Warm gold/amber palette
  const colorIdx = Math.random();
  const r = colorIdx < 0.5 ? 255 : 240;
  const g = colorIdx < 0.5 ? 220 + Math.random() * 30 : 190 + Math.random() * 30;
  const b = colorIdx < 0.5 ? 140 + Math.random() * 40 : 80 + Math.random() * 40;
  motes.push({
    x: _cx + Math.cos(angle) * dist,
    y: _cy + Math.sin(angle) * dist,
    vx: (Math.random() - 0.5) * 0.15,
    vy: (Math.random() - 0.5) * 0.15,
    life: 0, maxLife: 5 + Math.random() * 8,
    r, g, b,
    size: 0.8 + Math.random() * 1.5,
    phase: Math.random() * Math.PI * 2,
  });
}

function updateMotes(dt) {
  // Spawn to maintain population
  if (motes.length < MAX_MOTES && Math.random() < dt * 4) spawnMote();
  for (let i = motes.length - 1; i >= 0; i--) {
    const m = motes[i];
    m.life += dt;
    // Gentle wandering drift
    m.vx += (Math.random() - 0.5) * 0.02;
    m.vy += (Math.random() - 0.5) * 0.02;
    m.vx *= 0.98; m.vy *= 0.98;
    m.x += m.vx; m.y += m.vy;
    const dist = Math.sqrt((m.x - _cx) ** 2 + (m.y - _cy) ** 2);
    if (m.life >= m.maxLife || dist < outerR * 0.75 || dist > outerR * 1.5) {
      motes[i] = motes[motes.length - 1]; motes.pop();
    }
  }
}

function drawMotes() {
  for (const m of motes) {
    const progress = m.life / m.maxLife;
    let alpha;
    if (progress < 0.15) alpha = progress / 0.15;
    else if (progress < 0.7) alpha = 1;
    else alpha = 1 - (progress - 0.7) / 0.3;
    // Gentle pulsing
    alpha *= 0.5 + 0.5 * Math.sin(m.life * 1.2 + m.phase);
    if (alpha < 0.02) continue;
    // Soft glow
    ctx.beginPath(); ctx.arc(m.x, m.y, m.size * 5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${m.r},${m.g},${m.b},${(alpha * 0.08).toFixed(3)})`;
    ctx.fill();
    // Warm core
    ctx.beginPath(); ctx.arc(m.x, m.y, m.size * 1.8, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${m.r},${m.g},${m.b},${(alpha * 0.20).toFixed(3)})`;
    ctx.fill();
    // Bright dot
    ctx.beginPath(); ctx.arc(m.x, m.y, m.size * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,240,${(alpha * 0.45).toFixed(3)})`;
    ctx.fill();
  }
}

// ── Cascade ─────────────────────────────────
function updateCascade(){
  const e=i=>Math.max(0,(3-cupAnimated[i])/2);
  gSpeed=1-e(0)*.65;
  gParticles=1-e(4)*.75;
  gGlow=Math.max(0.70, 1-e(3)*.55);      // floor 0.70 — glow always visible
  gRandom=1-e(2)*.65;
  gSaturation=Math.max(0.35, 1-e(1)*.65);
  recomputeDesatColors();
}

// ── Layout ──────────────────────────────────
let _cx=0,_cy=0;
function computeLayout(){
  const fw=frame.clientWidth,fh=frame.clientHeight;
  dpr=window.devicePixelRatio||1;
  // On square/wide frames (desktop), center the orb; on tall frames (phone), use 43%
  const nyAdj = (fh/fw < 1.4) ? 0.50 : ORB_NY;
  orbX=ORB_NX*fw;orbY=nyAdj*fh;
  outerR=fw*OUTER_R;innerR=fw*INNER_R;depth=outerR-innerR;
  const pad=outerR*0.65;
  const cW=(outerR+pad)*2,cH=(outerR+pad)*2;
  canvas.style.left=(orbX-outerR-pad)+'px';canvas.style.top=(orbY-outerR-pad)+'px';
  canvas.style.width=cW+'px';canvas.style.height=cH+'px';
  canvas.width=Math.round(cW*dpr);canvas.height=Math.round(cH*dpr);
  _cx=canvas.width/(2*dpr);_cy=canvas.height/(2*dpr);
  prepareBuffers();
  invalidateOverlay();
}

// ── Helpers ─────────────────────────────────
// Cached desaturated colors — recomputed once per frame in updateCascade()
const cupDesat = CUPS.map(() => ({ hex:[0,0,0], deep:[0,0,0], bright:[0,0,0] }));
let _lastSat = -999;
function recomputeDesatColors() {
  if (gSaturation === _lastSat) return;
  _lastSat = gSaturation;
  const s = gSaturation;
  for (let i = 0; i < 6; i++) {
    for (const key of ['hex','deep','bright']) {
      const [r,g,b] = CUPS[i][key];
      const lum = 0.299*r + 0.587*g + 0.114*b;
      cupDesat[i][key][0] = Math.round(lum + (r-lum)*s);
      cupDesat[i][key][1] = Math.round(lum + (g-lum)*s);
      cupDesat[i][key][2] = Math.round(lum + (b-lum)*s);
    }
  }
}

// ── Drawing: Drop Shadow ─────────────────────
// Soft dark shadow behind the wheel so it sits in the scene
function drawDropShadow() {
  const x=_cx, y=_cy;
  // Offset slightly down-right for natural light direction
  const offX=3, offY=5;
  const shadowR=outerR+12;
  const shadow=ctx.createRadialGradient(x+offX,y+offY,innerR*0.5,x+offX,y+offY,shadowR);
  shadow.addColorStop(0,'rgba(10,4,8,0.18)');
  shadow.addColorStop(0.5,'rgba(10,4,8,0.10)');
  shadow.addColorStop(0.8,'rgba(10,4,8,0.03)');
  shadow.addColorStop(1,'rgba(10,4,8,0)');
  ctx.fillStyle=shadow;
  ctx.beginPath();ctx.arc(x+offX,y+offY,shadowR,0,Math.PI*2);ctx.fill();
}

// ── Drawing: Colored Light Spill ────────────
// Projects wedge colors beyond boundary onto the scene
function drawLightSpill(t) {
  const x=_cx,y=_cy;
  // Clip to annulus — no color bleed into the center orb
  ctx.save();
  ctx.beginPath();
  ctx.arc(x,y,outerR*1.3,0,Math.PI*2);
  ctx.arc(x,y,innerR+2,0,Math.PI*2,true);
  ctx.closePath();
  ctx.clip();
  for(let i=0;i<6;i++){
    const level=cupAnimated[i];
    if(level<0.5) continue;
    const [cr,cg,cb]=cupDesat[i].hex;
    const alpha=(level/5)*0.28*gGlow*onboardingCupAlphas[i];
    const midA=(-Math.PI/2)+i*WEDGE+WEDGE/2;
    const spillDist=outerR*0.60;
    const sx=x+Math.cos(midA)*spillDist,sy=y+Math.sin(midA)*spillDist;
    const spillR=outerR*0.65;
    const spill=ctx.createRadialGradient(sx,sy,0,sx,sy,spillR);
    spill.addColorStop(0,`rgba(${cr},${cg},${cb},${alpha.toFixed(3)})`);
    spill.addColorStop(1,`rgba(${cr},${cg},${cb},0)`);
    ctx.fillStyle=spill;
    ctx.beginPath();ctx.arc(sx,sy,spillR,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
}

// ── Drawing: Glass Backing ───────────────────
// Uniform dark tint in the annulus — empty glass panels
function drawGlassBacking() {
  const x=_cx, y=_cy;
  ctx.save();
  ctx.beginPath();
  ctx.arc(x,y,outerR-1,0,Math.PI*2);
  ctx.arc(x,y,innerR+1,0,Math.PI*2,true);
  ctx.closePath();
  ctx.fillStyle='rgba(12,6,10,0.18)';
  ctx.fill();
  ctx.restore();
}

// ── Drawing: Stained Glass Bands ─────────────
// 6 cups × 5 bands = 30 arc sectors with radial gradient fills
function drawGlassBands(t) {
  const x=_cx, y=_cy;
  const bandDepth = depth / 5;
  const gap = 0.015;

  for (let i = 0; i < 6; i++) {
    const anim = cupAnimated[i];
    if (onboardingCupAlphas[i] < 0.01) continue;
    const [cr,cg,cb] = cupDesat[i].hex;
    const [dr,dg,db] = cupDesat[i].deep;
    const [br,bg_c,bb] = cupDesat[i].bright;
    const sA = (-Math.PI/2) + i * WEDGE + gap;
    const eA = sA + WEDGE - 2 * gap;

    for (let b = 0; b < 5; b++) {
      const bInner = innerR + b * bandDepth + 0.5;
      const bOuter = innerR + (b + 1) * bandDepth - 0.5;

      // Determine lit state from animated level (1-5)
      let brightness;
      if (b < Math.floor(anim)) brightness = 1;
      else if (b < Math.ceil(anim) && anim > b) brightness = anim - b;
      else brightness = 0;
      brightness *= onboardingCupAlphas[i];

      ctx.beginPath();
      ctx.arc(x, y, bOuter, sA, eA);
      ctx.arc(x, y, bInner, eA, sA, true);
      ctx.closePath();

      if (brightness > 0.01) {
        const grad = ctx.createRadialGradient(x, y, bInner, x, y, bOuter);
        const a1 = (0.30 + brightness * 0.55).toFixed(3);
        const a2 = (0.40 + brightness * 0.50).toFixed(3);
        grad.addColorStop(0, `rgba(${dr},${dg},${db},${a1})`);
        grad.addColorStop(0.4, `rgba(${cr},${cg},${cb},${a1})`);
        grad.addColorStop(1, `rgba(${br},${bg_c},${bb},${a2})`);
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = `rgba(${cr},${cg},${cb},0.06)`;
      }
      ctx.fill();
    }

    // Additive glow for lit wedges
    if (anim > 0.5) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const litR = innerR + Math.min(anim, 5) * bandDepth;
      const midA = sA + (eA - sA) * 0.5;
      const glowDist = (innerR + litR) * 0.5;
      const gx = x + Math.cos(midA) * glowDist;
      const gy = y + Math.sin(midA) * glowDist;
      const glowR = depth * 0.45;
      const glowAlpha = (0.03 + (anim/5) * 0.04) * gGlow * onboardingCupAlphas[i];
      const glow = ctx.createRadialGradient(gx, gy, 0, gx, gy, glowR);
      glow.addColorStop(0, `rgba(${br},${bg_c},${bb},${glowAlpha.toFixed(3)})`);
      glow.addColorStop(0.5, `rgba(${cr},${cg},${cb},${(glowAlpha*0.4).toFixed(3)})`);
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(gx, gy, glowR, 0, Math.PI*2); ctx.fill();
      ctx.restore();
    }
  }
}



// ── Drawing: Sparkles (bright, magical) ─────
function drawSparkles(){
  for(const p of sparkles){
    const alpha=Math.sin((p.life/p.maxLife)*Math.PI)*gGlow;
    if(alpha<.03)continue;
    // Wide soft colored glow
    ctx.beginPath();ctx.arc(p.x,p.y,p.size*5.5,0,Math.PI*2);
    ctx.fillStyle=`rgba(${p.r},${p.g},${p.b},${(alpha*.25).toFixed(3)})`;ctx.fill();
    // Bright colored core
    ctx.beginPath();ctx.arc(p.x,p.y,p.size*1.5,0,Math.PI*2);
    ctx.fillStyle=`rgba(${p.r},${p.g},${p.b},${(alpha*.55).toFixed(3)})`;ctx.fill();
    // White-hot center
    ctx.beginPath();ctx.arc(p.x,p.y,p.size*.6,0,Math.PI*2);
    ctx.fillStyle=`rgba(255,255,255,${(alpha*.9).toFixed(3)})`;ctx.fill();
  }
}

// ── Drawing: Gold Frame (Stained Glass) ──────
// Multi-pass gold rendering: rims, spokes, band separators, intersection dots
function drawGoldFrame() {
  const x=_cx, y=_cy;
  const bandDepth = depth / 5;

  // Gold gradient — diagonal specular
  const goldGrad = ctx.createLinearGradient(x-outerR, y-outerR, x+outerR, y+outerR);
  goldGrad.addColorStop(0, '#FFF8DC');
  goldGrad.addColorStop(0.15, '#F5D576');
  goldGrad.addColorStop(0.35, '#DAA520');
  goldGrad.addColorStop(0.6, '#B8912E');
  goldGrad.addColorStop(0.85, '#8B6914');
  goldGrad.addColorStop(1, '#5C4010');

  // Warm halo
  ctx.save();
  const halo = ctx.createRadialGradient(x, y, outerR-2, x, y, outerR+28);
  halo.addColorStop(0, 'rgba(212,168,67,0.16)');
  halo.addColorStop(0.5, 'rgba(180,140,60,0.06)');
  halo.addColorStop(1, 'rgba(180,140,60,0)');
  ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(x, y, outerR+28, 0, Math.PI*2); ctx.fill();
  ctx.restore();

  // === Outer rim: shadow → gold → highlight ===
  ctx.strokeStyle = '#2A1C08'; ctx.lineWidth = RING_W+3;
  ctx.beginPath(); ctx.arc(x, y, outerR, 0, Math.PI*2); ctx.stroke();
  ctx.strokeStyle = goldGrad; ctx.lineWidth = RING_W;
  ctx.beginPath(); ctx.arc(x, y, outerR, 0, Math.PI*2); ctx.stroke();
  ctx.save(); ctx.globalAlpha = 0.40;
  ctx.strokeStyle = '#FFF8DC'; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.arc(x, y, outerR-RING_W*0.35, 0, Math.PI*2); ctx.stroke();
  ctx.restore();

  // === Inner rim: shadow → gold → highlight ===
  ctx.strokeStyle = '#2A1C08'; ctx.lineWidth = RING_W+2;
  ctx.beginPath(); ctx.arc(x, y, innerR, 0, Math.PI*2); ctx.stroke();
  ctx.strokeStyle = goldGrad; ctx.lineWidth = RING_W*0.8;
  ctx.beginPath(); ctx.arc(x, y, innerR, 0, Math.PI*2); ctx.stroke();
  ctx.save(); ctx.globalAlpha = 0.35;
  ctx.strokeStyle = '#FFF8DC'; ctx.lineWidth = 0.6;
  ctx.beginPath(); ctx.arc(x, y, innerR+RING_W*0.25, 0, Math.PI*2); ctx.stroke();
  ctx.restore();

  // === 6 spokes: shadow → gold → highlight ===
  for (let i = 0; i < 6; i++) {
    const a = (-Math.PI/2) + i * WEDGE;
    const x1 = x+Math.cos(a)*innerR, y1 = y+Math.sin(a)*innerR;
    const x2 = x+Math.cos(a)*outerR, y2 = y+Math.sin(a)*outerR;
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2);
    ctx.strokeStyle = '#2A1C08'; ctx.lineWidth = RING_W+2; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2);
    ctx.strokeStyle = goldGrad; ctx.lineWidth = RING_W*0.7; ctx.stroke();
    ctx.save(); ctx.globalAlpha = 0.30;
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2);
    ctx.strokeStyle = '#FFF8DC'; ctx.lineWidth = 0.6; ctx.stroke();
    ctx.restore();
  }

  // === 4 band separator arcs ("lead came") ===
  for (let b = 1; b < 5; b++) {
    const r = innerR + b * bandDepth;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2);
    ctx.strokeStyle = 'rgba(30,20,8,0.65)'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.save(); ctx.globalAlpha = 0.15;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2);
    ctx.strokeStyle = goldGrad; ctx.lineWidth = 0.6; ctx.stroke();
    ctx.restore();
  }

  // === 24 intersection dots (spokes × band separators) ===
  for (let i = 0; i < 6; i++) {
    const a = (-Math.PI/2) + i * WEDGE;
    for (let b = 1; b < 5; b++) {
      const r = innerR + b * bandDepth;
      const dx = x+Math.cos(a)*r, dy = y+Math.sin(a)*r;
      ctx.beginPath(); ctx.arc(dx, dy, 2.2, 0, Math.PI*2);
      ctx.fillStyle = '#DAA520'; ctx.fill();
      ctx.save(); ctx.globalAlpha = 0.5;
      ctx.beginPath(); ctx.arc(dx, dy, 1.0, 0, Math.PI*2);
      ctx.fillStyle = '#FFF8DC'; ctx.fill();
      ctx.restore();
    }
  }
}

// ── Drawing: Center Medallion ────────────────
// Concentric gold rings + lotus petal motif + warm glow + check-in text
function drawCenterMedallion(t) {
  const x=_cx, y=_cy;
  let pulseSpeed, pulseRange, pulseBase;
  if (checkInActive) {
    const touchedCount = checkInTouched.filter(Boolean).length;
    const progress = touchedCount / 6;
    pulseSpeed = 1.2 + progress * 0.8;
    pulseRange = 0.10 + progress * 0.15;
    pulseBase = 0.65 + progress * 0.30;
  } else {
    pulseSpeed = checkedToday ? 0.5 : 0.25;
    pulseRange = checkedToday ? 0.18 : 0.06;
    pulseBase  = checkedToday ? 0.90 : 0.60;
  }
  const pulse = Math.sin(t*pulseSpeed*gSpeed)*pulseRange+pulseBase;
  const gi = gGlow;
  const domeR = innerR - RING_W*0.4;

  // 1. Clear center
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath(); ctx.arc(x, y, innerR-RING_W*0.3, 0, Math.PI*2);
  ctx.fillStyle = 'rgba(0,0,0,1)'; ctx.fill();
  ctx.restore();

  // 2. Dark backing
  ctx.beginPath(); ctx.arc(x, y, domeR, 0, Math.PI*2);
  ctx.fillStyle = 'rgba(18,10,6,0.92)'; ctx.fill();

  // 3. Warm glow extending outward
  const outerGlow = ctx.createRadialGradient(x, y, 0, x, y, innerR*1.1);
  outerGlow.addColorStop(0, `rgba(255,230,160,${(.15*pulse*gi).toFixed(3)})`);
  outerGlow.addColorStop(0.5, `rgba(212,168,67,${(.08*pulse*gi).toFixed(3)})`);
  outerGlow.addColorStop(1, 'rgba(180,140,60,0)');
  ctx.fillStyle = outerGlow;
  ctx.beginPath(); ctx.arc(x, y, innerR*1.1, 0, Math.PI*2); ctx.fill();

  // 4. Three concentric gold rings
  const ringRs = [domeR*0.85, domeR*0.58, domeR*0.32];
  for (const rr of ringRs) {
    ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI*2);
    ctx.strokeStyle = '#2A1C08'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI*2);
    ctx.strokeStyle = '#DAA520'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.save(); ctx.globalAlpha = 0.30;
    ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI*2);
    ctx.strokeStyle = '#FFF8DC'; ctx.lineWidth = 0.5; ctx.stroke();
    ctx.restore();
  }

  // 5. Six petal arcs (lotus motif between inner rings)
  const petalInner = ringRs[2] + 2;
  const petalOuter = ringRs[1] - 2;
  ctx.save(); ctx.globalAlpha = 0.25 * gi;
  for (let i = 0; i < 6; i++) {
    const a = (-Math.PI/2) + i*WEDGE + WEDGE/2;
    const px = x + Math.cos(a)*((petalInner+petalOuter)/2);
    const py = y + Math.sin(a)*((petalInner+petalOuter)/2);
    const pr = (petalOuter-petalInner)*0.5;
    ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI*2);
    ctx.strokeStyle = '#DAA520'; ctx.lineWidth = 1.2; ctx.stroke();
  }
  ctx.restore();

  // 6. Warm pulsing overlay
  const warmPulse = ctx.createRadialGradient(x, y, 0, x, y, innerR*0.6);
  warmPulse.addColorStop(0, `rgba(255,240,200,${(.30*pulse*gi).toFixed(3)})`);
  warmPulse.addColorStop(0.5, `rgba(240,200,120,${(.12*pulse*gi).toFixed(3)})`);
  warmPulse.addColorStop(1, 'rgba(212,168,67,0)');
  ctx.fillStyle = warmPulse; ctx.beginPath(); ctx.arc(x, y, innerR*0.6, 0, Math.PI*2); ctx.fill();

  // 7. Additive radiance
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const radiance = ctx.createRadialGradient(x, y, 0, x, y, outerR*0.6);
  radiance.addColorStop(0, `rgba(255,230,160,${(.06*pulse*gi).toFixed(3)})`);
  radiance.addColorStop(0.4, `rgba(212,168,67,${(.03*pulse*gi).toFixed(3)})`);
  radiance.addColorStop(1, 'rgba(180,140,60,0)');
  ctx.fillStyle = radiance; ctx.beginPath(); ctx.arc(x, y, outerR*0.6, 0, Math.PI*2); ctx.fill();
  ctx.restore();

  // 8. Level numbers
  if (orbMode === 1) {
    const nR = innerR*0.55;
    ctx.save();
    for (let i = 0; i < 6; i++) {
      const a = (-Math.PI/2) + i*WEDGE + WEDGE/2;
      ctx.font = `600 ${Math.round(innerR*0.35)}px 'Cormorant Garamond',Georgia,serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 2;
      ctx.strokeText(cupLevels[i], x+Math.cos(a)*nR, y+Math.sin(a)*nR);
      ctx.fillStyle = CUPS[i].color; ctx.globalAlpha = 0.9;
      ctx.fillText(cupLevels[i], x+Math.cos(a)*nR, y+Math.sin(a)*nR);
    }
    ctx.restore();
  }

  // 9. Check-in orb hint
  if (checkInActive || !checkedToday) {
    let orbText, orbAlpha;
    if (checkInActive) {
      const allDone = checkInTouched.every(Boolean);
      orbText = allDone ? 'save' : 'check in';
      orbAlpha = allDone ? 0.75 : 0.35 + 0.15 * Math.sin(t*2);
    } else {
      orbText = 'check in';
      orbAlpha = 0.25 + 0.10 * Math.sin(t*1.2);
    }
    ctx.save();
    ctx.font = `300 ${Math.round(innerR*0.28)}px 'Cormorant Garamond',Georgia,serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.strokeStyle = 'rgba(10,4,8,0.5)'; ctx.lineWidth = 2;
    ctx.globalAlpha = orbAlpha;
    ctx.strokeText(orbText, x, y);
    ctx.fillStyle = 'rgba(255,248,220,0.85)';
    ctx.fillText(orbText, x, y);
    ctx.restore();
  }
}

// ── Drawing: Feathered Mask ─────────────────
function drawFeatheredMask(){
  ctx.save();ctx.globalCompositeOperation='destination-in';
  const fr=outerR*1.50;
  const g=ctx.createRadialGradient(_cx,_cy,outerR*.80,_cx,_cy,fr);
  g.addColorStop(0,'rgba(255,255,255,1)');
  g.addColorStop(.35,'rgba(255,255,255,1)');
  g.addColorStop(.70,'rgba(255,255,255,.35)');
  g.addColorStop(.90,'rgba(255,255,255,.10)');
  g.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=g;ctx.fillRect(0,0,canvas.width/dpr,canvas.height/dpr);
  ctx.restore();
}


// ── Drawing: Forest Overlay ──────────────────
// Drawn AFTER feathered mask — forest fronds reach over the wheel edge
function drawForestOverlay() {
  if (!BUFFERS['forest-overlay']) return;
  const buf = BUFFERS['forest-overlay'];
  const sz = buf.width;
  ctx.save();
  ctx.globalAlpha = 0.85;
  ctx.drawImage(buf, _cx - sz/2, _cy - sz/2);
  ctx.restore();
}




// ── Cup Name Labels ─────────────────────────
// Always subtly visible so user knows which wedge is which
function drawCupLabels(t) {
  const x = _cx, y = _cy;
  const labelR = innerR + depth * 0.82;
  const sz = Math.max(9, Math.round(depth * 0.11));
  ctx.font = `400 ${sz}px 'Cormorant Garamond',Georgia,serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (let i = 0; i < 6; i++) {
    const midA = (-Math.PI / 2) + i * WEDGE + WEDGE / 2;
    const lx = x + Math.cos(midA) * labelR;
    const ly = y + Math.sin(midA) * labelR;
    // Brighter during check-in, subtle otherwise
    let alpha = 0.22;
    if (checkInActive) {
      alpha = checkInTouched[i] ? 0.50 : 0.60 + 0.15 * Math.sin(t * 1.8 + i * 0.9);
    }
    // Dark outline for readability
    ctx.save();
    ctx.strokeStyle = 'rgba(10,4,8,0.7)';
    ctx.lineWidth = 2.5;
    ctx.globalAlpha = alpha;
    ctx.strokeText(CUPS[i].name, lx, ly);
    ctx.fillStyle = CUPS[i].color;
    ctx.fillText(CUPS[i].name, lx, ly);
    ctx.restore();
    // Level number below name during check-in
    if (checkInActive) {
      const numR = innerR + depth * 0.65;
      const nx = x + Math.cos(midA) * numR;
      const ny = y + Math.sin(midA) * numR;
      const numSz = Math.max(14, Math.round(depth * 0.18));
      ctx.save();
      ctx.font = `600 ${numSz}px 'Cormorant Garamond',Georgia,serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.strokeStyle = 'rgba(10,4,8,0.7)'; ctx.lineWidth = 3;
      ctx.globalAlpha = checkInTouched[i] ? 0.8 : 0.5 + 0.2 * Math.sin(t * 1.8 + i * 0.9);
      ctx.strokeText(cupLevels[i], nx, ny);
      ctx.fillStyle = CUPS[i].color;
      ctx.fillText(cupLevels[i], nx, ny);
      ctx.restore();
    }
  }
}

// ── Check-In Mode ───────────────────────────
function startCheckIn() {
  checkInActive = true;
  for (let i = 0; i < 6; i++) checkInTouched[i] = false;
  nudgeCard.classList.remove('visible');
}

function completeCheckIn() {
  checkInActive = false;
  // One unified timestamp for all cups
  const now = new Date().toISOString();
  const ts = storage.get('ww-cup-timestamps', {});
  for (let i = 0; i < 6; i++) ts[CUPS[i].name.toLowerCase()] = now;
  storage.set('ww-cup-timestamps', ts);
  checkedToday = true;
  storage.set('ww-checked-today', todayStr());
  storage.set('ww-cup-levels', cupLevels);
  // Save today's levels to history immediately
  storage.set('ww-history:' + todayStr(), [...cupLevels]);
  showToast('Checked in');
  invalidateOverlay();
  updateNudgeCard();
  computeInsights();
  // Open activity checklist as part of check-in flow
  openActivityChecklist();
}

// Breathing glow on untouched wedges during check-in
function drawCheckInGlow(t) {
  if (!checkInActive) return;
  const x = _cx, y = _cy;
  for (let i = 0; i < 6; i++) {
    const sA = (-Math.PI / 2) + i * WEDGE + 0.02;
    const eA = sA + WEDGE - 0.04;
    const cup = CUPS[i];
    const [cr, cg, cb] = cup.hex;

    if (checkInTouched[i]) {
      // Settled — faint warm glow, no pulse
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, outerR - 1, sA, eA);
      ctx.arc(x, y, innerR + 1, eA, sA, true);
      ctx.closePath();
      ctx.fillStyle = `rgba(${cr},${cg},${cb},0.06)`;
      ctx.fill();
      ctx.restore();
      continue;
    }

    // Untouched — breathing pulse, each wedge at different phase
    const phase = i * 0.9;
    const pulse = 0.35 + 0.65 * Math.abs(Math.sin(t * 1.8 + phase));

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, outerR - 1, sA, eA);
    ctx.arc(x, y, innerR + 1, eA, sA, true);
    ctx.closePath();
    // Soft glow fill
    ctx.fillStyle = `rgba(${cr},${cg},${cb},${(pulse * 0.15).toFixed(3)})`;
    ctx.fill();
    // Edge highlight
    ctx.strokeStyle = `rgba(${cr},${cg},${cb},${(pulse * 0.35).toFixed(3)})`;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }
}

// ── Mode Indicator Dots ─────────────────────
// 4 tiny dots below center orb showing current orbMode
function drawModeIndicator() {
  if (orbMode === 0 || checkInActive) return; // hide during check-in
  const x = _cx, y = _cy;
  const dotY = y + innerR * 0.72;
  const dotGap = 6;
  const startX = x - (3 * dotGap) / 2;
  for (let i = 0; i < 4; i++) {
    const dx = startX + i * dotGap;
    ctx.beginPath(); ctx.arc(dx, dotY, i === orbMode ? 2.2 : 1.3, 0, Math.PI * 2);
    ctx.fillStyle = i === orbMode ? 'rgba(212,168,67,0.8)' : 'rgba(255,255,255,0.2)';
    ctx.fill();
  }
}

// ── Interaction ─────────────────────────────
function getPos(e){
  const r=frame.getBoundingClientRect();
  const cx=e.touches?e.touches[0].clientX:e.clientX;
  const cy=e.touches?e.touches[0].clientY:e.clientY;
  return{x:cx-r.left,y:cy-r.top};
}
function hitWedge(pos){
  const dx=pos.x-orbX,dy=pos.y-orbY;
  const dist=Math.sqrt(dx*dx+dy*dy);
  if(dist<innerR*.8)return-2;
  if(dist<innerR||dist>outerR*1.1)return-1;
  let a=Math.atan2(dy,dx)+Math.PI/2;if(a<0)a+=Math.PI*2;
  return Math.floor(a/WEDGE)%6;
}
frame.addEventListener('mousedown',onDown);
frame.addEventListener('touchstart',onDown,{passive:false});
function onDown(e){
  if(onboardingActive) return;
  if(logPanelOpen){closeLogPanel();return}
  if(panelOpen){closePanel();return}
  const pos=getPos(e);const w=hitWedge(pos);
  if(w===-1)return;e.preventDefault();
  lastInteraction=performance.now();pressPos=pos;
  if(w===-2){
    if(checkInActive){completeCheckIn();return}
    // Long-press orb → cycle modes; short tap handled in onUp → startCheckIn
    pressTimer=setTimeout(()=>{pressTimer=null;orbMode=(orbMode+1)%4;if(orbMode>=2)invalidateHistoryCache()},400);
    return
  }
  if(orbMode>=2&&!checkInActive) return; // suppress wedge taps during sparklines/heatmap (but not during check-in)
  pressTimer=setTimeout(()=>{pressTimer=null;openPanel(w)},400);
}
document.addEventListener('mousemove',e=>{if(!pressTimer)return;const pos=getPos(e);
  const dx=pos.x-pressPos.x,dy=pos.y-pressPos.y;if(dx*dx+dy*dy>100){clearTimeout(pressTimer);pressTimer=null}});
document.addEventListener('touchmove',e=>{if(!pressTimer)return;const pos=getPos(e);
  const dx=pos.x-pressPos.x,dy=pos.y-pressPos.y;if(dx*dx+dy*dy>100){clearTimeout(pressTimer);pressTimer=null}},{passive:false});
document.addEventListener('mouseup',onUp);document.addEventListener('touchend',onUp);
function onUp(){
  if(pressTimer){clearTimeout(pressTimer);pressTimer=null;
    const w=hitWedge(pressPos);
    if(w===-2){startCheckIn();return}
    if(w>=0&&!panelOpen&&(orbMode<2||checkInActive)){cupLevels[w]=(cupLevels[w]%5)+1;persistLevels(w);updateNudgeCard();playChime(cupLevels[w]);lastInteraction=performance.now();if(checkInActive)checkInTouched[w]=true}
  }
}

// ── Detail Panel ────────────────────────────
function openPanel(ci){
  activeCup=ci;panelOpen=true;const cup=CUPS[ci];
  panelName.textContent=cup.name;panelName.style.color=cup.color;
  const level=cupLevels[ci];
  panelNudge.textContent=level<=1?NUDGES.urgent[ci]:level<=2?NUDGES.gentle[ci]:'';
  panelLevels.innerHTML='';
  for(let l=1;l<=5;l++){
    const btn=document.createElement('button');
    btn.className='level-btn'+(cupLevels[ci]===l?' active':'');
    btn.style.setProperty('--cup-color',cup.color);
    btn.style.setProperty('--cup-color-dim',cup.color+'44');
    btn.innerHTML=`<span class="num">${l}</span>${LEVEL_LABELS[l-1]}`;
    btn.addEventListener('click',()=>{cupLevels[ci]=l;persistLevels(ci);updateNudgeCard();playChime(l);lastInteraction=performance.now();openPanel(ci)});
    panelLevels.appendChild(btn);
  }
  showPanelActivities(ci);
  panel.classList.add('open');
}
function closePanel(){panel.classList.remove('open');panelOpen=false;activeCup=-1}

// ── Nudge Cards ─────────────────────────────
const nudgeCard = container.querySelector('#nudge-card');
const nudgeCupName = container.querySelector('#nudge-cup-name');
const nudgeText = container.querySelector('#nudge-text');

function updateNudgeCard() {
  // Hide nudge card during active check-in
  if (checkInActive) { nudgeCard.classList.remove('visible'); return; }
  let worstIdx = -1, worstLevel = 5;
  for (let i = 0; i < 6; i++) {
    if (cupLevels[i] <= 2 && cupLevels[i] < worstLevel) {
      worstLevel = cupLevels[i]; worstIdx = i;
    }
  }
  if (worstIdx === -1) {
    nudgeCard.classList.remove('visible');
    return;
  }
  const cup = CUPS[worstIdx];
  nudgeCupName.textContent = cup.name;
  nudgeCupName.style.color = cup.color;
  nudgeText.textContent = worstLevel <= 1 ? NUDGES.urgent[worstIdx] : NUDGES.gentle[worstIdx];
  nudgeCard.classList.add('visible');
}

// ── Activity Logger ─────────────────────────
const PRESETS = [
  { name: 'Climbing (gym)',        cups: [0, 5] },
  { name: 'Climbing (outdoor)',    cups: [0, 1, 5] },
  { name: 'Ice climbing',          cups: [0, 1, 5, 2] },
  { name: 'Gym session',           cups: [0] },
  { name: 'Biking to work',        cups: [0] },
  { name: 'Hiking',                cups: [0] },
  { name: 'Yoga / stretching',     cups: [0, 3] },
  { name: 'FaceTime with Adam',    cups: [4] },
  { name: 'Gossiping with coworkers', cups: [4] },
  { name: 'Board games / hangout', cups: [4, 2] },
  { name: 'Deep conversation',     cups: [4, 3] },
  { name: 'German (Pimsleur)',     cups: [5] },
  { name: 'VetHub coding',         cups: [5, 3] },
  { name: 'Anki / board study',    cups: [5] },
  { name: 'Piano (practice)',      cups: [5, 3] },
  { name: 'Piano (pleasure)',      cups: [3] },
  { name: 'Cooking elaborate',     cups: [3, 2] },
  { name: 'Exploring new place',   cups: [2, 1] },
  { name: 'New cafe / restaurant', cups: [2] },
  { name: 'Travel',                cups: [2, 1] },
  { name: 'Skincare ritual',       cups: [3] },
  { name: 'Music (full attention)',cups: [3] },
];

const logFab = container.querySelector('#log-fab');
const logPanel = container.querySelector('#log-panel');
const logPresets = container.querySelector('#log-presets');
const logConfirm = container.querySelector('#log-confirm');
const confirmName = container.querySelector('#confirm-activity-name');
const confirmTags = container.querySelector('#confirm-cup-tags');
const logCancel = container.querySelector('#log-cancel');
const logSave = container.querySelector('#log-save');
let selectedPreset = null;
let selectedCups = new Set();

function openLogPanel() {
  logPanelOpen = true;
  logPresets.style.display = '';
  logConfirm.style.display = 'none';
  logPresets.innerHTML = '';

  // Custom activity input
  const customDiv = document.createElement('div');
  customDiv.style.cssText = 'margin-bottom:8px;display:flex;gap:6px';
  const inp = document.createElement('input');
  inp.className = 'custom-input';
  inp.style.flex = '1';
  inp.placeholder = 'Custom activity...';
  const goBtn = document.createElement('button');
  goBtn.textContent = 'Go';
  goBtn.style.cssText = 'padding:8px 14px;border-radius:10px;border:1px solid rgba(212,168,67,.3);background:rgba(212,168,67,.15);color:rgba(212,168,67,.9);font-family:inherit;font-size:13px;cursor:pointer';
  const submitCustom = () => { if (inp.value.trim()) selectPreset({ name: inp.value.trim(), cups: [] }); };
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') submitCustom(); });
  goBtn.addEventListener('click', submitCustom);
  customDiv.appendChild(inp);
  customDiv.appendChild(goBtn);
  logPresets.appendChild(customDiv);

  for (const p of PRESETS) {
    const div = document.createElement('div');
    div.className = 'preset-item';
    const nameEl = document.createElement('div');
    nameEl.className = 'preset-name';
    nameEl.textContent = p.name;
    div.appendChild(nameEl);
    const insightFrag = buildInsightSubtitle(p.name);
    if (insightFrag) {
      const cupsEl = document.createElement('div');
      cupsEl.className = 'preset-cups';
      cupsEl.appendChild(insightFrag);
      div.appendChild(cupsEl);
    } else {
      const cupsEl = document.createElement('div');
      cupsEl.className = 'preset-cups';
      cupsEl.textContent = p.cups.map(i => CUPS[i].name).join(', ');
      div.appendChild(cupsEl);
    }
    div.addEventListener('click', () => selectPreset(p));
    logPresets.appendChild(div);
  }
  logPanel.classList.add('open');
}

function selectPreset(preset) {
  selectedPreset = preset;
  selectedCups = new Set(preset.cups);
  logPresets.style.display = 'none';
  logConfirm.style.display = 'flex';
  confirmName.textContent = preset.name;
  renderCupTags();
}

function renderCupTags() {
  confirmTags.innerHTML = '';
  for (let i = 0; i < 6; i++) {
    const tag = document.createElement('button');
    tag.className = 'cup-tag' + (selectedCups.has(i) ? ' active' : '');
    tag.textContent = CUPS[i].name;
    tag.style.setProperty('--tag-color', CUPS[i].color);
    tag.addEventListener('click', () => {
      if (selectedCups.has(i)) selectedCups.delete(i); else selectedCups.add(i);
      renderCupTags();
    });
    confirmTags.appendChild(tag);
  }
}

function closeLogPanel() {
  logPanel.classList.remove('open');
  logPanelOpen = false;
  selectedPreset = null;
  logPanel.querySelector('.log-title').textContent = 'Log Activity';
}

function saveActivity() {
  if (!selectedPreset) return;
  const today = todayStr();
  const key = 'ww-activity-log:' + today;
  const log = storage.get(key, []);
  const cups = [...selectedCups];
  log.push({
    time: new Date().toISOString(),
    activity: selectedPreset.name,
    cups,
    notes: ''
  });
  storage.set(key, log);
  closeLogPanel();
  computeInsights();
  // Feedback: toast confirmation + nudge about low tagged cups
  const lowCups = cups.filter(ci => cupLevels[ci] <= 2).map(ci => CUPS[ci].name);
  if (lowCups.length > 0) {
    showToast(`Logged \u2014 tap ${lowCups.join(' & ')} to update`);
  } else {
    showToast('Logged: ' + selectedPreset.name);
  }
}

// ── Activity Checklist (post-check-in flow) ──

function buildInsightSubtitle(name) {
  if (!insights || !insights.activityLifts) return null;
  const lifts = insights.activityLifts.get(name);
  if (!lifts) return null;
  // Positive only for checklist view (lifts already gated at >=0.4 by computeInsights)
  const pos = lifts.filter(l => l.lift > 0).sort((a, b) => b.lift - a.lift);
  if (pos.length === 0) return null;
  const frag = document.createDocumentFragment();
  pos.forEach((l, i) => {
    if (i > 0) frag.appendChild(document.createTextNode(' \u00b7 '));
    const span = document.createElement('span');
    span.style.color = CUPS[l.cup].color;
    const arrow = l.lift > 0.8 ? '\u2191\u2191' : '\u2191';
    span.textContent = `${CUPS[l.cup].name} ${arrow}`;
    frag.appendChild(span);
  });
  return frag;
}

function getLowCupHelpers() {
  if (!insights || !insights.activityLifts) return [];
  const lowCups = [];
  for (let c = 0; c < 6; c++) { if (cupLevels[c] <= 2) lowCups.push(c); }
  if (lowCups.length === 0) return [];

  const scored = [];
  for (const [name, lifts] of insights.activityLifts) {
    let score = 0;
    for (const l of lifts) {
      if (l.lift > 0 && lowCups.includes(l.cup)) score += l.lift;
    }
    if (score > 0) scored.push({ name, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 3).map(s => s.name);
}

function openActivityChecklist() {
  logPanelOpen = true;
  logPresets.style.display = '';
  logConfirm.style.display = 'none';
  logPresets.innerHTML = '';
  const title = logPanel.querySelector('.log-title');
  title.textContent = 'What filled your cups today?';

  const freq = storage.get('ww-activity-freq', {});
  const customPresets = storage.get('ww-custom-presets', []);
  const allPresets = [...PRESETS, ...customPresets.map(n => ({ name: n, cups: [] }))];
  const sorted = [...allPresets].sort((a, b) => (freq[b.name] || 0) - (freq[a.name] || 0));
  const selected = new Set();

  // Compute promoted items (positive lift for currently-low cups)
  const promoted = getLowCupHelpers();
  const promotedSet = new Set(promoted);

  function renderItem(p) {
    const div = document.createElement('div');
    div.className = 'preset-item';
    const nameEl = document.createElement('div');
    nameEl.className = 'preset-name';
    nameEl.textContent = p.name;
    div.appendChild(nameEl);
    // Data-driven subtitle if insights available, else static cup names
    const insightFrag = buildInsightSubtitle(p.name);
    if (insightFrag) {
      const cupsEl = document.createElement('div');
      cupsEl.className = 'preset-cups';
      cupsEl.appendChild(insightFrag);
      div.appendChild(cupsEl);
    } else if (p.cups.length) {
      const cupsEl = document.createElement('div');
      cupsEl.className = 'preset-cups';
      cupsEl.textContent = p.cups.map(i => CUPS[i].name).join(', ');
      div.appendChild(cupsEl);
    }
    div.addEventListener('click', () => {
      if (selected.has(p.name)) {
        selected.delete(p.name);
        div.style.borderColor = '';
        div.style.background = '';
      } else {
        selected.add(p.name);
        div.style.borderColor = 'rgba(212,168,67,.4)';
        div.style.background = 'linear-gradient(180deg,rgba(60,42,18,.4) 0%,rgba(40,24,8,.5) 100%)';
      }
    });
    return div;
  }

  // Promoted section (max 3, visually separated)
  if (promoted.length > 0) {
    const promoDiv = document.createElement('div');
    promoDiv.className = 'checklist-promoted';
    for (const name of promoted) {
      const p = allPresets.find(pr => pr.name === name) || { name, cups: [] };
      promoDiv.appendChild(renderItem(p));
    }
    logPresets.appendChild(promoDiv);
  }

  // Main list (skip promoted items to avoid duplication)
  for (const p of sorted) {
    if (!promotedSet.has(p.name)) logPresets.appendChild(renderItem(p));
  }

  // Custom input
  const customDiv = document.createElement('div');
  customDiv.style.cssText = 'margin-top:8px;display:flex;gap:6px';
  const inp = document.createElement('input');
  inp.className = 'custom-input'; inp.style.flex = '1';
  inp.placeholder = 'Something else...';
  const addBtn = document.createElement('button');
  addBtn.textContent = '+';
  addBtn.style.cssText = 'padding:8px 14px;border-radius:10px;border:1px solid rgba(212,168,67,.3);background:rgba(212,168,67,.15);color:rgba(212,168,67,.9);font-family:inherit;font-size:16px;cursor:pointer';
  const addCustom = () => {
    const name = inp.value.trim();
    if (!name) return;
    const cp = storage.get('ww-custom-presets', []);
    if (!cp.includes(name) && !PRESETS.some(p => p.name === name)) { cp.push(name); storage.set('ww-custom-presets', cp); }
    const item = renderItem({ name, cups: [] });
    item.click();
    logPresets.insertBefore(item, customDiv);
    inp.value = '';
  };
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') addCustom(); });
  addBtn.addEventListener('click', addCustom);
  customDiv.appendChild(inp); customDiv.appendChild(addBtn);
  logPresets.appendChild(customDiv);

  // Done button
  const doneDiv = document.createElement('div');
  doneDiv.style.cssText = 'margin-top:14px;text-align:center';
  const doneBtn = document.createElement('button');
  doneBtn.textContent = 'Done';
  doneBtn.style.cssText = 'padding:10px 32px;border-radius:8px;border:1px solid rgba(212,168,67,.3);background:linear-gradient(180deg,rgba(60,42,18,.5) 0%,rgba(40,24,8,.6) 100%);color:rgba(212,168,67,.9);font-family:inherit;font-size:14px;letter-spacing:.06em;cursor:pointer;box-shadow:inset 0 0 8px rgba(212,168,67,.06)';
  doneBtn.addEventListener('click', () => {
    const today = todayStr();
    const key = 'ww-activity-log:' + today;
    const log = storage.get(key, []);
    if (selected.size > 0) {
      const now = new Date().toISOString();
      for (const name of selected) {
        const preset = allPresets.find(p => p.name === name) || { name, cups: [] };
        log.push({ time: now, activity: name, cups: [...(preset.cups || [])], notes: '' });
        freq[name] = (freq[name] || 0) + 1;
      }
      storage.set('ww-activity-freq', freq);
    }
    // Always save activity log key to mark today as a real interaction day
    storage.set(key, log);
    closeLogPanel();
    title.textContent = 'Log Activity';
    // Recompute insights with new activity data
    computeInsights();
  });
  doneDiv.appendChild(doneBtn);
  logPresets.appendChild(doneDiv);

  logPanel.classList.add('open');
}

logFab.addEventListener('click', e => { e.stopPropagation(); openLogPanel(); });
logCancel.addEventListener('click', closeLogPanel);
logSave.addEventListener('click', saveActivity);

// ── Panel Activities Display ────────────────
const panelActivities = container.querySelector('#panel-activities');

function showPanelActivities(ci) {
  const log = storage.get('ww-activity-log:' + todayStr(), []);
  const relevant = log.filter(e => e.cups.includes(ci));
  panelActivities.innerHTML = '';
  if (relevant.length) {
    for (const e of relevant) {
      const t = new Date(e.time);
      const ts = t.getHours().toString().padStart(2,'0') + ':' + t.getMinutes().toString().padStart(2,'0');
      const div = document.createElement('div'); div.className = 'act-item';
      const span = document.createElement('span'); span.className = 'act-time'; span.textContent = ts;
      div.appendChild(span); div.appendChild(document.createTextNode(e.activity));
      panelActivities.appendChild(div);
    }
  }

  // Patterns section
  if (!insights) return;
  const cup = CUPS[ci];
  const positives = [];
  const negatives = [];
  if (insights.activityLifts) {
    for (const [name, lifts] of insights.activityLifts) {
      for (const l of lifts) {
        if (l.cup !== ci) continue;
        if (l.lift >= 0.4) positives.push({ name, lift: l.lift });
        else if (l.lift <= -0.4) negatives.push({ name, lift: l.lift });
      }
    }
  }
  positives.sort((a, b) => b.lift - a.lift);
  negatives.sort((a, b) => a.lift - b.lift);

  const hasTrend = insights.cupTrends && insights.cupTrends.length > ci && insights.cupTrends[ci] !== 0;
  if (!hasTrend && positives.length === 0 && negatives.length === 0) return;

  const pDiv = document.createElement('div');
  pDiv.className = 'panel-patterns';
  const hdr = document.createElement('div');
  hdr.className = 'pattern-heading';
  hdr.textContent = '\u2014 patterns \u2014';
  pDiv.appendChild(hdr);

  // Trend
  if (hasTrend) {
    const tr = document.createElement('div');
    tr.className = 'pattern-trend';
    tr.textContent = insights.cupTrends[ci] > 0 ? '\u2191 lately' : '\u2193 lately';
    pDiv.appendChild(tr);
  }

  // Positive correlations (top 3)
  if (positives.length > 0) {
    const h = document.createElement('div');
    h.className = 'pattern-heading';
    h.textContent = 'higher with';
    pDiv.appendChild(h);
    for (const p of positives.slice(0, 3)) {
      const item = document.createElement('div');
      item.className = 'pattern-item';
      const arrow = p.lift > 0.8 ? '\u2191\u2191' : '\u2191';
      const span = document.createElement('span');
      span.style.color = cup.color;
      span.textContent = `${p.name} ${arrow}`;
      item.appendChild(span);
      pDiv.appendChild(item);
    }
  }

  // Negative correlations (top 2)
  if (negatives.length > 0) {
    const h = document.createElement('div');
    h.className = 'pattern-heading';
    h.textContent = 'lower with';
    pDiv.appendChild(h);
    for (const n of negatives.slice(0, 2)) {
      const item = document.createElement('div');
      item.className = 'pattern-item negative';
      const arrow = n.lift < -0.8 ? '\u2193\u2193' : '\u2193';
      item.textContent = `${n.name} ${arrow}`;
      pDiv.appendChild(item);
    }
  }

  panelActivities.appendChild(pDiv);
}


// ── Activity Intelligence ───────────────────
let insights = null;

function gatherFullData() {
  const today = todayStr();
  const levels = [];
  const actsByDay = [];
  const d = new Date();
  d.setDate(d.getDate() - 91); // -91 because loop increments before reading
  while (formatDate(d) < today) {
    d.setDate(d.getDate() + 1);
    const ds = formatDate(d);
    const actLog = storage.get('ww-activity-log:' + ds, null);
    if (actLog === null) continue; // not a real interaction day
    const snap = storage.get('ww-history:' + ds, null);
    if (!snap) continue;
    const names = [...new Set(actLog.map(e => e.activity))];
    levels.push(snap);
    actsByDay.push(names);
  }
  // Include today if it has an activity log key
  const todayAct = storage.get('ww-activity-log:' + today, null);
  if (todayAct !== null) {
    levels.push([...cupLevels]); // live levels, not ww-history:today
    actsByDay.push([...new Set(todayAct.map(e => e.activity))]);
  }
  return { levels, actsByDay, dayCount: levels.length };
}

function computeInsights() {
  const data = gatherFullData();
  if (data.dayCount < 14) { insights = null; return; }

  // Count occurrences per activity
  const actDays = new Map();
  for (let d = 0; d < data.dayCount; d++) {
    for (const name of data.actsByDay[d]) {
      if (!actDays.has(name)) actDays.set(name, []);
      actDays.get(name).push(d);
    }
  }

  const activityLifts = new Map();
  const allDayIndices = Array.from({ length: data.dayCount }, (_, i) => i);

  for (const [name, withDays] of actDays) {
    if (withDays.length < 5) continue;
    const withSet = new Set(withDays);
    if (withSet.size === data.dayCount) continue; // no comparison group
    const withoutDays = allDayIndices.filter(i => !withSet.has(i));
    if (withoutDays.length === 0) continue;

    const lifts = [];
    for (let c = 0; c < 6; c++) {
      const avgWith = withDays.reduce((s, i) => s + data.levels[i][c], 0) / withDays.length;
      const avgWithout = withoutDays.reduce((s, i) => s + data.levels[i][c], 0) / withoutDays.length;
      const lift = avgWith - avgWithout;
      if (Math.abs(lift) >= 0.4) lifts.push({ cup: c, lift });
    }
    if (lifts.length > 0) activityLifts.set(name, lifts);
  }

  // Cup trends: 7-day avg vs prior 7-day avg (real days only)
  const cupTrends = [];
  if (data.dayCount >= 14) {
    const recent = data.levels.slice(-7);
    const prior = data.levels.slice(-14, -7);
    for (let c = 0; c < 6; c++) {
      const avgRecent = recent.reduce((s, l) => s + l[c], 0) / recent.length;
      const avgPrior = prior.reduce((s, l) => s + l[c], 0) / prior.length;
      const diff = avgRecent - avgPrior;
      cupTrends.push(Math.abs(diff) > 0.3 ? diff : 0);
    }
  }

  insights = { activityLifts, cupTrends };
}

// ── Data Export ─────────────────────────────
const exportBtn = container.querySelector('#export-btn');
exportBtn.addEventListener('click', e => {
  e.stopPropagation();
  // Collect all wheel data from storage adapter
  const data = {};
  const keys = ["ww-cup-levels", "ww-checked-today", "ww-cup-timestamps", "ww-settings", "ww-custom-presets", "ww-activity-freq"];
  for (const k of keys) {
    const v = storage.get(k, null);
    if (v !== null) data[k] = v;
  }
  // Include history and activity logs
  for (let d = 0; d < 365; d++) {
    const dt = new Date(); dt.setDate(dt.getDate() - d);
    const ds = formatDate(dt);
    const hist = storage.get("ww-history:" + ds, null);
    if (hist) data["ww-history:" + ds] = hist;
    const acts = storage.get("ww-activity-log:" + ds, null);
    if (acts) data["ww-activity-log:" + ds] = acts;
  }  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'wellness-wheel-' + todayStr() + '.json';
  a.click(); URL.revokeObjectURL(url);
});

// ── Onboarding Animation ────────────────────
function updateOnboarding(t) {
  if (!onboardingActive) return;
  if (onboardingStart === 0) onboardingStart = t;
  const elapsed = t - onboardingStart;

  if (onboardingPhase === 0) {
    // Phase 0 (0-5s): Cups fade in sequentially, ~0.83s stagger
    const stagger = 0.83;
    for (let i = 0; i < 6; i++) {
      const cupStart = i * stagger;
      const cupProgress = Math.max(0, Math.min(1, (elapsed - cupStart) / 1.0));
      onboardingCupAlphas[i] = cupProgress;
      // Drive cupAnimated from 0 to saved level
      cupAnimated[i] = cupLevels[i] * cupProgress;
    }
    if (elapsed >= 5.0) { onboardingPhase = 1; }
  } else if (onboardingPhase === 1) {
    // Phase 1 (5-7s): Pulsing ring on Body wedge
    for (let i = 0; i < 6; i++) onboardingCupAlphas[i] = 1;
    if (elapsed >= 7.0) { onboardingPhase = 2; }
  } else if (onboardingPhase === 2) {
    // Phase 2 (7-7.5s): Settle, mark complete
    onboardingActive = false;
    for (let i = 0; i < 6; i++) onboardingCupAlphas[i] = 1;
    const s = storage.get('ww-settings', {});
    s.onboardingComplete = true;
    storage.set('ww-settings', s);
  }
}

function drawOnboardingHighlight(t) {
  if (!onboardingActive || onboardingPhase !== 1) return;
  const elapsed = t - onboardingStart;
  const pulse = 0.4 + 0.6 * Math.abs(Math.sin((elapsed - 5.0) * 2.5));
  const x = _cx, y = _cy;
  const sA = (-Math.PI / 2) + 0.01;
  const eA = sA + WEDGE - 0.02;
  // Clip highlight inside wheel bounds
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, outerR, sA, eA);
  ctx.arc(x, y, innerR, eA, sA, true);
  ctx.closePath();
  ctx.strokeStyle = `rgba(194,84,106,${(pulse * 0.6).toFixed(3)})`;
  ctx.lineWidth = 4;
  ctx.stroke();
  // Hint text below wheel
  const textAlpha = 0.3 + 0.4 * pulse;
  ctx.font = `300 ${Math.round(innerR * 0.26)}px 'Cormorant Garamond',Georgia,serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillStyle = `rgba(255,255,255,${textAlpha.toFixed(2)})`;
  ctx.fillText('tap a cup to begin', x, y + outerR + 14);
  ctx.restore();
}

// ── Overlay Bitmap Cache ────────────────────
// Sparklines and heatmap are static between interactions — render once, blit.
let _overlayBuf = null;
let _overlayBufCtx = null;
let _overlayValid = false;
let _overlayMode = -1;
let _overlayLevelSnap = '';
function invalidateOverlay() { _overlayValid = false; }

// ── History Sparkline View ──────────────────
let _historyCache = null;
let _historyCacheDirty = true;
function invalidateHistoryCache() { _historyCacheDirty = true; _heatmapCache = null; invalidateOverlay(); }
function gatherHistory() {
  if (!_historyCacheDirty && _historyCache) {
    // Update today's live snapshot in-place (last entry)
    const last = _historyCache[_historyCache.length - 1];
    if (last) for (let i = 0; i < 6; i++) last[i] = cupLevels[i];
    return _historyCache;
  }
  const days = []; // Always 14 entries — null for missing days
  const now = new Date();
  for (let d = 13; d >= 1; d--) {
    const dt = new Date(now);
    dt.setDate(dt.getDate() - d);
    days.push(storage.get('ww-history:' + formatDate(dt), null));
  }
  days.push([...cupLevels]);
  _historyCache = days;
  _historyCacheDirty = false;
  return days;
}

let _heatmapCache = null;
function gatherHeatmapData() {
  if (!_historyCacheDirty && _heatmapCache) {
    // Update today's live snapshot in-place
    const today = _heatmapCache[_heatmapCache.length - 1];
    today.levels = [...cupLevels];
    return _heatmapCache;
  }
  const rows = [];
  const DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const now = new Date();
  for (let d = 13; d >= 1; d--) {
    const dt = new Date(now); dt.setDate(dt.getDate() - d);
    const ds = formatDate(dt);
    const snap = storage.get('ww-history:' + ds, null);
    rows.push({ levels: snap, dow: DOW[dt.getDay()], isToday: false, dateStr: ds });
  }
  rows.push({ levels: [...cupLevels], dow: DOW[now.getDay()], isToday: true, dateStr: todayStr() });
  _heatmapCache = rows;
  _historyCacheDirty = false;
  return rows;
}

function drawHeatmapOverlay() {
  if (orbMode !== 3) return;
  const x = _cx, y = _cy;
  const rows = gatherHeatmapData();
  const hasData = rows.some(r => r.levels !== null);

  // Dark translucent disk
  ctx.save();
  ctx.beginPath(); ctx.arc(x, y, outerR * 0.98, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(8,4,6,0.85)';
  ctx.fill();

  if (!hasData) {
    ctx.font = `300 ${Math.round(innerR * 0.28)}px 'Cormorant Garamond',Georgia,serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fillText('Not enough history yet', x, y);
    ctx.restore();
    return;
  }

  // Radial heatmap: 14 concentric rings x 6 wedge slices
  // Innermost ring = oldest day, outermost = today
  const ringInner = innerR * 1.15;
  const ringOuter = outerR * 0.88;
  const ringDepth = (ringOuter - ringInner) / 14;
  const gapA = 0.04; // angular gap between wedges

  for (let ri = 0; ri < 14; ri++) {
    const row = rows[ri];
    const rIn = ringInner + ri * ringDepth + 0.5;
    const rOut = ringInner + (ri + 1) * ringDepth - 0.5;

    for (let ci = 0; ci < 6; ci++) {
      const sA = (-Math.PI / 2) + ci * WEDGE + gapA;
      const eA = sA + WEDGE - gapA * 2;

      if (!row.levels) {
        // No data — draw dim empty cell
        ctx.beginPath();
        ctx.arc(x, y, rOut, sA, eA);
        ctx.arc(x, y, rIn, eA, sA, true);
        ctx.closePath();
        ctx.fillStyle = 'rgba(255,255,255,0.02)';
        ctx.fill();
        continue;
      }

      const val = row.levels[ci]; // 1-5
      const intensity = Math.max(0, Math.min(1, (val - 1) / 4)); // 0-1 normalized
      const cup = CUPS[ci];
      const [hr, hg, hb] = cup.hex;
      const [br, bgv, bb] = cup.bright;

      // Lerp between dim deep color and bright vivid color
      const cr = Math.round(hr * 0.3 * (1 - intensity) + br * intensity);
      const cg = Math.round(hg * 0.3 * (1 - intensity) + bgv * intensity);
      const cb = Math.round(hb * 0.3 * (1 - intensity) + bb * intensity);

      // Alpha: low levels are barely visible, high levels glow
      const alpha = 0.12 + intensity * 0.65;
      // Today's ring is slightly brighter
      const boost = row.isToday ? 1.15 : 1.0;

      ctx.beginPath();
      ctx.arc(x, y, rOut, sA, eA);
      ctx.arc(x, y, rIn, eA, sA, true);
      ctx.closePath();
      ctx.fillStyle = `rgba(${cr},${cg},${cb},${(alpha * boost).toFixed(3)})`;
      ctx.fill();

      // Inner glow for high levels — stained glass luminance
      if (intensity > 0.5) {
        const glowA = (intensity - 0.5) * 0.3 * boost;
        const midR = (rIn + rOut) / 2;
        const midAngle = (sA + eA) / 2;
        const gx = x + Math.cos(midAngle) * midR;
        const gy = y + Math.sin(midAngle) * midR;
        const gr = ringDepth * 0.8;
        const glow = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
        glow.addColorStop(0, `rgba(${br},${bgv},${bb},${glowA.toFixed(3)})`);
        glow.addColorStop(1, `rgba(${br},${bgv},${bb},0)`);
        ctx.fillStyle = glow;
        ctx.fill();
      }
    }
  }

  // Cup name labels — positioned inside the dark disk, outside the rings
  const labelR = ringOuter + (outerR * 0.98 - ringOuter) * 0.55;
  const labelSz = Math.max(8, Math.round(depth * 0.08));
  ctx.font = `400 ${labelSz}px 'Cormorant Garamond',Georgia,serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (let ci = 0; ci < 6; ci++) {
    const midA = (-Math.PI / 2) + ci * WEDGE + WEDGE / 2;
    const lx = x + Math.cos(midA) * labelR;
    const ly = y + Math.sin(midA) * labelR;
    ctx.fillStyle = CUPS[ci].color;
    ctx.globalAlpha = 0.7;
    ctx.fillText(CUPS[ci].name, lx, ly);
  }

  // "Today" and "14d ago" markers
  ctx.globalAlpha = 0.35;
  ctx.font = `300 ${Math.max(7, Math.round(depth * 0.06))}px 'Cormorant Garamond',Georgia,serif`;
  // Today marker — on the outermost ring edge
  const tAngle = (-Math.PI / 2) - 0.08;
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fillText('today', x + Math.cos(tAngle) * (ringOuter + 2) - 4, y + Math.sin(tAngle) * (ringOuter + 2));
  // Oldest marker
  ctx.fillText('14d', x + Math.cos(tAngle) * (ringInner - 2) - 4, y + Math.sin(tAngle) * (ringInner - 2));

  // Exit hint
  ctx.globalAlpha = 0.25;
  ctx.font = `300 ${Math.max(8, Math.round(depth * 0.07))}px 'Cormorant Garamond',Georgia,serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillText('tap center to exit', x, y + outerR * 0.90);
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawSparklineOverlay() {
  if (orbMode !== 2) return;
  const x = _cx, y = _cy;
  const history = gatherHistory();

  // Dark translucent disk
  ctx.save();
  ctx.beginPath(); ctx.arc(x, y, outerR * 0.95, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(8,4,6,0.82)';
  ctx.fill();

  const validCount = history.filter(h => h !== null).length;
  if (validCount < 2) {
    ctx.font = `300 ${Math.round(innerR * 0.28)}px 'Cormorant Garamond',Georgia,serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fillText('Not enough history yet', x, y);
    ctx.restore();
    return;
  }

  // 2x3 grid layout inside the disk — readable sparklines
  const n = history.length;
  const gridR = outerR * 0.78;
  const sparkW = gridR * 0.52;
  const sparkH = gridR * 0.18;
  const colOff = [-sparkW * 0.58, sparkW * 0.58]; // left/right columns
  const rowOff = [-gridR * 0.38, 0, gridR * 0.38]; // top/mid/bottom rows
  const gridPos = [[0,0],[1,0],[0,1],[1,1],[0,2],[1,2]]; // [col,row] per cup

  const labelSz = Math.max(9, Math.round(depth * 0.10));
  for (let ci = 0; ci < 6; ci++) {
    const cup = CUPS[ci];
    const [col, row] = gridPos[ci];
    const sparkCx = x + colOff[col];
    const sparkCy = y + rowOff[row];

    // Draw sparkline path — break on null gaps
    ctx.beginPath();
    let pathStarted = false;
    for (let j = 0; j < n; j++) {
      const px = sparkCx - sparkW / 2 + (j / (n - 1)) * sparkW;
      if (!Array.isArray(history[j])) {
        // Gap — draw faint marker, break path
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fillRect(px - 0.5, sparkCy - sparkH / 2, 1, sparkH);
        pathStarted = false;
        continue;
      }
      const val = history[j][ci];
      const py = sparkCy + sparkH / 2 - ((val - 1) / 4) * sparkH;
      if (!pathStarted) { ctx.moveTo(px, py); pathStarted = true; }
      else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = cup.color;
    ctx.lineWidth = 1.8;
    ctx.globalAlpha = 0.85;
    ctx.stroke();

    // Current value dot (last entry is always today — never null)
    const lastVal = history[n - 1][ci];
    const dotX = sparkCx + sparkW / 2;
    const dotY = sparkCy + sparkH / 2 - ((lastVal - 1) / 4) * sparkH;
    ctx.beginPath(); ctx.arc(dotX, dotY, 3, 0, Math.PI * 2);
    ctx.fillStyle = cup.color; ctx.globalAlpha = 1;
    ctx.fill();

    // Cup name label
    const labelY = sparkCy - sparkH / 2 - 6;
    ctx.font = `400 ${labelSz}px 'Cormorant Garamond',Georgia,serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.globalAlpha = 1;
    ctx.fillText(cup.name, sparkCx, labelY);
  }
  // Exit hint
  ctx.globalAlpha = 0.25;
  ctx.font = `300 ${Math.max(8, Math.round(depth * 0.07))}px 'Cormorant Garamond',Georgia,serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillText('tap center to exit', x, y + outerR * 0.90);
  ctx.restore();
}

// ── Audio Feedback ──────────────────────────
let audioCtx = null;
let soundEnabled = false;
let activeOscCount = 0;
const soundBtn = container.querySelector('#sound-btn');

function initAudioSettings() {
  const settings = storage.get('ww-settings', {});
  soundEnabled = !!settings.soundEnabled;
  if (soundEnabled) soundBtn.classList.add('on');
  soundBtn.addEventListener('click', e => {
    e.stopPropagation();
    soundEnabled = !soundEnabled;
    soundBtn.classList.toggle('on', soundEnabled);
    const s = storage.get('ww-settings', {});
    s.soundEnabled = soundEnabled;
    storage.set('ww-settings', s);
  });
}

function playChime(level) {
  if (!soundEnabled) return;
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const freq = 400 + (level - 1) * 125; // 400-900Hz
  const now = audioCtx.currentTime;
  // Fundamental
  const osc1 = audioCtx.createOscillator();
  osc1.type = 'sine'; osc1.frequency.value = freq;
  // Perfect fifth
  const osc2 = audioCtx.createOscillator();
  osc2.type = 'sine'; osc2.frequency.value = freq * 1.5;
  const gain1 = audioCtx.createGain();
  gain1.gain.setValueAtTime(0.15, now);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
  const gain2 = audioCtx.createGain();
  gain2.gain.setValueAtTime(0.08, now);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
  osc1.connect(gain1).connect(audioCtx.destination);
  osc2.connect(gain2).connect(audioCtx.destination);
  activeOscCount += 2;
  const onDone = () => { if (--activeOscCount <= 0 && audioCtx.state === 'running') audioCtx.suspend(); };
  osc1.onended = onDone;
  osc2.onended = onDone;
  osc1.start(now); osc1.stop(now + 0.5);
  osc2.start(now); osc2.stop(now + 0.4);
}

// ── Toast ───────────────────────────────────
const toastEl = container.querySelector('#toast');
let toastTimer = null;
function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('visible'), 2500);
}

// ── URL Param Shortcuts (Siri integration) ──
function handleURLParams() {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get('activity') || params.get('log');
  if (!raw) return;
  const query = raw.toLowerCase().replace(/[-_]/g, ' ');
  let best = null, bestScore = 0, bestLen = Infinity;
  for (const p of PRESETS) {
    const name = p.name.toLowerCase();
    let score = 0;
    if (name === query) { score = 100; } // exact match
    else if (name.includes(query)) { score = 10 + query.length; } // query is in name — longer query = more specific
    else if (query.includes(name)) { score = 5; }
    else {
      // Word overlap
      const qWords = query.split(/\s+/);
      const nWords = name.split(/[\s\/()]+/);
      score = qWords.filter(w => nWords.some(n => n.includes(w) || w.includes(n))).length;
    }
    // Prefer higher score; break ties with shorter name (more specific preset)
    if (score > bestScore || (score === bestScore && name.length < bestLen)) {
      best = p; bestScore = score; bestLen = name.length;
    }
  }
  if (best) {
    const today = todayStr();
    const key = 'ww-activity-log:' + today;
    const log = storage.get(key, []);
    log.push({ time: new Date().toISOString(), activity: best.name, cups: [...best.cups], notes: 'via URL' });
    storage.set(key, log);
    showToast('Logged: ' + best.name);
  } else {
    showToast('No match: ' + raw);
  }
  history.replaceState(null, '', window.location.pathname);
}

// ── Render ──────────────────────────────────
const FPS30=1000/30;let lastRender=0,lastTime=0;
function render(ts){
  const recent=(ts-lastInteraction)<600;
  if(!recent&&(ts-lastRender)<FPS30){if(!_destroyed) _animFrame = requestAnimationFrame(render);return}
  lastRender=ts;const dt=Math.min((ts-lastTime)/1000,.05);lastTime=ts;
  const t=(ts-startTime)/1000;
  if(!onboardingActive) for(let i=0;i<6;i++)cupAnimated[i]+=(cupLevels[i]-cupAnimated[i])*Math.min(dt*4,1);
  // Auto-exit overlay modes after 30s of no interaction
  if(orbMode>=2 && ts-lastInteraction>30000){orbMode=0;}
  updateOnboarding(t);
  updateCascade();updateSparkles(dt);updateMotes(dt);

  ctx.save();ctx.scale(dpr,dpr);
  ctx.clearRect(0,0,canvas.width/dpr,canvas.height/dpr);

  drawDropShadow();
  drawGlassBacking();
  drawLightSpill(t);
  drawMotes();
  drawGlassBands(t);
  drawCheckInGlow(t);

  // Clip sparkles to annulus
  ctx.save();
  ctx.beginPath();
  ctx.arc(_cx,_cy,outerR+20,0,Math.PI*2);
  ctx.arc(_cx,_cy,innerR+1,0,Math.PI*2,true);
  ctx.closePath();
  ctx.clip();
  drawSparkles();
  ctx.restore();

  drawOnboardingHighlight(t);
  drawGoldFrame();
  drawCupLabels(t);
  drawCenterMedallion(t);
  drawModeIndicator();
  // Overlay bitmap cache — static overlays rendered once, blitted per frame
  if (orbMode >= 2) {
    const levelSnap = cupLevels.join(',');
    if (!_overlayValid || _overlayMode !== orbMode || _overlayLevelSnap !== levelSnap) {
      // (Re)build offscreen buffer
      const w = Math.round(canvas.width), h = Math.round(canvas.height);
      if (!_overlayBuf || _overlayBuf.width !== w || _overlayBuf.height !== h) {
        _overlayBuf = document.createElement('canvas');
        _overlayBuf.width = w; _overlayBuf.height = h;
        _overlayBufCtx = _overlayBuf.getContext('2d');
      }
      _overlayBufCtx.clearRect(0, 0, w, h);
      _overlayBufCtx.save(); _overlayBufCtx.scale(dpr, dpr);
      const mainCtx = ctx;
      ctx = _overlayBufCtx; // temporarily redirect
      if (orbMode === 2) drawSparklineOverlay();
      else if (orbMode === 3) drawHeatmapOverlay();
      ctx = mainCtx; // restore
      _overlayBufCtx.restore();
      _overlayValid = true; _overlayMode = orbMode; _overlayLevelSnap = levelSnap;
    }
    ctx.drawImage(_overlayBuf, 0, 0, canvas.width / dpr, canvas.height / dpr);
  }
  drawFeatheredMask();
  drawForestOverlay();             // Phase 1 — after mask

  ctx.restore();
  if(!_destroyed) _animFrame = requestAnimationFrame(render);
}

// ── Init ────────────────────────────────────
function init(){
  computeLayout();updateNudgeCard();initAudioSettings();startTime=lastTime=lastRender=performance.now();
  handleURLParams();
  // Onboarding — first run only
  const wwSettings = storage.get('ww-settings', {});
  if (!wwSettings.onboardingComplete) {
    onboardingActive = true; onboardingPhase = 0;
    onboardingStart = 0; // will be set relative to t in render
    for (let i = 0; i < 6; i++) { cupAnimated[i] = 0; onboardingCupAlphas[i] = 0; }
  } else {
    for (let i = 0; i < 6; i++) onboardingCupAlphas[i] = 1;
    // Check-in is now entered via nudge card, not auto-started
  }
  if(!_destroyed) _animFrame = requestAnimationFrame(render);
  // Load art assets asynchronously — wheel renders with fallbacks until ready
  loadAssets(() => { prepareBuffers(); });
  // Compute activity insights deferred to avoid blocking first render
  setTimeout(computeInsights, 0);
}
  // Start the engine
  init();

  const resizeHandler = () => { if (!_destroyed) computeLayout(); };
  window.addEventListener('resize', resizeHandler);

  return {
    destroy() {
      _destroyed = true;
      if (_animFrame) cancelAnimationFrame(_animFrame);
      window.removeEventListener('resize', resizeHandler);
    },
    getCupLevels() {
      return [...cupLevels];
    },
  };
}
