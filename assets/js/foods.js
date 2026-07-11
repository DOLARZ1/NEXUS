/* =====================================================================
   NEXUS · FOODS — base de datos nutricional (valores aproximados por 100 g)
   Campos: name, cat, kcal, prot (proteína g), carb (carbohidratos g)
   Los valores son estimados con fines informativos.
   ===================================================================== */
(function () {
  "use strict";
  const N = window.NEXUS || (window.NEXUS = {});

  const CATS = [
    "Carnes y proteínas", "Frutas", "Verduras", "Cereales y panes",
    "Lácteos", "Platillos mexicanos", "Comida rápida", "Snacks / chatarra", "Bebidas"
  ];

  const F = (name, cat, kcal, prot, carb) => ({ name, cat, kcal, prot, carb });

  const FOODS = [
    // ---------- Carnes y proteínas ----------
    F("Pechuga de pollo", "Carnes y proteínas", 165, 31, 0),
    F("Muslo de pollo", "Carnes y proteínas", 209, 26, 0),
    F("Carne de res magra", "Carnes y proteínas", 250, 26, 0),
    F("Bistec de res", "Carnes y proteínas", 271, 25, 0),
    F("Carne molida de res", "Carnes y proteínas", 254, 26, 0),
    F("Lomo de cerdo", "Carnes y proteínas", 242, 27, 0),
    F("Chuleta de cerdo", "Carnes y proteínas", 231, 26, 0),
    F("Chorizo", "Carnes y proteínas", 455, 24, 2),
    F("Tocino", "Carnes y proteínas", 541, 37, 1.4),
    F("Jamón", "Carnes y proteínas", 145, 21, 1.5),
    F("Salchicha", "Carnes y proteínas", 300, 12, 2),
    F("Tilapia", "Carnes y proteínas", 96, 20, 0),
    F("Salmón", "Carnes y proteínas", 208, 20, 0),
    F("Atún en agua", "Carnes y proteínas", 116, 26, 0),
    F("Camarón", "Carnes y proteínas", 99, 24, 0),
    F("Huevo", "Carnes y proteínas", 155, 13, 1.1),
    F("Clara de huevo", "Carnes y proteínas", 52, 11, 0.7),

    // ---------- Frutas ----------
    F("Manzana", "Frutas", 52, 0.3, 14),
    F("Plátano", "Frutas", 89, 1.1, 23),
    F("Naranja", "Frutas", 47, 0.9, 12),
    F("Fresa", "Frutas", 32, 0.7, 8),
    F("Uva", "Frutas", 69, 0.7, 18),
    F("Sandía", "Frutas", 30, 0.6, 8),
    F("Melón", "Frutas", 34, 0.8, 8),
    F("Piña", "Frutas", 50, 0.5, 13),
    F("Mango", "Frutas", 60, 0.8, 15),
    F("Papaya", "Frutas", 43, 0.5, 11),
    F("Pera", "Frutas", 57, 0.4, 15),
    F("Durazno", "Frutas", 39, 0.9, 10),
    F("Aguacate", "Frutas", 160, 2, 9),
    F("Toronja", "Frutas", 42, 0.8, 11),
    F("Kiwi", "Frutas", 61, 1.1, 15),
    F("Guayaba", "Frutas", 68, 2.6, 14),

    // ---------- Verduras ----------
    F("Brócoli", "Verduras", 34, 2.8, 7),
    F("Zanahoria", "Verduras", 41, 0.9, 10),
    F("Espinaca", "Verduras", 23, 2.9, 3.6),
    F("Jitomate", "Verduras", 18, 0.9, 3.9),
    F("Lechuga", "Verduras", 15, 1.4, 2.9),
    F("Pepino", "Verduras", 16, 0.7, 3.6),
    F("Cebolla", "Verduras", 40, 1.1, 9),
    F("Papa", "Verduras", 77, 2, 17),
    F("Camote", "Verduras", 86, 1.6, 20),
    F("Chile jalapeño", "Verduras", 29, 0.9, 6),
    F("Calabacita", "Verduras", 17, 1.2, 3.1),
    F("Ejotes", "Verduras", 31, 1.8, 7),
    F("Champiñón", "Verduras", 22, 3.1, 3.3),
    F("Elote", "Verduras", 86, 3.2, 19),
    F("Nopal", "Verduras", 16, 1.3, 3.3),

    // ---------- Cereales y panes ----------
    F("Arroz blanco cocido", "Cereales y panes", 130, 2.7, 28),
    F("Arroz integral cocido", "Cereales y panes", 111, 2.6, 23),
    F("Pan blanco", "Cereales y panes", 265, 9, 49),
    F("Pan integral", "Cereales y panes", 247, 13, 41),
    F("Tortilla de maíz", "Cereales y panes", 218, 5.7, 45),
    F("Tortilla de harina", "Cereales y panes", 304, 8, 51),
    F("Avena", "Cereales y panes", 389, 17, 66),
    F("Pasta cocida", "Cereales y panes", 131, 5, 25),
    F("Frijol cocido", "Cereales y panes", 127, 9, 23),
    F("Lenteja cocida", "Cereales y panes", 116, 9, 20),

    // ---------- Lácteos ----------
    F("Leche entera", "Lácteos", 61, 3.2, 4.8),
    F("Leche descremada", "Lácteos", 34, 3.4, 5),
    F("Yogur natural", "Lácteos", 59, 10, 3.6),
    F("Queso panela", "Lácteos", 215, 18, 3),
    F("Queso Oaxaca", "Lácteos", 350, 25, 3),
    F("Queso manchego", "Lácteos", 350, 24, 2),
    F("Crema", "Lácteos", 300, 2.5, 3),
    F("Requesón", "Lácteos", 98, 11, 3.4),

    // ---------- Platillos mexicanos ----------
    F("Tacos al pastor", "Platillos mexicanos", 220, 12, 18),
    F("Tacos de bistec", "Platillos mexicanos", 200, 14, 16),
    F("Quesadilla", "Platillos mexicanos", 280, 12, 26),
    F("Enchiladas", "Platillos mexicanos", 180, 8, 20),
    F("Pozole", "Platillos mexicanos", 90, 6, 9),
    F("Chilaquiles", "Platillos mexicanos", 190, 6, 22),
    F("Tamal", "Platillos mexicanos", 230, 5, 30),
    F("Guacamole", "Platillos mexicanos", 160, 2, 9),
    F("Mole con pollo", "Platillos mexicanos", 160, 10, 12),
    F("Frijoles refritos", "Platillos mexicanos", 135, 6, 18),
    F("Sope", "Platillos mexicanos", 250, 7, 30),
    F("Tostada", "Platillos mexicanos", 240, 8, 30),
    F("Chile relleno", "Platillos mexicanos", 210, 9, 12),
    F("Huevos rancheros", "Platillos mexicanos", 170, 9, 12),
    F("Carne asada", "Platillos mexicanos", 250, 26, 2),
    F("Torta de milanesa", "Platillos mexicanos", 260, 12, 28),

    // ---------- Comida rápida ----------
    F("Hamburguesa", "Comida rápida", 254, 13, 30),
    F("Hamburguesa con queso", "Comida rápida", 300, 15, 30),
    F("Pizza", "Comida rápida", 266, 11, 33),
    F("Hot dog", "Comida rápida", 290, 10, 24),
    F("Papas a la francesa", "Comida rápida", 312, 3.4, 41),
    F("Pollo frito", "Comida rápida", 246, 19, 8),
    F("Nuggets de pollo", "Comida rápida", 296, 15, 16),
    F("Burrito", "Comida rápida", 206, 8, 24),
    F("Sándwich", "Comida rápida", 250, 11, 28),
    F("Alitas", "Comida rápida", 290, 27, 1),

    // ---------- Snacks / chatarra ----------
    F("Papas fritas (bolsa)", "Snacks / chatarra", 536, 7, 53),
    F("Nachos / Doritos", "Snacks / chatarra", 498, 7, 63),
    F("Chocolate", "Snacks / chatarra", 546, 5, 61),
    F("Galletas", "Snacks / chatarra", 480, 6, 64),
    F("Dona", "Snacks / chatarra", 452, 5, 51),
    F("Palomitas", "Snacks / chatarra", 387, 12, 78),
    F("Cacahuates", "Snacks / chatarra", 567, 26, 16),
    F("Helado", "Snacks / chatarra", 207, 3.5, 24),
    F("Pastel", "Snacks / chatarra", 350, 5, 50),
    F("Churros", "Snacks / chatarra", 400, 5, 55),
    F("Gomitas", "Snacks / chatarra", 396, 0, 98),

    // ---------- Bebidas (por 100 ml) ----------
    F("Agua", "Bebidas", 0, 0, 0),
    F("Refresco de cola", "Bebidas", 42, 0, 11),
    F("Refresco light", "Bebidas", 0, 0, 0),
    F("Jugo de naranja", "Bebidas", 45, 0.7, 10),
    F("Cerveza", "Bebidas", 43, 0.5, 3.6),
    F("Café negro", "Bebidas", 2, 0.1, 0),
    F("Café con leche", "Bebidas", 55, 3, 6),
    F("Té sin azúcar", "Bebidas", 1, 0, 0),
    F("Leche con chocolate", "Bebidas", 83, 3, 11),
    F("Bebida energética", "Bebidas", 45, 0, 11),
    F("Agua de horchata", "Bebidas", 80, 1, 16),
    F("Licuado de plátano", "Bebidas", 90, 3, 15),
    F("Vino", "Bebidas", 83, 0.1, 2.6),
    F("Limonada", "Bebidas", 40, 0, 10)
  ];

  N.FOODS = FOODS;
  N.FOOD_CATS = CATS;
})();
