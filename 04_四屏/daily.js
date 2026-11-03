/* YUEBOX · 每日一件
   按日期从全馆藏品里稳定取一件（同一天全球一致、不需要联网）。
   规则：用 YYYYMMDD 做种子，从「有缩略图 + 有名有年代」的藏品里取。 */

(function () {
  'use strict';

  /** 简单的确定性伪随机：把日期字符串散列成 32 位整数 */
  function hashDate(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  /** 今天的日期键：YYYYMMDD（本地时区） */
  function todayKey(d) {
    const t = d || new Date();
    const y = t.getFullYear();
    const m = String(t.getMonth() + 1).padStart(2, '0');
    const day = String(t.getDate()).padStart(2, '0');
    return '' + y + m + day;
  }

  /**
   * 取「今日一件」
   * @param {Array} pool 候选池（要有 n 名称、t 缩略图路径）
   * @param {Date} date
   * @returns {object|null}
   */
  function pickDaily(pool, date) {
    const list = (pool || []).filter(function (x) {
      return x && x.n && x.n.length >= 3 && x.t;
    });
    if (!list.length) return null;
    const key = todayKey(date);
    const seed = hashDate(key);
    // 双散列降低碰撞，保证连续两天不重复
    const i = seed % list.length;
    const j = (seed >>> 8) % list.length;
    const idx = (i + j) % list.length;
    return list[idx];
  }

  /**
   * 取「今日三件」（横滑用）：在今日一件之后顺延取
   */
  function pickDailyN(pool, n, date) {
    const list = (pool || []).filter(function (x) {
      return x && x.n && x.n.length >= 3 && x.t;
    });
    if (!list.length) return [];
    const key = todayKey(date);
    const seed = hashDate(key);
    const out = [];
    for (let k = 0; k < n && k < list.length; k++) {
      const idx = (seed + k * 7919) % list.length;   // 7919 是质数，步长错开
      out.push(list[idx]);
    }
    return out;
  }

  window.YBX_DAILY = { pickDaily, pickDailyN, todayKey, hashDate };
})();
