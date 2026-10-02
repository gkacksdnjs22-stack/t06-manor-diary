import assert from 'node:assert/strict';
import {summarize,seoulDate} from '../lib/domain.ts';
assert.equal(seoulDate(new Date('2026-10-01T15:00:00Z')),'2026-10-02');
const task=(id,patch={})=>({id,planId:'p',dueDate:'2026-10-01',status:'todo',estimatedMinutes:10,estimatedKnown:1,deletedAt:null,...patch});
const d={today:'2026-10-02',plans:[],tasks:[task('a',{status:'done'}),task('b'),task('c',{dueDate:'2026-10-02'}),task('d',{deletedAt:'x'}),task('e',{estimatedKnown:0,estimatedMinutes:0})],executions:[{id:'1',taskId:'a',actualMinutes:15,blockedReason:'障害'},{id:'2',taskId:'a',actualMinutes:5,blockedReason:'障害'},{id:'3',taskId:'b',actualMinutes:10,blockedReason:''},{id:'4',taskId:'d',actualMinutes:99,blockedReason:'削除'}],reviews:[],completions:[],planVersions:[]};
const s=summarize(d,'p');assert.equal(s.planned.length,4);assert.equal(s.completed.length,1);assert.equal(s.delayed.length,2);assert.equal(s.blocked.length,1);assert.equal(s.estimated,30);assert.equal(s.actual,30);assert.equal(s.difference,0);assert.equal(s.unknownEstimates,1);
const period=summarize(d,'p','2026-10-02','2026-10-02');assert.equal(period.planned.length,1);assert.equal(period.delayed.length,0);
const zero=summarize(d,'none');for(const k of ['estimated','actual','difference','unknownEstimates'])assert.equal(zero[k],0);
console.log('PASS: Seoul date boundary, four counts, deleted exclusion, distinct blockers, three time totals, unknown estimates, inclusive period, empty zero');
