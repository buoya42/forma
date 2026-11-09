import test from 'node:test';
import assert from 'node:assert/strict';
import { startSession, completeSet, undoLastAction, finishSession } from '../src/engine.js';
const workout={id:'circuit',name:'Circuit test',structure:'circuit',rounds:2,exercises:[{exerciseId:'squat',sets:2},{exerciseId:'push-up',sets:1}]};
test('circuit sessions auto-advance through exercises and rounds',()=>{
 let s=startSession(workout,1000);assert.equal(s.currentRound,1);
 s=completeSet(s,1100);assert.equal(s.currentIndex,0);
 s=completeSet(s,1200);assert.equal(s.currentIndex,1);
 s=completeSet(s,1300);assert.equal(s.currentIndex,0);assert.equal(s.currentRound,2);
 s=completeSet(s,1400);s=completeSet(s,1500);assert.equal(s.currentIndex,1);
 s=completeSet(s,1600);assert.equal(s.completed[0],4);assert.equal(s.completed[1],2);assert.equal(s.currentRound,2);
});
test('undo in a circuit restores the cursor to the set and round that were completed',()=>{
 let s=startSession(workout,1000);s=completeSet(s,1100);s=completeSet(s,1200);s=completeSet(s,1300);
 assert.equal(s.currentIndex,0);assert.equal(s.currentRound,2);s=undoLastAction(s);
 assert.equal(s.currentIndex,1);assert.equal(s.currentRound,1);assert.equal(s.completed[1],undefined);
});
test('warm-up is an opt-in phase and sets can store actual reps',()=>{
 const warmup=startSession({...workout,structure:'custom',warmup:true,rounds:1},1000);assert.equal(warmup.phase,'warmup');
 let session=startSession({...workout,structure:'custom',warmup:false,rounds:1},1000);
 session=completeSet(session,1200,14,'manual');assert.equal(session.setLog[0].reps,14);assert.equal(session.setLog[0].source,'manual');
 assert.ok(finishSession(session,'completed',2000).completedAt);
});
