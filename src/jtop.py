import json,sys,numpy as np,matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.collections import PolyCollection
def load(n, inview=True):
    d=json.load(open(f'js/{n}.json'))
    F=[f for f in d['faces'] if (f.get('iv') or not inview)]
    return d,F
def plot(n,out):
    d,F=load(n)
    F=[f for f in F if f['m'] is not None or max(p[2] for p in f['v'])<0.5 and len(f['v'])>3]
    fig,ax=plt.subplots(figsize=(13,13))
    F.sort(key=lambda f:max(p[2] for p in f['v']))
    mats=sorted(set(str(f['m']) for f in F)); cm=plt.get_cmap('tab20'); mc={m:cm(i%20) for i,m in enumerate(mats)}
    ax.add_collection(PolyCollection([np.array(f['v'])[:,:2] for f in F],facecolors=[mc[str(f['m'])] for f in F],edgecolors='k',linewidths=0.2,alpha=0.85))
    for f in F:
        P=np.array(f['v']); h=P[:,2].max()
        if h>2.5 and np.ptp(P[:,2])<0.05: c=P[:,:2].mean(0); ax.text(c[0],c[1],f"{h:.1f}",fontsize=6)
    for e in d['ent']:
        if not e.get('iv'): continue
        C=np.array(e['c']); h=C[:,2].max()-C[:,2].min(); r=(np.ptp(C[:,0])+np.ptp(C[:,1]))/4
        if h>3: ax.add_patch(plt.Circle(C[:,:2].mean(0),r,fill=False,color='g',lw=0.5))
    P=np.vstack([np.array(f['v'])[:,:2] for f in F]); ax.set_xlim(P[:,0].min(),P[:,0].max()); ax.set_ylim(P[:,1].min(),P[:,1].max())
    ax.set_aspect('equal'); ax.grid(True,lw=0.3)
    ax.legend(handles=[plt.Rectangle((0,0),1,1,color=mc[m]) for m in mats],labels=mats,fontsize=6,loc='upper right')
    ax.set_title(n); fig.savefig(out,dpi=65); plt.close(fig)
if __name__=='__main__':
    for n in sys.argv[1:]: plot(n,f'tv/j_{n}.png')
