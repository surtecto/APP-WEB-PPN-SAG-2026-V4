const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun, Table, TableRow, TableCell, WidthType, AlignmentType,
  BorderStyle, ShadingType, PageBreak, Footer, Header, PageNumber, LevelFormat, TableOfContents } = require('docx');

const D = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'app', 'data2.json'), 'utf8'));
const SUN = JSON.parse(fs.readFileSync(path.join(__dirname, 'docdata.json'), 'utf8')).sun;
const FIG = path.join(__dirname, '..', 'fig3');
const INK = '24324A', MUT = '6B7178', ACC = 'B0412E', SUNC = 'D98A1C';
const nf = (v, d = 1) => Number(v).toLocaleString('es-AR', { minimumFractionDigits: d, maximumFractionDigits: d });
const pc = v => nf(v * 100, 0) + '%';
const hhmm = h => { const H = Math.floor(h), M = Math.round((h - H) * 60); return `${H}:${String(M).padStart(2, '0')}`; };

const P = (text, o = {}) => new Paragraph({ spacing: { after: 120, line: 290 }, alignment: o.align || AlignmentType.JUSTIFIED, ...o.p,
  children: Array.isArray(text) ? text : [new TextRun({ text, ...o.r })] });
const R = (t, o = {}) => new TextRun({ text: t, ...o });
const H1 = t => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [R(t)] });
const H2 = t => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [R(t)] });
const H3 = t => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [R(t)] });
const bullet = runs => new Paragraph({ numbering: { reference: 'b', level: 0 }, spacing: { after: 80, line: 280 }, children: Array.isArray(runs) ? runs : [R(runs)] });
function img(file, wcm, maxhcm = 21) {
  const buf = fs.readFileSync(path.join(FIG, file));
  const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
  let px = wcm / 2.54 * 96; const mh = maxhcm / 2.54 * 96; if (px * h / w > mh) px = mh * w / h;
  return new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new ImageRun({ type: 'png', data: buf, transformation: { width: px, height: px * h / w } })] });
}
const caption = t => new Paragraph({ spacing: { after: 200 }, children: [R(t, { italics: true, size: 17, color: MUT })] });
const border = { style: BorderStyle.SINGLE, size: 4, color: 'C9CDC4' };
const borders = { top: border, bottom: border, left: border, right: border };
function table(head, rows, widths, opt = {}) {
  const tot = widths.reduce((a, b) => a + b, 0);
  const mk = (cells, isHead) => new TableRow({ tableHeader: isHead, children: cells.map((c, i) => new TableCell({
    borders, width: { size: widths[i], type: WidthType.DXA },
    shading: isHead ? { fill: 'E6E9E1', type: ShadingType.CLEAR, color: 'auto' } : (c && c.fill ? { fill: c.fill, type: ShadingType.CLEAR, color: 'auto' } : undefined),
    margins: { top: 50, bottom: 50, left: 90, right: 90 },
    children: [new Paragraph({ alignment: i === 0 ? AlignmentType.LEFT : AlignmentType.CENTER,
      children: [R(String(c && c.t !== undefined ? c.t : c), { size: opt.size || 17, bold: !!(isHead || (c && c.b)), color: isHead ? INK : undefined })] })]
  })) });
  return new Table({ width: { size: tot, type: WidthType.DXA }, columnWidths: widths, rows: [mk(head, true), ...rows.map(r => mk(r, false))] });
}
const good = (v, g, m, d = 1) => ({ t: nf(v, d), fill: v >= g ? 'DCEBDC' : v >= m ? 'F6E7C8' : 'F2D6D0' });
const loss = v => ({ t: nf(v, 2), fill: v >= 1 ? 'F2D6D0' : v >= 0.5 ? 'F6E7C8' : undefined });
const quote = t => new Paragraph({ spacing: { before: 120, after: 120 }, indent: { left: 340 }, border: { left: { style: BorderStyle.SINGLE, size: 18, color: SUNC, space: 10 } }, children: [R(t, { italics: true, font: 'Georgia', size: 21, color: INK })] });
const brk = () => new Paragraph({ children: [new PageBreak()] });
const ZK = Object.keys(D.zones);
const focusIds = Z => Z.lots.filter(l => l.focus).map(l => l.id);
let nfig = 0, ntab = 0; const F = () => ++nfig, T = () => ++ntab;

// ================================================================ contenido
const ch = [];
ch.push(new Paragraph({ spacing: { before: 2000, after: 120 }, children: [R('MUNICIPIO DE SAN ANDRÉS DE GILES · DIRECCIÓN DE PLANEAMIENTO Y OBRAS PARTICULARES', { size: 17, color: MUT, characterSpacing: 20 })] }));
ch.push(new Paragraph({ spacing: { after: 160 }, children: [R('Plan Particularizado Norte', { size: 56, bold: true, color: INK, font: 'Georgia' })] }));
ch.push(new Paragraph({ spacing: { after: 400 }, children: [R('Asoleamiento, visuales y correspondencias perceptuales entre parcelas, zonas RN1 a RN9', { size: 30, color: INK, font: 'Georgia', italics: true })] }));
ch.push(new Paragraph({ border: { top: { style: BorderStyle.SINGLE, size: 8, color: SUNC, space: 8 } }, spacing: { after: 100 }, children: [R('Informe técnico · versión 4: norte real, exigencias de las fichas y volúmenes de referencia de las láminas', { size: 21 })] }));
ch.push(P([R(`Geolocalización de los modelos: ${nf(Math.abs(D.lat), 4)}° S · ${nf(Math.abs(D.lon), 4)}° O · UTC−3`, { size: 19, color: MUT })], { align: AlignmentType.LEFT }));
ch.push(P([R('San Andrés de Giles, 17 de octubre de 2026', { size: 19, color: MUT })], { align: AlignmentType.LEFT }));
ch.push(P([R('Arq. Juan Patricio Addesso – Mat. CAPBA 020811', { size: 19, color: MUT })], { align: AlignmentType.LEFT }));
ch.push(brk());
ch.push(new Paragraph({ children: [R('Índice', { bold: true, size: 28, color: INK, font: 'Georgia' })], spacing: { after: 160 } }));
ch.push(new TableOfContents('Índice', { hyperlink: true, headingStyleRange: '1-2' }));
ch.push(brk());

// 1
ch.push(H1('1. Objeto y alcance'));
ch.push(P('El Plan Particularizado Norte (PPN) pide a cada proyecto un estudio de asoleamiento de los ambientes de primera categoría y de las sombras sobre los linderos, y crea las "áreas de correspondencia" como espacio de acuerdo entre vecinos. Este informe anticipa ese estudio a escala de la norma. Lo hace sobre la imagen que el propio Plan propone: los volúmenes dibujados en las láminas de cada zona (archivos SketchUp N1 a N9, 2022).'));
ch.push(P([R('Criterio de esta versión. ', { bold: true }), R('El sol se calcula exclusivamente con el norte real del sector (la trama girada del Plano Director); el norte de las láminas es solo gráfico. Las medidas exigidas (FOS, FOT, alturas, retiros, frente y superficie mínima) son las de las fichas del Anexo I y son las que se verifican. Las láminas SketchUp aportan la tipología y la posición de los volúmenes como referencia gráfica para leer la vecindad; sus medidas no tienen precisión ni la necesitan, por lo que no se usan como norma.')]));
ch.push(P([R('Fuentes: ', { bold: true }), R('láminas SketchUp N1–N9 y N4-2 del PPN (exportadas con un script de consola Ruby que conserva cada cara, material, capa y transformación); Proyecto de Ordenanza y Anexo I PPN-2026; Plano Director PPN 01-2026; geolocalización guardada en los propios modelos.')]));

// 2
ch.push(H1('2. Localización y geometría solar'));
ch.push(P(`Los modelos traen su propia geolocalización (${nf(Math.abs(D.lat), 4)}° S, ${nf(Math.abs(D.lon), 4)}° O, UTC−3), que coincide con el sector norte de la localidad. Ese punto se adoptó para todo el cálculo.`));
ch.push(P([R('Norte real. ', { bold: true }), R('En el Plano Director la Av. Lucas Scully corre a 134° y la trama está girada 44°. Lo que las fichas llaman "frente al norte" es en realidad una fachada al NE, y "al sur", una fachada al SO. Ninguna fachada del Plan mira al norte puro: todas reciben el sol de forma oblicua.')]));
ch.push(img('carta_solar.png', 12)); ch.push(caption(`Figura ${F()}. Carta solar de San Andrés de Giles con los ejes de la trama real superpuestos. Algoritmo NOAA.`));
ch.push(table(['Fecha', 'Salida', 'Puesta', 'Duración', 'Mediodía solar', 'Altura máx.', 'Azimut salida / puesta'],
  SUN.map(s => [s.lab, hhmm(s.rise), hhmm(s.set), nf(s.set - s.rise) + ' h', hhmm(s.noon), nf(s.alt) + '°', `${nf(s.razi, 0)}° / ${nf(s.sazi, 0)}°`]), [2700, 900, 900, 1000, 1300, 1100, 1738]));
ch.push(caption(`Tabla ${T()}. Parámetros solares en las fechas de análisis.`));

// 3
ch.push(H1('3. Método'));
ch.push(H2('3.1 Geometría de las láminas'));
[
  'Exportación: cada cara de cada lámina, con sus agujeros y la transformación acumulada de grupos y componentes, en metros. Las figuras de entorno (árboles, personas, autos) se registraron por su caja envolvente.',
  'Clasificación: edificio (grupos de más de 2,4 m), cerco o plataforma baja, solado, seto ("vegetación") y alambrado. Los setos y alambrados se dibujan, pero no se cuentan como obstáculo para el sol, porque en las láminas son transparencias o vegetación.',
  'Arbolado: las copas de las láminas se modelan como volúmenes caducos. Solo intervienen en el escenario de verano "con árboles".',
  'Parcelas de referencia: las de cada lámina, ubicadas con el norte real. RN3 y RN8 construyen una sola parcela: en ellas el módulo se repitió en los lotes linderos para leer la vecindad.',
  'Áreas de correspondencia: las franjas que la lámina deja entre fondos o como pasaje, en azul en las figuras, como en las fichas.',
].forEach(t => ch.push(bullet(t)));
ch.push(H2('3.2 Exigencias de la ficha y lote tipo'));
ch.push(P('Para cada zona se construyó un lote tipo con el frente mínimo y la superficie mínima de la ficha, apoyado en la línea municipal de la parcela de referencia. Sobre él se dibujan, con los colores de las fichas, las exigencias: verde para retiros y altura, azul para el % de edificación y el área de correspondencias, rojo para el retiro lateral y amarillo para el norte. Los retiros que dependen de la orientación (frente al norte o al sur) se asignan según el norte real, y el retiro lateral "O" se ubica del lado del lote más expuesto al oeste. La altura se toma a 3 m por nivel, con la pendiente de 45° desde 3 m en las líneas de retiro.'));
ch.push(H2('3.3 Indicadores'));
[
  [R('Sol en el suelo libre: ', { bold: true }), R('grilla de 0,5 m (mapas a 1 m), cada 10 minutos con el sol a más de 2°, el 21 de junio, el equinoccio y el 21 de diciembre (con y sin arbolado). Se informan la media y el porcentaje con al menos 2 h.')],
  [R('Sol en fachadas: ', { bold: true }), R('puntos cada 2 m sobre cada cara exterior, a 1,5 m del piso de cada nivel. Se registra el máximo del 21 de junio y las medias del equinoccio y del verano.')],
  [R('Sol que se quita al vecino: ', { bold: true }), R('horas medias que pierde el suelo libre del lindero por los volúmenes del lote, calculadas en ambos sentidos.')],
  [R('Visuales y cielo: ', { bold: true }), R('m² de suelo libre vecino visibles desde ventanas de pisos altos a menos de 12 m (cono de ±65°), fracción de cielo visible desde el patio y profundidad visual desde el último piso.')],
].forEach(r => ch.push(bullet(r)));

// 4 exigencias
ch.push(brk());
ch.push(H1('4. Exigencias de las fichas'));
ch.push(P('Las exigencias de cada zona, tal como se aplican en el análisis y en la verificación de proyectos, son las siguientes:'));
const dr = [];
ZK.forEach(z => { const Z = D.zones[z]; (Z.read.ftxt || []).forEach((r, i) => dr.push([i === 0 ? { t: z, b: true } : '', r[0], r[1]])); });
ch.push(table(['Zona', 'Indicador', 'Exigencia de la ficha 2026'], dr, [900, 3100, 5638], { size: 16 }));
ch.push(caption(`Tabla ${T()}. Exigencias de las fichas del Anexo I PPN-2026 por zona.`));
[
  [R('FOT que no cierran: ', { bold: true }), R('en RN3 y RN4 la ficha pide FOT 1,2 y 1,5 con FOS 0,5 y PB+1, cuando el máximo posible es 1,0. En RN9, FOT 1,5 con FOS 0,4 y PB+2 tampoco se alcanza (máximo 1,2). Son inconsistencias internas de la ficha que conviene corregir antes de la sanción.')],
  [R('Retiros según orientación: ', { bold: true }), R('RN4, RN5 y RN9 distinguen la fila con frente al norte (30% de frente y 30% de fondo) de la fila con frente al sur (50% de fondo). Con la trama real, esos frentes son NE y SO; la asimetría sigue siendo eficaz.')],
].forEach(r => ch.push(bullet(r)));
ch.push(quote('Las láminas dibujan decisiones que la ficha no escribe —el patio en U, el pasaje verde, la franja de correspondencia—. ¿Deben pasar al texto como exigencias, o quedar como imagen orientativa que cada proyecto interpreta?'));

// 5 síntesis
ch.push(brk());
ch.push(H1('5. Síntesis comparativa'));
const rows = [];
ZK.forEach(z => { const Z = D.zones[z]; focusIds(Z).forEach(id => {
  const s = Z.modes.real.lots[id], pr = Z.modes.real.pairs.filter(p => p.a === id);
  const ex = Math.max(0, ...pr.map(p => p.inv_ab)); const vv = pr.reduce((m, p) => p.vis_ab > m[0] ? [p.vis_ab, p.d_ab || 0] : m, [0, 0]);
  const fa = (Z.modes.real.fach[id] || []).flatMap(f => f.levels.map(l => l.inv)); const svf = Z.modes.real.svf[id];
  rows.push([{ t: `${z} ${id}`, b: true }, s.front_or, good(s.sol.invierno.media, 4, 2), pc(s.sol.invierno.p2), `${nf(Math.max(...fa))} / ${nf(Math.min(...fa))}`, { t: nf(ex), fill: ex < 0.5 ? 'DCEBDC' : ex < 1 ? 'F6E7C8' : 'F2D6D0' }, `${vv[0]} m² · ${nf(vv[1])} m`, svf != null ? pc(svf) : '—']);
}); });
ch.push(table(['Lote', 'Frente', 'Patio 21 jun (h)', '≥ 2 h', 'Fachada mejor / peor (h)', 'Sol que quita (h)', 'Visual sobre vecino', 'Cielo visible'], rows, [1100, 900, 1200, 1000, 1400, 1200, 1700, 1138], { size: 15 }));
ch.push(caption(`Tabla ${T()}. Indicadores del 21 de junio por lote analizado. "Sol que quita" es el máximo sobre sus linderos (norte real); la visual es el máximo de m² de suelo libre vecino visible y su distancia mínima.`));
ch.push(P('Tres lecturas surgen de la síntesis.'));
ch.push(P('Primero, el patio no es uniformemente bueno. Con los volúmenes de referencia, RN1 (2,1 h), RN5 norte (3,4 h), RN7 (3,4 h) y RN9 norte (3,7 h) quedan claramente por debajo del resto. En RN1 y RN9 norte, además, el patio ve menos del 40% del cielo.'));
ch.push(P('Segundo, el costo de las zonas de tres niveles se paga en el fondo del vecino: RN7 sobre RN6 (2,6–2,9 h) y RN9 norte sobre RN9 sur (2,0 h). Las zonas de PB+1 se mantienen por debajo de 1 h.'));

// 6 zonas
ZK.forEach((z, zi) => {
  const Z = D.zones[z], m = Z.meta, r = Z.read, ids = focusIds(Z);
  ch.push(brk());
  ch.push(H1(`6.${zi + 1} ${z} · ${m.nombre}`));
  ch.push(P([R(`Ficha 2026: densidad ${m.dens} hab/ha · FOS ${nf(m.fos, 2)} · FOT ${nf(m.fot)} · ${m.alt} · frente mín. ${m.frente} m · sup. mín. ${m.supmin} m² · ${m.lotes} parcelas. Volúmenes de referencia: lámina ${Z.src}${Z.rep ? ' (módulo replicado en los linderos)' : ''}.`, { size: 18, color: MUT })], { align: AlignmentType.LEFT }));
  ch.push(P(r.situacion));
  ch.push(img(`${z}_3d.png`, 17, 12)); ch.push(caption(`Figura ${F()}. ${z}: volúmenes de referencia de la lámina ${Z.src} con sombras el 21 de junio a las 15:30 (norte real) y las exigencias de la ficha sobre el lote tipo (contorno verde): en verde, retiros y altura; en azul, % de edificación y área de correspondencias; en rojo, retiro lateral; en amarillo, el norte.`));
  ch.push(table(['Indicador', 'Exigencia de la ficha 2026'], (r.ftxt || []).map(x => [x[0], x[1]]), [3600, 6038]));
  ch.push(caption(`Tabla ${T()}. ${z}: exigencias de la ficha.`));
  ch.push(H3('Sol'));
  ch.push(P(r.sol));
  ch.push(img(`${z}_plan.png`, 17, 11)); ch.push(caption(`Figura ${F()}. ${z}: horas de sol directo el 21 de junio (norte real). Flechas: horas que un lote le quita al suelo libre del vecino (≥ 0,3 h). En azul, el área de correspondencias.`));
  const fr = [];
  ids.forEach(id => ['real'].forEach(o => { const s = Z.modes[o].lots[id];
    fr.push([{ t: `Lote ${id} (frente ${s.front_or})`, b: true }, good(s.sol.invierno.media, 4, 2), pc(s.sol.invierno.p2), nf(s.sol.equinoccio.media), nf(s.sol.verano.media), nf(s.sol.verano_arb.media), `${pc(s.sombra['15'])} (${pc(s.sombra['15_arb'])})`]); }));
  ch.push(table(['Suelo libre del lote', '21 jun (h)', '≥ 2 h', 'Equin. (h)', '21 dic (h)', '21 dic con árboles', 'Sombra 21 dic 15 h (con árboles)'], fr, [2638, 1000, 900, 1000, 1000, 1300, 1800]));
  ch.push(caption(`Tabla ${T()}. ${z}: sol en el suelo libre del lote analizado.`));
  const fa = [];
  ids.forEach(id => (Z.modes.real.fach[id] || []).forEach(f => { const lv = f.levels; fa.push([`${id} · ${f.role} ${f.orient}`, `${lv.map(x => x.l === 0 ? 'PB' : x.l + '°').join(', ')}`, good(Math.min(...lv.map(x => x.inv)), 3, 2), good(Math.max(...lv.map(x => x.inv)), 3, 2), nf(lv.reduce((a, x) => a + x.eq, 0) / lv.length), nf(lv.reduce((a, x) => a + x.ver, 0) / lv.length)]); }));
  if (fa.length) { ch.push(table(['Fachada', 'Niveles', '21 jun nivel más bajo', '21 jun nivel más alto', 'Equin. medio', '21 dic medio'], fa, [2638, 1400, 1400, 1400, 1400, 1400])); ch.push(caption(`Tabla ${T()}. ${z}: horas de sol en fachadas (máximo de la cara el 21 de junio; media en equinoccio y verano).`)); }
  ch.push(H3('Vecinos y correspondencias'));
  ch.push(P(r.vecinos));
  const pr = Z.modes.real.pairs.map(p => [`${p.a} → ${p.b} (${p.zb}, ${p.rel})`, loss(p.inv_ab), loss(p.inv_ba), `${p.vis_ab} m²${p.d_ab ? ' · ' + nf(p.d_ab) + ' m' : ''}`, `${p.vis_ba} m²${p.d_ba ? ' · ' + nf(p.d_ba) + ' m' : ''}`]);
  ch.push(table(['Par de lotes', 'Sol que quita (h)', 'Sol que pierde (h)', 'Ve del vecino', 'Es visto por el vecino'], pr, [3238, 1400, 1400, 1800, 1800], { size: 16 }));
  ch.push(caption(`Tabla ${T()}. ${z}: correspondencias de sol (21 de junio) y visuales de cada lote analizado con sus linderos.`));
  ch.push(quote(r.pregunta));
  ch.push(P([R('Propuesta para el estudio particularizado. ', { bold: true, color: ACC }), R(r.recomendacion)]));
});

// 7
ch.push(brk());
ch.push(H1('7. Lecturas transversales'));
D.general.forEach(([t, d]) => { ch.push(H3(t)); ch.push(P(d)); });

// 8 criterios
ch.push(H1('8. Criterios propuestos para reglamentar el estudio de asoleamiento'));
ch.push(P('La ficha deja abiertas las "horas mínimas deseables" y las "mínimas proyecciones de sombra". Con las exigencias de la ficha y los volúmenes de referencia, se proponen los umbrales siguientes:'));
[
  [R('Volumen de referencia: ', { bold: true }), R('el estudio particularizado compara el sol que el proyecto le quita a cada vecino con el que le quitaba el volumen de referencia de la lámina; si lo supera, debe justificar la diferencia o retranquear.')],
  [R('Retiros según orientación: ', { bold: true }), R('sostener la asimetría de la ficha (30% de frente y 30% de fondo en la fila con frente al norte; 50% de fondo en la del sur), que en la trama real corresponde a frentes NE y SO.')],
  [R('Locales de primera categoría: ', { bold: true }), R('al menos un local de estar por unidad con ≥ 2 h de sol directo el 21 de junio. En la trama real, las caras SO y SE no superan 1,2 h: toda unidad necesita una cara NE o NO.')],
  [R('Patio propio: ', { bold: true }), R('al menos el 50% del suelo libre con ≥ 2 h el 21 de junio. RN1 (53%) y RN9 norte (73%, pero con un 18% de cielo visible) están en el límite: conviene exigir además un mínimo de cielo visible del 35% desde el centro del patio.')],
  [R('Patio del vecino: ', { bold: true }), R('ningún lindero pierde más de 1 h de sol medio el 21 de junio por el proyecto. Hoy no lo cumplen RN7 sobre RN6 (2,6–2,9 h) ni RN9 norte sobre sur (2,0 h). En esos casos debe ajustarse la posición o el escalonamiento de los volúmenes, no solo su cantidad.')],
  [R('Sombra de verano: ', { bold: true }), R('al menos el 30% del patio sombreado a las 15 h del 21 de diciembre, con el arbolado caduco incluido. Con arbolado se logra en RN3, RN8 y RN9 sur; en el resto hay que exigirlo.')],
  [R('Visuales: ', { bold: true }), R('los vanos de pisos altos que enfrentan suelo libre vecino a menos de 6 m (típico en RN3, RN5 y RN8) llevan filtro: parasol, celosía o pantalla vegetal acordada en el área de correspondencia.')],
  [R('Coherencia de la ficha: ', { bold: true }), R('antes de la sanción, corregir los FOT inalcanzables (RN3, RN4 y RN9).')],
].forEach(r => ch.push(bullet(r)));

// 9 preguntas
ch.push(H1('9. Preguntas abiertas'));
ch.push(P('Las cifras ordenan la discusión, pero no la cierran.'));
[
  [R('¿Imagen o regla? ', { bold: true }), R('Las láminas contienen más inteligencia ambiental que las fichas: la asimetría de fondos, el pasaje, la U. Pero una imagen no obliga. Si el Plan no traduce esas decisiones a texto, la mejor parte del proyecto urbano queda como ilustración.')],
  [R('¿Puntos cardinales o relaciones? ', { bold: true }), R('Con la trama girada, las caras SO y SE quedan sin sol de invierno. ¿Debe la norma hablar de "frente al norte" o de relaciones ("cada lote absorbe su sombra")?')],
  [R('¿Cuánto y dónde? ', { bold: true }), R('RN7 cumple su FOS y produce el peor daño del Plan. La correspondencia no se regula con porcentajes, sino con posiciones relativas entre vecinos que no se eligen.')],
  [R('¿Sol de invierno o calor de verano? ', { bold: true }), R('Con veranos más largos, el patio NE de RN3 o RN8 (casi 11 h de sol el 21 de diciembre) puede ser un problema por exceso. El árbol pasa a ser infraestructura climática, y su ausencia, un déficit tan medible como una sombra.')],
  [R('¿Qué tan lejos llega un modelo? ', { bold: true }), R('Los volúmenes de las láminas son prefiguraciones, no edificios. Una buena arquitectura puede resolver lo que aquí aparece como conflicto. El valor del modelo está en indicar dónde mirar, no en dictaminar.')],
].forEach(r => ch.push(bullet(r)));

// 10 entregables
ch.push(H1('10. Entregables y limitaciones'));
[
  'Visor 3D (página web publicada y aplicación instalable en computadoras de escritorio, que funciona sin conexión): permite elegir zona, fecha y hora con el norte real. Muestra la sombra en vivo, los mapas de horas de sol (incluido el verano con arbolado), el recorrido solar, las visuales, las correspondencias y las exigencias de la ficha con las referencias gráficas de las fichas.',
  'Pestaña "Mi proyecto": carga un modelo propio (.dae de SketchUp, .obj, .glb o .stl), lo ubica en un lote tipo con el frente y la superficie mínima de la ficha, entre los vecinos de referencia, y lo verifica contra las exigencias de la ficha 2026 (FOS, FOT, altura, retiros y pendiente de 45°). Calcula el sol propio, el que pierde cada vecino (comparado con el volumen de referencia), las fachadas por nivel y las visuales, marca los puntos críticos en 3D y emite un informe.',
  'Modelos RN1.obj a RN9.obj de las escenas de referencia, en metros y con grupos por lote y clase de geometría.',
  'Figuras del informe y código de cálculo (Python) para repetir el análisis sobre nuevas láminas.',
].forEach(t => ch.push(bullet(t)));
ch.push(P([R('Limitaciones. ', { bold: true }), R('Los volúmenes de vecindad son los de las láminas (referencia gráfica, sin precisión dimensional), sin topografía ni edificación existente fuera de cada escena. Las láminas de un solo lote (RN3, RN8) se replicaron en los linderos. Los setos y alambrados no se consideran obstáculos. Los resultados describen la capacidad de la norma y de su imagen, y no reemplazan el estudio particularizado de cada proyecto.')]));

// firma
const firma = fs.readFileSync(path.join(__dirname, 'firma_rgba.png'));
ch.push(new Paragraph({ spacing: { before: 600 }, alignment: AlignmentType.RIGHT, children: [new ImageRun({ type: 'png', data: firma, transformation: { width: 130, height: 110 } })] }));
ch.push(new Paragraph({ alignment: AlignmentType.RIGHT, border: { top: { style: BorderStyle.SINGLE, size: 4, color: '555555', space: 4 } }, indent: { left: 5200 }, children: [R('Arq. Juan Patricio Addesso – Mat. CAPBA 020811', { size: 19 })] }));
ch.push(new Paragraph({ alignment: AlignmentType.RIGHT, children: [R('Director de Planeamiento y Obras Particulares · Municipio de San Andrés de Giles', { size: 17, color: MUT })] }));

const doc = new Document({
  creator: 'Arq. Juan Patricio Addesso', title: 'PPN · Asoleamiento, visuales y correspondencias',
  styles: {
    default: { document: { run: { font: 'Calibri', size: 20 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 32, bold: true, font: 'Georgia', color: INK }, paragraph: { spacing: { before: 240, after: 160 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 25, bold: true, font: 'Georgia', color: INK }, paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 21, bold: true, color: ACC }, paragraph: { spacing: { before: 160, after: 80 }, outlineLevel: 2 } },
    ]
  },
  numbering: { config: [{ reference: 'b', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 400, hanging: 260 } } } }] }] },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
    headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [R('PPN San Andrés de Giles · Asoleamiento y correspondencias · norte real', { size: 15, color: MUT })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [R('Página ', { size: 15, color: MUT }), new TextRun({ children: [PageNumber.CURRENT], size: 15, color: MUT })] })] }) },
    children: ch
  }]
});
Packer.toBuffer(doc).then(b => { fs.writeFileSync(path.join(__dirname, 'PPN_Asoleamiento_v4.docx'), b); console.log('ok', nfig, ntab); });
