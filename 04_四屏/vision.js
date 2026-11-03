/* YUEBOX · 真实识别引擎 v2
   把文物图与拍摄帧都转成「色彩 + 结构」双重指纹：
   - 结构：32x32 灰度，按块比较（1024 位 dHash）
   - 色彩：4x4 区域的平均色（48 维，归一化后比距离）
   两路加权，纯前端，无需 API。 */

(function () {
  'use strict';

  const DH_W = 33;   // dHash 宽 33 -> 每行 32 个比较
  const DH_H = 32;   // 32 行 => 1024 bit
  const COLOR_N = 4; // 4x4 色彩网格

  function makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }

  /** 结构指纹：1024 bit dHash */
  function structHash(source) {
    const c = makeCanvas(DH_W, DH_H);
    const ctx = c.getContext('2d');
    ctx.drawImage(source, 0, 0, DH_W, DH_H);
    const px = ctx.getImageData(0, 0, DH_W, DH_H).data;
    const gray = new Float32Array(DH_W * DH_H);
    for (let i = 0, p = 0; i < gray.length; i++, p += 4) {
      gray[i] = 0.299 * px[p] + 0.587 * px[p + 1] + 0.114 * px[p + 2];
    }
    let bits = '';
    for (let y = 0; y < DH_H; y++) {
      for (let x = 0; x < DH_W - 1; x++) {
        bits += gray[y * DH_W + x] > gray[y * DH_W + x + 1] ? '1' : '0';
      }
    }
    return bits;
  }

  /** 色彩指纹：4x4 网格平均色，返回 Float32Array(48) */
  function colorSig(source) {
    const c = makeCanvas(COLOR_N, COLOR_N);
    const ctx = c.getContext('2d');
    ctx.drawImage(source, 0, 0, COLOR_N, COLOR_N);
    const px = ctx.getImageData(0, 0, COLOR_N, COLOR_N).data;
    const out = new Float32Array(COLOR_N * COLOR_N * 3);
    for (let i = 0, p = 0; i < COLOR_N * COLOR_N; i++, p += 4) {
      out[i * 3] = px[p] / 255;
      out[i * 3 + 1] = px[p + 1] / 255;
      out[i * 3 + 2] = px[p + 2] / 255;
    }
    return out;
  }

  function hamming(a, b) {
    if (a.length !== b.length) return 1e9;
    let d = 0;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++;
    return d;
  }

  function colorDist(a, b) {
    let s = 0;
    for (let i = 0; i < a.length; i++) {
      const d = a[i] - b[i];
      s += d * d;
    }
    return Math.sqrt(s / a.length);   // 0 ~ 1.73
  }

  function loadImage(url, crossOrigin) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      if (crossOrigin) img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('load fail'));
      img.src = url;
    });
  }

  /** 单张图 -> 特征对象 */
  function describe(source) {
    return { s: structHash(source), c: colorSig(source) };
  }

  /**
   * 建索引
   * items: [{id, name, img}]
   */
  async function buildIndex(items, onProgress) {
    const out = [];
    let done = 0;
    for (const it of items) {
      if (!it.img) { done++; continue; }
      try {
        const img = await loadImage(it.img, true);
        const f = describe(img);
        out.push({ id: it.id, name: it.name, img: it.img, s: f.s, c: f.c });
      } catch (e) { /* 跳过加载失败的 */ }
      done++;
      if (onProgress && done % 20 === 0) onProgress(done, items.length);
    }
    if (onProgress) onProgress(done, items.length);
    return out;
  }

  /**
   * 在索引里比对
   * 结构距离权重更高（1024 bit 下 0~1024），色彩距离 0~1.73
   */
  function match(index, source, opts) {
    if (!index.length) return null;
    const t = describe(source);
    const o = opts || {};
    let best = null;
    for (const it of index) {
      const hd = hamming(t.s, it.s);              // 0 ~ 1024
      const cd = colorDist(t.c, it.c);           // 0 ~ 1.73
      // 归一化后加权：结构 0.75，色彩 0.25
      const score = (hd / 1024) * 0.75 + (cd / 1.732) * 0.25;
      if (!best || score < best.score) {
        best = { item: it, score: score, hd: hd, cd: cd };
      }
    }
    if (!best) return null;

    // 置信度：score 越低越像
    const s = best.score;
    let conf;
    if (s <= 0.14) conf = 0.94;
    else if (s <= 0.20) conf = 0.84;
    else if (s <= 0.28) conf = 0.68;
    else if (s <= 0.36) conf = 0.46;
    else conf = 0;

    return {
      item: { id: best.item.id, name: best.item.name, img: best.item.img },
      confidence: conf,
      distance: best.hd,
      colorDist: best.cd,
      score: s,
      matched: conf >= (o.threshold || 0.6)
    };
  }

  window.YBX_VISION = {
    describe, buildIndex, match, loadImage,
    hamming, colorDist
  };
})();
