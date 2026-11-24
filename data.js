/* Recluta EN -> Guitarra Criolla: datos locales del curso y del afinador. */
(function () {
  'use strict';

  const STRINGS = [
    { num: 6, note: 'MI', freq: 82.4069, label: '6ª · MI grave' },
    { num: 5, note: 'LA', freq: 110.0000, label: '5ª · LA' },
    { num: 4, note: 'RE', freq: 146.8324, label: '4ª · RE' },
    { num: 3, note: 'SOL', freq: 195.9977, label: '3ª · SOL' },
    { num: 2, note: 'SI', freq: 246.9417, label: '2ª · SI' },
    { num: 1, note: 'MI', freq: 329.6276, label: '1ª · MI agudo' }
  ];

  // Forma de acorde: -1 = apagada, 0 = al aire, 1..4 = traste. Orden 6ª -> 1ª.
  const CHORDS = {
    Em:  { name: 'Em',  shape: [0, 2, 2, 0, 0, 0], label: 'Mi menor' },
    Am:  { name: 'Am',  shape: [-1, 0, 2, 2, 1, 0], label: 'La menor' },
    C:   { name: 'C',   shape: [-1, 3, 2, 0, 1, 0], label: 'Do mayor' },
    G:   { name: 'G',   shape: [3, 2, 0, 0, 0, 3], label: 'Sol mayor' },
    D:   { name: 'D',   shape: [-1, -1, 0, 2, 3, 2], label: 'Re mayor' },
    E:   { name: 'E',   shape: [0, 2, 2, 1, 0, 0], label: 'Mi mayor' },
    A:   { name: 'A',   shape: [-1, 0, 2, 2, 2, 0], label: 'La mayor' },
    Dm:  { name: 'Dm',  shape: [-1, -1, 0, 2, 3, 1], label: 'Re menor' },
    G7:  { name: 'G7',  shape: [3, 2, 0, 0, 0, 1], label: 'Sol séptima' },
    C7:  { name: 'C7',  shape: [-1, 3, 2, 3, 1, 0], label: 'Do séptima' }
  };

  const COLORS = ['#C4262E', '#8A4E12', '#2E6B5E', '#3B356B', '#A6561F'];

  const L = (id, title, type, objective, practice, extra) =>
    Object.assign({ id, title, type, objective, practice }, extra || {});

  const LEVELS = [
    {
      id: 1, title: 'La primera nota', subtitle: 'Postura y manos',
      goal: 'Sentarte con la guitarra y sacar sonido limpio en las cuerdas al aire.',
      lessons: [
        L('l1a', 'La postura', 'postura', 'Apoyar la guitarra sin lastimar la muñeca.', 'Siéntate derecho, caja sobre la pierna derecha, mástil hacia la izquierda y pulgar derecho relajado.'),
        L('l1b', 'Cuerda 1 al aire', 'cuerda', 'Pulsar la primera cuerda con el índice derecho.', 'Pulsa la 1ª diez veces, dejando sonar cada nota hasta que se apague.', { strings: [1] }),
        L('l1c', 'Cuerda 2 al aire', 'cuerda', 'Pulsar la segunda cuerda sin tocar vecinas.', 'Alterna 1ª y 2ª, ocho veces cada una, mirando la mano derecha.', { strings: [1, 2] })
      ]
    },
    {
      id: 2, title: 'Dos dedos', subtitle: 'Primer traste',
      goal: 'Usar dedos 1 y 2 de la mano izquierda con presión justa.',
      lessons: [
        L('l2a', 'Dedo 1 en la 1ª', 'cuerda', 'Presionar la 1ª en el traste 1.', 'Dedos 1 y 2 en trastes 1 y 2 de la 1ª cuerda. Pulsa y suelta sin ruido.', { strings: [1] }),
        L('l2b', 'Cuerda 3 al aire', 'cuerda', 'Encontrar el SOL al aire.', 'Pulsa la 3ª ocho veces y luego baja a la 2ª.', { strings: [2, 3] }),
        L('l2c', 'Escalera de tres', 'cuerda', 'Subir y bajar por tres notas.', '1ª al aire, 1ª traste 1, 1ª traste 2. Sube y baja cinco veces.', { strings: [1] })
      ]
    },
    {
      id: 3, title: 'Los primeros acordes', subtitle: 'Em y Am',
      goal: 'Cerrar dos acordes sin apagar cuerdas con los dedos.',
      lessons: [
        L('l3a', 'Acorde Em', 'acorde', 'Dos dedos, dos cuerdas, sonido abierto.', 'Coloca el dedo 2 en la 5ª traste 2 y el 3 en la 4ª traste 2. Rasga las seis cuerdas.', { chord: 'Em' }),
        L('l3b', 'Acorde Am', 'acorde', 'Tres dedos y la 6ª apagada.', 'Dedos 1, 2 y 3 en 2ª/4ª/3ª. No toques la 6ª.', { chord: 'Am' }),
        L('l3c', 'Cambio Em ↔ Am', 'acorde', 'Pasar de un acorde a otro sin mirar.', 'Cambia veinte veces seguidas, despacio y sin pausa.', { chord: 'Am' })
      ]
    },
    {
      id: 4, title: 'El compás', subtitle: 'Rasgueo y tiempo',
      goal: 'Mantener un pulso estable con la mano derecha.',
      lessons: [
        L('l4a', 'Rasgeo abajo', 'ritmo', 'Movimiento desde el antebrazo.', 'Rasga hacia abajo ocho veces contando 1-2-3-4. No golpees la caja.'),
        L('l4b', 'Rasgeo arriba', 'ritmo', 'Subida ligera con uña o yema.', 'Alterna abajo-arriba ocho veces, sin acelerar.'),
        L('l4c', 'Compás de 3/4', 'ritmo', 'Sentir el fuerte-débil-débil.', 'Cuenta «UN-dos-tres» y rasga sólo en el UN durante ocho compases.')
      ]
    },
    {
      id: 5, title: 'Los tres grandes', subtitle: 'C y G',
      goal: 'Dominar Do y Sol, base de buena parte del repertorio criollo.',
      lessons: [
        L('l5a', 'Acorde C', 'acorde', 'Tres dedos y la 6ª apagada.', 'Dedos 3, 2 y 1 en 5ª/4ª/2ª. Comprueba cada cuerda por separado.', { chord: 'C' }),
        L('l5b', 'Acorde G', 'acorde', 'Seis cuerdas, dedos 1 y 2 abajo.', 'Dedos 2 y 1 en 5ª/6ª; dedo 3 en la 1ª traste 3.', { chord: 'G' }),
        L('l5c', 'Cambio C ↔ G', 'acorde', 'Transición limpia.', 'Cambia quince veces a tempo lento, sin levantar los dedos de más.', { chord: 'G' })
      ]
    },
    {
      id: 6, title: 'El bajo', subtitle: 'Pulgar y arpegio',
      goal: 'Diferenciar la mano derecha: pulgar para graves, dedos para agudos.',
      lessons: [
        L('l6a', 'Pulgar en 6ª y 5ª', 'arpegio', 'El pulgar no se engancha en la cuerda.', 'Pulgar en 6ª y 5ª, cuatro veces cada una, con Em.', { chord: 'Em' }),
        L('l6b', 'Arpegio simple', 'arpegio', 'Pulgar + índice + medio + anular.', 'En Am: 5ª con pulgar, 4ª índice, 3ª medio, 2ª anular. Repite ocho veces.', { chord: 'Am' }),
        L('l6c', 'Canción con bajo', 'arpegio', 'Juntar bajo y acorde.', 'Dos compases de arpegio y un rasgeo final. Repite cuatro veces.', { chord: 'Am' })
      ]
    },
    {
      id: 7, title: 'Milonga', subtitle: 'Ritmo criollo',
      goal: 'Tocar el ritmo de milonga con acordes abiertos.',
      lessons: [
        L('l7a', 'Ritmo de milonga', 'ritmo', 'Tres tiempos con acento especial.', 'Cuenta «UN-dos-tres» y rasga abajo, abajo-arriba. Ocho compases.'),
        L('l7b', 'Acorde D', 'acorde', 'Tres cuerdas, dedos agrupados.', 'Dedos 1, 3 y 2 en 3ª/2ª/1ª. No toques 5ª ni 6ª.', { chord: 'D' }),
        L('l7c', 'Milonga Em-Am', 'ritmo', 'Milonga con dos acordes.', 'Un compás de Em y uno de Am, cuatro vueltas sin parar.', { chord: 'Em' })
      ]
    },
    {
      id: 8, title: 'Cielito', subtitle: 'Baile criollo',
      goal: 'Tocar un cielito sencillo en compás de 3/4.',
      lessons: [
        L('l8a', 'Ritmo de cielito', 'ritmo', 'Acento en el primer tiempo.', 'Rasga «UN-dos-tres» con el acento arriba. Diez compases.'),
        L('l8b', 'Acorde A', 'acorde', 'Cuatro dedos, sin tocar la 6ª.', 'Dedos 1, 2, 3 en 4ª/3ª/2ª. Comprueba cada cuerda.', { chord: 'A' }),
        L('l8c', 'Cielito en G-D', 'ritmo', 'Dos acordes y ritmo.', 'G un compás, D un compás. Ocho vueltas.', { chord: 'D' })
      ]
    },
    {
      id: 9, title: 'Gato y chacarera', subtitle: 'Folklore',
      goal: 'Entrar en los ritmos de gato y chacarera.',
      lessons: [
        L('l9a', 'Ritmo de gato', 'ritmo', 'Sincopa y acento fuerte.', 'Cuenta «UN-dos-TRES-cuatro» y rasga en UN y TRES. Ocho veces.'),
        L('l9b', 'Acorde E', 'acorde', 'Seis cuerdas, tres dedos.', 'Dedos 2 y 3 en 5ª/4ª traste 2, dedo 1 en 3ª traste 1.', { chord: 'E' }),
        L('l9c', 'Chacarera', 'ritmo', 'Golpe seco y parejo.', 'Rasga abajo en 1 y 3, arriba en 2 y 4. Doce compases.', { chord: 'A' })
      ]
    },
    {
      id: 10, title: 'Tu primera pieza', subtitle: 'Repertorio',
      goal: 'Unir acordes, ritmo y arpegio en una pieza completa.',
      lessons: [
        L('l10a', 'Ensamblar acordes', 'acorde', 'Elegir cuatro acordes y pasar sin error.', 'Em, Am, C y G. Cuatro vueltas sin mirar.', { chord: 'C' }),
        L('l10b', 'Ritmo final', 'ritmo', 'Mantener el pulso del principio al final.', 'Elige milonga o cielito y toca dieciséis compases.'),
        L('l10c', 'Pieza completa', 'pieza', 'Tocar de principio a fin.', 'Introducción con arpegio, dos vueltas de acordes y cierre con rasgeo.')
      ]
    }
  ];

  const LESSONS = LEVELS.flatMap((level) =>
    level.lessons.map((lesson) => Object.assign({ level: level.id }, lesson))
  );

  const RANKS = ['PRINCIPIANTE', 'APRENDIZ', 'INTERMEDIO', 'AVANZADO', 'MAESTRO'];

  window.APP_DATA = {
    STRINGS, CHORDS, LEVELS, LESSONS, COLORS, RANKS,
    STORE_KEY: 'guitarra-criolla-v1'
  };
})();
