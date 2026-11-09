import test from 'node:test';
import assert from 'node:assert/strict';
import { EXERCISES, WORKOUT_PRESETS } from '../src/data.js';

const exerciseIds = new Set(EXERCISES.map(exercise => exercise.id));

test('workout presets have unique identifiers and valid exercise references', () => {
  const ids = WORKOUT_PRESETS.map(preset => preset.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const preset of WORKOUT_PRESETS) {
    assert.ok(preset.name.trim());
    assert.ok(preset.exercises.length > 0);
    for (const item of preset.exercises) assert.ok(exerciseIds.has(item.exerciseId), `${preset.id} references ${item.exerciseId}`);
  }
});

test('Método Fluffo honours the original exercise list without prescribing targets', () => {
  const preset = WORKOUT_PRESETS.find(item => item.id === 'metodo-fluffo');
  assert.ok(preset);
  assert.equal(preset.name, 'Método Fluffo');
  assert.deepEqual(preset.exercises.map(item => item.exerciseId), [
    'curl', 'hammer-curl', 'push-up', 'db-bench', 'squat', 'plank', 'crunch', 'leg-raise'
  ]);
  for (const item of preset.exercises) {
    assert.equal(item.sets, null);
    assert.equal(item.reps, null);
    assert.equal(item.duration, null);
  }
  assert.match(preset.notes, /Fluffo/);
  assert.match(preset.notes, /3–5 minutos/);
});

test('preset catalogue includes distinct equipment and movement focuses', () => {
  assert.ok(WORKOUT_PRESETS.length >= 6);
  assert.ok(WORKOUT_PRESETS.some(preset => preset.id === 'dumbbell-upper'));
  assert.ok(WORKOUT_PRESETS.some(preset => preset.id === 'mobility-reset'));
  assert.ok(WORKOUT_PRESETS.some(preset => preset.id === 'core-stability'));
});
