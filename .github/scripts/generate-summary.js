/* =====================================================================
   NEXUS · Script para GitHub Actions: lee state.json y envía resumen
   de pendientes por Telegram.
   ===================================================================== */
const fs = require("fs");
const https = require("https");

const TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!TOKEN || !CHAT_ID) {
  console.error("Faltan TELEGRAM_TOKEN o TELEGRAM_CHAT_ID en los secrets.");
  process.exit(1);
}

// Leer el estado exportado por la app
let state;
try {
  state = JSON.parse(fs.readFileSync("state.json", "utf8"));
} catch (e) {
  console.error("No se pudo leer state.json:", e.message);
  process.exit(1);
}

// Helpers de fecha
function todayKey() {
  const d = new Date();
  // Ajustar a hora México (UTC-6)
  d.setHours(d.getHours() - 6);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const today = todayKey();
const lines = [];
lines.push("⬡ *NEXUS — Recordatorio 6:00 AM*");

const opts = { weekday: "long", day: "numeric", month: "long", timeZone: "America/Mexico_City" };
lines.push("📅 " + new Date().toLocaleDateString("es-MX", opts));
lines.push("");

// Hábitos pendientes
const habits = state.habits || [];
const habsPending = habits.filter((h) => {
  const target = Math.max(1, parseInt(h.count, 10) || 1);
  const v = h.history && h.history[today];
  const cur = v === true ? target : (typeof v === "number" ? v : 0);
  return cur < target;
});
if (habsPending.length) {
  lines.push("✦ *Hábitos por completar:*");
  habsPending.forEach((h) => {
    const target = Math.max(1, parseInt(h.count, 10) || 1);
    lines.push("  • " + (h.icon || "✦") + " " + h.name + (target > 1 ? " (0/" + target + ")" : ""));
  });
  lines.push("");
}

// Tareas pendientes
const tasks = (state.tasks || []).filter((t) => !t.done);
const tasksOverdue = tasks.filter((t) => t.due && t.due < today);
const tasksToday = tasks.filter((t) => t.due === today);
const tasksOther = tasks.filter((t) => !t.due || t.due > today);
if (tasks.length) {
  lines.push("✓ *Tareas pendientes (" + tasks.length + "):*");
  if (tasksOverdue.length) { lines.push("  🔴 _Vencidas:_"); tasksOverdue.forEach((t) => lines.push("  • " + t.title)); }
  if (tasksToday.length) { lines.push("  🟡 _Hoy:_"); tasksToday.forEach((t) => lines.push("  • " + t.title)); }
  if (tasksOther.length <= 5) { tasksOther.forEach((t) => lines.push("  • " + t.title)); }
  else { lines.push("  🔵 " + tasksOther.length + " tareas más"); }
  lines.push("");
}

// Metas activas
const goals = (state.goals || []).filter((g) => g.target > 0 && g.current < g.target);
if (goals.length) {
  lines.push("◉ *Metas activas:*");
  goals.forEach((g) => {
    const pct = Math.round((g.current / g.target) * 100);
    lines.push("  • " + g.title + " → " + g.current + "/" + g.target + " (" + pct + "%)");
  });
  lines.push("");
}

// Racha y nivel
const profile = state.profile || {};
const activity = state.activity || {};
let streak = 0, day = today;
function addDays(key, n) {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y, m - 1, d + n);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}
if (!activity[day]) day = addDays(day, -1);
while (activity[day]) { streak++; day = addDays(day, -1); }

lines.push("🔥 Racha: " + streak + " día" + (streak === 1 ? "" : "s"));
lines.push("⭐ Nivel " + (profile.level || 1) + " · " + (profile.xp || 0) + " XP");

if (!habsPending.length && !tasks.length && !goals.length) {
  lines.push("");
  lines.push("🎉 *¡Todo al día!* No tienes pendientes.");
}

lines.push("");
lines.push("🔗 [Abrir NEXUS](https://dolarz1.github.io/NEXUS/)");

const text = lines.join("\n");
console.log("Resumen generado:\n" + text);

// Enviar por Telegram
const payload = JSON.stringify({ chat_id: CHAT_ID, text: text, parse_mode: "Markdown", disable_web_page_preview: true });
const req = https.request({
  hostname: "api.telegram.org",
  path: "/bot" + TOKEN + "/sendMessage",
  method: "POST",
  headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) }
}, (res) => {
  let data = "";
  res.on("data", (chunk) => { data += chunk; });
  res.on("end", () => {
    const j = JSON.parse(data);
    if (j.ok) { console.log("✅ Mensaje enviado correctamente"); }
    else { console.error("❌ Error de Telegram:", j.description); process.exit(1); }
  });
});
req.on("error", (e) => { console.error("❌ Error de red:", e.message); process.exit(1); });
req.write(payload);
req.end();
