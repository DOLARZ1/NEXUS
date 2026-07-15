/* =====================================================================
   OCTANAJE · Módulo Salud
   Datos biométricos que normalmente pide un preparador físico: peso,
   estatura, edad, sexo y nivel de actividad. Con eso se calcula:
     - IMC (Índice de Masa Corporal) con su clasificación
     - GEB (Gasto Energético Basal) — fórmula de Mifflin-St Jeor
     - GET (Gasto Energético Total) — GEB x factor de actividad
   Incluye historial con nombre, fecha de última revisión y guardado
   persistente (localStorage vía Store).
   ===================================================================== */
(function () {
  "use strict";
  const N = window.NEXUS;
  const { Store, UI, Audio, Gami } = N;
  const { el, fmt, toast } = UI;
  const DateUtil = Store.DateUtil;

  const today = () => DateUtil.todayKey();

  // Factores de actividad física para el GET (estándar de nutrición/PT)
  const ACTIVITY = [
    { value: "sedentary", label: "Sedentario (poco o nulo ejercicio)", factor: 1.2 },
    { value: "light", label: "Ligero (ejercicio 1-3 días/semana)", factor: 1.375 },
    { value: "moderate", label: "Moderado (ejercicio 3-5 días/semana)", factor: 1.55 },
    { value: "active", label: "Activo (ejercicio 6-7 días/semana)", factor: 1.725 },
    { value: "very_active", label: "Muy activo (2x al día / trabajo físico)", factor: 1.9 }
  ];
  function activityLabel(v) { return (ACTIVITY.find((a) => a.value === v) || ACTIVITY[2]).label; }
  function activityFactor(v) { return (ACTIVITY.find((a) => a.value === v) || ACTIVITY[2]).factor; }

  // Clasificación oficial de IMC (OMS)
  const IMC_RANGES = [
    { max: 18.5, label: "Bajo peso", cls: "warn", desc: "Por debajo del rango saludable. Considera aumentar tu ingesta calórica de forma controlada." },
    { max: 25, label: "Peso normal", cls: "good", desc: "Dentro del rango saludable. ¡Vas muy bien, sigue así!" },
    { max: 30, label: "Sobrepeso", cls: "warn", desc: "Por encima del rango saludable. Un plan de alimentación y ejercicio puede ayudarte a corregirlo." },
    { max: 35, label: "Obesidad grado I", cls: "bad", desc: "Se recomienda acompañamiento profesional (médico/nutriólogo) además de actividad física." },
    { max: 40, label: "Obesidad grado II", cls: "bad", desc: "Riesgo elevado para la salud. Es importante buscar valoración médica." },
    { max: Infinity, label: "Obesidad grado III", cls: "bad", desc: "Riesgo muy alto para la salud. Se recomienda valoración médica cuanto antes." }
  ];
  function imcClass(imc) { return IMC_RANGES.find((r) => imc < r.max) || IMC_RANGES[IMC_RANGES.length - 1]; }

  function health() {
    const s = Store.get();
    if (!s.health || typeof s.health !== "object") s.health = {};
    if (!s.health.profile || typeof s.health.profile !== "object") {
      s.health.profile = { name: "", sex: "F", age: null, weight: null, height: null, activity: "moderate", lastCheck: "" };
    }
    if (!Array.isArray(s.health.history)) s.health.history = [];
    return s.health;
  }
  function profile() { return health().profile; }
  function history() { return health().history; }

  // ---------------- Cálculos ----------------
  // IMC = peso(kg) / estatura(m)^2
  function calcIMC(weightKg, heightCm) {
    const h = heightCm / 100;
    if (!weightKg || !h) return 0;
    return weightKg / (h * h);
  }
  // GEB — Fórmula de Mifflin-St Jeor (la más usada actualmente por
  // nutriólogos/entrenadores; más precisa que la antigua Harris-Benedict)
  //  Hombres: GEB = 10*peso + 6.25*estatura - 5*edad + 5
  //  Mujeres: GEB = 10*peso + 6.25*estatura - 5*edad - 161
  function calcGEB(weightKg, heightCm, age, sex) {
    if (!weightKg || !heightCm || !age) return 0;
    const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
    return sex === "M" ? base + 5 : base - 161;
  }
  // GET = GEB x factor de actividad física
  function calcGET(geb, activityKey) { return geb * activityFactor(activityKey); }

  function r1(x) { return Math.round(x * 10) / 10; }

  // ---------------- Historial ----------------
  function saveCheck(p) {
    const imc = calcIMC(p.weight, p.height);
    const geb = calcGEB(p.weight, p.height, p.age, p.sex);
    const get = calcGET(geb, p.activity);
    const entry = {
      id: Store.uid(), date: today(),
      name: p.name, weight: p.weight, height: p.height, age: p.age, sex: p.sex, activity: p.activity,
      imc: r1(imc), geb: Math.round(geb), get: Math.round(get)
    };
    history().unshift(entry);
    const prof = profile();
    prof.name = p.name; prof.sex = p.sex; prof.age = p.age; prof.weight = p.weight; prof.height = p.height;
    prof.activity = p.activity; prof.lastCheck = today();
    Store.commit();
    Gami.award(5, "Revisión de salud registrada 💙");
    return entry;
  }
  function removeCheck(entry) {
    const arr = history(); const i = arr.indexOf(entry);
    if (i >= 0) arr.splice(i, 1);
    Store.commit();
  }

  // ---------------- Formulario de datos ----------------
  function openForm() {
    const p = profile();
    const body = UI.form([
      { name: "name", label: "Nombre", value: p.name || "", placeholder: "Tu nombre", required: true },
      { type: "row", fields: [
        { name: "sex", label: "Sexo biológico", type: "select", value: p.sex || "F", options: [
          { value: "F", label: "Femenino" }, { value: "M", label: "Masculino" }
        ]},
        { name: "age", label: "Edad (años)", type: "number", min: 1, max: 120, value: p.age || "", required: true }
      ]},
      { type: "row", fields: [
        { name: "weight", label: "Peso (kg)", type: "number", min: 1, step: 0.1, value: p.weight || "", required: true },
        { name: "height", label: "Estatura (cm)", type: "number", min: 1, step: 0.1, value: p.height || "", required: true }
      ]},
      { name: "activity", label: "Nivel de actividad física", type: "select", value: p.activity || "moderate", options: ACTIVITY.map((a) => ({ value: a.value, label: a.label })) }
    ], (data) => {
      const payload = {
        name: data.name, sex: data.sex, age: Number(data.age) || 0,
        weight: Number(data.weight) || 0, height: Number(data.height) || 0, activity: data.activity
      };
      if (!payload.weight || !payload.height || !payload.age) {
        Audio.play("error"); toast({ icon: "⚠️", msg: "Completa peso, estatura y edad." }); return;
      }
      saveCheck(payload);
      Audio.play("levelup");
      toast({ icon: "💙", title: "Revisión guardada", msg: "IMC: " + r1(calcIMC(payload.weight, payload.height)) });
      UI.closeModal();
      render(document.getElementById("view-health"));
    }, "💾 Guardar revisión");
    UI.openModal("📋 Nueva revisión de salud", body);
  }

  // ---------------- Historial (modal) ----------------
  function openHistory() {
    const list = history();
    const body = el("div", {});
    if (!list.length) {
      body.appendChild(el("div", { class: "empty" }, [el("span", { class: "big", text: "📖" }), el("div", { text: "Aún no tienes revisiones guardadas." })]));
    } else {
      list.forEach((h) => {
        const c = imcClass(h.imc);
        const dLbl = DateUtil.parse(h.date).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
        body.appendChild(el("div", { class: "item" }, [
          el("div", { class: "item-main" }, [
            el("div", { class: "item-title", text: (h.name || "Sin nombre") + " · " + dLbl }),
            el("div", { class: "item-meta" }, [
              el("span", { class: "chip", text: h.weight + " kg · " + h.height + " cm" }),
              el("span", { class: "chip " + c.cls, text: "IMC " + h.imc + " (" + c.label + ")" }),
              el("span", { class: "text-faint fs-12", text: "GEB " + h.geb + " kcal · GET " + h.get + " kcal" })
            ])
          ]),
          el("button", { class: "icon-btn", html: "🗑️", title: "Eliminar", onclick: () => {
            UI.confirmBox("Eliminar revisión", "¿Eliminar el registro del " + dLbl + "?", () => {
              removeCheck(h); Audio.play("delete"); toast({ icon: "🗑️", msg: "Registro eliminado" }); openHistory();
            }, "Eliminar");
          } })
        ]));
      });
    }
    UI.openModal("📖 Historial de revisiones (" + list.length + ")", body);
  }

  // ---------------- Barra visual de clasificación de IMC ----------------
  function imcScale(imc) {
    // escala visual de 15 a 42 aprox., marcador según el valor actual
    const min = 15, max = 42;
    const pct = Math.max(0, Math.min(100, ((imc - min) / (max - min)) * 100));
    const stops = [
      { at: ((18.5 - min) / (max - min)) * 100, label: "18.5" },
      { at: ((25 - min) / (max - min)) * 100, label: "25" },
      { at: ((30 - min) / (max - min)) * 100, label: "30" },
      { at: ((35 - min) / (max - min)) * 100, label: "35" }
    ];
    const track = el("div", { style: "position:relative;height:14px;border-radius:8px;margin:18px 0 26px;background:linear-gradient(90deg,#ffb020 0%,#ffb020 " +
      ((18.5 - min) / (max - min) * 100) + "%,#21e6a4 " + ((18.5 - min) / (max - min) * 100) + "%,#21e6a4 " + ((25 - min) / (max - min) * 100) +
      "%,#ffb020 " + ((25 - min) / (max - min) * 100) + "%,#ffb020 " + ((30 - min) / (max - min) * 100) +
      "%,#ff5470 " + ((30 - min) / (max - min) * 100) + "%,#ff5470 100%)" });
    stops.forEach((s) => {
      track.appendChild(el("div", { style: "position:absolute;top:0;bottom:0;left:" + s.at + "%;width:1px;background:rgba(0,0,0,.35)" }));
      track.appendChild(el("div", { class: "fs-12 text-faint", style: "position:absolute;top:18px;left:" + s.at + "%;transform:translateX(-50%)", text: s.label }));
    });
    track.appendChild(el("div", {
      title: "Tu IMC: " + r1(imc),
      style: "position:absolute;top:-6px;left:" + pct + "%;transform:translateX(-50%);width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-top:10px solid var(--txt)"
    }));
    return track;
  }

  function macroCard(label, val, unit, color, sub) {
    return el("div", { class: "card", style: "padding:14px;text-align:center" }, [
      el("div", { class: "kpi-val", style: "font-size:26px;color:" + color, text: fmt.num(val) }),
      el("div", { class: "kpi-lbl", text: label + (unit ? " (" + unit + ")" : "") }),
      sub ? el("div", { class: "kpi-sub mt-8", text: sub }) : null
    ]);
  }

  // ---------------- Render principal ----------------
  function render(container) {
    container.innerHTML = "";
    const p = profile();
    const hasData = !!(p.weight && p.height && p.age);

    container.appendChild(el("div", { class: "view-head" }, [
      el("div", {}, [
        el("h1", { class: "view-title" }, [N.Icons.node("heart"), "Salud"]),
        el("p", { class: "view-desc", text: "Tus datos biométricos, IMC, gasto energético y el historial de tus revisiones." })
      ]),
      el("div", { class: "flex gap-8", style: "flex-wrap:wrap" }, [
        el("button", { class: "btn", onclick: openHistory, html: "📖 Historial" }),
        el("button", { class: "btn primary", onclick: openForm, html: hasData ? "✏️ Actualizar mis datos" : "＋ Registrar mis datos" })
      ])
    ]));

    if (!hasData) {
      container.appendChild(el("div", { class: "card" }, [
        el("div", { class: "empty" }, [
          el("span", { class: "big", text: "💙" }),
          el("div", { text: "Aún no has registrado tus datos de salud." }),
          el("p", { class: "fs-12 text-faint mt-8", text: "Captura tu peso, estatura, edad, sexo y nivel de actividad — los mismos datos que te pediría un preparador físico — para calcular tu IMC, tu Gasto Energético Basal (GEB) y tu Gasto Energético Total (GET)." }),
          el("button", { class: "btn primary mt-16", onclick: openForm, html: "＋ Registrar mis datos" })
        ])
      ]));
      return;
    }

    const imc = calcIMC(p.weight, p.height);
    const geb = calcGEB(p.weight, p.height, p.age, p.sex);
    const get = calcGET(geb, p.activity);
    const c = imcClass(imc);
    const lastLbl = p.lastCheck ? DateUtil.parse(p.lastCheck).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" }) : "—";

    // Resumen del perfil
    container.appendChild(el("div", { class: "card mb-16" }, [
      el("div", { class: "card-head" }, [
        el("div", {}, [
          el("div", { class: "card-title" }, [el("span", { class: "dot" }), p.name || "Tu perfil"]),
          el("div", { class: "card-sub", text: "Última revisión: " + lastLbl })
        ])
      ]),
      el("div", { class: "flex gap-8", style: "flex-wrap:wrap" }, [
        el("span", { class: "chip", text: (p.sex === "M" ? "Hombre" : "Mujer") + " · " + p.age + " años" }),
        el("span", { class: "chip", text: p.weight + " kg" }),
        el("span", { class: "chip", text: p.height + " cm" }),
        el("span", { class: "chip accent", text: activityLabel(p.activity) })
      ])
    ]));

    // ---- IMC ----
    const imcCard = el("div", { class: "card mb-16" }, [
      el("div", { class: "card-head" }, [el("div", { class: "card-title" }, [el("span", { class: "dot" }), "Índice de Masa Corporal (IMC)"])]),
      el("div", { class: "flex items-center gap-12", style: "flex-wrap:wrap" }, [
        el("div", { class: "kpi-val", style: "font-size:38px", text: r1(imc) + "" }),
        el("span", { class: "chip " + c.cls, style: "font-size:13px;padding:7px 14px", text: c.label })
      ]),
      el("p", { class: "fs-12 text-faint mt-8", text: c.desc }),
      imcScale(imc),
      el("div", { class: "insight info" }, [
        el("span", { class: "ico", text: "📐" }),
        el("div", { class: "txt", html: "<b>Fórmula:</b> IMC = peso (kg) ÷ [estatura (m)]². &nbsp; Ej: " + p.weight + " kg ÷ (" + (p.height / 100).toFixed(2) + " m)² = <b>" + r1(imc) + "</b>." })
      ]),
      el("p", { class: "fs-12 text-faint", text: "Clasificación OMS: <18.5 Bajo peso · 18.5-24.9 Normal · 25-29.9 Sobrepeso · 30-34.9 Obesidad I · 35-39.9 Obesidad II · ≥40 Obesidad III. El IMC no distingue masa muscular de grasa, así que en personas muy musculosas puede no ser representativo — úsalo como referencia general, no como diagnóstico." })
    ]);
    container.appendChild(imcCard);

    // ---- GEB y GET ----
    const engCard = el("div", { class: "card mb-16" }, [
      el("div", { class: "card-head" }, [el("div", { class: "card-title" }, [el("span", { class: "dot" }), "Gasto energético"])]),
      el("div", { class: "grid cols-2 mb-16" }, [
        macroCard("GEB · Basal", Math.round(geb), "kcal/día", "var(--accent)", "Lo que quemas en reposo total"),
        macroCard("GET · Total", Math.round(get), "kcal/día", "var(--warn)", "Lo que quemas con tu actividad diaria")
      ]),
      el("div", { class: "insight good" }, [
        el("span", { class: "ico", text: "🔥" }),
        el("div", { class: "txt", html: "<b>GEB (Gasto Energético Basal):</b> es la energía mínima que tu cuerpo necesita para funcionar en completo reposo (respirar, digerir, mantener la temperatura), sin contar ningún movimiento. Se calculó con la fórmula de Mifflin-St Jeor: " +
          (p.sex === "M" ? "10×peso + 6.25×estatura − 5×edad + 5" : "10×peso + 6.25×estatura − 5×edad − 161") + "." })
      ]),
      el("div", { class: "insight warn" }, [
        el("span", { class: "ico", text: "⚡" }),
        el("div", { class: "txt", html: "<b>GET (Gasto Energético Total):</b> es tu GEB multiplicado por tu nivel de actividad física (" + activityLabel(p.activity) + ", factor ×" + activityFactor(p.activity) + "). Representa las calorías que realmente quemas en un día normal, incluyendo ejercicio y movimiento." })
      ]),
      el("p", { class: "fs-12 text-faint mt-8", html: "<b>¿Para qué sirve?</b> El GET es tu punto de referencia: comer por debajo de él genera déficit calórico (bajar de peso), comer igual mantiene tu peso, y comer por encima genera superávit (subir de peso/masa muscular). Consulta a un nutriólogo o preparador físico para ajustar tu plan según tu objetivo." })
    ]);
    container.appendChild(engCard);
  }

  N.Health = { render };
})();
