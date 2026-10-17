# Exporta las escenas de lámina como OBJ (metros, X/Y de la lámina, Z arriba) con grupos por lote y clase
import os
from engine2 import load
from scenes import S
os.makedirs('../obj3', exist_ok=True)
MTL = {'edif': (0.92, 0.90, 0.87), 'cerco': (0.85, 0.83, 0.79), 'suelo': (0.79, 0.76, 0.70), 'seto': (0.44, 0.56, 0.35), 'malla': (0.55, 0.55, 0.53)}
for z in S:
    sc = load(z); ids = [l['id'] for l in sc['lots']]
    with open(f'../obj3/{z}.mtl', 'w') as m:
        for k, c in MTL.items(): m.write(f'newmtl {k}\nKd {c[0]} {c[1]} {c[2]}\n\n')
    with open(f'../obj3/{z}.obj', 'w') as o:
        o.write(f'# PPN {z} · lámina {sc["sc"]["src"]} sin modificar · metros · Y arriba (convención OBJ), -Z = norte de lámina; el norte real está girado {sc["sc"]["rot_real"]:.0f}° en sentido antihorario\nmtllib {z}.mtl\n')
        n = 1; groups = {}
        for f in sc['faces']:
            groups.setdefault((ids[f['owner']] if f['owner'] >= 0 else 'entorno', f['cls']), []).append(f['tris'])
        for (own, cls), TT in groups.items():
            o.write(f'g {own}_{cls}\nusemtl {cls}\n')
            for T in TT:
                for t in T:
                    for v in t: o.write(f'v {v[0]:.3f} {v[2]:.3f} {-v[1]:.3f}\n')
                    o.write(f'f {n} {n+1} {n+2}\n'); n += 3
    print(z)
