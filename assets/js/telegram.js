/* =====================================================================
   NEXUS · Telegram — enviar resumen de pendientes al bot
   Funciona sin servidor: llama directo a la API de Telegram desde el navegador.
   ===================================================================== */
(function () {
  "use strict";
  const N = window.NEXUS;
  const { Store, UI, Audio } = N;
  const { el, toast, fmt } = UI;
  const DateUtil = Store.DateUtil;

  const TOKEN = "8968214518:AAEsXPh9ACKqyNqAmQtis0Iro-NGmn3bnwE";
  const CHAT_ID = "5068332771";
  const API = "https://api.telegram.org/bot" + TOKEN + "/sendMessage";

  // Genera el texto del resumen de pendientes
  function buildSummary() {
    const s = Store.get();
    const today = DateUtil.todayKey();
    const lines = [];
    lines.push("⬡ *NEXUS — Tus pendientes*");
    lines.push("📅 " + new Date().toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" }));
    lines.push("");

    // Hábitos
    const habsPending = s.habits.filter((h) => {
      const target = Math.max(1, parseInt(h.count, 10) || 1);
      const v = h.history[today];
      const cur = v === true ? target : (typeof v === "number" ? v : 0);
      return cur < target;
    });
    if (habsPending.length) {
      lines.push("✦ *Hábitos por completar:*");
      habsPending.forEach((h) => {
        const target = Math.max(1, parseInt(h.count, 10) || 1);
        const v = h.history[today];
        const cur = v === true ? target : (typeof v === "number" ? v : 0);
        lines.push("  • " + h.icon + " " + h.name + (target > 1 ? " (" + cur + "/" + target + ")" : ""));
      });
      lines.push("");
    }

    // Tareas
    const tasksPending = s.tasks.filter((t) => !t.done);
    const tasksOverdue = tasksPending.filter((t) => t.due && t.due < today);
    const tasksToday = tasksPending.filter((t) => t.due === today);
    const tasksUpcoming = tasksPending.filter((t) => !t.due || t.due > today);
    if (tasksPending.length) {
      lines.push("✓ *Tareas pendientes (" + tasksPending.length + "):*");
      if (tasksOverdue.length) { lines.push("  🔴 _Vencidas:_"); tasksOverdue.forEach((t) => lines.push("  • " + t.title)); }
      if (tasksToday.length) { lines.push("  🟡 _Hoy:_"); tasksToday.forEach((t) => lines.push("  • " + t.title)); }
      if (tasksUpcoming.length > 0 && tasksUpcoming.length <= 5) { lines.push("  🔵 _Próximas:_"); tasksUpcoming.forEach((t) => lines.push("  • " + t.title)); }
      else if (tasksUpcoming.length > 5) { lines.push("  🔵 " + tasksUpcoming.length + " tareas más sin fecha o futuras"); }
      lines.push("");
    }

    // Metas
    const goalsActive = s.goals.filter((g) => g.target > 0 && g.current < g.target);
    if (goalsActive.length) {
      lines.push("◉ *Metas activas:*");
      goalsActive.forEach((g) => {
        const pct = Math.round((g.current / g.target) * 100);
        lines.push("  • " + g.title + " → " + g.current + "/" + g.target + " (" + pct + "%)");
      });
      lines.push("");
    }

    // Racha y XP
    const streak = N.Gami.globalStreak();
    const lp = N.Gami.levelProgress();
    lines.push("🔥 Racha: " + streak + " día" + (streak === 1 ? "" : "s"));
    lines.push("⭐ Nivel " + lp.level + " · " + Store.get().profile.xp + " XP");

    if (!habsPending.length && !tasksPending.length && !goalsActive.length) {
      lines.push("");
      lines.push("🎉 *¡Todo al día!* No tienes pendientes. Sigue así.");
    }

    return lines.join("\n");
  }

  // Sincronizar estado al repositorio (para que el cron de las 6am lo lea)
  function syncState() {
    const pat = localStorage.getItem("nexus.github.pat") || "";
    if (!pat) { promptPAT(); return; }
    const content = btoa(unescape(encodeURIComponent(Store.serialize())));
    const url = "https://api.github.com/repos/DOLARZ1/NEXUS/contents/data/state.json";
    // Primero obtener el SHA del archivo existente (para poder actualizarlo)
    fetch(url, { headers: { Authorization: "token " + pat } })
      .then((r) => r.ok ? r.json() : null)
      .then((existing) => {
        const body = {
          message: "sync: estado actualizado desde NEXUS",
          content: content,
          branch: "main"
        };
        if (existing && existing.sha) body.sha = existing.sha;
        return fetch(url, {
          method: "PUT",
          headers: { Authorization: "token " + pat, "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });
      })
      .then((r) => {
        if (r.ok) { toast({ icon: "☁️", title: "Estado sincronizado", msg: "El cron de las 6am leerá este resumen." }); }
        else { r.json().then((j) => { toast({ icon: "⚠️", title: "Error al sincronizar", msg: j.message || "Revisa tu token", duration: 5000 }); }); }
      })
      .catch((e) => { toast({ icon: "⚠️", title: "Error de red", msg: String(e.message) }); });
  }

  function promptPAT() {
    const body = el("div", {}, [
      el("div", { class: "insight info", style: "margin-bottom:14px" }, [
        el("span", { class: "ico", text: "🔑" }),
        el("div", { class: "txt", html: "Para que el recordatorio de las 6am funcione, necesito tu <b>Personal Access Token de GitHub</b> (el que creaste como NEXUS_PAT). Se guarda solo en tu navegador, nunca se comparte." })
      ]),
      UI.form([
        { name: "pat", label: "GitHub Personal Access Token", placeholder: "github_pat_...", required: true }
      ], (data) => {
        localStorage.setItem("nexus.github.pat", data.pat.trim());
        Audio.play("complete");
        toast({ icon: "🔑", msg: "Token guardado. Sincronizando…" });
        UI.closeModal();
        syncState();
      }, "Guardar y sincronizar")
    ]);
    UI.openModal("🔑 Configurar sincronización", body);
  }

  // Envía el resumen a Telegram + sincroniza el estado
  function send() {
    const text = buildSummary();
    Audio.play("tap");
    toast({ icon: "📨", title: "Enviando a Telegram…", msg: "Un momento" });

    fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CHAT_ID, text: text, parse_mode: "Markdown" })
    }).then((r) => r.json()).then((j) => {
      if (j.ok) {
        Audio.play("complete");
        toast({ icon: "✅", title: "Enviado a Telegram", msg: "Revisa tu bot para ver el resumen." });
        // Sincronizar estado para el cron de las 6am
        syncState();
      } else {
        throw new Error(j.description || "Error desconocido");
      }
    }).catch((e) => {
      Audio.play("error");
      toast({ icon: "⚠️", title: "Error al enviar", msg: String(e.message || e), duration: 5000 });
    });
  }

  // Botón para la barra superior o donde se inserte
  function button() {
    return el("button", { class: "icon-btn", title: "Enviar pendientes a Telegram", onclick: send, html: "📨" });
  }

  N.Telegram = { send, button, buildSummary };
})();
