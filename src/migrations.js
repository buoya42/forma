/** One-time data compatibility migrations for previously saved local state. */
export function migrateLegacyFluffoNames(state) {
  const oldNames = new Set(['Felix method', 'Felix Method']);
  const rename = name => oldNames.has(name) ? 'Método Fluffo' : name;
  let changed = false;

  for (const workout of state.workouts || []) {
    const next = rename(workout.name);
    if (next !== workout.name) { workout.name = next; changed = true; }
  }
  for (const session of state.sessions || []) {
    const next = rename(session.workoutName);
    if (next !== session.workoutName) { session.workoutName = next; changed = true; }
    if (session.workout?.name) {
      const nested = rename(session.workout.name);
      if (nested !== session.workout.name) { session.workout.name = nested; changed = true; }
    }
  }
  for (const plan of state.schedule || []) {
    const next = rename(plan.title);
    if (next !== plan.title) { plan.title = next; changed = true; }
  }
  return changed;
}
