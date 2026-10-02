import {rawDb} from '@/db/raw';
import {seoulDate} from '@/lib/domain';
export const dynamic='force-dynamic';
const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'};
class InputError extends Error{constructor(message:string,public status=400){super(message)}}
const json=(d:any,status=200)=>new Response(JSON.stringify(d),{status,headers});
function text(v:any,label:string,max=2000,optional=false){if(typeof v!=='string'||(!optional&&!v.trim())||v.length>max)throw new InputError(`${label}을 확인해 주세요.`);return v.trim()}
function date(v:any,label:string){const s=text(v,label,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||Number.isNaN(Date.parse(s+'T00:00:00Z'))||new Date(s+'T00:00:00Z').toISOString().slice(0,10)!==s)throw new InputError(`${label}이 올바른 날짜가 아닙니다.`);return s}
function known(v:any){if(![0,1].includes(v))throw new InputError('예상 시간 입력 여부를 확인해 주세요.');return v}
function minutes(v:any){if(!Number.isInteger(v)||v<0||v>1000000)throw new InputError('예상 시간은 0 이상의 정수 분으로 입력해 주세요.');return v}
function priority(v:any){if(![1,2,3].includes(v))throw new InputError('우선순위를 확인해 주세요.');return v}
function version(v:any){if(!Number.isInteger(v)||v<1)throw new InputError('버전이 올바르지 않습니다. 새로고침 후 다시 시도해 주세요.');return v}
function camel(row:any){return Object.fromEntries(Object.entries(row).map(([k,v])=>[k.replace(/_([a-z])/g,(_,c)=>c.toUpperCase()),v]))}
export async function GET(){try{const db=rawDb(),tables=['plans','tasks','executions','reviews','plan_versions','completions'];const results=await db.batch(tables.map(t=>db.prepare(`SELECT * FROM ${t} ORDER BY created_at,id`)));return json(Object.fromEntries([...tables.map((t,i)=>[t==='plan_versions'?'planVersions':t,results[i].results.map(camel)]),['today',seoulDate()]]))}catch(e){console.error('diary_read_failed');return json({error:'저장된 자료를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'},503)}}
export async function POST(req:Request){
 try{
  const origin=req.headers.get('Origin');if(origin&&origin!==new URL(req.url).origin)throw new InputError('다른 사이트에서의 저장 요청은 허용하지 않습니다.',403);
  const body=await req.text();if(body.length>30000)throw new InputError('입력이 너무 깁니다.');let p:any;try{p=JSON.parse(body)}catch{throw new InputError('입력 형식을 확인해 주세요.')}
  const db=rawDb(),now=new Date().toISOString(),newId=()=>crypto.randomUUID();
  const find=async(table:string,id:any)=>{text(id,'ID',80);const row=await db.prepare(`SELECT * FROM ${table} WHERE id=?`).bind(id).first<any>();if(!row)throw new InputError('기록을 찾을 수 없습니다.',404);return row};
  if(p.action==='createPlan'||p.action==='updatePlan'){
   const title=text(p.title,'제목',200),start=date(p.startDate,'시작일'),end=date(p.endDate,'종료일'),pr=priority(p.priority),criteria=text(p.successCriteria,'성공 기준'),estimate=minutes(p.estimatedMinutes),isKnown=known(p.estimatedKnown??1);if(end<start)throw new InputError('종료일은 시작일 이후여야 합니다.');
   if(p.action==='createPlan'){
    const id=newId();let improvement='',source=null;if(p.sourceReviewId){const r=await find('reviews',p.sourceReviewId);improvement=r.improvement;source=r.id}
    const snapshot={id,title,startDate:start,endDate:end,priority:pr,successCriteria:criteria,estimatedMinutes:estimate,estimatedKnown:isKnown,improvement,sourceReviewId:source,version:1};
    await db.batch([db.prepare('INSERT INTO plans (id,title,start_date,end_date,priority,success_criteria,estimated_minutes,estimated_known,improvement,source_review_id,created_at,version) VALUES (?,?,?,?,?,?,?,?,?,?,?,1)').bind(id,title,start,end,pr,criteria,estimate,isKnown,improvement,source,now),db.prepare('INSERT INTO plan_versions (id,plan_id,version,snapshot,created_at) VALUES (?,?,1,?,?)').bind(newId(),id,JSON.stringify(snapshot),now)]);return json({id},201);
   }
   const old=await find('plans',p.id),v=version(p.version);if(old.version!==v)throw new InputError('다른 변경이 먼저 저장됐습니다. 새로고침 후 다시 수정해 주세요.',409);
   const snapshot={...camel(old),title,startDate:start,endDate:end,priority:pr,successCriteria:criteria,estimatedMinutes:estimate,estimatedKnown:isKnown,version:v+1};
   const result=await db.batch([db.prepare('INSERT INTO plan_versions (id,plan_id,version,snapshot,created_at) SELECT ?,id,version+1,?,? FROM plans WHERE id=? AND version=?').bind(newId(),JSON.stringify(snapshot),now,p.id,v),db.prepare('UPDATE plans SET title=?,start_date=?,end_date=?,priority=?,success_criteria=?,estimated_minutes=?,estimated_known=?,version=version+1 WHERE id=? AND version=?').bind(title,start,end,pr,criteria,estimate,isKnown,p.id,v)]);
   if(!result[1].meta.changes)throw new InputError('동시에 변경되었습니다. 다시 불러와 주세요.',409);return json({id:p.id});
  }
  if(p.action==='createTask'||p.action==='updateTask'){
   await find('plans',p.planId);const title=text(p.title,'할 일 제목',200),due=date(p.dueDate,'마감일'),pr=priority(p.priority),tags=text(p.tags??'','태그',500,true),estimate=minutes(p.estimatedMinutes),isKnown=known(p.estimatedKnown??1);
   if(p.action==='createTask'){const id=newId();await db.prepare('INSERT INTO tasks (id,plan_id,title,due_date,priority,tags,estimated_minutes,estimated_known,created_at) VALUES (?,?,?,?,?,?,?,?,?)').bind(id,p.planId,title,due,pr,tags,estimate,isKnown,now).run();return json({id},201)}
   const old=await find('tasks',p.id);if(old.deleted_at)throw new InputError('삭제한 할 일은 수정할 수 없습니다.',409);
   const result=await db.prepare('UPDATE tasks SET title=?,due_date=?,priority=?,tags=?,estimated_minutes=?,estimated_known=?,version=version+1 WHERE id=? AND plan_id=? AND version=? AND deleted_at IS NULL').bind(title,due,pr,tags,estimate,isKnown,p.id,p.planId,version(p.version)).run();if(!result.meta.changes)throw new InputError('동시에 변경되었습니다. 다시 불러와 주세요.',409);return json({id:p.id});
  }
  if(['completeTask','reopenTask','deleteTask'].includes(p.action)){
   const task=await find('tasks',p.id);if(task.deleted_at&&p.action!=='deleteTask')throw new InputError('삭제한 할 일입니다.',409);
   if(p.action==='deleteTask'){await db.prepare('UPDATE tasks SET deleted_at=?,version=version+1 WHERE id=? AND deleted_at IS NULL').bind(now,p.id).run();return json({id:p.id})}
   if(p.action==='reopenTask'){await db.prepare("UPDATE tasks SET status='todo',completion_cycle=completion_cycle+1,version=version+1 WHERE id=? AND status='done' AND version=? AND deleted_at IS NULL").bind(p.id,version(p.version)).run();return json({id:p.id})}
   const key=text(p.requestKey,'요청 키',100);const prior=await db.prepare('SELECT * FROM completions WHERE request_key=?').bind(key).first<any>();if(prior){if(prior.task_id!==p.id)throw new InputError('요청 키가 다른 작업에 사용됐습니다.',409);return json({id:p.id,duplicate:true})}
   if(task.status==='done')return json({id:p.id,duplicate:true});const v=version(p.version);
   const results=await db.batch([db.prepare("INSERT OR IGNORE INTO completions (id,task_id,cycle,request_key,created_at) SELECT ?,id,completion_cycle,?,? FROM tasks WHERE id=? AND version=? AND status='todo' AND deleted_at IS NULL").bind(newId(),key,now,p.id,v),db.prepare("UPDATE tasks SET status='done',version=version+1 WHERE id=? AND version=? AND status='todo' AND deleted_at IS NULL AND EXISTS (SELECT 1 FROM completions WHERE task_id=tasks.id AND cycle=tasks.completion_cycle)").bind(p.id,v)]);
   if(!results[1].meta.changes){const fresh=await find('tasks',p.id);if(fresh.status!=='done')throw new InputError('다른 변경이 먼저 저장됐습니다. 새로고침 후 다시 시도해 주세요.',409)}return json({id:p.id});
  }
  if(p.action==='createExecution'){
   const task=await find('tasks',p.taskId);if(task.deleted_at)throw new InputError('삭제한 할 일입니다.',409);const key=text(p.requestKey,'요청 키',100),blocked=text(p.blockedReason??'','막힌 이유',2000,true);
   for(const x of [p.startAt,p.endAt])if(typeof x!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00\+09:00$/.test(x)||Number.isNaN(Date.parse(x)))throw new InputError('서울 기준 시작·종료 시각을 확인해 주세요.');
   const start=new Date(p.startAt).toISOString(),end=new Date(p.endAt).toISOString(),actual=(Date.parse(end)-Date.parse(start))/60000;if(actual<0||actual>1000000)throw new InputError('종료 시각은 시작 시각 이후여야 합니다.');
   const old=await db.prepare('SELECT * FROM executions WHERE request_key=?').bind(key).first<any>();if(old){if(old.task_id!==p.taskId||old.start_at!==start||old.end_at!==end||old.blocked_reason!==blocked)throw new InputError('요청 키가 다른 기록에 사용됐습니다.',409);return json({id:old.id,duplicate:true})}
   const id=newId();await db.prepare('INSERT OR IGNORE INTO executions (id,task_id,start_at,end_at,actual_minutes,blocked_reason,request_key,created_at) VALUES (?,?,?,?,?,?,?,?)').bind(id,p.taskId,start,end,actual,blocked,key,now).run();const row=await db.prepare('SELECT id FROM executions WHERE request_key=?').bind(key).first<any>();return json({id:row.id},201);
  }
  if(p.action==='createReview'){
   await find('plans',p.planId);const start=date(p.startDate,'시작일'),end=date(p.endDate,'종료일'),improvement=text(p.improvement,'개선점');if(end<start)throw new InputError('종료일은 시작일 이후여야 합니다.');const id=newId();await db.prepare('INSERT INTO reviews (id,plan_id,start_date,end_date,improvement,created_at) VALUES (?,?,?,?,?,?)').bind(id,p.planId,start,end,improvement,now).run();return json({id},201);
  }
  throw new InputError('지원하지 않는 동작입니다.');
 }catch(e:any){if(e instanceof InputError)return json({error:e.message},e.status);console.error('diary_write_failed');return json({error:'저장하지 못했습니다. 입력은 유지됩니다. 잠시 후 다시 시도해 주세요.'},503)}
}
