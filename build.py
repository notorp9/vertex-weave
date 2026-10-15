"""src/ の template.html・logic.js・ui.js を1つのHTMLにまとめる。出力: index.html(GitHub Pages がルートから配信)"""
from pathlib import Path

root = Path(__file__).resolve().parent
src = root / 'src'
read = lambda name: (src / name).read_text(encoding='utf-8')

logic, ui = read('logic.js'), read('ui.js')
assert '</script>' not in logic and '</script>' not in ui

html = read('template.html').replace('/*LOGIC*/', logic).replace('/*UI*/', ui)
out = root / 'index.html'
out.write_text(html, encoding='utf-8')
print(out, len(html))
