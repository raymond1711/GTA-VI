'use strict';
(() => {
 const core=window.ExplorerCore,areas=window.EXPLORER_AREAS,types=window.EXPLORER_CATEGORIES,STORE='leonida-explorer-settings-v2';
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function evidenceIcon(level){
  const label=level===2?'Bevestigd in het spel':'Vermeld in bronnen';
  const check='<path d="M2 7l3 3 6-6"/>';
  return `<span class="evidence-icon evidence-icon--${level}" role="img" aria-label="${label}" title="${label}"><svg width="${level===2?23:13}" height="14" viewBox="0 0 ${level===2?23:13} 14" aria-hidden="true">${check}${level===2?'<g transform="translate(9)">'+check+'</g>':''}</svg></span>`;
 }
 function sourceEvidence(item){
  if(item.provisionalTip)return '';
  if(item.locationType==='stick-up')return evidenceIcon(2);
  return item.source||item.extraSource?evidenceIcon(1):'';
 }
 const evidenceLegend=`<div class="evidence-legend" aria-label="Bronstatus"><span>${evidenceIcon(1)} Vermeld in bronnen</span><span>${evidenceIcon(2)} Bevestigd in het spel</span></div>`;
 const lastChapter=5;
 const {added,overrides,info,coverage}=window.EXPLORER_RELEASE_ADDITIONS;
 const trusted=[...window.EXPLORER_DISCOVERIES.map(item=>overrides[item.id]||item),...added];
 const initial=()=>({chapter:1,area:null,custom:[],checked:[],notes:{}});
 let model=initial(),page='start';
 function validModel(input){return core.validateModel(input?.items?core.migrateLegacy(input):input,areas,types,trusted)}

 try{const raw=localStorage.getItem(STORE)||localStorage.getItem('leonida-explorer-discoveries-v1');if(raw)model=validModel(JSON.parse(raw))}catch{notify('Verkenningsgegevens konden niet worden gelezen. Je introductie blijft bewaard.');}
 function persist(){try{localStorage.setItem(STORE,JSON.stringify(model));return true}catch{notify('Verkenning opslaan lukt niet. Download een back-up.');return false}}
 // Bestaande opdrachten delen exact dezelfde IDs/vinkjes; geen officiële vindplaatsen.
 const legacy=cats.flatMap(c=>c.tasks.map(t=>({...t,area:['city','keys','grass'].includes(c.id)?c.id:null,category:/screenshot|herinnering|uitzicht|favoriete|omgeving/.test((t.title+' '+t.detail).toLowerCase())?'sights':'activities',chapter:1,source:'',type:'personal'})));
 const activeDiscoveries=trusted.filter(item=>!item.pendingActivity);
 const activeReferences=info.filter(item=>!item.pendingActivity);
 const activityRecords=core.unique(trusted.filter(item=>item.pendingActivity&&!item.referenceOnly)).map(item=>({...item,category:'activities'}));
 const meditationCharacters=new Map();
 for(const item of trusted.filter(item=>item.meditationParent)){
  const group=meditationCharacters.get(item.meditationParent)||[];
  group.push(item);
  meditationCharacters.set(item.meditationParent,group);
 }
 const activityReferences=info.filter(item=>item.pendingActivity&&item.referenceOnly);
 const records=()=>core.unique([...legacy,...activeDiscoveries,...model.custom]);
 const exploreTypes=types.filter(type=>!['collectibles','activities'].includes(type.id));
 const exploreRecords=()=>records().filter(item=>!['collectibles','activities'].includes(item.category)&&!item.collection&&!item.series);
 const storySort=(a,b)=>a.chapter-b.chapter||(a.storyOrder??1000)-(b.storyOrder??1000);
 const checked=()=>{
  const ids=new Set([...state.checked,...model.checked,...Object.keys(model.medals||{})]);
  for(const [spot,characters] of meditationCharacters){
   if(characters.every(item=>ids.has(item.id)))ids.add(spot);
  }
  return [...ids];
 };
 const label=p=>p.percent===null?'—':p.percent+'%';
 function meter(rows,title,small=false){const p=core.progress(rows,checked());return `<div class="${small?'mini-progress':'progress-row'}"><div class="meter-label"><span>${esc(title)}</span><strong>${label(p)}</strong></div><div class="neutral-track"><div style="width:${p.percent??0}%"></div></div>${small?'':`<small>${p.done} van ${p.total} bijgehouden onderdelen</small>`}</div>`}
 const svgIcons={skyline:'<path d="M5 38V16h9v22m4 0V6h10v32m4 0V20h11v18M3 40h43M21 11h4m-4 6h4m-4 6h4m-15-1h4m-4 6h4m28-2h4"/>',island:'<path d="M3 37q20-10 42 0M7 42q7-3 14 0t14 0t10 0M24 33q5-14 1-22m0 0q-10-9-16 0 9-3 16 0 5-11 14-5-9 0-14 5 9-2 15 8-10-7-15-8-8 0-12 10"/>',reeds:'<path d="M4 40q10-4 20 0t20 0M18 38V12m10 26V8m-2 12h4V7h-4zm-10 3h4V11h-4zM9 35 7 22m4 13 3-7m23 10 2-17m-4 17-3-10"/>',crane:'<path d="M8 41h35M14 39V7h6v32M6 10h36l-25-8zm31 0v16m-3 0v6h6M22 39V23h9v16"/>',factory:'<path d="M5 41V22l11-7v10l12-8v8h15v16zM33 23V5h6v18M10 31h5m6 0h5m7 0h5M10 36h5m6 0h5m7 0h5"/>',mountain:'<path d="m3 40 16-28 8 13 6-19 13 34zm11-20 5 5 4-6m7-5 3 5 4-6M8 40l12-12 9 12"/>'};
 const icon=a=>`<svg aria-hidden="true" viewBox="0 0 48 48">${svgIcons[a.icon]}</svg>`;
 const main=document.querySelector('main'),footer=document.querySelector('footer'),journal=document.querySelector('.journal');
 const intro=document.createElement('section');intro.id='introduction-view';
 const nav=document.createElement('nav');nav.id='app-menu';nav.className='app-nav';nav.setAttribute('aria-label','Hoofdnavigatie');nav.innerHTML=[['start','Start'],['intro','Introductie'],['explore','Verkennen'],['collectibles','Collectibles'],['activities','Activiteiten'],['challenges','Uitdagingen'],['progress','Voortgang'],['journal','Fotodagboek']].map(([id,name])=>`<button type="button" data-page="${id}">${name}</button>`).join('');
 const home=document.createElement('section');home.id='start-view';home.innerHTML="<div class=\"welcome\"><h1 class=\"welcome-title\">Leonida Explorer</h1><p>Kies waar je vandaag zin in hebt.</p></div><div class=\"mode-grid\"><button type=\"button\" class=\"mode-card\" data-page=\"intro\"><strong>Introductie</strong><span>Volg de route voor je eerste middag.</span><em aria-hidden=\"true\">↗</em></button><button type=\"button\" class=\"mode-card\" data-page=\"explore\"><strong>Verkennen</strong><span>Kies je hoofdstuk en gebied.</span><em aria-hidden=\"true\">↗</em></button><button type=\"button\" class=\"mode-card\" data-page=\"collectibles\"><strong>Collectibles</strong><span>Bekijk de verzamelobjecten en hun vindplekken.</span><em aria-hidden=\"true\">↗</em></button><button type=\"button\" class=\"mode-card\" data-page=\"activities\"><strong>Activiteiten</strong><span>Vink stunts, meditaties en andere activiteiten af.</span><em aria-hidden=\"true\">↗</em></button><button type=\"button\" class=\"mode-card\" data-page=\"progress\"><strong>Voortgang</strong><span>Bekijk je vinkjes per hoofdstuk, gebied en categorie.</span><em aria-hidden=\"true\">↗</em></button><button type=\"button\" class=\"mode-card\" data-page=\"journal\"><strong>Fotodagboek</strong><span>Bewaar foto’s en notities van je ontdekkingen.</span><em aria-hidden=\"true\">↗</em></button></div>";
 const leonidaMap=`<svg class="leonida-map" role="group" aria-label="Aanklikbare gebiedskaart van Leonida" viewBox="0 0 440 660">
  <defs>
    <linearGradient id="map-ocean" x2="0.85" y2="1">
      <stop stop-color="#235970"/>
      <stop offset="1" stop-color="#173951"/>
    </linearGradient>
    <pattern id="map-grid" width="36" height="36" patternUnits="userSpaceOnUse">
      <path d="M36 0H0V36" fill="none" stroke="#a8d9dc" stroke-opacity=".14"/>
    </pattern>
    <pattern id="map-city-blocks" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(12)">
      <rect width="8" height="8" rx="1" fill="#f4e5de" fill-opacity=".55"/>
    </pattern>
  </defs>
  <rect width="440" height="660" fill="url(#map-ocean)"/>
  <rect width="440" height="660" fill="url(#map-grid)"/>
  <g class="map-art" fill="none" stroke="#73c2c1" stroke-opacity=".23">
    <path d="M43 185q-31 35-2 74t65 52m-70-112q-32 47 7 83t58 38M429 310q14 80-44 132m43-24q-19 30-53 49M129 475q-27 16-13 39t48 32m180-80q-5 56-116 78"/>
  </g>

  <!-- Adjacent regions reuse their shared edges. Detailed contours and road lines are illustrative. -->
  <g class="map-region" data-area="kalaga" style="--area-color:${areas.find(area=>area.id==='kalaga').color}" aria-hidden="true" aria-pressed="false">
    <path class="region-land" fill="#779b75" d="M91 137Q73 123 81 105L101 92 94 74 117 56 142 54 151 34 181 45 203 34 221 49 253 40 274 57 301 53 325 70 352 76 359 99 374 111 364 137 372 161L323 175 268 156 223 162 170 149 132 158Z"/>
    <g class="map-art" fill="none" stroke="#435f51" stroke-width="1.5">
      <path d="M110 96q28 8 48-12t52-9q21 9 47-5t65 12M104 109q39 10 62-14t47-6q26 13 55-6t75 17M108 121q24 10 49-4t42-17q22 2 41 11t45-14q22-13 45 2t22 14M150 130q32-4 46-18t42 5q25 14 55-10t54 17M260 132q24 0 45-13t43 13"/>
      <path d="m132 100 16-30 15 24 8-13 17 23m66-7 15-29 15 23 9-16 18 23" stroke="#dce3b0" stroke-width="2.4"/>
    </g>
  </g>

  <g class="map-region" data-area="port" style="--area-color:${areas.find(area=>area.id==='port').color}" aria-hidden="true" aria-pressed="false">
    <path class="region-land" fill="#bda47f" d="M91 137L132 158 170 149 223 162 198 212 175 267 127 300 108 288 101 269 80 254 88 236 69 226 76 213 62 200 73 181 89 170 83 153Z M45 163l6-11 8-3 2-7 13-4 5 8-5 8 3 6-10 10-17 5Z"/>
    <g class="map-art" fill="url(#map-city-blocks)"><path d="M80 190l34-14 61 3 13 24-22 38-41 27-21-21 6-21-29-13Z"/></g>
    <g class="map-art" fill="none" stroke="#f9deb7" stroke-width="2.4" stroke-linecap="round">
      <path d="M71 166l16 12m19 67-23 6m19 5-13 4m22 2-12 8M100 187q22 23 59 25l22 22"/>
    </g>
  </g>

  <g class="map-region" data-area="ambrosia" style="--area-color:${areas.find(area=>area.id==='ambrosia').color}" aria-hidden="true" aria-pressed="false">
    <path class="region-land" fill="#a0aa78" d="M223 162L268 156 323 175 372 161 367 183 382 204 373 229 384 260 351 286 311 293 280 308 266 338 216 346 171 327 138 329 129 314 127 300 175 267 198 212Z"/>
    <g class="map-art" fill="#d4cb8e" stroke="#859560" stroke-width="2">
      <path d="m186 247 32 9-6 15-32-9zM179 265l31 9-8 15-29-9zM221 257l24 8-8 16-23-8zM215 275l21 9-8 17-22-10zM321 184l39-5 2 16-35 5zM328 204l35-5 1 12-32 9z"/>
    </g>
    <path class="region-land map-lake-detail" fill="#3c8998" stroke="#a1d5c1" d="M242 203q11-14 26-14l15-4 14 8 13 2 9 14-3 16 9 8-6 11-13 3-14-5-13 8-18-4-13-14-11-7Z"/>
    <g class="map-art" fill="none" stroke="#f9deb7" stroke-width="2.5" stroke-linecap="round">
      <path d="M204 212q20 14 20 37t36 33q30 4 75-18M322 192q13 22 12 45t12 32"/>
    </g>
    <text class="landmark-name" x="280" y="223">Lake Leonida</text>
  </g>

  <g class="map-region" data-area="grass" style="--area-color:${areas.find(area=>area.id==='grass').color}" aria-hidden="true" aria-pressed="false">
    <path class="region-land" fill="#79a684" d="M138 329L171 327 216 346 266 338 280 379 269 419 271 450 252 467 230 460 216 469 199 456 181 459 170 446 152 444 153 427 137 422 144 405 129 394 134 375 119 366 125 351Z M118 404l8 3 5 10-9 6-8-9Z M156 459l11 1 5 8-11 5-7-7Z"/>
    <g class="map-art" fill="none" stroke-linecap="round">
      <path d="M132 357q31-2 34 17t24 17q28-5 35 20t31 28M142 400q21-15 35 3t9 37M249 350q-21 12-15 23t27 9M222 446q-1-18-17-24" stroke="#387c80" stroke-width="5"/>
      <path d="M142 345l14 3m26 5 14 3m5 13 19 5m-63 43 12 4m59 20 15 4m-44 4 10 3m38-51 12 5m-107-35 10 3" stroke="#d4dfaa" stroke-width="2.6"/>
    </g>
  </g>

  <g class="map-region" data-area="city" style="--area-color:${areas.find(area=>area.id==='city').color}" aria-hidden="true" aria-pressed="false">
    <path class="region-land" fill="#b9a5ab" d="M384 260L387 278 379 298 391 318 388 340 397 359 388 375 387 391 374 409 358 418 349 437 328 448 309 445 291 457 271 450 269 419 280 379 266 338 280 308 311 293 351 286Z M402 319l8 14 4 24-7 27-14 18 1-15 9-23-6-22Z M384 411l10-8 4 7-7 12-13 3Z"/>
    <g class="map-art" fill="url(#map-city-blocks)">
      <path d="M349 296l24-15-7 25 15 18-3 23 8 18-13 24-1 14-24 15-27 17-20-9 12-29-9-23 17-22 9-37Z"/>
    </g>
    <g class="map-art" fill="none" stroke="#ffe4bf" stroke-linecap="round">
      <path d="M326 313q14 18 10 43t19 37m5-53 42 5m-41 43 43-18m-69 28-18 24-24 13" stroke-width="2.6"/>
      <path d="M288 343l19-21m-13 23 22-24m-13 14-14-6" stroke="#605663" stroke-width="2.6"/>
    </g>
  </g>

  <g class="map-art map-detail" aria-hidden="true">
    <path class="map-link" d="M106 136Q126 154 117 187T147 247L178 281Q173 309 213 331L263 355Q289 373 310 413L323 449M184 145Q216 143 233 170T321 185Q351 187 348 214L365 276"/>
    <path class="map-waterway" d="M248 244q-10 22-1 39t-7 39M302 246q29 12 31 38"/>
    <path class="map-shallows" d="M161 474q36 21 97 2m-68 5q34 18 76 3M395 317q23 23 24 47"/>
    <g class="map-labels">
      <circle cx="124" cy="116" r="2"/><text x="123" y="107">Grayson</text>
      <circle cx="331" cy="118" r="2"/><text x="333" y="108">Millport</text>
      <circle cx="59" cy="154" r="2"/><text x="49" y="131">Draper Island</text>
      <circle cx="222" cy="435" r="2"/><text x="212" y="448">Watson Bay</text>
      <circle cx="266" cy="413" r="2"/><text x="270" y="402">Hamlet</text>
      <circle cx="306" cy="334" r="2"/><text x="309" y="319">VCIA</text>
      <circle cx="404" cy="340" r="2"/><text x="395" y="325">Vice Beach</text>
    </g>
  </g>
  <g class="map-region" data-area="keys" style="--area-color:${areas.find(area=>area.id==='keys').color}" aria-hidden="true" aria-pressed="false">
    <path class="map-art" d="M339 460Q381 508 314 566T115 636Q53 630 52 597" fill="none" stroke="#58a9ab" stroke-width="35" stroke-linecap="round" opacity=".27"/>
    <path class="region-land" fill="#c4b781" d="M304 477l13-13 18 1 15 10 10 20-8 12-16 6-9-9-16-3-10-12Z M317 519l13-5 12 8-7 12-5 11-17 6-12-6 1-10Z M277 550l15-7 11 7-5 10-12 13-19 4-11-8 8-12Z M227 576l15-9 14 5-1 13-13 10-19 3-8-7Z M178 597l17-9 13 4 3 11-14 12-24 3-7-8Z M127 609l19-8 15 4 1 12-12 11-26 4-10-9Z M79 612l17-10 14 4 3 14-17 9-21-2-7-9Z"/>
    <path class="map-art" d="M321 449q9 16 14 39t-11 43q-20 25-49 31t-42 23q-36 22-95 33l-49-2" fill="none" stroke="#ffe6b7" stroke-width="2.6" stroke-linecap="round"/>
    <g class="map-art map-detail">
      <path d="m84 620 21-9m-20 13 15-7" fill="none" stroke="#61586a" stroke-width="2"/>
      <g class="map-labels">
        <text x="358" y="469">Key Lento</text>
        <text x="357" y="558">Maroon Key</text>
        <text x="187" y="637">Southwind</text>
        <text x="78" y="648">Mile Zero</text>
      </g>
    </g>
  </g>

  <g class="map-art" aria-hidden="true">
    <text class="sea-name" x="49" y="338" transform="rotate(-90 49 338)">WESTKUST</text>
    <text class="sea-name" x="418" y="244" transform="rotate(-90 418 244)">ATLANTISCHE OCEAAN</text>
    <path d="m395 61 8-20 8 20-8-4Z" fill="#e8f5ed"/>
    <text class="sea-name" x="403" y="35">N</text>
  </g>
  <g class="map-region-labels">
    <g class="map-region" data-area="kalaga" style="--area-color:${areas.find(area=>area.id==='kalaga').color}" role="button" tabindex="0" aria-label="Mount Kalaga" aria-pressed="false">
      <g class="region-name" transform="translate(143 112)"><rect width="153" height="36" rx="11"/><svg x="7" y="7" width="22" height="22" viewBox="0 0 48 48">${svgIcons.mountain}</svg><text x="34" y="23">Mount Kalaga</text></g>
    </g>
    <g class="map-region" data-area="port" style="--area-color:${areas.find(area=>area.id==='port').color}" role="button" tabindex="0" aria-label="Port Gellhorn" aria-pressed="false">
      <g class="region-name" transform="translate(36 207)"><rect width="149" height="36" rx="11"/><svg x="7" y="7" width="22" height="22" viewBox="0 0 48 48">${svgIcons.crane}</svg><text x="34" y="23">Port Gellhorn</text></g>
    </g>
    <g class="map-region" data-area="ambrosia" style="--area-color:${areas.find(area=>area.id==='ambrosia').color}" role="button" tabindex="0" aria-label="Ambrosia" aria-pressed="false">
      <g class="region-name" transform="translate(156 289)"><rect width="123" height="36" rx="11"/><svg x="7" y="7" width="22" height="22" viewBox="0 0 48 48">${svgIcons.factory}</svg><text x="34" y="23">Ambrosia</text></g>
    </g>
    <g class="map-region" data-area="grass" style="--area-color:${areas.find(area=>area.id==='grass').color}" role="button" tabindex="0" aria-label="Grassrivers" aria-pressed="false">
      <g class="region-name" transform="translate(123 379)"><rect width="137" height="36" rx="11"/><svg x="7" y="7" width="22" height="22" viewBox="0 0 48 48">${svgIcons.reeds}</svg><text x="34" y="23">Grassrivers</text></g>
    </g>
    <g class="map-region" data-area="city" style="--area-color:${areas.find(area=>area.id==='city').color}" role="button" tabindex="0" aria-label="Vice City" aria-pressed="false">
      <g class="region-name" transform="translate(292 351)"><rect width="112" height="36" rx="11"/><svg x="7" y="7" width="22" height="22" viewBox="0 0 48 48">${svgIcons.skyline}</svg><text x="34" y="23">Vice City</text></g>
    </g>
    <g class="map-region" data-area="keys" style="--area-color:${areas.find(area=>area.id==='keys').color}" role="button" tabindex="0" aria-label="Leonida Keys" aria-pressed="false">
      <g class="region-name" transform="translate(49 521)"><rect width="153" height="36" rx="11"/><svg x="7" y="7" width="22" height="22" viewBox="0 0 48 48">${svgIcons.island}</svg><text x="34" y="23">Leonida Keys</text><path d="M121 36l30 32" fill="none" stroke-width="1.5"/></g>
    </g>
  </g>
</svg>`;
 const explore=document.createElement('section');explore.id='explorer-view';explore.innerHTML=`<header class="page-heading page-heading--explore"><p class="eyebrow">VOLG JE NIEUWSGIERIGHEID</p><h1>Verkennen</h1></header>${evidenceLegend}<div class="chapter-panel"><div><div class="chapter-field"><label for="current-chapter">Ik speel hoofdstuk <output id="chapter-value" for="current-chapter">1</output></label><input id="current-chapter" type="range" min="1" max="${lastChapter}" step="1"><div class="chapter-ticks" aria-hidden="true"><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span></div></div><small class="chapter-note">Je keuze blijft bewaard. Latere onderdelen blijven verborgen.</small></div><div id="chapter-stats" class="chapter-stats"></div></div><div class="map-wrap"><div class="map-caption"><span>KIES EEN GEBIED</span><span>LEONIDA · KAART V5</span></div>${leonidaMap}</div><div class="map-legend"><span><i style="background:#3c8998"></i>Water</span><span><i style="background:#b9a5ab"></i>Stad</span><span><i style="background:#79a684"></i>Natuur</span></div><p class="map-note">Kies een gebied op de kaart. Gebiedsgrenzen en wegen zijn indicatief.</p><div id="chosen-area"></div>`;
 const missionHub=document.createElement('section');missionHub.id='mission-hub';missionHub.className='mission-hub';missionHub.setAttribute('aria-label','Missies en overvallocaties in alle gebieden');explore.querySelector('.map-wrap').before(missionHub);
 const overview=document.createElement('section');overview.id='progress-view';
 const collectibles=document.createElement('section');
 collectibles.id='collectibles-view';
 const flamingoCollection='Cocaïneflamingo’s';
 const collectionOf=item=>item.collection||item.series||(item.category==='collectibles'?'Eigen verzamelobjecten':null);
 const cardSeries=[...new Set(activeDiscoveries.map(item=>item.series).filter(Boolean))];
 const cardNames=new Set(cardSeries);
 const otherCollections=[...new Set([...activeDiscoveries,...activeReferences].map(collectionOf).filter(name=>name&&!cardNames.has(name)).concat("Eigen verzamelobjecten"))];
 const themedCollections={
  "WAiNK en streetart": [
    "WAiNK-bezienswaardigheden",
    "WAiNK-curiositeiten",
    "WAiNK-sculpturen",
    "NoFlusher-tags",
    "PeeWee-billboards",
    "1010 Murals",
    "Ahol Street Art"
  ],
  "Schatten en zeldzame vondsten": [
    "Duikplekken en schatten",
    "Cocaïneflamingo’s",
    "Meteorieten"
  ],
  "Boeken, post en muziek": [
    "Tijdschriften, boeken en strips",
    "Boekenruil",
    "Flessenpost",
    "Unieke afspeellijsten"
  ],
  "Stijl en horloges": [
    "Tijdschriftstijlen Jason en Lucia",
    "Tijdschrifttatoeages",
    "Luxe horloges"
  ],
  "Voertuigen": ["Standout-voertuigen", "Wyman’s Cars"],
  "Wapens en uitrusting": ["Unieke wapenvarianten", "Uitrusting"],
  "Persoonlijk": ["Eigen verzamelobjecten"],
  "Kaarten en extra vindplaatsen": [
    "Aanvullende kaartpinnen",
    "Ahol Street Art · gidsverwijzingen",
    "Tijdschriften · alternatieve vindplekken"
  ]
};
 const collectionOptions=names=>names.map(name=>`<option>${esc(name)}</option>`).join('');
 const groupedNames=new Set(Object.values(themedCollections).flat());
 const groups=Object.entries(themedCollections).map(([label,names])=>[label,names.filter(name=>otherCollections.includes(name))]);
 groups.push(["Overige verzamelobjecten",otherCollections.filter(name=>!groupedNames.has(name))]);
 const themedOptions=groups.filter(([,names])=>names.length).map(([label,names])=>`<optgroup label="${esc(label)}">${collectionOptions(names)}</optgroup>`).join("");
 collectibles.innerHTML=`<header class="page-heading page-heading--collect"><p class="eyebrow">VIND EN VERZAMEL</p><h1>Collectibles</h1></header>${evidenceLegend}<div class="collect-controls">
 <label>Collectie <select id="collect-series"><optgroup label="Verzamelkaartjes">${collectionOptions(cardSeries)}</optgroup>${themedOptions}</select></label>
 <label><input type="checkbox" id="collect-missing"> Alleen ontbrekende</label>
 </div>
 <div id="collect-map"></div><p id="collect-status" aria-live="polite"></p><div id="collect-game-goal" hidden></div><p id="collect-coverage" class="scope-note" hidden></p><div id="collect-list"></div>`;
 function cloneAreaMap(prefix){
  const map=explore.querySelector('.map-wrap').cloneNode(true);
  for(const node of map.querySelectorAll('[id]')){
   const oldId=node.id;
   for(const user of map.querySelectorAll('[fill],[clip-path]')){
    for(const attr of ['fill','clip-path'])if(user.getAttribute(attr)==='url(#'+oldId+')')user.setAttribute(attr,'url(#'+prefix+'-'+oldId+')');
   }
   node.id=prefix+'-'+oldId;
  }
  const button=document.createElement('button');
  button.type='button';button.className='map-unassigned quiet';button.dataset.area='unknown';
  button.textContent='Zonder regio';button.hidden=true;
  map.append(button);
  return map;
 }
 collectibles.querySelector('#collect-map').append(cloneAreaMap('collect'));
 const screenshotViewer=document.createElement('dialog');
 screenshotViewer.className='screenshot-viewer';
 screenshotViewer.setAttribute('aria-label','Vergrote screenshot');
 screenshotViewer.innerHTML='<form method="dialog"><button type="submit">Sluiten ×</button></form><img alt="">';
 document.body.append(screenshotViewer);
 screenshotViewer.addEventListener('click',event=>{if(event.target===screenshotViewer)screenshotViewer.close();});
 screenshotViewer.addEventListener('close',()=>screenshotViewer.querySelector('img').removeAttribute('src'));
 function attachScreenshot(details,item){
  if(!item.screenshot)return;
  const showImage=()=>{
   if(!details.open||details.querySelector('img'))return;
   const image=document.createElement('img');
   image.alt='Vindplek van '+item.title;
   image.loading='lazy';
   image.src=item.screenshot;
   const zoomButton=document.createElement('button');
   zoomButton.type='button';
   zoomButton.className='screenshot-zoom';
   zoomButton.setAttribute('aria-label','Vergroot de vindplek van '+item.title);
   zoomButton.append(image);
   zoomButton.addEventListener('click',()=>{
    const enlarged=screenshotViewer.querySelector('img');
    enlarged.alt=image.alt;
    enlarged.src=image.src;
    screenshotViewer.showModal();
   });
   image.onerror=()=>zoomButton.remove();
   details.append(zoomButton);
  };
  details.addEventListener('toggle',showImage);
 }
 const chooseAreaPrompt='<p class="no-items">Tik op een gebied op de kaart.</p>';
 const hasNoRegion=item=>!item.area&&!item.extraArea;
 let collectibleArea=null;
 function renderCollectibles(){
  const selection=collectibles.querySelector('#collect-series').value;
  const isFlamingo=selection===flamingoCollection;
  const coverageLine=collectibles.querySelector('#collect-coverage');
  coverageLine.textContent=coverage[selection]||'';
  coverageLine.hidden=!coverageLine.textContent;
  const list=[...records(),...activeReferences].filter(item=>collectionOf(item)===selection&&(item.chapter!==lastChapter||model.chapter===lastChapter));
  collectibles.querySelector('.map-unassigned').hidden=!list.some(hasNoRegion);
  const matches=list.filter(item=>collectibleArea==='unknown'?hasNoRegion(item):collectibleArea&&(item.area===collectibleArea||item.extraArea===collectibleArea));
  const found=new Set(checked());
  const missing=collectibles.querySelector('#collect-missing').checked;
  const visible=matches.filter(item=>!missing||(!item.referenceOnly&&!found.has(item.id)));
  const areaName=areas.find(area=>area.id===collectibleArea)?.name||(collectibleArea==='unknown'?'Overige vindplekken':'Alle vindplekken');
  const actionable=list.filter(item=>!item.referenceOnly);
  const done=core.progress(actionable,found).done;
  const areaStatus=areaName+' · '+core.progress(matches,found).done+'/'+matches.length+(isFlamingo?' afgevinkt':' gevonden');
  const provisionalCount=isFlamingo?list.filter(item=>item.provisionalTip).length:0;
  collectibles.querySelector('#collect-status').textContent=isFlamingo
   ? `${areaStatus} · ${done}/${list.length} in deze gids · ${list.length-provisionalCount}/125 figuren beschreven · ${provisionalCount} voorlopige zoektips`
   : actionable.length ? `${areaStatus} · Collectie ${done}/${actionable.length}` : matches.length+" aanwijzingen";
  for(const button of collectibles.querySelectorAll('[data-area],[data-collect-area]'))button.setAttribute('aria-pressed',String((button.dataset.area||button.dataset.collectArea)===collectibleArea));
  const target=collectibles.querySelector('#collect-list');
  const opened=new Set([...target.querySelectorAll('details[open]')].map(node=>node.dataset.card));
  target.replaceChildren();
  collectibles.querySelector('#collect-status').hidden=!collectibleArea;
  coverageLine.hidden=!collectibleArea||!coverageLine.textContent;
  const goalPanel=collectibles.querySelector('#collect-game-goal');
  goalPanel.innerHTML=collectibleArea?collectibleGoal(selection,found):'';
  goalPanel.hidden=!goalPanel.innerHTML;
  if(!collectibleArea){target.innerHTML=chooseAreaPrompt;return;}
  if(!visible.length)target.textContent=missing&&matches.length?'Alle opgenomen vindplekken afgevinkt.':'Geen vindplekken voor deze collectie in dit gebied.';
  for(const item of visible){
   const row=document.createElement('article');
   row.className='corker-card';
   row.innerHTML=`<label class="task"><input ${item.referenceOnly?'hidden disabled':''} type="checkbox" data-collect-record="${esc(item.id)}" ${found.has(item.id)?'checked':''}><span><b>${esc(item.title)}</b>${sourceEvidence(item)}<small>${esc(item.sourceLocation)}${item.workbookStatus?' · '+esc(item.workbookStatus):''}${item.provisionalTip?' · Voorlopige zoektip':item.approximateLocation?' · Zoekgebied':''}</small></span></label>
   <details data-card="${esc(item.id)}"><summary>${item.screenshot?'Vindplek en screenshot':'Vindplek'}</summary><p>${esc(item.detail)}</p>
   ${item.screenshot?`<a href="${esc(item.screenshot)}" target="_blank" rel="noopener noreferrer">Open screenshot</a>${item.screenshotCredit?` (${esc(item.screenshotCredit)})`: ''} · `:isFlamingo?'':'<p>Geen screenshot beschikbaar.</p>'}
   ${item.source?`<a href="${esc(item.source)}" target="_blank" rel="noopener noreferrer">${isFlamingo&&/#(?:hidden-package|cocaine-flamingo)-/.test(item.source)?'Open kaartpin':'Bron'}</a>`:''}
   ${item.extraSource?` · <a href="${esc(item.extraSource)}" target="_blank" rel="noopener noreferrer">${esc(item.extraSourceLabel||'Tweede bron')}</a>`:''}</details>`;
   const details=row.querySelector('details');
   attachScreenshot(details,item);
   details.open=opened.has(item.id);
   target.append(row);
  }
 }
 function chooseCollectibleArea(button){
  collectibleArea=button.dataset.collectArea||button.dataset.area;
  renderCollectibles();
 }
 collectibles.addEventListener('click',event=>{
  const button=event.target.closest('[data-collect-area],[data-area]');
  if(button)chooseCollectibleArea(button);
 });
 collectibles.addEventListener('keydown',event=>{
  const button=event.target.closest('.map-region[data-area]');
  if(button&&(event.key==='Enter'||event.key===' ')){event.preventDefault();chooseCollectibleArea(button);}
 });
 collectibles.addEventListener('change',event=>{
  const input=event.target;
  if(input.id==='collect-series')collectibleArea=null;
  if(input.matches('[data-collect-record]')){
   const id=input.dataset.collectRecord;
   model.checked=input.checked?[...new Set([...model.checked,id])]:model.checked.filter(value=>value!==id);
   persist();
   const top=window.scrollY,wasFocused=document.activeElement===input;
   renderCollectibles();
   if(wasFocused){
    const replacement=[...collectibles.querySelectorAll('[data-collect-record]')].find(node=>node.dataset.collectRecord===id);
    replacement?.focus({preventScroll:true});
   }
   if(window.scrollY!==top)window.scrollTo({top,behavior:'instant'});
   return;
  }
  renderCollectibles();
 });
 const activities=document.createElement('section');
 activities.id='activities-view';
 const activityNames=[
  'Stuntsprongen','Onder bruggen door','Mesvluchten','BASE-sprongen','Basketbalringen',
  'Meditaties','Dieren bestuderen','Voertuigmodellen scannen','Gewone races','Race-uitdagingen','Top Fun-droneproeven','Jachtopdrachten van Bret','Schietuitdagingen',
  'Stick Ups','Overige activiteiten','Arcadegames','Pooltegenstanders','Minigolf','Dino Golf-medailles'
 ];
 const medalOptions=[['bronze','Brons'],['silver','Zilver'],['gold','Goud']];
 const activityNotes={
  'Stick Ups':'Kies een gebied op de kaart. De bronstatus staat bij elk filiaal. Vergelijk je vinkjes met Overvallen → Stick Ups in de game.',
  'Top Fun-droneproeven':'Per station moet je de eerste twee richttijden verslaan. De derde proef telt voor 100% zodra je finisht.',
  'Jachtopdrachten van Bret':'Speel als Jason. De doelwitten en exacte zoekgebieden van opdracht 5 t/m 15 staan op de kaart zodra Bret je sms’t.',
  'Gewone races':'Vink iedere unieke race af zodra je die hebt gewonnen. Voor 100% in het spel heb je 30 overwinningen nodig.',
  'Race-uitdagingen':'Voor 100% in het spel heb je 10 van de 13 gouden medailles nodig.',
  'Schietuitdagingen':'Voor 100% in het spel heb je alle 42 gouden medailles nodig.',
  'Meditaties':'Vink Jason en Lucia afzonderlijk aan. Na Coffee Break kun je je partner bellen en samen gaan. Een oud locatievinkje vermeldt nog geen personage.',
  'Arcadegames':'Start elk van de vier spellen één keer voor de spelchecklist. Speel alle levels van één spel uit voor Stick Fiddler.',
  'Pooltegenstanders':'Vink per locatie de eerste winst af.',
  'Minigolf':'Vink een locatie aan zodra je er een ronde hebt gespeeld.',
  'Dino Golf-medailles':'Vink per hole je beste medaille aan.',

  'Dieren bestuderen':'De lijst bevat bronvermeldingen van dieren. Namen en varianten kunnen afwijken van de spelteller.',
  'Voertuigmodellen scannen':'Deze lijst bevat de voertuigmodellen die al in de gids zijn opgenomen.',
  'Basketbalringen':'Open bij het nummer de kaart of route uit de gids. Sommige locaties hebben meerdere ringen.'
 };
 activities.innerHTML=`<header class="page-heading page-heading--activities"><p class="eyebrow">KIES JE VOLGENDE UITDAGING</p><h1>Activiteiten</h1></header>${evidenceLegend}<div class="collect-controls">
 <label>Activiteit <select id="activity-kind">${collectionOptions(activityNames)}</select></label>
  <label><input type="checkbox" id="activity-missing"> <span id="activity-missing-label">Alleen ontbrekende</span></label>
 </div><div id="activity-map"></div><div id="activity-progress" class="activity-progress" aria-live="polite"></div>
 <p id="activity-note" class="scope-note" hidden></p>
 <div id="activity-area-prompt" hidden>${chooseAreaPrompt}</div><p id="activity-empty" class="scope-note" hidden></p>
 <div id="activity-list"></div>
 <details id="activity-references" class="corker-card" hidden><summary>Extra basketbalverwijzingen</summary><ul></ul></details>`;
 const activityMap=cloneAreaMap('activity');
 activities.querySelector('#activity-map').append(activityMap);
 const activityKind=activities.querySelector('#activity-kind');
 let activityArea=null;
 const activityMissing=activities.querySelector('#activity-missing');
 const activityList=activities.querySelector('#activity-list');
 const activityEmpty=activities.querySelector('#activity-empty');
 function matchesActivityArea(item){
  return activityArea==='unknown'?hasNoRegion(item):activityArea&&(item.area===activityArea||item.extraArea===activityArea);
 }
 const selectedActivities=()=>activityKind.value==='Overige activiteiten'
  ? [...activeDiscoveries,...model.custom].filter(item=>item.category==='activities')
  : activityRecords.filter(item=>item.collection===activityKind.value);
 const stuntCollections=new Set(['Stuntsprongen','Onder bruggen door','Mesvluchten','BASE-sprongen']);
 const gameTargets=new Map([
  ['Meditaties',15],['Basketbalringen',90],['Gewone races',30],['Race-uitdagingen',10],
  ['Schietuitdagingen',42],['Top Fun-droneproeven',42],['Jachtopdrachten van Bret',15],
  ['Arcadegames',4],['Pooltegenstanders',5],['Minigolf',2]
 ]);
 function goalTrack(title,value,total,goal){
  const marker=goal===undefined?'':`<span class="game-goal-marker" style="left:${goal/total*100}%" title="Spelminimum: ${goal}"></span>`;
  const fill=Math.min(value??0,total);
  const state=value===undefined?'Stand onbekend':undefined;
  return `<div class="game-goal-track">
   <div class="neutral-track" role="progressbar" aria-label="${esc(title)}" aria-valuemin="0" aria-valuemax="${total}" ${state?'aria-valuetext="'+state+'"':'aria-valuenow="'+fill+'"'}><div style="width:${fill/total*100}%"></div></div>
   ${marker}
  </div>`;
 }
 function gameGoalMeter(rows,title,goal,completed){
  const progress=core.progress(rows,completed);
  return `<div class="progress-row">
   <div class="meter-label"><span>${esc(title)}</span><strong>${label(progress)}</strong></div>
   ${goalTrack(title,progress.done,progress.total,goal)}
   <small>${progress.done} van ${progress.total} · Spelminimum ${goal} van ${progress.total}${progress.done>=goal?' · Behaald':''}</small>
  </div>`;
 }
 function stickUpProgress(items){
  const found=new Set(checked());
  const done=items.filter(item=>found.has(item.id)).length;
  const community=items.filter(item=>item.locationType==='stick-up-community'&&found.has(item.id)).length;
  const total=91, goal=50;
  return `<div class="progress-row">
   <div class="meter-label"><span>Stick Ups · alle gebieden</span><strong>${done} / ${total}</strong></div>
   ${goalTrack("Stick Ups",done,total,goal)}
   <small>Voor 100% in het spel: ${goal} van ${total} · ${items.length} locaties afvinkbaar in de app · ${community} vinkjes op communitylocaties.</small>
  </div>`;
 }
 function updateActivityProgress(items){
  const progress=activities.querySelector('#activity-progress');
  const kind=activityKind.value;
  const areaName=areas.find(area=>area.id===activityArea)?.name||'Zonder regio';
  const filtered=items.filter(matchesActivityArea);
  const gold=Object.keys(model.medals||{}).filter(id=>model.medals[id]==='gold');
  const goal=gameTargets.get(kind);
  const medalActivity=items.some(item=>item.medal);
  const totalMeter=kind==='Stick Ups' ? stickUpProgress(items) : kind==='Meditaties'
   ? gameGoalMeter(items.flatMap(item=>meditationCharacters.get(item.id)||[item]),'Meditaties per personage',goal,model.checked)
   : goal
    ? gameGoalMeter(items,medalActivity?'Gouden medailles':kind,goal,medalActivity?gold:checked())
    : meter(items,kind);
  const stunts=stuntCollections.has(kind)
   ? gameGoalMeter(activityRecords.filter(item=>stuntCollections.has(item.collection)),'Alle stunts samen',300,checked())
   : '';
  const totals=medalActivity&&Boolean(goal);
  const marked=totals?meter(items,'Onderdeel met een medaille'):'';
  const areaMeter=activityArea==='all'?'':meter(filtered,areaName);
  const goldTotal=medalActivity&&!goal?`<p>Goud ${items.filter(item=>gold.includes(item.id)).length} van ${items.length}</p>`:'';
  progress.innerHTML=totalMeter+marked+areaMeter+stunts+goldTotal;
 }
 function activityDone(item,found){
  if(item.medal)return model.medals?.[item.id]==='gold';
  const characters=meditationCharacters.get(item.id);
  return characters?characters.every(character=>found.has(character.id)):found.has(item.id);
 }
 function setActivityEmpty(matches){
  activities.querySelector('#activity-area-prompt').hidden=Boolean(activityArea);
  activityEmpty.hidden=!activityArea||Boolean(activityList.querySelector('article:not([hidden])'));
  activityEmpty.textContent=matches.length?(matches[0].medal?'Alle onderdelen in deze selectie hebben goud.':'Alle onderdelen in deze selectie zijn afgevinkt.'):'Geen onderdelen opgenomen voor dit gebied.';
 }
 function renderActivities(){
  for(const control of activities.querySelectorAll('[data-area],[data-activity-area]'))control.setAttribute('aria-pressed',String((control.dataset.area||control.dataset.activityArea)===activityArea));
  const items=selectedActivities();
  activityMap.querySelector('.map-unassigned').hidden=!items.some(hasNoRegion)&&!(activityKind.value==='Basketbalringen'&&activityReferences.some(hasNoRegion));
  activities.querySelector('#activity-progress').hidden=!activityArea;
  const matches=items.filter(matchesActivityArea);
  const found=new Set(checked());
  const note=activities.querySelector('#activity-note');
  note.textContent=activityNotes[activityKind.value]||'';
  note.hidden=!note.textContent;
  updateActivityProgress(items);
  activities.querySelector('#activity-missing-label').textContent=items.some(item=>item.medal)?'Zonder goud':'Alleen ontbrekende';
  activityList.replaceChildren();
  for(const item of matches){
   if(activityMissing.checked&&activityDone(item,found))continue;
   const card=document.createElement('article');
   card.className='corker-card';
   card.dataset.activityCard=item.id;
   const location=item.sourceLocation||areas.find(area=>area.id===item.area)?.name||'';
   const title=`<b>${esc(item.title)}</b>${sourceEvidence(item)}${location?`<small>${esc(location)}</small>`:''}`;
   const stickUp=item.collection==='Stick Ups';
   const characters=meditationCharacters.get(item.id);
   const oldCheck=characters&&model.checked.includes(item.id)
    ? `<label class="task"><input type="checkbox" data-activity-record="${esc(item.id)}" checked> Eerder afgevinkt · personage onbekend</label>`:'';
   const characterChecks=characters?`<fieldset class="medal-choice"><legend>${title}</legend><div class="medal-options">
    ${characters.map(character=>`<label class="medal-option"><input type="checkbox" data-activity-record="${esc(character.id)}" ${found.has(character.id)?'checked':''}> ${esc(character.character)}</label>`).join('')}
    </div>${oldCheck}</fieldset>`:'';
   const result=characters?characterChecks:item.medal
    ? `<fieldset class="medal-choice"><legend>${title}</legend><div class="medal-options">
     ${medalOptions.map(([value,name])=>`<label class="medal-option" data-rank="${value}"><input type="checkbox" data-activity-medal="${esc(item.id)}" value="${value}" ${model.medals?.[item.id]===value?'checked':''}><span aria-hidden="true" class="medal-icon"></span>${name}</label>`).join('')}
     </div></fieldset>`
    : `<label class="task"><input type="checkbox" data-activity-record="${esc(item.id)}" ${found.has(item.id)?'checked':''}><span>${title}</span></label>`;
   card.innerHTML=`${result}
    <details><summary>${item.screenshot?'Uitleg, bron en screenshot':'Uitleg en bron'}</summary>
    ${item.detail&&item.detail!==location?`<p>${esc(item.detail)}</p>`:''}
    ${stickUp?`<label>Opmerking<textarea class="item-note" maxlength="3000" data-stick-note>${esc(model.notes[item.id]||"")}</textarea></label>`:""}${item.workbookStatus?`<p class="scope-note">${esc(item.workbookStatus)}</p>`:''}
    ${item.source?`<a href="${esc(item.source)}" target="_blank" rel="noopener noreferrer">${item.locationType==='stick-up-community'?'Open kaartpin':'Open gids'}</a>`: ''}
    ${item.extraSource?` &middot; <a href="${esc(item.extraSource)}" target="_blank" rel="noopener noreferrer">${esc(item.extraSourceLabel||'Tweede bron')}</a>`:''}
    ${item.screenshot?` &middot; <a href="${esc(item.screenshot)}" target="_blank" rel="noopener noreferrer">Open screenshot</a>`:''}</details>`;
   attachScreenshot(card.querySelector('details'),item);
   const stickNote=card.querySelector('[data-stick-note]');
   if(stickNote)stickNote.oninput=()=>{model.notes[item.id]=stickNote.value;persist()};
   activityList.append(card);
  }
  setActivityEmpty(matches);
  const references=activities.querySelector('#activity-references');
  const links=activityKind.value==='Basketbalringen'?activityReferences.filter(matchesActivityArea):[];
  references.hidden=!links.length;
  references.querySelector('ul').innerHTML=links.map(item=>`<li><a href="${esc(item.source)}" target="_blank" rel="noopener noreferrer">${esc(item.title)}</a></li>`).join('');
 }
 function chooseActivityArea(event){
  const control=event.target.closest('[data-area],[data-activity-area]');
  if(!control)return;
  if(event.type==='keydown'){
   if(!control.matches('.map-region')||!['Enter',' '].includes(event.key))return;
   event.preventDefault();
  }
  activityArea=control.dataset.area||control.dataset.activityArea;
  renderActivities();
 }
 activities.addEventListener('click',chooseActivityArea);
 activityMap.addEventListener('keydown',chooseActivityArea);
 activities.addEventListener('change',event=>{
  const input=event.target;
  if(input===activityKind)activityArea=null;
  const {activityRecord,activityMedal}=input.dataset;
  if(!activityRecord&&!activityMedal){renderActivities();return;}
  if(activityMedal){
   model.medals??={};
   if(input.checked)model.medals[activityMedal]=input.value;
   else delete model.medals[activityMedal];
   for(const option of input.closest('fieldset').querySelectorAll('input'))option.checked=option===input&&input.checked;
  }else{
   model.checked=input.checked?[...new Set([...model.checked,activityRecord])]:model.checked.filter(value=>value!==activityRecord);
  }
  persist();
  const items=selectedActivities();
  updateActivityProgress(items);
  const card=input.closest('article');
  const item=items.find(record=>record.id===card.dataset.activityCard);
  if(activityMissing.checked&&activityDone(item,new Set(checked()))){
   const scrollTop=window.scrollY;
   const next=card.nextElementSibling||card.previousElementSibling;
   card.remove();
   (next?.querySelector('input,select')||activityMissing).focus({preventScroll:true});
   setActivityEmpty(items.filter(matchesActivityArea));
   if(window.scrollY!==scrollTop)window.scrollTo({top:scrollTop,behavior:'instant'});
  }
 });
 for(const child of [...main.children])if(child!==footer&&child!==journal)intro.append(child);
 const challenges=document.createElement('section');
 challenges.id='challenges-view';
 const challengeRows=trusted.filter(item=>item.collection==='Uitdagingen');
 const challengeGroups=[...new Set(challengeRows.map(item=>item.group))];
 function automaticChallenges(found){
  const complete=new Set();
  const count=rows=>core.progress(rows,found).done;
  if(count(wainkScans.filter(item=>['WAiNK-bezienswaardigheden','WAiNK-curiositeiten','WAiNK-sculpturen'].includes(item.collection)))>=4)complete.add('guide-challenge-3-1');
  if(count(underwaterDiscoveries)>=25)complete.add('guide-challenge-3-5');
  if(count(activityRecords.filter(item=>item.collection==='Basketbalringen'))>=100)complete.add('guide-challenge-6-8');
  return complete;
 }
 function renderChallenges(){
  const found=checked(),automatic=automaticChallenges(found);
  const complete=new Set([...found,...automatic]);
  const opened=new Set([...challenges.querySelectorAll('details[open]')].map(details=>details.dataset.group));
  challenges.innerHTML=`<header class="page-heading page-heading--activities"><p class="eyebrow">PROBEER IETS NIEUWS</p><h1>Uitdagingen</h1></header>
   <p class="scope-note">Vink een uitdaging af zodra GTA VI die onder Progress → Challenges als voltooid toont.</p>
   ${collectibleGoalRow('Uitdagingen',core.progress(challengeRows,complete).done,80,70)}
   ${challengeGroups.map(group=>{
    const rows=challengeRows.filter(item=>item.group===group);
    const {done,total}=core.progress(rows,complete);
    return `<details class="explore-category" data-group="${esc(group)}" ${opened.has(group)?'open':''}>
     <summary><strong>${esc(group)}</strong><span>${done} van ${total}</span></summary>
     <div class="explore-items">${rows.map(item=>`<article class="corker-card"><label class="task">
      <input type="checkbox" data-challenge="${esc(item.id)}" ${complete.has(item.id)?'checked':''} ${automatic.has(item.id)?'disabled':''}>
      <span><b>${esc(item.title)}</b>${sourceEvidence(item)}<small>${esc(item.detail)}</small>${automatic.has(item.id)?'<small>Automatisch behaald via bestaande vinkjes</small>':''}</span></label></article>`).join('')}</div></details>`;
   }).join('')}
   <p><a href="https://www.powerpyx.com/gta-6-all-challenges-guide/" target="_blank" rel="noopener noreferrer">Bron: PowerPyx</a></p>`;
 }
 challenges.addEventListener('change',event=>{
  const {target}=event,id=target.dataset.challenge;
  if(!id)return;
  model.checked=target.checked?[...new Set([...model.checked,id])]:model.checked.filter(value=>value!==id);
  persist();
  const top=window.scrollY,focused=document.activeElement===target;
  renderChallenges();
  if(focused)challenges.querySelector('[data-challenge="'+id+'"]').focus({preventScroll:true});
  if(window.scrollY!==top)window.scrollTo({top,behavior:'instant'});
 });
 const challengeButton=document.createElement('button');
 challengeButton.type='button';
 challengeButton.className='mode-card';
 challengeButton.dataset.page='challenges';
 challengeButton.innerHTML='<strong>Uitdagingen</strong><span>Houd de 80 speluitdagingen bij.</span>';
 home.querySelector('[data-page=progress]').before(challengeButton);
 main.prepend(nav,home,intro,explore,collectibles,activities,challenges,overview);journal.id='journal-view';
 const editor=document.createElement('dialog');editor.id='discovery-editor';editor.innerHTML=`<button type="button" class="close" id="close-editor" aria-label="Sluiten">×</button><p class="eyebrow">VOEG JOUW VONDST TOE</p><h2>Eigen ontdekking</h2><p>Leg zelf vast wat je tegenkomt. Jouw hoofdstuk is de eerste beschikbaarheid voor deze persoonlijke checklist.</p><form class="entry-form" id="discovery-form"><label>Naam<input name="title" maxlength="150" required></label><label>Omschrijving<textarea name="detail" maxlength="2000"></textarea></label><div class="entry-columns"><label>Gebied<select name="area">${areas.map(a=>`<option value="${a.id}">${esc(a.name)}</option>`).join('')}</select></label><label>Categorie<select name="category">${exploreTypes.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></label></div><label>Vanaf hoofdstuk<input name="chapter" type="number" min="1" max="99" step="1" required></label><label>Bronlink (optioneel)<input name="source" type="url" maxlength="1000" placeholder="https://…"></label><p id="entry-error" role="status"></p><button type="submit" class="primary">Ontdekking opslaan</button></form>`;document.body.append(editor);
 function go(next){if(!['start','intro','explore','collectibles','activities','challenges','progress','journal'].includes(next))next='start';page=next;nav.hidden=page==="start";for(const [id,node] of Object.entries({start:home,intro,explore,collectibles,activities,challenges,progress:overview,journal}))node.hidden=id!==page;nav.querySelectorAll('button').forEach(b=>{if(b.dataset.page===page)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});if(page==='explore')renderExplore();if(page==='collectibles')renderCollectibles();if(page==='activities')renderActivities();if(page==='challenges')renderChallenges();if(page==='progress')renderOverview();window.scrollTo({top:0,behavior:'instant'});}
 document.addEventListener('click',e=>{const target=e.target.closest('[data-page]');if(target){e.preventDefault();go(target.dataset.page)}});
 document.querySelector('.brand').onclick=e=>{e.preventDefault();go('start')};
 const chapterInput=explore.querySelector('#current-chapter');
 const chapterValue=explore.querySelector('#chapter-value');
 function syncChapterSlider(){
  chapterInput.value=Math.min(model.chapter,lastChapter);
  chapterValue.value=chapterInput.value;
  chapterInput.setAttribute('aria-valuetext','Hoofdstuk '+chapterInput.value);
 }
 chapterInput.addEventListener('input',()=>{
  model.chapter=Number(chapterInput.value);
  syncChapterSlider();
  persist();
  renderExplore();
 });
 model.chapter=Math.min(model.chapter,lastChapter);
 syncChapterSlider();
 function selectArea(id){if(!areas.some(a=>a.id===id))return;model.area=id;persist();renderExplore();}
 explore.addEventListener('click',e=>{const area=e.target.closest('[data-area]');if(area)selectArea(area.dataset.area)});
 explore.querySelectorAll('.map-region').forEach(p=>p.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectArea(p.dataset.area)}}));
 function itemRow(item,showLocation=false){const row=document.createElement('div');row.className='explore-item';row.innerHTML=`<label class="task"><input type="checkbox" data-record="${esc(item.id)}" ${checked().includes(item.id)?'checked':''}><span>${item.locationType==='illegal-operation'?'<em class="robbery-tag">● Gele overvallocatie</em>':''}<b>${esc(item.title)}</b>${sourceEvidence(item)}${item.unlockUncertain?'<small class="unlock-uncertain"><span aria-hidden="true">!</span> Beschikbaarheid per hoofdstuk onzeker</small>':''}<small>${esc(item.detail)}${item.mapLabel?'<br><span class="unlock-condition">Op de kaart: '+esc(item.mapLabel)+'</span>':''}${item.condition?'<br><span class="unlock-condition">Voorwaarde: '+esc(item.condition)+'</span>':''}${item.availableUntilChapter?'<br><span class="expiry-condition">Alleen t/m hoofdstuk '+item.availableUntilChapter+'</span>':''}${!item.unlockUncertain&&item.availabilityBasis?.startsWith('afgeleid')?'<br><span class="unlock-condition">Indeling: '+esc(item.availabilityBasis)+'.</span>':''}</small></span></label><div class="item-meta">${item.locationType==='mission-loot'?'Missiegebonden buit · ':item.locationType==='safe'?'Losse kluis · ':item.locationType==='bank-job'||item.locationType==='bank-vault'?'Bankoverval · ':''}${item.type==='verified'?'Gidsbron: '+esc(item.sourceName||'bronlink'):'Persoonlijke opdracht'}${item.sourceNote?' · Bronnotitie: '+esc(item.sourceNote):''}${item.source?` · <a href="${esc(item.source)}" target="_blank" rel="noopener noreferrer">Bron ↗</a>`:''}</div><button type="button" class="quiet" data-note="${esc(item.id)}">Opmerking</button><button type="button" class="quiet" data-photo="${esc(item.id)}">Foto toevoegen</button><textarea class="item-note" aria-label="Opmerking bij ${esc(item.title)}" maxlength="3000" hidden></textarea>`;const textarea=row.querySelector('textarea');textarea.value=model.notes[item.id]||'';textarea.oninput=()=>{model.notes[item.id]=textarea.value;persist()};row.querySelector('[data-note]').onclick=()=>{textarea.hidden=!textarea.hidden;if(!textarea.hidden)textarea.focus()};row.querySelector('[data-photo]').onclick=()=>{go('journal');const title=document.querySelector('#photo-title'),category=document.querySelector('#photo-category');title.value=item.title.slice(0,100);category.value=item.area||item.extraArea||model.area||'';document.querySelector('#photo-note').value=(model.notes[item.id]||'').slice(0,2000);window.leonidaPhotoContext=item.id;title.focus()};if(showLocation||item.locationType==='illegal-operation'){const location=document.createElement('p');location.className='mission-location';location.textContent=(item.unlockUncertain?'Hoofdstuk onbekend':item.id==='guide-mission-prologue'?'Proloog':(item.availabilityBasis?.startsWith('afgeleid')?'In app bij hoofdstuk ':'Vanaf hoofdstuk ')+item.chapter)+' · '+(item.sourceLocation||areas.find(a=>a.id===item.area)?.name||'Algemene opdracht')+(item.area?'':' · kaartgebied nog niet bevestigd');row.prepend(location)}return row;}
 function renderMissionHub(all){
  const opened=new Set([...missionHub.querySelectorAll('details[open]')].map(d=>d.dataset.missionKind));missionHub.replaceChildren();
  for(const [kind,title] of [['missions','Hoofdmissies in alle gebieden'],['sidequests','Zijmissies in alle gebieden'],['loot','Overvallen & lootlocaties in alle gebieden']]){
   const visible=core.visible(core.category(all,kind),model.chapter).sort(storySort),details=document.createElement('details');details.className='explore-category mission-overview';details.dataset.missionKind=kind;details.open=opened.has(kind);details.innerHTML=`<summary><strong>${title} <span aria-hidden="true">⌄</span></strong><span class="mission-visible-count">${visible.length} zichtbaar</span></summary><p class="mission-explanation">Alles tot en met hoofdstuk ${model.chapter}, los van je gebiedskeuze. Startvoorwaarden staan bij elk punt. ${kind==='missions'?'Inclusief kleinere verhaal- en wachttaken: het aantal kan afwijken van Story Recap. De proloog staat bij hoofdstuk 1.':kind==='loot'?'De gele locaties zijn Illegal Operations: vink een locatie af wanneer je de Key Valuables op de spelkaart hebt verzameld. De app bevat alle 39 standaardlocaties. Een rood uitroepteken betekent dat de beschikbaarheid per hoofdstuk onzeker is. Missiegebonden buit en losse kluizen zijn apart gemarkeerd. Stick Ups staan bij Activiteiten.':'Sommige uitnodigingen verschijnen pas na een bericht of wisseling van personage.'} Hoofdstuk-exclusieve verlopen punten blijven in je voortgang bewaard.</p><div class="explore-items"></div>`;
   const list=details.querySelector('.explore-items');if(!visible.length){const empty=document.createElement('p');empty.className='scope-note';empty.textContent='Nog geen onderdelen vastgelegd voor deze hoofdstukkeuze.';list.append(empty)}let lastChapter=null;for(const item of visible){if(lastChapter!==item.chapter){const heading=document.createElement('h3');heading.className='list-chapter-heading';heading.textContent=(item.availabilityBasis?.startsWith('afgeleid')?'In app bij hoofdstuk ':'Vanaf hoofdstuk ')+item.chapter;list.append(heading);lastChapter=item.chapter}list.append(itemRow(item,true));}missionHub.append(details);
  }
 }
 function renderExplore(){
  const all=exploreRecords();renderMissionHub(all);explore.querySelector('#chapter-stats').innerHTML=meter(core.chapter(all,model.chapter),'Hoofdstuk '+model.chapter)+`<small>Eenmalig aan dit hoofdstuk toegewezen, inclusief vastgelegde hoofdmissies.</small>`;
  explore.querySelectorAll('[data-area]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.area===model.area)));
  const target=explore.querySelector('#chosen-area'),area=areas.find(a=>a.id===model.area);if(!area){target.innerHTML=chooseAreaPrompt;return}target.style.setProperty('--area-color',area.color);
  const areaItems=all.filter(item=>item.area===area.id||item.extraArea===area.id),visible=core.visible(areaItems,model.chapter),p=core.progress(areaItems,checked());
  const opened=new Set([...target.querySelectorAll('details[open]')].map(d=>d.dataset.category));
  target.innerHTML=`<header class="area-header"><div class="area-icon">${icon(area)}</div><div><p class="eyebrow">JOUW GEKOZEN GEBIED</p><h2>${esc(area.name)}</h2><p>${esc(area.description)}</p><div class="area-meter"><div class="meter-label"><span>Gebied · alle hoofdstukken</span><strong>${label(p)}</strong></div><div class="neutral-track"><div style="width:${p.percent??0}%"></div></div></div></div></header><p class="source-notice">Hoofdstuk 1 t/m 5. Verzamelobjecten en activiteiten staan in hun eigen tabs. Binnen een hoofdstuk kunnen extra missievoorwaarden gelden; die staan bij het onderdeel.</p><div class="explore-list"></div><div class="explorer-tools"><button type="button" id="add-discovery" class="primary small">+ Eigen ontdekking</button><button type="button" class="quiet" data-page="progress">Alle voortgang bekijken ↗</button></div><p class="scope-note">Gebieds- en categorietotalen tellen alle vastgelegde hoofdstukken mee. Namen en details van latere onderdelen blijven verborgen.</p>`;
  const list=target.querySelector('.explore-list');let groups=0;
  for(const type of exploreTypes){const items=core.category(visible,type.id).sort(storySort);if(!items.length)continue;groups++;const details=document.createElement('details');details.className='explore-category';details.dataset.category=type.id;details.open=opened.has(type.id);details.innerHTML=`<summary><strong>${esc(type.name)} <span aria-hidden="true">⌄</span></strong>${meter(core.category(all,type.id),'Alle gebieden',true)}</summary><div class="explore-items"></div>`;
   for(const item of items)details.querySelector('.explore-items').append(itemRow(item));list.append(details)}
  if(!groups)list.innerHTML='<p class="no-items">Nog geen ontdekkingen vastgelegd voor dit gebied en hoofdstuk. Je kunt alvast een eigen vondst toevoegen.</p>';
  target.querySelector('#add-discovery').onclick=()=>openEditor(area.id);
 }
 function refreshExploreChecks(id,on){
  for(const checkbox of explore.querySelectorAll('[data-record]')){
   if(checkbox.dataset.record===id)checkbox.checked=on;
  }
  const all=exploreRecords(), selected=checked();
  explore.querySelector('#chapter-stats').innerHTML=meter(core.chapter(all,model.chapter),'Hoofdstuk '+model.chapter)+
   '<small>Eenmalig aan dit hoofdstuk toegewezen, inclusief vastgelegde hoofdmissies.</small>';
  const areaMeter=explore.querySelector('.area-meter');
  if(areaMeter){
   const areaItems=all.filter(item=>item.area===model.area||item.extraArea===model.area);
   const p=core.progress(areaItems,selected);
   areaMeter.querySelector('strong').textContent=label(p);
   areaMeter.querySelector('.neutral-track div').style.width=(p.percent??0)+'%';
  }
  for(const details of explore.querySelectorAll('details[data-category]')){
   const p=core.progress(core.category(all,details.dataset.category),selected);
   details.querySelector('.mini-progress strong').textContent=label(p);
   details.querySelector('.mini-progress .neutral-track div').style.width=(p.percent??0)+'%';
  }
 }
 explore.addEventListener('change',e=>{
  if(!e.target.matches('[data-record]'))return;
  const id=e.target.dataset.record,on=e.target.checked;
  if(ids.has(id)){
   state.checked=on?[...new Set([...state.checked,id])]:state.checked.filter(x=>x!==id);
   save();baseUpdate();
  }else{
   model.checked=on?[...new Set([...model.checked,id])]:model.checked.filter(x=>x!==id);
   persist();
  }
  refreshExploreChecks(id,on);
 });
 const salesLabels={drugs:'Drugs',jewelry:'Juwelen',bills:'Gemarkeerde biljetten',vehicles:'Voertuigen'};
 const dollars=new Intl.NumberFormat('nl-NL',{style:'currency',currency:'USD',currencyDisplay:'narrowSymbol',maximumFractionDigits:0});
 // Alleen expliciet onderbouwde individuele taken. Verzamelopdrachten en hun subtaken kunnen overlappen.
 const optionalMissionIds=new Set([
  'guide-side-get-shirleys-rum',
  'guide-side-steal-the-scooter',
  'guide-side-catch-a-bigger-fish',
  'guide-side-search-for-the-skunk-ape',
  'guide-side-search-for-tree-effigies-locations',
  'guide-side-help-kirk-find-mr-mangrove',
  'guide-side-kyle',
  'guide-side-collect-chemicals-for-kyle',
  'guide-side-buddy-check-on-kyle',
  'guide-side-gellhorn-missing-tourists',
  'guide-side-gellhorn-return-trophy-room',
  'guide-side-bret',
  'guide-side-thrillbillies',
  'guide-side-twist-wrist-smash-grab-join-billy-on-a-job',
  'guide-side-mall-rats',
  'guide-side-the-impaler',
  'guide-side-hometown-heroes',
  'guide-side-pay-the-cellerica-fee',
  'guide-side-peach-join-the-cellerica-initiation',
  'guide-side-read-the-label-retrieve-the-cellerica-van',
  'guide-side-puff-puff-pass-meet-at-the-warehouse',
  'guide-side-ch4-thats-where-the-money-is',
  'guide-side-ch4-attend-eddie-acostas-party',
  'guide-side-ch4-this-is-a-free-call-from',
  'guide-side-the-last-mile-passing-the-torch',
  'guide-side-the-last-mile-backseat-pilot',
  'guide-side-petes-deliveries-southpoint-airfield',
  'guide-side-petes-deliveries-avery-allen-co',
  'guide-side-deliver-packages',
  'guide-side-audit-check-in-with-kenton',
  'guide-side-audit-maritime-dispute',
  'guide-side-audit-delivery-day',
  'guide-side-audit-collect-the-tempesta',
  'guide-side-audit-retest-freddies',
  'guide-side-audit-bring-out-the-chimp',
  'guide-side-audit-sisters-of-the-sea',
  'guide-side-audit-twin-flames',
  'guide-side-audit-dodo-rise',
  'guide-side-audit-scarlet-sun',
  'guide-side-audit-get-lucias-clothes','guide-side-audit-dale-mamba','guide-side-audit-mansion-thrax',
  'guide-side-join-a-street-race','guide-side-bumper-to-bumper-mentor-yago',
  'guide-side-race-against-yago','guide-side-brother-to-brother-back-up-yago',
  'guide-side-the-unknown-stuntman','guide-side-audit-trial-by-tire','guide-side-audit-quit-your-job',
  'guide-side-audit-catching-a-whale','guide-side-audit-the-audacity-attend'
 ]);
 const optionalTasks=core.unique(trusted.filter(item=>item.optionalTask||optionalMissionIds.has(item.id)||item.meditationParent||
  (item.collection==='Meditaties'&&!meditationCharacters.has(item.id))));
 function saleStatus(key){
  const value=model.sales?.[key],goal=core.saleGoals[key];
  if(value===undefined)return 'Onbekend · doel '+dollars.format(goal);
  return dollars.format(value)+' / '+dollars.format(goal)+(value>=goal?' · Behaald':' · Nog '+dollars.format(goal-value));
 }
 const gameGoalGroups=[["Verhaal en taken",[["Hoofdverhaal",1,"story"],["Optionele taken",100,"optional"],["Bendeoperaties",39,"gangs"],["Bankovervallen",22,"banks"],["Payday Loan Jobs",7,"payday"],["Smash ’N’ Grabs",34],["Stick Ups",50,"stickups"],["Drugs verkocht",100000,"drugs"],["Juwelen verkocht",100000,"jewelry"],["Gemarkeerde biljetten verkocht",250000,"bills"],["Kluizen",8,"vaults"],["Voertuigen verkocht",200000,"vehicles"]]],["Verkenning en activiteiten",[["Kenton-sets",5],["Kaartseries",15,"cardsets"],["WAiNK-scans",100,"waink"],["Onderwatervondsten",33,"dives"],["Tijdschriften, boeken en strips",30],["Meditaties",15,"meditations"],["Flamingo’s",100],["Unieke afspeellijsten",2],["Ontdekte stijlen",70],["Unieke races",30,"races"],["Race-uitdagingen met goud",10,"raceGold"],["Schietuitdagingen met goud",42,"rangeGold"],["Arcadegames",4,"arcade"],["Pooltegenstanders",5,"pool"],["Minigolflocaties",2,"golf"],["Basketbalringen",90,"hoops"],["Droneproeven",42,"drones"],["Stunts",300,"stunts"],["Uitdagingen",70,"challenges"],["Bret’s Target Decks",15,"bret"]]],["Ontdekkingen",[["Voertuigbasismodellen",200],["Standaardwapens",50],["Dieren",100]]]];
 const wainkCollections=new Set(['WAiNK-bezienswaardigheden','WAiNK-curiositeiten','WAiNK-sculpturen','NoFlusher-tags','PeeWee-billboards']);
 const wainkScans=trusted.filter(item=>!item.referenceOnly&&wainkCollections.has(item.collection));
 const underwaterDiscoveries=trusted.filter(item=>!item.referenceOnly&&item.collection==='Duikplekken en schatten'&&
  !['excel-dive-a15788fa43ad4077fac8','excel-dive-7069022c3e0f6d10b4ed'].includes(item.id));
 function collectibleGoal(selection,found){
  let title,rows,total,goal;
  if(wainkCollections.has(selection)){
   [title,rows,total,goal]=['WAiNK-scans',wainkScans,108,100];
  }else if(selection==='Duikplekken en schatten'){
   [title,rows,total,goal]=['Onderwatervondsten',underwaterDiscoveries,33,33];
  }else if(selection===flamingoCollection){
   [title,rows,total,goal]=['Flamingo’s',trusted.filter(item=>collectionOf(item)===selection&&!item.referenceOnly),125,100];
  }else if(trusted.some(item=>item.series&&collectionOf(item)===selection)){
   const cards=trusted.filter(item=>item.series&&!item.referenceOnly);
   const sets=new Map();
   for(const item of cards){
    if(!sets.has(item.series))sets.set(item.series,[]);
    sets.get(item.series).push(item);
   }
   const done=[...sets.values()].filter(set=>set.every(item=>found.has(item.id))).length;
   return collectibleGoalRow('Complete kaartseries',done,18,15);
  }else return '';
  return collectibleGoalRow(title,core.progress(rows,found).done,total,goal);
 }
 function collectibleGoalRow(title,done,total,goal){
  return `<div class="progress-row"><div class="meter-label"><span>${esc(title)} · alle gebieden</span><strong>${done} / ${total}</strong></div>${goalTrack(title,done,total,goal)}<small>Voor 100% in het spel: ${goal} van ${total}</small></div>`;
 }
 function gameCompletionCounts(){
  const found=checked();
  const completed=new Set(found);
  const rows=trusted.filter(item=>!item.referenceOnly);
  const amount=predicate=>core.progress(rows.filter(predicate),found).done;
  const collection=name=>amount(item=>item.collection===name);
  const gold=name=>rows.filter(item=>item.collection===name&&model.medals?.[item.id]==='gold').length;
  const sets=new Map();
  for(const item of rows.filter(item=>item.series)){
   if(!sets.has(item.series))sets.set(item.series,[]);
   sets.get(item.series).push(item.id);
  }
  return {
   story:Number(completed.has('guide-mission-ch5-the-end-of-the-road')),
   optional:core.progress(optionalTasks,found).done,
   gangs:amount(item=>item.locationType==='illegal-operation'),
   banks:amount(item=>['bank-job','bank-vault'].includes(item.locationType)),
   payday:amount(item=>item.locationType==='payday-loan'),
   smash:amount(item=>item.locationType==='smash-grab'),
   stickups:amount(item=>['stick-up','stick-up-community'].includes(item.locationType)),
   vaults:amount(item=>item.locationType==='bank-vault'),
   cardsets:[...sets.values()].filter(ids=>ids.every(id=>completed.has(id))).length,
   waink:core.progress(wainkScans,found).done,
   dives:core.progress(underwaterDiscoveries,found).done,
   meditations:core.progress(rows.filter(item=>item.collection==='Meditaties'&&!meditationCharacters.has(item.id)||item.meditationParent),found).done,
   flamingos:collection(flamingoCollection),
   races:collection('Gewone races'),raceGold:gold('Race-uitdagingen'),rangeGold:gold('Schietuitdagingen'),
   arcade:collection('Arcadegames'),pool:collection('Pooltegenstanders'),golf:collection('Minigolf'),
   hoops:collection('Basketbalringen'),drones:collection('Top Fun-droneproeven'),
   stunts:amount(item=>stuntCollections.has(item.collection)),bret:collection('Jachtopdrachten van Bret'),
   challenges:core.progress(challengeRows,[...found,...automaticChallenges(found)]).done,
   ...model.sales
  };
 }
 function updateGameSummary(){
  const counts=gameCompletionCounts();
  const goals=gameGoalGroups.flatMap(([,rows])=>rows);
  const achieved=goals.filter(([,minimum,key])=>counts[key]>=minimum).length;
  const unknown=goals.filter(([, ,key])=>counts[key]===undefined).length;
  overview.querySelector('#game-goal-summary').textContent=`${achieved} van ${goals.length} speldoelen behaald · ${unknown} onbekend`;
 }
 function renderGameCompletion(){
  const target=overview.querySelector('#game-completion');
  const counts=gameCompletionCounts();
  const number=new Intl.NumberFormat('nl-NL');
  const checkedIds=new Set(checked());
  const provisional={
   stickups:trusted.filter(item=>item.locationType==='stick-up-community'&&checkedIds.has(item.id)).length,
   flamingos:trusted.filter(item=>item.collection===flamingoCollection&&item.provisionalTip&&checkedIds.has(item.id)).length
  };
  target.innerHTML=`
   <p id="game-goal-summary" aria-live="polite"></p>
   <p class="scope-note">Verkoopbedragen vind je na het hoofdverhaal onder Progress → Stats → 100% Completion → Story &amp; Tasks.</p>
   ${gameGoalGroups.map(([group,goals])=>`<section><h3>${esc(group)}</h3><ul class="game-goals">
    ${goals.map(([title,minimum,key])=>{
     const value=counts[key];
     if(Object.hasOwn(core.saleGoals,key))return `<li class="sale-goal"><label>${esc(title)}<input type="number" min="0" max="${Number.MAX_SAFE_INTEGER}" step="1" inputmode="numeric" data-sale="${key}" value="${value??''}"></label><small data-sale-status="${key}" aria-live="polite">${esc(saleStatus(key))}</small><div data-sale-track="${key}">${goalTrack(title,value,minimum)}</div></li>`;
     const status=key==='story'?(value?'Behaald':'Laatste hoofdmissie nog niet afgevinkt'):value===undefined?'Onbekend · doel '+number.format(minimum):number.format(value)+' van '+number.format(minimum)+(value>=minimum?' · Behaald':'');
     return `<li><strong>${esc(title)}</strong><span>${esc(status)}${key==='optional'?' · '+optionalTasks.length+' taken gekoppeld':''}${provisional[key]?' · '+provisional[key]+' voorlopig':''}</span>
      ${goalTrack(title,value,minimum)}</li>`;
    }).join('')}</ul></section>`).join('')}`;
  const optional=target.querySelector('[aria-label="Optionele taken"]').closest('li');
  optional.insertAdjacentHTML('beforeend','<small>Dit is je stand op basis van gekoppelde vinkjes. De game telt ook andere optionele taken mee.</small>');
  updateGameSummary();
 }
 overview.addEventListener('change',event=>{
  const field=event.target,key=field.dataset.sale;
  if(!Object.hasOwn(core.saleGoals,key))return;
  const amount=field.valueAsNumber;
  field.setCustomValidity('');
  if(!field.validity.valid||(field.value!==''&&!Number.isSafeInteger(amount))){
   field.setCustomValidity('Vul een geldig geheel bedrag in dollars in.');
   field.reportValidity();
   return;
  }
  const sales={...model.sales};
  if(field.value==='')delete sales[key];else sales[key]=amount;
  model.sales=sales;
  persist();
  overview.querySelector('[data-sale-status="'+key+'"]').textContent=saleStatus(key);
  overview.querySelector('[data-sale-track="'+key+'"]').innerHTML=goalTrack(salesLabels[key],sales[key],core.saleGoals[key]);
  updateGameSummary();
 });
 overview.addEventListener('input',event=>{if(event.target.dataset.sale)event.target.setCustomValidity('')});
 function renderOverview(){const chapterRecords=exploreRecords(),all=[...records(),...activityRecords],p=core.progress(all,[...checked(),...automaticChallenges(checked())]);const chapters=[...new Set([model.chapter,...chapterRecords.filter(x=>x.chapter<=model.chapter).map(x=>x.chapter)])].sort((a,b)=>a-b);overview.innerHTML=`<header class="page-heading page-heading--progress"><p class="eyebrow">JOUW REIS IN CIJFERS</p><h1>Voortgang</h1></header><details class="progress-group overview-disclosure"><summary>100% spelvoltooiing</summary><div class="game-completion" id="game-completion"></div></details><details class="progress-group overview-disclosure"><summary>App-voltooiing</summary><div class="progress-hero"><strong class="big-percent">${label(p)}</strong><p>${p.done} van ${p.total} unieke onderdelen afgevinkt</p><div class="neutral-track"><div style="width:${p.percent??0}%"></div></div></div><p class="app-scope">Hier zie je hoeveel checklistonderdelen je in Leonida Explorer hebt afgevinkt, uitgesplitst per hoofdstuk, gebied en categorie.</p><div class="progress-columns"><section class="progress-group"><h2>Hoofdstukken</h2>${chapters.map(n=>meter(core.chapter(chapterRecords,n),'Hoofdstuk '+n)).join('')}<p class="scope-note">Alleen hoofdstukken tot en met jouw keuze worden getoond.</p></section><section class="progress-group"><h2>Gebieden</h2>${areas.map(a=>meter(core.area(all,a.id),a.name)).join('')}${meter(all.filter(x=>!x.area),'Algemeen / regio nog onbevestigd')}</section><section class="progress-group"><h2>Categorieën</h2>${types.map(t=>meter(core.category(all,t.id),t.name)).join('')}</section></div></details>`;renderGameCompletion();}
 function openEditor(area){const form=editor.querySelector('form');form.reset();form.elements.area.value=area||areas[0].id;form.elements.chapter.value=model.chapter;editor.querySelector('#entry-error').textContent='';editor.showModal();}
 editor.querySelector('#close-editor').onclick=()=>editor.close();editor.querySelector('form').onsubmit=e=>{e.preventDefault();const form=e.target,values=new FormData(form);const item={id:'custom-'+crypto.randomUUID(),title:String(values.get('title')).trim(),detail:String(values.get('detail')).trim(),area:String(values.get('area')),category:String(values.get('category')),chapter:Number(values.get('chapter')),source:String(values.get('source')).trim(),type:'personal'};try{const next=validModel({...model,custom:[...model.custom,item]});const previous=model;model=next;if(!persist()){model=previous;throw Error('Opslag is niet beschikbaar.')}editor.close();renderExplore();notify('Eigen ontdekking toegevoegd.')}catch(err){editor.querySelector('#entry-error').textContent=err.message}};
 const baseUpdate=update;update=function(){baseUpdate();if(page==='explore')renderExplore();if(page==='collectibles')renderCollectibles();if(page==='activities')renderActivities();if(page==='challenges')renderChallenges();if(page==='progress')renderOverview()};
 function merge(incoming){const clean=validModel(incoming),items=new Map(model.custom.map(x=>[x.id,x]));for(const x of clean.custom)if(!items.has(x.id))items.set(x.id,x);model=validModel({...model,chapter:Math.min(lastChapter,Math.max(model.chapter,clean.chapter)),custom:[...items.values()],checked:[...new Set([...model.checked,...clean.checked])],notes:{...clean.notes,...model.notes},medals:core.mergeMedals(model.medals||{},clean.medals||{}),sales:{...model.sales,...clean.sales}});persist();syncChapterSlider();if(page==='explore')renderExplore();if(page==='collectibles')renderCollectibles();if(page==='activities')renderActivities();if(page==='challenges')renderChallenges();if(page==='progress')renderOverview()}
 window.ExplorerApp={exportData:()=>structuredClone(model),validate:validModel,merge,refresh:()=>{if(page==='explore')renderExplore();if(page==='collectibles')renderCollectibles();if(page==='activities')renderActivities();if(page==='challenges')renderChallenges();if(page==='progress')renderOverview()},reset:()=>{model=initial();persist();syncChapterSlider();window.leonidaPhotoContext=null;go('start')}};
 document.querySelectorAll('footer p').forEach(p=>{if(p.textContent.includes('VERSIE 1.1'))p.innerHTML='LEONIDA EXPLORER <span>· VERSIE 2.4 · BOUWVERSIE</span>'});
 // Stil omschakelen bij een volgende opening; niet tijdens het laatste afvinken.
 window.addEventListener('hashchange',()=>{const hash=location.hash.slice(1),next={map:'explore',stats:'progress',explore:'intro'}[hash]||hash;if(['start','intro','explore','collectibles','activities','challenges','progress','journal'].includes(next))go(next)});
 const entryHash=location.hash.slice(1);go(entryHash?({map:'explore',stats:'progress',explore:'intro'}[entryHash]||entryHash):(core.shouldAutoExplore([...ids],state.checked)?'explore':'start'));
})();
