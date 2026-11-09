import test from 'node:test';
import assert from 'node:assert/strict';
import { POSE_EXERCISES, calculateJointAngle, createRepCounter, analyzePose } from '../src/pose.js';
import { startSession, completeSet, undoLastAction } from '../src/engine.js';

function landmarksAt(exerciseId, angle, visible=true) {
  const points=Array.from({length:33},()=>({x:0,y:0,visibility:1,presence:1}));
  const [a,b,c]=POSE_EXERCISES[exerciseId].joints[0];
  const radians=angle*Math.PI/180;
  const quality=visible?1:0.1;
  points[a]={x:-1,y:0,visibility:quality,presence:quality};
  points[b]={x:0,y:0,visibility:quality,presence:quality};
  points[c]={x:-Math.cos(radians),y:Math.sin(radians),visibility:quality,presence:quality};
  return points;
}
function feed(tracker,id,angle,startTime) {
  let result;
  for(let i=0;i<7;i++)result=analyzePose(landmarksAt(id,angle),id,tracker,startTime+i*100);
  return result;
}

test('joint angle calculation handles right angles and invalid points',()=>{
  assert.equal(calculateJointAngle({x:-1,y:0},{x:0,y:0},{x:0,y:1}),90);
  assert.equal(calculateJointAngle({x:1,y:0,z:0},{x:0,y:0,z:0},{x:0,y:0,z:1}),90);
  assert.equal(calculateJointAngle({x:0,y:0},{x:0,y:0},{x:1,y:0}),null);
  assert.equal(calculateJointAngle(null,{x:0,y:0},{x:1,y:0}),null);
});

test('pose counter counts a complete squat cycle once and filters duplicate frames',()=>{
  const tracker=createRepCounter();
  feed(tracker,'squat',170,1000);
  feed(tracker,'squat',90,2000);
  const result=feed(tracker,'squat',170,3000);
  assert.equal(result.count,1);
  feed(tracker,'squat',170,4000);
  assert.equal(tracker.count,1);
});

test('pose counter supports upper-body movements and resets independently',()=>{
  for(const id of ['curl','hammer-curl','push-up','db-bench','row','shoulder-press','lateral-raise','triceps-extension','lunge']) {
    assert.ok(POSE_EXERCISES[id],id+' must be supported');
    const tracker=createRepCounter();
    assert.equal(analyzePose(landmarksAt(id,170),id,tracker,1000).supported,true);
    assert.equal(tracker.count,0);
  }
  assert.equal(createRepCounter().count,0);
});

test('pose counter ignores low-visibility landmarks and unsupported exercises',()=>{
  const tracker=createRepCounter();
  const hidden=analyzePose(landmarksAt('squat',170,false),'squat',tracker,1000);
  assert.equal(hidden.visible,false);
  assert.equal(hidden.count,0);
  assert.equal(analyzePose(landmarksAt('squat',170),'plank',tracker,1100).supported,false);
});

test('set logging stores camera-estimated repetitions and undo removes the same set detail',()=>{
  const workout={id:'w1',name:'Camera test',exercises:[{exerciseId:'squat'}]};
  let session=startSession(workout,1000);
  session=completeSet(session,2000,12,'camera');
  assert.equal(session.completed[0],1);
  assert.deepEqual(session.setLog,[{index:0,set:1,reps:12,source:'camera',at:2000}]);
  session=undoLastAction(session);
  assert.equal(session.completed[0],undefined);
  assert.equal(session.setLog.length,0);
});
