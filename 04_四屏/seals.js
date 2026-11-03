/* YUEBOX · 藏印数据层
   把用户收藏的藏品存在本机（localStorage），可跨页面、跨会话保留。
   同时记录「盖印时间」，用于印盒里按时间排序和显示。

   数据结构：
   {
     "176939": { id, n, d, c, t, at }    // at = 收藏时间戳
   }
*/

(function () {
  'use strict';

  const KEY = 'yuebox.seals.v1';

  function readAll() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return {};
      const obj = JSON.parse(raw);
      return (obj && typeof obj === 'object') ? obj : {};
    } catch (e) {
      return {};
    }
  }

  function writeAll(obj) {
    try {
      localStorage.setItem(KEY, JSON.stringify(obj));
      return true;
    } catch (e) {
      return false;   // 隐私模式/配额满
    }
  }

  /** 是否已收藏 */
  function has(id) {
    return !!readAll()[String(id)];
  }

  /** 加收藏 */
  function add(item) {
    if (!item || !item.id) return false;
    const all = readAll();
    all[String(item.id)] = {
      id: String(item.id),
      n: item.n || '',
      d: item.d || '',
      c: item.c || '',
      t: item.t || '',
      i: item.i || '',
      at: Date.now()
    };
    return writeAll(all);
  }

  /** 取消收藏 */
  function remove(id) {
    const all = readAll();
    if (all[String(id)]) {
      delete all[String(id)];
      return writeAll(all);
    }
    return false;
  }

  /** 切换，返回新状态 */
  function toggle(item) {
    if (has(item.id)) {
      remove(item.id);
      return false;
    }
    add(item);
    return true;
  }

  /** 全部收藏，按时间倒序 */
  function list() {
    const all = readAll();
    return Object.keys(all)
      .map(function (k) { return all[k]; })
      .sort(function (a, b) { return (b.at || 0) - (a.at || 0); });
  }

  function count() {
    return Object.keys(readAll()).length;
  }

  function clear() {
    return writeAll({});
  }

  window.YBX_SEAL = { has, add, remove, toggle, list, count, clear, KEY };
})();
