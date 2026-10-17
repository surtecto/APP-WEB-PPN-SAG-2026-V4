# -*- coding: utf-8 -*-
import json, math, os
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap
from matplotlib.patches import Polygon as MPoly, Circle, FancyArrowPatch
from engine2 import load, Grid, heightfield

plt.rcParams.update({'font.family': 'Carlito', 'font.size': 9, 'axes.edgecolor': '#555', 'axes.linewidth': 0.6})
OUT = '../fig3'; os.makedirs(OUT, exist_ok=True)
CM = LinearSegmentedColormap.from_list('sol', ['#23324a', '#4d6a8a', '#9fb3a6', '#e9dca4', '#f1b545', '#e07b2a'])
INK = '#2a2723'; PAPER = '#fbf8f2'; FOC = '#b0412e'; CORR = '#3d7fd1'; NORTH = '#e2b422'
D = json.load(open('../app/data2.json'))

def north(ax, x, y, R, bear):
    ax.add_patch(Circle((x, y), R, fill=False, ec=NORTH, lw=2.2, zorder=30))
    a = math.radians(-bear); dx, dy = math.sin(a), math.cos(a)
    ax.annotate('', xy=(x + dx * R * 0.85, y + dy * R * 0.85), xytext=(x - dx * R * 0.5, y - dy * R * 0.5),
                arrowprops=dict(arrowstyle='-|>', color=NORTH, lw=2.2, mutation_scale=14), zorder=31, annotation_clip=False)
    ax.text(x + dx * R * 1.45, y + dy * R * 1.45, 'N', ha='center', va='center', fontsize=10, fontweight='bold', color=INK, zorder=31)

def plan(z):
    Z = D['zones'][z]; sc = load(z); G = Grid(sc['win'])
    Hb = heightfield(G, sc['faces'], classes=('edif',))
    x0, x1, y0, y1 = sc['win']
    fig, ax0 = plt.subplots(1, 1, figsize=(8.2, 7.4 * (y1 - y0) / (x1 - x0) + 0.8), facecolor=PAPER); axs = [ax0]
    for ax, mode in zip(axs, ('real',)):
        M = Z['modes'][mode]
        rows = M['maps']['invierno']
        A = np.array([[np.nan if c == '.' else (ord(c) - 48) / 2 for c in r] for r in rows])
        im = ax.imshow(A, origin='lower', extent=(x0, x0 + A.shape[1], y0, y0 + A.shape[0]), cmap=CM, vmin=0, vmax=9.5, interpolation='nearest')
        ax.contourf(G.X, G.Y, Hb, levels=[2.8, 100], colors=['#e8e2d6'], zorder=3)
        ax.contour(G.X, G.Y, Hb, levels=[2.8], colors=['#4b443c'], linewidths=0.6, zorder=4)
        for c in Z['corr']:
            ax.add_patch(MPoly(c, closed=True, fc=CORR, alpha=0.25, ec=CORR, lw=0.8, zorder=5))
        for l in Z['lots']:
            ax.add_patch(MPoly(l['poly'], closed=True, fill=False, ec=FOC if l['focus'] else '#6d655c', lw=1.6 if l['focus'] else 0.5, zorder=6))
            cx, cy = np.mean(l['poly'], 0)
            ax.text(cx, cy, l['id'], ha='center', va='center', fontsize=6.5, color=FOC if l['focus'] else '#4b443c', zorder=7)
        cen = {l['id']: np.mean(l['poly'], 0) for l in Z['lots']}
        seen = set()
        for p in M['pairs']:
            for s, t, v in ((p['a'], p['b'], p['inv_ab']), (p['b'], p['a'], p['inv_ba'])):
                if v < 0.3 or (s, t) in seen: continue
                seen.add((s, t))
                A0, B0 = cen[s], cen[t]; d = B0 - A0; A1, B1 = A0 + d * 0.2, A0 + d * 0.8
                col = FOC if v >= 1 else '#2c4a6b'
                ax.add_patch(FancyArrowPatch(A1, B1, arrowstyle='-|>', mutation_scale=12, lw=0.8 + 1.6 * v, color=col, zorder=9))
                m = (A1 + B1) / 2
                ax.text(m[0], m[1], f'−{v:.1f} h'.replace('.', ','), fontsize=7.5, color='white', ha='center', va='center', zorder=10,
                        bbox=dict(boxstyle='round,pad=0.2', fc=col, ec='none'))
        ax.set_xlim(x0, x1); ax.set_ylim(y0, y1); ax.set_aspect('equal'); ax.set_xticks([]); ax.set_yticks([])
        R = max(x1 - x0, y1 - y0) * 0.045 + 2
        north(ax, x1 - R * 1.8, y1 - R * 1.9, R, M['bearY'])
        ax.plot([x0 + 3, x0 + 23], [y0 + 3, y0 + 3], color=INK, lw=2); ax.text(x0 + 13, y0 + 4.2, '20 m', ha='center', fontsize=8)
        ax.set_title('Horas de sol directo · 21 de junio · norte real', fontsize=10, color=INK)
    cb = fig.colorbar(im, ax=axs, fraction=0.025, pad=0.02); cb.set_label('horas de sol directo · 21 de junio', fontsize=8)
    fig.savefig(f'{OUT}/{z}_plan.png', dpi=170, bbox_inches='tight', facecolor=PAPER); plt.close(fig)

def summary():
    labs, re, la = [], [], []
    for z, Z in D['zones'].items():
        for l in Z['lots']:
            if not l['focus']: continue
            labs.append(f"{z} {l['id']}\n({Z['modes']['real']['lots'][l['id']]['front_or']})")
            re.append(Z['modes']['real']['lots'][l['id']]['sol']['invierno']['media'])
            la.append(Z['modes']['lamina']['lots'][l['id']]['sol']['invierno']['media'])
    x = np.arange(len(labs)); fig, ax = plt.subplots(figsize=(11, 3.8), facecolor=PAPER); ax.set_facecolor(PAPER)
    ax.bar(x - 0.2, re, 0.4, color='#e07b2a', label='norte real (trama girada)')
    ax.bar(x + 0.2, la, 0.4, color='#4d6a8a', label='norte de lámina (eje Y)')
    ax.axhline(2, color=FOC, lw=0.8, ls='--'); ax.text(len(labs) - 0.5, 2.1, '2 h', color=FOC, fontsize=8, ha='right')
    ax.set_xticks(x); ax.set_xticklabels(labs, fontsize=7.5); ax.set_ylabel('horas medias de sol · 21 jun')
    ax.legend(frameon=False, fontsize=8); ax.spines[['top', 'right']].set_visible(False)
    fig.savefig(f'{OUT}/sintesis_orient.png', dpi=170, bbox_inches='tight', facecolor=PAPER); plt.close(fig)
    # lámina vs ficha
    labs, ff, fl, tf, tl = [], [], [], [], []
    for z, Z in D['zones'].items():
        if z == 'RN6':
            ids = ['R2']
        else:
            ids = [l['id'] for l in Z['lots'] if l['focus']]
        for i in ids:
            me = Z['modes']['real']['lots'][i].get('meas')
            if not me: continue
            labs.append(f'{z} {i}'); ff.append(Z['meta']['fos']); fl.append(me['fos']); tf.append(Z['meta']['fot']); tl.append(me['fot'])
    x = np.arange(len(labs)); fig, axs = plt.subplots(1, 2, figsize=(11, 3.6), facecolor=PAPER)
    for ax, a, b, t in ((axs[0], ff, fl, 'FOS'), (axs[1], tf, tl, 'FOT')):
        ax.set_facecolor(PAPER)
        ax.bar(x - 0.2, a, 0.4, color='#9fb3a6', label='ficha 2026'); ax.bar(x + 0.2, b, 0.4, color='#2d63b8', label='lámina medida')
        ax.set_xticks(x); ax.set_xticklabels(labs, rotation=60, fontsize=7.5); ax.set_title(t, fontsize=10)
        ax.spines[['top', 'right']].set_visible(False); ax.legend(frameon=False, fontsize=8)
    fig.savefig(f'{OUT}/sintesis_ficha.png', dpi=170, bbox_inches='tight', facecolor=PAPER); plt.close(fig)

if __name__ == '__main__':
    for z in D['zones']:
        plan(z); print(z, flush=True)
