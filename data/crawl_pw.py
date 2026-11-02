# -*- coding: utf-8 -*-
"""广东省博物馆藏品抓取 · Playwright 版
用真实浏览器指纹绕过反爬，逐页抓取并解析。
"""
import re, json, time, os, sys
from playwright.sync_api import sync_playwright

BASE = 'https://www.gdmuseum.org.cn'
TOTAL_PAGES = 235

def clean(h):
    s = re.sub(r'<[^>]+>', ' ', h)
    s = s.replace('&nbsp;', ' ').replace('&amp;', '&')
    return re.sub(r'\s+', ' ', s).strip()

def parse_list(html):
    out = []
    for m in re.finditer(r'href="(/cn/col49/(\d+))"(.*?)</a>', html, re.S):
        href, rid, body = m.group(1), m.group(2), m.group(3)
        txt = clean(body)
        txt = re.sub(r'class="[^"]*"', '', txt).replace('-->', '').strip()
        if not txt: continue
        nm = re.search(r'名称[：:]\s*(.+?)(?=\s*年代|\s*类型|$)', txt)
        dy = re.search(r'年代[：:]\s*(.+?)(?=\s*类型|$)', txt)
        ct = re.search(r'类型[：:]\s*(.+)$', txt)
        out.append({
            'srcId': rid,
            'name': nm.group(1).strip() if nm else txt[:40],
            'dynasty': dy.group(1).strip() if dy else '',
            'category': ct.group(1).strip() if ct else '',
            'detailUrl': BASE + href
        })
    return out

def page_url(n):
    return f'{BASE}/cn/col49/list' + ('' if n == 1 else f'_{n}')

def main():
    start = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    end = int(sys.argv[2]) if len(sys.argv) > 2 else TOTAL_PAGES
    seen = {}
    # 已抓结果可续跑
    cache = 'H:/XCX/data/_list_cache.json'
    if os.path.exists(cache):
        seen = json.load(open(cache, encoding='utf-8'))
        print(f'续跑：已有 {len(seen)} 条', flush=True)

    with sync_playwright() as pw:
        b = pw.chromium.launch()
        ctx = b.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
                       '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            locale='zh-CN', viewport={'width': 1440, 'height': 900})
        page = ctx.new_page()

        for n in range(start, end + 1):
            url = page_url(n)
            try:
                page.goto(url, wait_until='domcontentloaded', timeout=25000)
            except Exception:
                time.sleep(1.5)
                try: page.goto(url, wait_until='domcontentloaded', timeout=25000)
                except Exception: continue
            html = page.content()
            items = parse_list(html)
            for it in items:
                seen.setdefault(it['srcId'], it)
            if n % 20 == 0 or n <= 3 or len(items) == 0:
                print(f'  第 {n:3d} 页: {len(items):2d} 条, 累计 {len(seen)}', flush=True)
            time.sleep(0.35)

        # 详情（前 400 件）
        ids = sorted(seen.keys(), key=lambda x: -int(x))
        LIMIT = min(len(ids), 400)
        relics = []
        print(f'\n详情抓取：{LIMIT} 件', flush=True)
        for i, rid in enumerate(ids):
            it = seen[rid]
            rec = {'id': 'gm' + rid, 'srcId': rid, 'name': it['name'],
                   'dynasty': it['dynasty'], 'category': it['category'],
                   'size': '', 'material': '', 'desc': '', 'imgUrl': '',
                   'detailUrl': it['detailUrl']}
            if i < LIMIT:
                try:
                    page.goto(it['detailUrl'], wait_until='domcontentloaded', timeout=20000)
                    h = page.content()
                    t = clean(h)
                    m = re.search(r'尺寸[：:]\s*(.+?)(?=\s*质地|\s*描述|\s*库别|$)', t)
                    if m: rec['size'] = m.group(1).strip()[:80]
                    m = re.search(r'质地[：:]\s*(.+?)(?=\s*描述|\s*库别|$)', t)
                    if m: rec['material'] = m.group(1).strip()[:40]
                    m = re.search(r'描述[：:]\s*(.+?)(?=\s*[库类]别|$)', t)
                    if m: rec['desc'] = m.group(1).strip()[:300]
                    imgs = [u for u in re.findall(r'(?:src|data-src)="([^"]+)"', h)
                            if ('upload' in u or '/image/' in u) and 'logo' not in u.lower()]
                    if imgs:
                        u = imgs[0]
                        rec['imgUrl'] = u if u.startswith('http') else BASE + u
                except Exception:
                    pass
            relics.append(rec)
            if (i + 1) % 50 == 0:
                print(f'  {i+1}/{len(ids)}: {rec["name"][:24]}', flush=True)
            time.sleep(0.2)

        b.close()

    os.makedirs('H:/XCX/data', exist_ok=True)
    json.dump(seen, open(cache, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    out = {'source': BASE, 'crawledAt': time.strftime('%Y-%m-%dT%H:%M:%S+08:00'),
           'total': len(relics), 'detailDepth': LIMIT, 'relics': relics}
    json.dump(out, open('H:/XCX/data/gdmuseum-relics.json', 'w', encoding='utf-8'),
              ensure_ascii=False, indent=1)
    print(f'\n完成：{len(relics)} 件')

if __name__ == '__main__':
    main()
