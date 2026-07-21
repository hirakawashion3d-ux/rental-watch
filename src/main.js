const rankMeta = { A: ["優先度A", "rank-a"], B: ["優先度B", "rank-b"], CHECK: ["要確認候補", "rank-check"], HOLD: ["保留", "rank-hold"], ENDED: ["掲載終了", "rank-ended"] };
const statusMeta = { active: ["募集中", "status-active"], needs_confirmation: ["要確認", "status-check"], on_hold: ["保留・要電話確認", "status-hold"], ended: ["掲載終了", "status-ended"], invalid_url: ["URL無効", "status-ended"], applied: ["申込あり", "status-applied"], unknown: ["状態不明", "status-unknown"] };
const updateMeta = { new: "新着", relisted: "再掲載", price_drop: "値下げ", vacancy: "空室化", condition_change: "条件変更", rank_change: "優先度変更", status_change: "状態変更", ended: "掲載終了", correction: "情報訂正" };
const filters = [
  ["all", "すべて"], ["rank:A", "優先度A"], ["rank:B", "優先度B"], ["rank:CHECK", "要確認"], ["rank:HOLD", "保留"], ["rank:ENDED", "掲載終了"],
  ["area:中央区", "中央区"], ["area:清澄白河", "清澄白河"], ["area:森下", "森下"], ["area:菊川", "菊川"], ["floor", "2階以上"], ["size", "30㎡以上"], ["pet", "ペット相談可"], ["two", "二人入居可"], ["active", "募集中のみ"]
];
let properties = [], updates = [], currentFilter = "all";
const yen = new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 });
const date = new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Tokyo" });
const escapeHtml = (text = "") => String(text).replace(/[&<>'"]/g, (c) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" })[c]);
const badge = (meta, value) => `<span class="badge ${meta[value][1]}">${meta[value][0]}</span>`;
const missing = (v) => v === undefined || v === null || v === "" ? "未確認" : escapeHtml(v);
const displayDate = (value) => value ? date.format(new Date(value)) : "未確認";
const money = (v) => typeof v === "number" ? yen.format(v) : missing(v);

function matches(p) {
  if (currentFilter === "all") return true;
  if (currentFilter.startsWith("rank:")) return p.rank === currentFilter.slice(5);
  if (currentFilter.startsWith("area:")) return [p.areaName, p.address, ...p.stations.map(s => s.name)].join(" ").includes(currentFilter.slice(5));
  if (currentFilter === "floor") return (p.floor || 0) >= 2;
  if (currentFilter === "size") return p.area >= 30;
  if (currentFilter === "pet") return Boolean(p.pet && !p.pet.includes("不可"));
  if (currentFilter === "two") return Boolean(p.occupancy?.twoPeople || p.occupancy?.cohabitation);
  return p.status === "active";
}
function propertyCard(p, history = false) {
  const stations = p.stations?.map(s => `${escapeHtml(s.name)} 徒歩${escapeHtml(s.minutes)}分`).join(" / ") || "未確認";
  const availability = p.availability || {};
  const review = p.layoutReview || {}, building = p.buildingReview || {};
  const links = p.links?.map(l => `<li><a href="${escapeHtml(l.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(l.label)}</a> ${badge(statusMeta, l.status)}${l.note ? ` <span class="muted">${escapeHtml(l.note)}</span>` : ""}</li>`).join("") || "<li>未確認</li>";
  const amenities = [ ...p.amenities || [], p.pet, p.soundproofing ].filter(Boolean).map(a => `<span class="tag">${escapeHtml(a)}</span>`).join("") || "<span class=\"muted\">未確認</span>";
  const title = `${escapeHtml(p.name)}${p.room ? ` <span>${escapeHtml(p.room)}</span>` : ""}`;
  return `<article class="property-card" id="property-${escapeHtml(p.id)}">
    <div class="card-header"><div class="badges">${badge(rankMeta, p.rank)} ${badge(statusMeta, p.status)}</div><p class="checked">最終確認 ${displayDate(p.lastCheckedAt)}</p></div>
    <h3>${title}</h3><p class="summary">${escapeHtml(p.summary)}</p>
    <dl class="key-facts"><div><dt>総額</dt><dd>${money(p.totalMonthlyCost)}</dd></div><div><dt>間取り・面積</dt><dd>${missing(p.layout)} / ${missing(p.area)}㎡</dd></div><div><dt>階数</dt><dd>${p.floor ? `${p.floor}階${p.totalFloors ? ` / ${p.totalFloors}階建` : ""}` : "未確認"}</dd></div><div><dt>最寄り駅</dt><dd>${stations}</dd></div></dl>
    <details><summary>詳細を表示</summary>
      <div class="detail-grid"><section><h4>基本情報</h4><dl>${row("住所", p.address)}${row("対象エリア", p.areaName)}${row("賃料", money(p.rent))}${row("管理費", money(p.managementFee))}${row("敷金", money(p.deposit))}${row("礼金", money(p.keyMoney))}${row("築年月", p.built)}${row("方角", p.direction)}${row("入居可能", availability.moveInDate)}</dl></section>
      <section><h4>交通・通勤</h4><dl>${row("最寄り駅", stations)}${row("水天宮前駅まで", p.commute?.suitenguu)}${row("人形町駅まで", p.commute?.ningyocho)}${row("渋谷方面", p.commute?.shibuya)}${row("虎ノ門方面", p.commute?.toranomon)}</dl></section>
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
function render() {
  const visible = properties.filter(matches);
  const active = properties.filter(p => p.status === "active");
  const counts = { A: 0, B: 0, CHECK: 0, HOLD: 0 }; properties.filter(p => p.status !== "ended" && p.status !== "invalid_url").forEach(p => { if (counts[p.rank] !== undefined) counts[p.rank]++; });
  document.querySelector("#overview").innerHTML = `<div><span>最終更新</span><strong>${displayDate(Math.max(...properties.map(p => new Date(p.updatedAt))))}</strong></div><div><span>現在の募集中候補</span><strong>${active.length}件</strong></div><div class="count-pills">${["A","B","CHECK","HOLD"].map(r => `<span>${rankMeta[r][0]} <b>${counts[r]}</b></span>`).join("")}</div>`;
  document.querySelector("#filters").innerHTML = filters.map(([id,label]) => `<button class="filter ${id === currentFilter ? "selected" : ""}" data-filter="${id}" aria-pressed="${id === currentFilter}">${label}</button>`).join("");
  document.querySelectorAll(".filter").forEach(btn => btn.addEventListener("click", () => { currentFilter = btn.dataset.filter; render(); }));
  const sortedUpdates = [...updates].sort((a,b) => new Date(b.timestamp)-new Date(a.timestamp));
  document.querySelector("#updates").innerHTML = sortedUpdates.map(u => { const p = properties.find(x => x.id === u.propertyId); return `<article class="update"><p class="update-date">${displayDate(u.timestamp)} ${updateMeta[u.type]}</p><h3>${escapeHtml(u.title)}</h3><p>${escapeHtml(u.description)}</p>${u.previousValue || u.newValue ? `<p class="change"><span>変更前 ${escapeHtml(u.previousValue || "—")}</span><span>変更後 ${escapeHtml(u.newValue || "—")}</span></p>` : ""}<p class="update-links">${p ? `<a href="#property-${escapeHtml(p.id)}">物件カードへ</a>` : ""}${p?.links?.[0] ? ` <a href="${escapeHtml(p.links[0].url)}" target="_blank" rel="noopener noreferrer">外部物件URL</a>` : ""}</p></article>`).join("") || empty();
  const order = ["A", "B", "CHECK", "HOLD"];
  const rankings = order.map(r => { const list = visible.filter(p => p.rank === r && !["ended","invalid_url"].includes(p.status)).sort((a,b)=>new Date(b.lastCheckedAt)-new Date(a.lastCheckedAt)); return list.length ? `<section class="rank-group"><h3>${rankMeta[r][0]} <span>${list.length}件</span></h3>${list.map(p => propertyCard(p)).join("")}</section>` : ""; }).join("");
  document.querySelector("#rankings").innerHTML = rankings || empty();
  const history = [...visible].sort((a,b) => new Date(b.updatedAt)-new Date(a.updatedAt));
  document.querySelector("#history-count").textContent = `${history.length}件表示`;
  document.querySelector("#history-list").innerHTML = history.map(p => propertyCard(p,true)).join("") || empty();
}
function empty() { return document.querySelector("#empty-template").innerHTML; }
Promise.all([fetch("data/properties.json"), fetch("data/updates.json")]).then(async ([p,u]) => { if (!p.ok || !u.ok) throw new Error("データを読み込めませんでした。"); properties = await p.json(); updates = await u.json(); render(); }).catch(error => { document.querySelector("main").insertAdjacentHTML("afterbegin", `<p class="error" role="alert">${escapeHtml(error.message)}</p>`); });
