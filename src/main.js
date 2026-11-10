const rankMeta={A:["旧優先度A","rank-a"],B:["旧優先度B","rank-b"],CHECK:["要確認","rank-check"],HOLD:["保留","rank-hold"]};
const statusMeta={active:["掲載時募集中","status-active"],needs_confirmation:["要確認","status-check"],on_hold:["保留","status-hold"],ended:["掲載終了記録","status-ended"],unknown:["未確認","status-unknown"]};
const yen = new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 });
const date = new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Tokyo" });
const escapeHtml = (text = "") => String(text).replace(/[&<>'"]/g, (c) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" })[c]);
const badge = (meta, value) => { const item = meta[value] || meta.unknown || ["未確認", "status-unknown"]; return `<span class="badge ${item[1]}">${item[0]}</span>`; };
const missing = (v) => v === undefined || v === null || v === "" ? "未確認" : escapeHtml(v);
const displayDate = (value) => value ? date.format(new Date(value)) : "未確認";
const money = (v) => typeof v === "number" ? yen.format(v) : missing(v);
const isCurrent = (p) => p.rank !== "ENDED" && !["ended", "invalid_url"].includes(p.status);


function propertyCard(p) {
  const historical = isStale(p);
  const stations = p.stations?.map(s => `${escapeHtml(s.name)} 徒歩${escapeHtml(s.minutes)}分`).join(" / ") || "未確認";
  const availability = p.availability || {};
  const review = p.layoutReview || {}, building = p.buildingReview || {};
  const links = p.links?.map(l => `<li><a href="${escapeHtml(l.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(l.label)}</a> ${badge(statusMeta, historical ? "needs_confirmation" : l.status)}${l.note ? ` <span class="muted">${escapeHtml(l.note)}</span>` : ""}</li>`).join("") || "<li>未確認</li>";
  const amenities = [ ...p.amenities || [], p.pet, p.soundproofing ].filter(Boolean).map(a => `<span class="tag">${escapeHtml(a)}</span>`).join("") || "<span class=\"muted\">未確認</span>";
  const title = `${escapeHtml(p.name)}${p.room ? ` <span>${escapeHtml(p.room)}</span>` : ""}`;
  return `<article class="property-card" id="property-${escapeHtml(p.id)}">
    <div class="card-header"><div class="badges">${historical ? `<span class="badge status-check">旧情報・要再確認</span><span class="badge">旧${(rankMeta[p.rank] || ["評価なし"])[0]}</span>` : `${badge(rankMeta, p.rank)} ${badge(statusMeta, p.status)}`}</div><p class="checked">最終確認 ${displayDate(p.lastCheckedAt)}</p></div>
    <h3>${title}</h3><p class="summary">${historical ? "以下は最終確認日時点の記録です。現在の募集状況・価格・今回条件への適合は未確認。<br>" : ""}${escapeHtml(p.summary)}</p>
    <dl class="key-facts"><div><dt>総額</dt><dd>${money(p.totalMonthlyCost)}</dd></div><div><dt>間取り・面積</dt><dd>${missing(p.layout)} / ${missing(p.area)}㎡</dd></div><div><dt>階数</dt><dd>${p.floor ? `${p.floor}階${p.totalFloors ? ` / ${p.totalFloors}階建` : ""}` : "未確認"}</dd></div><div><dt>最寄り駅</dt><dd>${stations}</dd></div></dl>
    <details><summary>詳細を表示</summary>
      <div class="detail-grid"><section><h4>基本情報</h4><dl>${row("住所", p.address)}${row("対象エリア", p.areaName)}${row("賃料", money(p.rent))}${row("管理費", money(p.managementFee))}${row("敷金", money(p.deposit))}${row("礼金", money(p.keyMoney))}${row("築年月", p.built)}${row("方角", p.direction)}${row("入居可能", availability.moveInDate)}</dl></section>
      <section><h4>旧条件での交通・通勤（参考記録）</h4><dl>${row("最寄り駅", stations)}${row("水天宮前駅まで", p.commute?.suitenguu)}${row("人形町駅まで", p.commute?.ningyocho)}${row("渋谷方面", p.commute?.shibuya)}${row("虎ノ門方面", p.commute?.toranomon)}</dl></section>
      <section><h4>入居条件</h4><dl>${row("二人入居可", p.occupancy?.twoPeople ? "可" : "未確認")}${row("同棲可", p.occupancy?.cohabitation ? "可" : "未確認")}${row("ルームシェア可", p.occupancy?.roomShare ? "可" : "未確認")}${row("単身限定", p.occupancy?.singleOnly ? "はい" : "未確認")}${row("根拠", p.occupancy?.evidence)}</dl></section>
      <section><h4>掲載確認</h4><dl>${row("現況", availability.occupancyStatus)}${row("掲載更新日", availability.listingUpdatedAt)}${row("空室・複数サイト", availability.consistency)}${row("URL確認", availability.urlCheck)}${row("電話確認", availability.phoneCheckRequired ? "要" : "不要・未確認")}${row("注意事項", availability.notes)}</dl></section></div>
      <section><h4>設備</h4><div class="tags">${amenities}</div></section>
      <div class="detail-grid"><section><h4>間取り・家具配置評価</h4><dl>${row("和室なしの根拠", review.noJapaneseRoomEvidence)}${row("ベッド候補", review.bedPosition)}${row("作業机候補", review.deskPosition)}${row("ダイニング候補", review.diningPosition)}${row("動線", review.circulation)}${row("生活空間とベッドを分離", review.bedSeparated === undefined ? "未確認" : review.bedSeparated ? "可能" : "難しい")}${row("うなぎの寝床型", review.narrowRailroadLayout === undefined ? "未確認" : review.narrowRailroadLayout ? "はい" : "いいえ")}${row("家具配置自由度", review.furnitureFlexibility)}${row("二人暮らし", review.coupleLiving)}${row("注意点", review.notes?.join(" / "))}</dl></section>
      <section><h4>建物・築年評価</h4><dl>${row("築年数評価", building.ageEvaluation)}${row("リノベーション", building.renovation)}${row("配管更新", building.plumbing)}${row("共用部管理", building.commonArea)}${row("耐震", building.seismic)}${row("防音", building.soundproofing)}${row("1階の注意", building.firstFloorRisk)}${row("浸水リスク", building.flooding)}${row("日当たり", building.sunlight)}${row("湿気", building.humidity)}${row("外からの視線", building.outsideView)}${row("ゴミ置場", building.garbageDistance)}</dl></section></div>
      <section><h4>URL・確認ページ</h4><ul class="link-list">${links}</ul></section>
    </details>
  </article>`;
}
function row(label, value) { return `<div><dt>${label}</dt><dd>${missing(value)}</dd></div>`; }


const featureLabels=[["cornerRoom","角部屋"],["rcStructure","RC造（鉄筋コンクリート）"],["bathToilet","バス・トイレ別"],["washstand","独立洗面台"],["indoorLaundry","室内洗濯機置場"],["dryer","浴室乾燥機"],["reheat","追い焚き"],["washlet","温水洗浄便座"],["autoLock","オートロック"],["monitor","TVモニター付インターホン"],["delivery","宅配ボックス"],["elevator","エレベーター"],["aircon","エアコン"],["twoBurners","2口以上コンロ"],["internetFree","インターネット無料"],["secondFloor","2階以上"],["topFloor","最上階"],["southFacing","南向き"],["petAllowed","ペット相談可"],["parking","駐車場"],["bicycle","駐輪場"],["balcony","バルコニー"]];
function featureValue(p,key){
 if(p.features&&Object.hasOwn(p.features,key))return typeof p.features[key]==="boolean"?p.features[key]:null;
 if(key==="cornerRoom"&&typeof p.cornerRoom==="boolean")return p.cornerRoom;
 if(key==="rcStructure"&&p.structure)return p.structure==="RC";
 if(key==="secondFloor"&&typeof p.floor==="number")return p.floor>=2;
 if(key==="topFloor"&&typeof p.floor==="number"&&typeof p.totalFloors==="number")return p.floor===p.totalFloors;
 const aliases={cornerRoom:["角部屋"],bathToilet:["バス・トイレ別","バストイレ別"],washstand:["独立洗面台","洗面所独立"],indoorLaundry:["室内洗濯機置場"],dryer:["浴室乾燥機"],reheat:["追焚き","追い焚き"],washlet:["温水洗浄便座"],autoLock:["オートロック"],monitor:["TVモニター付インターホン","モニター付インターホン"],delivery:["宅配ボックス"],elevator:["エレベーター"],aircon:["エアコン"],twoBurners:["2口コンロ","2口システムキッチン","3口コンロ"],internetFree:["インターネット無料"],bicycle:["駐輪場"],balcony:["バルコニー"]};
 return (aliases[key]||[]).some(a=>(p.amenities||[]).includes(a))?true:null;
}
function mergedProperties(){return properties.map(p=>({...p,...state.overrides[p.id],features:{...p.features,...state.overrides[p.id]?.features}})).concat(state.links.filter(l=>l.property).map(l=>({...l.property,id:l.id,links:[{url:l.url,label:"保存した元ページ"}]})));}

const defaults={basis:"rent",budget:"150000",minArea:"",walk:"",layout:"",keyword:"",nihonbashi:"",meguro:"",archiveDays:"30",two:true,unknown:true,corner:true,rc:true,"feat_cornerRoom":"prefer","feat_rcStructure":"prefer","feat_bathToilet":"","feat_washstand":"","feat_indoorLaundry":"","feat_dryer":"","feat_reheat":"","feat_washlet":"","feat_autoLock":"","feat_monitor":"","feat_delivery":"","feat_elevator":"","feat_aircon":"","feat_twoBurners":"","feat_internetFree":"","feat_secondFloor":"","feat_topFloor":"","feat_southFacing":"","feat_petAllowed":"","feat_parking":"","feat_bicycle":"","feat_balcony":""};
const storageKey="rental-watch-workspace-v2";
let state={prefs:{...defaults},archived:[],restored:[],links:[],overrides:{}},properties=[],updates=[];
function safeUrl(value){try{const u=new URL(value);return u.protocol==="https:"&&!u.username&&!u.password?u.href:null}catch{return null}}
function isStale(p,now=Date.now()){const t=Date.parse(p.lastCheckedAt);return !Number.isFinite(t)||now-t>Number(state.prefs.archiveDays||30)*86400000}
function archiveReason(p){if(state.archived.includes(p.id))return "自分で保管";if(state.restored.includes(p.id))return "";if(["ended","invalid_url"].includes(p.status)||p.rank==="ENDED")return "掲載終了・URL無効の記録";return Number(state.prefs.archiveDays)>0&&isStale(p)?"古い情報・再確認待ち":""}
function assess(p,prefs=state.prefs){
 const unknown=[],failed=[];const check=(condition,label)=>{if(condition===null)unknown.push(label);else if(!condition)failed.push(label)};
 const number=(key,value,mode,label)=>{if(prefs[key]!=="")check(typeof value!=="number"?null:mode==="min"?value>=Number(prefs[key]):value<=Number(prefs[key]),label)};
 number("budget",p[prefs.basis],"max","月額");number("minArea",p.area,"min","面積");
 const walks=(p.stations||[]).map(s=>s.minutes).filter(n=>typeof n==="number");number("walk",walks.length?Math.min(...walks):null,"max","駅徒歩");
 number("nihonbashi",p.commuteMinutes?.nihonbashi,"max","日本橋通勤");number("meguro",p.commuteMinutes?.meguro,"max","目黒通勤");
 if(prefs.layout)check(p.layout?p.layout.split(/[（( ]/)[0]===prefs.layout:null,"間取り");
 if(prefs.two){const o=p.occupancy||{};check(o.singleOnly||o.twoPeople===false?false:o.twoPeople===true||o.cohabitation===true?true:null,"二人入居");}
 if(prefs.keyword)check([p.name,p.address,p.areaName,...(p.stations||[]).map(s=>s.name)].join(" ").includes(prefs.keyword.trim()),"エリア・物件名");
 if(isStale(p))unknown.push("情報の鮮度");
 let score=0;for(const [key,label] of featureLabels){const mode=prefs["feat_"+key];if(!mode)continue;const value=featureValue(p,key);if(mode==="require")check(value,label);else if(mode==="prefer"&&value===true)score++;}
 return {unknown,failed,score};
}
function persist(message="保存しました。このブラウザー内で再訪時も保持します。"){
 try{localStorage.setItem(storageKey,JSON.stringify(state));document.querySelector("#save-status").textContent=message;return true}
 catch{document.querySelector("#save-status").textContent="保存できませんでした。容量・ブラウザー設定を確認してください。変更はこの画面だけです。";return false}
}
function cardWithControls(p,result,reason){
 return '<div class="candidate"><p class="match-note">'+escapeHtml(reason|| (result.unknown.length?"要確認："+result.unknown.join("・"):"指定条件と一致"))+(result.score?" ／希望一致 "+result.score+"点":"")+'</p>'+propertyCard(p)+'<button data-property="'+escapeHtml(p.id)+'" data-action="'+(reason?"restore":"archive")+'">'+(reason?"比較に戻す":"保管する")+'</button> <button data-edit="'+escapeHtml(p.id)+'">情報を確認・編集</button><p class="muted">'+escapeHtml(p.factSource?"設備・数値の出典："+p.factSource+" ／確認 "+(p.factCheckedAt||"未記入")+(p.factNote?" ／"+p.factNote:""):"設備は保存済みの記録を参照。記載なしは不明のままです。")+'</p></div>';
}
function render(){
 const active=[],archived=[];for(const p of mergedProperties()){const reason=archiveReason(p);if(reason||state.links.find(l=>l.id===p.id)?.archived)archived.push({p,reason:reason||"自分で保管"});else active.push({p,r:assess(p)})}
 const eligible=active.filter(x=>!x.r.failed.length).sort((a,b)=>b.r.score-a.r.score);
 const matched=eligible.filter(x=>!x.r.unknown.length),uncertain=eligible.filter(x=>x.r.unknown.length);
 const empty='<p class="empty-state">該当なし。条件を緩めるか、保管庫も確認できます。</p>';
 document.querySelector("#matches").innerHTML=matched.map(x=>cardWithControls(x.p,x.r,"")).join("")||empty;
 document.querySelector("#uncertain").innerHTML=state.prefs.unknown?(uncertain.map(x=>cardWithControls(x.p,x.r,"")).join("")||empty):'<p>未確認の候補は設定で非表示にしています。</p>';
 document.querySelector("#archive-list").innerHTML=archived.map(x=>cardWithControls(x.p,assess(x.p),x.reason)).join("")||'<p>保管中の物件はありません。</p>';
 document.querySelector("#overview").textContent="一致 "+matched.length+"件 ／要確認 "+uncertain.length+"件 ／条件外 "+active.filter(x=>x.r.failed.length).length+"件 ／保管 "+archived.length+"件";
 const sorted=[...updates].sort((a,b)=>Date.parse(b.timestamp)-Date.parse(a.timestamp));
 const history=u=>'<article class="update"><small>'+displayDate(u.timestamp)+'</small><h3>'+escapeHtml(u.title)+'</h3><p>'+escapeHtml(u.description)+'</p></article>';
 document.querySelector("#updates").innerHTML=sorted.slice(0,5).map(history).join("")+'<details><summary>以前の履歴 '+Math.max(0,sorted.length-5)+'件を表示</summary>'+sorted.slice(5).map(history).join("")+'</details>';
 renderLinks();
}
function renderLinks(){
 const make=l=>{const url=safeUrl(l.url);if(!url)return "";const known=mergedProperties().find(p=>(p.links||[]).some(x=>x.url===url));const img=/^data:image\/(jpeg|png|webp);base64,/.test(l.image||"")?'<img alt="追加した物件画像" src="'+escapeHtml(l.image)+'" loading="lazy">':'<div class="preview-placeholder">画像なし · LINK</div>';
 return '<article class="preview-card">'+img+'<div><small>'+escapeHtml(new URL(url).hostname)+'</small><h3><a href="'+escapeHtml(url)+'" target="_blank" rel="noopener noreferrer">'+escapeHtml(l.title||known?.name||new URL(url).hostname)+'</a></h3><p>'+escapeHtml(known?.summary||"未確認の追加URL。リンク先で募集条件をご確認ください。")+'</p><button data-link="'+escapeHtml(l.id)+'">'+(l.archived?"戻す":"保管する")+'</button> <button data-edit="'+escapeHtml(l.id)+'">取得・確認して比較に追加</button></div></article>'};
 document.querySelector("#link-cards").innerHTML=state.links.filter(l=>!l.archived).map(make).join("")||"<p>物件URLを追加してください。</p>";
 document.querySelector("#archived-links").innerHTML=state.links.filter(l=>l.archived).map(make).join("")||"<p>ありません。</p>";
}
function fillForm(){const f=document.querySelector("#preferences");for(const [k,v] of Object.entries(state.prefs)){const e=f.elements.namedItem(k);if(!e)continue;if(e.type==="checkbox")e.checked=Boolean(v);else e.value=v}}
try{const saved=JSON.parse(localStorage.getItem(storageKey)||"null");if(saved){state={prefs:{...defaults,...saved.prefs,feat_cornerRoom:saved.prefs?.feat_cornerRoom??(saved.prefs?.corner?"prefer":""),feat_rcStructure:saved.prefs?.feat_rcStructure??(saved.prefs?.rc?"prefer":"")},archived:Array.isArray(saved.archived)?saved.archived:[],restored:Array.isArray(saved.restored)?saved.restored:[],links:Array.isArray(saved.links)?saved.links:[],overrides:saved.overrides&&typeof saved.overrides==="object"?saved.overrides:{}}}}catch{}
for(const [key] of featureLabels){if(state.prefs["feat_"+key]===undefined)state.prefs["feat_"+key]="";}
document.querySelector("#feature-filters").innerHTML=featureLabels.map(([k,l])=>'<label>'+l+'<select name="feat_'+k+'"><option value="">指定なし</option><option value="prefer">希望（加点）</option><option value="require">必須</option></select></label>').join("");
fillForm();
document.querySelector("#preferences").addEventListener("submit",e=>{e.preventDefault();for(const k of Object.keys(defaults)){const el=e.target.elements.namedItem(k);state.prefs[k]=el.type==="checkbox"?el.checked:el.value}persist();render()});
document.querySelector("#reset-prefs").addEventListener("click",()=>{state.prefs={...defaults};fillForm();persist("検索条件だけを初期値に戻しました。候補・画像は残しています。");render()});
document.addEventListener("click",e=>{
 const tab=e.target.closest("[data-view]");if(tab){document.querySelectorAll(".view").forEach(x=>x.hidden=x.id!==tab.dataset.view);document.querySelectorAll("[data-view]").forEach(x=>x.setAttribute("aria-pressed",x===tab));}
 const p=e.target.closest("[data-property]");if(p){const id=p.dataset.property;const savedLink=state.links.find(l=>l.id===id);if(savedLink)savedLink.archived=p.dataset.action==="archive";if(p.dataset.action==="archive"){state.archived=[...new Set([...state.archived,id])];state.restored=state.restored.filter(x=>x!==id)}else{state.archived=state.archived.filter(x=>x!==id);state.restored=[...new Set([...state.restored,id])]}persist();render()}
 const edit=e.target.closest("[data-edit]");if(edit)openEditor(edit.dataset.edit);
 const l=e.target.closest("[data-link]");if(l){const item=state.links.find(x=>x.id===l.dataset.link);if(item){item.archived=!item.archived;persist();renderLinks()}}
});
document.querySelector("#add-link").addEventListener("submit",async e=>{
 e.preventDefault();const f=e.target,url=safeUrl(f.elements.url.value);const status=document.querySelector("#link-status");
 if(!url){status.textContent="httpsの公開物件URLを入力してください。認証情報を含むURLは保存できません。";return}
 if(state.links.some(x=>x.url===url)){status.textContent="同じURLは保存済みです（保管庫も確認してください）。";return}
 const file=f.elements.image.files[0];if(file&&(file.size>2*1024*1024||!["image/jpeg","image/png","image/webp"].includes(file.type))){status.textContent="JPEG・PNG・WebPの2MB以下の画像を選んでください。";return}
 let image="";if(file){try{image=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)})}catch{status.textContent="画像を読み込めませんでした。";return}}
 const entry={id:"link-"+Date.now(),url,title:f.elements.title.value.trim(),image,archived:false};state.links.push(entry);if(!persist()){state.links.pop();status.textContent="保存容量が不足している可能性があります。小さい画像か画像なしでお試しください。";return}
 f.reset();status.textContent="カードをこのブラウザーに保存しました。";renderLinks();
});
const examples=[
 {id:"example-nishikoyama",name:"西小山 徒歩4分",rank:"CHECK",status:"needs_confirmation",summary:"11月10日の会話内調査例。現在の募集・必須月額費用は再確認。",rent:130000,managementFee:5000,totalMonthlyCost:135000,area:42.1,layout:"2DK",built:"1994",stations:[{name:"西小山",minutes:4}],occupancy:{twoPeople:true},lastCheckedAt:"2026-11-10T00:00:00+09:00",links:[{label:"HOME'S",url:"https://www.homes.co.jp/chintai/b-1270350001645/"}]},
 {id:"example-south-hills",name:"サウスヒルズK",room:"202",rank:"CHECK",status:"needs_confirmation",summary:"11月10日の会話内調査例。管理費「－」を0円とはせず、二人入居・総額・募集は要確認。",rent:120000,area:38.5,layout:"2DK",stations:[{name:"馬込",minutes:12},{name:"西馬込",minutes:12}],lastCheckedAt:"2026-11-10T00:00:00+09:00",links:[{label:"HOME'S",url:"https://www.homes.co.jp/chintai/room/823585c9e7059a5b910cd44ba30de43ab0beedaa/"}]}
];
for(const fresh of [{"id":"example-nishikoyama","floor":2,"totalFloors":5,"built":"1994-04","direction":"東","structure":"RC","features":{"cornerRoom":true,"rcStructure":true,"bathToilet":true,"indoorLaundry":true,"washstand":true,"autoLock":true,"elevator":true,"aircon":true,"washlet":true,"reheat":false,"southFacing":false,"parking":false,"petAllowed":false},"factSource":"https://www.homes.co.jp/chintai/b-1270350001645/","factCheckedAt":"2026-11-10","summary":"11月10日HOME'S公開本文確認。家賃＋管理費13.5万円。その他必須月額費用・申込有無は要確認。"},{"id":"example-south-hills","floor":2,"totalFloors":2,"built":"1994-05","direction":"南","structure":"木造","features":{"cornerRoom":true,"rcStructure":false,"bathToilet":true,"indoorLaundry":true,"autoLock":false,"aircon":true,"washlet":true,"reheat":true,"southFacing":true,"parking":false,"petAllowed":false,"monitor":true,"bicycle":true},"factSource":"https://www.homes.co.jp/chintai/room/823585c9e7059a5b910cd44ba30de43ab0beedaa/","factCheckedAt":"2026-11-10","summary":"11月10日HOME'S公開本文確認。木造・南向き最上階角部屋。管理費「－」は不明のまま。二人入居・申込有無は要確認。"}])Object.assign(examples.find(p=>p.id===fresh.id),fresh);
Promise.all([fetch("data/properties.json"),fetch("data/updates.json")]).then(async([p,u])=>{if(!p.ok||!u.ok)throw Error("データを読み込めませんでした。再読み込みしてください。");properties=[...examples,...await p.json()];updates=await u.json();render()}).catch(e=>document.querySelector("#overview").textContent=e.message);

let editingId="";
const numericFields=["rent","managementFee","area"];
function openEditor(id){
 editingId=id;const p=mergedProperties().find(x=>x.id===id)||{},l=state.links.find(x=>x.id===id);
 const f=document.querySelector("#facts");f.reset();f.elements.source.value=p.factSource||p.links?.[0]?.url||l?.url||"";f.elements.name.value=p.name||l?.title||"追加物件";
 numericFields.forEach(k=>f.elements[k].value=typeof p[k]==="number"?p[k]:"");f.elements.layout.value=p.layout||"";f.elements.twoPeople.value=typeof p.occupancy?.twoPeople==="boolean"?String(p.occupancy.twoPeople):"";
 document.querySelector("#fact-features").innerHTML=featureLabels.map(([key,label])=>'<label>'+label+'<select name="fact_'+key+'"><option value="">不明</option><option value="true">あり・該当</option><option value="false">なし・非該当</option></select></label>').join("");
 featureLabels.forEach(([key])=>{const v=featureValue(p,key);f.elements["fact_"+key].value=v===null?"":String(v)});
 document.querySelector("#fact-name").textContent="元の記録は残し、確認した情報を重ねて保存します。";
 document.querySelector("#fetch-status").textContent="";document.querySelector("#fact-editor").showModal();
}
function parseFactsText(text){
 const result={features:{}};
 const rules={cornerRoom:/角部屋/,rcStructure:/鉄筋コンクリート|\bRC\b/,bathToilet:/バス[・、]?トイレ別|バストイレ別/,washstand:/独立洗面台|洗面所独立/,indoorLaundry:/室内洗濯機置場|洗濯機置場.*室内/,dryer:/浴室乾燥機/,reheat:/追い?焚き?/,washlet:/温水洗浄便座/,autoLock:/オートロック/,monitor:/TVモニタ|TV付|モニター付インターホン/,delivery:/宅配ボックス/,elevator:/エレベーター/,aircon:/エアコン/,twoBurners:/[23２３]口.*コンロ|コンロ.*[23２３]口/,internetFree:/インターネット無料|ネット無料/,bicycle:/駐輪場/,balcony:/バルコニー/};
 // Only isolated positive lines are proposed. Whole-page recommendation blocks must not be used.
 for(const line of text.split(/\n/).map(x=>x.trim()).filter(x=>x&&x.length<90)){
  if(/なし|無し|不可|未確認|非該当|対象外|相談|おすすめ|希望|条件|検索/.test(line))continue;
  for(const [k,re] of Object.entries(rules))if(re.test(line))result.features[k]=true;
 }
 return result;
}
function applyText(){const f=document.querySelector("#facts"),r=parseFactsText(f.elements.text.value);let count=0;for(const[k,v]of Object.entries(r.features)){const el=f.elements["fact_"+k];if(el&&el.value===""){el.value=String(v);count++}}
 document.querySelector("#fetch-status").textContent=count+"項目の候補を補いました。推薦物件や検索条件が混ざっていないか、元ページと照合してから保存してください。金額と不明項目は手入力できます。";}
document.querySelector("#parse-facts").addEventListener("click",applyText);
document.querySelector("#close-facts").addEventListener("click",()=>document.querySelector("#fact-editor").close());
document.querySelector("#fetch-facts").addEventListener("click",async e=>{
 const f=document.querySelector("#facts"),url=safeUrl(f.elements.source.value),s=document.querySelector("#fetch-status");
 const allowed=["www.homes.co.jp","suumo.jp","www.chintai.net","www.athome.co.jp","www.housecom.jp","myhome.nifty.com","web.canary-app.jp"];
 if(!url||!allowed.includes(new URL(url).hostname)){s.textContent="対応する公開物件サイトのURLを指定してください。未対応サイトは詳細本文を貼り付けて確認できます。";return}
 const target=editingId;e.target.disabled=true;s.textContent="公開ページを取得中…";
 try{const r=await fetch(url,{credentials:"omit",mode:"cors",referrerPolicy:"no-referrer",signal:AbortSignal.timeout(12000)});
 if(!r.ok)throw Error("HTTP "+r.status);const text=await r.text();if(text.length>3000000)throw Error("ページが大きすぎます");
 if(editingId!==target||!document.querySelector("#fact-editor").open)return;
 const doc=new DOMParser().parseFromString(text,"text/html");doc.querySelectorAll("script,style,nav,header,footer").forEach(x=>x.remove());
 f.elements.text.value=(doc.body?.textContent||"").slice(0,30000);s.textContent="本文を取得しました。この部屋の設備欄だけに絞ってから「本文から候補」を押してください。";
 }catch(err){if(editingId===target)s.textContent="このブラウザーでは取得できませんでした（通信・サイトのCORS制限等）。元ページの詳細本文を貼り付けるか、確認項目を編集してください。取得済みにはしていません。";}
 finally{e.target.disabled=false}
});
document.querySelector("#facts").addEventListener("submit",e=>{
 e.preventDefault();const f=e.target,url=safeUrl(f.elements.source.value);if(!url)return;
 const old=mergedProperties().find(x=>x.id===editingId)||{},patch={name:f.elements.name.value.trim(),features:{},factSource:url,factCheckedAt:new Date().toISOString(),factNote:f.elements.note.value};
 for(const k of numericFields)patch[k]=f.elements[k].value===""?null:Number(f.elements[k].value);
 patch.totalMonthlyCost=typeof patch.rent==="number"&&typeof patch.managementFee==="number"?patch.rent+patch.managementFee:null;
 patch.layout=f.elements.layout.value;patch.occupancy={...old.occupancy,twoPeople:f.elements.twoPeople.value===""?null:f.elements.twoPeople.value==="true"};
 for(const[k]of featureLabels)patch.features[k]=f.elements["fact_"+k].value===""?null:f.elements["fact_"+k].value==="true";
 const backup=JSON.stringify(state),link=state.links.find(l=>l.id===editingId);
 if(link)link.property={...old,...patch,id:link.id,status:"needs_confirmation",summary:"本人確認入力。募集の申込有無は未確認。",lastCheckedAt:old.lastCheckedAt||patch.factCheckedAt};
 else state.overrides[editingId]={...state.overrides[editingId],...patch};
 if(!persist()){state=JSON.parse(backup);return}
 document.querySelector("#fact-editor").close();render();
});
