/* =====================================================================
   OCTANAJE · Quotes — frases motivacionales (disciplina, hábitos, salud)
   ===================================================================== */
(function () {
  "use strict";
  const N = window.NEXUS || (window.NEXUS = {});

  N.QUOTES = [
    { text: "La disciplina es elegir entre lo que quieres ahora y lo que quieres más.", author: "Abraham Lincoln" },
    { text: "No cuenta lo que haces una vez, cuenta lo que haces todos los días.", author: "Anónimo" },
    { text: "El éxito es la suma de pequeños esfuerzos repetidos día tras día.", author: "Robert Collier" },
    { text: "La motivación te hace empezar, el hábito te hace continuar.", author: "Jim Ryun" },
    { text: "Cada día es una nueva oportunidad para cambiar tu vida.", author: "Anónimo" },
    { text: "No esperes el momento perfecto, toma el momento y hazlo perfecto.", author: "Anónimo" },
    { text: "El cuerpo logra lo que la mente cree.", author: "Anónimo" },
    { text: "La constancia vence lo que la dicha no alcanza.", author: "Miguel de Cervantes" },
    { text: "Un pequeño progreso cada día suma grandes resultados.", author: "Anónimo" },
    { text: "Tu única competencia es la persona que fuiste ayer.", author: "Anónimo" },
    { text: "La disciplina es el puente entre metas y logros.", author: "Jim Rohn" },
    { text: "No se trata de tener tiempo, se trata de hacer tiempo.", author: "Anónimo" },
    { text: "El dolor que sientes hoy será la fuerza que sientas mañana.", author: "Anónimo" },
    { text: "Los hábitos de hoy son los resultados de mañana.", author: "Anónimo" },
    { text: "El esfuerzo que nadie ve es el que construye a la persona que todos admiran.", author: "Anónimo" },
    { text: "Actúa como si lo que haces marcara la diferencia. Marca la diferencia.", author: "William James" },
    { text: "El único mal entrenamiento es el que no hiciste.", author: "Anónimo" },
    { text: "No cuentes los días, haz que los días cuenten.", author: "Muhammad Ali" },
    { text: "La fuerza no viene de ganar. Tus luchas desarrollan tu fuerza.", author: "Arnold Schwarzenegger" },
    { text: "Cuida tu cuerpo, es el único lugar que tienes para vivir.", author: "Jim Rohn" },
    { text: "Nunca es tarde para ser quien quieres ser.", author: "F. Scott Fitzgerald" },
    { text: "El progreso, no la perfección, es lo que importa.", author: "Anónimo" },
    { text: "Levántate, arréglate, aparece y nunca te rindas.", author: "Anónimo" },
    { text: "Las metas grandes se logran con hábitos pequeños y constantes.", author: "James Clear" },
    { text: "No pares cuando estés cansado. Para cuando hayas terminado.", author: "Anónimo" },
    { text: "Cada minuto que pasas enojado, pierdes sesenta segundos de felicidad.", author: "Ralph Waldo Emerson" },
    { text: "Sé más fuerte que tu excusa más fuerte.", author: "Anónimo" },
    { text: "El futuro depende de lo que hagas hoy.", author: "Mahatma Gandhi" },
    { text: "La disciplina pesa gramos, el arrepentimiento pesa toneladas.", author: "Anónimo" },
    { text: "No busques motivación, construye disciplina.", author: "Anónimo" },
    { text: "Tu salud es una inversión, no un gasto.", author: "Anónimo" },
    { text: "Hazlo con miedo, hazlo cansado, pero hazlo.", author: "Anónimo" },
    { text: "El camino al éxito y el camino al fracaso son casi exactamente el mismo.", author: "Colin R. Davis" },
    { text: "Todo lo que siempre quisiste está al otro lado del miedo.", author: "George Addair" },
    { text: "La mente es lo primero que se rinde, entrénala también.", author: "Anónimo" },
    { text: "Sin esfuerzo, no hay progreso ni ganancia.", author: "Napoleon Hill" },
    { text: "Convierte tus heridas en sabiduría.", author: "Oprah Winfrey" },
    { text: "El que se levanta más veces gana, no el que nunca cae.", author: "Anónimo" },
    { text: "Nada cambia si nada cambia.", author: "Anónimo" },
    { text: "Un objetivo sin un plan es solo un deseo.", author: "Antoine de Saint-Exupéry" },
    { text: "La perseverancia no es una carrera larga; son muchas carreras cortas, una tras otra.", author: "Walter Elliot" },
    { text: "Cree que puedes y ya estás a mitad de camino.", author: "Theodore Roosevelt" },
    { text: "Tu futuro yo te está agradeciendo por lo que hagas hoy.", author: "Anónimo" },
    { text: "El descanso también es parte del entrenamiento.", author: "Anónimo" },
    { text: "No dejes para mañana lo que puedes disciplinar hoy.", author: "Anónimo" },
    { text: "La consistencia vence al talento cuando el talento no es consistente.", author: "Anónimo" },
    { text: "Enfócate en el progreso, no en la perfección.", author: "Anónimo" },
    { text: "Haz de la excelencia un hábito, no un acto.", author: "Aristóteles" },
    { text: "Cada racha comienza con un solo día. Hoy es ese día.", author: "Anónimo" },
    { text: "Las metas te dan dirección; los hábitos te dan el camino.", author: "Anónimo" },
    { text: "Invierte en ti mismo, es el activo que nunca pierde valor.", author: "Anónimo" },
    { text: "El mejor proyecto en el que trabajarás siempre serás tú mismo.", author: "Anónimo" },
    { text: "No se trata de ser el mejor, se trata de ser mejor que ayer.", author: "Anónimo" }
  ];

  // frase determinística según la fecha (cambia cada día) — con opción de
  // pasar un índice fijo para refrescar manualmente a otra frase distinta.
  N.pickQuote = function (dateKey, forcedIdx) {
    const n = N.QUOTES.length;
    if (typeof forcedIdx === "number") return N.QUOTES[((forcedIdx % n) + n) % n];
    let hash = 0;
    const str = String(dateKey || "");
    for (let i = 0; i < str.length; i++) { hash = (hash * 31 + str.charCodeAt(i)) >>> 0; }
    return N.QUOTES[hash % n];
  };
})();
