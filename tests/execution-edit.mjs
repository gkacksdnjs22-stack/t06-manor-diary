import assert from 'node:assert/strict';
const base='http://127.0.0.1:5178/api/diary';
async function post(p,status=200){const r=await fetch(base,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(p)});const d=await r.json();assert.equal(r.status,status,JSON.stringify(d));return d}
const data=await (await fetch(base)).json();const task=data.tasks.find(t=>!t.deletedAt);assert.ok(task);
const payload={taskId:task.id,startAt:'2026-10-02T10:00:00+09:00',endAt:'2026-10-02T10:30:00+09:00',blockedReason:'검증',requestKey:crypto.randomUUID()};
const record=await post({action:'createExecution',...payload},201);
await post({action:'updateExecution',...payload,id:record.id,endAt:'2026-10-02T10:45:00+09:00',blockedReason:'수정 검증'});
let d=await (await fetch(base)).json();assert.equal(d.executions.find(e=>e.id===record.id).actualMinutes,45);
await post({action:'updateExecution',...payload,id:record.id,endAt:'2026-10-02T09:00:00+09:00'},400);
await post({action:'deleteExecution',id:record.id});d=await (await fetch(base)).json();assert.ok(!d.executions.some(e=>e.id===record.id));assert.deepEqual(d.plans,data.plans);console.log('PASS: 작업 기록 수정, 시간 재계산, 잘못된 시각 거부, 삭제, 계획 보존');
