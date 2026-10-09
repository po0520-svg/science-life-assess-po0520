const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
class Sheet {
  constructor(header){this.rows=[header];this.failAppend=false;}
  getLastRow(){return this.rows.length;}
  getRange(row,col,count,width){return {getValues:()=>this.rows.slice(row-1,row-1+count).map(r=>r.slice(col-1,col-1+width)),setValues:values=>{for(let i=0;i<values.length;i++)this.rows[row-1+i]=values[i];}};}
  appendRow(row){if(this.failAppend){this.failAppend=false;throw Error('模擬寫入中断');}this.rows.push(row);}
}
const events=new Sheet(Array(9).fill('header')),totals=new Sheet(Array(12).fill('header'));
const ctx={console,PropertiesService:{getScriptProperties:()=>({getProperty:()=> 'test-sheet'})},SpreadsheetApp:{openById:()=>({getSheetByName:name=>name==='回應紀錄'?events:totals}),flush:()=>{}},Utilities:{DigestAlgorithm:{SHA_256:'sha256'},computeDigest:(_,value)=>[...crypto.createHash('sha256').update(value).digest()]}};
vm.createContext(ctx);vm.runInContext(fs.readFileSync('gas/AnswerKeys.gs','utf8')+fs.readFileSync('gas/Code.gs','utf8'),ctx);
const identity={class:'系統測試',seat:'99',name:'測試學生'},session=crypto.randomUUID(),token=crypto.randomUUID();
function send(kind,detail,id=crypto.randomUUID()){ctx.payload={requestId:id,courseId:'life-scale',session,token,identity,kind,detail};vm.runInContext('collect(checkedPayload(JSON.stringify(payload)))',ctx);return id;}
const record=()=>JSON.parse(totals.rows[1][11]);
send('start',{});
const id=send('attempt',{questionId:'L2-2',answer:'40 倍'});send('attempt',{questionId:'L2-2',answer:'40 倍'},id);
assert.equal(record().attempts['L2-2'],1);
send('attempt',{questionId:'L2-2',answer:'400 倍'});assert.equal(totals.rows[1][4],2);
events.failAppend=true;const retry=crypto.randomUUID();assert.throws(()=>send('attempt',{questionId:'L2-3',answer:'錯誤'},retry));send('attempt',{questionId:'L2-3',answer:'錯誤'},retry);assert.equal(record().attempts['L2-3'],1);
const answers=vm.runInContext("Object.fromEntries(Array.from({length:10},(_,i)=>['F'+(i+1),ANSWER_KEYS['F'+(i+1)].answer]))",ctx);
send('formative',{answers});send('formative',{answers:Object.fromEntries(Object.keys(answers).map(k=>[k,'錯誤']))});assert.equal(record().formative,100);
const rescue=vm.runInContext("Array.from({length:6},(_,i)=>({questionId:'R'+(i+1),answer:ANSWER_KEYS['R'+(i+1)].answer}))",ctx);send('rescue',{answers:rescue});assert.equal(record().rescueBest,600);
const challenge=vm.runInContext("CHALLENGE_IDS.map(questionId=>({questionId,answer:ANSWER_KEYS[questionId].answer,durationMs:100,timeout:false}))",ctx);send('challenge',{answers:challenge,score:999999});assert.ok(record().challengeBest<100000);assert.ok(record().challengeBest>90000);
assert.throws(()=>send('challenge',{answers:challenge.slice(0,1)}));
ctx.payload={requestId:crypto.randomUUID(),courseId:'life-scale',session,token:crypto.randomUUID(),identity,kind:'start',detail:{}};assert.throws(()=>vm.runInContext('collect(payload)',ctx));
console.log('PASS：GAS 收件、重送去重、寫入中斷恢復、首次評量保留、遊戲重新計分、場次驗證。');
