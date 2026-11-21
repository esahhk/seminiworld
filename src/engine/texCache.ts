import * as THREE from 'three/webgpu';

export interface TexCache {
  get: (
    key: string,
    w: number,
    h: number,
    drawFn: (g: CanvasRenderingContext2D, w: number, h: number) => void,
    isLinear?: boolean,
  ) => THREE.CanvasTexture;
  bumpNoise: (key?: string, contrast?: number) => THREE.CanvasTexture;
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
  ) => THREE.CanvasTexture;
  grass: (c1?: string, c2?: string) => THREE.CanvasTexture;
  lava: () => THREE.CanvasTexture;
  radiation: () => THREE.CanvasTexture;
  mesh: () => THREE.CanvasTexture;
  asphaltRoad: (key?: string, centerLine?: boolean) => THREE.CanvasTexture;
  crosswalk: (key?: string) => THREE.CanvasTexture;
  pavement: (c1?: string, c2?: string, key?: string) => THREE.CanvasTexture;
  facadeWindows: (baseCol?: string, litCol?: string, key?: string) => THREE.CanvasTexture;
  corrugated: (baseCol?: string, key?: string) => THREE.CanvasTexture;
  truckLivery: () => THREE.CanvasTexture;
  waterSurface: () => THREE.CanvasTexture;
  dispose: () => void;
}

export function createTexCache(maxAnisotropy = 1): TexCache {
  const cache = new Map<string, THREE.CanvasTexture>();
  const maxSize = 260;

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

  function bumpNoise(key = 'bump_std', contrast = 42) {
    return get(
      'bump_' + key + contrast,
      512,
      512,
      (g, w, h) => {
        g.fillStyle = '#808080';
        g.fillRect(0, 0, w, h);
        for (let i = 0; i < 14000; i++) {
          const d = Math.floor((Math.random() - 0.5) * contrast * 1.6);
          const v = Math.max(0, Math.min(255, 128 + d));
          g.fillStyle = `rgb(${v},${v},${v})`;
          const sz = 0.8 + Math.random() * 1.1;
          g.fillRect(Math.random() * w, Math.random() * h, sz, sz);
        }
      },
      true,
    );
  }

  function concrete(base = '#8a8b88', wear = 0.14, key = 'conc') {
    return get(key + base, 512, 512, (g, w, h) => {
      g.fillStyle = base;
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < 28; i++) {
        const rx = Math.random() * w;
        const ry = Math.random() * h;
        const r = 24 + Math.random() * 54;
        const gr = g.createRadialGradient(rx, ry, 2, rx, ry, r);
        const shade = Math.random() > 0.55 ? '185,188,190' : '22,24,26';
        gr.addColorStop(0, `rgba(${shade},${wear * 0.14})`);
        gr.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = gr;
        g.fillRect(rx - r, ry - r, r * 2, r * 2);
      }
      for (let i = 0; i < 11000; i++) {
        const a = Math.random() * wear * 0.42;
        g.fillStyle =
          Math.random() > 0.5
            ? `rgba(210,214,218,${a})`
            : `rgba(18,20,22,${a * 1.15})`;
        g.fillRect(Math.random() * w, Math.random() * h, 1, 1);
      }
      g.strokeStyle = 'rgba(20,20,18,0.06)';
      g.lineWidth = 1;
      for (let i = 0; i < 6; i++) {
        g.beginPath();
        let x = Math.random() * w;
        let y = Math.random() * h;
        g.moveTo(x, y);
        for (let s = 0; s < 5; s++) {
          x += (Math.random() - 0.5) * 60;
          y += (Math.random() - 0.5) * 60;
          g.lineTo(x, y);
        }
        g.stroke();
      }
      g.strokeStyle = 'rgba(0,0,0,0.05)';
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
    return get(key + c1 + n, 512, 512, (g, w, h) => {
      const s = w / n;
      for (let y = 0; y < n; y++) {
        for (let x = 0; x < n; x++) {
          g.fillStyle = (x + y) % 2 ? c1 : c2;
          g.fillRect(x * s, y * s, s, s);
          g.fillStyle = 'rgba(255,255,255,0.07)';
          g.fillRect(x * s + 3, y * s + 3, s - 6, 3);
          g.fillStyle = 'rgba(0,0,0,0.04)';
          g.fillRect(x * s + 3, (y + 1) * s - 5, s - 6, 2);
        }
      }
      g.strokeStyle = line;
      g.lineWidth = 3;
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
      for (let i = 0; i < 1600; i++) {
        g.fillStyle = `rgba(0,0,0,${Math.random() * 0.035})`;
        g.fillRect(Math.random() * w, Math.random() * h, 1.2, 1.2);
      }
    });
  }

  function wood(base = '#8c6844', dark = '#66482b', key = 'wood') {
    return get(key + base, 512, 512, (g, w, h) => {
      g.fillStyle = base;
      g.fillRect(0, 0, w, h);
      g.strokeStyle = dark;
      for (let i = 0; i < 110; i++) {
        g.globalAlpha = 0.14 + Math.random() * 0.22;
        g.lineWidth = 1 + Math.random() * 2.2;
        const y = Math.random() * h;
        g.beginPath();
        g.moveTo(0, y);
        g.bezierCurveTo(
          w * 0.3,
          y + (Math.random() - 0.5) * 24,
          w * 0.7,
          y + (Math.random() - 0.5) * 24,
          w,
          y + (Math.random() - 0.5) * 14,
        );
        g.stroke();
      }
      g.globalAlpha = 0.24;
      g.lineWidth = 2.5;
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
    return get(key, 512, 512, (g, w, h) => {
      g.fillStyle = '#d1a028';
      g.fillRect(0, 0, w, h);
      g.fillStyle = '#22211e';
      for (let i = -w; i < w * 2; i += 96) {
        g.beginPath();
        g.moveTo(i, 0);
        g.lineTo(i + 48, 0);
        g.lineTo(i + 48 - h, h);
        g.lineTo(i - h, h);
        g.closePath();
        g.fill();
      }
      for (let i = 0; i < 1600; i++) {
        g.fillStyle = 'rgba(0,0,0,0.08)';
        g.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5);
      }
    });
  }

  function sign(
    text: string,
    bg = '#f2ede1',
    fg = '#262421',
    sub = '',
    handwritten = false,
  ) {
    return get(
      's_' + text + bg + fg + sub + String(handwritten),
      1024,
      512,
      (g, w, h) => {
        g.fillStyle = bg;
        g.fillRect(0, 0, w, h);
        g.strokeStyle = 'rgba(0,0,0,0.22)';
        g.lineWidth = 10;
        g.strokeRect(14, 14, w - 28, h - 28);
        g.fillStyle = fg;
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        const fam = handwritten
          ? "'KaiTi','STKaiti',cursive,sans-serif"
          : 'sans-serif';
        let fs = handwritten ? 84 : 80;
        g.font = `bold ${fs}px ${fam}`;
        const tw = g.measureText(text).width;
        if (tw > w - 80) {
          fs = Math.max(46, Math.floor((fs * (w - 80)) / tw));
          g.font = `bold ${fs}px ${fam}`;
        }
        g.fillText(text, w / 2, sub ? h * 0.39 : h * 0.5);
        if (sub) {
          let sfs = 44;
          g.font = `${sfs}px sans-serif`;
          const sw = g.measureText(sub).width;
          if (sw > w - 80) {
            sfs = Math.max(26, Math.floor((sfs * (w - 80)) / sw));
            g.font = `${sfs}px sans-serif`;
          }
          g.globalAlpha = 0.82;
          g.fillText(sub, w / 2, h * 0.72);
          g.globalAlpha = 1;
        }
        for (let i = 0; i < 1100; i++) {
          g.fillStyle = `rgba(30,25,20,${Math.random() * 0.04})`;
          g.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5);
        }
      },
    );
  }

  function grass(c1 = '#4b6b3b', c2 = '#37522b') {
    return get('g_' + c1, 512, 512, (g, w, h) => {
      g.fillStyle = c1;
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < 6500; i++) {
        const roll = Math.random();
        g.fillStyle = roll > 0.45 ? c2 : roll > 0.15 ? '#5d8047' : '#6c9154';
        g.fillRect(
          Math.random() * w,
          Math.random() * h,
          1.4 + Math.random() * 0.8,
          5 + Math.random() * 8,
        );
      }
    });
  }

  function lava() {
    return get('lava', 512, 512, (g, w, h) => {
      g.fillStyle = '#241514';
      g.fillRect(0, 0, w, h);
      g.strokeStyle = '#d94e1f';
      g.lineWidth = 5;
      for (let i = 0; i < 24; i++) {
        g.beginPath();
        let x = Math.random() * w;
        let y = Math.random() * h;
        g.moveTo(x, y);
        for (let s = 0; s < 5; s++) {
          x += (Math.random() - 0.5) * 110;
          y += (Math.random() - 0.5) * 110;
          g.lineTo(x, y);
        }
        g.stroke();
      }
      g.strokeStyle = '#ffaa3b';
      g.lineWidth = 2;
      for (let i = 0; i < 16; i++) {
        g.beginPath();
        let x = Math.random() * w;
        let y = Math.random() * h;
        g.moveTo(x, y);
        for (let s = 0; s < 3; s++) {
          x += (Math.random() - 0.5) * 90;
          y += (Math.random() - 0.5) * 90;
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
      g.fillStyle = '#363a40';
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < 18000; i++) {
        const v = Math.random() > 0.52 ? 120 : 20;
        g.fillStyle = `rgba(${v},${v},${v},${Math.random() * 0.045})`;
        g.fillRect(Math.random() * w, Math.random() * h, 1, 1);
      }
      g.fillStyle = 'rgba(235, 236, 230, 0.88)';
      g.fillRect(18, 0, 9, h);
      g.fillRect(w - 27, 0, 9, h);
      if (centerLine) {
        g.fillStyle = '#e5b842';
        for (let y = 24; y < h; y += 128) {
          g.fillRect(w / 2 - 7, y, 14, 72);
        }
      }
    });
  }

  function crosswalk(key = 'cw') {
    return get(key, 512, 512, (g, w, h) => {
      g.fillStyle = '#363a40';
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < 9000; i++) {
        const v = Math.random() > 0.5 ? 220 : 16;
        g.fillStyle = `rgba(${v},${v},${v},${Math.random() * 0.06})`;
        g.fillRect(Math.random() * w, Math.random() * h, 1.1, 1.1);
      }
      g.fillStyle = 'rgba(242, 244, 240, 0.92)';
      for (let x = 36; x < w - 36; x += 84) {
        g.fillRect(x, 54, 44, h - 108);
      }
    });
  }

  function pavement(c1 = '#aeb2b5', c2 = '#9fa4a8', key = 'pav') {
    return get(key + c1 + c2, 512, 512, (g, w, h) => {
      g.fillStyle = '#7e8388';
      g.fillRect(0, 0, w, h);
      const rows = 8;
      const cols = 4;
      const rw = w / cols;
      const rh = h / rows;
      for (let r = 0; r < rows; r++) {
        const offset = (r % 2) * (rw * 0.5);
        for (let c = -1; c <= cols; c++) {
          const px = c * rw + offset + 2;
          const py = r * rh + 2;
          g.fillStyle = (r + c) % 2 === 0 ? c1 : c2;
          g.fillRect(px, py, rw - 4, rh - 4);
          g.fillStyle = 'rgba(255,255,255,0.12)';
          g.fillRect(px, py, rw - 4, 2);
          g.fillStyle = 'rgba(0,0,0,0.08)';
          g.fillRect(px, py + rh - 6, rw - 4, 2);
        }
      }
      for (let i = 0; i < 3600; i++) {
        g.fillStyle = `rgba(0,0,0,${Math.random() * 0.045})`;
        g.fillRect(Math.random() * w, Math.random() * h, 1.2, 1.2);
      }
    });
  }

  function facadeWindows(baseCol = '#727c87', litCol = '#f2dba2', key = 'fac') {
    return get(key + baseCol + litCol, 512, 512, (g, w, h) => {
      g.fillStyle = baseCol;
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < 3000; i++) {
        g.fillStyle = `rgba(0,0,0,${Math.random() * 0.035})`;
        g.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5);
      }
      const cols = 4;
      const rows = 4;
      const cw = w / cols;
      const ch = h / rows;
      for (let r = 0; r < rows; r++) {
        g.fillStyle = 'rgba(0,0,0,0.09)';
        g.fillRect(0, r * ch, w, 4);
        for (let c = 0; c < cols; c++) {
          const x = c * cw + 20;
          const y = r * ch + 20;
          const ww = cw - 40;
          const wh = ch - 40;
          g.fillStyle = '#242d36';
          g.fillRect(x - 4, y - 4, ww + 8, wh + 8);
          const lit = ((r * 7 + c * 13) % 5) < 2;
          const grad = g.createLinearGradient(x, y, x, y + wh);
          if (lit) {
            grad.addColorStop(0, litCol);
            grad.addColorStop(1, '#c9aa6e');
          } else {
            grad.addColorStop(0, '#5a788d');
            grad.addColorStop(1, '#374c5c');
          }
          g.fillStyle = grad;
          g.fillRect(x, y, ww, wh);
          g.fillStyle = 'rgba(255,255,255,0.16)';
          g.fillRect(x + 4, y + 4, ww * 0.32, wh - 8);
          g.fillStyle = '#2b3540';
          g.fillRect(x + ww * 0.5 - 2, y, 4, wh);
          g.fillRect(x, y + wh * 0.55, ww, 3);
        }
      }
    });
  }

  function corrugated(baseCol = '#eef1f4', key = 'corr') {
    return get(key + baseCol, 512, 512, (g, w, h) => {
      g.fillStyle = baseCol;
      g.fillRect(0, 0, w, h);
      for (let x = 0; x < w; x += 24) {
        g.fillStyle = 'rgba(0,0,0,0.08)';
        g.fillRect(x, 0, 6, h);
        g.fillStyle = 'rgba(255,255,255,0.15)';
        g.fillRect(x + 7, 0, 5, h);
      }
      g.strokeStyle = 'rgba(0,0,0,0.08)';
      g.lineWidth = 4;
      g.strokeRect(2, 2, w - 4, h - 4);
    });
  }

  function truckLivery() {
    return get('truck_livery', 1024, 512, (g, w, h) => {
      g.fillStyle = '#f2f4f6';
      g.fillRect(0, 0, w, h);
      for (let x = 0; x < w; x += 24) {
        g.fillStyle = 'rgba(0,0,0,0.045)';
        g.fillRect(x, 0, 5, h);
      }
      g.fillStyle = '#224c78';
      g.fillRect(0, h * 0.66, w, 52);
      g.fillStyle = '#d98434';
      g.fillRect(0, h * 0.61, w, 18);
      g.fillStyle = '#224c78';
      g.font = 'bold 84px sans-serif';
      g.textAlign = 'center';
      g.fillText('城市速运 · LOGISTICS', w / 2, h * 0.42);
      g.fillStyle = '#5a6875';
      g.font = 'bold 40px sans-serif';
      g.fillText('MICRO-CITY EXPRESS  ·  08', w / 2, h * 0.86);
    });
  }

  function waterSurface() {
    return get('water_surf', 512, 512, (g, w, h) => {
      g.fillStyle = '#369bb3';
      g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(205, 248, 255, 0.24)';
      g.lineWidth = 2.5;
      for (let i = 0; i < 42; i++) {
        g.beginPath();
        const cx = Math.random() * w;
        const cy = Math.random() * h;
        g.ellipse(cx, cy, 24 + Math.random() * 42, 8 + Math.random() * 18, 0.2, 0, Math.PI * 2);
        g.stroke();
      }
      g.strokeStyle = 'rgba(255, 255, 255, 0.14)';
      g.lineWidth = 1.5;
      for (let i = 0; i < 24; i++) {
        g.beginPath();
        const cx = Math.random() * w;
        const cy = Math.random() * h;
        g.ellipse(cx, cy, 12 + Math.random() * 20, 4 + Math.random() * 8, -0.3, 0, Math.PI * 2);
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
    bumpNoise,
    concrete,
    tiles,
    wood,
    hazard,
    sign,
    grass,
    lava,
    radiation,
    mesh,
    asphaltRoad,
    crosswalk,
    pavement,
    facadeWindows,
    corrugated,
    truckLivery,
    waterSurface,
    dispose,
  };
}
