import * as THREE from 'three';

export interface TexCache {
  get: (
    key: string,
    w: number,
    h: number,
    drawFn: (g: CanvasRenderingContext2D, w: number, h: number) => void,
  ) => THREE.CanvasTexture;
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
  dispose: () => void;
}

export function createTexCache(maxAnisotropy = 1): TexCache {
  const cache = new Map<string, THREE.CanvasTexture>();
  const maxSize = 180;

  function get(
    key: string,
    w: number,
    h: number,
    drawFn: (g: CanvasRenderingContext2D, w: number, h: number) => void,
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
    t.colorSpace = THREE.SRGBColorSpace;
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

  function concrete(base = '#8a8b88', wear = 0.14, key = 'conc') {
    return get(key + base, 256, 256, (g, w, h) => {
      g.fillStyle = base;
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < 2000; i++) {
        const a = Math.random() * wear;
        g.fillStyle =
          Math.random() > 0.5
            ? `rgba(255,255,255,${a})`
            : `rgba(20,20,18,${a * 1.2})`;
        g.fillRect(
          Math.random() * w,
          Math.random() * h,
          1 + Math.random() * 3,
          1 + Math.random() * 3,
        );
      }
      g.strokeStyle = 'rgba(25,25,22,0.12)';
      g.lineWidth = 1;
      for (let i = 0; i < 5; i++) {
        g.beginPath();
        let x = Math.random() * w;
        let y = Math.random() * h;
        g.moveTo(x, y);
        for (let s = 0; s < 4; s++) {
          x += (Math.random() - 0.5) * 45;
          y += (Math.random() - 0.5) * 45;
          g.lineTo(x, y);
        }
        g.stroke();
      }
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
      for (let i = 0; i < 300; i++) {
        g.fillStyle = `rgba(0,0,0,${Math.random() * 0.05})`;
        g.fillRect(Math.random() * w, Math.random() * h, 3, 3);
      }
    });
  }

  function wood(base = '#8c6844', dark = '#66482b', key = 'wood') {
    return get(key + base, 256, 256, (g, w, h) => {
      g.fillStyle = base;
      g.fillRect(0, 0, w, h);
      g.strokeStyle = dark;
      for (let i = 0; i < 40; i++) {
        g.globalAlpha = 0.18 + Math.random() * 0.25;
        g.lineWidth = 1 + Math.random() * 2;
        const y = Math.random() * h;
        g.beginPath();
        g.moveTo(0, y);
        g.bezierCurveTo(
          w * 0.3,
          y + (Math.random() - 0.5) * 14,
          w * 0.7,
          y + (Math.random() - 0.5) * 14,
          w,
          y + (Math.random() - 0.5) * 8,
        );
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
      for (let i = 0; i < 450; i++) {
        g.fillStyle = 'rgba(0,0,0,0.12)';
        g.fillRect(Math.random() * w, Math.random() * h, 3, 3);
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
      512,
      256,
      (g, w, h) => {
        g.fillStyle = bg;
        g.fillRect(0, 0, w, h);
        g.strokeStyle = 'rgba(0,0,0,0.18)';
        g.lineWidth = 6;
        g.strokeRect(8, 8, w - 16, h - 16);
        g.fillStyle = fg;
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        const fam = handwritten
          ? "'KaiTi','STKaiti',cursive,sans-serif"
          : 'sans-serif';
        let fs = handwritten ? 42 : 40;
        g.font = `bold ${fs}px ${fam}`;
        const tw = g.measureText(text).width;
        if (tw > w - 40) {
          fs = Math.max(26, Math.floor((fs * (w - 40)) / tw));
          g.font = `bold ${fs}px ${fam}`;
        }
        g.fillText(text, w / 2, sub ? h * 0.4 : h * 0.5);
        if (sub) {
          let sfs = 23;
          g.font = `${sfs}px sans-serif`;
          const sw = g.measureText(sub).width;
          if (sw > w - 40) {
            sfs = Math.max(14, Math.floor((sfs * (w - 40)) / sw));
            g.font = `${sfs}px sans-serif`;
          }
          g.globalAlpha = 0.78;
          g.fillText(sub, w / 2, h * 0.72);
          g.globalAlpha = 1;
        }
        for (let i = 0; i < 400; i++) {
          g.fillStyle = `rgba(30,25,20,${Math.random() * 0.07})`;
          g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
        }
      },
    );
  }

  function grass(c1 = '#4b6b3b', c2 = '#37522b') {
    return get('g_' + c1, 256, 256, (g, w, h) => {
      g.fillStyle = c1;
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < 1800; i++) {
        g.fillStyle = Math.random() > 0.45 ? c2 : '#62834b';
        g.fillRect(
          Math.random() * w,
          Math.random() * h,
          2,
          4 + Math.random() * 4,
        );
      }
    });
  }

  function lava() {
    return get('lava', 256, 256, (g, w, h) => {
      g.fillStyle = '#241514';
      g.fillRect(0, 0, w, h);
      g.strokeStyle = '#d94e1f';
      g.lineWidth = 3;
      for (let i = 0; i < 16; i++) {
        g.beginPath();
        let x = Math.random() * w;
        let y = Math.random() * h;
        g.moveTo(x, y);
        for (let s = 0; s < 4; s++) {
          x += (Math.random() - 0.5) * 70;
          y += (Math.random() - 0.5) * 70;
          g.lineTo(x, y);
        }
        g.stroke();
      }
      g.strokeStyle = '#ff9933';
      g.lineWidth = 1;
      for (let i = 0; i < 8; i++) {
        g.beginPath();
        g.moveTo(Math.random() * w, Math.random() * h);
        g.lineTo(Math.random() * w, Math.random() * h);
        g.stroke();
      }
    });
  }

  function radiation() {
    return get('rad_floor', 256, 256, (g, w, h) => {
      g.fillStyle = '#e2b82b';
      g.fillRect(0, 0, w, h);
      g.strokeStyle = '#1c1b18';
      g.lineWidth = 10;
      g.strokeRect(10, 10, w - 20, h - 20);
      const cx = w / 2;
      const cy = h * 0.44;
      g.fillStyle = '#1c1b18';
      for (let k = 0; k < 3; k++) {
        const a0 = -Math.PI / 2 + k * ((Math.PI * 2) / 3) - Math.PI / 6;
        g.beginPath();
        g.arc(cx, cy, 62, a0, a0 + Math.PI / 3);
        g.arc(cx, cy, 22, a0 + Math.PI / 3, a0, true);
        g.closePath();
        g.fill();
      }
      g.beginPath();
      g.arc(cx, cy, 13, 0, Math.PI * 2);
      g.fill();
      g.font = 'bold 24px sans-serif';
      g.textAlign = 'center';
      g.fillText('注意电离辐射', cx, h * 0.84);
    });
  }

  function mesh() {
    return get('wire_mesh', 128, 128, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      g.strokeStyle = 'rgba(215, 240, 248, 0.72)';
      g.lineWidth = 3;
      for (let i = 0; i <= w; i += 16) {
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

  function dispose() {
    cache.forEach((tex) => tex.dispose());
    cache.clear();
  }

  return {
    get,
    concrete,
    tiles,
    wood,
    hazard,
    sign,
    grass,
    lava,
    radiation,
    mesh,
    dispose,
  };
}
