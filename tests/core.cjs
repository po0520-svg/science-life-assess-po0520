const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const context={window:{}};vm.createContext(context);vm.runInContext(fs.readFileSync('data.js','utf8'),context);
const d=context.window.CourseData;
assert.equal(d.pages.length,10);assert.equal(d.flash.length,13);assert.equal(d.challenge.length,20);
assert.equal(d.formative.length,10);assert.equal(d.rescue.length,6);
assert.equal(Object.values(d.lessons).flatMap(x=>x.questions).length,25);
vm.runInContext(fs.readFileSync('gas/AnswerKeys.gs','utf8')+fs.readFileSync('gas/Code.gs','utf8'),context);
for(const q of [...Object.values(d.lessons).flatMap(x=>x.questions),...d.formative,...d.rescue,...d.challenge]) {
  context.id=q.id;context.answer=q.answer;
  assert.equal(vm.runInContext('correct(id,answer)',context),true,q.id);
  context.answer='錯誤答案';assert.equal(vm.runInContext('correct(id,answer)',context),false,q.id);
}
assert.equal(vm.runInContext("equalAnswer(['a','b'],['b','a'],'order')",context),false);
assert.equal(vm.runInContext("equalAnswer(['a','b'],['b','a'],'multi')",context),true);
assert.equal(vm.runInContext("safe('=IMPORTXML()')",context),"'=IMPORTXML()");
console.log('PASS：10 頁、13 閃卡、25 學習題、10 評量題、6 救援題、20 挑戰題及 GAS 答案比對。');
