# -*- coding: utf-8 -*-
"""Lecturas por zona sobre los volúmenes de las láminas PPN (SketchUp 2022), norte real; exigencias de las fichas."""

READ = {
 'RN1': dict(
  situacion='Tipología de la lámina N1: edificio en U de PB+2 sobre el Boulevard San Andrés, con el patio abierto hacia el lado del vecino. La ficha exige FOS 0,50, FOT 1,5 y PB+2 (9 m), con frente mínimo de 20 m y 600 m², retiro lateral del 20% del lado O y edificación de PB+2 hasta el 30% de la profundidad, PB+1 hasta el 50%, y fondo libre a partir de esa línea. El sol y las correspondencias se calcularon sobre el volumen de referencia de la lámina; la verificación de proyectos usa las medidas de la ficha.',
  sol='Con la trama real, el frente mira al NO y recibe 7,2 h el 21 de junio. El patio de la U, en cambio, promedia 2,1 h, y solo el 53% de su suelo supera las 2 h. Es el patio más sombrío del Plan, y lo encierran los propios brazos del edificio: desde su centro se ve el 40% del cielo. La fachada lateral SO de la U no recibe más de 0,8 h en ningún nivel.',
  vecinos='En el volumen de referencia, las dos U se suceden en la misma dirección, de modo que el patio de una enfrenta la medianera ciega de la siguiente. A0 pierde 0,47 h por A1 y, del otro lado, no le quita prácticamente nada a A1 (0,01 h). En cambio, hay 94–95 m² de patio vecino visibles a 8 m desde los pisos altos.',
  pregunta='Una U que repite su orientación produce un patio propio en sombra y otro ajeno a la vista. ¿El patio de la U debería abrirse hacia su propio norte, aunque eso obligue a alternar la tipología lote por lote, o la norma debería fijar la orientación del vacío en lugar de su porcentaje?',
  recomendacion='Exigir que el patio principal de la U reciba al menos 2 h el 21 de junio en el 70% de su superficie, y orientar la abertura del patio hacia el NE en la trama real. Tratar la terraza como retiro del último nivel, no como volumen adicional.'),
 'RN2': dict(
  situacion='Tipología de la lámina N2: dos barras en la rótula de la rotonda, separadas por un pasaje verde y giradas respecto de la trama. La ficha exige FOS 0,50, FOT 2,5 y PB+4 (15 m), con frente mínimo de 30 m y 1.000 m², retiro lateral del 20% y fondo libre del 38%. El sol se calculó sobre el volumen de referencia de la lámina; la verificación usa las medidas de la ficha.',
  sol='El patio de fondo queda hacia el norte del edificio y recibe 6,1 h en invierno (82% del suelo con más de 2 h). Es el mejor patio de las zonas densas. La contrafachada N recibe 9,3 h en todos los niveles; la fachada S a la calle no recibe sol de invierno y apenas 1 h en el equinoccio.',
  vecinos='El pasaje verde funciona como área de correspondencia efectiva: entre B0 y B1 no hay pérdidas de sol de invierno medibles. La barra de 20 m sí proyecta su sombra sobre la calle y la vereda sur durante todo el invierno.',
  pregunta='La densidad más alta del Plan es también la que mejor resuelve su propio sol, porque concentra la sombra sobre la calle. ¿Es aceptable que la calle pague el costo climático de la densidad, o la vereda sur debería tener una garantía de sol (un ancho mínimo, arbolado de hoja caduca, prohibición de toldos fijos)?',
  recomendacion='Mantener el pasaje verde de la lámina como servidumbre de correspondencia entre las dos parcelas. Sostener el fondo libre del 38% de la ficha. Si se busca alcanzar el FOT 2,5, hacerlo en altura sobre la barra y no ocupando el fondo.'),
 'RN3': dict(
  situacion='Tipología de la lámina N3: vivienda de PB+1 sobre la línea municipal, de medianera a medianera, con el fondo libre. La lámina construye una sola parcela; el módulo se repitió en los lotes linderos para leer la vecindad. La ficha exige FOS 0,50, FOT 1,2 y PB+1 (6 m), con frente mínimo de 12 m, 300 m² y fondo libre del 50%. Nota: con FOS 0,5 y PB+1, el FOT 1,2 es aritméticamente inalcanzable (el máximo es 1,0).',
  sol='En su ubicación real sobre Av. Scully, el frente mira al SO. El fondo queda al NE: el patio recibe 8,5 h en invierno y el 98% supera las 2 h. La contrafachada NE recibe 7,5 h; el frente SO, 0,8 h. En verano el patio es todo sol (10,8 h), y solo el arbolado lo baja a 5,5 h, con el 64% de sombra a las 15 h.',
  vecinos='Entre módulos iguales, las pérdidas son pequeñas: hasta 0,3 h en invierno y 0,9 h en el equinoccio, del lote de un lado al del otro. Las visuales sí son intensas: entre 67 y 76 m² de patio vecino se ven desde el piso alto, a 3,6–4,2 m.',
  pregunta='El patio es tan soleado que la cuestión se invierte: ¿quién garantiza la sombra de verano? Además, con visuales a 4 m entre pisos altos, ¿es compatible la intimidad del fondo con la ventana alta hacia el patio que la tipología necesita para ventilar?',
  recomendacion='Exigir arbolado de hoja caduca en el fondo (al menos un ejemplar por lote, que dé ≥ 30% de sombra a las 15 h del 21 de diciembre). Restringir los vanos de piso alto hacia los laterales a menos de 4 m. Corregir el FOT de la ficha a 1,0, o habilitar un tercer nivel parcial.'),
 'RN4': dict(
  situacion='Tipología de la lámina N4: doble fila de viviendas de PB+1 espalda con espalda, separadas por la banda verde compartida. La ficha exige FOS 0,50, FOT 1,5 y PB+1, con frente mínimo de 20 m y 600 m². Los retiros cambian según la orientación: en la fila con frente al norte, 30% de frente y 30% de fondo; en la fila con frente al sur, fondo libre del 50%. Con FOS 0,5 y PB+1 el FOT 1,5 no se puede alcanzar (el máximo es 1,0).',
  sol='En la fila norte, el jardín de frente al NE y el patio suman 4,7 h en invierno (84% con más de 2 h). En la fila sur, con el fondo hacia el NE, el patio llega a 7,4 h. Las fachadas NE reciben 7,3 h y las SO, 0,8 h, de modo que cada vivienda tiene una cara al sol y otra a la sombra.',
  vecinos='De fondo, la fila norte le quita 0,87 h a la sur. Esa pérdida es menor de lo que la profundidad haría prever, porque la asimetría de fondos (30% contra 50%) la compensa. De costado, el lote S1 le quita 1,06 h al S2, que en la lámina está vacío. En cuanto a visuales, desde S1 se ven 322 m² del patio de S2 a 3,4 m.',
  pregunta='El cálculo muestra que la asimetría de fondos de la ficha sirve. Pero en la vecindad lateral, ¿qué pasa cuando el lote de al lado todavía está vacío y el primero que construye toma todo el sol disponible? ¿La norma tiene que proteger también al que llega segundo?',
  recomendacion='Sostener la asimetría de retiros de la ficha (30% + 30% en la fila con frente al norte, 50% de fondo en la del sur) y corregir el FOT a 1,0. Exigir que el estudio particularizado evalúe la pérdida que se impone al lote lindero aunque esté vacío.'),
 'RN5': dict(
  situacion='Tipología de la lámina N5: dos filas de viviendas de PB+1 en lotes angostos, espalda con espalda. La ficha exige FOS 0,50, FOT 1,0 y PB+1, con frente mínimo de 12 m y 300 m². Fila con frente al norte: 30% de retiro de frente y 30% de fondo; fila con frente al sur: fondo libre del 50%.',
  sol='En la fila norte, el jardín de frente NE y el patio dan 3,4 h en invierno (64% con más de 2 h). En la fila sur, el fondo recibe 4,8 h (88%). En las dos filas la fachada NE recibe 7,5 h y la SO, 0,7–0,8 h.',
  vecinos='De fondo, la fila norte le quita 0,87 h a la sur. De costado, entre módulos iguales de la fila sur, cada vivienda le quita 0,7 h al lote del SE. Las visuales laterales entre pisos altos se dan a 3,6–4,9 m, con 61–99 m² de patio vecino a la vista.',
  pregunta='La ficha iguala porcentajes entre las dos filas, pero el patio de la fila norte recibe 1,4 h menos de sol. ¿La equidad tiene que medirse en metros de retiro o en horas de sol? Si es en horas, ¿no debería la fila norte poder correr su volumen hacia el frente y liberar el fondo?',
  recomendacion='Mantener los retiros de la ficha, pero permitir en la fila norte que el retiro de frente baje al 20% siempre que el fondo crezca en igual medida. Exigir que el vacío lateral (cuando lo haya) quede del lado SE, hacia donde cae la propia sombra.'),
 'RN6': dict(
  situacion='Las parcelas RN6 forman, en la lámina N7, la fila sur de la manzana RN7, con un bloque sobre la línea municipal y el fondo hacia la banda verde compartida. La ficha exige FOS 0,40, FOT 0,8 y PB+2 (máximo 2 unidades funcionales), con frente mínimo de 20 m, 375 m² y fondo libre del 50%.',
  sol='El patio de R2 da 3,9 h en invierno (76% con más de 2 h) y la contrafachada NE, 7,2–7,5 h. El problema no es interno: llega desde el norte.',
  vecinos='La parcela RN7 A, de 85 m de profundidad y PB+2, le quita al patio de R2 2,68 h de sol de invierno, y entre 2,6 y 2,9 h a R1 y R3. Es la correspondencia más desfavorable de todo el Plan. Entre lotes RN6, la pérdida lateral es de 0,4 h.',
  pregunta='El fondo de RN6 linda con el costado de un edificio de 85 m de largo, y ninguno de los dos lotes "ve" la regla del otro. ¿El área de correspondencia de 3 m que dibuja la lámina alcanza, o el retiro que protege a RN6 tiene que estar del lado de RN7, como condición de su mayor superficie?',
  recomendacion='Exigir a RN7 un retiro de 10 m o más frente a RN6, con un límite de pérdida ≤ 1 h el 21 de junio sobre los patios RN6.'),
 'RN7': dict(
  situacion='Tipología de la lámina N7: dos grandes parcelas separadas por un pasaje, ocupadas por barras de PB+2 que recorren casi toda la profundidad, con la fila RN6 al sur. La ficha exige FOS 0,40, FOT 0,8 y PB+2, con frente mínimo de 40 m, 2.000 m², retiro de frente del 10%, laterales del 20% (O) y del 10% (E) y fondo del 10%.',
  sol='El suelo libre de la parcela A promedia 3,4 h en invierno (71% con más de 2 h). Las fachadas NE y NO reciben 6–8,7 h; la SE, 1,2 h, y la contrafachada SO, entre 0 y 0,8 h.',
  vecinos='Es el hallazgo principal del estudio. La parcela A le quita entre 2,6 y 2,9 h de sol de invierno a los patios de RN6 que tiene al sur (R1–R3). A la parcela B, cruzando el pasaje, le quita 0,6 h, y a los lotes de borde O, hasta 0,5 h. Desde los pisos altos de RN6 se ven 40–50 m² del suelo de A a 10–11 m.',
  pregunta='RN7 se presenta como "multifamiliar de baja ocupación con usos comunes", y en efecto ocupa poco. Sin embargo, la manera de ocupar, una barra larga junto a un vecino pequeño, produce la peor correspondencia del Plan. ¿Alcanza con regular cuánto se ocupa, o hay que regular dónde?',
  recomendacion='Exigir que en RN7 los volúmenes se separen del límite con RN6 (10 m o más como punto de partida, o que bajen a PB en los últimos 12 m). Fijar un límite de pérdida ≤ 1 h sobre los patios RN6. Destinar la franja liberada a uso común y arbolado caduco.'),
 'RN8': dict(
  situacion='Tipología de la lámina N8: vivienda de PB+1 junto al canal, de medianera a medianera y sobre la línea municipal. La lámina construye una sola parcela; el módulo se repitió en los linderos. La ficha exige FOS 0,40, FOT 0,8 y PB+1 (6 m), con frente mínimo de 15 m, 375 m² y fondo libre del 40%.',
  sol='El frente mira al SE y el fondo al NO. El patio recibe 6,7 h en invierno (90% con más de 2 h) y la contrafachada NO, 7,2 h; el frente SE, 1,2 h.',
  vecinos='Entre módulos iguales, cada vivienda le quita 0,17–0,33 h al lote lindero. A 3,8 m de distancia, hay unos 80 m² de patio vecino visibles desde el piso alto.',
  pregunta='Esta zona linda con el canal y el Parque, el borde más sensible del Plan, ¿Alcanza con FOS 0,40 y un fondo libre del 40%, o el fondo de estas parcelas debería pensarse como parte del corredor verde del canal y no como patio privado?',
  recomendacion='Con FOS 0,40, la vivienda de 15 m de frente tiene 12 m de profundidad y el fondo libre llega a 18 m hacia el parque. Exigir el suelo absorbente y el arbolado del fondo como continuidad del corredor verde del canal.'),
 'RN9': dict(
  situacion='Tipología de la lámina N9: dos pares de edificios de PB+2 espalda con espalda, con la banda verde compartida; el volumen de referencia agrega un remate de terraza. La ficha exige FOS 0,40, FOT 1,5 y PB+2 (9 m), con frente mínimo de 20 m, 600 m² y retiro lateral del 20% (lado O). Fila con frente al norte: 30% de frente y 30% de fondo; fila con frente al sur: fondo libre del 50%.',
  sol='El suelo libre de la fila norte da 3,7 h en invierno, pero desde el patio central solo se ve el 18% del cielo (el valor más bajo del Plan). La fila sur llega a 6,0 h. En las dos filas, las fachadas NE y NO reciben más de 7 h y las SO/SE, entre 0,8 y 1 h.',
  vecinos='De fondo, la fila norte le quita 1,97 h al patio de la fila sur. Es la segunda correspondencia más desfavorable del Plan: con 12 m de altura, la banda verde no alcanza. Entre lotes laterales de la misma fila, las pérdidas no superan 0,15 h. Las visuales sobre el fondo vecino ocurren a 11,4 m.',
  pregunta='El remate de terraza convierte 9 m en 12 m, y esos 3 m son los que reparten la sombra sobre el fondo vecino. ¿La terraza es un remate del edificio o un nivel más? Si es un nivel más, ¿debería tener su propio retiro sobre el contrafrente?',
  recomendacion='Retirar el nivel de terraza de la línea de contrafrente (6 m o más) y verificar con el estudio particularizado que la pérdida sobre la fila sur baje de 1 h. Exigir el retiro lateral del 20% de la ficha y evaluar ubicarlo del lado SE, hacia donde cae la propia sombra. Mantener el fondo del 50% en la fila sur.'),
}

GENERAL = [
 ('Norte real, medidas de ficha', 'El análisis usa solo el norte real (la trama girada del Plano Director). Las láminas aportan la tipología y la posición de los volúmenes como referencia gráfica; las medidas exigidas (FOS, FOT, alturas, retiros, frente y superficie mínima) son las de las fichas, y con ellas se verifica cualquier proyecto.'),
 ('Ninguna fachada al norte puro', 'Con la trama girada 44°, el NE recibe unas 7,3 h el 21 de junio y el SO, 0,8 h. Toda unidad con un único frente al SO o al SE queda sin sol de invierno en la práctica: necesita una cara NE o NO.'),
 ('Espalda con espalda', 'En todas las manzanas dobles, la fila norte le quita sol de invierno al fondo de la fila sur: 0,87 h en RN4 y RN5 (PB+1) y 1,97 h en RN9 (con el remate de terraza del volumen de referencia). La asimetría de fondos de la ficha (30% al norte y 50% al sur) compensa el intercambio en las zonas bajas, pero no en las de tres niveles.'),
 ('La peor correspondencia: RN7 sobre RN6', 'Las barras de la parcela RN7 A, largas y de 9 m de alto sobre el límite sur, le quitan entre 2,6 y 2,9 h de sol de invierno a los patios RN6. Una zona de "baja ocupación" puede producir el daño más grande si ocupa donde no debe. La correspondencia hay que regularla por posición, no solo por cantidad.'),
 ('Patios que se miran', 'En los tejidos de medianera (RN3, RN5, RN8) las ventanas altas ven el patio vecino a 3,4–4,9 m. En las tipologías de patio (RN1) esa distancia es de 8 m, y en RN7 y RN9, de 10–12 m. Por debajo de unos 6 m, el área de correspondencia tiene que traducirse en vanos restringidos o pantallas vegetales.'),
 ('Sombra de verano', 'A las 15 h del 21 de diciembre la edificación sombrea entre el 11% y el 56% de los patios. Con arbolado caduco, la sombra sube hasta el 41–64% en RN3, RN8 y RN9 sur. El árbol es la única infraestructura de sombra de los patios orientados al NE.'),
 ('FOT que no cierran', 'En RN3 y RN4, la ficha pide un FOT de 1,2–1,5 con PB+1 y FOS 0,5, lo que es aritméticamente imposible (el máximo es 1,0). En RN9, un FOT de 1,5 con FOS 0,4 y PB+2 tampoco se alcanza (máximo 1,2). Son inconsistencias de la ficha que conviene corregir antes de la aprobación.'),
]

# Exigencias de la ficha (fracciones de W o D; lat_side 'O' = lado más al oeste con norte real)
FICHA = {
 'RN1': dict(lat=0.20, lat_side='O', ff=0.0, fb=0.50, steps=[(0.30, 3), (0.50, 2)], lv=3),
 'RN2': dict(lat=0.20, lat_side='O', ff=0.0, fb=0.38, lv=5),
 'RN3': dict(ff=0.0, fb=0.50, lv=2),
 'RN4': dict(N=dict(ff=0.30, fb=0.30), S=dict(ff=0.0, fb=0.50), lv=2),
 'RN5': dict(N=dict(ff=0.30, fb=0.30), S=dict(ff=0.0, fb=0.50), lv=2),
 'RN6': dict(ff=0.0, fb=0.50, lv=3),
 'RN7': dict(lat=0.20, lat_side='O', latE=0.10, ff=0.10, fb=0.10, lv=3),
 'RN8': dict(ff=0.0, fb=0.40, lv=2),
 'RN9': dict(lat=0.20, lat_side='O', N=dict(ff=0.30, fb=0.30), S=dict(ff=0.0, fb=0.50), lv=3),
}
FTXT = {
 'RN1': [('FOS / FOT', '0,50 / 1,5'), ('Altura', 'PB+2 (9 m)'), ('Frente / superficie mínima', '20 m / 600 m²'), ('Retiro lateral', '20% del lado O'), ('Profundidad edificable', 'PB+2 hasta 30%, PB+1 hasta 50% de la profundidad'), ('Pendiente de retiros', '45° desde 3 m')],
 'RN2': [('FOS / FOT', '0,50 / 2,5'), ('Altura', 'PB+4 (15 m)'), ('Frente / superficie mínima', '30 m / 1.000 m²'), ('Retiro lateral', '20%'), ('Fondo libre', '38%'), ('Pendiente de retiros', '45° desde 3 m')],
 'RN3': [('FOS / FOT', '0,50 / 1,2 (máx. posible 1,0)'), ('Altura', 'PB+1 (6 m)'), ('Frente / superficie mínima', '12 m / 300 m²'), ('Fondo libre', '50%'), ('Pendiente de retiros', '45° desde 3 m')],
 'RN4': [('FOS / FOT', '0,50 / 1,5 (máx. posible 1,0)'), ('Altura', 'PB+1 (6 m)'), ('Frente / superficie mínima', '20 m / 600 m²'), ('Frente al norte', 'retiro de frente 30%, fondo 30%'), ('Frente al sur', 'fondo libre 50%'), ('Pendiente de retiros', '45° desde 3 m')],
 'RN5': [('FOS / FOT', '0,50 / 1,0'), ('Altura', 'PB+1 (6 m)'), ('Frente / superficie mínima', '12 m / 300 m²'), ('Frente al norte', 'retiro de frente 30%, fondo 30%'), ('Frente al sur', 'fondo libre 50%'), ('Pendiente de retiros', '45° desde 3 m')],
 'RN6': [('FOS / FOT', '0,40 / 0,8'), ('Altura', 'PB+2 (9 m), máx. 2 UF'), ('Frente / superficie mínima', '20 m / 375 m²'), ('Fondo libre', '50%'), ('Pendiente de retiros', '45° desde 3 m')],
 'RN7': [('FOS / FOT', '0,40 / 0,8'), ('Altura', 'PB+2 (9 m)'), ('Frente / superficie mínima', '40 m / 2.000 m²'), ('Retiro de frente', '10%'), ('Retiros laterales', '20% (O) y 10% (E)'), ('Fondo libre', '10%')],
 'RN8': [('FOS / FOT', '0,40 / 0,8'), ('Altura', 'PB+1 (6 m)'), ('Frente / superficie mínima', '15 m / 375 m²'), ('Fondo libre', '40%'), ('Pendiente de retiros', '45° desde 3 m')],
 'RN9': [('FOS / FOT', '0,40 / 1,5 (máx. posible 1,2)'), ('Altura', 'PB+2 (9 m)'), ('Frente / superficie mínima', '20 m / 600 m²'), ('Retiro lateral', '20% del lado O'), ('Frente al norte', 'retiro de frente 30%, fondo 30%'), ('Frente al sur', 'fondo libre 50%')],
}
for z in READ:
    READ[z]['ficha'] = FICHA[z]; READ[z]['ftxt'] = FTXT[z]
