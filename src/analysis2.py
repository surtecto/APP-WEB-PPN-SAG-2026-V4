# -*- coding: utf-8 -*-
import json, math, sys, time
import numpy as np
from shapely.geometry import Polygon, Point
from engine2 import *

def hemisphere(n=700, seed=3):
    rng = np.random.default_rng(seed); u1, u2 = rng.random(n), rng.random(n)
    r = np.sqrt(u1); th = 2 * np.pi * u2
    return np.stack([r * np.cos(th), r * np.sin(th), np.sqrt(1 - u1)], 1)
HEMI = hemisphere()

def facade_points(sc, G, Hall, lot_idx, lot):
    pts = []
    fr = np.array(lot['front'], float); fr /= np.linalg.norm(fr)
    for f in sc['faces']:
        if f['cls'] != 'edif' or f['owner'] != lot_idx: continue
        n = f['n']
        if abs(n[2]) > 0.25: continue
        nh = np.array([n[0], n[1]]); l = np.linalg.norm(nh)
        if l < 1e-6: continue
        nh /= l; t = np.array([-nh[1], nh[0]])
        V = f['tris'].reshape(-1, 3); c = V[:, :2].mean(0)
        s = (V[:, :2] - c) @ t; smin, smax = s.min(), s.max()
        if smax - smin < 0.8: continue
        bot, top = V[:, 2].min(), V[:, 2].max()
        ss = np.arange(smin + 0.6, smax - 0.4 + 1e-6, 2.0) if smax - smin > 2.4 else np.array([(smin + smax) / 2])
        k = 0
        while True:
            z = 1.5 + 3 * k
            if z > top - 0.4: break
            if z >= bot + 0.4:
                for sv in ss:
                    p = c + t * sv
                    # orientación hacia afuera
                    def hat(q):
                        i = int((q[0] - G.x0) / G.res); j = int((q[1] - G.y0) / G.res)
                        return Hall[j, i] if 0 <= i < G.W and 0 <= j < G.H else 0
                    a, b = hat(p + nh * 0.6), hat(p - nh * 0.6)
                    if a < z - 0.3 and b >= z - 0.3: nn = nh
                    elif b < z - 0.3 and a >= z - 0.3: nn = -nh
                    else: continue      # medianera o cara interior
                    q = p + nn * 0.25
                    role = 'frente' if nn @ fr > 0.7 else ('contrafrente' if nn @ fr < -0.7 else 'lateral')
                    pts.append(dict(p=(float(q[0]), float(q[1]), float(z)), n=(float(nn[0]), float(nn[1])), lv=k, role=role))
            k += 1
    # quita duplicados muy próximos (caras coplanares superpuestas)
    out = []; seen = set()
    for p in pts:
        key = (round(p['p'][0], 0), round(p['p'][1], 0), p['lv'], round(p['n'][0], 1), round(p['n'][1], 1))
        if key in seen: continue
        seen.add(key); out.append(p)
    return out

def analyse(zone, mode='real'):
    t0 = time.time()
    sc = load(zone); G = Grid(sc['win']); lots = sc['lots']; LP = sc['LP']
    rot = sc['sc']['rot_real'] if mode == 'real' else 0.0
    Hb = heightfield(G, sc['faces'], classes=('edif',)); Hall = heightfield(G, sc['faces'])
    built = Hb > 0.3
    LM = [G.poly_mask(l['poly']) for l in lots]
    focus = [i for i, l in enumerate(lots) if l['focus']]
    # vecinos
    nb = {}
    for i in focus:
        L = []
        for j, pg in enumerate(LP):
            if j == i: continue
            dist = LP[i].distance(pg)
            if dist > 10.6: continue
            shared = LP[i].buffer(0.6).intersection(pg).area > 1
            fr = np.array(lots[i]['front'], float)
            dc = np.array(pg.centroid.coords[0]) - np.array(LP[i].centroid.coords[0])
            rel = 'fondo' if abs(dc @ fr) > 0.6 * np.linalg.norm(dc) else 'lateral'
            if not shared: rel = 'diagonal' if dist < 0.2 else rel + ' (cruzando pasaje)'
            L.append((j, rel))
        nb[i] = L
    X = sorted(set(focus) | {j for i in focus for j, _ in nb[i]})
    groups = set(X) | {-1}
    # ---------------- sol sobre el suelo
    hours = {}; hours_wo = {k: {x: np.zeros((G.H, G.W)) for x in X} for k in ('invierno', 'equinoccio')}
    ser = {k: series(k, rot) for k in DATES}
    for key, steps in ser.items():
        dt = 1 / 6
        acc = np.zeros((G.H, G.W)); acc_t = np.zeros((G.H, G.W)) if key == 'verano' else None
        for (t, az, el, s) in steps:
            m = shadow_masks(G, sc['faces'], sc['trees'], s, groups)
            allm = np.zeros((G.H, G.W), bool)
            for g in m.values(): allm |= g
            acc += (~allm) * dt
            if key in hours_wo:
                for x in X:
                    o = np.zeros((G.H, G.W), bool)
                    for g, mm in m.items():
                        if g != x: o |= mm
                    hours_wo[key][x] += (~o) * dt
            if key == 'verano':
                mt = shadow_masks(G, [], sc['trees'], s, {-1}, with_trees=True)[-1]
                acc_t += (~(allm | mt)) * dt
        hours[key] = acc
        if key == 'verano': hours['verano_arb'] = acc_t
    # sombra puntual de verano
    def shade_at(hr, with_trees):
        az, el = sun_position(*DATES['verano'], hr); s = sun_local(az, el, rot)
        m = shadow_masks(G, sc['faces'], sc['trees'], s, {-1})[-1]
        if with_trees: m |= shadow_masks(G, [], sc['trees'], s, {-1}, with_trees=True)[-1]
        return m
    sh = {(h, tr): shade_at(h, tr) for h in (15, 17) for tr in (False, True)}
    # ---------------- estadísticas por lote
    def pstats(mask, H):
        v = H[mask]
        if not len(v): return dict(media=0, p2=0, p4=0)
        return dict(media=float(v.mean()), p2=float((v >= 2).mean()), p4=float((v >= 4).mean()))
    lot_out = []
    for i, l in enumerate(lots):
        pm = LM[i] & ~built
        fr = lot_frame(l)
        # restricciones medidas en la lámina
        Ho = heightfield(G, sc['faces'], classes=('edif',), owner=i)
        bm = LM[i] & (Ho > 2.8)
        meas = None
        if bm.any():
            px = G.X[bm]; py = G.Y[bm]; P = np.c_[px, py] - fr['o']
            v = P @ fr['d']; u = P @ fr['r']; hh = Ho[bm]
            area = LP[i].area
            lev = levels_of(hh)
            meas = dict(ret_frente=float(max(0, v.min() - G.res / 2)), ret_fondo=float(max(0, fr['D'] - v.max() - G.res / 2)),
                        lat_izq=float(max(0, u.min() - G.res / 2)), lat_der=float(max(0, fr['W'] - u.max() - G.res / 2)),
                        prof=float(v.max() - v.min() + G.res), hmax=float(hh.max()), niveles=int(levels_of(np.array([np.percentile(hh, 80)]))[0]),
                        fos=float(bm.sum() * G.res ** 2 / area), fot=float((lev.sum()) * G.res ** 2 / area),
                        W=fr['W'], D=fr['D'], area=float(area))
        st = {k: pstats(pm, hours[k]) for k in hours}
        lot_out.append(dict(id=l['id'], zone=l['zone'], label=l['label'], focus=l['focus'], poly=l['poly'], front=l['front'],
                            front_or=compass(bearing(l['front'][0], l['front'][1], rot)), patio=float(pm.sum() * G.res ** 2),
                            sol=st, meas=meas,
                            sombra={f'{h}{"_arb" if tr else ""}': float(sh[(h, tr)][pm].mean()) if pm.any() else 0 for (h, tr) in sh}))
    # ---------------- pares y visuales
    pairs = []; facades = {}; views = {}
    for i in focus:
        for j in [i] + [j for j, _ in nb[i]]:
            if j not in facades: facades[j] = facade_points(sc, G, Hall, j, lots[j])
    def overlook(src, dst):
        P = [p for p in facades[src] if p['lv'] >= 1]
        pm = LM[dst] & ~built
        jj, ii = np.where(pm)
        sel = ((jj % 2) == 0) & ((ii % 2) == 0)
        T = np.c_[G.X[jj[sel], ii[sel]], G.Y[jj[sel], ii[sel]], np.full(sel.sum(), 1.2)]
        if not len(P) or not len(T): return 0.0, None
        seen = np.zeros(len(T), bool); dmin = None
        for p in P:
            q = np.array(p['p']); V = T - q; dh = np.hypot(V[:, 0], V[:, 1])
            cosang = (V[:, 0] * p['n'][0] + V[:, 1] * p['n'][1]) / np.maximum(dh, 1e-6)
            cand = (dh < 12) & (dh > 0.8) & (cosang > math.cos(math.radians(65))) & ~seen
            if not cand.any(): continue
            dist = np.linalg.norm(V[cand], axis=1); D = V[cand] / dist[:, None]
            blk = march(Hall, G, np.repeat(q[None], cand.sum(), 0), D, maxd=dist - 0.4, start=0.4)
            idx = np.where(cand)[0][~blk]; seen[idx] = True
            if len(idx):
                dm = float(np.linalg.norm(V[idx], axis=1).min()); dmin = dm if dmin is None else min(dmin, dm)
        return float(seen.sum() * (2 * G.res) ** 2), dmin
    for i in focus:
        for j, rel in nb[i]:
            pi = LM[i] & ~built; pj = LM[j] & ~built
            pr = dict(a=lots[i]['id'], b=lots[j]['id'], zb=lots[j]['zone'], rel=rel)
            for k in ('invierno', 'equinoccio'):
                pr[k] = dict(a_quita_a_b=float((hours_wo[k][i][pj] - hours[k][pj]).mean()) if pj.any() else 0,
                             b_quita_a_a=float((hours_wo[k][j][pi] - hours[k][pi]).mean()) if pi.any() else 0)
            ab, dab = overlook(i, j); ba, dba = overlook(j, i)
            pr['vis'] = dict(a_ve_b=ab, d_ab=dab, b_ve_a=ba, d_ba=dba)
            pairs.append(pr)
    # ---------------- fachadas: sol por nivel y orientación
    fac_out = {}
    for i in focus:
        P = facades[i]
        if not P: fac_out[lots[i]['id']] = []; continue
        Q = np.array([p['p'] for p in P]); N = np.array([p['n'] for p in P])
        res = {}
        for key in ('invierno', 'equinoccio', 'verano'):
            h = np.zeros(len(P))
            for (t, az, el, s) in ser[key]:
                ok = (N @ s[:2]) > 0.1
                if not ok.any(): continue
                blk = march(Hall, G, Q[ok], s, start=0.25)
                h[np.where(ok)[0][~blk]] += 1 / 6
            res[key] = h
        rows = {}
        for k, p in enumerate(P):
            o = compass(bearing(p['n'][0], p['n'][1], rot))
            key = (p['role'], o, p['lv'])
            rows.setdefault(key, []).append((res['invierno'][k], res['equinoccio'][k], res['verano'][k]))
        fac_out[lots[i]['id']] = [dict(role=r, orient=o, level=lv, inv_max=float(max(x[0] for x in v)), inv_med=float(np.mean([x[0] for x in v])),
                                      eq=float(np.mean([x[1] for x in v])), ver=float(np.mean([x[2] for x in v])), n=len(v))
                                 for (r, o, lv), v in sorted(rows.items(), key=lambda t: (t[0][2], t[0][0], t[0][1]))]
    # ---------------- cielo visible y profundidad visual
    svf = {}; vis_open = {}
    for i in focus:
        pm = LM[i] & ~built
        if pm.any():
            jj, ii = np.where(pm); cx, cy = G.X[jj, ii].mean(), G.Y[jj, ii].mean()
            k = np.argmin((G.X[jj, ii] - cx) ** 2 + (G.Y[jj, ii] - cy) ** 2)
            p = np.array([G.X[jj[k], ii[k]], G.Y[jj[k], ii[k]], 1.2])
            blk = march(Hall, G, np.repeat(p[None], len(HEMI), 0), HEMI, maxd=80)
            svf[lots[i]['id']] = float(1 - blk.mean())
        out = {}
        for role in ('frente', 'contrafrente'):
            c = [p for p in facades[i] if p['role'] == role]
            if not c: continue
            top = max(p['lv'] for p in c); c = [p for p in c if p['lv'] == top]
            p = c[len(c) // 2]; base = math.atan2(p['n'][1], p['n'][0])
            angs = base + np.radians(np.linspace(-60, 60, 25))
            D = np.c_[np.cos(angs), np.sin(angs), np.zeros(25)]
            blk = march(Hall, G, np.repeat(np.array(p['p'])[None], 25, 0), D, maxd=120, start=0.6)
            out[role] = dict(libre=float(1 - blk.mean()), orient=compass(bearing(p['n'][0], p['n'][1], rot)))
        vis_open[lots[i]['id']] = out
    # ---------------- mapas a 1 m
    def down(H):
        h = H[: G.H // 2 * 2, : G.W // 2 * 2].reshape(G.H // 2, 2, G.W // 2, 2).mean(axis=(1, 3))
        b = built[: G.H // 2 * 2, : G.W // 2 * 2].reshape(G.H // 2, 2, G.W // 2, 2).mean(axis=(1, 3)) >= 0.5
        return np.where(b, -1, np.round(h, 2))
    maps = {k: down(v) for k, v in hours.items()}
    res = dict(zone=zone, mode=mode, rot=rot, win=sc['win'], lots=lot_out, pairs=pairs, facades=fac_out, svf=svf, vis_open=vis_open,
               corr=sc['sc']['corr'], nota=sc['sc']['nota'], trees=[dict(x=t['x'], y=t['y'], r=t['r'], zb=t['zb'], zt=t['zt']) for t in sc['trees']],
               maps={k: v.tolist() for k, v in maps.items()}, grid=dict(W=int(maps['invierno'].shape[1]), H=int(maps['invierno'].shape[0]), res=1.0),
               facade_pts={lots[i]['id']: [dict(p=p['p'], n=p['n'], lv=p['lv']) for p in facades[i] if p['lv'] >= 1][:40] for i in focus},
               secs=round(time.time() - t0, 1))
    return res

if __name__ == '__main__':
    import os
    os.makedirs('out2', exist_ok=True)
    zones = sys.argv[1:] or list(S)
    for z in zones:
        for mode in ('real', 'lamina'):
            r = analyse(z, mode)
            json.dump(r, open(f'out2/{z}_{mode}.json', 'w'))
            fl = [l for l in r['lots'] if l['focus']]
            print(z, mode, r['secs'], 's', [(l['id'], l['front_or'], round(l['sol']['invierno']['media'], 2), l['meas'] and round(l['meas']['fos'], 2)) for l in fl],
                  [(p['a'], p['b'], round(p['invierno']['a_quita_a_b'], 2), round(p['invierno']['b_quita_a_a'], 2)) for p in r['pairs']], flush=True)
