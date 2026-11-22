(function(root){
 'use strict';
 const unique=items=>[...new Map(items.map(i=>[i.id,i])).values()];
 function progress(items,checked){const rows=unique(items),set=new Set(checked),done=rows.filter(i=>set.has(i.id)).length;return {done,total:rows.length,percent:rows.length?Math.round(done/rows.length*100):null};}
 function visible(items,chapter){return unique(items).filter(i=>i.chapter<=chapter&&(i.availableUntilChapter===undefined||chapter<=i.availableUntilChapter));}
 function validateModel(input,areas,types,trusted=[]){
  if(!input||!Number.isInteger(input.chapter)||input.chapter<1||input.chapter>99||!Array.isArray(input.custom)||input.custom.length>5000||!Array.isArray(input.checked)||!input.notes||typeof input.notes!=='object'||Array.isArray(input.notes))throw Error('Ongeldige verkenningsback-up');
  const seen=new Set();for(const x of input.custom){if(!x||typeof x.id!=='string'||!/^custom-[a-zA-Z0-9-]+$/.test(x.id)||seen.has(x.id)||typeof x.title!=='string'||!x.title.trim()||x.title.length>150||typeof x.detail!=='string'||x.detail.length>2000||!areas.some(a=>a.id===x.area)||!types.some(c=>c.id===x.category)||!Number.isInteger(x.chapter)||x.chapter<1||x.chapter>99||typeof x.source!=='string'||x.source.length>1000||(x.source&&!/^https?:\/\//i.test(x.source)))throw Error('Ongeldig onderdeel');seen.add(x.id)}
  for(const x of input.custom)if(x.sourceNote!==undefined&&(typeof x.sourceNote!=='string'||x.sourceNote.length>500))throw Error('Ongeldige bronnotitie');
  const notes={};for(const [k,v] of Object.entries(input.notes)){if(typeof v!=='string'||v.length>3000||k==='__proto__'||k==='constructor'||k==='prototype')throw Error('Ongeldige notitie');notes[k]=v}
  const allowed=new Set([...seen,...trusted.map(x=>x.id)]);
  if(input.checked.some(id=>!allowed.has(id)))throw Error('Onbekende ontdekking');
  return {chapter:input.chapter,area:areas.some(a=>a.id===input.area)?input.area:null,custom:input.custom.map(x=>({id:x.id,title:x.title,detail:x.detail,area:x.area,category:x.category,chapter:x.chapter,source:x.source,...(x.sourceNote?{sourceNote:x.sourceNote}:{}),type:'personal'})),checked:[...new Set(input.checked)],notes};
 }
 function migrateLegacy(input){
  if(!input||!Array.isArray(input.items)||!Array.isArray(input.checked))throw Error('Ongeldige oudere back-up');
  const id=s=>typeof s==='string'&&/^user-[a-zA-Z0-9-]+$/.test(s)?s.replace(/^user-/,'custom-'):s;
  return {chapter:input.chapter??1,area:input.region==='gellhorn'?'port':input.region,custom:input.items.map(x=>({...x,id:id(x.id),area:x.region==='gellhorn'?'port':x.region,category:x.category==='secrets'?'sights':x.category,source:/^https?:\/\//i.test(x.source)?x.source:'',...(!/^https?:\/\//i.test(x.source)&&x.source?{sourceNote:x.source}:{}),type:'personal'})),checked:input.checked.map(id),notes:{}};
 }
 const shouldAutoExplore=(introIds,checked)=>introIds.length>0&&introIds.every(id=>new Set(checked).has(id));
 const api={unique,progress,visible,validateModel,migrateLegacy,shouldAutoExplore,chapter:(items,n)=>unique(items).filter(i=>i.chapter===n),area:(items,id)=>unique(items).filter(i=>i.area===id),category:(items,id)=>unique(items).filter(i=>i.category===id)};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.ExplorerCore=api;
})(typeof window!=='undefined'?window:this);
