# -*- coding: utf-8 -*-
"""补抓漏掉的列表页（主流程被限流跳过的那几页），然后再合并。"""
import os, re, sys, json
import gdm_crawl as g

HERE = os.path.dirname(os.path.abspath(__file__))


def missing_pages(col='col49', total=235):
    have = set()
    for f in os.listdir(g.LISTS):
        m = re.match(rf'{col}_(\d+)\.html', f)
        if m:
            have.add(int(m.group(1)))
    return [p for p in range(1, total + 1) if p not in have]


def backfill(col='col49', total=235, rounds=3):
    for r in range(rounds):
        miss = missing_pages(col, total)
        if not miss:
            print(f'[{col}] 无缺页', flush=True)
            return True
        print(f'[{col}] 第 {r+1} 轮补抓 {len(miss)} 页: {miss}', flush=True)
        for p in miss:
            # 失败页重试更保守：拉长间隔
            g.MIN_GAP = 1.5
            html = g.fetch(g.list_url(col, p))
            if html and len(html) > 1500:
                open(os.path.join(g.LISTS, f'{col}_{p}.html'), 'w', encoding='utf-8').write(html)
                print(f'  ok {p}', flush=True)
            else:
                print(f'  FAIL {p}', flush=True)
    return not missing_pages(col, total)


if __name__ == '__main__':
    col = sys.argv[1] if len(sys.argv) > 1 else 'col49'
    total = int(sys.argv[2]) if len(sys.argv) > 2 else 235
    ok = backfill(col, total)
    print('补抓结果:', '完整' if ok else '仍有缺页 %s' % missing_pages(col, total), flush=True)
