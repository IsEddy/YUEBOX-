# -*- coding: utf-8 -*-
"""广东省博物馆 藏品/虚拟展览 抓取器
- 列表: http://www.gdmuseum.org.cn/cn/col49/list[_N]   (235 页, 16 条/页)
- 详情: http://www.gdmuseum.org.cn/cn/col49/<id>
- 虚拟展览: http://www.gdmuseum.org.cn/cn/col67/list[_N] (55 条, 7 页)
缓存落盘 -> 断点续抓。
"""
import os, re, sys, time, json, random, threading, codecs
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE = 'http://www.gdmuseum.org.cn'
HDRS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9',
    'Connection': 'close',
    'Referer': BASE + '/col49/list',
}
HERE = os.path.dirname(os.path.abspath(__file__))
LISTS = os.path.join(HERE, 'lists')
DET = os.path.join(HERE, 'detail')
for d in (LISTS, DET):
    os.makedirs(d, exist_ok=True)

_lock = threading.Lock()
_last = [0.0]
MIN_GAP = 0.5          # 全局请求最小间隔(秒) - 礼貌
MAX_TRY = 3            # 1 次 + 2 次重试


def _decode(resp):
    """UTF-8 优先，失败退 GBK/GB18030/BIG5。"""
    raw = resp.content
    try:
        return raw.decode('utf-8')
    except Exception:
        pass
    for enc in ('gb18030', 'gbk', 'big5', 'latin-1'):
        try:
            return raw.decode(enc, 'replace')
        except Exception:
            continue
    return raw.decode('utf-8', 'replace')


def polite():
    with _lock:
        dt = time.time() - _last[0]
        if dt < MIN_GAP:
            time.sleep(MIN_GAP - dt)
        _last[0] = time.time()


def fetch(url):
    """带礼貌间隔与最多 2 次重试；返回 text 或 None。"""
    for attempt in range(MAX_TRY):
        polite()
        try:
            r = requests.get(url, headers=HDRS, timeout=25)
            if r.status_code == 200:
                return _decode(r)
            if r.status_code == 404:
                return None
        except Exception:
            pass
        time.sleep(1.5 + attempt)
    return None


# ---------- 列表页 ----------
def list_url(col, page):
    if page == 1:
        return f'{BASE}/cn/{col}/list'
    return f'{BASE}/cn/{col}/list_{page}'


def probe_pages(col, first_html, items_per_page=None):
    """从第一页 Pages 块读出总页数；读不到就靠 total/page-size 估。"""
    pages = [int(x) for x in re.findall(r'list_(\d+)', first_html)]
    total = re.search(r"p_total'>\s*共有<b>(\d+)</b>", first_html)
    per = items_per_page or len(parse_items(first_html))
    if pages:
        mx = max(pages)
        if total and per:
            est = -(-int(total.group(1)) // per)
            # 页码里最大的一般就是末页；若明显偏小则用估算
            return max(mx, est) if est > mx else mx
        return mx
    if total and per:
        return -(-int(total.group(1)) // per)
    return 1


ITEM_RE = re.compile(r'<li class="li">(.*?)</li>', re.S)


def parse_items(html):
    """解析列表项：名称/年代/类型/详情/缩略图。"""
    body = html
    i = body.find('qui-mark-list')
    j = body.find("class='Pages'")
    if i > 0:
        body = body[i:j if j > 0 else len(body)]
    out = []
    for m in ITEM_RE.finditer(body):
        it = m.group(1)
        a = re.search(r'<a href="([^"]+)"', it)
        if not a:
            continue
        href = a.group(1).strip()
        if not re.search(r'/col\d+/\d+', href):
            continue
        img = re.search(r'<img[^>]+src="([^"]+)"', it)
        name = re.search(r'<span class="qui-col-99">名称：</span><span>(.*?)</span>', it, re.S)
        if not name:
            name = re.search(r'<span class="qui-col-99">名\s*称[：:]</span><span>(.*?)</span>', it, re.S)
        dyn = re.search(r'<span class="qui-col-99">年\s*代[：:]</span><span>(.*?)</span>', it, re.S)
        typ = re.search(r'<span class="qui-col-99">类\s*型[：:]</span><span>(.*?)</span>', it, re.S)
        txt = re.search(r'<div (?:class=")?divtt[^>]*>(.*?)</div>', it, re.S)
        out.append({
            'href': href,
            'img': (img.group(1) if img else ''),
            'name': clean(name.group(1) if name else (txt.group(1) if txt else '')),
            'dynasty': clean(dyn.group(1) if dyn else ''),
            'category': clean(typ.group(1) if typ else ''),
        })
    return out


def clean(s):
    s = s or ''
    # 先剥 HTML 注释（否则 "-->" 之后会混进 JS 源码）
    s = re.sub(r'<!--.*?-->', ' ', s, flags=re.S)
    s = re.sub(r'<script.*?</script>', ' ', s, flags=re.S)
    s = re.sub(r'<style.*?</style>', ' ', s, flags=re.S)
    s = re.sub(r'<[^>]+>', '', s)
    s = (s.replace('&nbsp;', ' ').replace('&amp;', '&').replace('&#39;', "'")
         .replace('&quot;', '"').replace('&lt;', '<').replace('&gt;', '>'))
    s = re.sub(r'\s+', ' ', s).strip()
    # 去掉残留的字段标签与注释尾巴，例如 "来源 --" / "--> var ..."
    s = re.sub(r'\s*(名称|年代|类型|质地|尺寸|来源)\s*[：:].*$', '', s) if re.search(r'(名称|年代|类型|质地|尺寸|来源)\s*[：:]', s) else s
    s = re.sub(r'\s*-{2,}\s*.*$', '', s)
    s = re.sub(r'\s*var\s+[A-Za-z_].*$', '', s)
    return s.strip()


# ---------- 详情页 ----------
FIELD_RE = {
    'name': r'name="infoName">(.*?)</span>',
    'dynasty': r'name="infoAge">(.*?)</span>',
    'category': r'name="infoType">(.*?)</span>',
    'material': r'name="infoTexture">(.*?)</span>',
    'size': r'name="infoSizes">(.*?)</span>',
    'source': r'name="infoAuthor">(.*?)</span>',
}


def parse_detail(html):
    d = {}
    for k, pat in FIELD_RE.items():
        m = re.search(pat, html, re.S)
        d[k] = clean(m.group(1)) if m else ''
    # 图片：article 内主图 -> slick-box 大图 -> 全页 upload 图
    art = html[html.find('<article>'):html.find('</article>')] if '<article>' in html else ''
    art_imgs = re.findall(r'<img[^>]+src="(/upload/[^"]+)"', art)
    fancy = re.findall(r'<a href="(/upload/[^"]+)" class="fany"', html)
    allimgs = []
    for u in art_imgs + fancy:
        if u not in allimgs:
            allimgs.append(u)
    d['img'] = allimgs[0] if allimgs else ''
    d['imgs'] = allimgs[:8]
    # 正文描述：article 之后 / 上一篇 之前的富文本（多数藏品页无正文）
    body = ''
    i = html.find('</article>')
    j = html.find('上一篇')
    if i > 0 and j > i:
        seg = html[i:j]
        seg = re.sub(r'<script.*?</script>', '', seg, flags=re.S)
        seg = re.sub(r'<style.*?</style>', '', seg, flags=re.S)
        seg = re.sub(r'<div class="tushang".*?</div>', '', seg, flags=re.S)
        body = clean(seg)
    if not body:
        m = re.search(r'<div class="qui-single">(.*?)</div>', html, re.S)
        if m:
            body = clean(re.sub(r'<script.*?</script>', '', m.group(1), flags=re.S))
    d['desc'] = body
    # 发布日期
    m = re.search(r'<span class="span">(\d{4})年(\d{2})月(\d{2})日</span>', html)
    d['publishedAt'] = f'{m.group(1)}-{m.group(2)}-{m.group(3)}' if m else ''
    # 上一篇/下一篇（同栏目顺序，可用于校验）
    nxt = re.search(r'下一篇：.*?<a[^>]*href="([^"]+)"', html, re.S)
    d['nextUrl'] = nxt.group(1) if nxt else ''
    return d


def detail_path(cid):
    return os.path.join(DET, cid + '.html')


def get_detail(cid, force=False):
    p = detail_path(cid)
    if not force and os.path.exists(p) and os.path.getsize(p) > 2000:
        return open(p, 'rb').read().decode('utf-8', 'replace')
    html = fetch(f'{BASE}/cn/col49/{cid}')
    if html is None:
        return None
    with open(p, 'w', encoding='utf-8') as f:
        f.write(html)
    return html


# ---------- 虚拟展览 col67 ----------
def parse_virtual(html):
    i = html.find('qui-activity')
    j = html.find("class='Pages'")
    body = html[i:j if j > 0 else len(html)]
    out = []
    for m in ITEM_RE.finditer(body):
        it = m.group(1)
        a = re.search(r'<a href="([^"]+)"', it)
        if not a:
            continue
        title = re.search(r'<div[^>]*divtt qui-dot">(.*?)</div>', it, re.S)
        if not title:
            title = re.search(r'<div class="divtt[^"]*">(.*?)</div>', it, re.S)
        img = re.search(r'<img[^>]+src="([^"]+)"', it)
        out.append({
            'name': clean(title.group(1)) if title else clean(it)[:80],
            'url': a.group(1).strip(),
            'img': img.group(1) if img else '',
        })
    return out


# ---------- 主流程 ----------
def crawl_lists(col='col49', limit=None):
    html1 = fetch(list_url(col, 1))
    if not html1:
        raise SystemExit('第一页抓取失败')
    open(os.path.join(LISTS, f'{col}_1.html'), 'w', encoding='utf-8').write(html1)
    total_pages = probe_pages(col, html1)
    print(f'[list] {col} 共 {total_pages} 页', flush=True)
    items = parse_items(html1)
    if limit:
        total_pages = min(total_pages, limit)
    for pg in range(2, total_pages + 1):
        cache = os.path.join(LISTS, f'{col}_{pg}.html')
        if os.path.exists(cache) and os.path.getsize(cache) > 2000:
            html = open(cache, 'rb').read().decode('utf-8', 'replace')
        else:
            html = fetch(list_url(col, pg))
            if not html:
                print(f'[list] page {pg} FAILED', flush=True)
                continue
            open(cache, 'w', encoding='utf-8').write(html)
        got = parse_items(html)
        if not got:
            print(f'[list] page {pg} empty -> stop', flush=True)
            break
        items += got
        if pg % 20 == 0:
            print(f'[list] p{pg}/{total_pages} items={len(items)}', flush=True)
    # 去重
    seen, uniq = set(), []
    for it in items:
        cid = re.search(r'/(\d+)$', it['href']).group(1)
        if cid in seen:
            continue
        seen.add(cid)
        it['id'] = cid
        uniq.append(it)
    print(f'[list] {col} 去重后 {len(uniq)} 条', flush=True)
    return uniq


def crawl_details(ids, workers=4):
    done = {f[:-5] for f in os.listdir(DET) if f.endswith('.html')}
    todo = [i for i in ids if i not in done]
    print(f'[detail] 已有 {len(done)} 缓存, 待抓 {len(todo)}', flush=True)
    results, fails = {}, []
    with ThreadPoolExecutor(max_workers=workers) as ex:
        futs = {ex.submit(get_detail, cid): cid for cid in todo}
        for n, f in enumerate(as_completed(futs), 1):
            cid = futs[f]
            try:
                html = f.result()
            except Exception:
                html = None
            if html:
                results[cid] = parse_detail(html)
            else:
                fails.append(cid)
            if n % 100 == 0:
                print(f'[detail] {n}/{len(todo)} ok={len(results)} fail={len(fails)}', flush=True)
    # 补上缓存里已有的
    for cid in ids:
        if cid in results:
            continue
        p = detail_path(cid)
        if cid in done and os.path.exists(p):
            results[cid] = parse_detail(open(p, 'rb').read().decode('utf-8', 'replace'))
    print(f'[detail] 完成 {len(results)}, 失败 {len(fails)}', flush=True)
    if fails:
        with open(os.path.join(HERE, 'fails.txt'), 'w', encoding='utf-8') as f:
            f.write('\n'.join(fails))
    return results


def crawl_virtual():
    col = 'col67'
    html1 = fetch(list_url(col, 1))
    if not html1:
        return []
    open(os.path.join(LISTS, f'{col}_1.html'), 'w', encoding='utf-8').write(html1)
    total_pages = probe_pages(col, html1)
    print(f'[virtual] {total_pages} 页', flush=True)
    items = parse_virtual(html1)
    for pg in range(2, total_pages + 1):
        cache = os.path.join(LISTS, f'{col}_{pg}.html')
        if os.path.exists(cache) and os.path.getsize(cache) > 2000:
            html = open(cache, 'rb').read().decode('utf-8', 'replace')
        else:
            html = fetch(list_url(col, pg))
            if not html:
                continue
            open(cache, 'w', encoding='utf-8').write(html)
        items += parse_virtual(html)
        print(f'[virtual] p{pg} -> {len(items)}', flush=True)
    return items


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else 'all'
    limit = int(sys.argv[2]) if len(sys.argv) > 2 else None
    workers = int(sys.argv[3]) if len(sys.argv) > 3 else 4
    t0 = time.time()
    if mode in ('all', 'list'):
        relics = crawl_lists('col49', limit)
        det = crawl_details([r['id'] for r in relics], workers)
        merged = []
        for r in relics:
            d = det.get(r['id'], {})
            merged.append({
                'id': r['id'],
                'name': d.get('name') or r['name'],
                'dynasty': d.get('dynasty') or r['dynasty'],
                'size': d.get('size', ''),
                'material': d.get('material', ''),
                'category': d.get('category') or r['category'],
                'desc': d.get('desc', ''),
                'imgUrl': (BASE + (d.get('img') or r['img'])) if (d.get('img') or r['img']) else '',
                'detailUrl': BASE + r['href'],
                'publishedAt': d.get('publishedAt', ''),
            })
        json.dump(merged, open(os.path.join(HERE, 'relics_raw.json'), 'w', encoding='utf-8'),
                  ensure_ascii=False, indent=1)
        print(f'[save] relics_raw.json {len(merged)} 条, 耗时 {time.time()-t0:.0f}s', flush=True)
    if mode in ('all', 'virtual'):
        v = crawl_virtual()
        json.dump(v, open(os.path.join(HERE, 'virtual_raw.json'), 'w', encoding='utf-8'),
                  ensure_ascii=False, indent=1)
        print(f'[save] virtual_raw.json {len(v)} 条', flush=True)


if __name__ == '__main__':
    main()
