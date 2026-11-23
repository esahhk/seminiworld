import * as THREE from 'three/webgpu';

export interface TexCache {
  get: (
    key: string,
    w: number,
    h: number,
    drawFn: (g: CanvasRenderingContext2D, w: number, h: number) => void,
    isLinear?: boolean,
  ) => THREE.CanvasTexture;
  normalFromHeight: (
    key: string,
    w: number,
    h: number,
    heightFn: (x: number, y: number, w: number, h: number) => number,
    strength?: number,
  ) => THREE.CanvasTexture;
  bumpNoise: (key?: string, contrast?: number) => THREE.CanvasTexture;
  concreteNormal: (key?: string, strength?: number) => THREE.CanvasTexture;
  brickNormal: (key?: string, strength?: number) => THREE.CanvasTexture;
  asphaltNormal: (key?: string, strength?: number) => THREE.CanvasTexture;
  corrugatedNormal: (key?: string, strength?: number) => THREE.CanvasTexture;
  radialShadow: (key?: string) => THREE.CanvasTexture;
  concrete: (base?: string, wear?: number, key?: string) => THREE.CanvasTexture;
  tiles: (
    c1?: string,
    c2?: string,
    line?: string,
    n?: number,
    key?: string,
  ) => THREE.CanvasTexture;
  wood: (base?: string, dark?: string, key?: string) => THREE.CanvasTexture;
  hazard: (key?: string) => THREE.CanvasTexture;
  sign: (
    text: string,
    bg?: string,
    fg?: string,
    sub?: string,
    handwritten?: boolean,
    aspect?: number,
  ) => THREE.CanvasTexture;
  heightChart: () => THREE.CanvasTexture;
  grass: (c1?: string, c2?: string) => THREE.CanvasTexture;
  lava: () => THREE.CanvasTexture;
  radiation: () => THREE.CanvasTexture;
  mesh: () => THREE.CanvasTexture;
  asphaltRoad: (key?: string, centerLine?: boolean) => THREE.CanvasTexture;
  crosswalk: (key?: string) => THREE.CanvasTexture;
  pavement: (c1?: string, c2?: string, key?: string) => THREE.CanvasTexture;
  facadeWindows: (baseCol?: string, litCol?: string, key?: string) => THREE.CanvasTexture;
  brickFacade: (brickCol?: string, mortarCol?: string, key?: string) => THREE.CanvasTexture;
  corrugated: (baseCol?: string, key?: string) => THREE.CanvasTexture;
  truckLivery: () => THREE.CanvasTexture;
  waterSurface: () => THREE.CanvasTexture;
  dispose: () => void;
}

function parseHexRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const n = parseInt(
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean,
    16,
  );
  if (Number.isNaN(n)) {
    return [128, 128, 128];
  }
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function fillPixelNoise(
  g: CanvasRenderingContext2D,
  w: number,
  h: number,
  baseR: number,
  baseG: number,
  baseB: number,
  amp: number,
  seedInit = 1337,
) {
  const img = g.createImageData(w, h);
  const d = img.data;
  let s = seedInit | 0;
  for (let i = 0; i < d.length; i += 4) {
    s = (s * 1664525 + 1013904223) | 0;
    const n = (((s >>> 16) & 255) / 255 - 0.5) * amp;
    d[i] = Math.max(0, Math.min(255, (baseR + n) | 0));
    d[i + 1] = Math.max(0, Math.min(255, (baseG + n) | 0));
    d[i + 2] = Math.max(0, Math.min(255, (baseB + n) | 0));
    d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
}

function hash2D(x: number, y: number, seed = 1337): number {
  let h = (x * 374761393 + y * 668265263 + seed * 1442695041) | 0;
  h = ((h ^ (h >>> 13)) * 1274126177) | 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

export function createTexCache(maxAnisotropy = 1): TexCache {
  const cache = new Map<string, THREE.CanvasTexture>();
  const maxSize = 360;

  function get(
    key: string,
    w: number,
    h: number,
    drawFn: (g: CanvasRenderingContext2D, w: number, h: number) => void,
    isLinear = false,
  ): THREE.CanvasTexture {
    const hit = cache.get(key);
    if (hit) {
      return hit;
    }
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    if (ctx) {
      drawFn(ctx, w, h);
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = isLinear ? THREE.NoColorSpace : THREE.SRGBColorSpace;
    t.anisotropy = Math.max(1, maxAnisotropy);
    if (cache.size >= maxSize) {
      const fk = cache.keys().next().value;
      if (fk !== undefined) {
        const ft = cache.get(fk);
        cache.delete(fk);
        ft?.dispose();
      }
    }
    cache.set(key, t);
    return t;
  }

  function normalFromHeight(
    key: string,
    w: number,
    h: number,
    heightFn: (x: number, y: number, w: number, h: number) => number,
    strength = 2.4,
  ) {
    return get(
      'nrm_' + key + '_' + strength.toFixed(1),
      w,
      h,
      (g, cw, ch) => {
        const field = new Float32Array(cw * ch);
        for (let y = 0; y < ch; y++) {
          for (let x = 0; x < cw; x++) {
            field[y * cw + x] = heightFn(x, y, cw, ch);
          }
        }
        const img = g.createImageData(cw, ch);
        const d = img.data;
        const sample = (x: number, y: number) =>
          field[((y + ch) % ch) * cw + ((x + cw) % cw)];
        for (let y = 0; y < ch; y++) {
          for (let x = 0; x < cw; x++) {
            const tl = sample(x - 1, y - 1);
            const t = sample(x, y - 1);
            const tr = sample(x + 1, y - 1);
            const l = sample(x - 1, y);
            const r = sample(x + 1, y);
            const bl = sample(x - 1, y + 1);
            const b = sample(x, y + 1);
            const br = sample(x + 1, y + 1);
            const dX = (tr + 2 * r + br - (tl + 2 * l + bl)) * strength;
            const dY = (bl + 2 * b + br - (tl + 2 * t + tr)) * strength;
            let nx = -dX;
            let ny = -dY;
            let nz = 1;
            const invLen = 1 / Math.hypot(nx, ny, nz);
            nx *= invLen;
            ny *= invLen;
            nz *= invLen;
            const idx = (y * cw + x) * 4;
            d[idx] = Math.round((nx * 0.5 + 0.5) * 255);
            d[idx + 1] = Math.round((ny * 0.5 + 0.5) * 255);
            d[idx + 2] = Math.round((nz * 0.5 + 0.5) * 255);
            d[idx + 3] = 255;
          }
        }
        g.putImageData(img, 0, 0);
      },
      true,
    );
  }

  function bumpNoise(key = 'bump_std', contrast = 42) {
    return get(
      'bump_' + key + contrast,
      256,
      256,
      (g, w, h) => {
        fillPixelNoise(g, w, h, 128, 128, 128, contrast * 1.35, 9127 + contrast);
      },
      true,
    );
  }

  function concreteNormal(key = 'conc_n', strength = 1.9) {
    return normalFromHeight(
      'conc_' + key,
      256,
      256,
      (x, y, w, h) => {
        const fine = hash2D(x, y, 41) * 0.35;
        const seam = x % (w / 2) < 2 || y % (h / 2) < 2 ? -0.45 : 0;
        const grain = hash2D(x >> 2, y >> 2, 97) * 0.25;
        return fine + seam + grain;
      },
      strength,
    );
  }

  function brickNormal(key = 'brick_n', strength = 2.8) {
    return normalFromHeight(
      'brick_' + key,
      256,
      256,
      (x, y, w, h) => {
        const rows = 16;
        const cols = 8;
        const bw = w / cols;
        const bh = h / rows;
        const row = Math.floor(y / bh);
        const rx = (x + (row % 2) * (bw * 0.5)) % bw;
        const ry = y % bh;
        const mortar = rx < 2.2 || ry < 2.2 ? 0 : 0.72;
        return mortar + hash2D(x >> 1, y >> 1, 73) * 0.14;
      },
      strength,
    );
  }

  function asphaltNormal(key = 'asp_n', strength = 2.3) {
    return normalFromHeight(
      'asp_' + key,
      256,
      256,
      (x, y) => hash2D(x, y, 313) * 0.55 + hash2D(x >> 1, y >> 1, 617) * 0.28,
      strength,
    );
  }

  function corrugatedNormal(key = 'corr_n', strength = 2.6) {
    return normalFromHeight(
      'corr_' + key,
      256,
      256,
      (x) => 0.5 + 0.45 * Math.sin((x / 16) * Math.PI * 2),
      strength,
    );
  }

  function radialShadow(key = 'rad_sh') {
    const t = get(key, 256, 256, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      const gr = g.createRadialGradient(w / 2, h / 2, w * 0.08, w / 2, h / 2, w * 0.48);
      gr.addColorStop(0, 'rgba(6, 9, 14, 0.76)');
      gr.addColorStop(0.55, 'rgba(6, 9, 14, 0.42)');
      gr.addColorStop(0.85, 'rgba(6, 9, 14, 0.10)');
      gr.addColorStop(1, 'rgba(6, 9, 14, 0)');
      g.fillStyle = gr;
      g.fillRect(0, 0, w, h);
    });
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    return t;
  }

  function concrete(base = '#8a8b88', wear = 0.14, key = 'conc') {
    return get(key + base, 256, 256, (g, w, h) => {
      const [br, bg, bb] = parseHexRgb(base);
      fillPixelNoise(g, w, h, br, bg, bb, Math.round(wear * 115), 4019);
      for (let i = 0; i < 18; i++) {
        const rx = (i * 73) % w;
        const ry = (i * 137) % h;
        const r = 18 + (i % 5) * 8;
        const gr = g.createRadialGradient(rx, ry, 2, rx, ry, r);
        const shade = i % 2 === 0 ? '195,198,200' : '22,24,26';
        gr.addColorStop(0, `rgba(${shade},${wear * 0.16})`);
        gr.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = gr;
        g.fillRect(rx - r, ry - r, r * 2, r * 2);
      }
      g.strokeStyle = 'rgba(20,20,18,0.06)';
      g.lineWidth = 1;
      for (let i = 0; i < 5; i++) {
        g.beginPath();
        let x = (i * 53) % w;
        let y = (i * 89) % h;
        g.moveTo(x, y);
        for (let s = 0; s < 4; s++) {
          x += (((i + s) % 3) - 1) * 28 + 12;
          y += (((i * 2 + s) % 3) - 1) * 24 + 8;
          g.lineTo(x, y);
        }
        g.stroke();
      }
      g.strokeStyle = 'rgba(0,0,0,0.055)';
      g.lineWidth = 2;
      g.strokeRect(0, 0, w, h);
    });
  }

  function tiles(
    c1 = '#d7d5ce',
    c2 = '#c7c4bc',
    line = '#9b9890',
    n = 4,
    key = 'tile',
  ) {
    return get(key + c1 + n, 256, 256, (g, w, h) => {
      const s = w / n;
      for (let y = 0; y < n; y++) {
        for (let x = 0; x < n; x++) {
          g.fillStyle = (x + y) % 2 ? c1 : c2;
          g.fillRect(x * s, y * s, s, s);
          g.fillStyle = 'rgba(255,255,255,0.08)';
          g.fillRect(x * s + 2, y * s + 2, s - 4, 2);
          g.fillStyle = 'rgba(0,0,0,0.05)';
          g.fillRect(x * s + 2, (y + 1) * s - 4, s - 4, 2);
        }
      }
      g.strokeStyle = line;
      g.lineWidth = 2;
      for (let i = 0; i <= n; i++) {
        g.beginPath();
        g.moveTo(i * s, 0);
        g.lineTo(i * s, h);
        g.stroke();
        g.beginPath();
        g.moveTo(0, i * s);
        g.lineTo(w, i * s);
        g.stroke();
      }
    });
  }

  function wood(base = '#8c6844', dark = '#66482b', key = 'wood') {
    return get(key + base, 256, 256, (g, w, h) => {
      g.fillStyle = base;
      g.fillRect(0, 0, w, h);
      g.strokeStyle = dark;
      for (let i = 0; i < 64; i++) {
        g.globalAlpha = 0.14 + (i % 5) * 0.045;
        g.lineWidth = 1 + (i % 3) * 0.8;
        const y = (i / 64) * h;
        g.beginPath();
        g.moveTo(0, y);
        g.bezierCurveTo(
          w * 0.3,
          y + ((i % 7) - 3) * 3.5,
          w * 0.7,
          y - ((i % 5) - 2) * 3.5,
          w,
          y + ((i % 3) - 1) * 3,
        );
        g.stroke();
      }
      g.globalAlpha = 0.24;
      g.lineWidth = 2;
      for (let p = 1; p < 4; p++) {
        g.beginPath();
        g.moveTo(0, (h / 4) * p);
        g.lineTo(w, (h / 4) * p);
        g.stroke();
      }
      g.globalAlpha = 1;
    });
  }

  function hazard(key = 'haz') {
    return get(key, 256, 256, (g, w, h) => {
      g.fillStyle = '#d1a028';
      g.fillRect(0, 0, w, h);
      g.fillStyle = '#22211e';
      for (let i = -w; i < w * 2; i += 48) {
        g.beginPath();
        g.moveTo(i, 0);
        g.lineTo(i + 24, 0);
        g.lineTo(i + 24 - h, h);
        g.lineTo(i - h, h);
        g.closePath();
        g.fill();
      }
    });
  }

  function sign(
    text: string,
    bg = '#f2ede1',
    fg = '#262421',
    sub = '',
    handwritten = false,
    aspect = 2,
  ) {
    const clampedAspect = Math.max(0.45, Math.min(10, aspect || 2));
    let cw = 1024;
    let ch = 512;
    if (clampedAspect >= 1) {
      ch = clampedAspect > 4.5 ? 256 : 384;
      cw = Math.min(1536, Math.max(384, Math.round(ch * clampedAspect)));
    } else {
      cw = 384;
      ch = Math.min(960, Math.round(cw / clampedAspect));
    }
    const bucket = Math.round(clampedAspect * 10);
    return get(
      's_' + text + bg + fg + sub + String(handwritten) + '_' + bucket,
      cw,
      ch,
      (g, w, h) => {
        g.fillStyle = bg;
        g.fillRect(0, 0, w, h);
        const pad = Math.max(8, Math.round(Math.min(w, h) * 0.045));
        g.strokeStyle = 'rgba(0,0,0,0.24)';
        g.lineWidth = Math.max(4, Math.round(Math.min(w, h) * 0.022));
        g.strokeRect(pad, pad, w - pad * 2, h - pad * 2);
        g.strokeStyle = 'rgba(255,255,255,0.16)';
        g.lineWidth = 2;
        g.strokeRect(pad + 6, pad + 6, w - (pad + 6) * 2, h - (pad + 6) * 2);

        g.fillStyle = fg;
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        const fam = handwritten
          ? "'KaiTi','STKaiti',serif"
          : "'PingFang SC','Microsoft YaHei',sans-serif";
        const availW = w - pad * 4.5;
        let fs = Math.round(h * (sub ? 0.34 : 0.44));
        fs = Math.max(24, Math.min(130, fs));
        g.font = `bold ${fs}px ${fam}`;
        const tw = g.measureText(text).width;
        if (tw > availW) {
          fs = Math.max(20, Math.floor((fs * availW) / tw));
          g.font = `bold ${fs}px ${fam}`;
        }
        g.fillText(text, w / 2, sub ? h * 0.37 : h * 0.5);
        if (sub) {
          let sfs = Math.round(h * 0.19);
          sfs = Math.max(16, Math.min(54, sfs));
          g.font = `500 ${sfs}px sans-serif`;
          const sw = g.measureText(sub).width;
          if (sw > availW) {
            sfs = Math.max(14, Math.floor((sfs * availW) / sw));
            g.font = `500 ${sfs}px sans-serif`;
          }
          g.globalAlpha = 0.86;
          g.fillText(sub, w / 2, h * 0.72);
          g.globalAlpha = 1;
        }
      },
    );
  }

  function heightChart() {
    return get('inf_height_chart', 192, 1024, (g, w, h) => {
      g.fillStyle = '#f7f3e8';
      g.fillRect(0, 0, w, h);
      g.strokeStyle = '#3a5c4a';
      g.lineWidth = 4;
      g.strokeRect(6, 6, w - 12, h - 12);
      g.fillStyle = '#3a5c4a';
      g.textBaseline = 'middle';
      for (let cm = 70; cm <= 190; cm += 5) {
        const y = h - ((cm - 65) / 130) * (h - 40) - 20;
        const isMajor = cm % 20 === 0;
        const isTen = cm % 10 === 0;
        g.fillStyle = isMajor ? '#243d30' : '#4d6f5d';
        g.fillRect(14, y - 1, isMajor ? 56 : isTen ? 38 : 22, isMajor ? 4 : 2);
        if (isMajor) {
          g.font = 'bold 28px monospace';
          g.textAlign = 'left';
          g.fillText(`${cm}`, 78, y);
        }
      }
    });
  }

  function grass(c1 = '#4b6b3b', c2 = '#37522b') {
    return get('g_' + c1, 256, 256, (g, w, h) => {
      const [r1, g1, b1] = parseHexRgb(c1);
      fillPixelNoise(g, w, h, r1, g1, b1, 22, 7711);
      g.fillStyle = c2;
      for (let i = 0; i < 650; i++) {
        const x = (i * 59) % w;
        const y = (i * 101) % h;
        g.fillStyle = i % 3 === 0 ? c2 : i % 3 === 1 ? '#5d8047' : '#6c9154';
        g.fillRect(x, y, 1.5, 4 + (i % 5));
      }
    });
  }

  function lava() {
    return get('lava', 256, 256, (g, w, h) => {
      g.fillStyle = '#241514';
      g.fillRect(0, 0, w, h);
      g.strokeStyle = '#d94e1f';
      g.lineWidth = 4;
      for (let i = 0; i < 18; i++) {
        g.beginPath();
        let x = (i * 47) % w;
        let y = (i * 83) % h;
        g.moveTo(x, y);
        for (let s = 0; s < 4; s++) {
          x += (((i + s) % 3) - 1) * 42 + 12;
          y += (((i * 2 + s) % 3) - 1) * 42 + 8;
          g.lineTo(x, y);
        }
        g.stroke();
      }
      g.strokeStyle = '#ffaa3b';
      g.lineWidth = 2;
      for (let i = 0; i < 12; i++) {
        g.beginPath();
        let x = (i * 61) % w;
        let y = (i * 97) % h;
        g.moveTo(x, y);
        for (let s = 0; s < 3; s++) {
          x += (((i + s) % 3) - 1) * 32;
          y += (((i + s * 2) % 3) - 1) * 32;
          g.lineTo(x, y);
        }
        g.stroke();
      }
    });
  }

  function radiation() {
    return get('rad_floor', 512, 512, (g, w, h) => {
      g.fillStyle = '#e2b82b';
      g.fillRect(0, 0, w, h);
      g.strokeStyle = '#1c1b18';
      g.lineWidth = 18;
      g.strokeRect(18, 18, w - 36, h - 36);
      const cx = w / 2;
      const cy = h * 0.44;
      g.fillStyle = '#1c1b18';
      for (let k = 0; k < 3; k++) {
        const a0 = -Math.PI / 2 + k * ((Math.PI * 2) / 3) - Math.PI / 6;
        g.beginPath();
        g.arc(cx, cy, 124, a0, a0 + Math.PI / 3);
        g.arc(cx, cy, 44, a0 + Math.PI / 3, a0, true);
        g.closePath();
        g.fill();
      }
      g.beginPath();
      g.arc(cx, cy, 26, 0, Math.PI * 2);
      g.fill();
      g.font = 'bold 46px sans-serif';
      g.textAlign = 'center';
      g.fillText('注意电离辐射', cx, h * 0.84);
    });
  }

  function mesh() {
    return get('wire_mesh', 256, 256, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      g.strokeStyle = 'rgba(215, 240, 248, 0.72)';
      g.lineWidth = 4;
      for (let i = 0; i <= w; i += 32) {
        g.beginPath();
        g.moveTo(i, 0);
        g.lineTo(i, h);
        g.stroke();
        g.beginPath();
        g.moveTo(0, i);
        g.lineTo(w, i);
        g.stroke();
      }
    });
  }

  function asphaltRoad(key = 'asp_road', centerLine = true) {
    return get(key + String(centerLine), 512, 512, (g, w, h) => {
      fillPixelNoise(g, w, h, 46, 50, 56, 22, 2029);
      g.fillStyle = 'rgba(20, 22, 26, 0.22)';
      g.fillRect(w * 0.22, 0, w * 0.14, h);
      g.fillRect(w * 0.64, 0, w * 0.14, h);
      g.fillStyle = 'rgba(240, 242, 238, 0.92)';
      g.fillRect(16, 0, 8, h);
      g.fillRect(w - 24, 0, 8, h);
      if (centerLine) {
        g.fillStyle = '#eab83e';
        g.fillRect(w / 2 - 11, 0, 7, h);
        g.fillRect(w / 2 + 4, 0, 7, h);
        g.fillStyle = 'rgba(240, 242, 238, 0.72)';
        for (let y = 18; y < h; y += 96) {
          g.fillRect(w * 0.26 - 3, y, 6, 44);
          g.fillRect(w * 0.74 - 3, y, 6, 44);
        }
      }
    });
  }

  function crosswalk(key = 'cw') {
    return get(key, 512, 256, (g, w, h) => {
      fillPixelNoise(g, w, h, 46, 50, 56, 18, 3037);
      g.fillStyle = 'rgba(244, 246, 242, 0.94)';
      for (let x = 28; x < w - 28; x += 68) {
        g.fillRect(x, 26, 36, h - 52);
        g.fillStyle = 'rgba(0,0,0,0.08)';
        g.fillRect(x + 36, 26, 3, h - 52);
        g.fillStyle = 'rgba(244, 246, 242, 0.94)';
      }
    });
  }

  function pavement(c1 = '#aeb2b5', c2 = '#9fa4a8', key = 'pav') {
    return get(key + c1 + c2, 256, 256, (g, w, h) => {
      g.fillStyle = '#7e8388';
      g.fillRect(0, 0, w, h);
      const rows = 6;
      const cols = 3;
      const rw = w / cols;
      const rh = h / rows;
      for (let r = 0; r < rows; r++) {
        const offset = (r % 2) * (rw * 0.5);
        for (let c = -1; c <= cols; c++) {
          const px = c * rw + offset + 2;
          const py = r * rh + 2;
          g.fillStyle = (r + c) % 2 === 0 ? c1 : c2;
          g.fillRect(px, py, rw - 4, rh - 4);
          g.fillStyle = 'rgba(255,255,255,0.14)';
          g.fillRect(px, py, rw - 4, 2);
          g.fillStyle = 'rgba(0,0,0,0.09)';
          g.fillRect(px, py + rh - 5, rw - 4, 2);
        }
      }
    });
  }

  function facadeWindows(baseCol = '#727c87', litCol = '#f2dba2', key = 'fac') {
    return get(key + baseCol + litCol, 512, 512, (g, w, h) => {
      g.fillStyle = baseCol;
      g.fillRect(0, 0, w, h);
      const cols = 4;
      const rows = 4;
      const cw = w / cols;
      const ch = h / rows;
      for (let r = 0; r < rows; r++) {
        g.fillStyle = 'rgba(0,0,0,0.22)';
        g.fillRect(0, r * ch, w, 8);
        g.fillStyle = 'rgba(255,255,255,0.08)';
        g.fillRect(0, r * ch + 8, w, 3);
        for (let c = 0; c < cols; c++) {
          const x = c * cw + 18;
          const y = r * ch + 22;
          const ww = cw - 36;
          const wh = ch - 38;
          g.fillStyle = '#1f2832';
          g.fillRect(x - 5, y - 5, ww + 10, wh + 10);
          const lit = ((r * 7 + c * 13) % 5) < 2;
          const grad = g.createLinearGradient(x, y, x, y + wh);
          if (lit) {
            grad.addColorStop(0, litCol);
            grad.addColorStop(0.65, '#d6b174');
            grad.addColorStop(1, '#8c6e44');
          } else {
            grad.addColorStop(0, '#6a8ca6');
            grad.addColorStop(0.55, '#3f586b');
            grad.addColorStop(1, '#263644');
          }
          g.fillStyle = grad;
          g.fillRect(x, y, ww, wh);
          g.fillStyle = 'rgba(255,255,255,0.22)';
          g.fillRect(x + 4, y + 4, ww * 0.28, wh - 8);
          g.fillStyle = '#252f3a';
          g.fillRect(x + ww * 0.5 - 2, y, 4, wh);
          g.fillRect(x, y + wh * 0.54, ww, 4);
        }
      }
    });
  }

  function brickFacade(brickCol = '#8f523e', mortarCol = '#cfc6b8', key = 'brick') {
    return get(key + brickCol + mortarCol, 512, 512, (g, w, h) => {
      g.fillStyle = mortarCol;
      g.fillRect(0, 0, w, h);
      const rows = 16;
      const cols = 8;
      const bw = w / cols;
      const bh = h / rows;
      for (let r = 0; r < rows; r++) {
        const off = (r % 2) * (bw * 0.5);
        for (let c = -1; c <= cols; c++) {
          g.fillStyle = brickCol;
          g.globalAlpha = 0.85 + ((r * 3 + c * 5) % 4) * 0.04;
          g.fillRect(c * bw + off + 2, r * bh + 2, bw - 4, bh - 4);
        }
      }
      g.globalAlpha = 1;
      for (let wr = 0; wr < 2; wr++) {
        for (let wc = 0; wc < 2; wc++) {
          const x = wc * (w / 2) + 56;
          const y = wr * (h / 2) + 46;
          const ww = 144;
          const wh = 164;
          g.fillStyle = '#dcd4c4';
          g.fillRect(x - 10, y - 10, ww + 20, 12);
          g.fillRect(x - 12, y + wh, ww + 24, 16);
          g.fillStyle = '#242b33';
          g.fillRect(x - 5, y - 5, ww + 10, wh + 10);
          const grad = g.createLinearGradient(x, y, x, y + wh);
          const lit = (wr + wc) % 2 === 0;
          grad.addColorStop(0, lit ? '#ffdf9e' : '#587285');
          grad.addColorStop(1, lit ? '#bf8e4e' : '#31404c');
          g.fillStyle = grad;
          g.fillRect(x, y, ww, wh);
          g.fillStyle = '#242b33';
          g.fillRect(x + ww / 2 - 2, y, 4, wh);
          g.fillRect(x, y + wh * 0.48, ww, 4);
        }
      }
    });
  }

  function corrugated(baseCol = '#eef1f4', key = 'corr') {
    return get(key + baseCol, 256, 256, (g, w, h) => {
      g.fillStyle = baseCol;
      g.fillRect(0, 0, w, h);
      for (let x = 0; x < w; x += 16) {
        g.fillStyle = 'rgba(0,0,0,0.09)';
        g.fillRect(x, 0, 4, h);
        g.fillStyle = 'rgba(255,255,255,0.18)';
        g.fillRect(x + 5, 0, 3, h);
      }
      g.strokeStyle = 'rgba(0,0,0,0.09)';
      g.lineWidth = 3;
      g.strokeRect(2, 2, w - 4, h - 4);
    });
  }

  function truckLivery() {
    return get('truck_livery_v2', 1024, 512, (g, w, h) => {
      g.fillStyle = '#f2f4f7';
      g.fillRect(0, 0, w, h);
      for (let x = 0; x < w; x += 32) {
        g.fillStyle = 'rgba(18, 28, 42, 0.045)';
        g.fillRect(x, 0, 4, h);
      }
      g.fillStyle = '#1b3f66';
      g.fillRect(0, h * 0.65, w, 64);
      g.fillStyle = '#de882f';
      g.fillRect(0, h * 0.6, w, 20);
      g.fillStyle = '#265c91';
      g.fillRect(0, 0, w, 22);
      g.fillStyle = '#d9dee6';
      g.fillRect(0, h - 22, w, 22);
      g.fillStyle = '#1b3f66';
      g.font = 'bold 84px sans-serif';
      g.textAlign = 'center';
      g.fillText('城市速运 · CITY CARGO', w / 2, h * 0.4);
      g.fillStyle = '#eef3f8';
      g.font = 'bold 34px monospace';
      g.fillText('EXPRESS DIVISION  ·  UNIT 08', w / 2, h * 0.725);
      g.fillStyle = '#53606d';
      g.font = 'bold 28px monospace';
      g.fillText('HEAVY LOGISTICS · MICRO-CITY HUB', w / 2, h * 0.875);
    });
  }

  function waterSurface() {
    return get('water_surf', 256, 256, (g, w, h) => {
      g.fillStyle = '#2f8ea8';
      g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(210, 248, 255, 0.28)';
      g.lineWidth = 2;
      for (let i = 0; i < 28; i++) {
        g.beginPath();
        const cx = (i * 53) % w;
        const cy = (i * 89) % h;
        g.ellipse(cx, cy, 16 + (i % 4) * 8, 6 + (i % 3) * 4, 0.2, 0, Math.PI * 2);
        g.stroke();
      }
    });
  }

  function dispose() {
    cache.forEach((tex) => tex.dispose());
    cache.clear();
  }

  return {
    get,
    normalFromHeight,
    bumpNoise,
    concreteNormal,
    brickNormal,
    asphaltNormal,
    corrugatedNormal,
    radialShadow,
    concrete,
    tiles,
    wood,
    hazard,
    sign,
    heightChart,
    grass,
    lava,
    radiation,
    mesh,
    asphaltRoad,
    crosswalk,
    pavement,
    facadeWindows,
    brickFacade,
    corrugated,
    truckLivery,
    waterSurface,
    dispose,
  };
}
