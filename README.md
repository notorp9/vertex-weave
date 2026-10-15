# Vertex Weave(プロトタイプ)

素粒子ファインマン図カードゲーム「Tutti Quantum」(EPFL+ECAL Lab / Helvetiq)に着想を得た、標準模型の弱い相互作用を含むブラウザゲームです。得点やルールは原作とは異なり、得点は仮の値です。

## ビルド

```bash
python3 build.py   # index.html を生成
```

`index.html` をブラウザで開けば遊べます(外部ライブラリなし)。

## 構成

- `src/logic.js` ルール・得点・CPU
- `src/ui.js` 画面と操作
- `src/template.html` CSS と画面の骨組み
- `docs/summary.md` 開発まとめ
