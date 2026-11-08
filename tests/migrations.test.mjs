import test from 'node:test';
import assert from 'node:assert/strict';
import { migrateLegacyFluffoNames } from '../src/migrations.js';

test('legacy Felix method labels migrate to Método Fluffo without changing other names', () => {
  const state={
    workouts:[{name:'Felix method'},{name:'Mi rutina'}],
    sessions:[{workoutName:'Felix Method',workout:{name:'Felix method'}},{workoutName:'Sesión libre'}],
    schedule:[{title:'Felix method'},{title:'Día de fuerza'}]
  };
  assert.equal(migrateLegacyFluffoNames(state),true);
  assert.deepEqual(state.workouts.map(item=>item.name),['Método Fluffo','Mi rutina']);
  assert.equal(state.sessions[0].workoutName,'Método Fluffo');
  assert.equal(state.sessions[0].workout.name,'Método Fluffo');
  assert.equal(state.sessions[1].workoutName,'Sesión libre');
  assert.equal(state.schedule[0].title,'Método Fluffo');
  assert.equal(state.schedule[1].title,'Día de fuerza');
  assert.equal(migrateLegacyFluffoNames(state),false);
});
