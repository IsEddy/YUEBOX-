# -*- coding: utf-8 -*-
"""计算 WCAG 对比度，验证 01 文档 §5.3 的全部数值"""
def srgb_to_lin(c):
    c = c/255.0
    return c/12.92 if c <= 0.04045 else ((c+0.055)/1.055)**2.4

def hex_rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i+2],16) for i in (0,2,4))

def lum(h):
    r,g,b = [srgb_to_lin(x) for x in hex_rgb(h)]
    return 0.2126*r + 0.7152*g + 0.0722*b

def ratio(fg, bg):
    l1, l2 = lum(fg), lum(bg)
    if l1 < l2: l1, l2 = l2, l1
    return (l1+0.05)/(l2+0.05)

def blend(fg, bg, alpha):
    """fg 以 alpha 叠加到 bg 上"""
    f = hex_rgb(fg); b = hex_rgb(bg)
    out = tuple(round(f[i]*alpha + b[i]*(1-alpha)) for i in range(3))
    return '#%02X%02X%02X' % out

# 主色板
P = {
 'ink-900':'#14110F','ink-700':'#2A2622','ink-500':'#3A3530',
 'red-600':'#B4362B','red-500':'#D2553F','red-800':'#7E2118',
 'gold-500':'#C9A227','gold-300':'#E4C97E','gold-700':'#8A6C1C',
 'silk-100':'#FBF7EF','silk-200':'#F5EFE3','silk-400':'#E6DAC4',
}

print("="*62)
print("A. 文档已声明组合 —— 复算验证")
print("="*62)
checks = [
 ('silk-200 on ink-900','#F5EFE3','#14110F', None),
 ('ink-700 on silk-100','#2A2622','#FBF7EF', None),
 ('gold-500 on ink-900','#C9A227','#14110F', None),
 ('gold-500 on silk-100','#C9A227','#FBF7EF', '应禁止'),
 ('FFFFFF on red-600','#FFFFFF','#B4362B', None),
 ('red-600 on silk-200','#B4362B','#F5EFE3', None),
]
for name,fg,bg,note in checks:
    r = ratio(fg,bg)
    verdict = 'PASS' if r>=4.5 else ('大字/图形' if r>=3 else 'FAIL')
    print(f"  {name:28s} {r:5.2f}:1  {verdict:10s} {note or ''}")

print()
print("="*62)
print("B. 白色透明度安全线（叠加到 ink-900）")
print("="*62)
for a in [0.70,0.65,0.60,0.55,0.50,0.45,0.40,0.35]:
    comp = blend('#FFFFFF','#14110F',a)
    r = ratio(comp,'#14110F')
    mark = 'OK' if r>=4.5 else ('仅大字' if r>=3 else 'FAIL')
    print(f"  白 {int(a*100):2d}%  -> {comp}  {r:5.2f}:1  {mark}")

print()
print("="*62)
print("C. 金线透明度安全线（叠加到 ink-900）")
print("="*62)
for a in [1.00,0.85,0.80,0.75,0.70,0.65,0.60]:
    comp = blend('#C9A227','#14110F',a)
    r = ratio(comp,'#14110F')
    mark = 'OK' if r>=4.5 else ('仅大字' if r>=3 else 'FAIL')
    print(f"  金 {int(a*100):3d}% -> {comp}  {r:5.2f}:1  {mark}")

print()
print("="*62)
print("D. 语义色在深底/浅底")
print("="*62)
sem = {
 '成功 #4E7A5E':'#4E7A5E',
 '提示 #C9A227':'#C9A227',
 '警示 #C4553F':'#C4553F',
 '错误 #A63A2E':'#A63A2E',
 '禁用 #6E665C':'#6E665C',
}
for name,c in sem.items():
    rd = ratio(c,'#14110F'); rl = ratio(c,'#FBF7EF')
    print(f"  {name:14s} 深底 {rd:5.2f}:1  浅底 {rl:5.2f}:1")

print()
print("="*62)
print("E. 辅色（内容区标签）")
print("="*62)
acc = {
 '青花 #2B5C7E':'#2B5C7E',
 '石湾绿 #4E7A5E':'#4E7A5E',
 '端紫 #6B4C5A':'#6B4C5A',
 '通草黄 #DDB877':'#DDB877',
}
for name,c in acc.items():
    rd = ratio(c,'#14110F'); rl = ratio(c,'#FBF7EF')
    print(f"  {name:16s} 深底 {rd:5.2f}:1  浅底 {rl:5.2f}:1")

print()
print("="*62)
print("F. 浅底金色替代（gold-700）")
print("="*62)
for name,fg,bg in [('gold-700 on silk-100','#8A6C1C','#FBF7EF'),
                   ('gold-700 on silk-200','#8A6C1C','#F5EFE3'),
                   ('silk-400 on silk-100','#E6DAC4','#FBF7EF'),
                   ('ink-500 on silk-100','#3A3530','#FBF7EF')]:
    r=ratio(fg,bg)
    print(f"  {name:26s} {r:5.2f}:1  {'OK' if r>=4.5 else ('仅大字' if r>=3 else 'FAIL')}")
