# -*- coding: utf-8 -*-
"""Arma el conjunto de datos del visor a partir de la geometría de las láminas (engine2) y del análisis (out2)."""
import json, base64, sys, os
import numpy as np
from shapely.geometry import Polygon
from engine2 import load, Grid, heightfield, lot_frame, LAT, LON, TZ
from scenes import S
sys.path.insert(0, '..')
from engine import ZONES_META
try:
    from readings2 import READ, GENERAL
except Exception:
    READ, GENERAL = {}, []

MATCOL = [  # (fragmento de nombre de material, color, opacidad)
    ('Vidrio', '#9fb6c4', 0.55), ('Translucent Glass', '#9fb6c4', 0.55),
    ('Vegetación', '#6f8f5a', 1), ('Vegetation', '#6f8f5a', 1),
    ('Césped verde oscuro', '#6d8f4e', 1), ('Césped', '#9cb877', 1),
    ('Asfalto', '#5d5d5a', 1), ('Formica azul', '#6f8fb3', 1), ('Formica de piedra', '#b9b5ad', 1),
    ('Formica gris', '#d8d3ca', 1), ('Color J03', '#e8d7b8', 1), ('Color A07', '#efe9df', 1),
    ('Color D05', '#c98d6a', 1), ('Color M0', '#c9cfd2', 1), ('Fencing', '#8c8c86', 0.35), ('Cercado', '#8c8c86', 0.35),
]
CLSCOL = {'edif': '#eae6de', 'cerco': '#d9d4ca', 'suelo': '#c9c2b2', 'seto': '#6f8f5a', 'malla': '#8c8c86'}

def color(cls, m):
    for k, c, o in MATCOL:
        if k in (m or ''): return c, o
    return CLSCOL[cls], (0.35 if cls == 'malla' else 1)

def b64(a): return base64.b64encode(a.tobytes()).decode()

def enc_map(M):
    return [''.join('.' if v < 0 else chr(48 + min(int(round(v * 2)), 70)) for v in r) for r in M]

def r2(x, n=2): return None if x is None else round(float(x), n)

def zone_data(z):
    sc = load(z); x0, x1, y0, y1 = sc['win']; lots = sc['lots']; LP = sc['LP']
    # ---- mallas agrupadas por (clase, material, dueño)
    groups = {}
    for f in sc['faces']:
        k = (f['cls'], f['mat'], f['owner'])
        groups.setdefault(k, []).append(f['tris'])
    mesh = []
    for (cls, m, own), T in groups.items():
        A = np.concatenate(T).reshape(-1, 3).copy()
        A[:, 0] -= x0; A[:, 1] -= y0
        q = np.round(A * 100).astype(np.int16)
        c, o = color(cls, m)
        mesh.append(dict(cls=cls, c=c, o=o, own=own, b=b64(q)))
    # ---- alturas para "Mi proyecto" (0,5 m, decímetros)
    G = Grid(sc['win'])
    focus = [i for i, l in enumerate(lots) if l['focus']]
    others = np.zeros((G.H, G.W), np.float32)
    for f in sc['faces']:
        pass
    Hall = heightfield(G, sc['faces'])
    Hf = {i: heightfield(G, sc['faces'], owner=i) for i in focus}
    Hfoc = np.zeros_like(Hall)
    for i in focus: Hfoc = np.maximum(Hfoc, Hf[i])
    # "otros": todo lo que no pertenece a los lotes foco
    others = heightfield(G, [f for f in sc['faces'] if f['owner'] not in focus])
    hf = dict(W=G.W, H=G.H, res=G.res, others=b64(np.clip(np.round(others * 10), 0, 255).astype(np.uint8)), lots={})
    for i in focus:
        m = Hf[i] > 0.05
        jj, ii = np.where(m)
        if not len(jj): continue
        j0, j1, i0, i1 = jj.min(), jj.max() + 1, ii.min(), ii.max() + 1
        sub = np.clip(np.round(Hf[i][j0:j1, i0:i1] * 10), 0, 255).astype(np.uint8)
        hf['lots'][lots[i]['id']] = dict(i0=int(i0), j0=int(j0), w=int(i1 - i0), h=int(j1 - j0), b=b64(sub))
    # ---- lotes
    LOT = []
    for i, l in enumerate(lots):
        fr = lot_frame(l)
        adj = [lots[j]['id'] for j in range(len(lots)) if j != i and LP[i].distance(LP[j]) < 10.6]
        LOT.append(dict(id=l['id'], zone=l['zone'], label=l['label'], focus=l['focus'], poly=[[r2(p[0]), r2(p[1])] for p in l['poly']],
                        front=list(l['front']), o=[r2(fr['o'][0]), r2(fr['o'][1])], d=[r2(fr['d'][0], 4), r2(fr['d'][1], 4)],
                        r=[r2(fr['r'][0], 4), r2(fr['r'][1], 4)], W=r2(fr['W'], 2), D=r2(fr['D'], 2), area=round(LP[i].area), adj=adj))
    # ---- resultados por orientación
    modes = {}
    for mode in ('real',):
        r = json.load(open(f'out2/{z}_{mode}.json'))
        lots_m = {}
        for l in r['lots']:
            e = dict(front_or=l['front_or'], patio=round(l['patio']),
                     sol={k: {a: r2(b) for a, b in v.items()} for k, v in l['sol'].items()},
                     sombra={k: r2(v) for k, v in l['sombra'].items()})
            if l['meas']: e['meas'] = {k: (r2(v) if isinstance(v, float) else v) for k, v in l['meas'].items()}
            lots_m[l['id']] = e
        fach = {}
        for lid, rows in r['facades'].items():
            byk = {}
            for x in rows: byk.setdefault((x['role'], x['orient']), []).append(x)
            fach[lid] = [dict(role=ro, orient=o, levels=[dict(l=x['level'], inv=r2(x['inv_max']), med=r2(x['inv_med']), eq=r2(x['eq']), ver=r2(x['ver'])) for x in sorted(v, key=lambda t: t['level'])])
                         for (ro, o), v in byk.items()]
        pairs = [dict(a=p['a'], b=p['b'], zb=p['zb'], rel=p['rel'], inv_ab=r2(p['invierno']['a_quita_a_b']), inv_ba=r2(p['invierno']['b_quita_a_a']),
                      eq_ab=r2(p['equinoccio']['a_quita_a_b']), eq_ba=r2(p['equinoccio']['b_quita_a_a']),
                      vis_ab=round(p['vis']['a_ve_b']), vis_ba=round(p['vis']['b_ve_a']), d_ab=r2(p['vis']['d_ab'], 1), d_ba=r2(p['vis']['d_ba'], 1)) for p in r['pairs']]
        modes[mode] = dict(bearY=r['rot'], lots=lots_m, fach=fach, pairs=pairs, svf={k: r2(v) for k, v in r['svf'].items()},
                           vis=r['vis_open'], maps={k: enc_map(v) for k, v in r['maps'].items()},
                           win={k: [dict(p=[r2(x) for x in w['p']], n=[r2(x, 3) for x in w['n']], lv=w['lv']) for w in v] for k, v in r['facade_pts'].items()})
    trees = [[r2(t['x'] - x0), r2(t['y'] - y0), r2(t['r']), r2(t['zb']), r2(t['zt'])] for t in sc['trees']]
    return dict(meta=ZONES_META[z], read=READ.get(z, {}), nota=sc['sc']['nota'], src=sc['sc']['src'], win=list(sc['win']),
                rep=bool(sc['sc'].get('replicate')), mesh=mesh, trees=trees, lots=LOT,
                corr=[[[r2(p[0]), r2(p[1])] for p in c] for c in sc['sc']['corr']], hf=hf, modes=modes)

if __name__ == '__main__':
    data = dict(lat=LAT, lon=LON, tz=TZ, general=GENERAL, zones={})
    for z in ['RN1', 'RN2', 'RN3', 'RN4', 'RN5', 'RN6', 'RN7', 'RN8', 'RN9']:
        data['zones'][z] = zone_data(z); print(z, flush=True)
    s = json.dumps(data, ensure_ascii=False, separators=(',', ':'))
    open('../app/data2.json', 'w').write(s)
    print(len(s) / 1e6, 'MB')
