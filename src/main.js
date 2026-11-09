import { EXERCISES, CATEGORIES, EQUIPMENT, WORKOUT_PRESETS, defaultState } from './data.js';
import { LocalStore, validateImport } from './storage.js';
import { makeId, startSession, pauseSession, resumeSession, moveExercise, completeSet, undoLastAction, finishSession, elapsedMilliseconds, formatDuration, formatDate } from './engine.js';
import { GestureController } from './gestures.js';
import { getDueReminders, getExpiredReminders, getUpcomingReminders, REMINDER_RECHECK_MS } from './reminders.js';
import { migrateLegacyFluffoNames } from './migrations.js';

const store = new LocalStore();
const root = document.querySelector('#app');
const toastRoot = document.querySelector('#toast-root');
const navItems = [
  ['home','Inicio','home'], ['workouts','Entrenamientos','dumbbell'], ['exercises','Ejercicios','activity'], ['progress','Progreso','chart'], ['settings','Ajustes','settings']
];
const I18N = {
  es: {
    home:'Inicio', workouts:'Entrenamientos', exercises:'Ejercicios', progress:'Progreso', settings:'Ajustes',
    today:'HOY', welcome:'Tu espacio para moverte mejor.', welcomeName:'Hola, {name}.',
    heroTitle:'Entrena a tu ritmo. Avanza a tu manera.', heroText:'Crea sesiones, aprende movimientos y registra lo que haces. Tus datos se quedan en este dispositivo.',
    newWorkout:'Crear entrenamiento', explore:'Explorar ejercicios', thisWeek:'Esta semana', sessions:'Sesiones', minutes:'Minutos', streak:'Días activos',
    recent:'Actividad reciente', favorites:'Tus favoritos', planned:'Próximo entrenamiento', noPlans:'Todavía no hay nada programado.',
    noSessions:'Tu historial empieza con tu primera sesión.', createFirst:'Crea tu primer entrenamiento',
    library:'Biblioteca de movimientos', search:'Buscar ejercicio…', all:'Todos', favoriteOnly:'Favoritos', custom:'Personalizados',
    noExercises:'No encontramos ejercicios con esos filtros.', builder:'Editor de entrenamiento', save:'Guardar', cancel:'Cancelar',
    duration:'Duración preferida', level:'Experiencia', equipment:'Material disponible', language:'Idioma', theme:'Tema',
    dark:'Oscuro', light:'Claro', system:'Sistema', beginner:'Principiante', intermediate:'Intermedio', advanced:'Avanzado',
    start:'Empezar', pause:'Pausar', resume:'Continuar', next:'Siguiente', previous:'Anterior', completeSet:'Completar serie',
    finish:'Terminar sesión', undo:'Deshacer', rest:'Descanso', noGoal:'Sin objetivo fijado',
    calendar:'Calendario', thisMonth:'Este mes', schedule:'Programar', restDay:'Marcar descanso',
    data:'Tus datos', export:'Exportar copia', import:'Importar copia', clear:'Borrar datos locales',
    local:'Privado por diseño', localText:'Tus entrenamientos y preferencias se guardan en este dispositivo.',
    camera:'Asistencia con cámara', cameraPreview:'Vista previa local', cameraDisclaimer:'La cámara solo muestra una vista previa local. El análisis de postura y el recuento automático todavía no están integrados.',
    close:'Cerrar', add:'Añadir', edit:'Editar', delete:'Eliminar', todayDate:'Hoy',
    noWorkout:'Sin entrenamientos todavía', noWorkoutText:'Crea una plantilla y añade los movimientos que quieras practicar.',
    week:'Semana', month:'Mes', history:'Historial', allTime:'Total',
    units:'Unidades', metric:'Métricas', imperial:'Imperiales', gestures:'Navegación por gestos', workoutGestures:'Gestos durante el entrenamiento',
    sound:'Sonido del temporizador', vibration:'Vibración', notifications:'Notificaciones', sensitivity:'Sensibilidad de gestos',
    privacy:'Privacidad', accessibility:'Accesibilidad', appearance:'Apariencia', preferences:'Preferencias',
    noProgress:'Aún no hay progreso que mostrar', noProgressText:'Completa una sesión y aquí aparecerá tu actividad real.',
    customExercise:'Nuevo ejercicio', addExercise:'Añadir ejercicio', workoutName:'Nombre del entrenamiento', structure:'Estructura',
    repetitions:'Repeticiones', sets:'Series', seconds:'Duración (segundos)', restSeconds:'Descanso (segundos)', notes:'Notas',
    noExercisesAdded:'Añade ejercicios para preparar la sesión.', emptyToday:'Sin actividad registrada hoy.',
    openCalendar:'Abrir calendario', timer:'Temporizador', min:'min', sec:'s',
    saveStart:'Guardar e iniciar', resumeSession:'Volver a la sesión', cameraStart:'Activar cámara', cameraStop:'Detener cámara',
    dataStorage:'Almacenamiento', storageInfo:'El navegador puede eliminar datos locales al borrar sus datos de sitio. Exporta una copia para conservarlos.',
    explainGestures:'Desliza horizontalmente entre secciones. En una sesión, desliza a izquierda o derecha para cambiar de ejercicio. Siempre tienes botones equivalentes.',
    emptyFavorites:'Guarda ejercicios con el marcador para tenerlos aquí.',
    noCalendar:'No hay actividades para esta fecha.',
  },
  en: {
    home:'Home', workouts:'Workouts', exercises:'Exercises', progress:'Progress', settings:'Settings',
    today:'TODAY', welcome:'Your space to move better.', welcomeName:'Hello, {name}.',
    heroTitle:'Train at your pace. Move your way.', heroText:'Build sessions, learn movements and track what you do. Your data stays on this device.',
    newWorkout:'Create workout', explore:'Explore exercises', thisWeek:'This week', sessions:'Sessions', minutes:'Minutes', streak:'Active days',
    recent:'Recent activity', favorites:'Your favorites', planned:'Next workout', noPlans:'Nothing scheduled yet.',
    noSessions:'Your history starts with your first session.', createFirst:'Create your first workout',
    library:'Movement library', search:'Search exercises…', all:'All', favoriteOnly:'Favorites', custom:'Custom',
    noExercises:'No exercises match these filters.', builder:'Workout builder', save:'Save', cancel:'Cancel',
    duration:'Preferred duration', level:'Experience', equipment:'Available equipment', language:'Language', theme:'Theme',
    dark:'Dark', light:'Light', system:'System', beginner:'Beginner', intermediate:'Intermediate', advanced:'Advanced',
    start:'Start', pause:'Pause', resume:'Resume', next:'Next', previous:'Previous', completeSet:'Complete set',
    finish:'Finish session', undo:'Undo', rest:'Rest', noGoal:'No target set',
    calendar:'Calendar', thisMonth:'This month', schedule:'Schedule', restDay:'Mark rest day',
    data:'Your data', export:'Export a copy', import:'Import a copy', clear:'Clear local data',
    local:'Private by design', localText:'Your workouts and preferences are saved on this device.',
    camera:'Camera assistance', cameraPreview:'Local preview', cameraDisclaimer:'The camera only displays a local preview. Posture analysis and automatic rep counting are not integrated yet.',
    close:'Close', add:'Add', edit:'Edit', delete:'Delete', todayDate:'Today',
    noWorkout:'No workouts yet', noWorkoutText:'Create a template and add the movements you want to practise.',
    week:'Week', month:'Month', history:'History', allTime:'All time',
    units:'Units', metric:'Metric', imperial:'Imperial', gestures:'Swipe navigation', workoutGestures:'Workout gestures',
    sound:'Timer sound', vibration:'Vibration', notifications:'Notifications', sensitivity:'Gesture sensitivity',
    privacy:'Privacy', accessibility:'Accessibility', appearance:'Appearance', preferences:'Preferences',
    noProgress:'Nothing to show yet', noProgressText:'Complete a session and your real activity will appear here.',
    customExercise:'New exercise', addExercise:'Add exercise', workoutName:'Workout name', structure:'Structure',
    repetitions:'Repetitions', sets:'Sets', seconds:'Duration (seconds)', restSeconds:'Rest (seconds)', notes:'Notes',
    noExercisesAdded:'Add exercises to prepare the session.', emptyToday:'No activity recorded today.',
    openCalendar:'Open calendar', timer:'Timer', min:'min', sec:'s',
    saveStart:'Save & start', resumeSession:'Return to session', cameraStart:'Enable camera', cameraStop:'Stop camera',
    dataStorage:'Storage', storageInfo:'The browser may remove local data when site data is cleared. Export a copy to keep it.',
    explainGestures:'Swipe horizontally between sections. During a session, swipe left or right to change exercise. Equivalent buttons are always available.',
    emptyFavorites:'Save exercises with the bookmark icon to see them here.', noCalendar:'No activity on this date.'
  }
};
let state = defaultState();
let view = 'home';
let modal = null;
let builderDraft = null;
let selectedDate = dateKey(new Date());
let calendarMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let exerciseFilters = { query:'', category:'all', equipment:'all', difficulty:'all', favorites:false };
let progressTab = 'overview';
let timerInterval = null;
let cameraStream = null;
let onboardingStep = 0;
let onboardingNotificationsRequested = false;
let cameraVideo = null;
let gestureController;
let saving = Promise.resolve();
let installPrompt = null;
let sheetPointer = null;
let pendingPageAnimation = '';
const reminderTimers = new Map();
let reminderCheckInProgress = false;
let reminderRefreshQueued = false;

function t(key, vars = {}) {
  const lang = state.preferences?.language === 'en' ? 'en' : 'es';
  let value = I18N[lang]?.[key] ?? I18N.es[key] ?? key;
  for (const [name, replacement] of Object.entries(vars)) value = value.replaceAll(`{${name}}`, String(replacement));
  return value;
}
function esc(value = '') { return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function dateKey(date) { const y = date.getFullYear(), m = String(date.getMonth()+1).padStart(2,'0'), d = String(date.getDate()).padStart(2,'0'); return `${y}-${m}-${d}`; }
function parseDate(key) { const [y,m,d] = key.split('-').map(Number); return new Date(y,m-1,d,12); }
function todayLocale() { return new Intl.DateTimeFormat(state.preferences.language === 'en' ? 'en-GB' : 'es-ES',{weekday:'long',day:'numeric',month:'long'}).format(new Date()); }
function getExercises() { return [...EXERCISES, ...(state.customExercises || [])].filter(x => !state.hiddenExercises.includes(x.id)); }
function getExercise(id) { return getExercises().find(x => x.id === id) || EXERCISES.find(x => x.id === id) || state.customExercises.find(x => x.id === id); }
function persist() {
  saving = saving.then(() => store.save(state)).catch(error => { console.error(error); toast(error.message, 'error'); });
  return saving;
}
function toast(message, type = '') {
  const el = document.createElement('div'); el.className = `toast ${type}`; el.textContent = message; toastRoot.append(el);
  setTimeout(() => el.remove(), 3200);
}
function icon(name) {
  const paths = {
    home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    dumbbell:'<path d="m6.5 6.5 11 11M4 9l5-5m-5 0 5 5m10 10 5-5m-5 0 5 5M3 12l9 9m0-18 9 9"/>',
    sliders:'<path d="M4 6h16M4 18h16M8 6v4m0 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm8 4v4m0 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z"/>',
    activity:'<path d="M3 12h4l3-8 4 16 3-8h4"/>',
    chart:'<path d="M4 19V5m0 14h17M8 15l3-4 3 2 5-7"/>',
    settings:'<circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 1.1-1.5 2.6-1.7-.6a8 8 0 0 1-1.7 1l-.3 1.8h-3l-.3-1.8a8 8 0 0 1-1.7-1l-1.7.6-1.5-2.6 1.4-1.1a7 7 0 0 1 0-2L5.5 12l1.5-2.6 1.7.6a8 8 0 0 1 1.7-1l.3-1.8h3l.3 1.8a8 8 0 0 1 1.7 1l1.7-.6 1.5 2.6-1.4 1.1a7 7 0 0 1-.1 2Z"/>',
    search:'<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/>',
    timer:'<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 1.5M9 2h6M12 2v3"/>',
    heart:'<path d="M20.8 8.8c0 5.5-8.8 11-8.8 11S3.2 14.3 3.2 8.8A4.8 4.8 0 0 1 12 6a4.8 4.8 0 0 1 8.8 2.8Z"/>',
    bookmark:'<path d="M6 4.75A1.75 1.75 0 0 1 7.75 3h8.5A1.75 1.75 0 0 1 18 4.75V21l-6-3.5L6 21V4.75Z"/>',
    calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    close:'<path d="m18 6-12 12M6 6l12 12"/>',
    arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
    play:'<path d="m8 5 11 7-11 7z"/>',
    pause:'<path d="M8 5h3v14H8zM15 5h3v14h-3z"/>',
    back:'<path d="m15 18-6-6 6-6"/>',
    more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
    shield:'<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    star:'<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z"/>',
    edit:'<path d="m4 16.5-.8 4.3 4.3-.8L20 7.5 16.5 4zM14.5 6l3.5 3.5"/>',
    trash:'<path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6"/>',
    download:'<path d="M12 3v12m-5-5 5 5 5-5M4 20h16"/>',
    camera:'<path d="M4 7h3l2-3h6l2 3h3a2 2 0 0 1 2 2v10H2V9a2 2 0 0 1 2-2Z"/><circle cx="12" cy="13" r="3.5"/>',
    bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
    check:'<path d="m5 12 4 4L19 6"/>',
    undo:'<path d="M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-2"/>',
    info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/>',
    chevron:'<path d="m9 18 6-6-6-6"/>',
    sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/>',
    moon:'<path d="M20.5 14A8.5 8.5 0 0 1 10 3.5 8.5 8.5 0 1 0 20.5 14Z"/>',
    menu:'<path d="M4 7h16M4 12h16M4 17h16"/>'
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.activity}</svg>`;
}
function navButton(item, mobile = false) {
  const [id, label, iconName] = item;
  return `<button class="nav-button ${view === id ? 'active' : ''}" data-nav="${id}" aria-current="${view === id ? 'page':'false'}"><span class="nav-icon">${icon(iconName)}</span><span>${esc(t(id))}</span></button>`;
}
function layout(content, title) {
  const current = navItems.find(x => x[0] === view)?.[1] || title;
  const profileName = state.profile.name?.trim();
  const pageAnimation = pendingPageAnimation;
  pendingPageAnimation = '';
  root.innerHTML = `
    <div class="app-layout">
      <aside class="sidebar" aria-label="Navegación principal">
        <div class="brand"><div class="brand-mark"><img src="./public/icons/dumbbell-mark.svg" alt="" /></div><div><div class="brand-name">FORMA</div><div class="brand-caption">Move with intent</div></div></div>
        <div class="nav-label">Workspace</div><nav class="nav-list">${navItems.map(x => navButton(x)).join('')}</nav>
        <div class="sidebar-bottom"><div class="privacy-chip"><span class="privacy-dot"></span><div><strong>${esc(t('local'))}</strong>${esc(t('localText'))}</div></div><div class="small-text" style="padding:0 10px">FORMA · v1.3.0</div></div>
      </aside>
      <main class="main-area">
        <header class="topbar"><div class="topbar-left"><div><div class="eyebrow">${esc(todayLocale())}</div><h1 class="page-title">${esc(title || t(view))}</h1></div></div><div class="top-actions">${installPrompt?`<button class="button secondary small" data-action="install-app">Instalar</button>`:''}<button class="icon-button" data-action="open-timer" aria-label="${esc(t('timer'))}" title="${esc(t('timer'))}">${icon('timer')}</button>${state.activeSession ? `<button class="button primary small" data-action="return-session">${icon('play')}${esc(t('resumeSession'))}</button>`:''}<div class="avatar" aria-label="Perfil">${profileName ? esc(profileName.slice(0,1).toUpperCase()) : 'F'}</div></div></header>
        <div class="content ${pageAnimation ? `page-transition ${pageAnimation}` : ''}" id="view-content">${content}</div>
      </main>
    </div>
    <nav class="mobile-nav" aria-label="Navegación inferior">${navItems.map(x => navButton(x,true)).join('')}</nav>
    ${modal ? renderModal() : ''}`;
  document.body.dataset.view = view;
  if (modal?.type === 'camera' && cameraVideo && cameraStream) {
    const video = root.querySelector('#camera-video');
    if (video) { video.srcObject = cameraStream; video.play().catch(()=>{}); cameraVideo = video; }
  }
}

function empty(title, text, action = '', label = '') {
  return `<div class="empty"><div class="empty-icon">${icon('activity')}</div><h3>${esc(title)}</h3><p>${esc(text)}</p>${action ? `<button class="button secondary small" data-action="${action}">${esc(label)}</button>`:''}</div>`;
}
function metric(label, value, note, iconName) {
  return `<div class="metric-card"><span class="metric-icon">${icon(iconName)}</span><div class="metric-label">${esc(label)}</div><div class="metric-value">${esc(value)}</div><div class="metric-note">${esc(note || '')}</div></div>`;
}
function homePage() {
  const completed = state.sessions.filter(s => s.status === 'completed' || s.status === 'ended-early');
  const today = dateKey(new Date());
  const todayPlan = state.schedule.filter(x => x.date === today);
  const recent = [...completed].sort((a,b) => new Date(b.completedAt) - new Date(a.completedAt)).slice(0,3);
  const weekStart = new Date(); weekStart.setHours(0,0,0,0); weekStart.setDate(weekStart.getDate()-6);
  const days = Array.from({length:7},(_,i)=>{const d=new Date(weekStart);d.setDate(weekStart.getDate()+i);return d;});
  const dayCounts = days.map(d => completed.filter(s => dateKey(new Date(s.completedAt)) === dateKey(d)).length);
  const maxCount = Math.max(1,...dayCounts);
  const totalMinutes = Math.round(completed.reduce((sum,s)=>sum+(s.durationMs || 0),0)/60000);
  const activeDays = new Set(completed.filter(s=>new Date(s.completedAt)>=weekStart).map(s=>dateKey(new Date(s.completedAt)))).size;
  const favoriteExercises = state.favorites.map(getExercise).filter(Boolean).slice(0,3);
  return `
    <section class="hero"><div class="hero-copy"><div class="hero-kicker"><span>✦</span>${esc(t('today'))} · ${esc(todayLocale())}</div><h2>${profileNameGreeting()}</h2><p>${esc(t('heroText'))}</p><div class="hero-actions"><button class="button primary" data-action="new-workout">${icon('plus')}${esc(t('newWorkout'))}</button><button class="button secondary" data-nav="exercises">${icon('activity')}${esc(t('explore'))}</button></div></div><div class="hero-orbit" aria-hidden="true"><svg viewBox="0 0 64 64"><path d="M14 43c7-17 13-24 20-24 6 0 11 7 16 24M11 43h42M22 30l-8-7m28 7 8-7M32 11v8" stroke-linecap="round" stroke-linejoin="round"/></svg></div></section>
    <div class="section-head"><div><h2>${esc(t('thisWeek'))}</h2><p>${completed.length ? 'Datos de tus sesiones guardadas' : esc(t('noProgressText'))}</p></div><button class="button ghost small" data-nav="progress">${esc(t('history'))} ${icon('arrow')}</button></div>
    <div class="grid three">${metric(t('sessions'),String(completed.length),'Sesiones guardadas','activity')}${metric(t('minutes'),String(totalMinutes),'Minutos acumulados','clock')}${metric(t('streak'),String(activeDays),'Días con actividad esta semana','calendar')}</div>
    <div class="grid two" style="margin-top:18px"><section class="surface pad"><div class="section-head" style="margin:0"><div><h2>Ritmo semanal</h2><p>Sesiones completadas por día</p></div><span class="tag">7 días</span></div><div class="week-bars" role="img" aria-label="${days.map((d,i)=>`${new Intl.DateTimeFormat('es-ES',{weekday:'long'}).format(d)}: ${dayCounts[i]} sesiones`).join('; ')}">${days.map((d,i)=>`<div class="week-day"><div class="bar-track"><div class="bar-fill" style="height:${Math.max(dayCounts[i] ? 8 : 2,dayCounts[i]/maxCount*100)}%"></div></div><small>${new Intl.DateTimeFormat(state.preferences.language==='en'?'en-GB':'es-ES',{weekday:'short'}).format(d).replace('.','')}</small></div>`).join('')}</div></section>
    <section class="surface pad"><div class="section-head" style="margin:0"><div><h2>${esc(t('planned'))}</h2><p>${esc(todayLocale())}</p></div><button class="icon-button" data-action="open-calendar" aria-label="${esc(t('openCalendar'))}">${icon('calendar')}</button></div>${todayPlan.length ? `<div class="list" style="margin-top:15px">${todayPlan.map(p=>`<div class="list-item"><div class="exercise-glyph">${icon(p.kind==='rest'?'moon':'dumbbell')}</div><div class="list-item-main"><strong>${esc(p.title || (p.kind==='rest'?'Día de descanso':workoutName(p.workoutId)))}</strong><small>${esc(p.time || 'Sin hora fijada')} · ${p.kind==='rest'?'Descanso':'Planificado'}${p.remind?' · Aviso activado':''}</small></div>${p.kind==='workout'?`<button class="icon-button" data-action="start-plan" data-id="${esc(p.id)}" aria-label="Iniciar">${icon('play')}</button>`:''}<button class="icon-button" data-action="delete-plan" data-id="${esc(p.id)}" aria-label="Eliminar">${icon('trash')}</button></div>`).join('')}</div>`:empty(t('noPlans'),'Programa una sesión o deja el día libre sin presión.','open-calendar',t('schedule'))}</section></div>
    <div class="grid two" style="margin-top:18px"><section><div class="section-head" style="margin:0 0 12px"><div><h2>${esc(t('recent'))}</h2><p>Tu actividad más reciente</p></div></div>${recent.length ? `<div class="list">${recent.map(s=>`<div class="list-item"><div class="exercise-glyph">${icon('check')}</div><div class="list-item-main"><strong>${esc(s.workoutName || 'Entrenamiento')}</strong><small>${esc(formatDate(s.completedAt,state.preferences.language==='en'?'en-GB':'es-ES'))} · ${esc(formatDuration(s.durationMs || 0))}</small></div><span class="tag">${Object.values(s.completed || {}).reduce((a,b)=>a+b,0)} series</span></div>`).join('')}</div>`:empty(t('noSessions'),t('noProgressText'),'new-workout',t('createFirst'))}</section>
    <section><div class="section-head" style="margin:0 0 12px"><div><h2>${esc(t('favorites'))}</h2><p>Movimientos guardados para volver a ellos</p></div><button class="button ghost small" data-nav="exercises">Ver biblioteca</button></div>${favoriteExercises.length ? `<div class="list">${favoriteExercises.map(e=>`<div class="list-item"><div class="exercise-glyph">${icon('activity')}</div><div class="list-item-main"><strong>${esc(e.name)}</strong><small>${esc(categoryName(e.category))} · ${esc(difficultyName(e.difficulty))}</small></div><button class="icon-button" data-action="exercise-detail" data-id="${esc(e.id)}">${icon('chevron')}</button></div>`).join('')}</div>`:empty(t('emptyFavorites'),'Explora la biblioteca y guarda los movimientos que quieras consultar.','go-exercises',t('explore'))}</section></div>
  `;
}
function profileNameGreeting() { return state.profile.name?.trim() ? esc(t('welcomeName',{name:state.profile.name.trim()})) : esc(t('welcome')); }
function workoutName(id) { return state.workouts.find(w=>w.id===id)?.name || 'Entrenamiento'; }
function categoryName(cat) { return CATEGORIES.find(x=>x[0]===cat)?.[1] || 'Personalizado'; }
function difficultyName(level) { return ({beginner:'Inicial',intermediate:'Intermedio',advanced:'Avanzado'})[level] || 'Variable'; }
function structureName(v) { return ({reps:'Repeticiones',time:'Por tiempo',circuit:'Circuito',custom:'Personalizada'})[v] || 'Personalizada'; }

function presetCopy(preset, key) {
  const language = state.preferences.language === 'en' ? 'En' : 'Es';
  return preset[`${key}${language}`] || preset[key] || '';
}
function presetName(preset) { return state.preferences.language === 'en' ? (preset.nameEn || preset.name) : preset.name; }
function presetCard(preset) {
  const names = preset.exercises.map(item => EXERCISES.find(exercise => exercise.id === item.exerciseId)?.name || 'Movimiento');
  return `<article class="preset-card ${preset.featured?'featured':''}">
    <div class="preset-card-top"><span class="tag">${esc(presetCopy(preset,'level'))}</span>${preset.featured?`<span class="preset-origin">✦ IDEA ORIGINAL</span>`:''}</div>
    <h3>${esc(presetName(preset))}</h3>
    <p class="preset-focus">${esc(presetCopy(preset,'focus'))}</p>
    <p class="preset-description">${esc(presetCopy(preset,'description'))}</p>
    <div class="preset-equipment">${icon('dumbbell')}<span>${esc(presetCopy(preset,'equipment'))}</span></div>
    <details class="preset-movements"><summary>${names.length} movimientos · Ver lista</summary><p>${names.map(esc).join(' · ')}</p></details>
    <button class="button ${preset.featured?'primary':'secondary'}" data-action="use-preset" data-id="${esc(preset.id)}">${icon('sliders')} Personalizar preajuste</button>
  </article>`;
}
function workoutsPage() {
  const items = [...state.workouts].sort((a,b)=>new Date(b.updatedAt||0)-new Date(a.updatedAt||0));
  return `<section class="preset-section">
      <div class="section-head" style="margin-top:0"><div><span class="eyebrow">EMPIEZA CON UNA BASE</span><h2>Preajustes de entrenamiento</h2><p>Plantillas listas para personalizar. No se guardan hasta que tú lo decidas.</p></div></div>
      <div class="preset-grid">${WORKOUT_PRESETS.map(presetCard).join('')}</div>
    </section>
    <div class="section-head"><div><h2>Mis entrenamientos</h2><p>Plantillas guardadas en este dispositivo</p></div><button class="button primary" data-action="new-workout">${icon('plus')}${esc(t('newWorkout'))}</button></div>
    ${items.length ? `<div class="grid equal">${items.map(w=>`<article class="surface pad"><div style="display:flex;justify-content:space-between;gap:12px"><span class="tag">${esc(structureName(w.structure))}</span><div class="list-controls"><button class="icon-button" data-action="edit-workout" data-id="${esc(w.id)}" aria-label="Editar">${icon('edit')}</button><button class="icon-button" data-action="duplicate-workout" data-id="${esc(w.id)}" aria-label="Duplicar">${icon('plus')}</button></div></div><h2 style="font:700 19px var(--font-head);margin:16px 0 5px">${esc(w.name)}</h2><p class="small-text">${w.exercises.length} movimientos · ${w.exercises.map(x=>getExercise(x.exerciseId)?.name || 'Movimiento').slice(0,2).map(esc).join(' · ')}${w.exercises.length>2?'…':''}</p><div class="divider"></div><div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><small class="muted">${esc(w.notes || 'Sin notas')}</small><div style="display:flex;gap:6px"><button class="button secondary small" data-action="delete-workout" data-id="${esc(w.id)}">${icon('trash')}</button><button class="button primary small" data-action="start-workout" data-id="${esc(w.id)}">${icon('play')}${esc(t('start'))}</button></div></div></article>`).join('')}</div>`:empty(t('noWorkout'),'Personaliza uno de los preajustes de arriba o crea una plantilla desde cero.','new-workout',t('newWorkout'))}
    <div class="notice" style="margin-top:18px"><strong>Diseña sin presiones.</strong> Los preajustes dejan series, repeticiones y duración sin fijar. Configura objetivos que encajen contigo antes de guardar o iniciar.</div>`;
}
function exerciseCard(e) {
  const favorite = state.favorites.includes(e.id);
  return `<article class="exercise-card" data-action="exercise-detail" data-id="${esc(e.id)}" tabindex="0" role="button" aria-label="Ver ${esc(e.name)}"><div class="exercise-card-top"><div class="exercise-glyph">${icon('activity')}</div><button class="favorite ${favorite?'active':''}" data-action="favorite" data-id="${esc(e.id)}" aria-label="${favorite?'Quitar de':'Añadir a'} favoritos">${icon('bookmark')}</button></div><h3>${esc(e.name)}</h3><p>${esc(categoryName(e.category))} · ${esc(difficultyName(e.difficulty))}</p><div class="exercise-card-foot"><span class="pill">${esc((e.equipment||[]).map(equipmentName).join(', '))}</span><span style="color:var(--accent)">${icon('chevron')}</span></div></article>`;
}
function equipmentName(id) { return EQUIPMENT.find(x=>x[0]===id)?.[1] || id; }
function filteredExercises() {
  return getExercises().filter(e => {
    const q = exerciseFilters.query.toLocaleLowerCase();
    const matchesQ = !q || `${e.name} ${e.pattern} ${e.muscles}`.toLocaleLowerCase().includes(q);
    const matchesCategory = exerciseFilters.category==='all' || e.category===exerciseFilters.category;
    const matchesEquipment = exerciseFilters.equipment==='all' || (e.equipment||[]).includes(exerciseFilters.equipment);
    const matchesDifficulty = exerciseFilters.difficulty==='all' || e.difficulty===exerciseFilters.difficulty;
    const matchesFav = !exerciseFilters.favorites || state.favorites.includes(e.id);
    return matchesQ && matchesCategory && matchesEquipment && matchesDifficulty && matchesFav;
  });
}
function exerciseGrid() {
  const list = filteredExercises();
  return list.length ? list.map(exerciseCard).join('') : empty(t('noExercises'), 'Prueba con otra búsqueda o cambia los filtros.');
}
function exercisesPage() {
  return `<div class="toolbar" style="margin-bottom:13px"><div class="search-field">${icon('search')}<input id="exercise-search" type="search" placeholder="${esc(t('search'))}" value="${esc(exerciseFilters.query)}" aria-label="${esc(t('search'))}" /></div><button class="button secondary" data-action="new-exercise">${icon('plus')}${esc(t('customExercise'))}</button></div>
    <div class="toolbar" style="margin-bottom:10px"><button class="filter-chip ${exerciseFilters.category==='all'?'active':''}" data-filter="category" data-value="all">${esc(t('all'))}</button>${CATEGORIES.map(([id,label])=>`<button class="filter-chip ${exerciseFilters.category===id?'active':''}" data-filter="category" data-value="${id}">${esc(label)}</button>`).join('')}<button class="filter-chip ${exerciseFilters.favorites?'active':''}" data-filter="favorites" data-value="toggle">${icon('bookmark')} ${esc(t('favoriteOnly'))}</button></div>
    <div class="toolbar" style="margin-bottom:16px"><select id="equipment-filter" aria-label="Filtrar por material"><option value="all">Todo el material</option>${EQUIPMENT.map(([id,label])=>`<option value="${id}" ${exerciseFilters.equipment===id?'selected':''}>${esc(label)}</option>`).join('')}</select><select id="difficulty-filter" aria-label="Filtrar por dificultad"><option value="all">Todas las dificultades</option><option value="beginner" ${exerciseFilters.difficulty==='beginner'?'selected':''}>Inicial</option><option value="intermediate" ${exerciseFilters.difficulty==='intermediate'?'selected':''}>Intermedio</option><option value="advanced" ${exerciseFilters.difficulty==='advanced'?'selected':''}>Avanzado</option></select></div>
    <div class="exercise-grid exercise-results">${exerciseGrid()}</div>
    <div class="small-text" style="margin-top:14px">${filteredExercises().length} movimientos disponibles · Las ilustraciones son esquemáticas; no son vídeos.</div>`;
}

function progressPage() {
  const completed = [...state.sessions].filter(s=>s.status==='completed'||s.status==='ended-early').sort((a,b)=>new Date(b.completedAt)-new Date(a.completedAt));
  const weekly = completed.filter(s=>Date.now()-new Date(s.completedAt).getTime()<=7*86400000);
  const totalMs = completed.reduce((n,s)=>n+(s.durationMs||0),0);
  const totalSets = completed.reduce((n,s)=>n+Object.values(s.completed||{}).reduce((a,b)=>a+b,0),0);
  const days = Array.from({length:7},(_,i)=>{const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-(6-i));return d;});
  const counts = days.map(d=>completed.filter(s=>dateKey(new Date(s.completedAt))===dateKey(d)).length);
  const max = Math.max(1,...counts);
  return `<div class="toolbar" style="justify-content:space-between;margin-bottom:18px"><div class="tab-row"><button class="tab ${progressTab==='overview'?'active':''}" data-progress-tab="overview">Resumen</button><button class="tab ${progressTab==='calendar'?'active':''}" data-progress-tab="calendar">${esc(t('calendar'))}</button><button class="tab ${progressTab==='history'?'active':''}" data-progress-tab="history">${esc(t('history'))}</button></div><button class="button secondary small" data-action="open-calendar">${icon('calendar')} ${esc(t('schedule'))}</button></div>
    ${progressTab==='calendar'?calendarContent():progressTab==='history'?historyContent(completed):`<div class="grid three">${metric('Sesiones totales',String(completed.length),'Sesiones registradas','activity')}${metric('Tiempo activo',formatDuration(totalMs),'Tiempo acumulado','clock')}${metric('Series completadas',String(totalSets),'Registro manual','check')}</div>
    <div class="grid two" style="margin-top:18px"><section class="surface pad"><div class="section-head" style="margin:0"><div><h2>Actividad de los últimos 7 días</h2><p>Sesiones registradas, no objetivos</p></div></div><div class="week-bars">${days.map((d,i)=>`<div class="week-day"><div class="bar-track"><div class="bar-fill" style="height:${counts[i] ? counts[i]/max*100 : 2}%"></div></div><small>${new Intl.DateTimeFormat('es-ES',{weekday:'short'}).format(d).replace('.','')}</small></div>`).join('')}</div></section><section class="surface pad"><h2 style="font:700 16px var(--font-head);margin:0 0 8px">Constancia reciente</h2><div class="metric-value">${weekly.length} <span class="small-text">sesiones / 7 días</span></div><p class="small-text">La constancia se muestra como actividad registrada, sin rachas obligatorias ni penalizaciones por descanso.</p><div class="progress-line"><span style="width:${Math.min(100,weekly.length/7*100)}%"></span></div><div class="divider"></div><p class="small-text">Se guardan sesiones completadas o finalizadas antes de tiempo. No se generan datos automáticamente.</p></section></div>
    <div class="section-head"><div><h2>Últimas sesiones</h2><p>Historial guardado en este dispositivo</p></div></div>${completed.length?historyContent(completed.slice(0,5)):empty(t('noProgress'),t('noProgressText'),'new-workout',t('createFirst'))}`}`;
}
function historyContent(completed) {
  return completed.length ? `<div class="list">${completed.map(s=>`<div class="list-item"><div class="exercise-glyph">${icon('check')}</div><div class="list-item-main"><strong>${esc(s.workoutName)}</strong><small>${esc(formatDate(s.completedAt,'es-ES',{weekday:'short',day:'numeric',month:'short',year:'numeric'}))} · ${esc(formatDuration(s.durationMs||0))} · ${Object.values(s.completed||{}).reduce((a,b)=>a+b,0)} series</small></div><span class="tag">${s.status==='ended-early'?'Finalizada':'Completada'}</span></div>`).join('')}</div>`:empty(t('noProgress'),t('noProgressText'),'new-workout',t('createFirst'));
}
function calendarContent() {
  const year=calendarMonth.getFullYear(),month=calendarMonth.getMonth();
  const first=new Date(year,month,1), offset=(first.getDay()+6)%7, daysInMonth=new Date(year,month+1,0).getDate();
  const cells=Array.from({length:42},(_,i)=>{const day=i-offset+1;return new Date(year,month,day,12);});
  const selected=state.schedule.filter(x=>x.date===selectedDate);
  const completedOnDay=state.sessions.filter(x=>x.completedAt&&dateKey(new Date(x.completedAt))===selectedDate);
  return `<section class="surface pad"><div class="toolbar" style="justify-content:space-between;margin-bottom:14px"><button class="icon-button" data-action="month-prev" aria-label="Mes anterior">${icon('back')}</button><strong style="font:700 17px var(--font-head)">${esc(new Intl.DateTimeFormat('es-ES',{month:'long',year:'numeric'}).format(calendarMonth))}</strong><button class="icon-button" data-action="month-next" aria-label="Mes siguiente">${icon('chevron')}</button></div><div class="calendar">${['L','M','X','J','V','S','D'].map(x=>`<div class="calendar-day-head">${x}</div>`).join('')}${cells.map(d=>{const k=dateKey(d),items=state.schedule.filter(x=>x.date===k),done=state.sessions.filter(x=>x.completedAt&&dateKey(new Date(x.completedAt))===k);return `<button class="calendar-day ${d.getMonth()!==month?'outside':''} ${k===dateKey(new Date())?'today':''} ${k===selectedDate?'selected':''}" data-action="select-date" data-date="${k}"><span class="day-num">${d.getDate()}</span>${Array.from({length:Math.min(3,items.length+done.length)},()=>`<span class="calendar-dot"></span>`).join('')}${items.length+done.length>3?`<small>+${items.length+done.length-3}</small>`:''}</button>`}).join('')}</div></section>
    <div class="section-head"><div><h2>${esc(formatDate(`${selectedDate}T12:00:00`,'es-ES',{weekday:'long',day:'numeric',month:'long'}))}</h2><p>Agenda del día seleccionado</p></div><button class="button primary small" data-action="open-schedule">${icon('plus')}${esc(t('schedule'))}</button></div>
    ${selected.length||completedOnDay.length?`<div class="list">${selected.map(p=>`<div class="list-item"><div class="exercise-glyph">${icon(p.kind==='rest'?'moon':'calendar')}</div><div class="list-item-main"><strong>${esc(p.title|| (p.kind==='rest'?'Día de descanso':workoutName(p.workoutId)))}</strong><small>${esc(p.time||'Sin hora')} · ${p.kind==='rest'?'Descanso':'Entrenamiento planificado'}${p.remind?' · Aviso activado':''}</small></div>${p.kind==='workout'?`<button class="icon-button" data-action="start-plan" data-id="${esc(p.id)}" aria-label="Iniciar">${icon('play')}</button>`:''}<button class="icon-button" data-action="reschedule-plan" data-id="${esc(p.id)}" aria-label="Cambiar fecha">${icon('edit')}</button><button class="icon-button" data-action="delete-plan" data-id="${esc(p.id)}" aria-label="Eliminar">${icon('trash')}</button></div>`).join('')}${completedOnDay.map(p=>`<div class="list-item"><div class="exercise-glyph">${icon('check')}</div><div class="list-item-main"><strong>${esc(p.workoutName)}</strong><small>${esc(formatDuration(p.durationMs||0))} · Sesión registrada</small></div><span class="tag">Realizada</span></div>`).join('')}</div>`:empty(t('noCalendar'),'Puedes añadir una sesión o marcar un día de descanso sin asociarlo a una rutina.','open-schedule',t('schedule'))}`;
}

function settingsPage() {
  const p=state.preferences, profile=state.profile;
  const themeOptions=[['system',t('system')],['dark',t('dark')],['light',t('light')]];
  return `<form data-form="settings" class="stack">
    <section class="surface pad"><div class="section-head" style="margin:0 0 15px"><div><h2>Perfil de entrenamiento</h2><p>Opcional; ayuda a adaptar la experiencia</p></div></div><div class="form-grid"><div class="field"><label for="profile-name">Nombre (opcional)</label><input id="profile-name" name="name" maxlength="40" value="${esc(profile.name)}" placeholder="¿Cómo te llamamos?" /></div><div class="field"><label for="profile-level">${esc(t('level'))}</label><select id="profile-level" name="level"><option value="beginner" ${profile.level==='beginner'?'selected':''}>${esc(t('beginner'))}</option><option value="intermediate" ${profile.level==='intermediate'?'selected':''}>${esc(t('intermediate'))}</option><option value="advanced" ${profile.level==='advanced'?'selected':''}>${esc(t('advanced'))}</option></select></div><div class="field"><label for="profile-duration">${esc(t('duration'))} (${esc(t('min'))})</label><input id="profile-duration" name="duration" type="number" min="5" max="180" value="${profile.duration}" /></div><div class="field"><label for="profile-units">${esc(t('units'))}</label><select id="profile-units" name="units"><option value="metric" ${profile.units==='metric'?'selected':''}>${esc(t('metric'))}</option><option value="imperial" ${profile.units==='imperial'?'selected':''}>${esc(t('imperial'))}</option></select></div></div><div class="field" style="margin-top:14px"><span class="field-label">${esc(t('equipment'))}</span><div class="toolbar">${EQUIPMENT.map(([id,label])=>`<label class="check-row"><input type="checkbox" name="equipment" value="${id}" ${profile.equipment.includes(id)?'checked':''}/> ${esc(label)}</label>`).join('')}</div></div><div class="form-actions"><button class="button primary" type="submit">${esc(t('save'))}</button><button class="button ghost small" type="button" data-action="open-onboarding">${state.preferences.language==='en'?'Run setup again':'Volver a configurar FORMA'}</button></div></section>
    <section class="surface pad"><div class="section-head" style="margin:0 0 10px"><div><h2>${esc(t('appearance'))}</h2><p>Personaliza la interfaz</p></div></div><div class="form-grid"><div class="field"><label for="pref-theme">${esc(t('theme'))}</label><select id="pref-theme" name="theme">${themeOptions.map(([v,l])=>`<option value="${v}" ${p.theme===v?'selected':''}>${esc(l)}</option>`).join('')}</select></div><div class="field"><label for="pref-language">${esc(t('language'))}</label><select id="pref-language" name="language"><option value="es" ${p.language==='es'?'selected':''}>Español</option><option value="en" ${p.language==='en'?'selected':''}>English</option></select></div></div><div class="form-actions"><button class="button secondary" type="submit">Aplicar cambios</button></div></section>
    <section class="surface pad"><div class="section-head" style="margin:0 0 7px"><div><h2>Interacción y accesibilidad</h2><p>Los gestos siempre tienen controles visibles equivalentes</p></div></div>
      ${toggle('gestures',t('gestures'),t('explainGestures'),p.gestures)}${toggle('workoutGestures',t('workoutGestures'),'Deslizar para cambiar de ejercicio y abrir instrucciones.',p.workoutGestures)}${toggle('doubleTap','Ampliar con doble toque','Doble toque sobre la ilustración del ejercicio.',p.doubleTap)}${toggle('animations','Animaciones de interfaz','Transiciones suaves entre pantallas y microinteracciones. Respeta Reducir movimiento del sistema.',p.animations!==false)}
      <div class="field" style="margin-top:13px"><label for="gesture-sensitivity">${esc(t('sensitivity'))}</label><select id="gesture-sensitivity" name="sensitivity"><option value="low" ${p.sensitivity==='low'?'selected':''}>Baja (requiere más recorrido)</option><option value="normal" ${p.sensitivity==='normal'?'selected':''}>Normal</option><option value="high" ${p.sensitivity==='high'?'selected':''}>Alta (requiere menos recorrido)</option></select></div>
      ${toggle('sound',t('sound'),'Pitido breve al terminar el temporizador.',p.sound)}${toggle('vibration',t('vibration'),'Solo si el navegador y dispositivo lo admiten.',p.vibration)}
      <div class="notice" style="margin-top:14px">${esc(t('explainGestures'))}</div>
    </section>
    <section class="surface pad"><div class="section-head" style="margin:0 0 8px"><div><h2>Notificaciones y recordatorios</h2><p>Recibe un aviso cuando llegue la hora de una sesión programada.</p></div></div>
      ${toggle('notifications','Permitir notificaciones','FORMA pedirá permiso al navegador para mostrar recordatorios locales.',p.notifications)}
      <div class="data-row"><span class="small-text">Permiso del navegador</span><strong>${esc(!('Notification' in window)?'No compatible':Notification.permission==='granted'?'Permitido':Notification.permission==='denied'?'Bloqueado':'Sin decidir')}</strong></div>
      <div class="notice warning" style="margin-top:12px">Los avisos se programan localmente. Pueden llegar con retraso si el navegador suspende FORMA y no se pueden garantizar cuando cierras completamente la app o el sistema la detiene. No se envían datos a ningún servidor.</div>
      <div class="form-actions"><button type="button" class="button secondary small" data-action="test-notification" ${!p.notifications||!('Notification' in window)||Notification.permission!=='granted'?'disabled':''}>${icon('bell')} Probar notificación</button></div>
    </section>
    ${state.hiddenExercises.length?`<section class="surface pad"><div class="section-head" style="margin:0 0 10px"><div><h2>Ejercicios ocultos</h2><p>Puedes volver a mostrarlos en la biblioteca.</p></div></div>${state.hiddenExercises.map(id=>{const e=EXERCISES.find(x=>x.id===id);return e?`<div class="data-row"><span class="small-text">${esc(e.name)}</span><button type="button" class="button secondary small" data-action="unhide-exercise" data-id="${esc(id)}">Mostrar</button></div>`:''}).join('')}</section>`:''}
    <section class="surface pad"><div class="section-head" style="margin:0 0 12px"><div><h2>${esc(t('data'))}</h2><p>${esc(t('storageInfo'))}</p></div></div><div class="toolbar"><button type="button" class="button secondary" data-action="export">${icon('download')}${esc(t('export'))}</button><button type="button" class="button secondary" data-action="import">${icon('arrow')}${esc(t('import'))}</button><input id="import-file" type="file" accept="application/json,.json" class="hidden" /></div><div class="divider"></div><div class="data-row"><span class="small-text">Motor de almacenamiento</span><span class="tag">${store.mode==='indexeddb'?'IndexedDB':'LocalStorage'}</span></div><div class="data-row"><span class="small-text">Sesiones guardadas</span><strong>${state.sessions.length}</strong></div><div class="data-row"><span class="small-text">Plantillas guardadas</span><strong>${state.workouts.length}</strong></div><button type="button" class="button danger small" data-action="clear-data" style="margin-top:15px">${icon('trash')}${esc(t('clear'))}</button></section>
    <section class="surface pad"><div class="section-head" style="margin:0 0 10px"><div><h2>${esc(t('privacy'))}</h2><p>Sin cuenta, sin sincronización en la nube y sin analítica de terceros.</p></div></div><div class="notice"><strong>Almacenamiento local.</strong> Tus plantillas, sesiones y preferencias permanecen en el almacenamiento de este navegador. Borrar los datos del sitio puede eliminarlos; conserva una exportación si necesitas una copia.</div><div class="divider"></div><div class="toolbar"><button type="button" class="button secondary small" data-action="open-camera">${icon('camera')}${esc(t('camera'))}</button><a class="button ghost small" href="./PRIVACY.md" target="_blank" rel="noopener">PRIVACY.md ↗</a><a class="button ghost small" href="./OFFLINE_CAPABILITIES.md" target="_blank" rel="noopener">Offline ↗</a></div></section>
  </form>`;
}
function toggle(name,label,description,value) {
  return `<div class="toggle-row"><div class="toggle-copy"><strong>${esc(label)}</strong><small>${esc(description)}</small></div><input class="switch" type="checkbox" data-setting="${name}" aria-label="${esc(label)}" ${value?'checked':''}/></div>`;
}

function onboardingPage() {
  const en = state.preferences.language === 'en';
  const tr = (es, english) => en ? english : es;
  const profile = state.profile, preferences = state.preferences;
  const selectedEquipment = new Set(profile.equipment || ['bodyweight']);
  const equipmentNames = {
    bodyweight:tr('Sin material','Bodyweight only'),
    dumbbells:tr('Mancuernas','Dumbbells'),
    bench:tr('Banco','Bench'),
    'resistance-band':tr('Banda elástica','Resistance band'),
    chair:tr('Silla','Chair')
  };
  const equipmentOptions = EQUIPMENT.map(([id]) =>
    '<label class="onboarding-choice"><input type="checkbox" name="equipment" value="' + esc(id) + '"' + (selectedEquipment.has(id) ? ' checked' : '') + '><span class="onboarding-choice-mark">' + icon('check') + '</span><span><strong>' + esc(equipmentNames[id] || id) + '</strong><small>' + esc(id === 'bodyweight' ? tr('Entrena sin accesorios','Train without equipment') : tr('Disponible para tus sesiones','Available for your sessions')) + '</small></span></label>'
  ).join('');
  const progress = onboardingStep === 0 ? 0 : onboardingStep === 1 ? 50 : 100;
  const stage = onboardingStep === 0 ? tr('Bienvenida','Welcome') : onboardingStep === 1 ? tr('Tu perfil','Your profile') : tr('Tu espacio','Your setup');
  return '<main class="onboarding-shell">' +
    '<form data-form="onboarding" class="onboarding-form" novalidate>' +
      '<header class="onboarding-top">' +
        '<div class="onboarding-brand"><span class="onboarding-brand-mark"><img src="./public/icons/dumbbell-mark.svg" alt=""></span><span>FORMA</span></div>' +
        '<label class="onboarding-language"><span>' + esc(tr('Idioma','Language')) + '</span><select id="onboarding-language" name="language"><option value="es"' + (preferences.language === 'es' ? ' selected' : '') + '>Español</option><option value="en"' + (preferences.language === 'en' ? ' selected' : '') + '>English</option></select></label>' +
      '</header>' +
      '<div class="onboarding-progress" aria-label="' + esc(stage) + '">' +
        '<div class="onboarding-progress-copy"><span>' + esc(stage) + '</span><span>' + (onboardingStep + 1) + ' / 3</span></div>' +
        '<div class="onboarding-progress-track"><span style="width:' + progress + '%"></span></div>' +
      '</div>' +
      '<section class="onboarding-step onboarding-welcome"' + (onboardingStep !== 0 ? ' hidden' : '') + ' data-onboarding-step="0" aria-labelledby="onboarding-title">' +
        '<div class="onboarding-art" aria-hidden="true"><span class="onboarding-orbit orbit-one"></span><span class="onboarding-orbit orbit-two"></span><span class="onboarding-orbit orbit-three"></span><span class="onboarding-spark spark-one">✦</span><span class="onboarding-spark spark-two">✧</span><div class="onboarding-art-mark"><img src="./public/icons/dumbbell-mark.svg" alt=""></div></div>' +
        '<p class="onboarding-kicker">' + esc(tr('MUÉVETE CON INTENCIÓN','MOVE WITH INTENT')) + '</p>' +
        '<h1 id="onboarding-title">' + esc(tr('Tu espacio. Tu ritmo.','Your space. Your pace.')) + '</h1>' +
        '<p class="onboarding-lead">' + esc(tr('Bienvenido a FORMA. Prepara tu espacio para entrenar a tu manera, aprender movimientos y seguir tu progreso sin perder de vista lo importante: sentirte bien.','Welcome to FORMA. Set up your space to train your way, learn movements and follow your progress without losing sight of what matters: feeling good.')) + '</p>' +
        '<div class="onboarding-benefits"><div><span>' + icon('shield') + '</span><strong>' + esc(tr('Privado por diseño','Private by design')) + '</strong><small>' + esc(tr('Tus datos se guardan en este dispositivo.','Your data stays on this device.')) + '</small></div><div><span>' + icon('sliders') + '</span><strong>' + esc(tr('A tu medida','Made to fit you')) + '</strong><small>' + esc(tr('Ajustes que puedes cambiar cuando quieras.','Settings you can change anytime.')) + '</small></div></div>' +
        '<div class="onboarding-actions"><button type="button" class="button primary onboarding-primary" data-action="onboarding-start">' + esc(tr('Preparar FORMA','Set up FORMA')) + ' ' + icon('arrow') + '</button><button type="button" class="button ghost" data-action="onboarding-skip">' + esc(tr('Explorar primero','Explore first')) + '</button></div>' +
        '<p class="onboarding-footnote">' + esc(tr('No necesitas crear una cuenta. No pediremos acceso a la cámara ni notificaciones sin que tú lo elijas.','No account needed. We will not request camera or notification access unless you choose it.')) + '</p>' +
      '</section>' +
      '<section class="onboarding-step"' + (onboardingStep !== 1 ? ' hidden' : '') + ' data-onboarding-step="1" aria-labelledby="onboarding-profile-title">' +
        '<div class="onboarding-section-icon">' + icon('activity') + '</div>' +
        '<p class="onboarding-kicker">' + esc(tr('PASO 1 · PUNTO DE PARTIDA','STEP 1 · STARTING POINT')) + '</p>' +
        '<h1 id="onboarding-profile-title">' + esc(tr('Empecemos contigo.','Let’s start with you.')) + '</h1>' +
        '<p class="onboarding-lead">' + esc(tr('Estos detalles ayudan a adaptar las sugerencias. Todo es editable y puedes dejar el nombre vacío.','These details help tailor suggestions. Everything is editable, and your name can stay blank.')) + '</p>' +
        '<div class="onboarding-fields">' +
          '<div class="field onboarding-field-wide"><label for="onboarding-name">' + esc(tr('¿Cómo te llamamos? (opcional)','What should we call you? (optional)')) + '</label><input id="onboarding-name" name="name" maxlength="40" value="' + esc(profile.name || '') + '" placeholder="' + esc(tr('Tu nombre','Your name')) + '"></div>' +
          '<div class="field"><label for="onboarding-level">' + esc(tr('Experiencia','Experience')) + '</label><select id="onboarding-level" name="level"><option value="beginner"' + (profile.level === 'beginner' ? ' selected' : '') + '>' + esc(tr('Principiante','Beginner')) + '</option><option value="intermediate"' + (profile.level === 'intermediate' ? ' selected' : '') + '>' + esc(tr('Intermedio','Intermediate')) + '</option><option value="advanced"' + (profile.level === 'advanced' ? ' selected' : '') + '>' + esc(tr('Avanzado','Advanced')) + '</option></select></div>' +
          '<div class="field"><label for="onboarding-duration">' + esc(tr('Duración habitual','Usual session length')) + '</label><div class="onboarding-input-suffix"><input id="onboarding-duration" name="duration" type="number" min="5" max="180" step="5" value="' + esc(profile.duration || 20) + '"><span>' + esc(tr('min','min')) + '</span></div></div>' +
          '<div class="field onboarding-field-wide"><label for="onboarding-units">' + esc(tr('Unidades de peso','Weight units')) + '</label><select id="onboarding-units" name="units"><option value="metric"' + (profile.units !== 'imperial' ? ' selected' : '') + '>' + esc(tr('Métrico · kg','Metric · kg')) + '</option><option value="imperial"' + (profile.units === 'imperial' ? ' selected' : '') + '>' + esc(tr('Imperial · lb','Imperial · lb')) + '</option></select></div>' +
        '</div>' +
        '<div class="onboarding-actions onboarding-actions-split"><button type="button" class="button ghost" data-action="onboarding-back">' + icon('back') + ' ' + esc(tr('Atrás','Back')) + '</button><button type="button" class="button primary" data-action="onboarding-next">' + esc(tr('Continuar','Continue')) + ' ' + icon('arrow') + '</button></div>' +
      '</section>' +
      '<section class="onboarding-step"' + (onboardingStep !== 2 ? ' hidden' : '') + ' data-onboarding-step="2" aria-labelledby="onboarding-setup-title">' +
        '<div class="onboarding-section-icon">' + icon('dumbbell') + '</div>' +
        '<p class="onboarding-kicker">' + esc(tr('PASO 2 · TU ENTORNO','STEP 2 · YOUR SPACE')) + '</p>' +
        '<h1 id="onboarding-setup-title">' + esc(tr('Prepara tu espacio.','Set up your space.')) + '</h1>' +
        '<p class="onboarding-lead">' + esc(tr('Marca el material que tienes a mano. FORMA no bloqueará ejercicios: siempre podrás elegir variantes y editar tus rutinas.','Choose the equipment you have. FORMA will not lock exercises: you can always choose alternatives and edit your routines.')) + '</p>' +
        '<fieldset class="onboarding-equipment"><legend>' + esc(tr('Material disponible','Available equipment')) + '</legend><div class="onboarding-choice-grid">' + equipmentOptions + '</div></fieldset>' +
        '<div class="onboarding-fields onboarding-preferences">' +
          '<div class="field"><label for="onboarding-theme">' + esc(tr('Apariencia','Appearance')) + '</label><select id="onboarding-theme" name="theme"><option value="system"' + (preferences.theme === 'system' ? ' selected' : '') + '>' + esc(tr('Seguir el sistema','Follow system')) + '</option><option value="dark"' + (preferences.theme === 'dark' ? ' selected' : '') + '>' + esc(tr('Oscuro','Dark')) + '</option><option value="light"' + (preferences.theme === 'light' ? ' selected' : '') + '>' + esc(tr('Claro','Light')) + '</option></select></div>' +
          '<div class="field"><label>' + esc(tr('Comodidad y avisos','Comfort and reminders')) + '</label><label class="onboarding-toggle"><input type="checkbox" name="animations"' + (preferences.animations !== false ? ' checked' : '') + '><span class="onboarding-toggle-copy"><strong>' + esc(tr('Animaciones suaves','Smooth animations')) + '</strong><small>' + esc(tr('Se desactivan automáticamente si tu sistema prefiere menos movimiento.','Automatically reduced when your system prefers less motion.')) + '</small></span></label>' +
          '<label class="onboarding-toggle"><input type="checkbox" name="notifications"' + (preferences.notifications ? ' checked' : '') + '><span class="onboarding-toggle-copy"><strong>' + esc(tr('Recordatorios de entrenamiento','Workout reminders')) + '</strong><small>' + esc(tr('FORMA pedirá permiso al terminar. Puedes cambiarlo más tarde.','FORMA will ask for permission when you finish. You can change this later.')) + '</small></span></label></div>' +
        '</div>' +
        '<div class="notice onboarding-privacy"><strong>' + esc(tr('Siempre bajo tu control.','Always in your control.')) + '</strong> ' + esc(tr('La cámara solo se activa desde su función específica. Los datos de perfil y entrenamiento permanecen en este dispositivo.','The camera only turns on from its dedicated feature. Profile and workout data stay on this device.')) + '</div>' +
        '<div class="onboarding-actions onboarding-actions-split"><button type="button" class="button ghost" data-action="onboarding-back">' + icon('back') + ' ' + esc(tr('Atrás','Back')) + '</button><button type="submit" class="button primary">' + esc(tr('Guardar y entrar','Save and enter')) + ' ' + icon('check') + '</button></div>' +
      '</section>' +
      '<div class="onboarding-bottom"><span>' + icon('shield') + ' ' + esc(tr('Sin cuenta · Sin nube · Sin prisa','No account · No cloud · No rush')) + '</span><span>FORMA · 1.3.0</span></div>' +
    '</form>' +
  '</main>';
}

function syncOnboardingFormToState() {
  const form = root.querySelector('form[data-form="onboarding"]');
  if (!form) return;
  const fd = new FormData(form);
  const equipment = fd.getAll('equipment').map(String);
  state.profile = {
    ...state.profile,
    name:String(fd.get('name') || '').trim().slice(0,40),
    level:['beginner','intermediate','advanced'].includes(String(fd.get('level'))) ? String(fd.get('level')) : 'beginner',
    duration:Math.min(180,Math.max(5,Number(fd.get('duration')) || 20)),
    units:fd.get('units') === 'imperial' ? 'imperial' : 'metric',
    equipment:equipment.length ? equipment : ['bodyweight']
  };
  state.preferences = {
    ...state.preferences,
    language:fd.get('language') === 'en' ? 'en' : 'es',
    theme:['dark','light','system'].includes(String(fd.get('theme'))) ? String(fd.get('theme')) : state.preferences.theme,
    animations:fd.get('animations') === 'on'
  };
  onboardingNotificationsRequested = fd.get('notifications') === 'on';
}

function sessionPage() {
  const s=state.activeSession;
  if (!s) return empty('No hay una sesión activa','Elige una plantilla de entrenamiento para empezar.','go-workouts',t('workouts'));
  const item=s.workout.exercises[s.currentIndex];
  const exercise=getExercise(item.exerciseId) || {name:'Ejercicio personalizado',steps:[],start:'',breathing:'',safety:''};
  const elapsed=elapsedMilliseconds(s);
  const count=s.completed[s.currentIndex]||0;
  const targetSets=Number(item.sets)||0;
  const progress=(s.currentIndex+(targetSets?Math.min(1,count/targetSets):0))/s.workout.exercises.length*100;
  return `<div class="session-shell"><div class="session-top"><button class="button ghost small" data-action="leave-session">${icon('back')} Volver</button><span class="tag">${esc(s.workoutName)}</span><button class="icon-button" data-action="open-timer" aria-label="Temporizador">${icon('timer')}</button></div>
    <div class="session-panel"><div class="session-count">Movimiento ${s.currentIndex+1} / ${s.workout.exercises.length}</div><h2 class="session-exercise">${esc(exercise.name)}</h2><p class="session-desc">${esc(categoryName(exercise.category))} · ${esc(exercise.pattern||'Movimiento')}${item.weight?` · ${esc(item.weight)} kg`:''}</p><div class="session-visual" data-illustration><div class="exercise-glyph">${icon('activity')}</div></div>
      <div class="session-metrics"><div class="session-metric"><strong>${count}${targetSets?` / ${targetSets}`:''}</strong><small>${esc(t('sets'))}</small></div><div class="session-metric"><strong>${item.reps?esc(item.reps):item.duration?`${esc(item.duration)}s`:'—'}</strong><small>${item.reps?esc(t('repetitions')):item.duration?'Duración':esc(t('noGoal'))}</small></div><div class="session-metric"><strong id="session-clock">${formatDuration(elapsed)}</strong><small>Tiempo total</small></div></div>
      <div class="session-progress"><span style="width:${Math.min(100,progress)}%"></span></div><div class="session-controls" style="margin-top:20px"><button class="button secondary" data-action="session-previous" ${s.currentIndex===0?'disabled':''}>${icon('back')}${esc(t('previous'))}</button><button class="button primary" data-action="complete-set">${icon('check')}${esc(t('completeSet'))}</button><button class="button secondary" data-action="session-next">${esc(t('next'))}${icon('arrow')}</button></div>
      <div class="session-controls" style="margin-top:10px"><button class="button ghost small" data-action="session-pause">${icon(s.paused?'play':'pause')}${esc(s.paused?t('resume'):t('pause'))}</button><button class="button ghost small" data-action="rest-from-exercise">${icon('timer')} Descansar ${esc(item.rest??60)}s</button><button class="button ghost small" data-action="undo" ${!s.history?.length?'disabled':''}>${icon('undo')}${esc(t('undo'))}</button><button class="button danger small" data-action="finish-session">${esc(t('finish'))}</button></div>
    </div>
    <div class="section-head"><div><h2>Indicaciones</h2><p>Consulta los puntos clave del movimiento</p></div><button class="button ghost small" data-action="exercise-detail" data-id="${esc(exercise.id)}">Ver ficha completa</button></div>
    <div class="surface pad"><strong style="font-size:13px">Posición inicial</strong><p class="small-text">${esc(exercise.start||'Consulta una posición cómoda y estable.')}</p><div class="divider"></div><strong style="font-size:13px">Respiración</strong><p class="small-text">${esc(exercise.breathing||'Respira de forma continua.')}</p><div class="divider"></div><strong style="font-size:13px">Siguiente</strong><p class="small-text">${esc(getExercise(s.workout.exercises[s.currentIndex+1]?.exerciseId)?.name||'Fin de la lista')}</p></div>
    <div class="notice warning" style="margin-top:14px">Detente si notas dolor, mareo o malestar. FORMA no sustituye la orientación profesional.</div>
  </div>`;
}

function renderPage() {
  if (view === 'onboarding') {
    root.innerHTML = onboardingPage();
    document.body.dataset.view = 'onboarding';
    applyTheme();
    updateSessionTicker();
    return;
  }
  const titles = {home:t('home'),workouts:t('workouts'),exercises:t('exercises'),progress:t('progress'),settings:t('settings'),session:'Sesión activa'};
  const content = view==='home' ? homePage() : view==='workouts' ? workoutsPage() : view==='exercises' ? exercisesPage() : view==='progress' ? progressPage() : view==='settings' ? settingsPage() : sessionPage();
  layout(content,titles[view]);
  applyTheme();
  updateSessionTicker();
}
function applyTheme() {
  const theme=state.preferences.theme;
  const resolved=theme==='system'?(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'):theme;
  document.documentElement.dataset.theme=resolved;
  document.documentElement.dataset.motion=state.preferences.animations===false?'off':'on';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content',resolved==='light'?'#f2f8f9':'#101b22');
  document.documentElement.lang=state.preferences.language==='en'?'en':'es';
}
function navigate(next, direction = null) {
  if (!next || !['home','workouts','exercises','progress','settings','session'].includes(next) || next===view) return;
  const ids=navItems.map(x=>x[0]);
  const previousIndex=ids.indexOf(view), nextIndex=ids.indexOf(next);
  const resolvedDirection=direction ?? (previousIndex>=0&&nextIndex>=0?Math.sign(nextIndex-previousIndex):1);
  if(state.preferences.animations!==false) pendingPageAnimation=resolvedDirection<0?'enter-backward':'enter-forward';
  view=next; state.lastViewed=next; persist(); modal=null; stopCamera(); renderPage(); window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
}
function navigateDelta(delta) {
  const ids=navItems.map(x=>x[0]); const index=ids.indexOf(view); if(index<0)return;
  const nextIndex=Math.min(ids.length-1,Math.max(0,index+delta));
  if(nextIndex!==index)navigate(ids[nextIndex],delta);
}
function openModal(type,data={}) { modal={type,...data}; renderPage(); }
function closeModal() { if(modal?.type==='camera') stopCamera(); modal=null; renderPage(); }
function renderModal() {
  if (!modal) return '';
  let body=''; let title=''; let subtitle='';
  if (modal.type==='exercise') {
    const e=getExercise(modal.id); if(!e)return '';
    title=e.name; subtitle=`${categoryName(e.category)} · ${difficultyName(e.difficulty)} · ${(e.equipment||[]).map(equipmentName).join(', ')}`;
    const sections=[['Posición inicial',e.start],['Ejecución',e.steps],['Respiración',e.breathing],['Errores frecuentes',e.mistakes],['Variación más sencilla',e.easier],['Variación más exigente',e.harder],['Seguridad',e.safety]];
    const exerciseSessions=state.sessions.filter(s=>s.workout?.exercises?.some(x=>x.exerciseId===e.id)).slice(0,4);
    body=`<div class="exercise-glyph" data-illustration style="width:72px;height:72px;border-radius:24px;margin-bottom:12px">${icon('activity')}</div>${sections.map(([h,v])=>`<section class="detail-section"><h3>${esc(h)}</h3>${Array.isArray(v)?`<ul>${v.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:`<p>${esc(v||'No hay información adicional.')}</p>`}</section>`).join('')}${exerciseSessions.length?`<section class="detail-section"><h3>Sesiones donde aparece</h3><ul>${exerciseSessions.map(s=>`<li>${esc(s.workoutName)} · ${esc(formatDate(s.completedAt))}</li>`).join('')}</ul></section>`:''}<div class="form-actions"><button class="button secondary" data-action="favorite" data-id="${esc(e.id)}">${icon('bookmark')}${state.favorites.includes(e.id)?'Quitar de favoritos':'Guardar en favoritos'}</button>${state.customExercises.some(x=>x.id===e.id)?`<button class="button ghost" data-action="edit-exercise" data-id="${esc(e.id)}">Editar</button><button class="button danger small" data-action="delete-custom-exercise" data-id="${esc(e.id)}">Eliminar</button>`:`<button class="button ghost small" data-action="hide-exercise" data-id="${esc(e.id)}">Ocultar</button>`}<button class="button primary" data-action="close-modal">${esc(t('close'))}</button></div>`;
  } else if (modal.type==='builder') {
    const d=builderDraft; title=modal.presetTitle?`Personalizar ${modal.presetTitle}`:(d.id?'Editar entrenamiento':'Nuevo entrenamiento'); subtitle=modal.presetTitle?'Revisa la selección y ajusta objetivos, pausas y notas antes de guardar.':'Configura la estructura y los objetivos de cada movimiento.';
    body=`<form data-form="builder"><div class="field"><label for="builder-name">${esc(t('workoutName'))}</label><input id="builder-name" name="name" required maxlength="70" value="${esc(d.name)}" placeholder="Ej. Fuerza y movilidad" /></div><div class="form-grid" style="margin-top:12px"><div class="field"><label for="builder-structure">${esc(t('structure'))}</label><select id="builder-structure" name="structure"><option value="reps" ${d.structure==='reps'?'selected':''}>Repeticiones</option><option value="time" ${d.structure==='time'?'selected':''}>Por tiempo</option><option value="circuit" ${d.structure==='circuit'?'selected':''}>Circuito</option><option value="custom" ${d.structure==='custom'?'selected':''}>Personalizada</option></select></div><div class="field"><label for="builder-notes">Notas generales</label><input id="builder-notes" name="notes" value="${esc(d.notes||'')}" maxlength="500" placeholder="Opcional" /></div></div>
      <div class="section-head"><div><h2>Movimientos (${d.exercises.length})</h2><p>Los objetivos vacíos quedan como registro manual.</p></div></div>
      ${d.exercises.length?`<div class="list">${d.exercises.map((x,i)=>{const e=getExercise(x.exerciseId);return `<div class="surface pad" data-exercise-row="${i}"><div class="toolbar" style="justify-content:space-between"><div class="list-item-main"><strong>${esc(e?.name||'Ejercicio eliminado')}</strong><small>${esc(categoryName(e?.category))}</small></div><div class="list-controls"><button type="button" class="icon-button" data-action="builder-up" data-index="${i}" aria-label="Subir" ${i===0?'disabled':''}>↑</button><button type="button" class="icon-button" data-action="builder-down" data-index="${i}" aria-label="Bajar" ${i===d.exercises.length-1?'disabled':''}>↓</button><button type="button" class="icon-button" data-action="builder-remove" data-index="${i}" aria-label="Eliminar">${icon('trash')}</button></div></div><div class="form-grid three" style="margin-top:12px"><div class="field"><label>Series</label><input type="number" min="1" max="30" name="sets-${i}" value="${x.sets??''}" placeholder="Manual" /></div><div class="field"><label>Repeticiones</label><input type="number" min="1" max="500" name="reps-${i}" value="${x.reps??''}" placeholder="Manual" /></div><div class="field"><label>Duración (s)</label><input type="number" min="1" max="7200" name="duration-${i}" value="${x.duration??''}" placeholder="Manual" /></div><div class="field"><label>Descanso (s)</label><input type="number" min="0" max="3600" name="rest-${i}" value="${x.rest??60}" /></div><div class="field"><label>Carga (kg, opcional)</label><input type="number" min="0" max="500" step="0.25" name="weight-${i}" value="${x.weight??''}" placeholder="Sin carga" /></div><div class="field" style="grid-column:span 2"><label>Notas de este movimiento</label><input name="notes-${i}" value="${esc(x.notes||'')}" maxlength="180" placeholder="Opcional" /></div></div></div>`}).join('')}</div>`:`<div class="empty"><h3>${esc(t('noExercisesAdded'))}</h3><p>Busca un movimiento y añádelo a esta plantilla.</p></div>`}
      <div class="toolbar" style="margin-top:14px"><select id="builder-add-select" aria-label="Seleccionar ejercicio"><option value="">Selecciona un movimiento…</option>${getExercises().map(e=>`<option value="${esc(e.id)}">${esc(e.name)}</option>`).join('')}</select><button type="button" class="button secondary" data-action="builder-add">${icon('plus')}${esc(t('addExercise'))}</button></div><div class="field" style="margin-top:14px"><label class="check-row"><input type="checkbox" name="warmup" ${d.warmup?'checked':''}/> Incluir recordatorio de calentamiento</label><label class="check-row"><input type="checkbox" name="cooldown" ${d.cooldown?'checked':''}/> Incluir recordatorio de vuelta a la calma</label></div>
      <div class="form-actions"><button type="button" class="button ghost" data-action="close-modal">${esc(t('cancel'))}</button><button type="submit" class="button secondary" name="submitMode" value="save">${esc(t('save'))}</button><button type="submit" class="button primary" name="submitMode" value="start">${icon('play')}${esc(t('saveStart'))}</button></div></form>`;
  } else if (modal.type==='exercise-form') {
    const d=modal.exercise || {} ; title=d.id?'Editar ejercicio':t('customExercise'); subtitle='Añade un movimiento propio a tu biblioteca.';
    body=`<form data-form="exercise"><div class="field"><label>Nombre</label><input name="name" required maxlength="70" value="${esc(d.name||'')}" /></div><div class="form-grid" style="margin-top:12px"><div class="field"><label>Categoría</label><select name="category">${CATEGORIES.map(([id,label])=>`<option value="${id}" ${d.category===id?'selected':''}>${esc(label)}</option>`).join('')}</select></div><div class="field"><label>Dificultad</label><select name="difficulty"><option value="beginner">Inicial</option><option value="intermediate" ${d.difficulty==='intermediate'?'selected':''}>Intermedio</option><option value="advanced" ${d.difficulty==='advanced'?'selected':''}>Avanzado</option></select></div></div><div class="field" style="margin-top:12px"><label>Material (separado por comas)</label><input name="equipment" value="${esc((d.equipment||['bodyweight']).map(equipmentName).join(', '))}" placeholder="Sin material, Mancuernas" /></div><div class="field" style="margin-top:12px"><label>Posición inicial</label><textarea name="start">${esc(d.start||'')}</textarea></div><div class="field" style="margin-top:12px"><label>Instrucciones (una por línea)</label><textarea name="steps">${esc((d.steps||[]).join('\n'))}</textarea></div><div class="field" style="margin-top:12px"><label>Respiración</label><input name="breathing" value="${esc(d.breathing||'')}" /></div><div class="field" style="margin-top:12px"><label>Seguridad</label><textarea name="safety">${esc(d.safety||'')}</textarea></div><div class="form-actions"><button type="button" class="button ghost" data-action="close-modal">${esc(t('cancel'))}</button><button type="submit" class="button primary">${esc(t('save'))}</button></div></form>`;
  } else if (modal.type==='schedule') {
    title='Añadir al calendario'; subtitle='Planifica con flexibilidad; puedes cambiarlo o eliminarlo cuando quieras.';
    body=`<form data-form="schedule"><div class="form-grid"><div class="field"><label>Fecha</label><input type="date" name="date" required value="${esc(selectedDate)}" /></div><div class="field"><label>Hora (opcional)</label><input type="time" name="time" /></div></div><div class="field" style="margin-top:13px"><label>Tipo</label><select name="kind" id="schedule-kind"><option value="workout">Entrenamiento</option><option value="rest">Día de descanso</option></select></div><div class="field" style="margin-top:13px" id="schedule-workout-field"><label>Plantilla</label><select name="workoutId">${state.workouts.map(w=>`<option value="${esc(w.id)}">${esc(w.name)}</option>`).join('')}</select></div><div class="field" style="margin-top:13px"><label>Nombre o nota (opcional)</label><input name="title" maxlength="70" placeholder="Ej. Sesión corta, paseo…" /></div><div class="field" id="schedule-reminder-field" style="margin-top:13px"><label class="check-row"><input type="checkbox" name="remind" checked /> Recibir una notificación a la hora programada</label><p class="small-text">Necesitas permitir notificaciones en Ajustes. Añade una hora para activar el aviso.</p></div><div class="form-actions"><button type="button" class="button ghost" data-action="close-modal">${esc(t('cancel'))}</button><button type="submit" class="button primary">${esc(t('schedule'))}</button></div></form>`;
  } else if (modal.type==='timer') {
    title=t('timer'); subtitle='Temporizador local; el funcionamiento en segundo plano depende del navegador.';
    const remaining=timerRemaining();
    body=`<div class="timer-ring"><div><div class="timer-face" id="timer-face">${formatDuration(remaining*1000)}</div><div class="eyebrow" style="text-align:center">${state.timer.running?'EN MARCHA':'LISTO'}</div></div></div><form data-form="timer"><div class="field"><label>Duración inicial (segundos)</label><input name="duration" type="number" min="1" max="7200" value="${state.timer.duration}" /></div><div class="form-actions" style="justify-content:center"><button type="button" class="button secondary" data-action="timer-reset">Reiniciar</button><button type="button" class="button secondary" data-action="timer-toggle">${icon(state.timer.running?'pause':'play')}${state.timer.running?'Pausar':'Iniciar'}</button><button type="submit" class="button primary">Aplicar</button></div></form>`;
  } else if (modal.type==='summary') {
    const s=modal.session; title='Sesión guardada'; subtitle=s.status==='completed'?'Has terminado esta sesión.':'La sesión se ha guardado como finalizada antes de tiempo.';
    const totalSets=Object.values(s.completed||{}).reduce((a,b)=>a+b,0);
    body=`<div class=\"grid three\"><div class=\"metric-card\"><div class=\"metric-label\">Tiempo</div><div class=\"metric-value\">${esc(formatDuration(s.durationMs||0))}</div></div><div class=\"metric-card\"><div class=\"metric-label\">Series registradas</div><div class=\"metric-value\">${totalSets}</div></div><div class=\"metric-card\"><div class=\"metric-label\">Movimientos</div><div class=\"metric-value\">${s.workout.exercises.length}</div></div></div><div class=\"notice\" style=\"margin-top:15px\">Los datos del resumen proceden de las acciones que has registrado durante la sesión.</div><div class=\"form-actions\"><button class=\"button primary\" data-action=\"summary-close\">Ver progreso</button></div>`;
  } else if (modal.type==='camera') {
    title=t('camera'); subtitle=t('cameraPreview');
    body=`<div class="notice warning">${esc(t('cameraDisclaimer'))}</div><div class="camera-frame" style="margin-top:14px">${cameraStream?`<video id="camera-video" autoplay playsinline muted></video><div class="camera-overlay"></div><span class="camera-badge">Procesamiento local · sin grabación</span>`:`<div style="text-align:center;padding:25px;color:#b9d5d9"><div style="margin-bottom:10px">${icon('camera')}</div>Vista previa desactivada</div>`}</div><p class="camera-status" id="camera-status">${cameraStream?'La vista previa se procesa en este dispositivo.':'La cámara no se activa hasta que pulses el botón.'}</p><div class="form-actions"><button class="button ghost" data-action="close-modal">${esc(t('close'))}</button><button class="button primary" data-action="${cameraStream?'camera-stop':'camera-start'}">${icon('camera')}${esc(cameraStream?t('cameraStop'):t('cameraStart'))}</button></div>`;
  }
  return `<div class="modal-backdrop" data-action="backdrop-close"><section class="sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}" data-no-gesture><div class="sheet-handle"></div><div class="sheet-head"><div><h2>${esc(title)}</h2><p>${esc(subtitle)}</p></div><button class="sheet-close" data-action="close-modal" aria-label="${esc(t('close'))}">${icon('close')}</button></div>${body}</section></div>`;
}

let preSessionView = 'workouts';
function useWorkoutPreset(presetId) {
  const preset=WORKOUT_PRESETS.find(item=>item.id===presetId);
  if(!preset){toast('No se ha encontrado este preajuste.','error');return;}
  builderDraft={id:null,name:presetName(preset),structure:preset.structure,exercises:structuredClone(preset.exercises),notes:preset.notes,warmup:false,cooldown:false};
  openModal('builder',{presetTitle:presetName(preset)});
}
function openBuilder(id=null) {
  const existing=state.workouts.find(w=>w.id===id);
  builderDraft=existing?structuredClone(existing):{id:null,name:'',structure:'custom',exercises:[],notes:'',warmup:false,cooldown:false};
  openModal('builder');
}
function syncBuilderFromDOM() {
  const form=root.querySelector('[data-form="builder"]'); if(!form||!builderDraft)return;
  const fd=new FormData(form);
  builderDraft.name=String(fd.get('name')||'').trim();
  builderDraft.structure=String(fd.get('structure')||'custom');
  builderDraft.notes=String(fd.get('notes')||'').trim();
  builderDraft.warmup=fd.has('warmup'); builderDraft.cooldown=fd.has('cooldown');
  builderDraft.exercises=builderDraft.exercises.map((x,i)=>({...x,
    sets:asOptionalNumber(fd.get(`sets-${i}`)), reps:asOptionalNumber(fd.get(`reps-${i}`)),
    duration:asOptionalNumber(fd.get(`duration-${i}`)), rest:asOptionalNumber(fd.get(`rest-${i}`),0) ?? 60, weight:asOptionalNumber(fd.get(`weight-${i}`),0),
    notes:String(fd.get(`notes-${i}`)||'').trim()
  }));
}
function asOptionalNumber(value,min=1) { if(value===null||value===''||typeof value==='undefined')return null; const n=Number(value); return Number.isFinite(n)&&n>=min?n:null; }
function saveBuilder(startAfter=false) {
  syncBuilderFromDOM();
  if(!builderDraft.name) { toast('Escribe un nombre para el entrenamiento.','error'); root.querySelector('#builder-name')?.focus(); return; }
  if(!builderDraft.exercises.length) { toast('Añade al menos un movimiento.','error'); return; }
  const now=new Date().toISOString();
  const workout={...builderDraft,id:builderDraft.id||makeId('workout'),updatedAt:now,createdAt:builderDraft.createdAt||now};
  const index=state.workouts.findIndex(w=>w.id===workout.id);
  if(index>=0)state.workouts[index]=workout; else state.workouts.unshift(workout);
  builderDraft=null; modal=null; persist(); toast('Entrenamiento guardado.');
  if(startAfter) beginWorkout(workout);
  else {view='workouts';renderPage();}
}
function beginWorkout(workout) {
  try {
    if(state.activeSession) {
      toast('Ya tienes una sesión sin terminar. Vuelve a ella o finalízala antes de empezar otra.');
      view='session';renderPage();return;
    }
    preSessionView=view==='session'?preSessionView:view;
    state.activeSession=startSession(workout);
    if(state.preferences.animations!==false)pendingPageAnimation='enter-forward';
    view='session'; modal=null; persist(); renderPage();
  } catch(error) { toast(error.message,'error'); }
}
function updateSession(mutator, direction = 0) {
  if(!state.activeSession)return;
  state.activeSession=mutator(state.activeSession);
  if(direction&&state.preferences.animations!==false)pendingPageAnimation=direction<0?'enter-backward':'enter-forward';
  persist(); renderPage();
}
function finishCurrentSession() {
  if(!state.activeSession)return;
  const s=state.activeSession;
  const allDone=s.workout.exercises.every((item,index)=>{const target=Number(item.sets)||0;const count=s.completed[index]||0;return target?count>=target:count>0;});
  if(!confirm(allDone?'¿Guardar el resumen de esta sesión?':'La sesión aún tiene movimientos pendientes. ¿Quieres finalizarla ahora?'))return;
  const finished=finishSession(s,allDone?'completed':'ended-early');
  state.sessions.unshift(finished); state.activeSession=null; persist();
  if(state.preferences.animations!==false)pendingPageAnimation='enter-backward';
  modal={type:'summary',session:finished}; view='progress'; progressTab='history'; renderPage();
}
function timerRemaining() {
  const timer=state.timer;
  if(timer.running && timer.endAt) return Math.max(0,Math.ceil((timer.endAt-Date.now())/1000));
  return Math.max(0,Number(timer.remaining)||0);
}
function timerToggle() {
  const timer=state.timer;
  if(timer.running) { timer.remaining=timerRemaining(); timer.running=false; timer.endAt=null; }
  else { if(timer.remaining<=0)timer.remaining=timer.duration||60; timer.endAt=Date.now()+timer.remaining*1000; timer.running=true; }
  persist(); renderPage();
}
function timerReset() { state.timer.running=false;state.timer.endAt=null;state.timer.remaining=state.timer.duration||60;persist();renderPage(); }
function tick() {
  if(state.activeSession) {
    const clock=root.querySelector('#session-clock');
    if(clock)clock.textContent=formatDuration(elapsedMilliseconds(state.activeSession));
  }
  if(state.timer.running) {
    const remaining=timerRemaining();
    const face=root.querySelector('#timer-face'); if(face)face.textContent=formatDuration(remaining*1000);
    if(remaining<=0) {
      state.timer.running=false;state.timer.remaining=0;state.timer.endAt=null;persist();
      toast('Temporizador terminado.');
      if(state.preferences.sound) playTone();
      if(state.preferences.vibration && navigator.vibrate) navigator.vibrate([120,80,120]);
      if(modal?.type==='timer')renderPage();
    }
  }
}
function updateSessionTicker() {
  if(timerInterval)clearInterval(timerInterval);
  timerInterval=setInterval(tick,500);
  tick();
}
function playTone() {
  try {
    const Ctx=window.AudioContext||window.webkitAudioContext;
    if(!Ctx)return;
    const ctx=new Ctx(), osc=ctx.createOscillator(), gain=ctx.createGain();
    osc.frequency.value=740;gain.gain.value=.035;osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+.16);osc.onended=()=>ctx.close();
  } catch { /* audio is optional */ }
}
function stopCamera() {
  if(cameraStream)cameraStream.getTracks().forEach(track=>track.stop());
  cameraStream=null;cameraVideo=null;
}
async function startCamera() {
  if(!navigator.mediaDevices?.getUserMedia) { toast('Este navegador no permite acceder a la cámara.','error'); return; }
  try {
    cameraStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user'},audio:false});
    renderPage();
  } catch(error) {
    const status=root.querySelector('#camera-status');
    if(status)status.textContent=error.name==='NotAllowedError'?'Permiso denegado. Puedes habilitar la cámara desde los ajustes del navegador.':`No se pudo activar la cámara: ${error.message}`;
    else toast('No se pudo activar la cámara. Revisa los permisos del navegador.','error');
  }
}
function downloadJSON() {
  const payload={...state,exportedAt:new Date().toISOString(),application:'FORMA'};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`forma-backup-${dateKey(new Date())}.json`;a.click();URL.revokeObjectURL(url);toast('Copia de datos exportada.');
}
async function importJSON(file) {
  try {
    const text=await file.text();const parsed=JSON.parse(text);const validated=validateImport(parsed);
    if(!confirm('La importación reemplazará los datos locales actuales. ¿Continuar?'))return;
    const defaults=defaultState();
    state={...defaults,...validated,profile:{...defaults.profile,...validated.profile},preferences:{...defaults.preferences,...validated.preferences},timer:{...defaults.timer,...validated.timer},activeSession:null,onboardingComplete:true};
    await persist();view='home';modal=null;renderPage();toast('Datos importados correctamente.');
  } catch(error) { toast(`No se pudo importar: ${error.message}`,'error'); }
}
function toggleFavorite(id) {
  state.favorites=state.favorites.includes(id)?state.favorites.filter(x=>x!==id):[...state.favorites,id];persist();
  if(modal?.type==='exercise')renderPage();else if(view==='exercises')refreshExerciseResults();else renderPage();
}
function refreshExerciseResults() {
  const results=root.querySelector('.exercise-results'); if(results)results.innerHTML=exerciseGrid();
  const count=root.querySelector('.exercise-count'); if(count)count.textContent=filteredExercises().length;
}

async function showReminderNotification(item) {
  const workout=state.workouts.find(w=>w.id===item.workoutId);
  const name=item.title||workout?.name||'Tu entrenamiento';
  const options={body:'Es la hora que habías elegido. Abre FORMA para empezar cuando te venga bien.',icon:new URL('./public/icons/icon-192.png',location.href).href,badge:new URL('./public/icons/icon-192.png',location.href).href,tag:`forma-reminder-${item.id}`,renotify:false,data:{url:new URL('./',location.href).href}};
  try {
    if('serviceWorker'in navigator) {
      const registration=await navigator.serviceWorker.ready;
      await registration.showNotification(`FORMA · ${name}`,options);
    } else {
      const notification=new Notification(`FORMA · ${name}`,options);
      notification.onclick=()=>{window.focus();notification.close();};
    }
    return true;
  } catch(error) {
    console.warn('No se pudo mostrar el recordatorio',error);
    return false;
  }
}

async function refreshReminderSchedule() {
  if(reminderCheckInProgress){reminderRefreshQueued=true;return;}
  for(const timer of reminderTimers.values())clearTimeout(timer);
  reminderTimers.clear();
  if(!state.preferences.notifications||!('Notification'in window)||Notification.permission!=='granted')return;
  reminderCheckInProgress=true;
  let changed=false;
  try {
    const now=Date.now();
    for(const item of getDueReminders(state.schedule,now)) {
      if(!state.preferences.notifications||Notification.permission!=='granted')break;
      if(!state.schedule.includes(item))continue;
      const delivered=await showReminderNotification(item);
      if(delivered){item.notifiedAt=new Date().toISOString();changed=true;}
    }
    for(const item of getExpiredReminders(state.schedule,now)) {
      item.reminderExpiredAt=new Date().toISOString();changed=true;
    }
    for(const {item,timestamp} of getUpcomingReminders(state.schedule,now)) {
      const delay=Math.min(timestamp-now,REMINDER_RECHECK_MS);
      const timer=setTimeout(()=>{reminderTimers.delete(item.id);refreshReminderSchedule();},delay);
      reminderTimers.set(item.id,timer);
    }
    if(changed)await persist();
  } finally {
    reminderCheckInProgress=false;
    if(reminderRefreshQueued){reminderRefreshQueued=false;queueMicrotask(()=>refreshReminderSchedule());}
  }
}

async function requestNotificationPermission() {
  if(!('Notification'in window)){toast('Este navegador no permite notificaciones.','error');return false;}
  if(!window.isSecureContext){toast('Las notificaciones requieren HTTPS o localhost.','error');return false;}
  let permission=Notification.permission;
  try { if(permission==='default')permission=await Notification.requestPermission(); }
  catch(error){console.warn('Solicitud de permiso de notificaciones fallida',error);toast('No se pudo solicitar el permiso de notificaciones.','error');return false;}
  if(permission!=='granted'){toast('No se concedió el permiso de notificaciones. Puedes cambiarlo en los ajustes del navegador.','error');return false;}
  return true;
}

function saveSchedule(form) {
  const fd=new FormData(form);const kind=String(fd.get('kind')||'workout');
  if(kind==='workout'&&!state.workouts.length){toast('Crea una plantilla antes de programar un entrenamiento.','error');return;}
  const time=String(fd.get('time')||'');
  const remind=kind==='workout'&&fd.get('remind')==='on';
  if(remind&&!time){toast('Añade una hora o desmarca el recordatorio.','error');form.querySelector('[name="time"]')?.focus();return;}
  const item={id:makeId('plan'),date:String(fd.get('date')),time,kind,workoutId:kind==='workout'?String(fd.get('workoutId')||state.workouts[0]?.id||''):null,title:String(fd.get('title')||'').trim(),remind,notifiedAt:'',reminderExpiredAt:''};
  state.schedule.push(item);selectedDate=item.date;modal=null;persist();renderPage();refreshReminderSchedule();
  toast(remind?'Entrenamiento programado con recordatorio.':'Día añadido al calendario.');
}
function openSchedule() {
  openModal('schedule');
  if(!state.workouts.length) {
    const workoutField=root.querySelector('#schedule-workout-field');if(workoutField)workoutField.innerHTML='<div class="notice">Todavía no hay plantillas. Puedes marcar un día de descanso o crear un entrenamiento primero.</div>';
  }
}

root.addEventListener('pointerdown', event => {
  if(event.target.closest?.('.sheet-handle')) { sheetPointer={id:event.pointerId,y:event.clientY}; try{event.target.setPointerCapture(event.pointerId);}catch{} }
}, {passive:true});
root.addEventListener('pointerup', event => {
  if(!sheetPointer || sheetPointer.id!==event.pointerId) return;
  const delta=event.clientY-sheetPointer.y;sheetPointer=null;
  const sheet=root.querySelector('.sheet');if(!sheet)return;
  if(delta < -45) sheet.classList.add('expanded');
  else if(delta > 70) { if(sheet.classList.contains('expanded'))sheet.classList.remove('expanded');else closeModal(); }
}, {passive:true});
root.addEventListener('pointercancel',()=>{sheetPointer=null;},{passive:true});

root.addEventListener('click', async event => {
  const target=event.target;
  const nav=target.closest('[data-nav]');
  if(nav) { navigate(nav.dataset.nav); return; }
  const filter=target.closest('[data-filter]');
  if(filter) {
    if(filter.dataset.filter==='favorites')exerciseFilters.favorites=!exerciseFilters.favorites;
    else exerciseFilters[filter.dataset.filter]=filter.dataset.value;
    renderPage();return;
  }
  const progressButton=target.closest('[data-progress-tab]');
  if(progressButton){progressTab=progressButton.dataset.progressTab;renderPage();return;}
  const actionEl=target.closest('[data-action]');
  if(!actionEl)return;
  const action=actionEl.dataset.action;
  if(action==='backdrop-close') { if(target===actionEl)closeModal();return; }
  switch(action) {
    case 'onboarding-start': syncOnboardingFormToState(); onboardingStep=1; renderPage(); window.scrollTo({top:0,behavior:'auto'}); break;
    case 'onboarding-next': syncOnboardingFormToState(); onboardingStep=Math.min(2,onboardingStep+1); renderPage(); window.scrollTo({top:0,behavior:'auto'}); break;
    case 'onboarding-back': syncOnboardingFormToState(); onboardingStep=Math.max(0,onboardingStep-1); renderPage(); window.scrollTo({top:0,behavior:'auto'}); break;
    case 'onboarding-skip': syncOnboardingFormToState(); state.onboardingComplete=true; onboardingStep=0; await persist(); view='home'; state.lastViewed='home'; pendingPageAnimation=state.preferences.animations!==false?'enter-forward':''; renderPage(); toast('Puedes ajustar la configuración cuando quieras.'); break;
    case 'open-onboarding': onboardingStep=0; state.onboardingComplete=false; onboardingNotificationsRequested=state.preferences.notifications; await persist(); view='onboarding'; modal=null; renderPage(); break;
    case 'new-workout': openBuilder(); break;
    case 'use-preset': useWorkoutPreset(actionEl.dataset.id); break;
    case 'edit-workout': openBuilder(actionEl.dataset.id);break;
    case 'duplicate-workout': {const w=state.workouts.find(x=>x.id===actionEl.dataset.id);if(w){const clone=structuredClone(w);clone.id=null;clone.name=`${clone.name} · copia`;builderDraft=clone;openModal('builder');}break;}
    case 'delete-workout': if(confirm('¿Eliminar esta plantilla? El historial guardado no se borrará.')){state.workouts=state.workouts.filter(x=>x.id!==actionEl.dataset.id);state.schedule=state.schedule.filter(x=>x.workoutId!==actionEl.dataset.id);persist();renderPage();toast('Plantilla eliminada.');}break;
    case 'start-workout': {const w=state.workouts.find(x=>x.id===actionEl.dataset.id);if(w)beginWorkout(w);break;}
    case 'exercise-detail': openModal('exercise',{id:actionEl.dataset.id});break;
    case 'favorite': event.stopPropagation();toggleFavorite(actionEl.dataset.id);break;
    case 'hide-exercise': if(confirm('¿Ocultar este ejercicio de la biblioteca? Puedes volver a mostrarlo desde Ajustes.')){state.hiddenExercises.push(actionEl.dataset.id);modal=null;persist();renderPage();}break;
    case 'unhide-exercise': state.hiddenExercises=state.hiddenExercises.filter(x=>x!==actionEl.dataset.id);persist();renderPage();toast('Ejercicio visible de nuevo.');break;
    case 'delete-custom-exercise': if(confirm('¿Eliminar este ejercicio personalizado? Las sesiones guardadas conservarán su registro.')){state.customExercises=state.customExercises.filter(x=>x.id!==actionEl.dataset.id);state.favorites=state.favorites.filter(x=>x!==actionEl.dataset.id);modal=null;persist();renderPage();}break;
    case 'new-exercise': openModal('exercise-form',{exercise:null});break;
    case 'edit-exercise': {const e=state.customExercises.find(x=>x.id===actionEl.dataset.id);if(e)openModal('exercise-form',{exercise:structuredClone(e)});break;}
    case 'builder-add': {syncBuilderFromDOM();const id=root.querySelector('#builder-add-select')?.value;if(!id){toast('Selecciona un movimiento.','error');break;}builderDraft.exercises.push({exerciseId:id,sets:null,reps:null,duration:null,rest:60,notes:''});renderPage();break;}
    case 'builder-remove': syncBuilderFromDOM();builderDraft.exercises.splice(Number(actionEl.dataset.index),1);renderPage();break;
    case 'builder-up': syncBuilderFromDOM();{const i=Number(actionEl.dataset.index);if(i>0)[builderDraft.exercises[i-1],builderDraft.exercises[i]]=[builderDraft.exercises[i],builderDraft.exercises[i-1]];renderPage();}break;
    case 'builder-down': syncBuilderFromDOM();{const i=Number(actionEl.dataset.index);if(i<builderDraft.exercises.length-1)[builderDraft.exercises[i+1],builderDraft.exercises[i]]=[builderDraft.exercises[i],builderDraft.exercises[i+1]];renderPage();}break;
    case 'close-modal': closeModal();break;
    case 'return-session': preSessionView=view;view='session';renderPage();break;
    case 'leave-session': view=preSessionView==='session'?'workouts':preSessionView;renderPage();break;
    case 'session-pause': updateSession(s=>s.paused?resumeSession(s):pauseSession(s));break;
    case 'complete-set': updateSession(s=>completeSet(s));if(state.preferences.vibration&&navigator.vibrate)navigator.vibrate(35);break;
    case 'undo': updateSession(s=>undoLastAction(s));break;
    case 'session-next': updateSession(s=>moveExercise(s,1),1);break;
    case 'session-previous': updateSession(s=>moveExercise(s,-1),-1);break;
    case 'rest-from-exercise': {const item=state.activeSession?.workout.exercises[state.activeSession.currentIndex];if(item){const duration=Math.max(1,Number(item.rest)||60);state.timer={duration,remaining:duration,running:false,endAt:null};openModal('timer');timerToggle();}break;}
    case 'finish-session': finishCurrentSession();break;
    case 'open-timer': openModal('timer');break;
    case 'test-notification': if(state.preferences.notifications&&'Notification'in window&&Notification.permission==='granted'){showReminderNotification({id:'test',title:'Prueba de FORMA',workoutId:null}).then(ok=>toast(ok?'Notificación de prueba enviada.':'No se pudo mostrar la notificación.',ok?'':'error'));}else toast('Activa las notificaciones y concede permiso primero.','error');break;
    case 'install-app': if(installPrompt){installPrompt.prompt();installPrompt.userChoice.finally(()=>{installPrompt=null;renderPage();});}break;
    case 'timer-toggle': timerToggle();break;
    case 'timer-reset': timerReset();break;
    case 'open-calendar': progressTab='calendar';navigate('progress');break;
    case 'open-schedule': openSchedule();break;
    case 'select-date': selectedDate=actionEl.dataset.date;renderPage();break;
    case 'month-prev': calendarMonth=new Date(calendarMonth.getFullYear(),calendarMonth.getMonth()-1,1);renderPage();break;
    case 'month-next': calendarMonth=new Date(calendarMonth.getFullYear(),calendarMonth.getMonth()+1,1);renderPage();break;
    case 'start-plan': {const item=state.schedule.find(x=>x.id===actionEl.dataset.id);const workout=item?.workoutId?state.workouts.find(w=>w.id===item.workoutId):null;if(workout)beginWorkout(workout);else toast('No se encontró la plantilla de este evento.','error');break;}
    case 'delete-plan': if(confirm('¿Eliminar este elemento del calendario?')){state.schedule=state.schedule.filter(x=>x.id!==actionEl.dataset.id);persist();renderPage();refreshReminderSchedule();}break;
    case 'reschedule-plan': {const item=state.schedule.find(x=>x.id===actionEl.dataset.id);if(item){const next=prompt('Nueva fecha (AAAA-MM-DD)',item.date);if(next&&/^\d{4}-\d{2}-\d{2}$/.test(next)){item.date=next;item.notifiedAt='';item.reminderExpiredAt='';selectedDate=next;persist();renderPage();refreshReminderSchedule();toast('Fecha actualizada.');}}break;}
    case 'go-exercises': navigate('exercises');break;
    case 'go-workouts': navigate('workouts');break;
    case 'export': downloadJSON();break;
    case 'import': root.querySelector('#import-file')?.click();break;
    case 'clear-data': if(confirm('Esto eliminará las plantillas, sesiones, preferencias y agenda guardadas en este navegador. Esta acción no se puede deshacer. ¿Continuar?')){await store.clear();state=defaultState();onboardingStep=0;view='onboarding';persist();renderPage();toast('Datos locales borrados.');}break;
    case 'open-camera': openModal('camera');break;
    case 'camera-start': await startCamera();break;
    case 'camera-stop': stopCamera();renderPage();break;
    case 'summary-close': modal=null;navigate('progress');break;
    case 'zoom': actionEl.classList.toggle('zoomed');break;
  }
});

root.addEventListener('input', event => {
  if(event.target.id==='exercise-search') { exerciseFilters.query=event.target.value;refreshExerciseResults(); }
});
root.addEventListener('change', async event => {
  const el=event.target;
  if(el.id==='onboarding-language') {
    syncOnboardingFormToState();
    state.preferences.language=el.value==='en'?'en':'es';
    applyTheme(); renderPage();
    return;
  }
  if(el.id==='equipment-filter'){exerciseFilters.equipment=el.value;refreshExerciseResults();}
  if(el.id==='difficulty-filter'){exerciseFilters.difficulty=el.value;refreshExerciseResults();}
  if(el.id==='import-file'&&el.files?.[0]){await importJSON(el.files[0]);el.value='';}
  if(el.dataset.setting) {
    const key=el.dataset.setting;
    if(key==='notifications'&&el.checked) {
      const granted=await requestNotificationPermission();
      state.preferences.notifications=granted;
      el.checked=granted;
      persist();
      if(granted){toast('Notificaciones activadas.');refreshReminderSchedule();}else refreshReminderSchedule();
      renderPage();
      return;
    }
    state.preferences[key]=el.checked;persist();
    if(key==='notifications')refreshReminderSchedule();
    if(key==='animations')applyTheme();
    toast('Preferencia actualizada.');
  }
  if(el.id==='schedule-kind') {
    const box=root.querySelector('#schedule-workout-field');if(box)box.classList.toggle('hidden',el.value==='rest');
    const reminder=root.querySelector('#schedule-reminder-field');if(reminder)reminder.classList.toggle('hidden',el.value==='rest');
  }
});
root.addEventListener('submit', async event => {
  const form=event.target.closest('form[data-form]');if(!form)return;
  event.preventDefault();const type=form.dataset.form;const fd=new FormData(form);
  if(type==='onboarding') {
    syncOnboardingFormToState();
    if (onboardingStep < 2) { onboardingStep++; renderPage(); return; }
    state.onboardingComplete=true;
    state.preferences.notifications=onboardingNotificationsRequested ? await requestNotificationPermission() : false;
    await persist();
    onboardingStep=0; view='home'; state.lastViewed='home';
    pendingPageAnimation=state.preferences.animations!==false?'enter-forward':'';
    renderPage(); refreshReminderSchedule();
    toast(state.preferences.language==='en' ? 'Your FORMA space is ready.' : 'Tu espacio FORMA está listo.');
    return;
  }
  if(type==='builder') {const mode=event.submitter?.value==='start';saveBuilder(mode);}
  if(type==='settings') {
    state.profile={...state.profile,name:String(fd.get('name')||'').trim(),level:String(fd.get('level')||'beginner'),duration:Math.min(180,Math.max(5,Number(fd.get('duration'))||20)),units:String(fd.get('units')||'metric'),equipment:fd.getAll('equipment').map(String)};
    state.preferences={...state.preferences,theme:String(fd.get('theme')||state.preferences.theme),language:String(fd.get('language')||state.preferences.language),sensitivity:String(fd.get('sensitivity')||'normal')};
    persist();renderPage();toast('Ajustes guardados.');
  }
  if(type==='exercise') {
    const old=modal.exercise||{};const equipmentInput=String(fd.get('equipment')||'Sin material').split(',').map(x=>x.trim().toLowerCase());
    const equipment=equipmentInput.map(x=>EQUIPMENT.find(([id,label])=>id===x||label.toLowerCase()===x)?.[0]||'bodyweight').filter((x,i,a)=>a.indexOf(x)===i);
    const record={...old,id:old.id||makeId('custom-ex'),name:String(fd.get('name')).trim(),category:String(fd.get('category')),difficulty:String(fd.get('difficulty')),equipment,pattern:'Movimiento personalizado',muscles:'No especificado',start:String(fd.get('start')||''),steps:String(fd.get('steps')||'').split('\n').map(x=>x.trim()).filter(Boolean),breathing:String(fd.get('breathing')||''),mistakes:'',easier:'',harder:'',safety:String(fd.get('safety')||'')};
    if(!record.name){toast('Escribe un nombre.','error');return;}
    const idx=state.customExercises.findIndex(x=>x.id===record.id);if(idx>=0)state.customExercises[idx]=record;else state.customExercises.push(record);
    modal=null;persist();navigate('exercises');toast('Ejercicio guardado.');
  }
  if(type==='schedule')saveSchedule(form);
  if(type==='timer') {
    const duration=Math.min(7200,Math.max(1,Number(fd.get('duration'))||60));state.timer={duration,remaining:duration,running:false,endAt:null};persist();renderPage();toast('Temporizador actualizado.');
  }
});

root.addEventListener('keydown', event => {
  if((event.key==='Enter'||event.key===' ') && event.target.matches('.exercise-card')) {event.preventDefault();openModal('exercise',{id:event.target.dataset.id});}
  if(event.key==='Escape'&&modal)closeModal();
});

window.addEventListener('beforeunload', () => {
  if(cameraStream)cameraStream.getTracks().forEach(track=>track.stop());
});

gestureController = new GestureController(root, {
  navigate: navigateDelta,
  workout: direction => { if(!state.activeSession)return;updateSession(s=>moveExercise(s,direction==='next'?1:-1),direction==='next'?1:-1); },
  instructions: direction => { if(direction==='open'){const item=state.activeSession?.workout.exercises[state.activeSession.currentIndex];if(item)openModal('exercise',{id:item.exerciseId});}else if(modal?.type==='exercise')closeModal(); },
  zoom: element => element.classList.toggle('zoomed')
}, () => state.preferences);

document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshReminderSchedule();});
window.addEventListener('focus',()=>refreshReminderSchedule());
window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); installPrompt=event; if(!modal)renderPage(); });
window.addEventListener('appinstalled',()=>{installPrompt=null;toast('FORMA instalada.');renderPage();});


async function init() {
  const savedState=await store.load(null);
  const firstRun=!savedState;
  const hasOnboardingFlag=Boolean(savedState) && typeof savedState.onboardingComplete === 'boolean';
  state=savedState || defaultState();
  // Keep imported or older state bounded and compatible. Existing installations skip onboarding once.
  const defaults=defaultState();
  state={...defaults,...state,profile:{...defaults.profile,...state.profile},preferences:{...defaults.preferences,...state.preferences},timer:{...defaults.timer,...state.timer}};
  if(firstRun) state.onboardingComplete=false;
  else if(!hasOnboardingFlag) state.onboardingComplete=true;
  if(migrateLegacyFluffoNames(state))await store.save(state);
  if(state.activeSession) { state.activeSession.elapsedMs=elapsedMilliseconds(state.activeSession); state.activeSession.runningSince=null; state.activeSession.paused=true; } // Resume is always explicit after reload.
  view=state.onboardingComplete?'home':'onboarding';
  applyTheme();pendingPageAnimation=state.preferences.animations!==false?'enter-forward':'';renderPage();
  if('serviceWorker'in navigator && (location.protocol==='https:'||location.hostname==='localhost')) {
    navigator.serviceWorker.register(new URL('../sw.js',import.meta.url)).catch(error=>console.warn('Service worker no disponible',error));
  }
  refreshReminderSchedule();
  const mq=matchMedia('(prefers-color-scheme: light)');mq.addEventListener?.('change',()=>{if(state.preferences.theme==='system')applyTheme();});
}

init().catch(error=>{console.error(error);root.innerHTML=`<div class="boot" role="alert"><div class="brand-mark"><img src="./public/icons/dumbbell-mark.svg" alt="" /></div><strong>No se pudo iniciar FORMA</strong><span>${esc(error.message)}</span><button class="button secondary" onclick="location.reload()">Reintentar</button></div>`;});
