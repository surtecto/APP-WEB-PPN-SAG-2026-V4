import sys, numpy as np, matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.collections import PolyCollection
from objparse import parse
ENT=('FrontColor','ForegroundColor',None)
def run(path,out,show_ent=True):
    V,G=parse(path)
    polys=[];cols=[];hs=[]
    epolys=[]
    for g in G:
        for fi,m in g['faces']:
            P=V[np.array(fi)]
            if P.ndim!=2 or len(P)<3: continue
            if m in ENT:
                if show_ent: epolys.append(P[:,[0,2]]*[1,-1])
                continue
            polys.append((P[:,[0,2]]*[1,-1], P[:,1].max(), m))
    fig,ax=plt.subplots(figsize=(14,14))
    polys.sort(key=lambda t:t[1])
    cm=plt.get_cmap('tab20'); mats=sorted(set(p[2] for p in polys)); mc={m:cm(i%20) for i,m in enumerate(mats)}
    ax.add_collection(PolyCollection([p[0] for p in epolys],facecolors='none',edgecolors='#bbbbbb',linewidths=0.2))
    ax.add_collection(PolyCollection([p[0] for p in polys],facecolors=[mc[p[2]] for p in polys],edgecolors='k',linewidths=0.3,alpha=0.85))
    for p in polys:
        if p[1]>2.5:
            c=p[0].mean(0); ax.text(c[0],c[1],f"{p[1]:.1f}",fontsize=6)
    allp=np.vstack([p[0] for p in polys])
    ax.set_xlim(allp[:,0].min()-5,allp[:,0].max()+5); ax.set_ylim(allp[:,1].min()-5,allp[:,1].max()+5)
    ax.set_aspect('equal'); ax.grid(True,lw=0.3)
    ax.legend(handles=[plt.Rectangle((0,0),1,1,color=mc[m]) for m in mats],labels=mats,fontsize=7,loc='upper right')
    fig.savefig(out,dpi=70); plt.close(fig)
if __name__=='__main__':
    run(sys.argv[1],sys.argv[2],show_ent=len(sys.argv)>3)
