import json, subprocess, os, shutil
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.abspath(__file__))
PPN = os.path.dirname(ROOT)
shell = open(f'{ROOT}/shell.html', encoding='utf-8').read()
main = open(f'{ROOT}/main.js', encoding='utf-8').read()
data = open(f'{ROOT}/data2.json', encoding='utf-8').read().replace('</', '<\\/')

# ------------------------------------------------ artifact (CDN)
art = (shell.replace('__HEADEXTRA__', '').replace('__INSTALL__', '').replace('__DATA__', data)
       .replace('__SCRIPTS__', '<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"}}</script>\n<script type="module">\n' + main + '\n</script>'))
open(f'{PPN}/Asoleamiento_Plan_Norte.html', 'w', encoding='utf-8').write(art)

# ------------------------------------------------ PWA (offline, sin CDN)
out = f'{PPN}/pwa'
shutil.rmtree(out, ignore_errors=True); os.makedirs(out)
src = main.replace("from 'three/addons/", "from 'three/examples/jsm/")
open('/tmp/t3/main_entry.js', 'w', encoding='utf-8').write(src)
subprocess.run(['/tmp/t3/node_modules/.bin/esbuild', '/tmp/t3/main_entry.js', '--bundle', '--format=iife', '--minify',
                '--target=es2020', '--outfile=/tmp/t3/bundle.js', '--log-level=warning'], check=True, cwd='/tmp/t3')
bundle = open('/tmp/t3/bundle.js', encoding='utf-8').read().replace('</script', '<\\/script')
head = '''<!doctype html>
<html lang="es"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#2c4a6b">
<meta name="description" content="Asoleamiento, visuales y correspondencias del Plan Particularizado Norte de San Andrés de Giles, con verificación de proyectos propios.">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icon-192.png">
<link rel="apple-touch-icon" href="icon-192.png">
<style>[hidden]{display:none!important}*{box-sizing:border-box}:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}</style>'''
pwa = (head + shell.replace('__HEADEXTRA__', '')
       .replace('__INSTALL__', '<button class="btn" id="install" hidden>Instalar app</button>')
       .replace('__DATA__', data)
       .replace('__SCRIPTS__', '<script>window.PPN_STANDALONE=true</script>\n<script>' + bundle + '</script>\n'
                '<script>if("serviceWorker" in navigator && /^https?:/.test(location.protocol)){navigator.serviceWorker.register("sw.js")}</script>')
       + '\n</body></html>')
# mover todo lo que precede a <div class="app"> al head
i = pwa.index('<div class="app">')
pwa = pwa[:i] + '</head>\n<body>\n' + pwa[i:]
open(f'{out}/index.html', 'w', encoding='utf-8').write(pwa)

manifest = {
    "name": "Asoleamiento Plan Norte · San Andrés de Giles", "short_name": "Plan Norte",
    "description": "Modelos 3D, asoleamiento, visuales y verificación de proyectos del Plan Particularizado Norte.",
    "start_url": "./index.html", "scope": "./", "display": "standalone", "orientation": "any",
    "background_color": "#eef0ea", "theme_color": "#2c4a6b", "lang": "es-AR",
    "icons": [{"src": "icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any"},
              {"src": "icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any"},
              {"src": "icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}],
    "file_handlers": [{"action": "./index.html#proyecto", "accept": {"model/obj": [".obj"], "model/vnd.collada+xml": [".dae"], "model/gltf-binary": [".glb"], "model/stl": [".stl"]}}]
}
json.dump(manifest, open(f'{out}/manifest.webmanifest', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
sw = '''const V="ppn-v2";const CORE=["./","./index.html","./manifest.webmanifest","./icon-192.png","./icon-512.png","./icon-maskable-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{const u=new URL(e.request.url);if(e.request.method!=="GET")return;
 if(u.origin===location.origin){e.respondWith(fetch(e.request).then(r=>{const cp=r.clone();caches.open(V).then(c=>c.put(e.request,cp));return r}).catch(()=>caches.match(e.request,{ignoreSearch:true}).then(r=>r||caches.match("./index.html"))));return}
 if(/fonts\\.(googleapis|gstatic)\\.com/.test(u.host)){e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{const cp=res.clone();caches.open(V).then(c=>c.put(e.request,cp));return res})))}});'''
open(f'{out}/sw.js', 'w').write(sw)

def icon(size, maskable=False):
    S = size * 4
    im = Image.new('RGBA', (S, S), (44, 74, 107, 255) if maskable else (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    pad = int(S * (0.18 if maskable else 0.04))
    if not maskable:
        d.rounded_rectangle([pad, pad, S - pad, S - pad], radius=int(S * 0.2), fill=(44, 74, 107, 255))
    cx, cy = S / 2, S * 0.62
    # arco solar
    r = S * 0.30
    d.arc([cx - r, cy - r, cx + r, cy + r], 200, 340, fill=(240, 164, 58, 255), width=int(S * 0.025))
    d.ellipse([cx + r * 0.62 - S * 0.06, cy - r * 0.78 - S * 0.06, cx + r * 0.62 + S * 0.06, cy - r * 0.78 + S * 0.06], fill=(240, 164, 58, 255))
    # manzana: bloques
    bw = S * 0.11
    for k, h in enumerate([0.16, 0.24, 0.12]):
        x = cx - S * 0.2 + k * (bw + S * 0.035)
        d.rectangle([x, cy - S * h, x + bw, cy + S * 0.02], fill=(232, 226, 214, 255))
    d.line([cx - S * 0.3, cy + S * 0.04, cx + S * 0.3, cy + S * 0.04], fill=(232, 226, 214, 255), width=int(S * 0.012))
    return im.resize((size, size), Image.LANCZOS)
icon(192).save(f'{out}/icon-192.png'); icon(512).save(f'{out}/icon-512.png'); icon(512, True).save(f'{out}/icon-maskable-512.png')
print('artifact', len(art) // 1024, 'KB · pwa', len(pwa) // 1024, 'KB')
