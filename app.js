/* Guitarra Criolla — escuela local, sin dependencias ni red. */
(function () {
  'use strict';

  const D = window.APP_DATA;
  const $ = (id) => document.getElementById(id);
  const DAY_MS = 86400000;
  const HOUR_MS = 3600000;
  const TIPS = [
    'Afina antes de tocar: cinco minutos de afinación valen una hora de práctica.',
    'Si un acorde suena ruidoso, presiona más cerca del traste, no más fuerte.',
    'Repite despacio. La velocidad llega sola cuando el dedo ya sabe dónde ir.',
    'Grábate una vez por semana: oirás avances que no notas mientras tocas.',
    'Descansa si te duele la muñeca. La guitarra criolla no debe doler.'
  ];

  let state = loadState();
  let installPrompt = null;
  let currentReviewId = null;
  let audioCtx = null;
  let mic = { active: false, stream: null, ctx: null, analyser: null, raf: 0, target: 0, last: 0 };

  /* ---------- Estado ---------- */

  function todayKey(date) {
    const d = date || new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function defaultState() {
    return {
      version: 1,
      startDate: todayKey(),
      lessons: {},
      log: [],
      installDismissed: false
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(D.STORE_KEY);
      if (!raw) return defaultState();
      return Object.assign(defaultState(), JSON.parse(raw));
    } catch (err) {
      console.warn('No se pudo leer el progreso guardado.', err);
      return defaultState();
    }
  }

  function saveState() {
    try { localStorage.setItem(D.STORE_KEY, JSON.stringify(state)); }
    catch (err) { toast('No se pudo guardar: almacenamiento lleno o bloqueado.'); }
  }

  function lessonById(id) { return D.LESSONS.find((l) => l.id === id); }
  function learnedCount() { return D.LESSONS.filter((l) => state.lessons[l.id] && state.lessons[l.id].learned).length; }
  function levelLessons(n) { return D.LESSONS.filter((l) => l.level === n); }
  function levelComplete(n) { const ls = levelLessons(n); return ls.length > 0 && ls.every((l) => state.lessons[l.id] && state.lessons[l.id].learned); }
  function unlocked(n) { return n === 1 || levelComplete(n - 1); }

  function levelStatus(n) {
    if (levelComplete(n)) return 'COMPLETADO';
    if (!unlocked(n)) return 'BLOQUEADO';
    const ls = levelLessons(n);
    return ls.some((l) => state.lessons[l.id] && (state.lessons[l.id].learned || state.lessons[l.id].reps)) ? 'EN CURSO' : 'DISPONIBLE';
  }

  function currentLesson() {
    const next = D.LESSONS.find((l) => !(state.lessons[l.id] && state.lessons[l.id].learned) && unlocked(l.level));
    if (next) return next;
    return D.LESSONS[D.LESSONS.length - 1];
  }

  function dueLessons() {
    const now = Date.now();
    return D.LESSONS.filter((l) => {
      const s = state.lessons[l.id];
      return s && s.learned && s.due && s.due <= now;
    });
  }

  function streakDays() {
    const days = Array.from(new Set(state.log.map((e) => e.date))).sort().reverse();
    if (!days.length) return 0;
    let count = 0;
    const cursor = new Date(todayKey() + 'T00:00:00');
    if (days[0] !== todayKey()) cursor.setDate(cursor.getDate() - 1);
    for (let i = 0; i < 400; i++) {
      const key = todayKey(cursor);
      if (days.includes(key)) { count++; cursor.setDate(cursor.getDate() - 1); }
      else break;
    }
    return count;
  }

  function rank() {
    const done = D.LEVELS.filter((l) => levelComplete(l.id)).length;
    if (done >= 9) return D.RANKS[4];
    if (done >= 7) return D.RANKS[3];
    if (done >= 4) return D.RANKS[2];
    if (done >= 2) return D.RANKS[1];
    return D.RANKS[0];
  }

  function gradeLesson(id, easy) {
    const lesson = lessonById(id);
    if (!lesson) return;
    const now = Date.now();
    const s = state.lessons[id] || { learned: false, reps: 0, interval: 0, ease: 2.5, due: now };
    if (easy) {
      s.reps += 1;
      s.learned = true;
      s.interval = s.reps === 1 ? 1 : Math.max(1, Math.round(s.interval * s.ease));
      s.ease = Math.min(2.8, s.ease + 0.1);
      s.due = now + s.interval * DAY_MS;
    } else {
      s.reps = 0;
      s.learned = true;
      s.interval = 0;
      s.ease = Math.max(1.3, s.ease - 0.2);
      s.due = now + HOUR_MS;
    }
    s.last = todayKey();
    state.lessons[id] = s;
    state.log.push({ date: todayKey(), id, title: lesson.title, result: easy ? 'BIEN' : 'REPETIR' });
    saveState();
    renderAll();
    toast(easy ? 'Lección marcada. Volverá cuando toque repasarla.' : 'La ponemos en repaso para mañana.');
  }

  /* ---------- Interfaz ---------- */

  let toastTimer = null;
  function toast(message) {
    const el = $('toast');
    el.textContent = message;
    el.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('is-visible'), 3800);
  }

  function showView(name) {
    document.querySelectorAll('.view').forEach((v) => { v.hidden = true; });
    const target = $('view-' + name);
    if (target) { target.hidden = false; target.focus({ preventScroll: true }); }
    document.querySelectorAll('.tabbar__tab').forEach((t) => t.classList.toggle('is-active', t.dataset.view === name));
    window.scrollTo({ top: 0, behavior: 'auto' });
    if (name !== 'afinador') stopMic();
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }

  function renderHoy() {
    const lesson = currentLesson();
    const level = D.LEVELS[lesson.level - 1];
    const done = learnedCount();
    const pct = Math.round((done / D.LESSONS.length) * 100);
    const due = dueLessons().length;

    $('rank-label').textContent = rank();
    $('level-label').textContent = 'NIVEL ' + String(level.id).padStart(2, '0');
    $('hero-stripe').style.background = D.COLORS[(level.id - 1) % D.COLORS.length];
    $('hero-code').textContent = 'NIVEL ' + String(level.id).padStart(2, '0');
    $('hero-seq').textContent = 'LECCIÓN ' + String(done + 1).padStart(2, '0') + ' / ' + D.LESSONS.length;
    $('hero-title').textContent = level.title;
    $('hero-goal').textContent = level.goal;
    $('course-fill').style.transform = 'scaleX(' + (pct / 100).toFixed(4) + ')';
    $('course-progress').setAttribute('aria-valuenow', String(pct));
    $('progress-text').textContent = done + ' de ' + D.LESSONS.length + ' lecciones · ' + lesson.title;
    $('due-badge').textContent = due;
    $('stat-lessons').textContent = done;
    $('stat-streak').textContent = streakDays();
    $('stat-due').textContent = due;
    $('daily-tip').textContent = TIPS[new Date().getDate() % TIPS.length];
  }

  function renderRuta() {
    $('level-list').innerHTML = D.LEVELS.map((lv) => {
      const status = levelStatus(lv.id);
      const cls = status === 'COMPLETADO' ? 'is-done' : status === 'BLOQUEADO' ? 'is-locked' : 'is-active';
      const total = levelLessons(lv.id).length;
      const done = levelLessons(lv.id).filter((l) => state.lessons[l.id] && state.lessons[l.id].learned).length;
      const color = D.COLORS[(lv.id - 1) % D.COLORS.length];
      return '<article class="level-card"><div class="level-card__head">' +
        '<span class="level-card__num">' + String(lv.id).padStart(2, '0') + '</span>' +
        '<span class="level-card__name"><b>' + escapeHtml(lv.title) + '</b><span>' + escapeHtml(lv.subtitle) + '</span></span>' +
        '<span class="level-card__status ' + cls + '">' + status + '</span></div>' +
        '<div class="level-card__lessons">' + done + ' / ' + total + ' lecciones</div>' +
        '<div class="level-card__bar" style="background:' + color + '"></div></article>';
    }).join('');
  }

  function chordSvg(name) {
    const chord = D.CHORDS[name];
    if (!chord) return '';
    const xs = [20, 36, 52, 68, 84, 100];
    const ys = [24, 46, 68, 90, 112];
    let svg = '';
    ys.forEach((y) => { svg += '<line x1="20" y1="' + y + '" x2="100" y2="' + y + '" stroke="#16263F" stroke-width="' + (y === 24 ? 3 : 1) + '"/>'; });
    xs.forEach((x) => { svg += '<line x1="' + x + '" y1="24" x2="' + x + '" y2="112" stroke="#16263F" stroke-width="1"/>'; });
    chord.shape.forEach((fret, i) => {
      const x = xs[i];
      if (fret === -1) {
        svg += '<text x="' + x + '" y="17" text-anchor="middle" font-family="Arial" font-size="11" fill="#C4262E">×</text>';
      } else if (fret === 0) {
        svg += '<circle cx="' + x + '" cy="15" r="4" fill="none" stroke="#16263F" stroke-width="2"/>';
      } else {
        svg += '<circle cx="' + x + '" cy="' + (24 + (fret - 0.5) * 22) + '" r="6" fill="#C4262E"/>';
      }
    });
    svg += '<text x="60" y="132" text-anchor="middle" font-family="Arial" font-size="9" fill="#4C5566">6 5 4 3 2 1</text>';
    return svg;
  }

  function hintFor(type) {
    const hints = {
      postura: 'Si te duele la muñeca, para y corrige la postura antes de seguir.',
      cuerda: 'Repite hasta que la nota suene limpia, sin ruidos de otras cuerdas.',
      acorde: 'Comprueba una cuerda por una antes de rasgar todo el acorde.',
      ritmo: 'Cuenta en voz alta. El pulso va antes que la velocidad.',
      arpegio: 'La mano derecha no debe detenerse entre cuerda y cuerda.',
      pieza: 'Toca despacio de principio a fin antes de intentar hacerla rápido.'
    };
    return hints[type] || hints.cuerda;
  }

  function renderLeccion() {
    const lesson = currentLesson();
    const level = D.LEVELS[lesson.level - 1];
    $('lesson-level').textContent = 'NIVEL ' + String(level.id).padStart(2, '0') + ' · ' + level.subtitle.toUpperCase();
    $('lesson-title').textContent = lesson.title;
    $('lesson-objective').textContent = lesson.objective;
    $('lesson-practice').textContent = lesson.practice;
    $('lesson-hint').textContent = hintFor(lesson.type);
    $('lesson-feedback').textContent = '';
    const hasChord = !!(lesson.chord && D.CHORDS[lesson.chord]);
    $('diagram-wrap').hidden = !hasChord;
    $('btn-play-chord').hidden = !hasChord;
    if (hasChord) {
      $('chord-svg').innerHTML = chordSvg(lesson.chord);
      $('chord-svg').setAttribute('aria-label', 'Diagrama del acorde ' + lesson.chord + ', ' + D.CHORDS[lesson.chord].label);
      $('chord-name').textContent = lesson.chord + ' · ' + D.CHORDS[lesson.chord].label;
    }
  }

  function renderRepaso() {
    const due = dueLessons();
    $('due-list').innerHTML = due.map((l) =>
      '<div class="due-card"><div class="due-card__info"><b>' + escapeHtml(l.title) + '</b>' +
      '<span>Nivel ' + l.level + ' · ' + escapeHtml(l.objective) + '</span></div>' +
      '<button class="btn" data-review="' + l.id + '" type="button">REPASAR</button></div>'
    ).join('');
    $('review-empty').hidden = due.length > 0;
    if (!due.length) { currentReviewId = null; $('review-card').hidden = true; return; }
    if (!currentReviewId || !due.some((l) => l.id === currentReviewId)) currentReviewId = due[0].id;
    const l = lessonById(currentReviewId);
    $('review-level').textContent = 'NIVEL ' + String(l.level).padStart(2, '0') + ' · ' + l.title.toUpperCase();
    $('review-title').textContent = l.objective;
    $('review-practice').textContent = l.practice;
    $('review-card').hidden = false;
  }

  function renderAfinador() {
    $('tuner-strings').innerHTML = D.STRINGS.map((s, i) =>
      '<button class="string-btn' + (i === mic.target ? ' is-active' : '') + '" data-string="' + i + '" type="button" aria-pressed="' + (i === mic.target) + '">' +
      '<b>' + s.num + 'ª · ' + s.note + '</b><span>' + s.freq.toFixed(1) + ' Hz</span></button>'
    ).join('');
    updateTunerTarget();
  }

  function updateTunerTarget() {
    const s = D.STRINGS[mic.target];
    $('tuner-target').textContent = s.label + ' · ' + s.freq.toFixed(1) + ' Hz';
    $('tuner-note').textContent = s.note;
  }

  function renderRegistro() {
    const done = learnedCount();
    const stats = [
      [done, 'LECCIONES APRENDIDAS'],
      [D.LEVELS.filter((l) => levelComplete(l.id)).length, 'NIVELES COMPLETOS'],
      [streakDays(), 'RACHA DE DÍAS'],
      [dueLessons().length, 'PARA REPASAR'],
      [rank(), 'GRADO'],
      [state.log.length, 'REGISTROS']
    ];
    $('stats-grid').innerHTML = stats.map((s) => '<div class="stat"><div class="stat__value">' + escapeHtml(String(s[0])) + '</div><div class="stat__label">' + s[1] + '</div></div>').join('');
    const entries = state.log.slice().reverse().slice(0, 14);
    $('log-table').innerHTML = '<div class="log__row log__row--head"><span>FECHA</span><span>LECCIÓN</span><span>RESULTADO</span></div>' +
      (entries.length ? entries.map((e) => '<div class="log__row"><span>' + e.date + '</span><span>' + escapeHtml(e.title) + '</span><span>' + e.result + '</span></div>').join('') :
        '<p class="empty">Todavía no hay lecciones registradas.</p>');
  }

  function renderAll() {
    renderHoy();
    renderRuta();
    renderLeccion();
    renderRepaso();
    renderRegistro();
  }

  /* ---------- Audio: tonos de referencia y acordes ---------- */

  function getAudio() {
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      audioCtx = new Ctx();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  function pluck(freq, when, dur) {
    const ctx = getAudio();
    if (!ctx) { toast('Este navegador no puede generar sonido.'); return; }
    const t = when || ctx.currentTime;
    const length = dur || 1.4;
    const osc = ctx.createOscillator();
    const harm = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    harm.type = 'sine';
    osc.frequency.value = freq;
    harm.frequency.value = freq * 2;
    const hGain = ctx.createGain();
    hGain.gain.value = 0.16;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.22, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.07, t + 0.22);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
    osc.connect(gain);
    harm.connect(hGain).connect(gain);
    gain.connect(ctx.destination);
    osc.start(t); harm.start(t);
    osc.stop(t + length + 0.05); harm.stop(t + length + 0.05);
  }

  function playString(index) {
    const ctx = getAudio();
    if (!ctx) return;
    pluck(D.STRINGS[index].freq, ctx.currentTime + 0.01, 1.6);
  }

  function playChord(name) {
    const ctx = getAudio();
    if (!ctx) return;
    const chord = D.CHORDS[name];
    if (!chord) return;
    const t = ctx.currentTime + 0.02;
    chord.shape.forEach((fret, i) => {
      if (fret < 0) return;
      const freq = D.STRINGS[i].freq * Math.pow(2, fret / 12);
      pluck(freq, t + i * 0.075, 1.5);
    });
  }

  function playAllStrings() {
    const ctx = getAudio();
    if (!ctx) return;
    const t = ctx.currentTime + 0.02;
    D.STRINGS.forEach((s, i) => pluck(s.freq, t + i * 0.45, 1.2));
  }

  /* ---------- Afinador con micrófono ---------- */

  function autoCorrelate(buffer, sampleRate) {
    const SIZE = buffer.length;
    let rms = 0;
    for (let i = 0; i < SIZE; i++) rms += buffer[i] * buffer[i];
    rms = Math.sqrt(rms / SIZE);
    if (rms < 0.012) return -1;
    let r1 = 0, r2 = SIZE - 1;
    const thres = 0.18;
    for (let i = 0; i < SIZE / 2; i++) { if (Math.abs(buffer[i]) < thres) { r1 = i; break; } }
    for (let i = 1; i < SIZE / 2; i++) { if (Math.abs(buffer[SIZE - i]) < thres) { r2 = SIZE - i; break; } }
    const b = buffer.subarray(r1, r2);
    const N = b.length;
    if (N < 64) return -1;
    const c = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      let sum = 0;
      for (let j = 0; j < N - i; j++) sum += b[j] * b[j + i];
      c[i] = sum;
    }
    let d = 0;
    while (d < N - 1 && c[d] > c[d + 1]) d++;
    let maxpos = -1, maxval = -1;
    for (let i = d; i < N; i++) { if (c[i] > maxval) { maxval = c[i]; maxpos = i; } }
    if (maxpos <= 0) return -1;
    if (maxpos + 1 < N) {
      const a = c[maxpos - 1], bb = c[maxpos], cc = c[maxpos + 1];
      const denom = a - 2 * bb + cc;
      if (denom !== 0) maxpos += 0.5 * (a - cc) / denom;
    }
    return sampleRate / maxpos;
  }

  function updateTunerUI(freq) {
    const target = D.STRINGS[mic.target].freq;
    const cents = Math.max(-50, Math.min(50, Math.round(1200 * Math.log2(freq / target))));
    const advice = $('tuner-advice');
    $('tuner-hz').textContent = freq.toFixed(1) + ' Hz';
    $('tuner-cents').textContent = (cents > 0 ? '+' : '') + cents + ' cents';
    $('tuner-needle').style.left = (50 + cents) + '%';
    advice.classList.toggle('is-ok', Math.abs(cents) <= 4);
    if (Math.abs(cents) <= 4) advice.textContent = '¡AFINADA! Deja de tocar y comprueba otra cuerda.';
    else if (cents < 0) advice.textContent = 'TENSA LA CUERDA · el tono está bajo (' + cents + ').';
    else advice.textContent = 'AFLOJA LA CUERDA · el tono está alto (+' + cents + ').';
  }

  function tunerLoop() {
    if (!mic.active) return;
    const now = performance.now();
    if (now - mic.last > 80) {
      mic.last = now;
      const buf = new Float32Array(mic.analyser.fftSize);
      mic.analyser.getFloatTimeDomainData(buf);
      const freq = autoCorrelate(buf, mic.ctx.sampleRate);
      if (freq > 65 && freq < 520) updateTunerUI(freq);
      else {
        $('tuner-advice').classList.remove('is-ok');
        $('tuner-advice').textContent = 'No escucho la cuerda. Acércate al micrófono y pulsa con firmeza.';
      }
    }
    mic.raf = requestAnimationFrame(tunerLoop);
  }

  async function startMic() {
    if (mic.active) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast('Este navegador no permite usar el micrófono.'); return;
    }
    try {
      mic.stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
      });
      const Ctx = window.AudioContext || window.webkitAudioContext;
      mic.ctx = new Ctx();
      if (mic.ctx.state === 'suspended') await mic.ctx.resume();
      const source = mic.ctx.createMediaStreamSource(mic.stream);
      mic.analyser = mic.ctx.createAnalyser();
      mic.analyser.fftSize = 2048;
      mic.analyser.smoothingTimeConstant = 0.1;
      source.connect(mic.analyser);
      mic.active = true;
      $('btn-mic').hidden = true;
      $('btn-mic-stop').hidden = false;
      $('tuner-advice').textContent = 'Pulsa la cuerda seleccionada y sigue la aguja.';
      mic.last = 0;
      mic.raf = requestAnimationFrame(tunerLoop);
    } catch (err) {
      toast('No se pudo activar el micrófono. Revisa los permisos del sitio.');
    }
  }

  function stopMic() {
    if (!mic.active) return;
    mic.active = false;
    cancelAnimationFrame(mic.raf);
    if (mic.stream) mic.stream.getTracks().forEach((t) => t.stop());
    if (mic.ctx) mic.ctx.close().catch(() => {});
    mic.stream = null; mic.ctx = null; mic.analyser = null;
    $('btn-mic').hidden = false;
    $('btn-mic-stop').hidden = true;
    $('tuner-note').textContent = D.STRINGS[mic.target].note;
    $('tuner-hz').textContent = '0 Hz';
    $('tuner-cents').textContent = '—';
    $('tuner-needle').style.left = '50%';
    $('tuner-advice').classList.remove('is-ok');
    $('tuner-advice').textContent = 'Micrófono detenido. Pulsa «ESCUCHAR» para oír la nota correcta.';
  }

  /* ---------- Eventos ---------- */

  function exportData() {
    const payload = JSON.stringify({ state, exportedAt: new Date().toISOString() }, null, 2);
    const url = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'guitarra-criolla-' + todayKey() + '.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('Copia exportada.');
  }

  function importData(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed.state || typeof parsed.state !== 'object') throw new Error('formato');
        state = Object.assign(defaultState(), parsed.state);
        saveState();
        renderAll();
        toast('Progreso importado correctamente.');
      } catch (err) { toast('El archivo no es una copia válida.'); }
    };
    reader.readAsText(file);
  }

  function bindEvents() {
    document.querySelectorAll('.tabbar__tab').forEach((btn) => btn.addEventListener('click', () => showView(btn.dataset.view)));
    $('btn-continue').addEventListener('click', () => { renderLeccion(); showView('leccion'); });
    $('btn-review').addEventListener('click', () => { renderRepaso(); showView('repaso'); });
    $('btn-tune').addEventListener('click', () => showView('afinador'));
    $('lesson-back').addEventListener('click', () => showView('hoy'));

    $('lesson-easy').addEventListener('click', () => { gradeLesson(currentLesson().id, true); renderLeccion(); });
    $('lesson-hard').addEventListener('click', () => { gradeLesson(currentLesson().id, false); renderLeccion(); });
    $('btn-play-chord').addEventListener('click', () => {
      const l = currentLesson();
      if (l.chord) playChord(l.chord);
    });

    $('due-list').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-review]');
      if (!btn) return;
      currentReviewId = btn.dataset.review;
      renderRepaso();
    });
    $('review-easy').addEventListener('click', () => { if (currentReviewId) { gradeLesson(currentReviewId, true); currentReviewId = null; renderRepaso(); } });
    $('review-hard').addEventListener('click', () => { if (currentReviewId) { gradeLesson(currentReviewId, false); currentReviewId = null; renderRepaso(); } });

    $('tuner-strings').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-string]');
      if (!btn) return;
      mic.target = Number(btn.dataset.string);
      renderAfinador();
      playString(mic.target);
      if (mic.active) $('tuner-advice').textContent = 'Pulsa la cuerda ' + D.STRINGS[mic.target].num + 'ª y sigue la aguja.';
    });
    $('btn-tune-all').addEventListener('click', playAllStrings);
    $('btn-mic').addEventListener('click', startMic);
    $('btn-mic-stop').addEventListener('click', stopMic);

    $('export-data').addEventListener('click', exportData);
    $('import-button').addEventListener('click', () => $('import-file').click());
    $('import-file').addEventListener('change', (e) => { if (e.target.files[0]) importData(e.target.files[0]); });
    $('reset-progress').addEventListener('click', () => {
      if (!window.confirm('¿Borrar todo el progreso guardado en este celular?')) return;
      state = defaultState();
      saveState();
      renderAll();
      toast('Progreso borrado. Vuelves al nivel 1.');
    });

    const installHelp = () => {
      const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      toast(ios ? 'iPhone/iPad: Compartir → «Añadir a pantalla de inicio».'
        : 'Android/Chrome: menú ⋮ → «Instalar aplicación» o «Añadir a pantalla de inicio».');
    };
    const promptInstall = async () => {
      if (!installPrompt) { installHelp(); return; }
      try { await installPrompt.prompt(); await installPrompt.userChoice; }
      catch (err) { installHelp(); }
      installPrompt = null;
      $('install-banner').hidden = true;
    };
    $('install-button').addEventListener('click', promptInstall);
    $('install-always').addEventListener('click', promptInstall);
    $('install-close').addEventListener('click', () => { $('install-banner').hidden = true; });
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      installPrompt = e;
      $('install-banner').hidden = false;
    });
    window.addEventListener('appinstalled', () => {
      installPrompt = null;
      $('install-banner').hidden = true;
      toast('Escuela instalada. Ábrela desde tu pantalla de inicio.');
    });
  }

  function init() {
    bindEvents();
    renderAll();
    $('tuner-note').textContent = D.STRINGS[mic.target].note;
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch((err) => console.warn('Service worker no disponible:', err));
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
