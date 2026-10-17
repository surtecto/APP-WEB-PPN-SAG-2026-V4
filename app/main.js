import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { ColladaLoader } from 'three/addons/loaders/ColladaLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';

const D = JSON.parse(document.getElementById('data').textContent);
const STANDALONE = !!window.PPN_STANDALONE;
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const rad = Math.PI / 180;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const nf = (v, d = 1) => Number(v).toLocaleString('es-AR', { minimumFractionDigits: d, maximumFractionDigits: d });
const pct = v => nf(v * 100, 0) + '%';

// =============================================================== norte real (único válido)
const orient = 'real'; let bearY = 44, EX = [0, 0], EY = [0, 0];
function setBear(b) { bearY = b; EX = [Math.sin((b + 90) * rad), Math.cos((b + 90) * rad)]; EY = [Math.sin(b * rad), Math.cos(b * rad)]; }
const OM = () => Z.modes[orient];
function geoText() {
  $('#geo').textContent = `San Andrés de Giles · ${Math.abs(D.lat).toFixed(4)}° S, ${Math.abs(D.lon).toFixed(4)}° O · volúmenes de referencia de la lámina ${Z ? Z.src : ''} · ` +
    `norte real (trama del Plano Director) · exigencias: fichas PPN-2026`;
}

// =============================================================== sol (NOAA)
function sunPos(doy, hour) {
  const d0 = Date.UTC(2026, 0, 1) / 86400000 + 2440587.5;
  const jd = d0 + (doy - 1) + (hour - D.tz) / 24;
  const T = (jd - 2451545) / 36525;
  const L0 = (280.46646 + T * (36000.76983 + T * 0.0003032)) % 360;
  const M = 357.52911 + T * (35999.05029 - 0.0001537 * T), Mr = M * rad;
  const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
  const C = Math.sin(Mr) * (1.914602 - T * (0.004817 + 0.000014 * T)) + Math.sin(2 * Mr) * (0.019993 - 0.000101 * T) + Math.sin(3 * Mr) * 0.000289;
  const om = 125.04 - 1934.136 * T, lam = L0 + C - 0.00569 - 0.00478 * Math.sin(om * rad);
  const eps = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60 + 0.00256 * Math.cos(om * rad);
  const dec = Math.asin(Math.sin(eps * rad) * Math.sin(lam * rad));
  const yv = Math.tan(eps * rad / 2) ** 2, L0r = L0 * rad;
  const eot = 4 / rad * (yv * Math.sin(2 * L0r) - 2 * e * Math.sin(Mr) + 4 * e * yv * Math.sin(Mr) * Math.cos(2 * L0r) - 0.5 * yv * yv * Math.sin(4 * L0r) - 1.25 * e * e * Math.sin(2 * Mr));
  const ut = hour - D.tz; const tst = ((ut * 60 + eot + 4 * D.lon) % 1440 + 1440) % 1440; const ha = (tst / 4 - 180) * rad;
  const lat = D.lat * rad;
  const cz = Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(ha);
  const el = 90 - Math.acos(Math.max(-1, Math.min(1, cz))) / rad;
  const az = Math.atan2(Math.sin(ha), Math.cos(ha) * Math.sin(lat) - Math.tan(dec) * Math.cos(lat)) / rad + 180;
  return { az: (az + 360) % 360, el };
}
function sunLocal(az, el) { // vector al sol en el marco del modelo (x, y de la lámina; z arriba)
  const e = Math.sin(az * rad) * Math.cos(el * rad), n = Math.cos(az * rad) * Math.cos(el * rad), z = Math.sin(el * rad);
  return [e * EX[0] + n * EX[1], e * EY[0] + n * EY[1], z];
}
function sunVec(az, el) { const s = sunLocal(az, el); return new THREE.Vector3(s[0], s[2], -s[1]).normalize(); }
const card = a => ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'][Math.round(((a % 360) + 360) % 360 / 45) % 8];
const bearingLocal = (nx, ny) => { const e = nx * EX[0] + ny * EY[0], n = nx * EX[1] + ny * EY[1]; return (Math.atan2(e, n) / rad + 360) % 360; };
const fmtH = h => { if (h == null) return '—'; const hh = Math.floor(h), mm = Math.round((h - hh) * 60); return `${String(hh + (mm === 60 ? 1 : 0)).padStart(2, '0')}:${String(mm % 60).padStart(2, '0')}`; };
const fmtDay = d => new Date(Date.UTC(2026, 0, d)).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', timeZone: 'UTC' });

// =============================================================== escena
const canvas = $('#c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, 1, 1, 5000);
const controls = new OrbitControls(camera, canvas); controls.enableDamping = true; controls.maxPolarAngle = Math.PI * 0.495;
const hemi = new THREE.HemisphereLight(0xffffff, 0x8a8a7a, 0.75); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff1d6, 2.4); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
scene.add(sun); scene.add(sun.target);
const world = new THREE.Group(); scene.add(world);

let mode = 'plan', zoneKey = 'RN9';
const state = { day: 172, hour: 15.5, layer: 'live' };
let Z = null, ovl = null, heatTex = {}, sunMarker = null, pathLine = null, corrGroup = null, visGroup = null, envGroup = null, markGroup = null, refGroup = null, treeGroup = null, projMesh = null, buildMeshes = [];
const col = n => new THREE.Color(css(n) || '#999');
const V3 = (x, y, h = 0) => new THREE.Vector3(x, h, -y);

let LS = 1;
function textSprite(txt, color, bg, size = 26, scale = 2.0) {
  scale *= LS;
  const c = document.createElement('canvas'); const ctx = c.getContext('2d'); ctx.font = `600 ${size}px "IBM Plex Mono", monospace`;
  const w = Math.ceil(ctx.measureText(txt).width) + 16, h = size + 12; c.width = w; c.height = h;
  ctx.font = `600 ${size}px "IBM Plex Mono", monospace`; if (bg) { ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h); } ctx.fillStyle = color; ctx.textBaseline = 'middle'; ctx.fillText(txt, 8, h / 2 + 1);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false })); s.scale.set(w / h * scale, scale, 1); s.renderOrder = 10; return s;
}
const HEAT = ['#23324a', '#4d6a8a', '#9fb3a6', '#e9dca4', '#f1b545', '#e07b2a'];
function heatColor(t) { t = Math.max(0, Math.min(1, t)); const n = HEAT.length - 1, i = Math.min(n - 1, Math.floor(t * n)), f = t * n - i; return new THREE.Color(HEAT[i]).lerp(new THREE.Color(HEAT[i + 1]), f); }
const VMAX = { invierno: 9.5, equinoccio: 11.5, verano: 13.5, verano_arb: 13.5, proyecto: 9.5 };
function decodeMap(key, o = orient) {
  const rows = Z.modes[o].maps[key], H = rows.length, W = rows[0].length, out = new Float32Array(W * H);
  for (let j = 0; j < H; j++) { const r = rows[j]; for (let i = 0; i < W; i++) { const ch = r[i]; out[j * W + i] = ch === '.' ? -1 : (ch.charCodeAt(0) - 48) / 2; } }
  return { W, H, v: out };
}
function texFromGrid(W, H, val, vmax) {
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d'); const img = ctx.createImageData(W, H);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const k = ((H - 1 - j) * W + i) * 4, v = val[j * W + i];
    if (v < 0) { img.data[k + 3] = 0; continue; }
    const cc = heatColor(v / vmax); img.data[k] = cc.r * 255; img.data[k + 1] = cc.g * 255; img.data[k + 2] = cc.b * 255; img.data[k + 3] = 240;
  }
  ctx.putImageData(img, 0, 0); const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace; t.userData = { W, H }; return t;
}
function makeHeat(key) { const m = decodeMap(key); return texFromGrid(m.W, m.H, m.v, VMAX[key]); }
function b64u8(s) { const b = atob(s); const a = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a; }

const lotById = id => Z.lots.find(l => l.id === id);
const focusLots = () => Z.lots.filter(l => l.focus);
const lotStat = id => OM().lots[id];
const lotMeas = id => (Z.modes.real.lots[id] || {}).meas;
function pip(x, y, P) { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; }
const centroid = P => { let x = 0, y = 0; P.forEach(p => { x += p[0]; y += p[1]; }); return [x / P.length, y / P.length]; };

// =============================================================== mallas de la lámina (tal cual)
const meshCache = {};
function zoneMeshes(z) {
  if (meshCache[z]) return meshCache[z];
  const Zd = D.zones[z], [x0, , y0] = Zd.win;
  const out = Zd.mesh.map(g => {
    const raw = b64u8(g.b); const a = new Int16Array(raw.buffer, raw.byteOffset, raw.byteLength / 2);
    const p = new Float32Array(a.length);
    for (let i = 0; i < a.length; i += 3) { const x = a[i] / 100 + x0, y = a[i + 1] / 100 + y0, h = a[i + 2] / 100; p[i] = x; p[i + 1] = h; p[i + 2] = -y; }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(p, 3)); geo.computeVertexNormals();
    return { g, geo, edges: (g.cls === 'edif' || g.cls === 'cerco') ? new THREE.EdgesGeometry(geo, 20) : null };
  });
  meshCache[z] = out; return out;
}
const levelsOfAlt = () => { const m = Z.meta.alt.match(/PB\+(\d)/); return m ? +m[1] + 1 : 2; };
function heightLabel(h) {
  const lv = levelsOfAlt();
  if (h > lv * 3.1 + 1.5) return `${Z.meta.alt.split(' ')[0]} + terraza`;
  const n = Math.max(1, Math.round(h / 3.05)); return n === 1 ? 'PB' : `PB+${n - 1}`;
}

// =============================================================== construcción de escena común
function buildBase(excludeId) {
  world.clear(); buildMeshes = []; heatTex = {};
  Z = D.zones[zoneKey]; setBear(OM().bearY); geoText();
  const [x0, x1, y0, y1] = Z.win; const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2; const span = Math.max(x1 - x0, y1 - y0);
  LS = Math.min(2.2, Math.max(1, span / 95));
  const gGeo = new THREE.PlaneGeometry(span * 6, span * 6); gGeo.rotateX(-Math.PI / 2);
  const g = new THREE.Mesh(gGeo, new THREE.MeshStandardMaterial({ color: col('--ground'), roughness: 1 })); g.position.set(cx, -0.02, -cy); g.receiveShadow = true; world.add(g);
  const exIdx = excludeId ? Z.lots.findIndex(l => l.id === excludeId) : -2;
  envGroup = new THREE.Group();
  const edgeMat = new THREE.LineBasicMaterial({ color: 0x3d3934, transparent: true, opacity: .5 });
  const ghostMat = new THREE.LineDashedMaterial({ color: col('--alert'), dashSize: .6, gapSize: .4 });
  zoneMeshes(zoneKey).forEach(({ g: grp, geo, edges }) => {
    if (grp.own === exIdx && grp.cls !== 'suelo') {
      if (edges) { const e = new THREE.LineSegments(edges, ghostMat); e.computeLineDistances(); envGroup.add(e); }
      return;
    }
    const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(grp.c), roughness: .9, side: THREE.DoubleSide, transparent: grp.o < 1, opacity: grp.o, depthWrite: grp.o >= 1 });
    const m = new THREE.Mesh(geo, mat); m.receiveShadow = true;
    m.castShadow = grp.cls === 'edif' || grp.cls === 'cerco'; world.add(m);
    if (grp.cls === 'edif') buildMeshes.push(m);
    if (edges) world.add(new THREE.LineSegments(edges, edgeMat));
  });
  world.add(envGroup);
  // arbolado de la lámina
  treeGroup = new THREE.Group();
  const crownMat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#7d9b62'), roughness: 1, transparent: true, opacity: .8 });
  const trunkMat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#7a6650'), roughness: 1 });
  Z.trees.forEach(([tx, ty, r, zb, zt]) => {
    const x = tx + x0, y = ty + y0; const ch = Math.max(1, zt - zb);
    const cr = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), crownMat); cr.scale.set(r, ch / 2, r); cr.position.set(x, zb + ch / 2, -y); cr.castShadow = true; treeGroup.add(cr);
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(.15, .2, zb, 6), trunkMat); tr.position.set(x, zb / 2, -y); tr.castShadow = true; treeGroup.add(tr);
  });
  treeGroup.visible = $('#tTree').checked; world.add(treeGroup);
  // lotes
  const lineFocus = new THREE.LineBasicMaterial({ color: col('--alert') }), lineLot = new THREE.LineBasicMaterial({ color: col('--muted'), transparent: true, opacity: .8 });
  Z.lots.forEach(l => {
    const pts = [...l.poly, l.poly[0]].map(p => V3(p[0], p[1], 0.5));
    const isF = (l.focus && !excludeId) || l.id === excludeId;
    world.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), isF ? lineFocus : lineLot));
    const [lx, ly] = centroid(l.poly);
    const lbl = textSprite(`${l.label === l.zone ? l.zone : l.label} ${l.id}${isF ? ' ●' : ''}`, isF ? css('--alert') : css('--muted'), null, 22, 1.5);
    lbl.position.set(lx, 0.9, -ly); world.add(lbl);
  });
  controls.target.set(cx, 3, -cy);
  camera.position.set(cx - span * 0.55, span * 0.85, -cy + span * 1.05);
  const sc = span * 0.8; Object.assign(sun.shadow.camera, { left: -sc, right: sc, top: sc, bottom: -sc, near: 1, far: span * 4 }); sun.shadow.camera.updateProjectionMatrix();
  sun.target.position.set(cx, 0, -cy);
  // capa de suelo (mapas)
  ovl = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
  ovl.visible = false; ovl.renderOrder = 2; world.add(ovl);
  corrGroup = new THREE.Group(); visGroup = new THREE.Group(); markGroup = new THREE.Group(); refGroup = new THREE.Group();
  world.add(corrGroup); world.add(visGroup); world.add(markGroup); world.add(refGroup);
  buildRefs(excludeId);
}
function setOverlay(tex, cell) {
  if (!tex) { ovl.visible = false; return; }
  const [x0, , y0] = Z.win; const W = tex.userData.W * cell, H = tex.userData.H * cell;
  ovl.scale.set(W, 1, H); ovl.position.set(x0 + W / 2, 0.42, -(y0 + H / 2));
  ovl.material.map = tex; ovl.material.needsUpdate = true; ovl.visible = true;
}


// --------------------------------------------------------------- exigencias de la ficha (medidas ideales exigidas)
const westness = (x, y) => -Math.sin(bearingLocal(x, y) * rad);
function fichaLot(l) { // lote tipo de la ficha: frente mínimo y superficie mínima, apoyado en la esquina izquierda de la L.M. del lote de la lámina
  const W = Z.meta.frente, Dd = Math.max(l.D, Z.meta.supmin / W); const o = l.o, d = l.d, r = l.r;
  const P = (u, v) => [o[0] + r[0] * u + d[0] * v, o[1] + r[1] * u + d[1] * v];
  return { ...l, W, D: Dd, area: W * Dd, poly: [P(0, 0), P(W, 0), P(W, Dd), P(0, Dd)], lam: l };
}
function fichaRules(l) {
  const f = Z.read.ficha || {}; const north = Math.cos(bearingLocal(-l.d[0], -l.d[1]) * rad) > 0;
  const row = f.N ? (north ? f.N : f.S) : f; const lv = f.lv || 2, H = lv * 3;
  const latLeft = westness(-l.r[0], -l.r[1]) >= westness(l.r[0], l.r[1]);
  const lat = (f.lat || 0) * l.W, latE = (f.latE || 0) * l.W;
  const li = latLeft ? lat : latE, ld = latLeft ? latE : lat;
  const rf = (row.ff || 0) * l.D, rb = (row.fb || 0) * l.D;
  return { rf, rb, li, ld, H, lv, steps: f.steps || null, north, latLeft, ffp: row.ff || 0, fbp: row.fb || 0, latp: f.lat || 0, latEp: f.latE || 0 };
}
function rulesFor(l) { // altura admitida en (u, v) del lote de ficha, con pendiente de 45° desde 3 m en las líneas de retiro
  const R = fichaRules(l), W = l.W, Dp = l.D, vb = Dp - R.rb;
  return (u, v) => {
    if (u < -0.01 || u > W + 0.01 || v < -0.01 || v > Dp + 0.01) return { a: 0, c: 'fuera' };
    if (R.li && u < R.li) return { a: 0, c: 'lateral' };
    if (R.ld && u > W - R.ld) return { a: 0, c: 'lateral' };
    if (R.rf && v < R.rf) return { a: 0, c: 'frente' };
    if (R.rb && v > vb) return { a: 0, c: 'fondo' };
    let a = R.H;
    if (R.steps) { a = 0; for (const [fr, n] of R.steps) if (v <= fr * Dp) { a = n * 3; break; } if (!a) return { a: 0, c: 'fondo' }; }
    if (R.rb) a = Math.min(a, 3 + (vb - v));
    if (R.rf) a = Math.min(a, 3 + (v - R.rf));
    return { a: Math.max(3, a), c: 'ok' };
  };
}

// --------------------------------------------------------------- referencias al estilo de la ficha
const REF = { corr: '#3d7fd1', ret: '#3f9a4a', edif: '#2d63b8', lat: '#c43b2e', north: '#e2b422' };
function dimLine(a, b, h, color, label, grp, lift = 1.6) { // cota entre dos puntos (x,y) a altura h
  const m = new THREE.LineBasicMaterial({ color, depthTest: false });
  const A = V3(a[0], a[1], h), B = V3(b[0], b[1], h);
  const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints([A, B]), m); l.renderOrder = 8; grp.add(l);
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, px = -dy / L * 0.7, py = dx / L * 0.7;
  [a, b].forEach(p => { const t = new THREE.Line(new THREE.BufferGeometry().setFromPoints([V3(p[0] - px, p[1] - py, h), V3(p[0] + px, p[1] + py, h)]), m); t.renderOrder = 8; grp.add(t); });
  if (label) { const s = textSprite(label, '#ffffff', color, 22, 1.45); s.position.copy(A.clone().lerp(B, .5)).add(new THREE.Vector3(0, lift, 0)); grp.add(s); }
}
function buildRefs(excludeId) {
  refGroup.clear();
  // área de correspondencias
  Z.corr.forEach((P, k) => {
    const sh = new THREE.Shape(P.map(p => new THREE.Vector2(p[0], p[1])));
    const geo = new THREE.ShapeGeometry(sh); geo.rotateX(-Math.PI / 2); // (x, y) → (x, 0, -y)
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: REF.corr, transparent: true, opacity: .28, depthWrite: false, side: THREE.DoubleSide }));
    m.position.y = 0.48; m.renderOrder = 3; refGroup.add(m);
    if (k === 0) { const [cx, cy] = centroid(P); const s = textSprite('Área de correspondencias', '#ffffff', REF.corr, 22, 1.5); s.position.set(cx, 2.2, -cy); refGroup.add(s); }
  });
  // cotas exigidas por la ficha sobre el lote tipo (frente y superficie mínima)
  Z.lots.filter(l => excludeId ? l.id === excludeId : l.focus).forEach(l => {
    const L = fichaLot(l), R = fichaRules(L), F = lotFrame(L), um = L.W / 2;
    const out = new THREE.LineDashedMaterial({ color: REF.ret, dashSize: .8, gapSize: .5 });
    const ol = new THREE.Line(new THREE.BufferGeometry().setFromPoints([...L.poly, L.poly[0]].map(p => V3(p[0], p[1], 0.55))), out); ol.computeLineDistances(); refGroup.add(ol);
    const vb = L.D - R.rb, v0 = R.rf;
    if (R.rf) dimLine(F.toXY(um, 0), F.toXY(um, R.rf), 0.6, REF.ret, `Retiro de frente ${pct(R.ffp)} · ${nf(R.rf)} m`, refGroup);
    if (R.rb) dimLine(F.toXY(um, vb), F.toXY(um, L.D), 0.6, REF.ret, `Fondo libre ${pct(R.fbp)} · ${nf(R.rb)} m`, refGroup);
    dimLine(F.toXY(um, v0), F.toXY(um, vb), R.H + 0.8, REF.edif, `% Edificación ${pct((vb - v0) / L.D)} · ${nf(vb - v0)} m`, refGroup);
    if (R.li) dimLine(F.toXY(0, L.D * 0.35), F.toXY(R.li, L.D * 0.35), 0.6, REF.lat, `Retiro lateral ${pct(R.li / L.W)} · ${nf(R.li)} m`, refGroup);
    if (R.ld) dimLine(F.toXY(L.W - R.ld, L.D * 0.35), F.toXY(L.W, L.D * 0.35), 0.6, REF.lat, `Retiro lateral ${pct(R.ld / L.W)} · ${nf(R.ld)} m`, refGroup);
    const [bx, by] = F.toXY(R.li + (L.W - R.li - R.ld) / 2, v0 + Math.min(3, (vb - v0) / 2)); const mat = new THREE.LineBasicMaterial({ color: REF.ret, depthTest: false });
    const ln = new THREE.Line(new THREE.BufferGeometry().setFromPoints([V3(bx, by, 0), V3(bx, by, R.H)]), mat); ln.renderOrder = 8; refGroup.add(ln);
    for (let z = 3; z < R.H - 0.1; z += 3) refGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([V3(bx - .5, by, z), V3(bx + .5, by, z)]), mat));
    const sp = textSprite(`Ficha ${Z.meta.alt.split(' ')[0]} · ${nf(R.H)} m`, '#ffffff', REF.ret, 22, 1.45); sp.position.set(bx, R.H + 2.2, -by); refGroup.add(sp);
    const cap = textSprite(`Lote de ficha ${nf(L.W, 0)} × ${nf(L.D)} m`, REF.ret, null, 20, 1.3); const [cx0, cy0] = F.toXY(L.W / 2, -1.5); cap.position.set(cx0, 1.2, -cy0); refGroup.add(cap);
  });
  // norte (círculo amarillo con flecha, como en las láminas)
  const [x0, x1, y0, y1] = Z.win; const span = Math.max(x1 - x0, y1 - y0); const R = span * 0.045 + 2.5;
  const nx = x1 + R * 0.4, ny = y1 + R * 0.4;
  const ring = new THREE.Mesh(new THREE.RingGeometry(R * 0.86, R, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: REF.north, side: THREE.DoubleSide }));
  ring.position.set(nx, 0.6, -ny); refGroup.add(ring);
  const dir = [Math.sin(-bearY * rad), Math.cos(-bearY * rad)]; // norte verdadero en el marco del modelo
  const tri = new THREE.Shape([new THREE.Vector2(0, R * 0.8), new THREE.Vector2(-R * 0.32, -R * 0.55), new THREE.Vector2(0, -R * 0.3), new THREE.Vector2(R * 0.32, -R * 0.55)]);
  const tg = new THREE.ShapeGeometry(tri); tg.rotateZ(-Math.atan2(dir[0], dir[1])); tg.rotateX(-Math.PI / 2);
  const arrow = new THREE.Mesh(tg, new THREE.MeshBasicMaterial({ color: REF.north, side: THREE.DoubleSide })); arrow.position.set(nx, 0.62, -ny); refGroup.add(arrow);
  const ns = textSprite('N', '#1d2430', REF.north, 30, 2.2); ns.position.set(nx + dir[0] * R * 1.45, 1.5, -(ny + dir[1] * R * 1.45)); refGroup.add(ns);
  // escala gráfica
  refGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([V3(x0 + 4, y0 + 3, 0.6), V3(x0 + 24, y0 + 3, 0.6)]), new THREE.LineBasicMaterial({ color: col('--fg') })));
  const st = textSprite('20 m', css('--fg'), null, 22); st.position.set(x0 + 14, 1.6, -(y0 + 5.5)); refGroup.add(st);
  refGroup.visible = $('#tRef').checked;
}
const hfCache = {};
function lotHF(id) {
  const k = zoneKey + '|' + id; if (hfCache[k] !== undefined) return hfCache[k];
  const e = Z.hf.lots[id]; if (!e) return (hfCache[k] = null);
  const a = b64u8(e.b); const v = new Float32Array(a.length); for (let i = 0; i < a.length; i++) v[i] = a[i] / 10;
  return (hfCache[k] = { ...e, v });
}

// =============================================================== modo PLAN
function buildPlan() {
  buildBase(null);
  buildCorr(); buildVis();
  corrGroup.visible = $('#tCorr').checked; visGroup.visible = $('#tVis').checked;
  applyLayer(); updateSun(); panelPlan();
}
function buildCorr() {
  const seen = new Set();
  OM().pairs.forEach(p => {
    [[p.a, p.b, p.inv_ab], [p.b, p.a, p.inv_ba]].forEach(([s, t, v]) => {
      const k = s + '>' + t; if (seen.has(k) || v < 0.1) return; seen.add(k);
      const A = centroid(lotById(s).poly), B = centroid(lotById(t).poly);
      const from = V3(A[0], A[1], 13.5), to = V3(B[0], B[1], 13.5);
      const off = new THREE.Vector3(-(to.z - from.z), 0, to.x - from.x).normalize().multiplyScalar(1.6); from.add(off); to.add(off);
      const d = to.clone().sub(from); const len = d.length(); d.normalize();
      const s0 = from.clone().add(d.clone().multiplyScalar(len * 0.15)); const color = v >= 1 ? css('--alert') : css('--ink');
      corrGroup.add(new THREE.ArrowHelper(d, s0, len * 0.7, color, 2.2, 1.4));
      const lab = textSprite(`−${v.toFixed(1)} h`, '#ffffff', color, 24); lab.position.copy(s0.clone().add(d.clone().multiplyScalar(len * 0.35))).add(new THREE.Vector3(0, 1.4, 0)); corrGroup.add(lab);
    });
  });
}
function buildVis() {
  const ray = new THREE.Raycaster();
  const matHit = new THREE.LineBasicMaterial({ color: css('--sun'), transparent: true, opacity: .85 });
  const matBlk = new THREE.LineBasicMaterial({ color: css('--muted'), transparent: true, opacity: .35 });
  Object.entries(OM().win).forEach(([id, W]) => {
    const own = lotById(id); const top = Math.max(...W.map(w => w.lv));
    W.filter(w => w.lv === top).filter((w, i) => i % 2 === 0).slice(0, 8).forEach(w => {
      const p = V3(w.p[0] + w.n[0] * 0.3, w.p[1] + w.n[1] * 0.3, w.p[2]); const base = Math.atan2(w.n[1], w.n[0]);
      for (let a = -60; a <= 60; a += 20) for (const dist of [8, 16]) {
        const ang = base + a * rad; const tx = w.p[0] + Math.cos(ang) * dist, ty = w.p[1] + Math.sin(ang) * dist;
        const target = V3(tx, ty, 1.2); const dir = target.clone().sub(p); const L = dir.length(); dir.normalize();
        ray.set(p, dir); ray.far = L; const hit = ray.intersectObjects(buildMeshes, false)[0];
        const inN = !hit && !pip(tx, ty, own.poly) && Z.lots.some(l => pip(tx, ty, l.poly));
        if (!hit && !inN) continue;
        visGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([p, hit ? hit.point : target]), hit ? matBlk : matHit));
        if (!hit) { const dot = new THREE.Mesh(new THREE.CircleGeometry(0.6, 10).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: css('--sun') })); dot.position.set(tx, 0.55, -ty); visGroup.add(dot); }
      }
    });
  });
}

// =============================================================== capa de suelo y sol
function setLegend(title, vmax, show = true) {
  $('#legend').hidden = !show; if (!show) return;
  $('#legTitle').textContent = title; $('#legBar').style.background = `linear-gradient(90deg,${HEAT.join(',')})`;
  $('#legTicks').innerHTML = [0, vmax / 3, 2 * vmax / 3, vmax].map(x => `<span>${x.toFixed(0)} h</span>`).join('');
}
const LAYER_T = { invierno: '21 de junio', equinoccio: 'equinoccio', verano: '21 de diciembre', verano_arb: '21 de diciembre, con arbolado' };
function applyLayer() {
  const key = state.layer; setOverlay(null); setLegend('', 0, false);
  if (LAYER_T[key] && mode === 'plan') {
    if (!heatTex[key]) heatTex[key] = makeHeat(key); setOverlay(heatTex[key], 1);
    setLegend(`Horas de sol directo · ${LAYER_T[key]}`, VMAX[key]);
    if (key === 'verano_arb') { $('#tTree').checked = true; treeGroup.visible = true; }
  } else if (key === 'reglas' && mode === 'proj' && P.rulesTex) {
    setOverlay(P.rulesTex, Z.hf.res);
    $('#legend').hidden = false; $('#legTitle').textContent = 'Lote de ficha · altura máxima admitida';
    $('#legBar').style.background = 'linear-gradient(90deg,#c9584a 0 20%,#f3e8c4 20% 40%,#e9d28c 40% 60%,#9fb3a6 60% 80%,#4d6a8a 80%)';
    $('#legTicks').innerHTML = '<span>retiro</span><span>3 m</span><span>6 m</span><span>9 m</span><span>15 m</span>';
  } else if (key === 'proyecto' && mode === 'proj' && P.heatTex) {
    setOverlay(P.heatTex, 1); setLegend('Horas de sol · 21 de junio · con su proyecto', 9.5);
  }
  const lit = key === 'live';
  sun.intensity = lit ? 2.4 : 1.2; hemi.intensity = lit ? 0.75 : 1.35;
}
function updateSun() {
  const { az, el } = sunPos(state.day, state.hour);
  const [x0, x1, y0, y1] = Z.win; const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2; const span = Math.max(x1 - x0, y1 - y0);
  const v = sunVec(az, Math.max(el, 0.5));
  sun.position.set(cx + v.x * span * 1.6, v.y * span * 1.6, -cy + v.z * span * 1.6); sun.visible = el > 0;
  if (el <= 0) hemi.intensity = 0.35; else hemi.intensity = state.layer === 'live' ? 0.75 : 1.35;
  if (sunMarker) world.remove(sunMarker); if (pathLine) world.remove(pathLine);
  const R = span * 0.75;
  sunMarker = new THREE.Mesh(new THREE.SphereGeometry(span * 0.018 + 0.8, 18, 12), new THREE.MeshBasicMaterial({ color: css('--sun') }));
  sunMarker.position.set(cx + v.x * R, v.y * R, -cy + v.z * R); sunMarker.visible = el > 0; world.add(sunMarker);
  const pts = []; for (let h = 4; h <= 22; h += 0.1) { const s = sunPos(state.day, h); if (s.el > 0) { const w = sunVec(s.az, s.el); pts.push(new THREE.Vector3(cx + w.x * R, w.y * R, -cy + w.z * R)); } }
  pathLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineDashedMaterial({ color: css('--sun'), dashSize: 2, gapSize: 1.5 }));
  pathLine.computeLineDistances(); pathLine.visible = $('#tPath').checked; world.add(pathLine);
  let rise = null, set = null; for (let h = 4; h <= 22; h += 1 / 60) { const s = sunPos(state.day, h).el; if (s > 0 && rise === null) rise = h; if (s > 0) set = h; }
  $('#sunbox').innerHTML = `<div>sol · az <b>${az.toFixed(0)}°</b> (${card(az)}) · alt <b>${el.toFixed(1)}°</b></div><div>sale ${fmtH(rise)} · se pone ${fmtH(set)}</div><div>día solar ${(set - rise).toFixed(1)} h</div>`;
  $('#dayOut').textContent = fmtDay(state.day); $('#hourOut').textContent = fmtH(state.hour) + (el <= 0 ? ' · sin sol' : '');
}

// =============================================================== panel PLAN
function pill(v, good, mid) { return `<span class="pill ${v >= good ? 'good' : v >= mid ? 'mid' : 'bad'}">${v.toFixed(1)} h</span>`; }
function zoneHeader() {
  const m = Z.meta;
  return `<div class="ind"><div><span>Densidad</span><b>${m.dens}</b></div><div><span>FOS</span><b>${m.fos.toFixed(2)}</b></div><div><span>FOT</span><b>${m.fot.toFixed(1)}</b></div><div><span>Altura</span><b style="font-size:12px">${m.alt}</b></div>
  <div><span>Frente mín.</span><b>${m.frente} m</b></div><div><span>Sup. mín.</span><b>${m.supmin}</b></div><div><span>Parcelas</span><b>${m.lotes}</b></div><div><span>Sup. neta</span><b>${m.sup.toLocaleString('es-AR')}</b></div></div>`;
}
function fichaTable() {
  const rows = Z.read.ftxt || []; if (!rows.length) return '';
  const l = focusLots()[0], L = fichaLot(l);
  return `<h3>Exigencias de la ficha</h3><table class="disc"><tbody>${rows.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('')}</tbody></table>
  <p class="note">Lote tipo de ficha: ${nf(L.W, 0)} m de frente × ${nf(L.D)} m (${nf(L.area, 0)} m²). Las cotas verdes, azules y rojas del modelo son estas exigencias; los volúmenes de la lámina son una referencia gráfica de la tipología.</p>`;
}
function panelPlan() {
  const m = Z.meta, r = Z.read;
  let h = `<div class="eyebrow">Zona · ${zoneKey} · lámina ${Z.src}${Z.rep ? ' · módulo replicado' : ''}</div><h2>${m.nombre}</h2><p class="caracter">${m.caracter}</p>${zoneHeader()}
  <p class="note">${esc(Z.nota)} Indicadores: Anexo I, Ordenanza PPN-2026. Norte real.</p>
  <div class="text"><h3>Situación</h3><p>${r.situacion || ''}</p>${fichaTable()}<h3>Sol</h3><p>${r.sol || ''}</p><h3>Vecinos</h3><p>${r.vecinos || ''}</p><p class="q">${r.pregunta || ''}</p><div class="rec"><b>Propuesta para el estudio particularizado.</b> ${r.recomendacion || ''}</div></div>`;
  focusLots().forEach(l => {
    const s = lotStat(l.id);
    const svf = OM().svf[l.id], vis = OM().vis[l.id] || {};
    h += `<div class="lotcard"><h4>Lote ${l.id} · frente al ${s.front_or} · ${nf(l.W)} × ${nf(l.D)} m · ${l.area} m²</h4>
    <p class="note" style="margin:0 0 6px">Volumen de referencia de la lámina · suelo libre ${s.patio} m²${svf != null ? ` · cielo visible desde el patio ${pct(svf)}` : ''}</p>
    <table><thead><tr><th>Suelo libre del lote</th><th>21 jun</th><th>equin.</th><th>21 dic</th></tr></thead><tbody>
    <tr><td>Horas medias</td><td>${pill(s.sol.invierno.media, 4, 2)}</td><td class="num">${s.sol.equinoccio.media.toFixed(1)}</td><td class="num">${s.sol.verano.media.toFixed(1)}</td></tr>
    <tr><td>Área con ≥ 2 h</td><td class="num">${pct(s.sol.invierno.p2)}</td><td class="num">${pct(s.sol.equinoccio.p2)}</td><td class="num">${pct(s.sol.verano.p2)}</td></tr>
    <tr><td>21 dic con arbolado</td><td colspan="3" class="num">${s.sol.verano_arb.media.toFixed(1)} h</td></tr>
    <tr><td>Sombra 21 dic 15 h (con árboles)</td><td colspan="3" class="num">${pct(s.sombra['15'])} (${pct(s.sombra['15_arb'])}) · 17 h ${pct(s.sombra['17'])}</td></tr>
    </tbody></table>
    <table style="margin-top:8px"><thead><tr><th>Fachada · nivel</th><th>21 jun</th><th>equin.</th><th>21 dic</th></tr></thead><tbody>`;
    (OM().fach[l.id] || []).forEach(fc => fc.levels.forEach(lv => { h += `<tr><td>${fc.role} ${fc.orient} · ${lv.l === 0 ? 'PB' : lv.l + '°'}</td><td>${pill(lv.inv, 3, 2)}</td><td class="num">${lv.eq.toFixed(1)}</td><td class="num">${lv.ver.toFixed(1)}</td></tr>`; }));
    h += `</tbody></table><p class="note">Fachadas: máximo de horas de sol en algún punto de la cara (21 jun) y medias en equinoccio y verano. Profundidad visual desde el último piso: ${Object.entries(vis).map(([k, v]) => `${k} ${v.orient} ${pct(v.libre)} libre a 120 m`).join(' · ') || '—'}.</p></div>`;
  });
  h += `<h3>Correspondencias con los vecinos</h3><div style="overflow-x:auto"><table><thead><tr><th>Par</th><th>sol que quita<br>21 jun</th><th>recibe<br>21 jun</th><th>ve del vecino</th><th>es visto</th></tr></thead><tbody>`;
  OM().pairs.forEach(p => { h += `<tr><td>${p.a} → ${p.b} <span class="note">(${p.zb}, ${p.rel})</span></td><td>${p.inv_ab >= 1 ? pill(-p.inv_ab, 0, -0.99).replace('-', '−') : `<span class="num">${p.inv_ab.toFixed(2)} h</span>`}</td><td class="num">${p.inv_ba.toFixed(2)} h</td><td class="num">${p.vis_ab} m²${p.d_ab ? ` · ${nf(p.d_ab)} m` : ''}</td><td class="num">${p.vis_ba} m²${p.d_ba ? ` · ${nf(p.d_ba)} m` : ''}</td></tr>`; });
  h += `</tbody></table></div><p class="note">"Sol que quita": horas medias de sol directo que pierde el suelo libre del vecino por los volúmenes del lote (21 de junio, sin arbolado). "Ve del vecino": m² de suelo libre vecino visibles desde ventanas de pisos altos (≤ 12 m, cono de ±65°) y distancia mínima.</p>
  <p class="hint">¿Tiene un proyecto para una parcela de esta zona? Abra <b>Mi proyecto</b> para verificarlo contra las exigencias de la ficha y medir su sol y el de sus vecinos.</p>`;
  h += `<details><summary>Lecturas generales del Plan</summary><dl class="gen">${D.general.map(g => `<dt>${g[0]}</dt><dd>${g[1]}</dd>`).join('')}</dl></details>
  <details><summary>Método y supuestos</summary><p class="note">Geometría: las caras de la lámina ${Z.src} exportadas desde SketchUp sin modificar (edificios, cercos, solados, setos y alambrados; los setos y alambrados no se cuentan como obstáculo para el sol). ${Z.rep ? 'La lámina construye un solo lote: su módulo se repitió en los lotes linderos para leer la vecindad. ' : ''}Arbolado: copas de las láminas, solo en el escenario de verano con árboles (caducifolios). Posición solar: algoritmo NOAA para ${Math.abs(D.lat).toFixed(4)}° S, ${Math.abs(D.lon).toFixed(4)}° O (geolocalización de los propios modelos), hora oficial UTC−3, pasos de 10 min con el sol a más de 2°. Norte real: la trama girada según el Plano Director (Av. Scully a 134°); el norte de las láminas es solo gráfico. Las medidas exigidas son las de las fichas; las de las láminas son gráficas. Suelo analizado en grilla de 0,5 m (mapas a 1 m). Fachadas por nivel (cada 3 m, puntos a 1,5 m del piso) y visuales por trazado de rayos sobre una grilla de alturas.</p></details>`;
  $('#panel').innerHTML = h;
}

// =============================================================== MI PROYECTO
let canSave = STANDALONE;
const downloadsP = STANDALONE ? Promise.resolve(null) : new Promise(res => { let n = 0; const tryUse = () => { if (window.claude && window.claude.use) window.claude.use('downloads').then(res, () => res(null)); else if (n++ < 10) setTimeout(tryUse, 500); else res(null); }; tryUse(); });
downloadsP.then(d => { if (d) { canSave = true; const b = document.getElementById('pSave'); if (b) b.hidden = false; } });
const P = { lotId: null, tris: null, name: null, rot: 0, du: 0, dv: 0, units: 1, up: 'y', res: null, rulesTex: null, heatTex: null, busy: false };

// marco del lote: d = hacia el fondo, r = hacia la derecha mirando desde la calle, origen en la esquina izquierda de la L.M.
function lotFrame(l) {
  const o = l.o, d = l.d, r = l.r;
  const toXY = (u, v) => [o[0] + r[0] * u + d[0] * v, o[1] + r[1] * u + d[1] * v];
  const toRule = (x, y) => { const px = x - o[0], py = y - o[1]; return [px * r[0] + py * r[1], px * d[0] + py * d[1]]; };
  return { toXY, toRule, W: l.W, D: l.D, frontBearing: bearingLocal(-d[0], -d[1]), leftBearing: bearingLocal(-r[0], -r[1]) };
}
const lotRules = l => fichaRules(l);
const PL = () => fichaLot(lotById(P.lotId)); // lote de proyecto: medidas de la ficha
function decodeHF() { // grilla de alturas de la lámina sin el lote del proyecto
  const { W, H } = Z.hf; const a = b64u8(Z.hf.others); const BH = new Float32Array(W * H); for (let k = 0; k < a.length; k++) BH[k] = a[k] / 10;
  const LH = new Float32Array(W * H);
  focusLots().forEach(q => { const e = lotHF(q.id); if (!e) return; const T = q.id === P.lotId ? LH : BH; for (let j = 0; j < e.h; j++) for (let i = 0; i < e.w; i++) { const k = (e.j0 + j) * W + e.i0 + i, v = e.v[j * e.w + i]; if (v > T[k]) T[k] = v; } });
  return { BH, LH, W, H };
}

function buildProject() {
  if (!P.lotId || !D.zones[zoneKey].lots.find(l => l.id === P.lotId && l.focus)) P.lotId = D.zones[zoneKey].lots.find(l => l.focus).id;
  buildBase(P.lotId);
  envGroup.visible = $('#tEnv').checked;
  P.res = null; P.heatTex = null;
  P.rulesTex = makeRulesTex();
  if (state.layer === 'proyecto' || LAYER_T[state.layer]) setLayer('reglas');
  placeModel();
  applyLayer(); updateSun(); panelProject();
}
function makeRulesTex() {
  const l = PL(), F = lotFrame(l), rule = rulesFor(l); const { LH, W, H } = decodeHF(); const R = Z.hf.res; const [x0, , y0] = Z.win;
  const c = document.createElement('canvas'); c.width = W; c.height = H; const ctx = c.getContext('2d'); const img = ctx.createImageData(W, H);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const x = x0 + (i + .5) * R, y = y0 + (j + .5) * R; const k = ((H - 1 - j) * W + i) * 4;
    if (!pip(x, y, l.poly)) { img.data[k + 3] = 0; continue; }
    const [u, v] = F.toRule(x, y); const q = rule(u, v); let rgb;
    if (q.a === 0) rgb = ((i + j) % 4 < 2) ? [201, 88, 74] : [228, 160, 150];
    else if (q.a <= 3.5) rgb = [243, 232, 196]; else if (q.a <= 6.5) rgb = [233, 210, 140]; else if (q.a <= 9.5) rgb = [159, 179, 166]; else rgb = [77, 106, 138];
    img.data[k] = rgb[0]; img.data[k + 1] = rgb[1]; img.data[k + 2] = rgb[2]; img.data[k + 3] = 230;
  }
  ctx.putImageData(img, 0, 0); const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace; t.userData = { W, H }; return t;
}

// ---------- carga de archivos
async function loadFile(file) {
  const name = file.name, ext = name.split('.').pop().toLowerCase();
  status(`Leyendo ${name}…`);
  try {
    let root;
    if (ext === 'skp') { status(''); showMsg(`<b>Archivo SketchUp (.skp).</b> El formato .skp es cerrado y no puede leerse fuera de SketchUp. Expórtelo desde SketchUp con <i>Archivo → Exportar → Modelo 3D</i> como <b>COLLADA (.dae)</b> (disponible en todas las versiones de escritorio) u <b>OBJ</b> (Pro), y cárguelo acá. En SketchUp Free (web) use <i>Descargar → STL</i>.`); return; }
    if (ext === 'obj') root = new OBJLoader().parse(await file.text());
    else if (ext === 'dae') root = new ColladaLoader().parse(await file.text(), '').scene;
    else if (ext === 'glb') root = await loadGLB(file);
    else if (ext === 'gltf') root = await new Promise(async (res, rej) => new GLTFLoader().parse(await file.text(), '', g => res(g.scene), rej));
    else if (ext === 'stl') { const g = new STLLoader().parse(await file.arrayBuffer()); root = new THREE.Mesh(g); if (P.up === 'y') { $('#pUp').value = 'z'; P.up = 'z'; } }
    else { showMsg('Formato no reconocido. Use .obj, .dae, .glb o .stl.'); status(''); return; }
    if (ext === 'dae') { $('#pUp').value = 'y'; P.up = 'y'; }
    P.rawRoot = root; P.name = name; extractTris(); suggestPlacement(); placeModel();
    status(`${name} · ${(P.tris.length / 9).toLocaleString('es-AR')} triángulos · ${nf(P.ext[0])} × ${nf(P.ext[1])} m en planta · ${nf(P.ext[2])} m de alto`);
    $('#pAnalyze').disabled = false; showMsg('');
  } catch (e) { console.error(e); status(''); showMsg('No se pudo leer el archivo: ' + esc(e.message || e)); }
}
async function loadGLB(file) { return new Promise(async (res, rej) => new GLTFLoader().parse(await file.arrayBuffer(), '', g => res(g.scene), rej)); }
function extractTris() {
  const root = P.rawRoot; root.updateMatrixWorld(true);
  const arr = []; const v = new THREE.Vector3(); const s = P.units;
  root.traverse(o => {
    if (!o.isMesh || !o.geometry || !o.geometry.attributes.position) return;
    const pos = o.geometry.attributes.position, idx = o.geometry.index;
    const n = idx ? idx.count : pos.count;
    for (let i = 0; i < n; i++) {
      const k = idx ? idx.getX(i) : i; v.fromBufferAttribute(pos, k).applyMatrix4(o.matrixWorld);
      if (P.up === 'y') arr.push(v.x * s, -v.z * s, v.y * s); else arr.push(v.x * s, v.y * s, v.z * s);
    }
  });
  P.src = new Float32Array(arr);
  normalizeTris();
}
function normalizeTris() { // aplica rotación y lleva el mínimo a (0,0,0): u = x (izquierda → derecha), v = y (frente → fondo)
  const a = P.src, out = new Float32Array(a.length); const c = Math.cos(P.rot * rad), sn = Math.sin(P.rot * rad);
  let mx = Infinity, my = Infinity, mz = Infinity, Mx = -Infinity, My = -Infinity, Mz = -Infinity;
  for (let i = 0; i < a.length; i += 3) { const x = a[i] * c - a[i + 1] * sn, y = a[i] * sn + a[i + 1] * c, z = a[i + 2]; out[i] = x; out[i + 1] = y; out[i + 2] = z; if (x < mx) mx = x; if (y < my) my = y; if (z < mz) mz = z; if (x > Mx) Mx = x; if (y > My) My = y; if (z > Mz) Mz = z; }
  for (let i = 0; i < out.length; i += 3) { out[i] -= mx; out[i + 1] -= my; out[i + 2] -= mz; }
  P.tris = out; P.ext = [Mx - mx, My - my, Mz - mz];
}
function suggestPlacement() {
  const l = PL(); const R = lotRules(l);
  const free = l.W - R.li - R.ld;
  P.du = R.li + Math.max(0, (free - P.ext[0]) / 2); P.dv = R.rf;
  $('#pDu') && ($('#pDu').value = P.du.toFixed(2)); $('#pDv') && ($('#pDv').value = P.dv.toFixed(2));
}
function placedTris() {
  const l = PL(), F = lotFrame(l); const a = P.tris, out = new Float32Array(a.length);
  for (let i = 0; i < a.length; i += 3) { const [x, y] = F.toXY(a[i] + P.du, a[i + 1] + P.dv); out[i] = x; out[i + 1] = y; out[i + 2] = a[i + 2]; }
  return out;
}
function placeModel() {
  if (projMesh) { world.remove(projMesh); projMesh.traverse(o => o.geometry && o.geometry.dispose()); projMesh = null; }
  markGroup && markGroup.clear();
  if (!P.tris) { renderResults(); return; }
  const t = placedTris(); const g = new Float32Array(t.length);
  for (let i = 0; i < t.length; i += 3) { g[i] = t[i]; g[i + 1] = t[i + 2]; g[i + 2] = -t[i + 1]; }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(g, 3)); geo.computeVertexNormals();
  projMesh = new THREE.Group();
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: new THREE.Color('#8fb3cf'), roughness: .7, side: THREE.DoubleSide }));
  m.castShadow = true; m.receiveShadow = true; projMesh.add(m);
  projMesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 25), new THREE.LineBasicMaterial({ color: 0x1f3550, transparent: true, opacity: .6 })));
  world.add(projMesh);
  P.res = null; P.heatTex = null; renderResults();
}

// ---------- ejemplo: un volumen que excede a propósito el de la lámina
function exampleModel() {
  const l = PL(); const R = lotRules(l); const H = R.H + 3.2; const w = l.W * 0.85, d = l.D * 0.62;
  const g = new THREE.BoxGeometry(w, H, d); g.translate(w / 2, H / 2, d / 2); // y arriba; -z → v: el frente queda en v = 0
  const g2 = new THREE.BoxGeometry(w * 0.45, 3, d * 0.25); g2.translate(w * 0.225, H + 1.5, d * 0.8);
  const root = new THREE.Group(); root.add(new THREE.Mesh(g)); root.add(new THREE.Mesh(g2));
  P.up = 'y'; $('#pUp').value = 'y'; P.units = 1; $('#pUnits').value = '1'; P.rot = 0;
  P.rawRoot = root; P.name = 'ejemplo.obj'; extractTris(); P.du = 0; P.dv = 0; $('#pDu').value = '0.00'; $('#pDv').value = '0.00'; placeModel();
  status(`Ejemplo: volumen de ${nf(w)} × ${nf(d)} m y ${nf(H)} m de alto sobre la línea municipal, con errores intencionales`);
  $('#pAnalyze').disabled = false;
}

// =============================================================== ANÁLISIS
const sleep = () => new Promise(r => setTimeout(r, 0));
function progress(f, msg) { $('#pProg').style.width = (f * 100).toFixed(0) + '%'; if (msg) status(msg); }
function status(t) { const el = $('#pStatus'); if (el) el.textContent = t; }
function showMsg(h) { const el = $('#pMsg'); if (el) { el.innerHTML = h; el.hidden = !h; } }

function rasterize(tris, G, H, R, x0, y0) {
  for (let i = 0; i < tris.length; i += 9) {
    const ax = tris[i], ay = tris[i + 1], az = tris[i + 2], bx = tris[i + 3], by = tris[i + 4], bz = tris[i + 5], cx = tris[i + 6], cy = tris[i + 7], cz = tris[i + 8];
    const den = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy); if (Math.abs(den) < 1e-9) continue;
    const i0 = Math.max(0, Math.floor((Math.min(ax, bx, cx) - x0) / R)), i1 = Math.min(G.W - 1, Math.floor((Math.max(ax, bx, cx) - x0) / R));
    const j0 = Math.max(0, Math.floor((Math.min(ay, by, cy) - y0) / R)), j1 = Math.min(G.H - 1, Math.floor((Math.max(ay, by, cy) - y0) / R));
    for (let j = j0; j <= j1; j++) for (let ii = i0; ii <= i1; ii++) {
      const px = x0 + (ii + .5) * R, py = y0 + (j + .5) * R;
      const w1 = ((by - cy) * (px - cx) + (cx - bx) * (py - cy)) / den, w2 = ((cy - ay) * (px - cx) + (ax - cx) * (py - cy)) / den, w3 = 1 - w1 - w2;
      if (w1 < -1e-6 || w2 < -1e-6 || w3 < -1e-6) continue;
      const z = w1 * az + w2 * bz + w3 * cz; const k = j * G.W + ii; if (z > H[k]) H[k] = z;
    }
  }
}
function sunSteps(doy, step = 1 / 6) {
  const out = []; for (let t = 4; t <= 22; t += step) { const s = sunPos(doy, t); if (s.el > 2) { const v = sunLocal(s.az, s.el); const hz = Math.hypot(v[0], v[1]); out.push({ t, dx: v[0] / hz, dy: v[1] / hz, tan: Math.tan(s.el * rad), v }); } }
  return out;
}
function makeOcc(HF, G, R, x0, y0) {
  let maxH = 0; for (let k = 0; k < HF.length; k++) if (HF[k] > maxH) maxH = HF[k];
  return (x, y, z, s, skip = 0.25) => {
    if (z >= maxH) return false;
    const tmax = (maxH - z) / s.tan;
    for (let t = skip; t <= tmax; t += R * 0.7) {
      const px = x + s.dx * t, py = y + s.dy * t; const i = Math.floor((px - x0) / R), j = Math.floor((py - y0) / R);
      if (i < 0 || j < 0 || i >= G.W || j >= G.H) return false;
      if (HF[j * G.W + i] > z + t * s.tan) return true;
    }
    return false;
  };
}
const ownerCache = {};
function ownerGrid(SW, SH, x0, y0) { // dueño de cada celda de 1 m
  const k = zoneKey; if (ownerCache[k]) return ownerCache[k];
  const o = new Int16Array(SW * SH).fill(-1);
  Z.lots.forEach((l, li) => {
    const xs = l.poly.map(p => p[0]), ys = l.poly.map(p => p[1]);
    const i0 = Math.max(0, Math.floor(Math.min(...xs) - x0)), i1 = Math.min(SW - 1, Math.ceil(Math.max(...xs) - x0));
    const j0 = Math.max(0, Math.floor(Math.min(...ys) - y0)), j1 = Math.min(SH - 1, Math.ceil(Math.max(...ys) - y0));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) if (pip(x0 + i + .5, y0 + j + .5, l.poly)) o[j * SW + i] = li;
  });
  return (ownerCache[k] = o);
}

async function analyze() {
  if (!P.tris || P.busy) return; P.busy = true; $('#pAnalyze').disabled = true;
  try {
    const l = PL(), F = lotFrame(l), rule = rulesFor(l), RL = lotRules(l), meta = Z.meta;
    const [x0, , y0] = Z.win; const R = Z.hf.res;
    const { BH, LH, W: GW, H: GH } = decodeHF(); const G = { W: GW, H: GH };
    progress(.03, 'Rasterizando el proyecto…'); await sleep();
    const PH = new Float32Array(G.W * G.H); rasterize(placedTris(), G, PH, R, x0, y0);
    const AH = new Float32Array(G.W * G.H); const LA = new Float32Array(G.W * G.H);
    for (let k = 0; k < AH.length; k++) { AH[k] = Math.max(PH[k], BH[k]); LA[k] = Math.max(LH[k], BH[k]); }
    const cellA = R * R, area = l.area;
    // ----- normativa (ficha 2026) y volumen de la lámina
    let cov = 0, built = 0, hmax = 0, hmaxPos = null, outside = 0, outsidePos = [0, 0, 0];
    const inv = { lateral: { a: 0, s: [0, 0], h: 0 }, frente: { a: 0, s: [0, 0], h: 0 }, fondo: { a: 0, s: [0, 0], h: 0 } };
    const exc = { a: 0, s: [0, 0], max: 0, pos: null, allowed: 0 };
    for (let j = 0; j < G.H; j++) for (let i = 0; i < G.W; i++) {
      const k = j * G.W + i, h = PH[k]; if (h < 0.3) continue;
      const x = x0 + (i + .5) * R, y = y0 + (j + .5) * R;
      if (!pip(x, y, l.poly)) { outside += cellA; outsidePos = [x, y, h]; continue; }
      if (h > 2.4) { cov += cellA; built += cellA * Math.max(1, Math.round(h / 3.05)); }
      if (h > hmax) { hmax = h; hmaxPos = [x, y, h]; }
      const [u, v] = F.toRule(x, y); const q = rule(u, v);
      if (q.a === 0 && h > 2.4) { const o = inv[q.c]; if (o) { o.a += cellA; o.s[0] += x * cellA; o.s[1] += y * cellA; o.h = Math.max(o.h, h); } continue; }
      if (q.a > 0 && h > q.a + 0.3) { exc.a += cellA; if (h - q.a > exc.max) { exc.max = h - q.a; exc.pos = [x, y, h]; exc.allowed = q.a; } }
    }
    const fos = cov / area, fot = built / area;
    // ----- sol 21 de junio
    progress(.12, 'Calculando sol del 21 de junio…'); await sleep();
    const steps = sunSteps(172, 1 / 6), dt = 1 / 6;
    const occA = makeOcc(AH, G, R, x0, y0), occB = makeOcc(BH, G, R, x0, y0), occL = makeOcc(LA, G, R, x0, y0);
    const SW = Math.floor(G.W / 2), SH = Math.floor(G.H / 2);
    const li0 = Z.lots.indexOf(l.lam);
    const owner = Int16Array.from(ownerGrid(SW, SH, x0, y0)); // el lote del proyecto ocupa el lote de ficha
    for (let k = 0; k < owner.length; k++) { const inF = pip(x0 + (k % SW) + .5, y0 + ((k / SW) | 0) + .5, l.poly); if (inF) owner[k] = li0; else if (owner[k] === li0) owner[k] = -1; }
    const hours = new Float32Array(SW * SH).fill(-1), hoursB = new Float32Array(SW * SH).fill(-1), hoursL = new Float32Array(SW * SH).fill(-1);
    const adjIds = new Set(l.adj); const adj = Z.lots.filter(q => adjIds.has(q.id));
    for (let j = 0; j < SH; j++) {
      for (let i = 0; i < SW; i++) {
        const x = x0 + i + .5, y = y0 + j + .5; const kH = (2 * j) * G.W + 2 * i; const li = owner[j * SW + i];
        if (AH[kH] > 0.3) continue;
        let h = 0; for (const s of steps) if (!occA(x, y, 0.05, s)) h += dt; hours[j * SW + i] = h;
        if (li >= 0 && (adjIds.has(Z.lots[li].id) || li === li0)) {
          if (BH[kH] <= 0.3) { let hb = 0; for (const s of steps) if (!occB(x, y, 0.05, s)) hb += dt; hoursB[j * SW + i] = hb; }
          if (LA[kH] <= 0.3) { let hl = 0; for (const s of steps) if (!occL(x, y, 0.05, s)) hl += dt; hoursL[j * SW + i] = hl; }
        }
      }
      if (j % 4 === 0) { progress(.12 + .55 * j / SH); await sleep(); }
    }
    const stat = (idx, arr, mask) => { let n = 0, s = 0, p2 = 0; for (let k = 0; k < arr.length; k++) if (owner[k] === idx && arr[k] >= 0 && (!mask || mask[k] >= 0)) { n++; s += arr[k]; if (arr[k] >= 2) p2++; } return { n, mean: n ? s / n : 0, p2: n ? p2 / n : 0 }; };
    const own = stat(li0, hours), ownL = stat(li0, hoursL);
    const neigh = adj.map(q => { const idx = Z.lots.indexOf(q); const w = stat(idx, hours, hoursB), b = stat(idx, hoursB, hours), wl = stat(idx, hoursL, hoursB), bl = stat(idx, hoursB, hoursL); return { id: q.id, zone: q.zone, with: w.mean, without: b.mean, loss: b.mean - w.mean, lossRef: bl.mean - wl.mean, c: centroid(q.poly) }; });
    // sombra de verano 15 h
    const s15 = (() => { const s = sunPos(355, 15); const v = sunLocal(s.az, s.el); const hz = Math.hypot(v[0], v[1]); return { dx: v[0] / hz, dy: v[1] / hz, tan: Math.tan(s.el * rad) }; })();
    let pn = 0, psh = 0; for (let k = 0; k < hours.length; k++) if (owner[k] === li0 && hours[k] >= 0) { pn++; const i = k % SW, j = (k / SW) | 0; if (occA(x0 + i + .5, y0 + j + .5, 0.05, s15)) psh++; }
    const shade15 = pn ? psh / pn : 0;
    // ----- fachadas
    progress(.7, 'Analizando fachadas…'); await sleep();
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]]; const fac = {}; const facPts = [];
    for (let j = 1; j < G.H - 1; j++) for (let i = 1; i < G.W - 1; i++) {
      const k = j * G.W + i, h = PH[k]; if (h < 2) continue; if ((i + j) % 2) continue;
      for (const [dx, dy] of dirs) {
        const kn = (j + dy) * G.W + (i + dx); const hn = AH[kn];
        for (let lv = 0; lv * 3 + 1.5 < h; lv++) {
          const z = lv * 3 + 1.5; if (hn >= z) continue;
          const x = x0 + (i + .5) * R + dx * (R / 2 + .15), y = y0 + (j + .5) * R + dy * (R / 2 + .15);
          let hs = 0; for (const s of steps) { if (s.v[0] * dx + s.v[1] * dy > 0.1 && !occA(x, y, z, s, 0.2)) hs += dt; }
          const o = card(bearingLocal(dx, dy)); const key = o + '|' + lv; (fac[key] = fac[key] || []).push(hs);
          facPts.push({ x, y, z, dx, dy, lv, hs, o });
        }
      }
    }
    // ----- visuales sobre suelo libre vecino
    progress(.85, 'Visuales hacia los vecinos…'); await sleep();
    const vis = {}; const up = facPts.filter(p => p.lv >= 1).filter((p, i) => i % 3 === 0);
    for (let k = 0; k < hours.length; k++) {
      const li = owner[k]; if (li < 0 || li === li0 || hours[k] < 0 || !adjIds.has(Z.lots[li].id)) continue;
      const i = k % SW, j = (k / SW) | 0; const tx = x0 + i + .5, ty = y0 + j + .5;
      let seen = false, dmin = 1e9;
      for (const p of up) {
        const vx = tx - p.x, vy = ty - p.y, dz = 1.2 - p.z, dist = Math.hypot(vx, vy); if (dist > 12 || dist < 1) continue;
        if ((vx * p.dx + vy * p.dy) / dist < Math.cos(65 * rad)) continue;
        let blocked = false; const n = Math.ceil(dist / (R * .7));
        for (let s = 1; s < n; s++) { const f = s / n; const px = p.x + vx * f, py = p.y + vy * f, pz = p.z + dz * f; const hi = Math.floor((px - x0) / R), hj = Math.floor((py - y0) / R); if (AH[hj * G.W + hi] > pz) { blocked = true; break; } }
        if (!blocked) { seen = true; dmin = Math.min(dmin, Math.hypot(vx, vy, dz)); break; }
      }
      if (seen) { const id = Z.lots[li].id; vis[id] = vis[id] || { a: 0, d: 1e9 }; vis[id].a += 1; vis[id].d = Math.min(vis[id].d, dmin); }
    }
    progress(1, 'Listo.');
    P.heatTex = texFromGrid(SW, SH, hours, 9.5);
    P.res = { _h: { hours, hoursL, hoursB, owner, SW, SH }, l, RL, fos, fot, hmax, hmaxPos, inv, exc, outside, outsidePos, own, ownL, neigh, shade15, fac, facPts, vis, cov, built, orient };
    buildFindings(); renderResults(); setLayer('proyecto');
  } catch (e) { console.error(e); status('Error en el análisis: ' + (e.message || e)); }
  P.busy = false; $('#pAnalyze').disabled = false;
}

// ---------- hallazgos y recomendaciones
function buildFindings() {
  const r = P.res, m = Z.meta, l = r.l, RL = r.RL, F = []; const lotC = centroid(l.poly);
  const add = (sev, title, det, rec, pos) => F.push({ sev, title, det, rec, pos });
  // exigencias de la ficha
  if (r.fos > m.fos * 1.02) add('crit', `FOS ${nf(r.fos, 2)} supera el máximo de la ficha (${nf(m.fos, 2)})`, `Ocupa ${nf(r.cov, 0)} m² de un lote de ${nf(l.area, 0)} m²; la ficha admite ${nf(m.fos * l.area, 0)} m².`, 'Reducir la huella en planta baja y liberar suelo absorbente.', [lotC[0], lotC[1], 1]);
  else add('ok', `FOS ${nf(r.fos, 2)} dentro del máximo (${nf(m.fos, 2)})`, `Huella de ${nf(r.cov, 0)} m².`, '', null);
  if (r.fot > m.fot * 1.02) add('crit', `FOT estimado ${nf(r.fot, 2)} supera ${nf(m.fot, 1)}`, `Superficie estimada por niveles de 3 m: ${nf(r.built, 0)} m².`, 'Verificar con el cómputo de superficies del legajo; si se confirma, reducir pisos o huella.', [lotC[0], lotC[1], 4]);
  else add('ok', `FOT estimado ${nf(r.fot, 2)} (ficha ${nf(m.fot, 1)})`, `Estimación por niveles de 3 m: ${nf(r.built, 0)} m².`, '', null);
  if (r.hmax > RL.H + 1.2) add('crit', `Altura ${nf(r.hmax)} m supera ${m.alt} (${nf(RL.H)} m)`, `Exceso de ${nf(r.hmax - RL.H)} m sobre la altura de la ficha.`, 'Eliminar el último nivel o resolver la terraza o el tanque dentro de la altura admitida.', r.hmaxPos);
  else if (r.hmax > RL.H + 0.3) add('aten', `Altura ${nf(r.hmax)} m roza el máximo (${nf(RL.H)} m)`, 'El excedente es menor a 1,2 m: puede tratarse de parapetos o tanques.', 'Confirmar que el excedente sea un elemento técnico admitido.', r.hmaxPos);
  else add('ok', `Altura ${nf(r.hmax)} m dentro de ${m.alt} (${nf(RL.H)} m)`, '', '', null);
  if (r.outside > 1) add('crit', `${nf(r.outside, 0)} m² fuera del lote de ficha`, `Parte del modelo cae fuera del lote tipo de ${nf(l.W, 0)} × ${nf(l.D)} m.`, 'Revisar la ubicación (desplazamientos) o el modelo.', r.outsidePos);
  const invTxt = { lateral: ['retiro lateral', `La ficha exige ${pct(RL.latp)} de lateral libre (${nf(Math.max(RL.li, RL.ld))} m): la franja que absorbe la propia sombra y protege al vecino.`], frente: ['retiro de frente', `La ficha exige ${pct(RL.ffp)} de retiro de frente (${nf(RL.rf)} m): el jardín soleado de la unidad.`], fondo: ['fondo libre', `La ficha exige ${pct(RL.fbp)} de fondo libre (${nf(RL.rb)} m): suelo absorbente y la mitad del intercambio de sol con el vecino de atrás.`] };
  for (const k of ['lateral', 'frente', 'fondo']) { const o = r.inv[k]; if (o.a > 0.5) add('crit', `Invade el ${invTxt[k][0]}: ${nf(o.a, 0)} m²`, `${invTxt[k][1]} Altura máxima dentro de la franja: ${nf(o.h)} m.`, `Retirar la edificación de la franja (ver capa "Ficha en el lote").`, [o.s[0] / o.a, o.s[1] / o.a, o.h]); }
  if (r.exc.a > 0.5) add('crit', `Supera la envolvente escalonada a 45° en ${nf(r.exc.a, 0)} m²`, `En el punto más desfavorable tiene ${nf(r.exc.pos[2])} m donde la ficha admite ${nf(r.exc.allowed)} m (pendiente de 45° desde 3 m en las líneas de retiro).`, 'Retranquear los pisos altos: cada nivel por encima de PB se retira 3 m más de la línea de retiro.', r.exc.pos);
  // sol propio
  const o = r.own;
  const cmpL = `Con el volumen de referencia de la lámina, el mismo suelo recibía ${nf(r.ownL.mean)} h.`;
  if (o.p2 < 0.5) add('crit', `Suelo libre con poco sol de invierno: ${pct(o.p2)} recibe ≥ 2 h`, `Media de ${nf(o.mean)} h el 21 de junio. ${cmpL}`, 'Reubicar el volumen hacia el lado opuesto al sol o bajar los pisos que sombrean el patio.', [lotC[0], lotC[1], 0.5]);
  else if (o.mean < 4) add('aten', `Patio de ${nf(o.mean)} h de sol medio el 21 de junio`, `${pct(o.p2)} del suelo libre recibe ≥ 2 h. ${cmpL}`, 'Ubicar los espacios de estar exteriores en la parte más soleada.', [lotC[0], lotC[1], 0.5]);
  else add('ok', `Patio soleado: ${nf(o.mean)} h medias el 21 de junio`, `${pct(o.p2)} del suelo libre con ≥ 2 h. ${cmpL}`, '', null);
  // vecinos
  r.neigh.forEach(nb => {
    const det = `El suelo libre de ${nb.id} (${nb.zone}) pasa de ${nf(nb.without)} h a ${nf(nb.with)} h. El volumen de referencia de la lámina le quitaba ${nf(Math.max(0, nb.lossRef))} h.`;
    if (nb.loss > 1.0) add('crit', `Le quita ${nf(nb.loss)} h de sol de invierno al vecino ${nb.id}`, det, nb.loss > nb.lossRef + 0.2 ? 'El proyecto sombrea más que el volumen de referencia: retranquear el volumen del lado de ese vecino o ubicar el vacío hacia donde cae la propia sombra.' : 'La pérdida es similar a la del volumen de referencia: acordar en el área de correspondencia arbolado caduco y vanos que la compensen.', [nb.c[0], nb.c[1], 0.5]);
    else if (nb.loss > 0.5 || (nb.loss > nb.lossRef + 0.3)) add('aten', `Sombra moderada sobre ${nb.id}: −${nf(nb.loss)} h`, det, 'Documentar en el estudio de asoleamiento y acordar el tratamiento del límite con el vecino.', [nb.c[0], nb.c[1], 0.5]);
  });
  if (!r.neigh.some(nb => nb.loss > 0.5)) add('ok', 'Sombra sobre vecinos dentro de lo tolerable', 'Ningún suelo lindero pierde más de 0,5 h el 21 de junio.', '', null);
  // fachadas
  const levels = {}; for (const [k, arr] of Object.entries(r.fac)) { const [ori, lv] = k.split('|'); const mx = Math.max(...arr); levels[lv] = levels[lv] || {}; levels[lv][ori] = mx; }
  r.facTable = levels;
  Object.entries(levels).forEach(([lv, os]) => {
    const best = Math.max(...Object.values(os)); const bo = Object.entries(os).sort((a, b) => b[1] - a[1])[0][0];
    const lab = lv === '0' ? 'PB' : `nivel ${lv}`;
    if (best < 2) { const p = r.facPts.filter(q => String(q.lv) === lv).sort((a, b) => b.hs - a.hs)[0]; add('crit', `${lab}: ninguna fachada recibe 2 h de sol el 21 de junio`, `La mejor es la ${bo} con ${nf(best)} h.`, 'Los locales de primera categoría de este nivel no tendrán sol de invierno: abrir hacia el norte (NE/NO) o retirar el volumen que lo obstruye.', p ? [p.x, p.y, p.z] : null); }
  });
  const worstO = new Set(); r.facPts.forEach(p => { if (['SO', 'SE', 'S'].includes(p.o) && p.hs < 1.5) worstO.add(p.o); });
  if (worstO.size) { const p = r.facPts.filter(q => worstO.has(q.o)).sort((a, b) => a.hs - b.hs)[0]; add('aten', `Fachadas ${[...worstO].join(' / ')} sin sol de invierno`, `Reciben entre 0 y ${nf(Math.max(...r.facPts.filter(q => worstO.has(q.o)).map(q => q.hs)))} h el 21 de junio.`, 'Toda unidad debe tener además una cara al norte (doble orientación); ubicar servicios y circulaciones sobre estas fachadas.', p ? [p.x, p.y, p.z] : null); }
  // visuales
  Object.entries(r.vis).forEach(([id, v]) => {
    if (v.a >= 20) add('aten', `Visual directa sobre el suelo libre de ${id}: ${nf(v.a, 0)} m² a ${nf(v.d)} m`, 'Desde ventanas de pisos altos se ve el patio vecino a menos de 12 m.', 'Incorporar parasoles, celosías o una pantalla vegetal acordada en el área de correspondencia.', (() => { const c = centroid(lotById(id).poly); return [c[0], c[1], 1.2]; })());
  });
  if (r.shade15 < 0.3) add('aten', `Patio expuesto en verano: ${pct(r.shade15)} en sombra a las 15 h del 21 de diciembre`, 'La edificación no aporta sombra suficiente en las horas de mayor calor.', 'Prever arbolado caduco para alcanzar ≥ 30% de sombra a las 15 h.', [lotC[0], lotC[1], 0.5]);
  const ord = { crit: 0, aten: 1, ok: 2 }; F.sort((a, b) => ord[a.sev] - ord[b.sev]);
  P.finds = F; drawMarkers();
}
function drawMarkers() {
  markGroup.clear(); let n = 0;
  P.finds.forEach(f => {
    if (!f.pos || f.sev === 'ok') { f.n = null; return; } n++; f.n = n;
    const [x, y, z] = f.pos; const color = f.sev === 'crit' ? css('--alert') : css('--sun');
    const top = Math.max(z, 0) + 6;
    markGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([V3(x, y, Math.max(z, 0.1)), V3(x, y, top)]), new THREE.LineBasicMaterial({ color, depthTest: false })));
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.55, 14, 10), new THREE.MeshBasicMaterial({ color, depthTest: false })); ball.position.copy(V3(x, y, Math.max(z, 0.1))); ball.renderOrder = 9; markGroup.add(ball);
    const s = textSprite(String(n), '#ffffff', color, 30, 2.4); s.position.copy(V3(x, y, top + 1.2)); markGroup.add(s);
  });
}

function renderResults() {
  const box = $('#pResults'); if (!box) return;
  if (!P.res) { box.innerHTML = P.tris ? '<p class="note">Ajuste la ubicación y presione <b>Analizar según PPN</b>.</p>' : ''; $('#pReport') && ($('#pReport').hidden = true); return; }
  const r = P.res, F = P.finds; const c = F.filter(f => f.sev === 'crit').length, a = F.filter(f => f.sev === 'aten').length, o = F.filter(f => f.sev === 'ok').length;
  let h = `<div class="score"><div class="c"><b>${c}</b><span>críticos</span></div><div class="a"><b>${a}</b><span>atención</span></div><div class="o"><b>${o}</b><span>cumple</span></div></div>`;
  h += `<dl class="kv"><dt>Lote de ficha</dt><dd>${nf(r.l.W, 0)} × ${nf(r.l.D)} m · ${nf(r.l.area, 0)} m²</dd><dt>FOS / FOT</dt><dd>${nf(r.fos, 2)} / ${nf(r.fot, 2)} (ficha ${nf(Z.meta.fos, 2)} / ${nf(Z.meta.fot, 1)})</dd><dt>Altura</dt><dd>${nf(r.hmax)} m (ficha ${Z.meta.alt}, ${nf(r.RL.H)} m)</dd><dt>Patio 21 jun</dt><dd>${nf(r.own.mean)} h · ${pct(r.own.p2)} con ≥ 2 h</dd><dt>Sombra 21 dic 15 h</dt><dd>${pct(r.shade15)} del patio</dd></dl>`;
  h += `<h3>Puntos críticos y recomendaciones</h3><ol class="finds">`;
  F.forEach((f, i) => { h += `<li class="${f.sev}" tabindex="0" data-i="${i}"><div class="t">${f.n ? `<span class="n">${f.n}</span>` : `<span class="n">✓</span>`}<span>${esc(f.title)}</span></div>${f.det ? `<p class="d">${esc(f.det)}</p>` : ''}${f.rec ? `<p class="r">→ ${esc(f.rec)}</p>` : ''}</li>`; });
  h += `</ol>`;
  const lv = r.facTable; const oris = ['N', 'NE', 'NO', 'E', 'O', 'SE', 'SO', 'S'].filter(q => Object.values(lv).some(x => q in x));
  h += `<h3>Sol en fachadas · 21 de junio</h3><div style="overflow-x:auto"><table><thead><tr><th>Nivel</th>${oris.map(q => `<th>${q}</th>`).join('')}</tr></thead><tbody>`;
  Object.keys(lv).sort((a, b) => a - b).forEach(k => { h += `<tr><td>${k === '0' ? 'PB' : k + '°'}</td>${oris.map(q => q in lv[k] ? `<td>${pill(lv[k][q], 3, 2)}</td>` : '<td>—</td>').join('')}</tr>`; });
  h += `</tbody></table></div><p class="note">Máximo de horas de sol directo en algún punto de cada fachada (incidencia > 6°).</p>`;
  h += `<h3>Vecinos</h3><div style="overflow-x:auto"><table><thead><tr><th>Lote</th><th>sin el lote</th><th>con proyecto</th><th>pérdida</th><th>con vol. referencia</th></tr></thead><tbody>`;
  r.neigh.forEach(nb => { h += `<tr><td>${nb.id} <span class="note">(${nb.zone})</span></td><td class="num">${nf(nb.without)} h</td><td class="num">${nf(nb.with)} h</td><td>${pill(-nb.loss, -0.5, -1).replace(/-/, '−')}</td><td class="num">−${nf(Math.max(0, nb.lossRef))} h</td></tr>`; });
  h += `</tbody></table></div>`;
  h += `<div class="rec" style="margin-top:12px"><b>Criterio de la zona ${zoneKey}.</b> ${Z.read.recomendacion || ''}</div>`;
  box.innerHTML = h;
  box.querySelectorAll('.finds li').forEach(li => { const go = () => focusFinding(+li.dataset.i); li.onclick = go; li.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } }; });
  $('#pReport').hidden = false;
}
function focusFinding(i) {
  const f = P.finds[i]; if (!f.pos) return; const [x, y, z] = f.pos;
  const tgt = V3(x, y, Math.max(z, 1)); const off = camera.position.clone().sub(controls.target).setLength(55);
  anim = { t: 0, from: controls.target.clone(), to: tgt, cfrom: camera.position.clone(), cto: tgt.clone().add(off) };
}
let anim = null;

function reportText() {
  const r = P.res, RL = r.RL; let t = `PLAN PARTICULARIZADO NORTE · SAN ANDRÉS DE GILES\nVerificación de proyecto · ${zoneKey} ${Z.meta.nombre}\nArchivo: ${P.name}\nLote de ficha: ${nf(r.l.W, 0)} × ${nf(r.l.D)} m (${nf(r.l.area, 0)} m²) · norte real\n` +
    `Exigencias de la ficha: FOS ${nf(Z.meta.fos, 2)} · FOT ${nf(Z.meta.fot, 1)} · ${Z.meta.alt} (${nf(RL.H)} m) · retiro de frente ${pct(RL.ffp)} (${nf(RL.rf)} m) · fondo libre ${pct(RL.fbp)} (${nf(RL.rb)} m) · laterales ${nf(RL.li)} / ${nf(RL.ld)} m · pendiente 45° desde 3 m\n` +
    `Proyecto: FOS ${nf(r.fos, 2)} · FOT ${nf(r.fot, 2)} · altura ${nf(r.hmax)} m\nPatio 21 jun: ${nf(r.own.mean)} h medias, ${pct(r.own.p2)} con ≥ 2 h\n\nPUNTOS CRÍTICOS Y RECOMENDACIONES\n`;
  P.finds.forEach(f => { t += `\n[${{ crit: 'CRÍTICO', aten: 'ATENCIÓN', ok: 'CUMPLE' }[f.sev]}]${f.n ? ' ' + f.n + '.' : ''} ${f.title}\n${f.det ? '   ' + f.det + '\n' : ''}${f.rec ? '   → ' + f.rec + '\n' : ''}`; });
  t += `\nCriterio de zona: ${Z.read.recomendacion || ''}\n\nMétodo: sol calculado con norte real para ${Math.abs(D.lat).toFixed(4)}° S, ${Math.abs(D.lon).toFixed(4)}° O (21 de junio, pasos de 10 min); modelo convertido a grilla de alturas de 0,5 m; exigencias según la ficha PPN-2026 sobre el lote tipo (frente y superficie mínima); vecinos con los volúmenes de referencia de la lámina ${Z.src}. Resultado orientativo: no reemplaza el estudio particularizado firmado por el profesional.\n`;
  return t;
}

function panelProject() {
  const fl = focusLots(); const l = PL(); const F = lotFrame(l); const RL = lotRules(l);
  let h = `<div class="eyebrow">Mi proyecto · ${zoneKey}</div><h2>Verificar un proyecto</h2>
  <p class="caracter">Cargue el modelo 3D de su proyecto para una parcela ${zoneKey}. Se ubica en un lote tipo con el frente y la superficie mínima de la ficha, entre los vecinos de referencia de la lámina, y se contrasta con las exigencias de la ficha 2026 y con el sol del 21 de junio (norte real).</p>
  ${zoneHeader()}
  <div class="form">
    ${fl.length > 1 ? `<label class="f">Parcela<select id="pLot">${fl.map(q => `<option value="${q.id}" ${q.id === P.lotId ? 'selected' : ''}>Lote ${q.id} · frente al ${card(lotFrame(q).frontBearing)}</option>`).join('')}</select></label>` : ''}
    <p class="hint">Lote de ficha: ${nf(l.W, 0)} m de frente × ${nf(l.D)} m de fondo (${nf(l.area, 0)} m²), frente al <b>${card(F.frontBearing)}</b>. Exigencias: ${RL.rf ? `retiro de frente ${nf(RL.rf)} m, ` : ''}${RL.rb ? `fondo libre ${nf(RL.rb)} m, ` : ''}${RL.li ? `lateral izquierdo ${nf(RL.li)} m, ` : ''}${RL.ld ? `lateral derecho ${nf(RL.ld)} m, ` : ''}altura ${nf(RL.H)} m con pendiente de 45° desde 3 m. Modele en planta con el frente abajo (eje −Y) y el origen en la esquina izquierda de la línea municipal, mirando desde la calle.</p>
    <label class="drop" id="pDrop" for="pFile"><b>Cargar modelo</b><span class="note">.dae (SketchUp) · .obj · .glb · .stl — arrastre el archivo o haga clic</span><input type="file" id="pFile" accept=".obj,.dae,.glb,.gltf,.stl,.skp"></label>
    <div class="row"><button class="btn" id="pExample">Probar con un ejemplo</button></div>
    <div id="pMsg" class="hint" hidden></div>
    <div class="row">
      <label class="f">Unidades<select id="pUnits"><option value="1">metros</option><option value="0.01">centímetros</option><option value="0.001">milímetros</option><option value="0.0254">pulgadas</option></select></label>
      <label class="f">Eje vertical<select id="pUp"><option value="y">Y arriba (DAE, OBJ, glTF)</option><option value="z">Z arriba (STL, OBJ sin "swap YZ")</option></select></label>
    </div>
    <div class="row">
      <label class="f">Rotar<span style="display:flex;gap:4px"><button class="btn" id="pRotL" aria-label="Rotar 90° antihorario">⟲ 90°</button><button class="btn" id="pRotR" aria-label="Rotar 90° horario">⟳ 90°</button></span></label>
      <label class="f">Desde la izquierda (m)<input type="number" id="pDu" step="0.1" value="${P.du.toFixed(2)}"></label>
      <label class="f">Desde la L.M. (m)<input type="number" id="pDv" step="0.1" value="${P.dv.toFixed(2)}"></label>
      <button class="btn" id="pFit">Ubicación sugerida</button>
    </div>
    <button class="btn primary" id="pAnalyze" ${P.tris ? '' : 'disabled'}>Analizar según PPN</button>
    <div class="prog"><i id="pProg"></i></div>
    <div class="status" id="pStatus">${P.name ? esc(P.name) : 'Sin modelo cargado.'}</div>
  </div>
  <div id="pResults"></div>
  <div class="row" id="pReport" hidden style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
    <button class="btn" id="pCopy">Copiar informe</button><button class="btn" id="pSave" ${canSave ? '' : 'hidden'}>Descargar informe (.txt)</button>
  </div>
  <details><summary>Cómo se verifica</summary><p class="note">El modelo se convierte en una grilla de alturas de 0,5 m (cubiertas y losas; los voladizos cuentan como volumen lleno). Se controlan las exigencias de la ficha 2026 sobre el lote tipo: FOS, FOT (por niveles de 3 m), altura, retiros de frente, fondo y laterales, y la envolvente escalonada a 45° desde 3 m en las líneas de retiro. El sol se calcula con el norte real el 21 de junio cada 10 minutos en tres escenarios: con el proyecto, sin el lote y con el volumen de referencia de la lámina, para comparar la pérdida que el proyecto impone a cada vecino. También se calcula el sol en fachadas por nivel y la sombra del patio a las 15 h del 21 de diciembre. Las visuales se miden desde los pisos altos hacia el suelo libre lindero a menos de 12 m.</p></details>`;
  $('#panel').innerHTML = h;
  $('#pUnits').value = String(P.units); $('#pUp').value = P.up;
  const f = $('#pFile'); f.onchange = () => f.files[0] && loadFile(f.files[0]);
  const dz = $('#pDrop'); ['dragenter', 'dragover'].forEach(e => dz.addEventListener(e, ev => { ev.preventDefault(); dz.classList.add('over'); }));
  ['dragleave', 'drop'].forEach(e => dz.addEventListener(e, ev => { ev.preventDefault(); dz.classList.remove('over'); }));
  dz.addEventListener('drop', ev => { const file = ev.dataTransfer.files[0]; if (file) loadFile(file); });
  $('#pExample').onclick = exampleModel;
  $('#pUnits').onchange = e => { P.units = +e.target.value; if (P.rawRoot) { extractTris(); placeModel(); } };
  $('#pUp').onchange = e => { P.up = e.target.value; if (P.rawRoot) { extractTris(); placeModel(); } };
  $('#pRotL').onclick = () => { P.rot = (P.rot + 90) % 360; if (P.src) { normalizeTris(); placeModel(); } };
  $('#pRotR').onclick = () => { P.rot = (P.rot + 270) % 360; if (P.src) { normalizeTris(); placeModel(); } };
  $('#pDu').oninput = e => { P.du = +e.target.value || 0; placeModel(); };
  $('#pDv').oninput = e => { P.dv = +e.target.value || 0; placeModel(); };
  $('#pFit').onclick = () => { if (P.tris) { suggestPlacement(); placeModel(); } };
  $('#pAnalyze').onclick = analyze;
  if ($('#pLot')) $('#pLot').onchange = e => { P.lotId = e.target.value; buildProject(); };
  $('#pCopy').onclick = async () => { const t = reportText(); try { await navigator.clipboard.writeText(t); status('Informe copiado al portapapeles.'); } catch (e) { showMsg(`<textarea style="width:100%;height:160px" readonly>${esc(t)}</textarea>`); status('Seleccione y copie el texto.'); } };
  $('#pSave').onclick = async () => {
    const name = `PPN_${zoneKey}_${(P.name || 'proyecto').replace(/\.[^.]+$/, '')}_verificacion.txt`, text = reportText();
    if (STANDALONE) { const b = new Blob([text], { type: 'text/plain' }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; a.click(); return; }
    try { const dl = await downloadsP; if (!dl) return; await dl.save({ filename: name, data: text }); status('Informe guardado.'); }
    catch (e) { if (e && e.code === 'declined') return; status('No se pudo guardar el archivo; use "Copiar informe".'); }
  };
  renderResults();
}

// =============================================================== UI general
function setLayer(l) { state.layer = l; $$('#layer button').forEach(x => x.setAttribute('aria-pressed', x.dataset.l === l)); applyLayer(); }
function setMode(m) {
  mode = m; $$('#modes button').forEach(b => b.setAttribute('aria-pressed', b.dataset.m === m));
  $$('.pl').forEach(e => e.hidden = m !== 'plan'); $$('.pj').forEach(e => e.hidden = m !== 'proj');
  if (m === 'plan' && ['reglas', 'proyecto'].includes(state.layer)) state.layer = 'live';
  if (m === 'proj' && (LAYER_T[state.layer] || state.layer === 'live')) state.layer = 'reglas';
  $$('#layer button').forEach(x => x.setAttribute('aria-pressed', x.dataset.l === state.layer));
  rebuild();
  try { localStorage.setItem('ppn-mode', m); } catch (e) { }
}
function rebuild() { if (mode === 'plan') buildPlan(); else buildProject(); }
const zn = $('#zones');
Object.keys(D.zones).forEach(k => { const b = document.createElement('button'); b.textContent = k; b.setAttribute('aria-pressed', k === zoneKey); b.onclick = () => { zoneKey = k; zn.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b)); try { localStorage.setItem('ppn-zone', k); } catch (e) { } P.lotId = null; rebuild(); }; zn.appendChild(b); });
try { const s = localStorage.getItem('ppn-zone'); if (s && D.zones[s]) { zoneKey = s; zn.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x.textContent === s)); } } catch (e) { }
$$('#modes button').forEach(b => b.onclick = () => setMode(b.dataset.m));
$$('#presets button').forEach(b => b.onclick = () => { state.day = +b.dataset.d; $('#day').value = state.day; $$('#presets button').forEach(x => x.setAttribute('aria-pressed', x === b)); updateSun(); });
$('#day').oninput = e => { state.day = +e.target.value; $$('#presets button').forEach(x => x.setAttribute('aria-pressed', +x.dataset.d === state.day)); updateSun(); };
$('#hour').oninput = e => { state.hour = +e.target.value; updateSun(); };
$$('#layer button').forEach(b => b.onclick = () => { setLayer(b.dataset.l); updateSun(); });
$('#tCorr').onchange = e => corrGroup.visible = e.target.checked;
$('#tVis').onchange = e => visGroup.visible = e.target.checked;
$('#tEnv').onchange = e => envGroup && (envGroup.visible = e.target.checked);
$('#tRef').onchange = e => refGroup && (refGroup.visible = e.target.checked);
$('#tTree').onchange = e => treeGroup && (treeGroup.visible = e.target.checked);
$('#tPath').onchange = e => { if (pathLine) pathLine.visible = e.target.checked; };
let playing = false; $('#play').onclick = () => { playing = !playing; $('#play').textContent = playing ? '❚❚' : '▶'; };
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function resize() { const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
new ResizeObserver(resize).observe(canvas);
let last = performance.now();
function loop(t) {
  const dt = (t - last) / 1000; last = t;
  if (playing) { state.hour += dt * (reduce ? 0.5 : 1.2); if (state.hour > 21) state.hour = 5; $('#hour').value = state.hour; updateSun(); }
  if (anim) { anim.t = Math.min(1, anim.t + dt * 1.6); const k = anim.t * anim.t * (3 - 2 * anim.t); controls.target.lerpVectors(anim.from, anim.to, k); camera.position.lerpVectors(anim.cfrom, anim.cto, k); if (anim.t >= 1) anim = null; }
  controls.update(); renderer.render(scene, camera); requestAnimationFrame(loop);
}
new MutationObserver(() => rebuild()).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => rebuild());
let deferred = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; const b = $('#install'); if (b) b.hidden = false; });
if ($('#install')) $('#install').onclick = async () => { if (!deferred) return; deferred.prompt(); await deferred.userChoice; deferred = null; $('#install').hidden = true; };
let startMode = 'plan'; try { if (location.hash === '#proyecto' || localStorage.getItem('ppn-mode') === 'proj') startMode = 'proj'; } catch (e) { }
setMode(startMode); resize(); requestAnimationFrame(loop);
window.__ppn = { P, camera, controls, state, updateSun, decodeMap: k => decodeMap(k), analyze, exampleModel, setMode, loadFile, get Z() { return Z; } };
