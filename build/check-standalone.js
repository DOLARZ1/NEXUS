/* Extrae el <script> embebido de octanaje.html y valida su sintaxis como un todo */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const html = fs.readFileSync(path.resolve(__dirname, "..", "octanaje.html"), "utf8");

// tomar el último bloque <script> ... </script> (el de la app)
const matches = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
if (!matches.length) { console.error("No se encontró bloque <script> embebido"); process.exit(1); }
const js = matches[matches.length - 1][1];
fs.writeFileSync(path.resolve(__dirname, "combined.js"), js);
console.log("Bloque JS embebido: " + js.split("\n").length + " líneas");
try {
  new vm.Script(js, { filename: "octanaje.html <script>" });
  console.log("✔ Sintaxis del bloque combinado: OK");
} catch (e) {
  console.error("✗ ERROR DE SINTAXIS en el bloque combinado:");
  console.error("   " + e.message);
  process.exit(2);
}
