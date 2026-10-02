import {writeFile} from 'node:fs/promises';
const base=process.env.DIARY_SEED_URL||'http://127.0.0.1:5178';
async function post(p){const r=await fetch(base+'/api/diary',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(p)});const d=await r.json();if(!r.ok)throw Error(JSON.stringify(d));return d}
const existing=await (await fetch(base+'/api/diary')).json();if(existing.plans.some(p=>p.title==='지하·1·2·3층 구조와 디자인 완성')){console.log('User plan already exists; no duplicates created.');process.exit(0)}
const p=await post({action:'createPlan',title:'지하·1·2·3층 구조와 디자인 완성',startDate:'2026-09-29',endDate:'2026-10-11',priority:2,successCriteria:'내가 생각한 구조와 디자인으로 대저택 지하·1·2·3층을 완성한다.',estimatedMinutes:0,estimatedKnown:0});
const tasks=[['전체적인 저택의 구조 설계','설계,진행 중'],['지하층 구조와 디자인 완성','지하,초안'],['1층 구조와 디자인 완성','1층,초안'],['2층 구조와 디자인 완성','2층,초안'],['3층 구조와 디자인 완성','3층,초안'],['층별 이동 동선과 전체 디자인 확인','검수,초안']];
for(const [title,tags] of tasks)await post({action:'createTask',planId:p.id,title,dueDate:'2026-10-11',priority:2,tags,estimatedMinutes:0,estimatedKnown:0});
console.log('Saved user-stated plan and 6 task drafts. Unknown estimates preserved; no execution times or completions fabricated.');
