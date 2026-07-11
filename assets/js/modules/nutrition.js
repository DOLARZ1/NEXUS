/* =====================================================================
   NEXUS · Módulo Alimentación
   Base de datos de alimentos + registro diario con gramos y totales
   de calorías, proteínas y carbohidratos (gráficos separados).
   ===================================================================== */
(function () {
  "use strict";
  const N = window.NEXUS;
  const { Store, UI, Audio, Gami, Charts } = N;
  const { el, fmt, toast } = UI;
  const DateUtil = Store.DateUtil;

  const today = () => DateUtil.todayKey();

  function nut() {
    const s = Store.get();
    if (!s.nutrition || !Array.isArray(s.nutrition.log)) s.nutrition = { log: [] };
    return s.nutrition;
  }
  function log() { return nut().log; }
  const r1 = (x) => Math.round(x * 10) / 10;

  function addEntry(food, grams) {
    const f = grams / 100;
    log().push({
      id: Store.uid(), name: food.name, cat: food.cat, grams: Math.round(grams),
      kcal: Math.round(food.kcal * f), prot: r1(food.prot * f), carb: r1(food.carb * f),
      date: today(), xpEarned: 2
    });
    Store.commit();
    Gami.award(2, "Alimento registrado 🍽️");
  }

  function removeEntry(e) {
    const a = log(); a.splice(a.indexOf(e), 1);
    Audio.play("delete");
    if (e.xpEarned) Gami.remove(e.xpEarned); else Store.commit();
    render(document.getElementById("view-nutrition"));
    N.App && N.App.refreshTop();
  }

  function dayTotals(key) {
    return log().filter((x) => x.date === key).reduce((t, x) => {
      t.kcal += x.kcal; t.prot += x.prot; t.carb += x.carb; return t;
    }, { kcal: 0, prot: 0, carb: 0 });
  }
  function series(macro) {
    const days = DateUtil.lastNDays(7);
    return {
      labels: days.map((d) => DateUtil.weekday(d)),
      values: days.map((d) => Math.round(log().filter((x) => x.date === d).reduce((s, x) => s + x[macro], 0)))
    };
  }

  // ---------------- Buscador de alimentos ----------------
  let browseCat = "Todos";
  let browseQuery = "";

  function openBrowser() {
    const search = el("input", { class: "input", placeholder: "🔍 Buscar alimento…", value: browseQuery });
    const listWrap = el("div", { style: "max-height:46vh;overflow-y:auto;margin-top:10px" });

    function renderList() {
      listWrap.innerHTML = "";
      const q = browseQuery.trim().toLowerCase();
      let items = N.FOODS.filter((f) => (browseCat === "Todos" || f.cat === browseCat) && (!q || f.name.toLowerCase().includes(q)));
      items = items.slice().sort((a, b) => a.name.localeCompare(b.name));
      if (!items.length) { listWrap.appendChild(el("div", { class: "empty", text: "Sin resultados." })); return; }
      // agrupar por categoría si es "Todos"
      if (browseCat === "Todos") {
        const groups = {};
        items.forEach((f) => { (groups[f.cat] = groups[f.cat] || []).push(f); });
        N.FOOD_CATS.forEach((cat) => {
          if (!groups[cat]) return;
          listWrap.appendChild(el("div", { class: "card-title", style: "margin:12px 0 6px", text: cat }));
          groups[cat].forEach((f) => listWrap.appendChild(foodRow(f)));
        });
      } else {
        items.forEach((f) => listWrap.appendChild(foodRow(f)));
      }
    }

    search.addEventListener("input", () => { browseQuery = search.value; renderList(); });

    // chips de categoría
    const chips = el("div", { class: "flex gap-8", style: "flex-wrap:wrap;margin-top:10px" });
    ["Todos"].concat(N.FOOD_CATS).forEach((cat) => {
      const c = el("button", { class: "chip" + (cat === browseCat ? " accent" : ""), text: cat, style: "cursor:pointer" });
      c.addEventListener("click", () => { browseCat = cat; Audio.play("tap"); openBrowser(); });
      chips.appendChild(c);
    });

    const body = el("div", {}, [search, chips, listWrap]);
    UI.openModal("🍽️ Alimentos", body);
    renderList();
  }

  function foodRow(f) {
    return el("div", { class: "item", style: "padding:10px 12px;cursor:pointer", onclick: () => openPortion(f) }, [
      el("div", { class: "item-main" }, [
        el("div", { class: "item-title", style: "font-size:14px", text: f.name }),
        el("div", { class: "item-meta" }, [
          el("span", { class: "chip", text: f.kcal + " kcal" }),
          el("span", { class: "text-faint fs-12", text: "P " + f.prot + "g · C " + f.carb + "g /100g" })
        ])
      ]),
      el("button", { class: "icon-btn", html: "＋", title: "Agregar", onclick: (ev) => { ev.stopPropagation(); openPortion(f); } })
    ]);
  }

  function openPortion(food) {
    const gramsI = el("input", { class: "input", type: "number", min: 1, step: 1, value: 100 });
    const preview = el("div", { class: "grid cols-3", style: "margin-top:12px" });
    function paint() {
      const g = Number(gramsI.value) || 0; const f = g / 100;
      preview.innerHTML = "";
      preview.appendChild(macroBox("Calorías", Math.round(food.kcal * f), "kcal", "#ff9f1c"));
      preview.appendChild(macroBox("Proteínas", r1(food.prot * f), "g", "var(--good)"));
      preview.appendChild(macroBox("Carbos", r1(food.carb * f), "g", "var(--accent)"));
    }
    gramsI.addEventListener("input", paint);
    const body = el("div", {}, [
      el("div", { class: "insight info", style: "margin-bottom:14px" }, [
        el("span", { class: "ico", text: "🍽️" }),
        el("div", { class: "txt", html: "<b>" + food.name + "</b><br><span style='color:var(--txt-faint)'>" + food.cat + " · " + food.kcal + " kcal por 100 g</span>" })
      ]),
      el("div", { class: "field" }, [el("label", { text: "Cantidad (gramos)" }), gramsI]),
      preview,
      el("button", { class: "btn primary block", style: "margin-top:16px", html: "＋ Agregar al día", onclick: () => {
        const g = Number(gramsI.value) || 0;
        if (g <= 0) { Audio.play("error"); toast({ icon: "⚠️", msg: "Indica los gramos" }); return; }
        addEntry(food, g); Audio.play("coin");
        toast({ icon: "🍽️", title: "Agregado", msg: food.name + " (" + Math.round(g) + " g)" });
        UI.closeModal();
        render(document.getElementById("view-nutrition"));
        N.App && N.App.refreshTop();
      } })
    ]);
    UI.openModal("Agregar " + food.name, body);
    paint();
  }

  function macroBox(label, val, unit, color) {
    return el("div", { class: "card", style: "padding:12px;text-align:center" }, [
      el("div", { class: "kpi-val", style: "font-size:22px;color:" + color, text: fmt.num(val) }),
      el("div", { class: "kpi-lbl", text: label + (unit ? " (" + unit + ")" : "") })
    ]);
  }

  // ---------------- Render ----------------
  function render(container) {
    container.innerHTML = "";
    const t = dayTotals(today());

    container.appendChild(el("div", { class: "view-head" }, [
      el("div", {}, [
        el("h1", { class: "view-title" }, [N.Icons.node("plate"), "Alimentación"]),
        el("p", { class: "view-desc", text: "Registra lo que comes y controla tus calorías y macros del día." })
      ]),
      el("button", { class: "btn primary", onclick: openBrowser, html: "＋ Agregar alimento" })
    ]));

    // Totales de hoy
    container.appendChild(el("div", { class: "grid cols-4 mb-16" }, [
      kpi("Calorías hoy", fmt.num(t.kcal), "kcal", "warn"),
      kpi("Proteínas", fmt.num(r1(t.prot)) + " g", "hoy", "good"),
      kpi("Carbohidratos", fmt.num(r1(t.carb)) + " g", "hoy", "accent"),
      kpi("Alimentos", log().filter((x) => x.date === today()).length + "", "registrados", "accent")
    ]));

    // Gráficos separados (7 días)
    const charts = el("div", { class: "grid cols-3 mb-16" }, [
      chartCard("Calorías · 7 días", "kcal", "--warn"),
      chartCard("Proteínas (g) · 7 días", "prot", "--good"),
      chartCard("Carbohidratos (g) · 7 días", "carb", "--accent")
    ]);
    container.appendChild(charts);

    // Consumido hoy
    const listCard = el("div", { class: "card" }, [
      el("div", { class: "card-head" }, [
        el("div", { class: "card-title" }, [el("span", { class: "dot" }), "Consumido hoy"]),
        el("button", { class: "btn sm", html: "🍽️ Ver alimentos", onclick: openBrowser })
      ])
    ]);
    const todayItems = log().filter((x) => x.date === today()).slice().reverse();
    if (!todayItems.length) {
      listCard.appendChild(el("div", { class: "empty" }, [el("span", { class: "big", text: "🍽️" }), el("div", { text: "Aún no registras alimentos hoy." })]));
    } else {
      todayItems.forEach((e) => {
        listCard.appendChild(el("div", { class: "item" }, [
          el("div", { class: "item-main" }, [
            el("div", { class: "item-title", text: e.name }),
            el("div", { class: "item-meta" }, [
              el("span", { class: "chip", text: e.grams + " g" }),
              el("span", { class: "chip warn", text: e.kcal + " kcal" }),
              el("span", { class: "text-faint fs-12", text: "P " + e.prot + "g · C " + e.carb + "g" })
            ])
          ]),
          el("button", { class: "icon-btn", html: "🗑️", title: "Eliminar", onclick: () => removeEntry(e) })
        ]));
      });
    }
    container.appendChild(listCard);
  }

  function chartCard(title, macro, color) {
    const card = el("div", { class: "card" }, [
      el("div", { class: "card-head" }, [el("div", { class: "card-title", style: "font-size:13px" }, [el("span", { class: "dot" }), title])])
    ]);
    const cv = el("canvas");
    card.appendChild(el("div", { class: "chart-box" }, [cv]));
    setTimeout(() => Charts.bars(cv, { labels: series(macro).labels, series: [{ values: series(macro).values, color: color }] }, { height: 150 }), 30);
    return card;
  }

  function kpi(label, val, sub, cls) {
    return el("div", { class: "card" }, [el("div", { class: "kpi" }, [
      el("div", { class: "kpi-lbl", text: label }), el("div", { class: "kpi-val " + (cls || ""), text: val }), el("div", { class: "kpi-sub", text: sub })
    ])]);
  }

  N.Nutrition = { render, dayTotals };
})();
