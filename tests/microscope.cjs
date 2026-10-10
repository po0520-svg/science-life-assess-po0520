const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const ctx={window:{}};vm.createContext(ctx);vm.runInContext(fs.readFileSync('data.js','utf8')+fs.readFileSync('microscope.js','utf8'),ctx);
const {CourseData,MicroscopeParts,microscopeFigure}=ctx.window;
assert.equal(Object.keys(MicroscopeParts).length,CourseData.flash.length);
for(const [name] of CourseData.flash){
  const p=MicroscopeParts[name];assert.ok(p,name);assert.equal(p.box.length,4);
  assert.ok(p.box[0]>=0&&p.box[1]>=0&&p.box[0]+p.box[2]<=1024&&p.box[1]+p.box[3]<=1602,name);
  assert.equal(microscopeFigure(name,false).includes('class="microscope-highlight"'),false);
  const visible=microscopeFigure(name,true);assert.equal((visible.match(/class="microscope-highlight"/g)||[]).length,2);assert.ok(visible.includes(name+'局部放大圖'));
}
console.log('PASS：13 張閃卡皆有對應部位、裁切範圍與翻牌前後的發亮及放大提示。');
