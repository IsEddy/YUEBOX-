/* YUEBOX · 识别引擎 v3（预计算指纹版）
   指纹在构建期用 Python 算好（32x32 dHash 压缩成 256 位 hex + 4x4 色彩），
   前端直接读，不再逐张解码图片——索引构建从 ~40 秒降到毫秒级。
   只有「取当前帧算指纹」需要现场计算。 */

(function () {
  'use strict';

  const DH_W = 33, DH_H = 32, CN = 4;

  function makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }

  /** 现场：从 canvas/video/img 算结构指纹（返回 256 位 hex 字符串） */
  function structHex(source) {
    const c = makeCanvas(DH_W, DH_H);
    const ctx = c.getContext('2d');
    ctx.drawImage(source, 0, 0, DH_W, DH_H);
    const px = ctx.getImageData(0, 0, DH_W, DH_H).data;
    const gray = new Float32Array(DH_W * DH_H);
    for (let i = 0, p = 0; i < gray.length; i++, p += 4) {
      gray[i] = 0.299 * px[p] + 0.587 * px[p + 1] + 0.114 * px[p + 2];
    }
    let out = '';
    let nibble = 0, cnt = 0;
    for (let y = 0; y < DH_H; y++) {
      for (let x = 0; x < DH_W - 1; x++) {
        nibble = (nibble << 1) | (gray[y * DH_W + x] > gray[y * DH_W + x + 1] ? 1 : 0);
        if (++cnt === 4) { out += nibble.toString(16); nibble = 0; cnt = 0; }
      }
    }
    return out;   // 256 个 hex 字符
  }

  /** 现场：4x4 色彩签名 */
  function colorSig(source) {
    const c = makeCanvas(CN, CN);
    const ctx = c.getContext('2d');
    ctx.drawImage(source, 0, 0, CN, CN);
    const px = ctx.getImageData(0, 0, CN, CN).data;
    const out = new Float32Array(CN * CN * 3);
    for (let i = 0, p = 0; i < CN * CN; i++, p += 4) {
      out[i * 3] = Math.round((px[p] / 255) * 10) / 10;
      out[i * 3 + 1] = Math.round((px[p + 1] / 255) * 10) / 10;
      out[i * 3 + 2] = Math.round((px[p + 2] / 255) * 10) / 10;
    }
    return out;
  }

  /** 两个 hex 串的汉明距离（转成 bit 数） */
  function hexDistance(a, b) {
    if (!a || !b || a.length !== b.length) return 1e9;
    let d = 0;
    for (let i = 0; i < a.length; i++) {
      let x = parseInt(a[i], 16) ^ parseInt(b[i], 16);
      // popcount
      d += (x & 1) + ((x >> 1) & 1) + ((x >> 2) & 1) + ((x >> 3) & 1);
    }
    return d;
  }

  function colorDist(a, b) {
    let s = 0;
    for (let i = 0; i < a.length; i++) {
      const d = a[i] - b[i];
      s += d * d;
    }
    return Math.sqrt(s / a.length);
  }

  function loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('load fail'));
      img.src = url;
    });
  }

  /**
   * 用预计算指纹建索引（同步、毫秒级）
   * @param {Array} fpList [{id,n,d,c,x,k,t}]  YBX_FP
   */
  function buildIndexFast(fpList) {
    return fpList.map(it => ({
      id: it.id, name: it.n, img: it.t,
      dyn: it.d, cat: it.c, x: it.x, k: it.k
    }));
  }

  /**
   * 比对：现场帧 vs 预计算索引
   */
  function match(index, source, opts) {
    if (!index.length) return null;
    const x = structHex(source);
    const k = colorSig(source);
    const o = opts || {};
    let best = null;
    for (const it of index) {
      const hd = hexDistance(x, it.x);          // 0 ~ 1024
      const cd = colorDist(k, it.k);            // 0 ~ 1.73
      const score = (hd / 1024) * 0.75 + (cd / 1.732) * 0.25;
      if (!best || score < best.score) best = { item: it, score, hd, cd };
    }
    if (!best) return null;
    const s = best.score;
    let conf;
    if (s <= 0.10) conf = 0.95;
    else if (s <= 0.16) conf = 0.86;
    else if (s <= 0.24) conf = 0.72;
    else if (s <= 0.32) conf = 0.52;
    else conf = 0;
    return {
      item: best.item, confidence: conf, distance: best.hd,
      colorDist: best.cd, score: s,
      matched: conf >= (o.threshold || 0.6)
    };
  }

  window.YBX_VISION = { structHex, colorSig, hexDistance, colorDist, buildIndexFast, match, loadImage };
})();
