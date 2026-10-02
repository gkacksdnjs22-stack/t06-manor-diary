export type Plan={id:string;title:string;startDate:string;endDate:string;priority:number;successCriteria:string;estimatedMinutes:number;estimatedKnown:number;improvement:string;sourceReviewId:string|null;createdAt:string;version:number};
export type Task={id:string;planId:string;title:string;dueDate:string;priority:number;tags:string;estimatedMinutes:number;estimatedKnown:number;status:string;deletedAt:string|null;createdAt:string;version:number};
export type Execution={id:string;taskId:string;startAt:string;endAt:string;actualMinutes:number;blockedReason:string;requestKey:string;createdAt:string};
export type Review={id:string;planId:string;startDate:string;endDate:string;improvement:string;createdAt:string};
export type Data={plans:Plan[];tasks:Task[];executions:Execution[];reviews:Review[];planVersions:any[];completions:any[];today:string};
export function seoulDate(now=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);}
export function summarize(data:Data,planId:string,from='',to=''){
 const tasks=data.tasks.filter(t=>t.planId===planId&&!t.deletedAt&&(!from||t.dueDate>=from)&&(!to||t.dueDate<=to));
 const ids=new Set(tasks.map(t=>t.id)),executions=data.executions.filter(e=>ids.has(e.taskId));
 const estimated=tasks.reduce((n,t)=>n+t.estimatedMinutes,0),actual=executions.reduce((n,e)=>n+e.actualMinutes,0);
 return {unknownEstimates:tasks.filter(t=>!t.estimatedKnown).length,planned:tasks,completed:tasks.filter(t=>t.status==='done'),delayed:tasks.filter(t=>t.status!=='done'&&t.dueDate<data.today),blocked:tasks.filter(t=>executions.some(e=>e.taskId===t.id&&e.blockedReason.trim())),estimated,actual,difference:actual-estimated,executions};
}
