/* YUEBOX · 返回逻辑
   一律优先 history.back()，回到用户真正来过的上一页；
   只有没有历史记录（直接打开这一页）时才回退到兜底地址。 */

(function () {
  'use strict';

  function bindBack() {
    const nodes = document.querySelectorAll('[data-back]');
    nodes.forEach(function (el) {
      // 兜底地址从 href 上取，元素自己声明想去哪
      const fallback = el.getAttribute('href') || 'collection.html';

      el.addEventListener('click', function (e) {
        // 有历史才拦；否则放行让 href 生效
        if (window.history.length > 1 && document.referrer !== '') {
          e.preventDefault();
          window.history.back();
        } else if (window.history.length > 2) {
          // referrer 为空但可能有历史（同源跳转）
          e.preventDefault();
          window.history.back();
        } else {
          // 没有历史，走兜底
          e.preventDefault();
          location.href = fallback;
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindBack);
  } else {
    bindBack();
  }

  window.YBX_BACK = { bind: bindBack };
})();
