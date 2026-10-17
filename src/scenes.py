# -*- coding: utf-8 -*-
"""Escenas de análisis construidas sobre la geometría exacta de las láminas (SketchUp, fichas PPN 2022)."""
import math

def rect(ax, u0, u1, v0, v1):
    a = math.radians(ax); ca, sa = math.cos(a), math.sin(a)
    # u = x ca + y sa ; v = -x sa + y ca  ->  x = u ca - v sa ; y = u sa + v ca
    return [(u * ca - v * sa, u * sa + v * ca) for (u, v) in ((u0, v0), (u1, v0), (u1, v1), (u0, v1))]

def nrm(ax, side):
    a = math.radians(ax); ca, sa = math.cos(a), math.sin(a)
    U, V = (ca, sa), (-sa, ca)
    return {'u+': U, 'u-': (-U[0], -U[1]), 'v+': V, 'v-': (-V[0], -V[1])}[side]

def L(id, zone, poly, front, focus=False, label=None):
    return dict(id=id, zone=zone, poly=[tuple(map(float, p)) for p in poly], front=tuple(front), focus=focus, label=label or zone)

S = {}

# ---------------------------------------------------------------- RN1 (lámina N1): dos lotes con frente al Boulevard (-x)
S['RN1'] = dict(src='N1', win=(-45, 32, -8, 82), rot_real=44.0,
    lots=[L('A0', 'RN1', rect(0, 1.7, 24.9, 0.7, 30.7), nrm(0, 'u-'), True),
          L('A1', 'RN1', rect(0, 1.7, 24.9, 30.7, 60.7), nrm(0, 'u-'))],
    corr=[rect(0, 1.7, 24.9, 28.2, 33.2)],
    nota='La lámina modela dos parcelas RN1 de 30 × 23,2 m sobre el Boulevard San Andrés; no incluye vecinos de fondo.')

# ---------------------------------------------------------------- RN2 (lámina N2): bloque girado 28,1°
AX2 = 28.1
S['RN2'] = dict(src='N2', win=(-100, 30, -85, 30), rot_real=44.0,
    lots=[L('B0', 'RN2', rect(AX2, -92.52, -54.02, -11.78, 27.38), nrm(AX2, 'v-')),
          L('B1', 'RN2', rect(AX2, -44.02, -5.52, -11.78, 27.38), nrm(AX2, 'v-'), True)],
    corr=[rect(AX2, -54.02, -44.02, -11.78, 27.38)],
    nota='La lámina modela las dos parcelas RN2 con un pasaje verde intermedio; el bloque está girado 28° respecto de la trama.')

# ---------------------------------------------------------------- RN3 (lámina N3): un lote construido, módulo repetido a ambos lados
AX3 = 15.0
S['RN3'] = dict(src='N3', win=(15, 80, -80, -15), rot_real=149.0,
    lots=[L('C0', 'RN3', rect(AX3, 17.86, 47.84, -51.76, -39.74), nrm(AX3, 'u+')),
          L('C1', 'RN3', rect(AX3, 17.86, 47.84, -63.74, -51.76), nrm(AX3, 'u+'), True),
          L('C2', 'RN3', rect(AX3, 17.86, 47.84, -75.76, -63.74), nrm(AX3, 'u+'))],
    replicate=dict(src='C1', to=['C0', 'C2']),
    corr=[rect(AX3, 17.86, 22.86, -75.76, -39.74)],
    nota='La lámina construye una sola parcela RN3 (12 × 30 m); el mismo módulo se repite en las parcelas linderas para leer la vecindad. La lámina está girada respecto de su ubicación real sobre Av. Scully.')

# ---------------------------------------------------------------- RN4 (lámina N4)
S['RN4'] = dict(src='N4', win=(-25, 115, -130, -40), rot_real=44.0,
    lots=[L('N0', 'RN4', rect(0, 8.0, 30.5, -85.5, -46.8), (0, 1)),
          L('N1', 'RN4', rect(0, 30.5, 50.5, -85.5, -46.8), (0, 1), True),
          L('N2', 'RN4', rect(0, 50.5, 70.5, -85.5, -46.8), (0, 1)),
          L('S0', 'RN4', rect(0, 8.0, 30.5, -123.3, -85.5), (0, -1)),
          L('S1', 'RN4', rect(0, 30.5, 50.5, -123.3, -85.5), (0, -1), True),
          L('S2', 'RN4', rect(0, 50.5, 70.5, -123.3, -85.5), (0, -1))],
    corr=[rect(0, 8.0, 70.5, -92.0, -79.0)],
    nota='La lámina modela una fila doble de parcelas RN4 con la banda verde compartida en la línea de fondo; las parcelas del este quedan vacías.')

# ---------------------------------------------------------------- RN5 (lámina N5): 8 + 8 lotes de 12 m
S['RN5'] = dict(src='N5', win=(-135, -5, -5, 65), rot_real=44.0,
    lots=[L(f'N{k}', 'RN5', rect(0, -106.2 + 12 * k, -94.2 + 12 * k, 30.0, 60.0), (0, 1), k == 3) for k in range(8)] +
         [L(f'S{k}', 'RN5', rect(0, -106.2 + 12 * k, -94.2 + 12 * k, 0.0, 30.0), (0, -1), k == 3) for k in range(8)],
    corr=[rect(0, -106.2, -10.2, 25.0, 35.0)],
    nota='La lámina modela dos filas de ocho parcelas RN5 con frente al norte y al sur; en el extremo oeste aparecen las volumetrías RN1.')

# ---------------------------------------------------------------- RN6 y RN7 (lámina N7, manzana compartida)
LOTS7 = [L('A', 'RN7', [(58.5, -229.1), (94.5, -229.1), (94.5, -144.1), (58.5, -152.1)], (0, 1)),
         L('B', 'RN7', [(102.5, -229.1), (139.5, -229.1), (139.5, -134.1), (102.5, -142.3)], (0, 1)),
         L('R0', 'RN6', rect(0, 38.5, 58.5, -249.1, -229.1), (0, -1)),
         L('R1', 'RN6', rect(0, 58.5, 78.5, -249.1, -229.1), (0, -1)),
         L('R2', 'RN6', rect(0, 78.5, 98.5, -249.1, -229.1), (0, -1)),
         L('R3', 'RN6', rect(0, 98.5, 118.5, -249.1, -229.1), (0, -1)),
         L('R4', 'RN6', rect(0, 118.5, 139.5, -249.1, -229.1), (0, -1)),
         L('W0', 'Borde O', rect(0, 38.5, 58.5, -229.1, -209.1), (-1, 0), label='lote de borde O'),
         L('W1', 'Borde O', rect(0, 38.5, 58.5, -209.1, -189.1), (-1, 0), label='lote de borde O'),
         L('W2', 'Borde O', rect(0, 38.5, 58.5, -189.1, -169.1), (-1, 0), label='lote de borde O'),
         L('E0', 'Borde E', rect(0, 139.5, 169.5, -229.1, -209.1), (1, 0), label='lote de borde E'),
         L('E1', 'Borde E', rect(0, 139.5, 169.5, -209.1, -189.1), (1, 0), label='lote de borde E'),
         L('E2', 'Borde E', rect(0, 139.5, 169.5, -189.1, -169.1), (1, 0), label='lote de borde E')]
CORR7 = [rect(0, 38.5, 139.5, -232.1, -229.1), rect(0, 94.5, 102.5, -229.1, -142.3)]
def _copy(lots, focus_id):
    return [dict(l, focus=(l['id'] == focus_id)) for l in lots]
S['RN7'] = dict(src='N7', win=(0, 175, -252, -45), rot_real=44.0, lots=_copy(LOTS7, 'A'), corr=CORR7,
    nota='La lámina modela la manzana RN7: dos parcelas grandes separadas por un pasaje, la fila RN6 al sur y lotes de borde a ambos lados; al norte, la manzana RN7 siguiente.')
S['RN6'] = dict(src='N7', win=(0, 175, -252, -45), rot_real=44.0, lots=_copy(LOTS7, 'R2'), corr=CORR7,
    nota='Las parcelas RN6 de la lámina forman la fila sur de la manzana RN7 (20 × 20 m), con la banda verde compartida en el fondo.')

# ---------------------------------------------------------------- RN8 (lámina N8): un lote, módulo repetido
S['RN8'] = dict(src='N8', win=(-5, 50, 40, 112), rot_real=44.0,
    lots=[L('D0', 'RN8', rect(0, 7.7, 37.7, 53.2, 68.2), (1, 0)),
          L('D1', 'RN8', rect(0, 7.7, 37.7, 68.2, 83.2), (1, 0), True),
          L('D2', 'RN8', rect(0, 7.7, 37.7, 83.2, 98.2), (1, 0))],
    replicate=dict(src='D1', to=['D0', 'D2']),
    corr=[rect(0, 7.7, 12.7, 53.2, 98.2)],
    nota='La lámina construye una parcela RN8 (15 × 30 m) junto al canal; el módulo se repite en las parcelas linderas.')

# ---------------------------------------------------------------- RN9 (lámina N9)
S['RN9'] = dict(src='N9', win=(45, 165, -130, -40), rot_real=44.0,
    lots=[L('N0', 'RN9', rect(0, 65.5, 85.5, -85.5, -47.3), (0, 1)),
          L('N1', 'RN9', rect(0, 85.5, 106.0, -85.5, -47.3), (0, 1), True),
          L('N2', 'RN9', rect(0, 120.5, 140.5, -85.5, -47.3), (0, 1)),
          L('N3', 'RN9', rect(0, 140.5, 161.0, -85.5, -47.3), (0, 1)),
          L('S0', 'RN9', rect(0, 65.5, 85.5, -124.5, -85.5), (0, -1)),
          L('S1', 'RN9', rect(0, 85.5, 106.0, -124.5, -85.5), (0, -1), True),
          L('S2', 'RN9', rect(0, 120.5, 140.5, -124.5, -85.5), (0, -1)),
          L('S3', 'RN9', rect(0, 140.5, 161.0, -124.5, -85.5), (0, -1))],
    corr=[rect(0, 65.5, 161.0, -91.5, -79.5)],
    nota='La lámina modela dos pares de parcelas RN9 espalda con espalda, con la banda verde compartida en la línea de fondo.')
