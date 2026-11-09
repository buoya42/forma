import test from 'node:test';
import assert from 'node:assert/strict';
import { startSession, pauseSession, resumeSession, elapsedMilliseconds, completeSet, undoLastAction, moveExercise, finishSession, formatDuration } from '../src/engine.js';

const workout = { id:'w1', name:'Prueba', exercises:[{exerciseId:'squat',sets:2,reps:8},{exerciseId:'plank',sets:null,duration:20}] };

test('startSession requires at least one exercise', () => {
  assert.throws(() => startSession({id:'empty',name:'Vacío',exercises:[]}), /Añade al menos un ejercicio/);
});

test('session timer accumulates elapsed time and pauses accurately', () => {
  const started = startSession(workout, 1000);
  assert.equal(elapsedMilliseconds(started, 6000), 5000);
  const paused = pauseSession(started, 6000);
  assert.equal(paused.paused, true);
  assert.equal(elapsedMilliseconds(paused, 9000), 5000);
  const resumed = resumeSession(paused, 9000);
  assert.equal(elapsedMilliseconds(resumed, 11000), 7000);
});

test('set completion and undo are explicit and reversible', () => {
  const started = startSession(workout, 1000);
  const once = completeSet(started, 2000);
  assert.equal(once.completed[0], 1);
  const twice = completeSet(once, 3000);
  assert.equal(twice.completed[0], 2);
  const undo = undoLastAction(twice);
  assert.equal(undo.completed[0], 1);
  assert.equal(undo.history.length, 1);
});

test('exercise navigation stays within workout bounds', () => {
  const started = startSession(workout, 1000);
  assert.equal(moveExercise(started,-1).currentIndex,0);
  assert.equal(moveExercise(started,1).currentIndex,1);
  assert.equal(moveExercise(moveExercise(started,1),1).currentIndex,1);
});

test('finishSession stores a stable duration and completion status', () => {
  const started = startSession(workout, 1000);
  const complete = completeSet(started, 2500);
  const finished = finishSession(complete,'completed',6000);
  assert.equal(finished.durationMs,5000);
  assert.equal(finished.status,'completed');
  assert.equal(finished.runningSince,null);
});

test('formatDuration is zero-padded and supports hours', () => {
  assert.equal(formatDuration(65000),'01:05');
  assert.equal(formatDuration(3661000),'1:01:01');
  assert.equal(formatDuration(-1),'00:00');
});
