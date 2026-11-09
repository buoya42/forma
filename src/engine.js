export function makeId(prefix = 'id') {
  const random = globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${random}`;
}

export function elapsedMilliseconds(session, now = Date.now()) {
  const base = Math.max(0, Number(session?.elapsedMs) || 0);
  if (!session || session.paused || !session.runningSince) return base;
  return base + Math.max(0, now - session.runningSince);
}

export function startSession(workout, now = Date.now()) {
  if (!workout || !Array.isArray(workout.exercises) || workout.exercises.length === 0) throw new Error('Añade al menos un ejercicio antes de iniciar.');
  return {
    id: makeId('session'), workoutId: workout.id, workoutName: workout.name,
    workout: structuredClone(workout), currentIndex: 0, elapsedMs: 0,
    runningSince: now, paused: false, startedAt: new Date(now).toISOString(),
    completed: {}, history: [], setLog: [], currentRound: 1, rounds: Math.min(20,Math.max(1,Math.floor(Number(workout.rounds)||1))), phase: workout.warmup?'warmup':'workout', status: 'in-progress'
  };
}

export function pauseSession(session, now = Date.now()) {
  if (!session || session.paused) return session;
  return { ...session, elapsedMs: elapsedMilliseconds(session, now), runningSince: null, paused: true };
}
export function resumeSession(session, now = Date.now()) {
  if (!session || !session.paused) return session;
  return { ...session, runningSince: now, paused: false };
}
export function moveExercise(session, delta) {
  if (!session) return session;
  const max = Math.max(0, session.workout.exercises.length - 1);
  return { ...session, currentIndex: Math.min(max, Math.max(0, session.currentIndex + delta)) };
}
export function completeSet(session, now = Date.now(), reps = null, source = 'manual') {
  if (!session) return session;
  const index = session.currentIndex;
  const current = session.completed[index] || 0;
  const validReps=Number.isFinite(Number(reps))&&Number(reps)>0?Math.min(1000,Math.round(Number(reps))):null;
  const nextCompleted={...session.completed,[index]:current+1};
  let nextIndex=index,nextRound=session.currentRound||1;
  if(session.workout.structure==='circuit'){
    const item=session.workout.exercises[index];
    const setsPerRound=Math.max(1,Math.min(30,Math.floor(Number(item?.sets)||1)));
    const rounds=Math.max(1,Math.min(20,Math.floor(Number(session.rounds||session.workout.rounds)||1)));
    if((current+1)%setsPerRound===0){
      if(index<session.workout.exercises.length-1)nextIndex=index+1;
      else if(nextRound<rounds){nextIndex=0;nextRound+=1;}
    }
  }
  return {
    ...session,
    currentIndex:nextIndex,currentRound:nextRound,
    completed: nextCompleted,
    history: [...(session.history || []), { type:'set', index, previous:current, previousIndex:index, previousRound:session.currentRound||1, reps:validReps, source:validReps?source:null, at:now }],
    setLog: [...(session.setLog || []), { index, set:current+1, reps:validReps, source:validReps?source:null, at:now }]
  };
}
export function undoLastAction(session) {
  if (!session || !session.history?.length) return session;
  const history = [...session.history];
  const last = history.pop();
  const completed = { ...session.completed };
  if (last.type === 'set') {
    if (last.previous > 0) completed[last.index] = last.previous;
    else delete completed[last.index];
  }
  const setLog=[...(session.setLog||[])];
  if(last.type==='set'&&setLog.length)setLog.pop();
  return { ...session, completed, history, setLog, currentIndex:last.previousIndex??last.index??session.currentIndex, currentRound:last.previousRound??session.currentRound??1 };
}
export function finishSession(session, status = 'completed', now = Date.now()) {
  if (!session) throw new Error('No hay ninguna sesión activa.');
  const durationMs = elapsedMilliseconds(session, now);
  return {
    ...session, status, durationMs, completedAt: new Date(now).toISOString(),
    elapsedMs: durationMs, runningSince: null, paused: true
  };
}
export function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.floor((Number(ms) || 0) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return hours ? `${hours}:${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}` : `${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`;
}
export function formatDate(iso, locale = 'es-ES', options = {day:'numeric',month:'short',year:'numeric'}) {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(locale, options).format(date);
}
