import test from 'node:test';
import assert from 'node:assert/strict';
import { getDueReminders, getExpiredReminders, getUpcomingReminders, getReminderTimestamp, REMINDER_GRACE_MS } from '../src/reminders.js';

function localDateAndTime(timestamp) {
  const date=new Date(timestamp);
  const pad=value=>String(value).padStart(2,'0');
  return {date:`${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`,time:`${pad(date.getHours())}:${pad(date.getMinutes())}`};
}
function plan(timestamp, extra={}) { return {id:'p1',kind:'workout',remind:true,...localDateAndTime(timestamp),...extra}; }

test('reminders accept valid local dates and times only for opted-in workouts', () => {
  assert.equal(getReminderTimestamp(plan(Date.now()+60_000))!==null,true);
  assert.equal(getReminderTimestamp({...plan(Date.now()),kind:'rest'}),null);
  assert.equal(getReminderTimestamp({...plan(Date.now()),remind:false}),null);
  assert.equal(getReminderTimestamp({...plan(Date.now()),time:'25:99'}),null);
  assert.equal(getReminderTimestamp({id:'bad-date',kind:'workout',remind:true,date:'2026-02-31',time:'09:00'}),null);
});

test('due reminders are returned only within the delivery grace window and once', () => {
  const now=Date.now();
  const due=plan(now-5_000);
  const old=plan(now-REMINDER_GRACE_MS-1);
  const delivered=plan(now-2_000,{notifiedAt:new Date(now-1_000).toISOString()});
  assert.deepEqual(getDueReminders([due,old,delivered],now),[due]);
});

test('expired reminders are separated from upcoming reminders', () => {
  const now=Date.now();
  const old=plan(now-REMINDER_GRACE_MS-1);
  const future=plan(now+60_000,{id:'p2'});
  assert.deepEqual(getExpiredReminders([old,future],now),[old]);
  assert.deepEqual(getUpcomingReminders([old,future],now).map(x=>x.item.id),['p2']);
});
