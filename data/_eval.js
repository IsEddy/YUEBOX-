(async () => {
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  await sleep(1500);
  // 找"新对话"
  const items = [...document.querySelectorAll('*')].filter(el =>
    el.children.length === 0 && (el.innerText || '').trim() === '新对话');
  if (items.length) { items[0].click(); await sleep(1200); return JSON.stringify({ok:'clicked-new', items:items.length}); }
  return JSON.stringify({ok:'not-found', url: location.href});
})()