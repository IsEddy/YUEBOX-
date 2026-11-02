/* YUEBOX · 转场控制器
   卡片 → 详情：View Transitions 优先，降级 FLIP。 */

(function () {
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const VT_KEY = 'ybx:flip';

  /* ---------- 记录卡片图片位置（供 FLIP 降级） ---------- */
  function rememberFlip(img, targetName) {
    if (!img) return;
    const r = img.getBoundingClientRect();
    sessionStorage.setItem(VT_KEY, JSON.stringify({
      x: r.left, y: r.top, w: r.width, h: r.height, src: img.currentSrc || img.src, target: targetName
    }));
  }

  /* ---------- 从卡片跳到详情 ---------- */
  function goDetail(id, cardEl) {
    const img = cardEl ? cardEl.querySelector('img') : null;
    const url = 'detail.html?id=' + encodeURIComponent(id);

    if (!REDUCED && document.startViewTransition) {
      document.documentElement.classList.add('vt-relic');
      rememberFlip(img, 'relic-image');
      document.startViewTransition(() => { location.href = url; });
    } else {
      rememberFlip(img, 'relic-image');
      location.href = url;
    }
  }

  /* ---------- 详情页：FLIP 补间 ---------- */
  function playFlip() {
    const raw = sessionStorage.getItem(VT_KEY);
    if (!raw) return;
    sessionStorage.removeItem(VT_KEY);
    if (REDUCED) return;
    let rec;
    try { rec = JSON.parse(raw); } catch (e) { return; }
    const target = document.querySelector('.s3-figure .plate img');
    if (!target || !rec.w) return;

    const to = target.getBoundingClientRect();
    if (!to.width) return;

    const ghost = document.createElement('img');
    ghost.src = rec.src;
    ghost.className = 'flip-ghost';
    ghost.style.left = rec.x + 'px';
    ghost.style.top = rec.y + 'px';
    ghost.style.width = rec.w + 'px';
    ghost.style.height = rec.h + 'px';
    ghost.style.borderRadius = '2px';
    document.body.appendChild(ghost);
    target.style.opacity = '0';

    const sx = to.width / rec.w;
    const sy = to.height / rec.h;
    const dx = to.left - rec.x;
    const dy = to.top - rec.y;

    const anim = ghost.animate(
      [
        { transform: 'translate(0,0) scale(1,1)', opacity: 1 },
        { transform: `translate(${dx}px,${dy}px) scale(${sx},${sy})`, opacity: 1 }
      ],
      { duration: 420, easing: 'cubic-bezier(.22,.61,.36,1)', fill: 'forwards' }
    );
    anim.onfinish = () => {
      ghost.remove();
      target.style.opacity = '';
    };
  }

  /* ---------- 卡片点击代理 ---------- */
  document.addEventListener('click', (e) => {
    const card = e.target.closest('[data-relic]');
    if (!card) return;
    e.preventDefault();
    goDetail(card.dataset.relic, card);
  });

  /* ---------- 进入动画 stagger ---------- */
  function runEnter() {
    document.querySelectorAll('.enter').forEach((el, i) => {
      if (!el.style.getPropertyValue('--i')) el.style.setProperty('--i', i);
    });
  }

  /* ---------- 初始化 ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    runEnter();
    if (location.pathname.endsWith('detail.html')) {
      // 等图片加载完再补间
      const img = document.querySelector('.s3-figure .plate img');
      if (img) {
        if (img.complete) setTimeout(playFlip, 16);
        else img.addEventListener('load', () => setTimeout(playFlip, 16), { once: true });
      }
    }
    // 清理残留的 vt 类
    document.documentElement.classList.remove('vt-relic');
  });

  window.YBX = { goDetail, playFlip, REDUCED };
})();
