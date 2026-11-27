const CACHE='leonida-v2.62.0';const ASSETS=['./','./index.html','./styles.css','./data.js','./app.js','./journal.js','./journal.css','./explorer-core.js','./explorer-data.js','./explorer.js','./explorer.css','./manifest.webmanifest','./assets/sunset.svg','./assets/favicon-skyline.png','./assets/icon.svg','./assets/icon-192.png','./assets/icon-512.png','./assets/apple-touch-icon.png'];
const scope=new URL(self.registration.scope);
const entryUrl=new URL('./index.html',scope).href;
self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  await cache.addAll(ASSETS.map(asset=>new Request(new URL(asset,scope),{cache:'reload'})));
  const version=CACHE.match(/v(\d+\.\d+)\.\d+$/)[1];
  for(const entry of ['./','./index.html']){
   const response=await cache.match(new URL(entry,scope).href);
   if(!response||(await response.text()).indexOf('VERSIE '+version+' ·')===-1){
    throw new Error('Onvolledige publicatie: versienummer van de pagina klopt niet.');
   }
  }
  const app=await cache.match(new URL('./app.js',scope).href);
  if(!app||!(await app.text()).includes(CACHE))throw new Error('App-bestanden worden nog gepubliceerd.');
  await self.skipWaiting();
 })().catch(async error=>{
  await caches.delete(CACHE);
  throw error;
 }));
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(key=>key.startsWith('leonida-')&&key!==CACHE).map(key=>caches.delete(key)));
  await self.clients.claim();
 })());
});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  const hit=await cache.match(request);
  if(hit)return hit;
  try{return await fetch(request);}
  catch{
   if(request.mode==='navigate')return (await cache.match(entryUrl))||Response.error();
   return Response.error();
  }
 })());
});
