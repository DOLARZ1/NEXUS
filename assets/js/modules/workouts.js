/* =====================================================================
   NEXUS · Módulo Entrenamientos
   ===================================================================== */
(function () {
  "use strict";
  const N = window.NEXUS;
  const { Store, UI, Audio, Gami, Charts } = N;
  const { el, fmt, toast } = UI;
  const DateUtil = Store.DateUtil;

  // Ícono SVG a medida: misil estallando para Calistenia
  const CALISTENIA_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<polygon points="14,4 15.3,7.75 19.2,7 16.6,10 19.2,13 15.3,12.25 14,16 12.7,12.25 8.8,13 11.4,10 8.8,7 12.7,7.75" fill="currentColor" stroke="none"/>' + /* explosión */
    '<path d="M3 19 L8.6 13.4" stroke-width="2.4"/>' +   /* cuerpo del misil */
    '<path d="M2.2 20.4 L4.6 18"/>' +                    /* estela 1 */
    '<path d="M4 21.2 L6.2 19"/>' +                      /* estela 2 */
    '</svg>';

  const TYPES = [
    { value: "fuerza", name: "Fuerza / Pesas", icon: "🏋️" },
    { value: "cardio", name: "Cardio", icon: "🏃" },
    { value: "hiit", name: "HIIT", icon: "⚡" },
    { value: "crossfit", name: "Crossfit", icon: "🔥" },
    { value: "calistenia", name: "Calistenia", icon: "💥", svg: CALISTENIA_SVG },
    { value: "yoga", name: "Yoga / Movilidad", icon: "🧘" },
    { value: "estiramiento", name: "Estiramiento", icon: "🤸" },
    { value: "caminata", name: "Caminata", icon: "🚶" },
    { value: "correr", name: "Running", icon: "🏃‍♂️" },
    { value: "ciclismo", name: "Ciclismo", icon: "🚴" },
    { value: "natacion", name: "Natación", icon: "🏊" },
    { value: "remo", name: "Remo", icon: "🚣" },
    { value: "futbol", name: "Fútbol", icon: "⚽" },
    { value: "basquet", name: "Baloncesto", icon: "🏀" },
    { value: "tenis", name: "Tenis", icon: "🎾" },
    { value: "voleibol", name: "Voleibol", icon: "🏐" },
    { value: "beisbol", name: "Béisbol", icon: "⚾" },
    { value: "americano", name: "Fútbol americano", icon: "🏈" },
    { value: "rugby", name: "Rugby", icon: "🏉" },
    { value: "boxeo", name: "Boxeo", icon: "🥊" },
    { value: "artesmarciales", name: "Artes marciales", icon: "🥋" },
    { value: "escalada", name: "Escalada", icon: "🧗" },
    { value: "golf", name: "Golf", icon: "⛳" },
    { value: "pingpong", name: "Ping pong", icon: "🏓" },
    { value: "badminton", name: "Bádminton", icon: "🏸" },
    { value: "hockey", name: "Hockey", icon: "🏒" },
    { value: "patinaje", name: "Patinaje", icon: "⛸️" },
    { value: "esqui", name: "Esquí", icon: "🎿" },
    { value: "snowboard", name: "Snowboard", icon: "🏂" },
    { value: "surf", name: "Surf", icon: "🏄" },
    { value: "senderismo", name: "Senderismo", icon: "🥾" },
    { value: "baile", name: "Baile", icon: "💃" },
    { value: "deporte", name: "Otro deporte", icon: "🏅" },
    { value: "otro", name: "Otro", icon: "💪" }
  ];
  const TYPE_ICON = {};
  TYPES.forEach((t) => { TYPE_ICON[t.value] = t.icon; });

  // devuelve un nodo con el ícono del tipo (SVG a medida o emoji)
  function typeIconNode(type) {
    const t = TYPES.find((x) => x.value === type);
    if (t && t.svg) return el("span", { class: "tico-svg", html: t.svg });
    return el("span", { style: "font-size:22px", text: (t && t.icon) || "💪" });
  }

  function workouts() { return Store.get().workouts; }

  // Sección dinámica de ejercicios (nombre + series × reps, con botón ＋)
  function buildExerciseSection() {
    const list = el("div", { class: "ex-list" });
    function addRow(ex) {
      const nameI = el("input", { class: "input ex-name", placeholder: "Ejercicio (ej. Sentadilla)" });
      const setsI = el("input", { class: "input", type: "number", min: 0, placeholder: "Series" });
      const repsI = el("input", { class: "input", type: "number", min: 0, placeholder: "Reps" });
      if (ex) { nameI.value = ex.name || ""; setsI.value = ex.sets || ""; repsI.value = ex.reps || ""; }
      const row = el("div", { class: "ex-row" }, [
        nameI,
        el("div", { class: "ex-sr" }, [setsI, el("span", { class: "ex-x", text: "×" }), repsI]),
        el("button", { class: "icon-btn", type: "button", title: "Quitar ejercicio", html: "✕", onclick: () => { if (list.children.length > 1) row.remove(); else { nameI.value = ""; setsI.value = ""; repsI.value = ""; } } })
      ]);
      row._get = () => ({ name: nameI.value.trim(), sets: Number(setsI.value) || 0, reps: Number(repsI.value) || 0 });
      list.appendChild(row);
    }
    addRow(null);
    const node = el("div", { class: "field" }, [
      el("label", { text: "Ejercicios (opcional)" }),
      list,
      el("button", { class: "btn sm", type: "button", html: "＋ Agregar ejercicio", onclick: () => addRow(null) })
    ]);
    return { node: node, getData: () => Array.from(list.children).map((r) => r._get()).filter((x) => x.name) };
  }

  function add() {
    const ex = buildExerciseSection();
    const body = UI.form([
      { name: "name", label: "Nombre de la sesión", placeholder: "Pecho y tríceps", required: true },
      { name: "type", label: "Tipo", type: "select", value: "fuerza", options: TYPES.map((t) => ({ value: t.value, label: t.icon + " " + t.name })) },
      { type: "row", fields: [
        { name: "date", label: "Fecha", type: "date", value: DateUtil.todayKey(), required: true },
        { name: "duration", label: "Duración (min)", type: "number", min: 0, placeholder: "45", required: true }
      ]},
      { type: "row", fields: [
        { name: "calories", label: "Calorías (aprox)", type: "number", min: 0, placeholder: "350" },
        { name: "volume", label: "Volumen / distancia", placeholder: "5000 kg · 5 km" }
      ]},
      { name: "notes", label: "Notas", type: "textarea", placeholder: "Sensaciones, PRs, etc." }
    ], (data) => {
      const dur = Number(data.duration) || 0;
      if (dur <= 0) { Audio.play("error"); toast({ icon: "⚠️", msg: "Indica la duración" }); return; }
      const xp = Math.min(30, 10 + Math.round(dur / 5));
      workouts().push({ id: Store.uid(), name: data.name, type: data.type, date: data.date, duration: dur, calories: Number(data.calories) || 0, volume: data.volume, notes: data.notes, exercises: ex.getData(), xpEarned: xp });
      Store.commit();
      Audio.play("complete");
      Gami.award(xp, "Entrenamiento registrado 💪");
      UI.closeModal();
      render(document.getElementById("view-workouts"));
      N.App && N.App.refreshTop();
    }, "Registrar entrenamiento", () => ex.node);
    UI.openModal("Nuevo entrenamiento", body);
  }

  function remove(w) {
    UI.confirmBox("Eliminar entrenamiento", `¿Eliminar "${w.name}"?`, () => {
      const arr = workouts(); arr.splice(arr.indexOf(w), 1);
      Audio.play("delete");
      const xp = w.xpEarned != null ? w.xpEarned : Math.min(30, 10 + Math.round((w.duration || 0) / 5));
      if (xp) Gami.remove(xp); else Store.commit(); // devolver la XP ganada
      render(document.getElementById("view-workouts"));
      N.App && N.App.refreshTop();
    }, "Eliminar");
  }

  // ---------- stats ----------
  function streak() {
    const dates = new Set(workouts().map((w) => w.date));
    let s = 0, day = DateUtil.todayKey();
    if (!dates.has(day)) day = DateUtil.addDays(day, -1);
    while (dates.has(day)) { s++; day = DateUtil.addDays(day, -1); }
    return s;
  }
  function weekMinutes() {
    const days = DateUtil.lastNDays(7);
    return { labels: days.map((d) => DateUtil.weekday(d)), values: days.map((d) => workouts().filter((w) => w.date === d).reduce((s, w) => s + w.duration, 0)) };
  }
  function stats() {
    const arr = workouts();
    const mk = DateUtil.monthKey();
    const monthSessions = arr.filter((w) => w.date.slice(0, 7) === mk);
    return {
      total: arr.length,
      monthCount: monthSessions.length,
      monthMinutes: monthSessions.reduce((s, w) => s + w.duration, 0),
      monthCalories: monthSessions.reduce((s, w) => s + w.calories, 0),
      streak: streak()
    };
  }

  function render(container) {
    container.innerHTML = "";
    const st = stats();

    container.appendChild(el("div", { class: "view-head" }, [
      el("div", {}, [
        el("h1", { class: "view-title" }, [N.Icons.node("dumbbell"), "Entrenamientos"]),
        el("p", { class: "view-desc", text: "Registra tus sesiones y observa tu progreso físico." })
      ]),
      el("button", { class: "btn primary", onclick: add, html: "＋ Registrar sesión" })
    ]));

    container.appendChild(el("div", { class: "grid cols-4 mb-16" }, [
      kpi("Racha", st.streak + (st.streak === 1 ? " día" : " días"), "🔥 constancia", "warn"),
      kpi("Este mes", st.monthCount + "", "sesiones", "accent"),
      kpi("Minutos", fmt.num(st.monthMinutes), "este mes", "accent"),
      kpi("Calorías", fmt.num(st.monthCalories), "quemadas", "good")
    ]));

    // gráfica minutos por día
    const chartCard = el("div", { class: "card mb-16" }, [
      el("div", { class: "card-head" }, [el("div", { class: "card-title" }, [el("span", { class: "dot" }), "Minutos entrenados · últimos 7 días"])])
    ]);
    const cv = el("canvas");
    chartCard.appendChild(el("div", { class: "chart-box" }, [cv]));
    container.appendChild(chartCard);
    setTimeout(() => Charts.bars(cv, { labels: weekMinutes().labels, series: [{ values: weekMinutes().values, color: "--accent-2" }] }, { height: 170 }), 30);

    // historial
    const arr = workouts().slice().sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
    const listCard = el("div", { class: "card" }, [
      el("div", { class: "card-head" }, [el("div", { class: "card-title" }, [el("span", { class: "dot" }), "Historial"])])
    ]);
    if (!arr.length) {
      listCard.appendChild(el("div", { class: "empty" }, [el("span", { class: "big", text: "⚡" }), el("div", { text: "Sin entrenamientos. ¡Registra el primero!" })]));
    } else {
      arr.slice(0, 20).forEach((w) => {
        const item = el("div", { class: "item", style: "flex-direction:column;align-items:stretch" });
        item.appendChild(el("div", { class: "flex items-center gap-12" }, [
          typeIconNode(w.type),
          el("div", { class: "item-main" }, [
            el("div", { class: "item-title", text: w.name }),
            el("div", { class: "item-meta" }, [
              el("span", { text: DateUtil.label(w.date) }),
              el("span", { class: "chip accent", text: w.duration + " min" }),
              w.calories ? el("span", { class: "chip", text: w.calories + " kcal" }) : null,
              w.volume ? el("span", { class: "text-faint fs-12", text: w.volume }) : null
            ])
          ]),
          el("button", { class: "icon-btn", html: "🗑️", title: "Eliminar", onclick: () => remove(w) })
        ]));
        if (w.exercises && w.exercises.length) {
          const exWrap = el("div", { style: "display:flex;flex-wrap:wrap;gap:6px;margin-top:10px" });
          w.exercises.forEach((e) => exWrap.appendChild(el("span", { class: "chip", text: e.name + ((e.sets || e.reps) ? "  " + (e.sets || "?") + "×" + (e.reps || "?") : "") })));
          item.appendChild(exWrap);
        }
        if (w.notes) item.appendChild(el("div", { class: "fs-12 text-dim", style: "margin-top:8px", text: "📝 " + w.notes }));
        listCard.appendChild(item);
      });
    }
    container.appendChild(listCard);
  }

  function kpi(label, val, sub, cls) {
    return el("div", { class: "card" }, [el("div", { class: "kpi" }, [
      el("div", { class: "kpi-lbl", text: label }), el("div", { class: "kpi-val " + (cls || ""), text: val }), el("div", { class: "kpi-sub", text: sub })
    ])]);
  }

  N.Workouts = { render, stats, weekMinutes, streak };
})();
