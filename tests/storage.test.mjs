import test from 'node:test';
import assert from 'node:assert/strict';
import { validateImport } from '../src/storage.js';

test('validateImport rejects unsupported versions and malformed arrays', () => {
  assert.throws(() => validateImport({version:2}), /no compatible/);
  assert.throws(() => validateImport({version:1,favorites:'bad'}), /favorites/);
});

test('validateImport drops resumable state and checks array limits', () => {
  const data={version:1,favorites:[],hiddenExercises:[],customExercises:[],workouts:[],sessions:[],schedule:[],activeSession:{id:'private'},timer:{running:true}};
  const safe=validateImport(data);
  assert.equal(safe.activeSession,null);
  assert.equal(safe.timer.running,false);
  assert.throws(()=>validateImport({...data,sessions:Array(5001).fill({})}), /límites/);
});

test('validateImport preserves the longer notes used by curated workout presets', () => {
  const notes='Método Fluffo — '.padEnd(240,'x');
  const data={
    version:1,favorites:[],hiddenExercises:[],customExercises:[],sessions:[],schedule:[],
    workouts:[{id:'felix-copy',name:'Método Fluffo',structure:'custom',exercises:[{exerciseId:'plank'}],notes}]
  };
  const safe=validateImport(data);
  assert.equal(safe.workouts[0].notes,notes);
});


test('validateImport preserves opted-in reminders and delivery markers', () => {
  const data={version:1,favorites:[],hiddenExercises:[],customExercises:[],workouts:[],sessions:[],schedule:[{id:'plan-1',date:'2026-11-09',time:'18:30',kind:'workout',workoutId:'w1',remind:true,notifiedAt:'',reminderExpiredAt:''}]};
  const safe=validateImport(data);
  assert.equal(safe.schedule[0].remind,true);
  assert.equal(safe.schedule[0].time,'18:30');
  assert.equal(safe.schedule[0].notifiedAt,'');
});


test('backup import preserves a manual interface style and safely defaults unknown styles', () => {
  const base={version:1,favorites:[],hiddenExercises:[],customExercises:[],workouts:[],sessions:[],schedule:[]};
  const liquid=validateImport({...base,preferences:{interfaceStyle:'liquid-glass'}});
  const material=validateImport({...base,preferences:{interfaceStyle:'material-expressive'}});
  const invalid=validateImport({...base,preferences:{interfaceStyle:'not-a-theme'}});
  assert.equal(liquid.preferences.interfaceStyle,'liquid-glass');
  assert.equal(material.preferences.interfaceStyle,'material-expressive');
  assert.equal(invalid.preferences.interfaceStyle,'auto');
});
