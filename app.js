(function drawIcon() {
  const c = document.createElement("canvas"); c.width = 180; c.height = 180;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#1c1c1e"; ctx.fillRect(0, 0, 180, 180);
  ctx.fillStyle = "#248a3d"; ctx.beginPath(); ctx.roundRect(14, 74, 10, 32, 4); ctx.roundRect(156, 74, 10, 32, 4); ctx.fill();
  ctx.fillStyle = "#30d158"; ctx.beginPath(); ctx.roundRect(28, 62, 18, 56, 6); ctx.roundRect(134, 62, 18, 56, 6); ctx.fillRect(46, 83, 88, 14); ctx.fill();
  ctx.beginPath(); ctx.arc(90, 90, 26, 0, Math.PI * 2); ctx.fillStyle = "#121214"; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = "#30d158"; ctx.stroke();
  ctx.fillStyle = "#ffffff"; ctx.font = "900 32px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("$", 90, 92);
  document.getElementById("appleIcon").href = c.toDataURL("image/png");
})();

const TASKS = [
  { key: "pushups", label: "25 Pushups" },
  { key: "situps", label: "25 Situps" },
  { key: "crunches", label: "25 Crunches" },
  { key: "steps", label: "10,000 Steps" }
];
let toastTimer = null;
const todayStr = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };

let state = {
  wallet: 0, lastActiveDate: todayStr(),
  tasks: { pushups: false, situps: false, crunches: false, steps: false },
  wishlist: [{ name: "", price: "" }, { name: "", price: "" }, { name: "", price: "" }, { name: "", price: "" }, { name: "", price: "" }],
  notes: [{ text: "", num: "" }, { text: "", num: "" }, { text: "", num: "" }],
  history: {}
};

function loadState() {
  try {
    const s = JSON.parse(localStorage.getItem("fitEarnState_v1"));
    if (s) { state = { ...state, ...s }; if (!state.notes || state.notes.length !== 3) state.notes = [{ text: "", num: "" }, { text: "", num: "" }, { text: "", num: "" }]; }
  } catch (e) {}
  if (state.lastActiveDate !== todayStr()) { state.tasks = { pushups: false, situps: false, crunches: false, steps: false }; state.lastActiveDate = todayStr(); saveState(); }
}

function saveState() { try { localStorage.setItem("fitEarnState_v1", JSON.stringify(state)); } catch (e) {} }

function toggleTask(key) {
  const chk = document.getElementById("chk-" + key);
  state.tasks[key] = chk.checked;
  state.wallet = chk.checked ? state.wallet + 5 : Math.max(0, state.wallet - 5);
  const earned = Object.values(state.tasks).filter(Boolean).length * 5;
  if (earned > 0) state.history[todayStr()] = earned; else delete state.history[todayStr()];
  saveState();
  const w = document.getElementById("walletDisplay"); w.classList.remove("pulse"); void w.offsetWidth; w.classList.add("pulse");
  setTimeout(() => w.classList.remove("pulse"), 200);
  renderStats();
}

function updateWish(i, f, v) { state.wishlist[i][f] = v; saveState(); renderStats(); }
function updateNote(i, f, v) { state.notes[i][f] = v; saveState(); renderNotesSum(); }

function buyItem(i) {
  const p = parseFloat(state.wishlist[i].price) || 0;
  if (p <= 0 || state.wallet < p) return;
  const n = state.wishlist[i].name.trim() || "Item #" + (i + 1);
  state.wallet -= p; state.wishlist.splice(i, 1); state.wishlist.push({ name: "", price: "" });
  saveState(); renderAll(); showToast("Purchased: " + n, "Deducted $" + p.toFixed(2) + " from wallet!");
}

function peekItem(i) {
  const p = parseFloat(state.wishlist[i].price) || 0, n = state.wishlist[i].name.trim() || "Slot " + (i + 1);
  if (p <= 0) return showToast(n, "Enter a price first.");
  const rem = Math.max(0, p - state.wallet), d = Math.ceil(rem / 20);
  showToast(n + " ($" + p.toFixed(2) + ")", rem === 0 ? "Enough in wallet to buy!" : "$" + rem.toFixed(2) + " left • " + d + "d | " + (d / 7).toFixed(1) + "w | " + (d / 30).toFixed(1) + "m");
}

function showToast(t, sub) {
  const el = document.getElementById("toast"); el.innerHTML = "<strong style='color:#30d158;display:block;margin-bottom:4px;'>" + t + "</strong>" + sub; el.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), 3000);
}

function renderNotesSum() {
  const sum = state.notes.reduce((a, b) => a + (parseFloat(b.num) || 0), 0);
  document.getElementById("notesTotalDisplay").textContent = Number.isInteger(sum) ? sum : sum.toFixed(2);
}

function renderStats() {
  document.getElementById("dateDisplay").textContent = todayStr();
  document.getElementById("walletDisplay").textContent = "$" + state.wallet.toFixed(2).replace(/\.00$/, "");
  const earned = Object.values(state.tasks).filter(Boolean).length * 5;
  document.getElementById("todayDisplay").textContent = "Earned today: $" + earned + " / $20";
  TASKS.forEach(t => { const r = document.getElementById("row-" + t.key); if (r) r.classList.toggle("completed", !!state.tasks[t.key]); });
  let tot = 0;
  state.wishlist.forEach((item, i) => {
    const p = parseFloat(item.price) || 0; if (p > 0) tot += p;
    const b = document.getElementById("buy-" + i); if (b) b.disabled = !(p > 0 && state.wallet >= p);
  });
  const rem = Math.max(0, tot - state.wallet), d = rem > 0 ? Math.ceil(rem / 20) : 0;
  document.getElementById("grandTotalDisplay").textContent = "$" + tot.toFixed(2);
  document.getElementById("remainingDisplay").textContent = "$" + rem.toFixed(2);
  document.getElementById("daysNeeded").textContent = d;
  document.getElementById("weeksNeeded").textContent = rem > 0 ? (d / 7).toFixed(1) : "0";
  document.getElementById("monthsNeeded").textContent = rem > 0 ? (d / 30).toFixed(1) : "0";
  const dates = Object.keys(state.history).sort().reverse();
  document.getElementById("historyList").innerHTML = dates.length ? dates.map(dt => `<div class="history-item"><span>${dt}</span><strong style="color:var(--acc);">+$${state.history[dt]}</strong></div>`).join("") : "<div style='text-align:center;color:var(--mut);font-size:13px;padding:12px;'>No workouts logged yet.</div>";
}

function renderAll() {
  document.getElementById("taskList").innerHTML = TASKS.map(t => `<label class="task-item ${state.tasks[t.key] ? "completed" : ""}" id="row-${t.key}"><div class="task-left"><input type="checkbox" id="chk-${t.key}" ${state.tasks[t.key] ? "checked" : ""} onchange="toggleTask('${t.key}')" /><span>${t.label}</span></div><span class="task-reward">+$5</span></label>`).join("");
  document.getElementById("wishlistContainer").innerHTML = state.wishlist.map((it, i) => `<div class="row-slot"><button class="info-btn" onclick="peekItem(${i})">?</button><input type="text" placeholder="Item ${i + 1}..." value="${(it.name || "").replace(/"/g, "&quot;")}" oninput="updateWish(${i},'name',this.value)" /><input type="number" placeholder="$0" step="0.01" value="${it.price}" oninput="updateWish(${i},'price',this.value)" /><button class="buy-btn" id="buy-${i}" onclick="buyItem(${i})">Buy</button></div>`).join("");
  document.getElementById("notesContainer").innerHTML = state.notes.map((n, i) => `<div class="row-slot"><input type="text" placeholder="Note ${i + 1}..." value="${(n.text || "").replace(/"/g, "&quot;")}" oninput="updateNote(${i},'text',this.value)" /><input type="number" placeholder="0" step="any" value="${n.num}" oninput="updateNote(${i},'num',this.value)" /></div>`).join("");
  renderNotesSum(); renderStats();
}

loadState(); renderAll();
