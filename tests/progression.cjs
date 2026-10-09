const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const ctx={window:{},C:{freeNavigation:false},teacher:false,state:null};vm.createContext(ctx);
vm.runInContext(fs.readFileSync('data.js','utf8'),ctx);ctx.D=ctx.window.CourseData;
const source=fs.readFileSync('app.js','utf8');
vm.runInContext(source.slice(source.indexOf('function same('),source.indexOf('window.ScienceCore='))+source.slice(source.indexOf('function refreshCompleted('),source.indexOf('function renderMap(')),ctx);
const unlocked=i=>vm.runInContext(`isUnlocked(${i})`,ctx);
assert.equal(unlocked(0),true);assert.equal(unlocked(1),false);
ctx.state={identity:{class:'測試',seat:'99',name:'測試'},answers:{},flash:false,formative:null,rescueFirst:null,challengeFirst:null,completed:{home:true,life:true,challenge:true}};
assert.equal(unlocked(1),true);assert.equal(unlocked(2),false);assert.equal(unlocked(9),false);
for(const [page,lesson] of Object.entries(ctx.D.lessons)){
  const index=ctx.D.pages.findIndex(p=>p[0]===page);
  for(const q of lesson.questions)ctx.state.answers[q.id]=q.answer;
  if(page==='life'){assert.equal(unlocked(index+1),false);ctx.state.flash=true;}
  assert.equal(unlocked(index+1),true);
  const q=lesson.questions[0],saved=ctx.state.answers[q.id];ctx.state.answers[q.id]='錯誤答案';assert.equal(unlocked(index+1),false);ctx.state.answers[q.id]=saved;
}
assert.equal(unlocked(7),false);ctx.state.formative=0;assert.equal(unlocked(7),true);
assert.equal(unlocked(8),false);ctx.state.rescueFirst=0;assert.equal(unlocked(8),true);
assert.equal(unlocked(9),false);ctx.state.challengeFirst=0;assert.equal(unlocked(9),true);
delete ctx.state.answers['L2-1'];assert.equal(unlocked(9),false);
ctx.teacher=true;assert.equal(unlocked(9),true);ctx.teacher=false;ctx.state=null;assert.equal(unlocked(1),false);
vm.runInContext('refreshCompleted()',ctx);
console.log('PASS：逐關解鎖、閃卡要求、錯答與舊完成旗標不可跳關、零分評量與遊戲結束、教師解鎖及身分重設。');
