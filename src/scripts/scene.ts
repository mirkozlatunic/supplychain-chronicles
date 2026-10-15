// Painted, animated Heavensward-style backdrop for the hero.
// Static layers (sky, ranges, city, foreground) are rendered once per size/theme into
// offscreen canvases; each frame composites them with parallax and adds the living parts:
// drifting fog, light rays, twinkling stars, flickering windows and flying dragons.

type RGB = [number, number, number];
type Palette = Record<
  'skyTop' | 'skyMid' | 'skyLow' | 'orb' | 'far' | 'mid' | 'near' | 'snow' | 'city' | 'window' | 'dragon' | 'fog' | 'rim',
  RGB
> & { starO: number; rayO: number; windowO: number };

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const css = (c: RGB, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;

function seeded(seed: number) {
  let s = seed % 2147483647 || 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function parseColor(v: string, fallback: RGB): RGB {
  v = v.trim();
  const hex = v.match(/^#([0-9a-f]{6})$/i);
  if (hex) return [0, 2, 4].map((i) => parseInt(hex[1].slice(i, i + 2), 16)) as RGB;
  const nums = v.match(/[\d.]+/g);
  return nums && nums.length >= 3 ? (nums.slice(0, 3).map(Number) as RGB) : fallback;
}

function readPalette(): Palette {
  const cs = getComputedStyle(document.documentElement);
  const c = (name: string, fb: RGB) => parseColor(cs.getPropertyValue(name), fb);
  const n = (name: string, fb: number) => parseFloat(cs.getPropertyValue(name)) || fb;
  return {
    skyTop: c('--sky-top', [3, 5, 11]),
    skyMid: c('--sky-mid', [15, 29, 56]),
    skyLow: c('--sky-low', [34, 56, 94]),
    orb: c('--orb', [232, 240, 251]),
    far: c('--mtn-far', [26, 40, 67]),
    mid: c('--mtn-mid', [17, 28, 50]),
    near: c('--mtn-near', [10, 18, 34]),
    snow: c('--snowcap', [201, 215, 234]),
    city: c('--city', [7, 12, 24]),
    window: c('--window', [243, 196, 107]),
    dragon: c('--dragon', [4, 7, 14]),
    fog: c('--fog', [150, 175, 215]),
    rim: c('--rim', [207, 224, 255]),
    starO: n('--star-o', 1),
    rayO: n('--ray-o', 0.08),
    windowO: n('--window-o', 0.9),
  };
}

/** 1D midpoint-displacement ridge, n+1 samples. */
function ridge(n: number, rough: number, rand: () => number): number[] {
  const pts = new Array(n + 1).fill(0);
  pts[0] = rand();
  pts[n] = rand();
  for (let step = n; step > 1; step /= 2) {
    const half = step / 2;
    const amp = Math.pow(step / n, rough);
    for (let i = half; i < n; i += step) pts[i] = (pts[i - half] + pts[i + half]) / 2 + (rand() - 0.5) * amp;
  }
  return pts;
}

function makeCanvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

interface RangeOpts {
  base: number; // 0..1 of H, where the range sits
  height: number; // 0..1 of H, peak amplitude
  rough: number;
  seed: number;
  color: RGB;
  haze: number; // 0..1 blend toward the sky (aerial perspective)
  snow: number; // snow depth factor
  valley: number; // 0..1 how much the centre dips (keeps the title over open sky)
  lightX: number; // 0..1 where the light comes from
}

/** Sample a 1D ridge array smoothly at t∈[0,1]. */
function sample(arr: number[], t: number) {
  const n = arr.length - 1;
  const i = clamp(t) * n;
  const i0 = Math.floor(i);
  const i1 = Math.min(n, i0 + 1);
  const f = i - i0;
  return arr[i0] + (arr[i1] - arr[i0]) * (f * f * (3 - 2 * f));
}
function normalise(arr: number[]) {
  const lo = Math.min(...arr), hi = Math.max(...arr);
  return arr.map((v) => (v - lo) / (hi - lo || 1));
}

/** Paint a lit mountain range with snow tongues running down the gullies. */
function paintRange(W: number, H: number, o: RangeOpts, p: Palette) {
  const c = makeCanvas(W, H);
  const g = c.getContext('2d')!;
  const rand = seeded(o.seed);
  const shape = normalise(ridge(512, o.rough, rand)).map((v) => Math.pow(v, 1.35));
  const snowNoise = normalise(ridge(64, 0.6, seeded(o.seed * 7 + 3)));
  const gully = normalise(ridge(256, 0.5, seeded(o.seed * 13 + 1)));
  const ys: number[] = [];
  for (let x = 0; x < W; x++) {
    const t = x / (W - 1);
    const dip = 1 - o.valley * Math.exp(-Math.pow((t - 0.5) / 0.18, 2));
    ys.push(H * (o.base - o.height * sample(shape, t) * dip));
  }
  const rockLit = mix(mix(o.color, p.rim, 0.28), p.skyLow, o.haze);
  const rockDark = mix(mix(o.color, p.skyTop, 0.25), p.skyLow, o.haze * 0.8);
  const snowLit = mix(p.snow, p.skyLow, o.haze * 0.5);
  const snowDark = mix(mix(p.snow, o.color, 0.5), p.skyLow, o.haze * 0.5);
  const lx = W * o.lightX;
  // per-column lighting and snow depth, then smoothed so nothing reads as vertical stripes
  const lit: number[] = [], depth: number[] = [], tone: number[] = [];
  for (let x = 0; x < W; x++) {
    const k = 12;
    const slope = (ys[Math.min(W - 1, x + k)] - ys[Math.max(0, x - k)]) / (2 * k);
    lit.push(clamp(0.5 + Math.tanh((x < lx ? slope : -slope) * 2.2) * 0.5)); // descending toward the light = lit face
    const t = x / W;
    const gul = sample(gully, t);
    tone.push(0.75 + 0.25 * gul);
    const flat = 1 - clamp(Math.abs(slope) * 1.1);
    const tongue = Math.pow(Math.abs(Math.sin(t * 55 + sample(snowNoise, t) * 2)), 2.5); // snow tongues down the gullies
    const local = Math.max(0, H * o.base - ys[x]); // never deeper than the peak is tall
    depth.push(Math.min(local * 0.6, H * o.height * o.snow * (0.35 + 0.65 * sample(snowNoise, t)) * (0.6 + 0.4 * flat) * (0.5 + 0.7 * tongue)));
  }
  const smooth = (arr: number[], r: number) => {
    for (let pass = 0; pass < 2; pass++) {
      const src = arr.slice();
      let acc = 0;
      for (let i = -r; i <= r; i++) acc += src[clamp(i, 0, W - 1)];
      for (let x = 0; x < W; x++) {
        arr[x] = acc / (2 * r + 1);
        acc += src[Math.min(W - 1, x + r + 1)] - src[Math.max(0, x - r)];
      }
    }
  };
  smooth(lit, 8);
  smooth(tone, 10);
  smooth(depth, 7);
  for (let x = 0; x < W; x++) {
    const y = ys[x];
    // light only shapes the faces near the crest, then settles into one base tone
    const rg = g.createLinearGradient(0, y, 0, y + H * o.height * 0.7);
    rg.addColorStop(0, css(mix(rockDark, rockLit, lit[x] * tone[x])));
    rg.addColorStop(1, css(mix(rockDark, rockLit, 0.35)));
    g.fillStyle = rg;
    g.fillRect(x, y, 1.6, H - y);
    const sc = mix(snowDark, snowLit, lit[x]);
    g.fillStyle = css(sc);
    g.fillRect(x, y, 1.6, depth[x]);
    g.fillStyle = css(sc, 0.3);
    g.fillRect(x, y + depth[x], 1.6, 6);
  }
  // moonlit crest line on lit faces
  g.lineWidth = 1.2;
  for (let x = 1; x < W; x += 2) {
    const slope = (ys[Math.min(W - 1, x + 6)] - ys[Math.max(0, x - 6)]) / 12;
    const lit = clamp(0.5 + Math.tanh((x < lx ? slope : -slope) * 2.2) * 0.5);
    if (lit < 0.55) continue;
    g.strokeStyle = css(p.rim, (lit - 0.55) * 1.1 * (1 - o.haze));
    g.beginPath();
    g.moveTo(x - 1, ys[x - 1]);
    g.lineTo(x + 1, ys[Math.min(W - 1, x + 1)]);
    g.stroke();
  }
  // haze toward the base of the range
  g.globalCompositeOperation = 'source-atop';
  const hz = g.createLinearGradient(0, H * (o.base - o.height), 0, H);
  hz.addColorStop(0, css(p.fog, 0));
  hz.addColorStop(1, css(p.fog, 0.3 + o.haze * 0.35));
  g.fillStyle = hz;
  g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'source-over';
  return { canvas: c, ys };
}

interface Win { x: number; y: number; w: number; h: number; phase: number; speed: number }

/** Gothic city on a cliff, left side. Returns silhouette canvas + lit window list. */
function paintCity(W: number, H: number, p: Palette, groundY: number) {
  const c = makeCanvas(W, H);
  const g = c.getContext('2d')!;
  const rand = seeded(97);
  const u = Math.min(W * 0.0011, H * 0.0016) * 1.05; // design unit (design space ~ 420×330)
  const ox = W * 0.17 - 210 * u; // city centre at 17% of width
  const by = groundY; // ground line of the city
  const X = (v: number) => ox + v * u;
  const Y = (v: number) => by - v * u;
  const wins: Win[] = [];
  const rims: [number, number, number, number][] = [];

  // cliff under the city
  g.fillStyle = css(p.near);
  g.beginPath();
  g.moveTo(X(-60), H);
  g.lineTo(X(-30), Y(-40));
  g.lineTo(X(10), Y(0));
  g.lineTo(X(410), Y(0));
  g.lineTo(X(440), Y(-30));
  g.lineTo(X(470), Y(-90));
  g.lineTo(X(520), H);
  g.closePath();
  g.fill();

  g.fillStyle = css(p.city);
  const tower = (x: number, w: number, h: number, spire: number, pinnacles = true) => {
    g.fillRect(X(x), Y(h), w * u, h * u);
    g.beginPath();
    g.moveTo(X(x - 2), Y(h));
    g.lineTo(X(x + w / 2), Y(h + spire));
    g.lineTo(X(x + w + 2), Y(h));
    g.closePath();
    g.fill();
    if (pinnacles)
      for (const px of [x - 1, x + w - 3]) {
        g.beginPath();
        g.moveTo(X(px), Y(h));
        g.lineTo(X(px + 2), Y(h + spire * 0.28));
        g.lineTo(X(px + 4), Y(h));
        g.fill();
      }
    rims.push([x + w, h, spire, w]);
    // pointed-arch windows
    for (let wy = 14; wy < h - 10; wy += 20)
      for (let wx = x + 5; wx < x + w - 6; wx += 9)
        if (rand() > 0.5) wins.push({ x: X(wx), y: Y(wy + 8), w: 2.4 * u, h: 6 * u, phase: rand() * 6.28, speed: 0.5 + rand() * 2.5 });
  };
  // walls and houses
  for (let x = 0; x < 410; x += 14) {
    const hh = 22 + rand() * 30;
    g.fillRect(X(x), Y(hh), 15 * u, hh * u);
    g.beginPath();
    g.moveTo(X(x - 1), Y(hh));
    g.lineTo(X(x + 7), Y(hh + 10 + rand() * 8));
    g.lineTo(X(x + 16), Y(hh));
    g.fill();
    if (rand() > 0.45) wins.push({ x: X(x + 6), y: Y(hh - 8), w: 2.4 * u, h: 4 * u, phase: rand() * 6.28, speed: 0.4 + rand() * 2 });
  }
  // minor towers
  tower(20, 22, 90, 40);
  tower(60, 18, 120, 55);
  tower(330, 20, 110, 50);
  tower(370, 24, 85, 38);
  // cathedral: nave, buttresses, twin towers, flèche
  g.fillRect(X(150), Y(110), 110 * u, 110 * u);
  g.beginPath();
  g.moveTo(X(146), Y(110));
  g.lineTo(X(205), Y(150));
  g.lineTo(X(264), Y(110));
  g.fill();
  g.lineWidth = 3 * u;
  g.strokeStyle = css(p.city);
  for (const bx of [160, 185, 225, 250]) {
    g.beginPath();
    g.moveTo(X(bx), Y(0));
    g.lineTo(X(bx), Y(40));
    g.quadraticCurveTo(X(bx), Y(95), X(bx + (bx < 205 ? 12 : -12)), Y(108));
    g.stroke();
  }
  tower(112, 40, 190, 120);
  tower(258, 40, 190, 120);
  g.fillRect(X(199), Y(180), 12 * u, 40 * u);
  g.beginPath();
  g.moveTo(X(197), Y(176));
  g.lineTo(X(205), Y(290));
  g.lineTo(X(213), Y(176));
  g.fill();
  tower(96, 14, 140, 60, false);
  tower(300, 14, 140, 60, false);

  // moonlit rim on the right edge of towers + snow on spire bases
  g.strokeStyle = css(p.rim, 0.35);
  g.lineWidth = Math.max(1, 1.2 * u);
  for (const [rx, h, spire, w] of rims) {
    g.beginPath();
    g.moveTo(X(rx), Y(4));
    g.lineTo(X(rx), Y(h));
    g.lineTo(X(rx - w / 2), Y(h + spire));
    g.stroke();
    g.fillStyle = css(p.snow, 0.85);
    g.beginPath();
    g.moveTo(X(rx - w - 2), Y(h));
    g.lineTo(X(rx - w / 2), Y(h + spire * 0.22));
    g.lineTo(X(rx + 2), Y(h));
    g.closePath();
    g.fill();
    g.fillStyle = css(p.city);
  }
  // snow along the cliff top
  g.fillStyle = css(p.snow, 0.9);
  g.fillRect(X(-20), Y(1), 450 * u, 3 * u);

  const rose = { x: X(205), y: Y(80), r: 11 * u };
  return { canvas: c, wins, rose, u };
}

/** Foreground: snowy ridges in the corners with pines; centre stays low. */
function paintForeground(W: number, H: number, p: Palette) {
  const c = makeCanvas(W, H);
  const g = c.getContext('2d')!;
  const rand = seeded(411);
  const raw = ridge(256, 0.75, rand);
  const ys: number[] = [];
  g.fillStyle = css(p.near);
  g.beginPath();
  g.moveTo(0, H);
  for (let x = 0; x <= W; x += 2) {
    const t = x / W;
    const edge = Math.pow(Math.abs(t - 0.5) * 2, 2.2); // high at corners
    const y = H * (0.985 - 0.2 * edge - 0.05 * raw[Math.floor(t * 256)]);
    ys.push(y);
    g.lineTo(x, y);
  }
  g.lineTo(W, H);
  g.closePath();
  g.fill();
  // snow blanket on top
  g.fillStyle = css(p.snow, 0.92);
  g.beginPath();
  g.moveTo(0, ys[0]);
  ys.forEach((y, i) => g.lineTo(i * 2, y));
  for (let i = ys.length - 1; i >= 0; i--) g.lineTo(i * 2, ys[i] + 6 + 10 * raw[(i * 3) % 256]);
  g.closePath();
  g.fill();
  // pines along the corners
  const pine = (x: number, y: number, h: number) => {
    g.fillStyle = css(mix(p.near, p.city, 0.5));
    for (let k = 0; k < 4; k++) {
      const ty = y - h * (k / 4);
      const w = h * 0.32 * (1 - k / 5);
      g.beginPath();
      g.moveTo(x - w, ty);
      g.lineTo(x, ty - h * 0.38);
      g.lineTo(x + w, ty);
      g.fill();
      g.fillStyle = css(p.snow, 0.8);
      g.beginPath();
      g.moveTo(x - w * 0.5, ty - h * 0.2);
      g.lineTo(x, ty - h * 0.38);
      g.lineTo(x + w * 0.4, ty - h * 0.22);
      g.fill();
      g.fillStyle = css(mix(p.near, p.city, 0.5));
    }
  };
  for (let x = 0; x < W; x += 9 + rand() * 18) {
    const t = x / W;
    if (t > 0.3 && t < 0.7) continue;
    const y = ys[Math.floor(x / 2)] + 8;
    pine(x, y, (H * 0.05 + rand() * H * 0.06) * (0.6 + Math.abs(t - 0.5)));
  }
  return c;
}

/** Soft fog strip (tileable horizontally). */
function paintFog(W: number, h: number, p: Palette, seed: number) {
  const c = makeCanvas(W, h);
  const g = c.getContext('2d')!;
  const rand = seeded(seed);
  for (let i = 0; i < 60; i++) {
    const x = rand() * W;
    const y = h * (0.3 + rand() * 0.4);
    const r = h * (0.25 + rand() * 0.45);
    for (const dx of [-W, 0, W]) {
      const rg = g.createRadialGradient(x + dx, y, 0, x + dx, y, r);
      rg.addColorStop(0, css(p.fog, 0.18));
      rg.addColorStop(1, css(p.fog, 0));
      g.fillStyle = rg;
      g.fillRect(x + dx - r, y - r, r * 2, r * 2);
    }
  }
  return c;
}

interface Dragon {
  depth: number; // 0 = far (behind the mid range), 1 = near
  y: number; // 0..1 of H
  speed: number; // px/s at scale 1
  scale: number;
  dir: 1 | -1;
  phase: number;
  flap: number;
  x: number;
}

// Canonical wing (shoulder at origin, wing raised straight up; y negative = up).
const WING = {
  elbow: [-5, -22],
  wrist: [9, -46],
  thumb: [16, -43],
  tips: [
    [0, -92],
    [-27, -78],
    [-48, -56],
    [-60, -28],
  ],
  hip: [-36, 3],
} as const;
const CAM = 0.24; // camera elevation (rad): wings stay visible while gliding

/** Procedural wyvern: undulating body and bat wings flapping in 3D, seen from slightly above. */
export function drawDragon(g: CanvasRenderingContext2D, d: Dragon, t: number, s: number, color: string) {
  const glide = clamp(Math.sin(t * 0.35 + d.phase) * 1.6 + 0.5); // 0 = gliding, 1 = flapping
  const beat = Math.sin(t * d.flap + d.phase);
  const alpha = 0.18 + glide * (0.62 * beat + 0.12); // wing angle above horizontal (rad)
  g.save();
  g.translate(d.x, 0);
  g.scale(d.dir * s, s);
  g.fillStyle = color;
  g.strokeStyle = color;
  g.lineJoin = 'round';
  g.lineCap = 'round';

  // project a canonical wing point for wing angle a; near wing swings toward the camera
  const proj = (pt: readonly number[], a: number, near: boolean, ox: number, oy: number): [number, number] => {
    const r = -pt[1] * (near ? 1.08 : 1);
    const up = r * Math.sin(a) * Math.cos(CAM);
    const depth = r * Math.cos(a) * Math.sin(CAM);
    return [ox + pt[0] * (0.85 + 0.15 * Math.abs(Math.sin(a))), oy - up + (near ? depth : -depth)];
  };
  const wing = (a: number, near: boolean, ox: number, oy: number, op: number) => {
    const P = (pt: readonly number[]) => proj(pt, a, near, ox, oy);
    const e = P(WING.elbow), w = P(WING.wrist), th = P(WING.thumb);
    const tips = WING.tips.map(P);
    const hip: [number, number] = [ox + WING.hip[0], oy + WING.hip[1]];
    g.globalAlpha = op;
    g.beginPath();
    g.moveTo(ox, oy);
    g.lineTo(e[0], e[1]);
    g.lineTo(w[0], w[1]);
    g.lineTo(tips[0][0], tips[0][1]);
    const chain = [...tips, hip];
    for (let i = 1; i < chain.length; i++) {
      const [ax, ay] = chain[i - 1], [bx, by] = chain[i];
      // trailing edge scallops curve in toward the wrist
      const mx = (ax + bx) / 2, my = (ay + by) / 2;
      g.quadraticCurveTo(mx + (w[0] - mx) * 0.28, my + (w[1] - my) * 0.28, bx, by);
    }
    g.closePath();
    g.fill();
    // bones: arm + fingers, slightly heavier than the membrane
    g.globalAlpha = Math.min(1, op + 0.2);
    g.lineWidth = 2.2;
    g.beginPath();
    g.moveTo(ox, oy);
    g.lineTo(e[0], e[1]);
    g.lineTo(w[0], w[1]);
    g.lineTo(th[0], th[1]);
    g.stroke();
    g.lineWidth = 1.2;
    g.beginPath();
    for (const tp of tips) {
      g.moveTo(w[0], w[1]);
      g.lineTo(tp[0], tp[1]);
    }
    g.stroke();
    g.globalAlpha = 1;
  };

  // far wing first (lags a little, dimmer)
  const lag = 0.18 + glide * (0.62 * Math.sin(t * d.flap + d.phase - 0.35) + 0.12);
  wing(lag, false, 14, -6, 0.62);

  // body along an undulating spine, head (i=0) to tail
  const N = 22;
  const spine: [number, number, number][] = [];
  for (let i = 0; i <= N; i++) {
    const k = i / N;
    const x = 50 - k * 175;
    const sway = Math.sin(t * 2 + d.phase - k * 4) * 7 * k * k;
    const y = -6 + k * 10 - (1 - k) * (1 - k) * 4 + sway - beat * glide * 2.5 * (1 - k);
    const half =
      k < 0.06 ? 3.2 :
      k < 0.16 ? 3.6 :
      k < 0.3 ? 3.6 + ((k - 0.16) / 0.14) * 5.4 :
      k < 0.45 ? 9 - ((k - 0.3) / 0.15) * 2.5 :
      6.5 * Math.pow(1 - (k - 0.45) / 0.55, 1.6) + 0.35;
    spine.push([x, y, half]);
  }
  g.beginPath();
  spine.forEach(([x, y, w], i) => (i ? g.lineTo(x, y - w) : g.moveTo(x, y - w)));
  for (let i = spine.length - 1; i >= 0; i--) g.lineTo(spine[i][0], spine[i][1] + spine[i][2] * 0.9);
  g.closePath();
  g.fill();
  // back spikes
  for (let i = 4; i < 16; i += 2) {
    const [x, y, w] = spine[i];
    g.beginPath();
    g.moveTo(x + 2.5, y - w + 0.5);
    g.lineTo(x - 1, y - w - 3.2);
    g.lineTo(x - 2.5, y - w + 0.5);
    g.fill();
  }
  // head: skull, jaw, swept-back horns
  const [hx, hy] = spine[0];
  g.beginPath();
  g.moveTo(hx - 4, hy - 4);
  g.quadraticCurveTo(hx + 6, hy - 6, hx + 16, hy - 1);
  g.lineTo(hx + 15, hy + 1.5);
  g.lineTo(hx + 4, hy + 2);
  g.lineTo(hx + 11, hy + 4.5);
  g.lineTo(hx - 3, hy + 4);
  g.closePath();
  g.fill();
  g.lineWidth = 1.6;
  g.beginPath();
  g.moveTo(hx, hy - 4);
  g.quadraticCurveTo(hx - 8, hy - 9, hx - 15, hy - 8);
  g.moveTo(hx + 3, hy - 4.5);
  g.quadraticCurveTo(hx - 3, hy - 12, hx - 9, hy - 13);
  g.stroke();
  // tail spade
  const [tx, ty] = spine[N];
  g.beginPath();
  g.moveTo(tx + 4, ty);
  g.lineTo(tx - 4, ty - 5);
  g.lineTo(tx - 9, ty);
  g.lineTo(tx - 4, ty + 5);
  g.closePath();
  g.fill();
  // tucked hind leg with claws
  const [lx, ly] = spine[10];
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(lx + 2, ly + 4);
  g.lineTo(lx - 6, ly + 11);
  g.lineTo(lx - 14, ly + 10);
  g.stroke();

  wing(alpha, true, 12, -3, 1); // near wing
  g.restore();
}

export function startScene(canvas: HTMLCanvasElement, host: HTMLElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const M = 0.04; // parallax margin each side
  let W = 0, H = 0, dpr = 1, LW = 0;
  let p = readPalette();
  let sky: HTMLCanvasElement, far: HTMLCanvasElement, mid: HTMLCanvasElement, fg: HTMLCanvasElement;
  let fogA: HTMLCanvasElement, fogB: HTMLCanvasElement, rays: HTMLCanvasElement;
  let city: ReturnType<typeof paintCity>;
  let stars: { x: number; y: number; r: number; ph: number }[] = [];
  let dragons: Dragon[] = [];
  let raf = 0;
  let visible = true;
  let pointer = 0, pointerT = 0;
  const orb = { x: 0.8, y: 0.2 };

  function build() {
    const prevW = W;
    const r = host.getBoundingClientRect();
    W = Math.max(320, Math.round(r.width));
    H = Math.max(400, Math.round(r.height));
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    LW = Math.round(W * (1 + 2 * M));
    p = readPalette();
    const narrow = W < 700;
    orb.x = narrow ? 0.72 : 0.8;
    orb.y = narrow ? 0.16 : 0.2;

    // sky with moon/sun halo baked in
    sky = makeCanvas(W, H);
    const sg = sky.getContext('2d')!;
    const grad = sg.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, css(p.skyTop));
    grad.addColorStop(0.5, css(p.skyMid));
    grad.addColorStop(0.85, css(p.skyLow));
    sg.fillStyle = grad;
    sg.fillRect(0, 0, W, H);
    const ox = W * orb.x, oy = H * orb.y, or = Math.min(W, H) * (narrow ? 0.09 : 0.075);
    const halo = sg.createRadialGradient(ox, oy, or * 0.8, ox, oy, or * 6);
    halo.addColorStop(0, css(p.orb, 0.35));
    halo.addColorStop(1, css(p.orb, 0));
    sg.fillStyle = halo;
    sg.fillRect(0, 0, W, H);
    const disc = sg.createRadialGradient(ox - or * 0.3, oy - or * 0.3, or * 0.1, ox, oy, or);
    disc.addColorStop(0, css(p.orb));
    disc.addColorStop(1, css(mix(p.orb, p.skyMid, 0.18)));
    sg.fillStyle = disc;
    sg.beginPath();
    sg.arc(ox, oy, or, 0, Math.PI * 2);
    sg.fill();
    // faint maria on the moon (only visible at night palettes)
    const mr = seeded(5);
    for (let i = 0; i < 6; i++) {
      const mx = ox + (mr() - 0.5) * or, my = oy + (mr() - 0.5) * or, rr = or * (0.18 + mr() * 0.25);
      const mg = sg.createRadialGradient(mx, my, 0, mx, my, rr);
      mg.addColorStop(0, css(mix(p.orb, p.skyMid, 0.5), 0.16 * p.starO));
      mg.addColorStop(1, css(mix(p.orb, p.skyMid, 0.5), 0));
      sg.fillStyle = mg;
      sg.fillRect(mx - rr, my - rr, rr * 2, rr * 2);
    }

    // light rays, pre-rendered once and rotated slowly each frame
    const R = Math.round(Math.max(W, H) * 0.9);
    rays = makeCanvas(R * 2, R * 2);
    const rg = rays.getContext('2d')!;
    rg.translate(R, R);
    for (let i = 0; i < 11; i++) {
      rg.rotate((Math.PI * 2) / 11 + (i % 3) * 0.05);
      const lg = rg.createLinearGradient(0, 0, 0, R);
      lg.addColorStop(0, css(p.orb, 0.9));
      lg.addColorStop(1, css(p.orb, 0));
      rg.fillStyle = lg;
      rg.beginPath();
      rg.moveTo(-4, 0);
      rg.lineTo(-R * (0.06 + (i % 4) * 0.03), R);
      rg.lineTo(R * (0.06 + (i % 4) * 0.03), R);
      rg.lineTo(4, 0);
      rg.fill();
    }

    const lightX = orb.x;
    far = paintRange(LW, H, { base: 0.72, height: 0.44, rough: 0.95, seed: 17, color: p.far, haze: 0.45, snow: 0.32, valley: 0.3, lightX }, p).canvas;
    mid = paintRange(LW, H, { base: 0.92, height: 0.46, rough: 0.85, seed: 29, color: p.mid, haze: 0.12, snow: 0.26, valley: 0.62, lightX }, p).canvas;
    city = paintCity(LW, H, p, H * (narrow ? 0.86 : 0.8));
    fg = paintForeground(LW, H, p);
    fogA = paintFog(LW, H * 0.22, p, 3);
    fogB = paintFog(LW, H * 0.18, p, 8);

    const rs = seeded(23);
    stars = Array.from({ length: Math.round((W * H) / 6000) }, () => ({ x: rs() * W, y: rs() * H * 0.6, r: 0.4 + rs() * 1.1, ph: rs() * 6.28 }));
    const ds = Math.min(1, W / 1200) * 0.95 + 0.25;
    const flock: Dragon[] = [
      { depth: 0.1, y: 0.44, speed: 24, scale: 0.42 * ds, dir: 1, phase: 0, flap: 4.2, x: W * 0.12 },
      { depth: 0.15, y: 0.34, speed: 20, scale: 0.34 * ds, dir: -1, phase: 2, flap: 4.6, x: W * 0.78 },
      { depth: 0.2, y: 0.5, speed: 28, scale: 0.5 * ds, dir: 1, phase: 4, flap: 3.8, x: W * 0.62 },
      { depth: 1, y: 0.14, speed: 60, scale: 1.05 * ds, dir: 1, phase: 1, flap: 3, x: W * 0.05 },
    ];
    // Rebuilds (theme switch, resize) keep the flight going: same place across the screen, only the size adapts.
    dragons = dragons.length
      ? dragons.map((d, i) => ({ ...d, scale: flock[i].scale, x: prevW ? (d.x / prevW) * W : d.x }))
      : flock;
  }

  function frame(now: number, dt: number) {
    const t = now / 1000;
    const g = ctx!;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const scrollY = clamp(window.scrollY, 0, H);
    pointer += (pointerT - pointer) * Math.min(1, dt * 2);
    const layer = (img: HTMLCanvasElement, depth: number, y = 0) => {
      const px = -W * M + pointer * W * M * depth;
      g.drawImage(img, px, y + scrollY * (0.45 - depth * 0.4), LW, img.height === H ? H : img.height);
    };

    g.drawImage(sky, 0, scrollY * 0.5, W, H);
    // stars
    if (p.starO > 0.01)
      for (const s of stars) {
        g.fillStyle = css([255, 255, 255], p.starO * (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 1.5 + s.ph))));
        g.fillRect(s.x, s.y + scrollY * 0.5, s.r, s.r);
      }
    // light rays from the orb
    const ox = W * orb.x, oy = H * orb.y + scrollY * 0.5;
    g.save();
    g.translate(ox, oy);
    g.rotate(t * 0.015);
    g.globalAlpha = p.rayO * (0.8 + 0.2 * Math.sin(t * 0.5));
    g.drawImage(rays, -rays.width / 2, -rays.height / 2);
    g.restore();
    g.globalAlpha = 1;

    const moveDragon = (d: Dragon) => {
      d.x += d.dir * d.speed * dt * (W / 1200 + 0.3);
      const span = W * 1.4;
      if (d.dir > 0 && d.x > W * 1.2) d.x -= span + W * 0.2 * d.depth * 4;
      if (d.dir < 0 && d.x < -W * 0.2) d.x += span;
      const y = H * d.y + Math.sin(t * 0.5 + d.phase) * H * 0.02 + scrollY * (0.45 - d.depth * 0.3);
      const col = d.depth < 0.5 ? css(mix(p.dragon, p.skyMid, 0.45), 0.9) : css(p.dragon, 0.95);
      ctx!.save();
      ctx!.translate(0, y);
      drawDragon(ctx!, d, t, d.scale, col);
      ctx!.restore();
    };

    layer(far, 0.15);
    for (const d of dragons) if (d.depth < 0.5) moveDragon(d);
    // fog between the ranges, drifting
    const fogX = (img: HTMLCanvasElement, speed: number, y: number, depth: number) => {
      const off = ((t * speed) % LW) - LW;
      for (const k of [0, 1]) g.drawImage(img, off + k * LW - W * M + pointer * W * M * depth, y + scrollY * (0.45 - depth * 0.4));
    };
    fogX(fogA, 8, H * 0.5, 0.3);
    layer(mid, 0.45);
    layer(city.canvas, 0.55);
    // flickering windows + rose window glow
    const cx = -W * M + pointer * W * M * 0.55;
    const cy = scrollY * (0.45 - 0.55 * 0.4);
    g.globalCompositeOperation = 'lighter';
    for (const w of city.wins) {
      const a = p.windowO * (0.7 + 0.3 * Math.sin(t * w.speed + w.phase));
      g.fillStyle = css(p.window, a);
      g.fillRect(w.x + cx, w.y + cy, w.w, w.h);
    }
    const rr = city.rose;
    const rx = rr.x + cx, ry = rr.y + cy;
    const glow = g.createRadialGradient(rx, ry, rr.r * 0.5, rx, ry, rr.r * 2.4);
    glow.addColorStop(0, css(p.window, 0.35 * p.windowO));
    glow.addColorStop(1, css(p.window, 0));
    g.fillStyle = glow;
    g.fillRect(rx - rr.r * 2.4, ry - rr.r * 2.4, rr.r * 4.8, rr.r * 4.8);
    g.globalCompositeOperation = 'source-over';
    // rose window tracery
    g.fillStyle = css(p.window, p.windowO * (0.85 + 0.15 * Math.sin(t * 0.8)));
    g.beginPath();
    g.arc(rx, ry, rr.r, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = css(p.city);
    g.lineWidth = Math.max(1, rr.r * 0.14);
    g.beginPath();
    for (let i = 0; i < 8; i++) {
      const an = (i / 8) * Math.PI * 2;
      g.moveTo(rx, ry);
      g.lineTo(rx + Math.cos(an) * rr.r, ry + Math.sin(an) * rr.r);
    }
    g.moveTo(rx + rr.r * 0.45, ry);
    g.arc(rx, ry, rr.r * 0.45, 0, Math.PI * 2);
    g.stroke();
    fogX(fogB, 14, H * 0.72, 0.6);
    layer(fg, 0.85);
    for (const d of dragons) if (d.depth >= 0.5) moveDragon(d);
  }

  let last = performance.now();
  function loop(now: number) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    frame(now, dt);
    raf = requestAnimationFrame(loop);
  }
  function run() {
    cancelAnimationFrame(raf);
    if (reduce.matches || !visible || document.hidden) {
      frame(performance.now(), 0); // one still frame
      return;
    }
    last = performance.now();
    raf = requestAnimationFrame(loop);
  }

  build();
  run();
  let rt = 0;
  new ResizeObserver(() => {
    clearTimeout(rt);
    rt = window.setTimeout(() => (build(), run()), 120);
  }).observe(host);
  new IntersectionObserver(([e]) => ((visible = e.isIntersecting), run())).observe(host);
  document.addEventListener('visibilitychange', run);
  reduce.addEventListener('change', run);
  // draw the new theme immediately so a theme transition captures a painted frame
  const rebuild = () => (build(), frame(performance.now(), 0), run());
  new MutationObserver(rebuild).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', rebuild);
  host.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'mouse') pointerT = clamp(e.clientX / window.innerWidth) * 2 - 1;
  });
  window.addEventListener('scroll', () => reduce.matches && frame(performance.now(), 0), { passive: true });
}
