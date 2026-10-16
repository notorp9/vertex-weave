const TQ = (function () {
'use strict';

/* ------------------------------------------------------------------ */
/*  粒子データ                                                          */
/*  Q は電気素量 e の 1/3 を単位とした整数 (u=+2, d=-1, e=-3, ν=0)        */
/* ------------------------------------------------------------------ */
const FERMIONS = [
  { id:'u',  sym:'u',  jp:'アップクォーク',     en:'up',       type:'quark',  up:true,  gen:1, Q:2,  mass:'2.2 MeV' },
  { id:'d',  sym:'d',  jp:'ダウンクォーク',     en:'down',     type:'quark',  up:false, gen:1, Q:-1, mass:'4.7 MeV' },
  { id:'c',  sym:'c',  jp:'チャームクォーク',   en:'charm',    type:'quark',  up:true,  gen:2, Q:2,  mass:'1.27 GeV' },
  { id:'s',  sym:'s',  jp:'ストレンジクォーク', en:'strange',  type:'quark',  up:false, gen:2, Q:-1, mass:'93 MeV' },
  { id:'t',  sym:'t',  jp:'トップクォーク',     en:'top',      type:'quark',  up:true,  gen:3, Q:2,  mass:'172.6 GeV' },
  { id:'b',  sym:'b',  jp:'ボトムクォーク',     en:'bottom',   type:'quark',  up:false, gen:3, Q:-1, mass:'4.18 GeV' },
  { id:'e',  sym:'e',  jp:'電子',               en:'electron', type:'lepton', gen:1, Q:-3, mass:'0.511 MeV' },
  { id:'mu', sym:'μ',  jp:'ミューオン',         en:'muon',     type:'lepton', gen:2, Q:-3, mass:'105.7 MeV' },
  { id:'tau',sym:'τ',  jp:'タウ',               en:'tau',      type:'lepton', gen:3, Q:-3, mass:'1.777 GeV' },
  { id:'ve', sym:'νe', jp:'電子ニュートリノ',   en:'ν_e',      type:'nu',     gen:1, Q:0,  mass:'< 1 eV' },
  { id:'vm', sym:'νμ', jp:'ミューニュートリノ', en:'ν_μ',      type:'nu',     gen:2, Q:0,  mass:'< 1 eV' },
  { id:'vt', sym:'ντ', jp:'タウニュートリノ',   en:'ν_τ',      type:'nu',     gen:3, Q:0,  mass:'< 1 eV' }
].map(f => Object.assign({ kind:'f', spin:'1/2' }, f));

const BOSONS = [
  { id:'gamma', kind:'γ', sym:'γ', jp:'光子',           en:'photon', Q:0, mass:'0',        spin:'1' },
  { id:'gluon', kind:'g', sym:'g', jp:'グルーオン',     en:'gluon',  Q:0, mass:'0',        spin:'1' },
  { id:'W',     kind:'W', sym:'W', jp:'Wボソン',        en:'W',      Q:3, mass:'80.4 GeV', spin:'1' },
  { id:'Z',     kind:'Z', sym:'Z', jp:'Zボソン',        en:'Z',      Q:0, mass:'91.19 GeV',spin:'1' },
  { id:'H',     kind:'H', sym:'H', jp:'ヒッグス粒子',   en:'Higgs',  Q:0, mass:'125.2 GeV',spin:'0' }
];

const PARTICLES = FERMIONS.concat(BOSONS);
const BY_ID = {}; PARTICLES.forEach(p => { BY_ID[p.id] = p; });

const isDirected = p => p.kind === 'f' || p.kind === 'W';

/* ------------------------------------------------------------------ */
/*  モード                                                              */
/* ------------------------------------------------------------------ */
const MODES = {
  basic: {
    label: '入門(第1世代)',
    desc: 'u, d, e, νe とすべてのボソン。弱い相互作用まで体験できます。',
    fermions: ['u','d','e','ve'],
    deck: { fermion: 4, gamma: 7, gluon: 7, W: 8, Z: 6, H: 4 }
  },
  full: {
    label: 'フル(3世代・全結合)',
    desc: '6クォーク・3荷電レプトン・3ニュートリノ。CKM混合・湯川結合まで含みます。',
    fermions: ['u','d','c','s','t','b','e','mu','tau','ve','vm','vt'],
    deck: { fermion: 3, gamma: 6, gluon: 8, W: 9, Z: 7, H: 5 }
  }
};

function universe(modeKey) {
  const m = MODES[modeKey];
  return m.fermions.map(id => BY_ID[id]).concat(BOSONS);
}

const _endsCache = {};
function candidateEnds(modeKey) {
  if (_endsCache[modeKey]) return _endsCache[modeKey];
  const out = [];
  universe(modeKey).forEach(p => {
    if (isDirected(p)) { out.push({ p, io: 1 }); out.push({ p, io: -1 }); }
    else out.push({ p, io: 0 });
  });
  return (_endsCache[modeKey] = out);
}

/* ------------------------------------------------------------------ */
/*  頂点の規則と得点                                                    */
/* ------------------------------------------------------------------ */
// |V_ij| の大きさに応じた得点 (小さいほど稀なので高得点)
const CKM_PTS = { ud:3, us:4, ub:6, cd:4, cs:3, cb:5, td:6, ts:5, tb:3 };
const CKM_VAL = { ud:'0.974', us:'0.225', ub:'0.0037', cd:'0.221', cs:'0.975', cb:'0.041', td:'0.0086', ts:'0.040', tb:'1.0' };
// ヒッグスと各フェルミオンの結合 (質量に比例) — 弱く結合するほど稀 = 高得点
const YUKAWA_PTS = { t:2, b:3, tau:3, c:4, s:4, mu:4, d:5, u:5, e:5 };

const TAG_LABEL = {
  'ffγ': '電磁結合',
  'ffg': '強い相互作用',
  'ffZ': 'Z結合(中性カレント)',
  'ffW': 'W結合(荷電カレント)',
  'ffH': '湯川結合',
  'ggg': 'グルーオン自己結合',
  'WWγ': 'WWγ(ゲージ自己結合)',
  'WWZ': 'WWZ(ゲージ自己結合)',
  'HWW': 'ヒッグス–W結合',
  'HZZ': 'ヒッグス–Z結合',
  'HHH': 'ヒッグス3点自己結合',
  'gggg': 'グルーオン4点結合',
  'WWWW': 'WWWW(4点結合)',
  'WWγγ': 'WWγγ(4点結合)',
  'WWγZ': 'WWγZ(4点結合)',
  'WWZZ': 'WWZZ(4点結合)',
  'HHWW': 'HHWW(4点結合)',
  'HHZZ': 'HHZZ(4点結合)',
  'HHHH': 'ヒッグス4点自己結合'
};

function chargeIn(e) {
  if (e.p.kind === 'f') return e.io * e.p.Q;
  if (e.p.kind === 'W') return e.io * -3; // 矢印は負電荷の流れ
  return 0;
}

const BAD = (why) => ({ ok: false, pts: -1, tag: null, why });

function validateVertex(ends) {
  const kinds = ends.map(e => e.p.kind);
  const count = k => kinds.filter(x => x === k).length;
  const ferm = ends.filter(e => e.p.kind === 'f');
  const chargeSum = ends.reduce((s, e) => s + chargeIn(e), 0);

  if (ends.length === 4) {
    if (ferm.length) return BAD('標準模型には、フェルミオンを含む4点結合はありません。');
    if (chargeSum !== 0) return BAD('電荷が保存されていません。Wの矢印は2本が入り、2本が出る向きにします。');
    const g4 = count('g'), W4 = count('W'), Z4 = count('Z'), H4 = count('H'), A4 = count('γ');
    if (g4 === 4) return { ok: true, pts: 4, tag: 'gggg', why: '' };
    if (W4 === 4) return { ok: true, pts: 6, tag: 'WWWW', why: '' };
    if (W4 === 2 && A4 === 2) return { ok: true, pts: 6, tag: 'WWγγ', why: '' };
    if (W4 === 2 && A4 === 1 && Z4 === 1) return { ok: true, pts: 6, tag: 'WWγZ', why: '' };
    if (W4 === 2 && Z4 === 2) return { ok: true, pts: 6, tag: 'WWZZ', why: '' };
    if (W4 === 2 && H4 === 2) return { ok: true, pts: 6, tag: 'HHWW', why: '' };
    if (Z4 === 2 && H4 === 2) return { ok: true, pts: 6, tag: 'HHZZ', why: '' };
    if (H4 === 4) return { ok: true, pts: 7, tag: 'HHHH', why: '' };
    return BAD('標準模型に存在しない4点結合です。');
  }

  if (ferm.length === 2) {
    const [a, b] = ferm;
    if (a.io === b.io) return BAD('フェルミオンの矢印が頂点で連続していません(1本は入り、1本は出る必要があります)。');
    const x = ends.find(e => e.p.kind !== 'f');
    const k = x.p.kind;
    if (k === 'W') {
      if (chargeSum !== 0) return BAD('電荷が保存されていません。Wの矢印の向きを確認してください(負電荷が流れる向きを示します)。');
      const pa = a.p, pb = b.p;
      // レプトン: 同じ世代の 荷電レプトン + ニュートリノ
      if ((pa.type === 'lepton' && pb.type === 'nu') || (pa.type === 'nu' && pb.type === 'lepton')) {
        if (pa.gen !== pb.gen) return BAD('Wはレプトンの世代をまたげません(ℓ と同じ世代のνだけ)。');
        return { ok: true, pts: 3, tag: 'ffW', why: '' };
      }
      if (pa.type === 'quark' && pb.type === 'quark' && pa.up !== pb.up) {
        const up = pa.up ? pa : pb, dn = pa.up ? pb : pa;
        return { ok: true, pts: CKM_PTS[up.id + dn.id], tag: 'ffW', why: '', ckm: CKM_VAL[up.id + dn.id] };
      }
      return BAD('Wが結びつけるのは「荷電レプトンとν」か「アップ型とダウン型のクォーク」の組だけです。');
    }
    if (a.p.id !== b.p.id) return BAD('この粒子は種類(フレーバー)を変えません。同じフェルミオンの線が続く必要があります。');
    const f = a.p;
    if (k === 'γ') {
      if (f.Q === 0) return BAD('光子は電荷を持たないニュートリノには結合しません。');
      return { ok: true, pts: 2, tag: 'ffγ', why: '' };
    }
    if (k === 'g') {
      if (f.type !== 'quark') return BAD('グルーオンはクォークだけに結合します(色荷を持つのはクォークとグルーオン)。');
      return { ok: true, pts: 2, tag: 'ffg', why: '' };
    }
    if (k === 'Z') {
      return { ok: true, pts: f.type === 'nu' ? 3 : 2, tag: 'ffZ', why: '' };
    }
    if (k === 'H') {
      if (f.type === 'nu') return BAD('標準模型ではニュートリノはヒッグスと結合しません(質量が0の扱い)。');
      return { ok: true, pts: YUKAWA_PTS[f.id], tag: 'ffH', why: '' };
    }
    return BAD('標準模型に存在しない結合です。');
  }

  if (ferm.length !== 0) return BAD('標準模型に存在しない結合です。');

  if (chargeSum !== 0) return BAD('電荷が保存されていません。2本のWの矢印は逆向き(1本が入り1本が出る)にします。');
  const g = count('g'), W = count('W'), Z = count('Z'), H = count('H'), A = count('γ');
  if (g === 3) return { ok: true, pts: 3, tag: 'ggg', why: '' };
  if (W === 2 && A === 1) return { ok: true, pts: 4, tag: 'WWγ', why: '' };
  if (W === 2 && Z === 1) return { ok: true, pts: 4, tag: 'WWZ', why: '' };
  if (W === 2 && H === 1) return { ok: true, pts: 5, tag: 'HWW', why: '' };
  if (Z === 2 && H === 1) return { ok: true, pts: 5, tag: 'HZZ', why: '' };
  if (H === 3) return { ok: true, pts: 6, tag: 'HHH', why: '' };
  if (H === 1 && ((A === 2) || (g === 2) || (Z === 1 && A === 1)))
    return BAD('H–γγ・H–gg・H–Zγ は、フェルミオンの輪(ループ)を通ってはじめて生じる結合で、1つの頂点(ツリーレベル)にはありません。');
  return BAD('標準模型に存在しない結合です。');
}

const _extCache = new Map();
function endsKey(ends) { return ends.map(e => e.p.id + ':' + e.io).sort().join(','); }
// 線をあと1〜2本足して(4点モードでは最大4本まで)有効な頂点にできるか
function canExtend(ends, modeKey, q) {
  const key = modeKey + (q ? 'q' : 'c') + '|' + endsKey(ends);
  if (_extCache.has(key)) return _extCache.get(key);
  const cand = candidateEnds(modeKey), max = q ? 4 : 3;
  let ok = false;
  for (let i = 0; i < cand.length && !ok; i++) {
    const ne = ends.concat([cand[i]]);
    if (ne.length >= 3 && validateVertex(ne).ok) ok = true;
    else if (ne.length < max && canExtend(ne, modeKey, q)) ok = true;
  }
  _extCache.set(key, ok);
  return ok;
}
function completable(ends, modeKey, q) { return canExtend(ends, modeKey, !!q); }

/* ------------------------------------------------------------------ */
/*  蜂の巣格子 (ブリックウォール表現)                                    */
/*  ノード (i,j): (i±1,j) と、(i+j)が偶数なら(i,j+1)、奇数なら(i,j-1)    */
/* ------------------------------------------------------------------ */
const SQ3_2 = Math.sqrt(3) / 2;
const nk = (i, j) => i + ',' + j;
const parseNode = k => k.split(',').map(Number);
function neighbors(key, q) {
  const [i, j] = parseNode(key);
  if (q) return [nk(i + 1, j), nk(i - 1, j), nk(i, j + 1), nk(i, j - 1)];
  const v = ((i + j) % 2 + 2) % 2 === 0 ? nk(i, j + 1) : nk(i, j - 1);
  return [nk(i + 1, j), nk(i - 1, j), v];
}
function edgeKey(a, b) { return a < b ? a + '|' + b : b + '|' + a; }
function splitEdge(k) { return k.split('|'); }
function nodePos(key, L, q) {
  const [i, j] = parseNode(key);
  if (q) return { x: i * L, y: j * L };
  const even = ((i + j) % 2 + 2) % 2 === 0;
  const y = 1.5 * j + (even ? 0 : -0.5);
  return { x: i * SQ3_2 * L, y: y * L };
}

/* ------------------------------------------------------------------ */
/*  描画用の配置                                                        */
/*  3点モード: 蜂の巣格子そのまま。                                       */
/*  4点モード: 正方格子を土台に、頂点の本数に応じて線の角度を                */
/*  3本以下なら120°、4本なら90°ずつ開くよう緩和計算で配置する。            */
/* ------------------------------------------------------------------ */
const DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]]; // 東・南・西・北(画面上で時計回り=角度が増える向き)
function dirIdx(from, to) {
  const [i, j] = parseNode(from), [k, l] = parseNode(to);
  return DIRS.findIndex(d => d[0] === k - i && d[1] === l - j);
}
const TAU = Math.PI * 2;
const wrap2 = a => ((a % TAU) + TAU) % TAU;
const wrapPi = a => { a = wrap2(a); return a > Math.PI ? a - TAU : a; };

function neighborMap(cards) {
  const adj = new Map();
  const add = (x, y) => { if (!adj.has(x)) adj.set(x, []); adj.get(x).push(y); };
  cards.forEach(c => { add(c.a, c.b); add(c.b, c.a); });
  adj.forEach((ns, n) => ns.sort((p, q) => dirIdx(n, p) - dirIdx(n, q)));
  return adj;
}

function relaxLayout(cards, L) {
  const adj = neighborMap(cards), pos = {};
  if (!cards.length) { pos['0,0'] = { x: 0, y: 0 }; return pos; }
  adj.forEach((_, k) => { pos[k] = nodePos(k, L, true); });
  // 角度の制約: [中心, 隣a, 隣b, 目標角(aからbへ角度が増える向き)]
  const angles = [];
  adj.forEach((ns, n) => {
    const m = ns.length;
    if (m === 2) {
      const diff = dirIdx(n, ns[1]) - dirIdx(n, ns[0]);
      if (diff === 1) angles.push([n, ns[0], ns[1], TAU / 3]);
      else if (diff === 3) angles.push([n, ns[0], ns[1], TAU * 2 / 3]);
    } else if (m >= 3) {
      for (let k = 0; k < m; k++) angles.push([n, ns[k], ns[(k + 1) % m], TAU / m]);
    }
  });
  for (let it = 0; it < 600; it++) {
    const dp = {}; Object.keys(pos).forEach(k => { dp[k] = { x: 0, y: 0 }; });
    cards.forEach(c => {
      const pa = pos[c.a], pb = pos[c.b];
      const dx = pb.x - pa.x, dy = pb.y - pa.y, d = Math.hypot(dx, dy) || 1e-6, f = (d - L) / 2 * 0.25;
      dp[c.a].x += dx / d * f; dp[c.a].y += dy / d * f; dp[c.b].x -= dx / d * f; dp[c.b].y -= dy / d * f;
    });
    angles.forEach(([n, a, b, target]) => {
      const pn = pos[n], pa = pos[a], pb = pos[b];
      const aa = Math.atan2(pa.y - pn.y, pa.x - pn.x), ab = Math.atan2(pb.y - pn.y, pb.x - pn.x);
      const err = wrapPi(target - wrap2(ab - aa));
      // 角度の勾配に沿って動かす。中心にも反作用を与え、全体が回転・平行移動しないようにする
      const ra = Math.hypot(pa.x - pn.x, pa.y - pn.y) || 1e-6, rb = Math.hypot(pb.x - pn.x, pb.y - pn.y) || 1e-6;
      const c = err * L * 0.06;
      const gb = { x: -Math.sin(ab) * L / rb * c, y: Math.cos(ab) * L / rb * c };
      const ga = { x: Math.sin(aa) * L / ra * c, y: -Math.cos(aa) * L / ra * c };
      dp[b].x += gb.x; dp[b].y += gb.y; dp[a].x += ga.x; dp[a].y += ga.y;
      dp[n].x -= gb.x + ga.x; dp[n].y -= gb.y + ga.y;
    });
    Object.keys(pos).forEach(k => {
      const m = Math.hypot(dp[k].x, dp[k].y), s = m > L * 0.2 ? L * 0.2 / m : 1; // 1回の移動量に上限(発散防止)
      pos[k].x += dp[k].x * s; pos[k].y += dp[k].y * s;
    });
  }
  return pos;
}

// 新しい線を、anchor から other へ伸ばすときの向き(ラジアン)
function slotAngle(anchor, other, pos, adj) {
  const d0 = dirIdx(anchor, other);
  const ex = (adj.get(anchor) || []).map(n => ({ d: dirIdx(anchor, n), ang: Math.atan2(pos[n].y - pos[anchor].y, pos[n].x - pos[anchor].x) }));
  if (!ex.length) return d0 * Math.PI / 2;
  if (ex.length === 1) return ex[0].ang + [0, TAU / 3, Math.PI, TAU * 2 / 3][((d0 - ex[0].d) % 4 + 4) % 4];
  const below = ex.filter(e => e.d < d0), above = ex.filter(e => e.d > d0);
  const pred = below.length ? below[below.length - 1] : ex[ex.length - 1];
  const succ = above.length ? above[0] : ex[0];
  let gap = wrap2(succ.ang - pred.ang); if (gap < 1e-6) gap = TAU;
  return pred.ang + gap / 2;
}

// 描画用の座標: P(節点) と cand(辺) (候補辺の両端と、新しい節点の位置)
function geometry(cards, q, L) {
  if (!q) {
    const P = k => nodePos(k, L, false);
    return { P, cand: e => { const [a, b] = splitEdge(e); return { a, b, pa: P(a), pb: P(b), newKey: null }; } };
  }
  const pos = relaxLayout(cards, L), adj = neighborMap(cards);
  return {
    P: k => pos[k],
    cand: e => {
      const [a, b] = splitEdge(e);
      if (pos[a] && pos[b]) return { a, b, pa: pos[a], pb: pos[b], newKey: null };
      const anchor = pos[a] ? a : b, other = pos[a] ? b : a;
      const ang = slotAngle(anchor, other, pos, adj);
      const pn = { x: pos[anchor].x + L * Math.cos(ang), y: pos[anchor].y + L * Math.sin(ang) };
      return { a, b, pa: pos[a] || pn, pb: pos[b] || pn, newKey: other, pn };
    }
  };
}

function buildNodes(cards) {
  const m = new Map();
  const add = (n, e) => { if (!m.has(n)) m.set(n, []); m.get(n).push(e); };
  cards.forEach(c => {
    const d = isDirected(c.p);
    add(c.a, { p: c.p, io: d ? (c.dir === 1 ? -1 : 1) : 0, card: c });
    add(c.b, { p: c.p, io: d ? (c.dir === 1 ? 1 : -1) : 0, card: c });
  });
  return m;
}

function candidateEdges(cards, q) {
  if (!cards.length) {
    return neighbors('0,0', q).map(n => edgeKey('0,0', n));
  }
  const occ = new Set(cards.map(c => edgeKey(c.a, c.b)));
  const nodes = new Set();
  cards.forEach(c => { nodes.add(c.a); nodes.add(c.b); });
  const out = new Set();
  nodes.forEach(n => neighbors(n, q).forEach(m => {
    const k = edgeKey(n, m);
    if (!occ.has(k)) out.add(k);
  }));
  return Array.from(out);
}

/* ------------------------------------------------------------------ */
/*  ミッション (実在の物理発見に対応するボーナス図形)                    */
/* ------------------------------------------------------------------ */
const fermOf = v => v.ends.filter(e => e.p.kind === 'f').map(e => e.p);
const MISSIONS = [
  { id:'atom', bonus:4, name:'原子が壊れない理由',
    desc:'光子の線が、電子(レプトン)の電磁結合とクォークの電磁結合をつなぐ。',
    test:(c, a, b) => c.p.kind === 'γ' && a.tag === 'ffγ' && b.tag === 'ffγ' &&
      ((fermOf(a)[0].type !== 'quark' && fermOf(b)[0].type === 'quark') || (fermOf(b)[0].type !== 'quark' && fermOf(a)[0].type === 'quark')) },
  { id:'sky', bonus:4, name:'空が青い理由',
    desc:'荷電フェルミオンの線が、2つの電磁結合(光子の吸収と放出)の間をつなぐ。',
    test:(c, a, b) => c.p.kind === 'f' && c.p.Q !== 0 && a.tag === 'ffγ' && b.tag === 'ffγ' },
  { id:'qcd', bonus:4, name:'ノーベル賞2004:漸近的自由',
    desc:'グルーオンの線が、グルーオン自己結合(ggg)とクォークの強い結合(qqg)をつなぐ。',
    test:(c, a, b) => c.p.kind === 'g' && ((a.tag === 'ggg' && b.tag === 'ffg') || (b.tag === 'ggg' && a.tag === 'ffg')) },
  { id:'beta', bonus:5, name:'β崩壊(d → u + e⁻ + ν̄e)',
    desc:'Wの線が、u–d–W の頂点と e–νe–W の頂点をつなぐ。',
    test:(c, a, b) => {
      if (c.p.kind !== 'W' || a.tag !== 'ffW' || b.tag !== 'ffW') return false;
      const has = (v, ids) => ids.every(id => fermOf(v).some(p => p.id === id));
      return (has(a, ['u','d']) && has(b, ['e','ve'])) || (has(b, ['u','d']) && has(a, ['e','ve']));
    } },
  { id:'nc', bonus:5, name:'中性カレントの発見(1973)',
    desc:'Zの線が、ニュートリノのZ結合と荷電フェルミオンのZ結合をつなぐ。',
    test:(c, a, b) => c.p.kind === 'Z' && a.tag === 'ffZ' && b.tag === 'ffZ' &&
      ((fermOf(a)[0].type === 'nu' && fermOf(b)[0].type !== 'nu') || (fermOf(b)[0].type === 'nu' && fermOf(a)[0].type !== 'nu')) },
  { id:'lep', bonus:5, name:'ゲージ粒子の自己結合(LEP)',
    desc:'WWγ または WWZ の頂点から出る2本のWが、どちらもW結合(ffW)の頂点につながる。',
    testNode:(node, info, cardsAt, info2) => {
      const v = info; if (v.tag !== 'WWγ' && v.tag !== 'WWZ') return false;
      const ws = v.ends.filter(e => e.p.kind === 'W');
      return ws.every(e => { const o = e.card.a === node ? e.card.b : e.card.a; const w = info2.get(o); return w && w.status === 'valid' && w.tag === 'ffW'; });
    } },
  { id:'higgs', bonus:6, name:'ヒッグス粒子の発見(H→ZZ→4ℓ)',
    desc:'H–Z–Z の頂点から出る2本のZが、どちらも荷電レプトンのZ結合につながる。',
    testNode:(node, info, cardsAt, info2) => {
      if (info.tag !== 'HZZ') return false;
      const zs = info.ends.filter(e => e.p.kind === 'Z');
      return zs.every(e => { const o = e.card.a === node ? e.card.b : e.card.a; const w = info2.get(o); return w && w.status === 'valid' && w.tag === 'ffZ' && fermOf(w)[0].type === 'lepton'; });
    } }
];

/* ------------------------------------------------------------------ */
/*  図の評価                                                            */
/* ------------------------------------------------------------------ */
function evaluate(cards, modeKey, final, q) {
  const nodes = buildNodes(cards);
  const info = new Map();
  let vpts = 0, invalid = 0, badInc = 0, okInc = 0, validCount = 0;
  nodes.forEach((ends, n) => {
    if (ends.length >= 3) {
      const v = validateVertex(ends);
      if (v.ok) { info.set(n, { node:n, ends, status:'valid', tag:v.tag, pts:v.pts, ckm:v.ckm }); vpts += v.pts; validCount++; }
      else if (ends.length === 3 && q && canExtend(ends, modeKey, true)) { info.set(n, { node:n, ends, status:'open', quartic:true }); okInc++; }
      else { info.set(n, { node:n, ends, status:'invalid', pts:-1, why:v.why }); invalid++; }
    } else if (ends.length === 2) {
      if (canExtend(ends, modeKey, !!q)) { info.set(n, { node:n, ends, status:'open' }); okInc++; }
      else { info.set(n, { node:n, ends, status:'dead' }); badInc++; }
    } else {
      info.set(n, { node:n, ends, status:'single' });
    }
  });

  // ループ: 閉じた最小の輪(蜂の巣格子=六角形6枚、正方格子=正方形4枚)
  const loops = [];
  if (cards.length >= (q ? 4 : 6)) {
    const occ = new Set(cards.map(c => edgeKey(c.a, c.b)));
    let mini = 1e9, maxi = -1e9, minj = 1e9, maxj = -1e9;
    nodes.forEach((_, n) => { const [i, j] = parseNode(n); mini = Math.min(mini, i); maxi = Math.max(maxi, i); minj = Math.min(minj, j); maxj = Math.max(maxj, j); });
    for (let i = mini - 2; i <= maxi; i++) {
      for (let j = minj - 2; j <= maxj; j++) {
        const rings = [];
        if (q) {
          rings.push([nk(i,j), nk(i+1,j), nk(i+1,j+1), nk(i,j+1)]);
          // 六角形: 3x2 / 2x3 格子点の外周。中央の辺が貼られていれば正方形2つとして数える
          if (!occ.has(edgeKey(nk(i+1,j), nk(i+1,j+1))))
            rings.push([nk(i,j), nk(i+1,j), nk(i+2,j), nk(i+2,j+1), nk(i+1,j+1), nk(i,j+1)]);
          if (!occ.has(edgeKey(nk(i,j+1), nk(i+1,j+1))))
            rings.push([nk(i,j), nk(i+1,j), nk(i+1,j+1), nk(i+1,j+2), nk(i,j+2), nk(i,j+1)]);
        } else {
          if (((i + j) % 2 + 2) % 2 !== 0) continue;
          rings.push([nk(i,j), nk(i+1,j), nk(i+2,j), nk(i+2,j+1), nk(i+1,j+1), nk(i,j+1)]);
        }
        rings.forEach(ring => {
          let all = true;
          for (let k = 0; k < ring.length && all; k++) all = occ.has(edgeKey(ring[k], ring[(k+1)%ring.length]));
          if (!all) return;
          const good = ring.every(n => { const st = info.get(n).status; return st === 'valid' || st === 'open'; });
          if (good) loops.push(ring);
        });
      }
    }
  }

  // ミッション
  const missions = [];
  MISSIONS.forEach(m => {
    let hit = false;
    if (m.test) {
      for (const c of cards) {
        const a = info.get(c.a), b = info.get(c.b);
        if (a && b && a.status === 'valid' && b.status === 'valid' && m.test(c, a, b)) { hit = true; break; }
      }
    } else if (m.testNode) {
      info.forEach((v, n) => { if (!hit && v.status === 'valid' && m.testNode(n, v, null, info)) hit = true; });
    }
    if (hit) missions.push(m.id);
  });
  const missionPts = missions.reduce((s, id) => s + MISSIONS.find(m => m.id === id).bonus, 0);

  const loopPts = loops.length * 2;
  const total = vpts - invalid + loopPts + missionPts - (final ? badInc : 0);
  const heur = total + 0.15 * okInc - (final ? 0 : 0.5 * badInc);
  return { total, heur, vpts, invalid, badInc, okInc, validCount, loops, missions, missionPts, loopPts, info };
}

/* ------------------------------------------------------------------ */
/*  デッキ・ゲーム進行                                                   */
/* ------------------------------------------------------------------ */
function shuffle(arr, rnd) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
  return a;
}

function buildDeck(modeKey, rnd) {
  const m = MODES[modeKey];
  const d = [];
  m.fermions.forEach(id => { for (let k = 0; k < m.deck.fermion; k++) d.push(BY_ID[id]); });
  ['gamma','gluon','W','Z','H'].forEach(id => { for (let k = 0; k < m.deck[id]; k++) d.push(BY_ID[id]); });
  return shuffle(d, rnd);
}

function newGame(opts) {
  const rnd = opts.rnd || Math.random;
  const np = opts.players.length;
  const solo = np === 1;
  const s = {
    mode: opts.mode, rnd, solo, np, quartic: !!opts.quartic,
    R: solo ? 12 : (np === 2 ? 8 : np === 3 ? 9 : 8),
    marketSize: solo ? 3 : np + 1,
    players: opts.players.map(p => ({ name:p.name, human:!!p.human, diff:p.diff || 'normal', cards:[], secret:null })),
    deck: buildDeck(opts.mode, rnd),
    market: [], round: 0, first: 0, order: [], pickIdx: 0,
    phase: 'pick', secretIdx: 0, nextId: 1, log: []
  };
  s.players.forEach(p => { p.secret = s.deck.pop(); });
  beginRound(s);
  return s;
}

function beginRound(s) {
  s.round++;
  s.market = [];
  for (let i = 0; i < s.marketSize; i++) s.market.push(s.deck.pop());
  if (s.solo) s.order = [0];
  else {
    s.order = [];
    for (let k = 0; k < s.np; k++) s.order.push((s.first + k) % s.np);
    s.order.push(s.first);
  }
  s.pickIdx = 0;
}

function currentPlayer(s) {
  if (s.phase === 'pick') return s.order[s.pickIdx];
  if (s.phase === 'secret') return s.secretIdx;
  return -1;
}

function placeCard(s, pi, p, edge, dir) {
  const [a, b] = splitEdge(edge);
  s.players[pi].cards.push({ id: s.nextId++, p, a, b, dir: isDirected(p) ? dir : 1 });
}

function applyPick(s, marketIndex, edge, dir) {
  const pi = s.order[s.pickIdx];
  const p = s.market[marketIndex];
  placeCard(s, pi, p, edge, dir);
  s.market.splice(marketIndex, 1);
  s.pickIdx++;
  if (s.solo || s.pickIdx >= s.order.length) {
    if (s.round >= s.R) { s.phase = 'secret'; s.secretIdx = 0; s.market = []; }
    else { s.first = (s.first + 1) % s.np; beginRound(s); }
  }
  return { player: pi, p };
}

function applySecret(s, edge, dir) {
  const pi = s.secretIdx;
  const p = s.players[pi].secret;
  placeCard(s, pi, p, edge, dir);
  s.players[pi].secretPlaced = true;
  s.secretIdx++;
  if (s.secretIdx >= s.np) s.phase = 'over';
  return { player: pi, p };
}

/* ------------------------------------------------------------------ */
/*  CPU                                                                 */
/* ------------------------------------------------------------------ */
const NOISE = { easy: 2.2, normal: 0.9, hard: 0.15 };

function bestPlacement(cards, p, modeKey, noise, rnd, final, q) {
  const edges = candidateEdges(cards, q);
  const base = evaluate(cards, modeKey, final, q).heur;
  let best = null;
  edges.forEach(e => {
    const [a, b] = splitEdge(e);
    const dirs = isDirected(p) ? [1, -1] : [1];
    dirs.forEach(dir => {
      const nc = cards.concat([{ id: -1, p, a, b, dir }]);
      const gain = evaluate(nc, modeKey, final, q).heur - base + (rnd() - 0.5) * 2 * noise;
      if (!best || gain > best.gain) best = { edge: e, dir, gain };
    });
  });
  return best;
}

function cpuMove(s) {
  const pi = currentPlayer(s);
  const pl = s.players[pi];
  const noise = NOISE[pl.diff] != null ? NOISE[pl.diff] : NOISE.normal;
  if (s.phase === 'secret') {
    const b = bestPlacement(pl.cards, pl.secret, s.mode, 0, s.rnd, true, s.quartic);
    return { secret: true, edge: b.edge, dir: b.dir };
  }
  let best = null;
  s.market.forEach((p, idx) => {
    const b = bestPlacement(pl.cards, p, s.mode, noise, s.rnd, false, s.quartic);
    if (!best || b.gain > best.gain) best = { index: idx, edge: b.edge, dir: b.dir, gain: b.gain };
  });
  return best;
}

return {
  FERMIONS, BOSONS, PARTICLES, BY_ID, MODES, MISSIONS, TAG_LABEL, CKM_PTS, CKM_VAL, YUKAWA_PTS,
  isDirected, universe, validateVertex, completable, evaluate, candidateEdges, edgeKey, splitEdge,
  neighbors, nodePos, geometry, relaxLayout, parseNode, buildNodes, newGame, applyPick, applySecret, currentPlayer, cpuMove, bestPlacement, shuffle
};
})();
if (typeof module !== 'undefined') module.exports = TQ;
