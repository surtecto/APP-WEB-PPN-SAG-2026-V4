# -*- coding: utf-8 -*-
"""Análisis solar, visual y de correspondencias sobre la geometría exacta de las láminas (SketchUp)."""
import json, math, re
import numpy as np
import mapbox_earcut as earcut
from PIL import Image, ImageDraw
from shapely.geometry import Polygon, Point
from scenes import S

LAT, LON, TZ = -34.445527, -59.431995, -3.0          # geolocalización de los propios modelos SketchUp
RES = 0.5
DATES = {'invierno': (2026, 6, 21), 'equinoccio': (2026, 9, 22), 'verano': (2026, 12, 21)}

# ------------------------------------------------------------------ sol (NOAA)
def sun_position(y, m, d, hour):
    a = (14 - m) // 12; yy = y + 4800 - a; mm = m + 12 * a - 3
    jdn = d + (153 * mm + 2) // 5 + 365 * yy + yy // 4 - yy // 100 + yy // 400 - 32045
    ut = hour - TZ; jd = jdn - 0.5 + ut / 24.0; T = (jd - 2451545.0) / 36525.0
    L0 = (280.46646 + T * (36000.76983 + T * 0.0003032)) % 360
    M = 357.52911 + T * (35999.05029 - 0.0001537 * T); e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T)
    Mr = math.radians(M)
    C = math.sin(Mr) * (1.914602 - T * (0.004817 + 0.000014 * T)) + math.sin(2 * Mr) * (0.019993 - 0.000101 * T) + math.sin(3 * Mr) * 0.000289
    om = 125.04 - 1934.136 * T; lam = L0 + C - 0.00569 - 0.00478 * math.sin(math.radians(om))
    eps = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60 + 0.00256 * math.cos(math.radians(om))
    dec = math.asin(math.sin(math.radians(eps)) * math.sin(math.radians(lam)))
    yv = math.tan(math.radians(eps / 2)) ** 2; L0r = math.radians(L0)
    eot = 4 * math.degrees(yv * math.sin(2 * L0r) - 2 * e * math.sin(Mr) + 4 * e * yv * math.sin(Mr) * math.cos(2 * L0r) - 0.5 * yv * yv * math.sin(4 * L0r) - 1.25 * e * e * math.sin(2 * Mr))
    tst = (ut * 60 + eot + 4 * LON) % 1440; ha = math.radians(tst / 4 - 180); lat = math.radians(LAT)
    cz = max(-1, min(1, math.sin(lat) * math.sin(dec) + math.cos(lat) * math.cos(dec) * math.cos(ha)))
    el = 90 - math.degrees(math.acos(cz))
    az = (math.degrees(math.atan2(math.sin(ha), math.cos(ha) * math.sin(lat) - math.tan(dec) * math.cos(lat))) + 180) % 360
    return az, el

def frame(rot):
    """vectores (E,N) de los ejes +x y +y del modelo, con +y apuntando al rumbo rot"""
    ry = math.radians(rot); rx = math.radians(rot + 90)
    return np.array([math.sin(rx), math.cos(rx)]), np.array([math.sin(ry), math.cos(ry)])

def sun_local(az, el, rot):
    EX, EY = frame(rot)
    e = math.sin(math.radians(az)) * math.cos(math.radians(el)); n = math.cos(math.radians(az)) * math.cos(math.radians(el))
    return np.array([e * EX[0] + n * EX[1], e * EY[0] + n * EY[1], math.sin(math.radians(el))])

def bearing(nx, ny, rot):
    EX, EY = frame(rot); v = nx * EX + ny * EY
    return (math.degrees(math.atan2(v[0], v[1])) + 360) % 360

def compass(b):
    return ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'][int(((b % 360) + 22.5) // 45) % 8]

def series(key, rot, step=1 / 6):
    y, m, d = DATES[key]; out = []; t = 4.0
    while t <= 22.0:
        az, el = sun_position(y, m, d, t)
        if el > 2.0: out.append((t, az, el, sun_local(az, el, rot)))
        t += step
    return out

# ------------------------------------------------------------------ carga y clasificación
TREE_RE = re.compile(r'rbol|sauce|olmo|arce|serbal|fresno|tilo|jacarand|tipa|pl.tano', re.I)
ENT_RE = re.compile(r'hierba|agave|nora|pepper|sahir|andr.s|mesa|emparrado|farola|sentad|caminand|bici|autom|coche|persona|flor|arbusto|helecho|hiedra|planta|termotanque|silvester|chris|amaya|annouk', re.I)
LOW_MAT = re.compile(r'cercado|fencing', re.I)
HEDGE_MAT = re.compile(r'vegeta', re.I)
SKIP_MAT = re.compile(r'agua|metal rugoso', re.I)

def newell(P):
    n = np.zeros(3)
    for i in range(len(P)):
        a, b = P[i], P[(i + 1) % len(P)]
        n += [(a[1] - b[1]) * (a[2] + b[2]), (a[2] - b[2]) * (a[0] + b[0]), (a[0] - b[0]) * (a[1] + b[1])]
    l = np.linalg.norm(n); return n / l if l > 1e-9 else n

def triangulate(P, holes=()):
    P = np.asarray(P, float); n = newell(P)
    if not n.any(): return None
    ax = int(np.argmax(np.abs(n))); keep = [i for i in range(3) if i != ax]
    rings = [P] + [np.asarray(h, float) for h in holes if len(h) >= 3]
    V3 = np.vstack(rings); V2 = V3[:, keep]
    ends = np.cumsum([len(r) for r in rings]).astype(np.uint32)
    try:
        idx = earcut.triangulate_float64(V2, ends)
    except Exception:
        return None
    if len(idx) == 0: return None
    return V3[np.asarray(idx).reshape(-1, 3)]

def load(zone):
    sc = S[zone]; d = json.load(open(f'js/{sc["src"]}.json'))
    x0, x1, y0, y1 = sc['win']
    lots = sc['lots']; LP = [Polygon(l['poly']) for l in lots]
    LPb = [pg.buffer(0.35) for pg in LP]
    def owner(c):
        p = Point(c[0], c[1])
        for i, pg in enumerate(LP):
            if pg.contains(p): return i
        for i, pg in enumerate(LPb):
            if pg.contains(p): return i
        return -1
    faces = []      # dict(cls, mat, tris(N,3,3), owner, n, top, bot, grp)
    trees = []
    grp_top = {}
    raw = []
    for f in d['faces']:
        P = np.array(f['v'], float)
        c = P.mean(0)
        if not (x0 <= c[0] <= x1 and y0 <= c[1] <= y1): continue
        g = f['g']; m = f['m'] or ''
        last = g.split('/')[-1]
        if not m and not re.match(r'^(Grupo|Componente|Model)', last) and last:
            if TREE_RE.search(last):
                raw.append(('tree', g, P)); continue
            if ENT_RE.search(last) or True:
                continue
        if SKIP_MAT.search(m): continue
        raw.append(('geo', g, P, f, m))
        grp_top[g] = max(grp_top.get(g, -1), P[:, 2].max())
    tree_pts = {}
    for r in raw:
        if r[0] == 'tree':
            tree_pts.setdefault(r[1], []).append(r[2])
            continue
        _, g, P, f, m = r
        top, bot = P[:, 2].max(), P[:, 2].min()
        if top < 0.35 and np.ptp(P[:, 2]) < 0.2:
            cls = 'suelo'
        elif LOW_MAT.search(m):
            cls = 'malla'
        elif HEDGE_MAT.search(m):
            cls = 'seto'
        elif grp_top.get(g, 0) > 2.4 or top > 2.4:
            cls = 'edif'
        else:
            cls = 'cerco'
        T = triangulate(P, f.get('h') or [])
        if T is None: continue
        faces.append(dict(cls=cls, mat=m, tris=T, owner=owner(P.mean(0)), n=newell(P), top=top, bot=bot, grp=g))
    for e in d['ent']:
        C = np.array(e['c']); c = C.mean(0); h = np.ptp(C[:, 2])
        if not (x0 <= c[0] <= x1 and y0 <= c[1] <= y1) or h < 3.5 or not TREE_RE.search(e['n']): continue
        r = (np.ptp(C[:, 0]) + np.ptp(C[:, 1])) / 4
        if r > 7: continue
        trees.append(dict(x=c[0], y=c[1], r=r, zt=C[:, 2].max(), zb=C[:, 2].min() + 0.35 * h, owner=owner(c), name=e['n']))
    for g, Ps in tree_pts.items():
        C = np.vstack(Ps); c = C.mean(0); h = np.ptp(C[:, 2])
        if h < 3.5: continue
        r = (np.ptp(C[:, 0]) + np.ptp(C[:, 1])) / 4
        if r > 7: continue
        trees.append(dict(x=c[0], y=c[1], r=r, zt=C[:, 2].max(), zb=C[:, 2].min() + 0.35 * h, owner=owner(c), name=g.split('/')[-1]))
    # réplica del módulo de la lámina
    rep = sc.get('replicate')
    if rep:
        ids = [l['id'] for l in lots]; si = ids.index(rep['src']); cs = np.array(LP[si].centroid.coords[0])
        for tid in rep['to']:
            ti = ids.index(tid); dv = np.array(LP[ti].centroid.coords[0]) - cs
            for f in [f for f in faces if f['owner'] == si]:
                T = f['tris'].copy(); T[:, :, 0] += dv[0]; T[:, :, 1] += dv[1]
                faces.append(dict(f, tris=T, owner=ti, rep=True))
            for t in [t for t in trees if t['owner'] == si]:
                trees.append(dict(t, x=t['x'] + dv[0], y=t['y'] + dv[1], owner=ti))
    return dict(zone=zone, sc=sc, lots=lots, LP=LP, faces=faces, trees=trees, win=sc['win'])

# ------------------------------------------------------------------ grillas
class Grid:
    def __init__(self, win, res=RES):
        self.x0, self.x1, self.y0, self.y1 = win; self.res = res
        self.W = int(math.ceil((self.x1 - self.x0) / res)); self.H = int(math.ceil((self.y1 - self.y0) / res))
        xs = self.x0 + (np.arange(self.W) + 0.5) * res; ys = self.y0 + (np.arange(self.H) + 0.5) * res
        self.X, self.Y = np.meshgrid(xs, ys)   # fila j = y creciente
    def px(self, x, y):   # a píxeles de imagen PIL (fila 0 = y0)
        return ((np.asarray(x) - self.x0) / self.res, (np.asarray(y) - self.y0) / self.res)
    def poly_mask(self, poly):
        im = Image.new('1', (self.W, self.H), 0); dr = ImageDraw.Draw(im)
        px, py = self.px([p[0] for p in poly], [p[1] for p in poly])
        dr.polygon(list(zip(px, py)), fill=1)
        return np.array(im, bool)

def heightfield(G, faces, classes=('edif', 'cerco'), owner=None, exclude=None):
    Hf = np.zeros((G.H, G.W), np.float32)
    for f in faces:
        if f['cls'] not in classes: continue
        if owner is not None and f['owner'] != owner: continue
        if exclude is not None and f['owner'] == exclude: continue
        for T in f['tris']:
            a, b, c = T
            den = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1])
            if abs(den) < 1e-9: continue
            i0 = max(0, int((min(a[0], b[0], c[0]) - G.x0) / G.res)); i1 = min(G.W - 1, int((max(a[0], b[0], c[0]) - G.x0) / G.res))
            j0 = max(0, int((min(a[1], b[1], c[1]) - G.y0) / G.res)); j1 = min(G.H - 1, int((max(a[1], b[1], c[1]) - G.y0) / G.res))
            if i1 < i0 or j1 < j0: continue
            px = G.X[j0:j1 + 1, i0:i1 + 1]; py = G.Y[j0:j1 + 1, i0:i1 + 1]
            w1 = ((b[1] - c[1]) * (px - c[0]) + (c[0] - b[0]) * (py - c[1])) / den
            w2 = ((c[1] - a[1]) * (px - c[0]) + (a[0] - c[0]) * (py - c[1])) / den
            w3 = 1 - w1 - w2
            ins = (w1 >= -1e-6) & (w2 >= -1e-6) & (w3 >= -1e-6)
            if not ins.any(): continue
            z = w1 * a[2] + w2 * b[2] + w3 * c[2]
            sub = Hf[j0:j1 + 1, i0:i1 + 1]
            np.maximum(sub, np.where(ins, z, 0), out=sub)
    return Hf

def shadow_masks(G, faces, trees, s, groups, with_trees=False):
    """máscaras de sombra en el suelo por grupo de propietario (proyección de caras según el sol)"""
    k = s[:2] / s[2]
    ims = {g: Image.new('1', (G.W, G.H), 0) for g in groups}
    drs = {g: ImageDraw.Draw(im) for g, im in ims.items()}
    for f in faces:
        if f['cls'] in ('suelo', 'seto', 'malla') or f['top'] < 0.3: continue
        g = f['owner'] if f['owner'] in drs else -1
        dr = drs[g]
        for T in f['tris']:
            x = T[:, 0] - k[0] * T[:, 2]; y = T[:, 1] - k[1] * T[:, 2]
            px, py = G.px(x, y)
            dr.polygon(list(zip(px, py)), fill=1)
    if with_trees:
        ang = np.linspace(0, 2 * np.pi, 18, endpoint=False)
        for t in trees:
            g = t['owner'] if t['owner'] in drs else -1
            zc = (t['zb'] + t['zt']) / 2
            pts = []
            for z in (t['zb'], zc, t['zt']):
                rr = t['r'] * (1.0 if z == zc else 0.6)
                pts += [(t['x'] + rr * math.cos(a) - k[0] * z, t['y'] + rr * math.sin(a) - k[1] * z) for a in ang]
            from shapely.geometry import MultiPoint
            hull = MultiPoint(pts).convex_hull
            if hull.geom_type != 'Polygon': continue
            px, py = G.px(*np.array(hull.exterior.coords).T)
            drs[g].polygon(list(zip(px, py)), fill=1)
    return {g: np.array(im, bool) for g, im in ims.items()}

def march(Hf, G, P, D, maxd=None, start=0.3, step=None):
    """P (n,3) puntos, D (n,3) o (3,) direcciones unitarias. True si choca contra la grilla de alturas"""
    step = step or G.res * 0.7
    P = np.asarray(P, float); D = np.broadcast_to(np.asarray(D, float), P.shape)
    hz = np.hypot(D[:, 0], D[:, 1]); hz = np.where(hz < 1e-6, 1e-6, hz)
    hmax = float(Hf.max())
    tz = np.where(D[:, 2] > 1e-6, (hmax - P[:, 2]) / np.maximum(D[:, 2], 1e-6), 1e9)
    tlim = np.minimum(tz, maxd if maxd is not None else 1e9)
    tlim = np.minimum(tlim, math.hypot(G.x1 - G.x0, G.y1 - G.y0) / hz)
    hit = np.zeros(len(P), bool); t = start
    tmax = float(tlim.max()) if len(P) else 0
    while t <= tmax:
        act = (~hit) & (t <= tlim)
        if not act.any(): break
        q = P[act] + D[act] * t
        i = ((q[:, 0] - G.x0) / G.res).astype(int); j = ((q[:, 1] - G.y0) / G.res).astype(int)
        ok = (i >= 0) & (j >= 0) & (i < G.W) & (j < G.H)
        h = np.zeros(len(q)); h[ok] = Hf[j[ok], i[ok]]
        hit[np.where(act)[0][h > q[:, 2]]] = True
        t += step
    return hit

def lot_frame(l):
    f = np.array(l['front'], float); f /= np.linalg.norm(f); d = -f; r = np.array([d[1], -d[0]])
    P = np.array(l['poly'])
    v = (P - P[0]) @ d; vmin = v.min(); u = (P - P[0]) @ r; umin = u.min()
    o = P[0] + d * vmin + r * umin
    D = float(((P - o) @ d).max()); W = float(((P - o) @ r).max())
    return dict(o=o, d=d, r=r, D=D, W=W)

def levels_of(h):
    return np.maximum(1, np.round(h / 3.07)).astype(int)
