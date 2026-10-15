(function () {
'use strict';
const $ = (s, r) => (r || document).querySelector(s);
const L = 88; // 辺の長さ(SVG単位)
const T_LABEL = 0.32, T_ARROW = 0.68; // 線上の位置: 名前の丸 / 矢印(頂点バッジと重ならないよう分ける)
const lerp = (pa, pb, t) => ({ x: pa.x + (pb.x - pa.x) * t, y: pa.y + (pb.y - pa.y) * t });

/* ---------- 粒子の見た目 ---------- */
function colorClass(p) {
  if (p.kind === 'f') return p.type === 'quark' ? 'c-quark' : p.type === 'lepton' ? 'c-lepton' : 'c-nu';
  return { 'γ': 'c-gamma', g: 'c-gluon', W: 'c-W', Z: 'c-Z', H: 'c-H' }[p.kind];
}
const CHARGE_TXT = q => q === 0 ? '0' : (q % 3 === 0 ? (q > 0 ? '+' : '−') + Math.abs(q / 3) : (q > 0 ? '+' : '−') + Math.abs(q) + '/3');
function infoLines(p) {
  const out = [];
  if (p.kind === 'f') {
    out.push('スピン 1/2 / 電荷 ' + CHARGE_TXT(p.Q) + ' / 質量 ' + p.mass + ' / 第' + p.gen + '世代');
    if (p.type === 'quark') out.push('結合できる相手: 光子・グルーオン・Z・ヒッグス・W(' + (p.up ? 'ダウン型' : 'アップ型') + 'クォークへ変化)');
    if (p.type === 'lepton') out.push('結合できる相手: 光子・Z・ヒッグス・W(同じ世代のニュートリノへ変化)。グルーオンとは結合しません。');
    if (p.type === 'nu') out.push('結合できる相手: Z と W(荷電レプトンへ変化)だけ。光子・グルーオン・ヒッグスとは結合しません。');
    out.push('矢印は粒子の流れ。同じ線で向きを逆にすると反粒子として読めます。');
  } else {
    const t = {
      'γ': '電磁力を運ぶ。電荷を持つフェルミオンとW、ヒッグス(ループ経由)と結合。',
      g: '強い力を運ぶ。クォークと、グルーオン同士(ggg)で結合。',
      W: '荷電カレントを運ぶ。電荷が±1。矢印は負電荷の流れ。γ・Z・ヒッグスとも結合。',
      Z: '中性カレントを運ぶ。すべてのフェルミオンと結合。WW・ヒッグスとも結合。',
      H: 'ヒッグス場の励起。質量を持つ粒子と結合し、質量が小さいほど結合は弱く、稀。'
    }[p.kind];
    out.push('スピン ' + p.spin + ' / 電荷 ' + (p.kind === 'W' ? '±1' : '0') + ' / 質量 ' + p.mass);
    out.push(t);
  }
  return out;
}

/* ---------- 線の描画 ---------- */
function wavyPath(x1, y1, x2, y2, amp, waves) {
  const dx = x2 - x1, dy = y2 - y1, d = Math.hypot(dx, dy), ux = dx / d, uy = dy / d, nx = -uy, ny = ux;
  const pts = []; const N = 48;
  for (let i = 0; i <= N; i++) {
    const t = i / N, a = amp * Math.sin(2 * Math.PI * waves * t);
    pts.push((x1 + ux * d * t + nx * a).toFixed(1) + ',' + (y1 + uy * d * t + ny * a).toFixed(1));
  }
  return 'M' + pts.join(' L');
}
function coilPath(x1, y1, x2, y2, R, k) {
  const dx = x2 - x1, dy = y2 - y1, d = Math.hypot(dx, dy), ux = dx / d, uy = dy / d, nx = -uy, ny = ux;
  const pts = []; const N = 90;
  for (let i = 0; i <= N; i++) {
    const s = i / N, th = 2 * Math.PI * k * s;
    const along = s * d - R * 0.9 * Math.sin(th), side = R * (1 - Math.cos(th)) / 2 - R * 0.0;
    pts.push((x1 + ux * along + nx * (side - R / 2 * Math.sin(Math.PI * s))).toFixed(1) + ',' + (y1 + uy * along + ny * (side - R / 2 * Math.sin(Math.PI * s))).toFixed(1));
  }
  return 'M' + pts.join(' L');
}
function lineSvg(p, x1, y1, x2, y2, dir, extraCls) {
  const cls = colorClass(p) + ' ' + (extraCls || '');
  let d, style = '';
  if (p.kind === 'f') d = 'M' + x1 + ',' + y1 + ' L' + x2 + ',' + y2;
  else if (p.kind === 'γ') d = wavyPath(x1, y1, x2, y2, 4.5, 5);
  else if (p.kind === 'W' || p.kind === 'Z') d = wavyPath(x1, y1, x2, y2, 6, 4);
  else if (p.kind === 'g') d = coilPath(x1, y1, x2, y2, 11, 5);
  else d = 'M' + x1 + ',' + y1 + ' L' + x2 + ',' + y2; // H
  if (p.kind === 'H') style = ' stroke-dasharray="7 6"';
  let s = '<path class="ln ' + cls + '" d="' + d + '"' + style + '/>';
  if (TQ.isDirected(p)) {
    const t = T_ARROW, ax = x1 + (x2 - x1) * t, ay = y1 + (y2 - y1) * t;
    let ang = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI; if (dir === -1) ang += 180;
    s += '<path class="ar ' + cls + '" transform="translate(' + ax.toFixed(1) + ',' + ay.toFixed(1) + ') rotate(' + ang.toFixed(1) + ')" d="M10,0 L-7,-9 L-7,9 Z"/>';
  }
  return s;
}
function bubble(p, x, y, extra) {
  const w = p.sym.length > 1 ? 15 : 13;
  return '<g class="bub ' + colorClass(p) + (extra ? ' ' + extra : '') + '"><circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + w + '"/>' +
    '<text x="' + x.toFixed(1) + '" y="' + (y + 4.5).toFixed(1) + '" text-anchor="middle">' + p.sym + '</text></g>';
}

/* ---------- 状態 ---------- */
const ui = { game: null, view: 0, sel: null, edge: null, dir: 1, node: null, busy: false, setup: { mode: 'basic', players: 2, diff: 'normal', quartic: false } };

/* ---------- 画面切り替え ---------- */
function show(id) { ['setup', 'game'].forEach(x => { $('#' + x).hidden = x !== id; }); }

/* ---------- セットアップ ---------- */
function renderSetup() {
  const s = ui.setup;
  const seg = (name, opts, cur) => '<div class="seg" role="group" data-seg="' + name + '">' + opts.map(o =>
    '<button type="button" class="' + (String(cur) === String(o[0]) ? 'on' : '') + '" data-v="' + o[0] + '">' + o[1] + '</button>').join('') + '</div>';
  $('#setup-body').innerHTML =
    '<div class="field"><div class="lab">モード</div>' + seg('mode', [['basic', '入門(第1世代)'], ['full', 'フル(3世代・全結合)']], s.mode) +
    '<p class="hint">' + TQ.MODES[s.mode].desc + '</p></div>' +
    '<div class="field"><div class="lab">頂点の種類</div>' + seg('quartic', [['0', '3点結合のみ'], ['1', '3点+4点結合']], s.quartic ? '1' : '0') +
    '<p class="hint">' + (s.quartic ? '1つの頂点に最大4本の線を集められ、WWWW・WWγγ・HHZZ・HHHH などの4点結合が作れます。線は3本の頂点では120°、4本の頂点では90°ずつ開いて描かれます。ループは正方形(4枚)と六角形(6枚)の両方がボーナスになります。' : '蜂の巣格子で遊びます。1つの頂点には3本の線が集まります。') + '</p></div>' +
    '<div class="field"><div class="lab">遊ぶ人数</div>' + seg('players', [[1, 'ソロ'], [2, 'CPU 1人'], [3, 'CPU 2人'], [4, 'CPU 3人']], s.players === 1 ? 1 : s.players === 2 ? 2 : s.players === 3 ? 3 : 4) +
    '<p class="hint">' + (s.players === 1 ? '3枚のうち1枚を選び、残りは捨てます(全12ラウンド)。' : '場に並んだカードから1枚ずつ選び、自分の図に貼っていきます。') + '</p></div>' +
    (s.players > 1 ? '<div class="field"><div class="lab">CPUの強さ</div>' + seg('diff', [['easy', 'やさしい'], ['normal', 'ふつう'], ['hard', 'つよい']], s.diff) + '</div>' : '');
}

function startGame() {
  const s = ui.setup;
  const players = [{ name: 'あなた', human: true }];
  for (let i = 1; i < s.players; i++) players.push({ name: 'CPU' + i, human: false, diff: s.diff });
  ui.game = TQ.newGame({ mode: s.mode, players, quartic: s.quartic });
  ui.view = 0; ui.sel = null; ui.edge = null; ui.dir = 1; ui.node = null; ui.busy = false;
  show('game'); $('#over').hidden = true;
  render();
  setMsg('場のカードを1枚選んでください。');
  nextTurn();
}

/* ---------- 進行 ---------- */
function curIsHuman() {
  const g = ui.game; if (g.phase === 'over') return false;
  return g.players[TQ.currentPlayer(g)].human;
}
function nextTurn() {
  const g = ui.game;
  if (g.phase === 'over') { finish(); return; }
  const pi = TQ.currentPlayer(g);
  if (g.players[pi].human) {
    ui.busy = false; ui.view = pi; ui.edge = null;
    if (g.phase === 'secret') { ui.sel = 'secret'; setMsg('最後に、配りの時に引いた「秘密カード」を図に貼ります。'); }
    else ui.sel = null;
    render(); return;
  }
  ui.busy = true; render();
  setTimeout(() => {
    const mv = TQ.cpuMove(g);
    const name = g.players[pi].name;
    let r;
    if (g.phase === 'secret') r = TQ.applySecret(g, mv.edge, mv.dir);
    else r = TQ.applyPick(g, mv.index, mv.edge, mv.dir);
    setMsg(name + ' が ' + r.p.jp + ' を貼りました。');
    nextTurn();
  }, 650);
}
function confirmMove() {
  const g = ui.game; if (!curIsHuman() || !ui.edge || ui.sel == null) return;
  let r;
  if (g.phase === 'secret') r = TQ.applySecret(g, ui.edge, ui.dir);
  else r = TQ.applyPick(g, ui.sel, ui.edge, ui.dir);
  setMsg(r.p.jp + ' を貼りました。');
  ui.sel = null; ui.edge = null; ui.node = null; ui.dir = 1;
  nextTurn();
}

/* ---------- 描画 ---------- */
function setMsg(t) { $('#msg').textContent = t; }

function selectedParticle() {
  const g = ui.game; if (ui.sel == null) return null;
  if (g.phase === 'secret') return g.players[TQ.currentPlayer(g)].secret;
  return g.market[ui.sel] || null;
}

function render() {
  const g = ui.game; if (!g) return;
  renderBar(); renderMarket(); renderBoard(); renderInfo(); renderControls();
}

function renderBar() {
  const g = ui.game;
  const cur = TQ.currentPlayer(g);
  $('#round').textContent = g.phase === 'pick' ? ('ラウンド ' + g.round + ' / ' + g.R) : g.phase === 'secret' ? '最終配置' : '終了';
  $('#deck').textContent = '山札 ' + g.deck.length;
  $('#chips').innerHTML = g.players.map((p, i) => {
    const e = TQ.evaluate(p.cards, g.mode, g.phase === 'over', g.quartic);
    return '<button class="chip' + (i === ui.view ? ' view' : '') + (i === cur ? ' turn' : '') + '" data-view="' + i + '"><span class="nm">' + p.name + '</span><span class="sc">' + e.total + '</span><span class="ct">' + p.cards.length + '枚</span></button>';
  }).join('');
}

function cardHtml(p, idx, selected, disabled) {
  return '<button class="pc ' + colorClass(p) + (selected ? ' sel' : '') + '" data-idx="' + idx + '"' + (disabled ? ' disabled' : '') + '>' +
    '<span class="sym">' + p.sym + '</span><span class="jp">' + p.jp + '</span></button>';
}
function renderMarket() {
  const g = ui.game, box = $('#market');
  if (g.phase === 'secret') {
    const pl = g.players[TQ.currentPlayer(g)];
    box.innerHTML = pl && pl.human ? '<div class="mlab">秘密カード</div>' + cardHtml(pl.secret, 'secret', true, false) : '<div class="mlab">秘密カードを配置中…</div>';
    return;
  }
  if (g.phase === 'over') { box.innerHTML = ''; return; }
  const my = curIsHuman();
  box.innerHTML = '<div class="mlab">場のカード</div>' + g.market.map((p, i) => cardHtml(p, i, my && ui.sel === i, !my)).join('');
}

function renderBoard() {
  const g = ui.game, svg = $('#board');
  const pl = g.players[ui.view];
  const cards = pl.cards;
  const my = curIsHuman() && ui.view === TQ.currentPlayer(g);
  const ev = TQ.evaluate(cards, g.mode, g.phase === 'over', g.quartic);
  const cand = my && ui.sel != null ? TQ.candidateEdges(cards, g.quartic) : [];
  const G = TQ.geometry(cards, g.quartic, L);
  const pc = my && ui.edge && selectedParticle() ? G.cand(ui.edge) : null; // 貼る前のプレビュー位置
  const P = k => G.P(k) || (pc && k === pc.newKey ? pc.pn : null);

  // 表示範囲
  const pts = [];
  cards.forEach(c => { pts.push(P(c.a), P(c.b)); });
  cand.forEach(e => { const c = G.cand(e); pts.push(c.pa, c.pb); });
  if (!pts.length) pts.push({ x: 0, y: 0 }, { x: L, y: 0 });
  let x0 = Math.min(...pts.map(p => p.x)), x1 = Math.max(...pts.map(p => p.x));
  let y0 = Math.min(...pts.map(p => p.y)), y1 = Math.max(...pts.map(p => p.y));
  const pad = L * 0.9;
  let w = x1 - x0 + pad * 2, h = y1 - y0 + pad * 2;
  const minW = L * 5.5, minH = L * 4;
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  w = Math.max(w, minW); h = Math.max(h, minH);
  const ar = svg.clientWidth && svg.clientHeight ? svg.clientWidth / svg.clientHeight : 1.4;
  if (w / h < ar) w = h * ar; else h = w / ar;
  svg.setAttribute('viewBox', (cx - w / 2).toFixed(1) + ' ' + (cy - h / 2).toFixed(1) + ' ' + w.toFixed(1) + ' ' + h.toFixed(1));

  let s = '';
  // ループの淡い塗り
  ev.loops.forEach(r => { s += '<polygon class="loop" points="' + r.map(n => { const p = P(n); return p.x.toFixed(1) + ',' + p.y.toFixed(1); }).join(' ') + '"/>'; });

  // 候補辺
  cand.forEach(e => {
    const c = G.cand(e), pa = c.pa, pb = c.pb;
    const on = ui.edge === e;
    s += '<g class="cand' + (on ? ' on' : '') + '" data-edge="' + e + '"><line x1="' + pa.x.toFixed(1) + '" y1="' + pa.y.toFixed(1) + '" x2="' + pb.x.toFixed(1) + '" y2="' + pb.y.toFixed(1) + '"/>' +
      '<circle cx="' + ((pa.x + pb.x) / 2).toFixed(1) + '" cy="' + ((pa.y + pb.y) / 2).toFixed(1) + '" r="9"/>' +
      '<line class="hit" x1="' + pa.x.toFixed(1) + '" y1="' + pa.y.toFixed(1) + '" x2="' + pb.x.toFixed(1) + '" y2="' + pb.y.toFixed(1) + '"/></g>';
  });

  // 貼ったカード
  cards.forEach(c => {
    const pa = P(c.a), pb = P(c.b);
    s += '<g class="card" data-cid="' + c.id + '">' + lineSvg(c.p, pa.x, pa.y, pb.x, pb.y, c.dir) + bubble(c.p, lerp(pa, pb, T_LABEL).x, lerp(pa, pb, T_LABEL).y) + '</g>';
  });

  // プレビュー
  const sp = selectedParticle();
  if (pc) {
    const pa = pc.pa, pb = pc.pb;
    s += '<g class="ghost">' + lineSvg(sp, pa.x, pa.y, pb.x, pb.y, ui.dir) + bubble(sp, lerp(pa, pb, T_LABEL).x, lerp(pa, pb, T_LABEL).y) + '</g>';
  }

  // ノードの状態
  let pcards = cards;
  if (my && ui.edge && sp) pcards = cards.concat([{ id: -1, p: sp, a: TQ.splitEdge(ui.edge)[0], b: TQ.splitEdge(ui.edge)[1], dir: ui.dir }]);
  const pev = pcards === cards ? ev : TQ.evaluate(pcards, g.mode, false, g.quartic);
  pev.info.forEach((v, n) => {
    const p = P(n);
    if (v.status === 'single') { s += '<circle class="nd" cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="3"/>'; return; }
    let cls = 'badge ', txt = '';
    if (v.status === 'valid') { cls += 'ok'; txt = '+' + v.pts; }
    else if (v.status === 'invalid') { cls += 'ng'; txt = '×'; }
    else if (v.status === 'open') { cls += 'op'; txt = '…'; }
    else { cls += 'dead'; txt = '!'; }
    s += '<g class="' + cls + (ui.node === n ? ' pick' : '') + '" data-node="' + n + '"><circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="' + (v.status === 'valid' ? 11 : 9) + '"/><text x="' + p.x.toFixed(1) + '" y="' + (p.y + 4).toFixed(1) + '" text-anchor="middle">' + txt + '</text></g>';
  });
  svg.innerHTML = s;
  $('#viewname').textContent = pl.name + ' の図';
}

function renderInfo() {
  const g = ui.game, box = $('#info');
  const sp = selectedParticle();
  let h = '';
  if (ui.node) {
    const ev = TQ.evaluate(g.players[ui.view].cards, g.mode, g.phase === 'over', g.quartic);
    const v = ev.info.get(ui.node);
    if (v) {
      h += '<div class="ih">この頂点</div><p>' + v.ends.map(e => e.p.sym + (e.io === 1 ? '(入)' : e.io === -1 ? '(出)' : '')).join(' ・ ') + '</p>';
      if (v.status === 'valid') h += '<p class="good">有効:' + TQ.TAG_LABEL[v.tag] + '(+' + v.pts + '点)' + (v.ckm ? ' |V|=' + v.ckm : '') + '</p>';
      else if (v.status === 'invalid') h += '<p class="bad">無効(−1点):' + v.why + '</p>';
      else if (v.status === 'open') h += '<p>' + (v.ends.length === 3 ? '3点結合としては無効ですが、あと1本足すと4点結合として有効になります。' : '未完成ですが、あと' + (g.quartic ? '1〜2' : '1') + '本で有効な頂点にできます。') + '</p>';
      else if (v.status === 'dead') h += '<p class="bad">未完成で、どの粒子を足しても有効になりません。終了時に−1点です。</p>';
    }
  } else if (sp) {
    h += '<div class="ih">' + sp.jp + '(' + sp.en + ')</div>' + infoLines(sp).map(t => '<p>' + t + '</p>').join('');
  } else {
    h += '<p class="muted">頂点の ✓ 数字・× ・… ・! をタップすると、その頂点の判定理由が見られます。</p>';
  }
  box.innerHTML = h;
}

function renderControls() {
  const g = ui.game, my = curIsHuman();
  const sp = selectedParticle();
  const flip = $('#flip'), ok = $('#ok');
  flip.hidden = !(my && sp && TQ.isDirected(sp) && ui.edge);
  $('#hint').hidden = !(my && sp);
  ok.disabled = !(my && ui.edge && sp);
  ok.textContent = g.phase === 'secret' ? '秘密カードを貼る' : 'ここに貼る';
  $('#controls').hidden = !my;
}

function finish() {
  const g = ui.game;
  render();
  const res = g.players.map((p, i) => ({ i, p, e: TQ.evaluate(p.cards, g.mode, true, g.quartic) })).sort((a, b) => b.e.total - a.e.total);
  const best = res[0].e.total;
  let h = '<h2>' + (g.np === 1 ? 'ゲーム終了' : (res[0].p.human ? 'あなたの勝ちです' : res[0].p.name + ' の勝ち')) + '</h2>';
  h += '<div class="rank">' + res.map((r, k) => {
    const e = r.e;
    const ms = e.missions.map(id => TQ.MISSIONS.find(m => m.id === id).name);
    return '<button class="rrow' + (r.e.total === best ? ' top' : '') + '" data-view="' + r.i + '"><span class="rn">' + r.p.name + '</span><span class="rs">' + e.total + '点</span>' +
      '<span class="rd">有効 ' + e.validCount + '(' + e.vpts + '点) / 無効 ' + (e.invalid + e.badInc) + ' / ループ ' + e.loops.length + '(+' + e.loopPts + ') / ミッション ' + e.missions.length + '(+' + e.missionPts + ')</span>' +
      (ms.length ? '<span class="rm">' + ms.join('、') + '</span>' : '') + '</button>';
  }).join('') + '</div>';
  h += '<div class="row"><button id="again" class="btn main">もう一度遊ぶ</button><button id="closeover" class="btn">図を見る</button></div>';
  $('#over').innerHTML = h; $('#over').hidden = false;
}

/* ---------- ルール・図鑑 ---------- */
function renderGuide() {
  const T = TQ.TAG_LABEL;
  const rows = [
    ['γ + f f̄', T['ffγ'], '2', '同じフェルミオンの線が続き、電荷を持つこと'],
    ['g + q q̄', T['ffg'], '2', 'クォークだけ'],
    ['Z + f f̄', T['ffZ'], '2(ν は 3)', 'ニュートリノを含む全フェルミオン'],
    ['W + ℓ ν', T['ffW'], '3', '同じ世代の荷電レプトンとニュートリノ'],
    ['W + q q′', T['ffW'], '3〜6', 'アップ型とダウン型。CKM行列の |V| が小さい組ほど高得点'],
    ['H + f f̄', T['ffH'], '2〜5', 'ν 以外。質量が小さい粒子ほど結合が弱く高得点'],
    ['g g g', T['ggg'], '3', ''],
    ['W W γ / W W Z', T['WWγ'], '4', '2本のWの矢印は逆向き'],
    ['H W W / H Z Z', T['HWW'], '5', ''],
    ['H H H', T['HHH'], '6', ''],
    ['H γ γ / H Z γ', 'ループ結合', '6', '粒子の循環を1つの頂点として扱う'],
    ['H g g', 'ループ結合', '5', '']
  ];
  const rows4 = [
    ['g g g g', T['gggg'], '4', ''],
    ['W W W W', T['WWWW'], '6', 'Wの矢印は2本が入り、2本が出る'],
    ['W W γ γ / W W γ Z / W W Z Z', 'ゲージ4点結合', '6', '2本のWの矢印は逆向き'],
    ['H H W W / H H Z Z', 'ヒッグス–ゲージ4点結合', '6', ''],
    ['H H H H', T['HHHH'], '7', '']
  ];
  const ckmRows = ['u', 'c', 't'].map(u => '<tr><th>' + u + '</th>' + ['d', 's', 'b'].map(d => '<td>' + TQ.CKM_VAL[u + d] + '<br><b>' + TQ.CKM_PTS[u + d] + '点</b></td>').join('') + '</tr>').join('');
  const part = TQ.PARTICLES.map(p => '<tr><td><span class="mini ' + colorClass(p) + '">' + p.sym + '</span></td><td>' + p.jp + '</td><td>' + (p.kind === 'W' ? '±1' : CHARGE_TXT(p.Q)) + '</td><td>' + p.mass + '</td></tr>').join('');
  $('#guide-body').innerHTML =
    '<h3>遊び方</h3><ol>' +
    '<li>場のカードから1枚選び、自分の図に貼ります。図は蜂の巣状の格子で、カード1枚が1本の線です。最初の1枚以外は、すでに貼ったカードにつなげます。</li>' +
    '<li>3本の線が集まる点が「頂点」です。標準模型に存在する結合なら有効で得点、存在しない結合なら−1点。</li>' +
    '<li>電子・クォーク・ニュートリノ・Wには矢印があります。フェルミオンの線は頂点で「入る1本・出る1本」になるように向きを選びます。</li>' +
    '<li>最後に秘密カードを貼り、合計点で競います。</li></ol>' +
    '<h3>得点になる頂点</h3><div class="tw"><table><thead><tr><th>頂点</th><th>名前</th><th>点</th><th>条件</th></tr></thead><tbody>' +
    rows.map(r => '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td><td>' + r[2] + '</td><td>' + r[3] + '</td></tr>').join('') + '</tbody></table></div>' +
    '<h3>4点結合(「3点+4点結合」モード)</h3><div class="tw"><table><thead><tr><th>頂点</th><th>名前</th><th>点</th><th>条件</th></tr></thead><tbody>' +
    rows4.map(r => '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td><td>' + r[2] + '</td><td>' + r[3] + '</td></tr>').join('') + '</tbody></table></div>' +
    '<p class="note">4点モードでは、線の本数に応じて頂点の角度が変わって見えます(3本以下は120°、4本は90°)。標準模型にはフェルミオンを含む4点結合がないので、電子やクォークの線が3本以上集まる頂点は無効です。3本が集まった時点で3点結合として無効でも、あと1本で4点結合になるなら「…」(未完成)になります。</p>' +
    '<p class="note">2本だけの未完成の頂点は、あと1本(4点モードでは最大2本)で有効にできるなら0点(…)、どの粒子を足しても有効にならないなら終了時に−1点(!)です。</p>' +
    '<h3>ボーナス</h3><ul><li><b>ループ</b>:閉じた最小の輪(3点モードは六角形6枚。4点モードは正方形4枚と六角形6枚。六角形の中央に線を足して正方形2つにした形は、正方形として数えます)で、すべての頂点が有効(または完成可能)なら1つにつき +2点。</li>' +
    TQ.MISSIONS.map(m => '<li><b>' + m.name + '</b>(+' + m.bonus + '点):' + m.desc + '</li>').join('') + '</ul>' +
    '<h3>CKM行列(Wが世代をまたぐ強さ)</h3><div class="tw"><table class="ckm"><thead><tr><th></th><th>d</th><th>s</th><th>b</th></tr></thead><tbody>' + ckmRows + '</tbody></table></div>' +
    '<h3>粒子一覧</h3><div class="tw"><table><thead><tr><th></th><th>名前</th><th>電荷</th><th>質量</th></tr></thead><tbody>' + part + '</tbody></table></div>' +
    '<h3>このゲームで省いているもの</h3><p class="note">4点結合は「3点+4点結合」モードだけで扱います(フェルミオンを含む4点結合は標準模型の基本結合にありません)。ニュートリノ質量と振動、CP対称性の破れ、色荷の細かい流れ、時間順序は扱いません。ヒッグスのループ結合(γγ・Zγ・gg)は、1つの頂点にまとめた近似です。</p>' +
    '<p class="note">素粒子ファインマン図カードゲーム「Tutti Quantum」(EPFL+ECAL Lab / Helvetiq)に着想を得た非公式の個人用プロトタイプです。得点やルールは原作とは異なります。</p>';
}

/* ---------- イベント ---------- */
function bind() {
  document.addEventListener('click', ev => {
    const t = ev.target;
    const seg = t.closest('.seg button');
    if (seg) {
      const name = seg.parentNode.dataset.seg, v = seg.dataset.v;
      if (name === 'mode') ui.setup.mode = v; else if (name === 'players') ui.setup.players = +v; else if (name === 'quartic') ui.setup.quartic = v === '1'; else ui.setup.diff = v;
      renderSetup(); return;
    }
    if (t.closest('#start')) { startGame(); return; }
    if (t.closest('#guide-open')) { renderGuide(); $('#guide').hidden = false; $('#guide-body').scrollTop = 0; return; }
    if (t.closest('#guide-close') || t.id === 'guide') { $('#guide').hidden = true; return; }
    if (t.closest('#new')) { if (!ui.game || ui.game.phase === 'over' || confirm('いまのゲームをやめて、設定画面に戻りますか?')) { show('setup'); renderSetup(); } return; }
    if (t.closest('#again')) { show('setup'); renderSetup(); return; }
    if (t.closest('#closeover')) { $('#over').hidden = true; return; }
    const rr = t.closest('.rrow'); if (rr) { ui.view = +rr.dataset.view; $('#over').hidden = true; render(); return; }
    if (!ui.game) return;
    const chip = t.closest('.chip');
    if (chip) { ui.view = +chip.dataset.view; ui.node = null; render(); return; }
    const pc = t.closest('.pc');
    if (pc && curIsHuman()) {
      const g = ui.game;
      ui.sel = pc.dataset.idx === 'secret' ? 'secret' : +pc.dataset.idx; ui.edge = null; ui.node = null; ui.dir = 1;
      ui.view = TQ.currentPlayer(g);
      render();
      setMsg('光っている辺をタップして、貼る場所を選んでください。');
      return;
    }
    const cand = t.closest('.cand');
    if (cand) { ui.edge = cand.dataset.edge; ui.node = null; render(); setMsg(TQ.isDirected(selectedParticle()) ? '矢印の向きを確認し、「ここに貼る」を押してください。' : '「ここに貼る」を押してください。'); return; }
    const nd = t.closest('[data-node]');
    if (nd) { ui.node = ui.node === nd.dataset.node ? null : nd.dataset.node; renderInfo(); renderBoard(); return; }
    if (t.closest('#hint')) {
      const sp = selectedParticle(); if (!sp || !curIsHuman()) return;
      const g = ui.game, pl = g.players[TQ.currentPlayer(g)];
      const b = TQ.bestPlacement(pl.cards, sp, g.mode, 0, g.rnd, g.phase === 'secret', g.quartic);
      if (b) { ui.edge = b.edge; ui.dir = b.dir; ui.node = null; render(); setMsg('この位置がいちばん得点が伸びます。「ここに貼る」で確定できます。'); }
      return;
    }
    if (t.closest('#flip')) { ui.dir = -ui.dir; render(); return; }
    if (t.closest('#ok')) { confirmMove(); return; }
  });
  document.addEventListener('keydown', ev => { if (ev.key === 'Escape') $('#guide').hidden = true; });
  window.addEventListener('resize', () => { if (ui.game) renderBoard(); });
}

window.__tq = { ui };
document.addEventListener('DOMContentLoaded', () => { bind(); renderSetup(); show('setup'); });
})();
