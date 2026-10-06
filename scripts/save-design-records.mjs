import assert from 'node:assert/strict';
const base=process.env.DIARY_WRITE_URL||'http://127.0.0.1:5178';
async function read(){const r=await fetch(base+'/api/diary');assert.equal(r.status,200);return r.json()}
async function write(p){const r=await fetch(base+'/api/diary',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(p)});const d=await r.json();assert.ok(r.ok,JSON.stringify(d));return d}
let data=await read();const task=data.tasks.find(t=>['맵 구조 설계','전체적인 저택의 구조 설계'].includes(t.title)&&!t.deletedAt);assert.ok(task,'맵 구조 설계 할 일이 없습니다');
const stages=[['초기 평면 도면 작성',['initial-1.png','initial-2.png','initial-3.png','initial-4.png']],['중간 입체 디자인 제작',['middle-b1.png','middle-1.png','middle-2.png','middle-3.png','middle-exterior.png']],['현재 전체 층 도면 수정',['current.svg']]];
for(let i=0;i<stages.length;i++){const [title,files]=stages[i];await write({action:'createDesignRecord',title,taskId:task.id,startAt:'2026-09-29T09:00:00+09:00',schedule:'평일 09:00~18:00 작업 · 주말 제외 · 세 단계의 전체 제작 기간',assets:files.map(f=>'/design/'+f).join(','),blockedReason:i===2?'디자인과 전체 구조가 생각한 대로 한 번에 완성되지 않아 수정 중':'',requestKey:'user-design-stage-'+(i+1)})}
data=await read();const records=data.executions.filter(e=>e.requestKey.startsWith('user-design-stage-'));assert.equal(records.length,3);assert.ok(records.every(e=>e.ongoing===1&&e.actualKnown===0&&e.actualMinutes===0));
console.log('저장 확인: 실제 작업 3건, 자료 연결, 진행 중, 단계별 시간 미상');
