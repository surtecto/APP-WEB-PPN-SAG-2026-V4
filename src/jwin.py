import json,sys,numpy as np,matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.collections import PolyCollection
W={'N1':(-45,32,-8,82),'N2':(-100,30,-85,30),'N3':(15,80,-80,-15),'N4':(-25,115,-130,-40),'N5':(-135,-40,-5,65),
   'N7':(0,175,-252,-45),'N8':(-30,60,0,130),'N9':(45,165,-130,-40)}
for n,(x0,x1,y0,y1) in W.items():
    d=json.load(open(f'js/{n}.json'))
    F=[]
    for f in d['faces']:
        P=np.array(f['v'])
        if P[:,0].max()<x0 or P[:,0].min()>x1 or P[:,1].max()<y0 or P[:,1].min()>y1: continue
        if f['m'] is None and len(P)<4: continue
        F.append((P,f['m']))
    F.sort(key=lambda t:t[0][:,2].max())
    fig,ax=plt.subplots(figsize=(13,13*(y1-y0)/(x1-x0)+1))
    mats=sorted(set(str(m) for _,m in F)); cm=plt.get_cmap('tab20'); mc={m:cm(i%20) for i,m in enumerate(mats)}
    ax.add_collection(PolyCollection([P[:,:2] for P,_ in F],facecolors=[mc[str(m)] for _,m in F],edgecolors='k',linewidths=0.4,alpha=0.6))
    for P,m in F:
        h=P[:,2].max()
        if h>1.5 and np.ptp(P[:,2])<0.05: c=P[:,:2].mean(0); ax.text(c[0],c[1],f"{h:.1f}",fontsize=7)
    for e in d['edges']:
        V=np.array(e['v']); ax.plot(V[:,0],V[:,1],'r-',lw=0.8)
    for e in d['ent']:
        C=np.array(e['c']); 
        if np.ptp(C[:,2])>3:
            c=C[:,:2].mean(0); r=(np.ptp(C[:,0])+np.ptp(C[:,1]))/4
            if x0<c[0]<x1 and y0<c[1]<y1: ax.add_patch(plt.Circle(c,r,fill=False,color='g',lw=0.6))
    ax.set_xlim(x0,x1); ax.set_ylim(y0,y1); ax.set_aspect('equal')
    ax.set_xticks(np.arange(np.floor(x0/5)*5,x1,5),minor=True); ax.set_yticks(np.arange(np.floor(y0/5)*5,y1,5),minor=True)
    ax.grid(True,which='both',lw=0.25)
    ax.legend(handles=[plt.Rectangle((0,0),1,1,color=mc[m]) for m in mats],labels=mats,fontsize=6,loc='upper right')
    ax.set_title(n); fig.savefig(f'tv/w_{n}.png',dpi=72); plt.close(fig)
    print(n,len(F))
