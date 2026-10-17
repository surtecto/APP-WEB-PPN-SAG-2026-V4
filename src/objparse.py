import re, numpy as np, collections
def parse(path):
    V=[]; groups=[]; cur=None; mat=None
    for line in open(path, encoding='latin-1'):
        if line.startswith('v '):
            p=line.split(); V.append((float(p[1]),float(p[2]),float(p[3])))
        elif line.startswith('g '):
            cur={'name':line[2:].strip(),'faces':[],'mats':collections.Counter()}; groups.append(cur)
        elif line.startswith('usemtl'):
            mat=line.split(None,1)[1].strip()
        elif line.startswith('f '):
            idx=[int(t.split('/')[0]) for t in line.split()[1:]]
            idx=[i-1 if i>0 else len(V)+i for i in idx]
            if cur is None: cur={'name':'_','faces':[],'mats':collections.Counter()}; groups.append(cur)
            cur['faces'].append((idx,mat)); cur['mats'][mat]+=1
    return np.array(V), groups
