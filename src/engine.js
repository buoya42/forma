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
    completed: {}, history: [], status: 'in-progress'
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
export function completeSet(session, now = Date.now()) {
  if (!session) return session;
  const index = session.currentIndex;
  const current = session.completed[index] || 0;
  return {
    ...session,
    completed: { ...session.completed, [index]: current + 1 },
    history: [...(session.history || []), { type: 'set', index, previous: current, at: now }]
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
  return { ...session, completed, history };
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
