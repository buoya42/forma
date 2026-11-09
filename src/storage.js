const DB_NAME = 'forma-local';
const STORE = 'app-state';
const KEY = 'root';
const MAX = { favorites:1000, hiddenExercises:1000, customExercises:500, workouts:250, sessions:5000, schedule:5000 };
const text = (value, max=500) => typeof value === 'string' ? value.slice(0,max) : '';
const optionalNumber = (value, min=0, max=100000) => {
  if (value === null || value === '' || typeof value === 'undefined') return null;
  const n=Number(value); return Number.isFinite(n) ? Math.min(max,Math.max(min,n)) : null;
};
const stringArray = (value, max=100, limit=180) => Array.isArray(value) ? value.slice(0,max).filter(x=>typeof x==='string').map(x=>x.slice(0,limit)) : [];

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in globalThis)) return reject(new Error('IndexedDB no está disponible'));
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('No se pudo abrir IndexedDB'));
  });
}

export class LocalStore {
  constructor() { this.dbPromise = null; this.mode = 'indexeddb'; }
  async db() { if (!this.dbPromise) this.dbPromise = openDatabase(); return this.dbPromise; }
  async load(fallback) {
    try {
      const db = await this.db();
      const value = await new Promise((resolve, reject) => {
        const request = db.transaction(STORE, 'readonly').objectStore(STORE).get(KEY);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      if (value) return value;
    } catch (error) {
      this.mode = 'localstorage';
      try {
        const raw = localStorage.getItem('forma-state-v1');
        if (raw) return JSON.parse(raw);
      } catch (fallbackError) { console.warn('No se pudo recuperar el almacenamiento local', fallbackError); }
      console.warn('IndexedDB no disponible; se usará el almacenamiento alternativo', error);
    }
    return fallback;
  }
  async save(value) {
    try {
      const db = await this.db();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).put(value, KEY);
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error || new Error('Guardado cancelado'));
      });
      this.mode = 'indexeddb';
      return true;
    } catch (error) {
      this.mode = 'localstorage';
      try { localStorage.setItem('forma-state-v1', JSON.stringify(value)); return true; }
      catch (fallbackError) { throw new Error(`No se pudieron guardar los datos localmente: ${fallbackError.message}`); }
    }
  }
  async clear() {
    try {
      const db = await this.db();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).delete(KEY);
        tx.oncomplete = resolve; tx.onerror = () => reject(tx.error);
      });
    } catch { /* localStorage may be the active fallback */ }
    try { localStorage.removeItem('forma-state-v1'); } catch { /* ignore */ }
  }
  async estimate() {
    try { if (navigator.storage?.estimate) return await navigator.storage.estimate(); } catch { /* ignore */ }
    return null;
  }
}

function sanitizeExercise(exercise) {
  if (!exercise || typeof exercise !== 'object' || Array.isArray(exercise)) return null;
  const id=text(exercise.id,90), name=text(exercise.name,70).trim();
  if (!id || !name) return null;
  return {
    id, name, category:text(exercise.category,30)||'full-body', difficulty:['beginner','intermediate','advanced'].includes(exercise.difficulty)?exercise.difficulty:'beginner',
    equipment:stringArray(exercise.equipment,8,30), pattern:text(exercise.pattern,100), muscles:text(exercise.muscles,200),
    start:text(exercise.start,600), steps:stringArray(exercise.steps,30,300), breathing:text(exercise.breathing,300),
    mistakes:text(exercise.mistakes,300), easier:text(exercise.easier,300), harder:text(exercise.harder,300), safety:text(exercise.safety,500)
  };
}
function sanitizeWorkout(workout) {
  if (!workout || typeof workout !== 'object' || Array.isArray(workout)) return null;
  const id=text(workout.id,90), name=text(workout.name,70).trim();
  if (!id || !name || !Array.isArray(workout.exercises)) return null;
  const exercises=workout.exercises.slice(0,100).filter(x=>x&&typeof x.exerciseId==='string').map(x=>({
    exerciseId:text(x.exerciseId,90), sets:optionalNumber(x.sets,1,30), reps:optionalNumber(x.reps,1,500), duration:optionalNumber(x.duration,1,7200),
    rest:optionalNumber(x.rest,0,3600) ?? 60, weight:optionalNumber(x.weight,0,500), notes:text(x.notes,180)
  }));
  if (!exercises.length) return null;
  return {id,name,structure:['reps','time','circuit','custom'].includes(workout.structure)?workout.structure:'custom',rounds:Math.min(20,Math.max(1,Math.floor(Number(workout.rounds)||1))),exercises,notes:text(workout.notes,500),warmup:Boolean(workout.warmup),cooldown:Boolean(workout.cooldown),createdAt:text(workout.createdAt,40),updatedAt:text(workout.updatedAt,40)};
}

export function validateImport(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('El archivo no contiene un objeto de datos válido.');
  if (input.version !== 1) throw new Error('Versión de datos no compatible.');
  for (const key of Object.keys(MAX)) {
    if (!Array.isArray(input[key])) throw new Error(`El campo ${key} no es válido.`);
    if (input[key].length > MAX[key]) throw new Error('El archivo supera los límites admitidos.');
  }
  const profile=input.profile&&typeof input.profile==='object'?input.profile:{};
  const preferences=input.preferences&&typeof input.preferences==='object'?input.preferences:{};
  const workouts=input.workouts.map(sanitizeWorkout).filter(Boolean);
  const customExercises=input.customExercises.map(sanitizeExercise).filter(Boolean);
  const sessions=input.sessions.slice(0,MAX.sessions).filter(s=>s&&typeof s==='object'&&!Array.isArray(s)).map(s=>({
    id:text(s.id,90),workoutId:text(s.workoutId,90),workoutName:text(s.workoutName,70),workout:sanitizeWorkout(s.workout),
    currentIndex:0,completed:s.completed&&typeof s.completed==='object'?Object.fromEntries(Object.entries(s.completed).slice(0,100).map(([k,v])=>[String(k).slice(0,4),Math.max(0,Math.min(1000,Number(v)||0))])):{},
    history:[],setLog:Array.isArray(s.setLog)?s.setLog.slice(0,1000).filter(x=>x&&typeof x==='object').map(x=>({index:Math.max(0,Math.min(99,Math.floor(Number(x.index)||0))),set:Math.max(1,Math.min(1000,Math.floor(Number(x.set)||1))),reps:Number.isFinite(Number(x.reps))&&Number(x.reps)>0?Math.min(1000,Math.floor(Number(x.reps))):null,source:['camera','manual'].includes(x.source)?x.source:null,at:text(x.at,40)})):[],status:['completed','ended-early'].includes(s.status)?s.status:'ended-early',durationMs:Math.max(0,Math.min(7*86400000,Number(s.durationMs)||0)),
    startedAt:text(s.startedAt,40),completedAt:text(s.completedAt,40)
  }));
  const schedule=input.schedule.slice(0,MAX.schedule).filter(x=>x&&typeof x==='object'&&/^\d{4}-\d{2}-\d{2}$/.test(x.date||'')).map(x=>({
    id:text(x.id,90)||`plan-${Date.now()}`,date:x.date,time:/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(x.time||'')?x.time:'',kind:x.kind==='rest'?'rest':'workout',
    workoutId:text(x.workoutId,90),title:text(x.title,70),remind:Boolean(x.remind),notifiedAt:text(x.notifiedAt,40),reminderExpiredAt:text(x.reminderExpiredAt,40)
  }));
  return {
    version:1,
    profile:{name:text(profile.name,40),level:['beginner','intermediate','advanced'].includes(profile.level)?profile.level:'beginner',equipment:stringArray(profile.equipment,10,30),duration:Math.min(180,Math.max(5,Number(profile.duration)||20)),units:profile.units==='imperial'?'imperial':'metric'},
    preferences:{theme:['dark','light','system','oled','ocean','forest','sunset','lavender'].includes(preferences.theme)?preferences.theme:'system',interfaceStyle:['auto','liquid-glass','material-expressive'].includes(preferences.interfaceStyle)?preferences.interfaceStyle:'auto',language:preferences.language==='en'?'en':'es',gestures:preferences.gestures!==false,workoutGestures:preferences.workoutGestures!==false,doubleTap:preferences.doubleTap!==false,sensitivity:['low','normal','high'].includes(preferences.sensitivity)?preferences.sensitivity:'normal',sound:Boolean(preferences.sound),vibration:Boolean(preferences.vibration),notifications:Boolean(preferences.notifications),animations:preferences.animations!==false},
    favorites:stringArray(input.favorites,MAX.favorites,90),hiddenExercises:stringArray(input.hiddenExercises,MAX.hiddenExercises,90),customExercises,workouts,sessions,schedule,
    activeSession:null,timer:{duration:60,remaining:60,running:false,endAt:null},lastViewed:'home'
  };
}
