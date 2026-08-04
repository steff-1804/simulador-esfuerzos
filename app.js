const defaults = {
  p: 20,
  e: 200,
  w: 80,
  h: 60,
  t: 10,
  sy: 250
};

const ids = Object.keys(defaults);
const inputs = Object.fromEntries(ids.map(id => [id, document.getElementById(id)]));
const outputs = Object.fromEntries(ids.map(id => [id, document.getElementById(`${id}Out`)]));

const $ = (id) => document.getElementById(id);
const fmt = (value, decimals = 2) =>
  Number(value).toLocaleString("es-EC", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });

function readValues() {
  return Object.fromEntries(ids.map(id => [id, Number(inputs[id].value)]));
}

function validate({ w, h, t }) {
  const messages = [];

  if (2 * t >= w || 2 * t >= h) {
    messages.push("El espesor no puede ocupar toda la sección. Debe cumplirse 2t < w y 2t < h.");
  }

  if (t <= 0 || w <= 0 || h <= 0) {
    messages.push("Las dimensiones geométricas deben ser mayores que cero.");
  }

  return messages;
}

function calculate(values) {
  const { p, e, w, h, t, sy } = values;
  const wi = w - 2 * t;
  const hi = h - 2 * t;

  // Unidades internas:
  // P en N, dimensiones en mm, I en mm^4, esfuerzos en N/mm^2 = MPa.
  const P = p * 1000;
  const A = w * h - wi * hi;
  const I = (w * Math.pow(h, 3) - wi * Math.pow(hi, 3)) / 12;
  const c = h / 2;
  const M = P * e;

  const sigmaAxial = P / A;
  const sigmaBending = (M * c) / I;
  const sigmaA = sigmaAxial + sigmaBending;
  const sigmaB = sigmaAxial - sigmaBending;
  const sigmaMax = Math.max(Math.abs(sigmaA), Math.abs(sigmaB));
  const fos = sy / sigmaMax;

  return { wi, hi, P, A, I, c, M, sigmaAxial, sigmaBending, sigmaA, sigmaB, sigmaMax, fos };
}

function updateDiagram(values) {
  $("forceLabel").textContent = `P = ${fmt(values.p, 1)} kN`;
  $("lengthLabel").textContent = `L = ${fmt(values.e, 0)} mm`;

  const forceArrow = $("forceArrow");
  const arrowLength = Math.min(105, 35 + values.p * 0.7);
  forceArrow.setAttribute("y1", String(137 - arrowLength));
  forceArrow.setAttribute("y2", "137");

  const inner = $("innerSection");
  const maxT = Math.min(values.w, values.h) / 2;
  const visualT = Math.max(9, Math.min(38, 10 + (values.t / maxT) * 30));
  inner.setAttribute("x", String(visualT));
  inner.setAttribute("y", String(visualT));
  inner.setAttribute("width", String(Math.max(20, 130 - 2 * visualT)));
  inner.setAttribute("height", String(Math.max(20, 115 - 2 * visualT)));
}

function setStatus(result) {
  const statusBox = $("statusBox");
  const utilization = result.sigmaMax / readValues().sy;

  statusBox.classList.remove("safe", "caution", "unsafe");

  if (!Number.isFinite(result.fos)) {
    statusBox.classList.add("unsafe");
    $("statusTitle").textContent = "Cálculo no válido";
    $("statusText").textContent = "Revise la geometría ingresada.";
    return;
  }

  if (utilization <= 0.67) {
    statusBox.classList.add("safe");
    $("statusTitle").textContent = "Condición aceptable";
    $("statusText").textContent = "El esfuerzo máximo está claramente por debajo del límite de fluencia.";
  } else if (utilization < 1) {
    statusBox.classList.add("caution");
    $("statusTitle").textContent = "Condición cercana al límite";
    $("statusText").textContent = "La sección todavía no fluye, pero el margen de seguridad es reducido.";
  } else {
    statusBox.classList.add("unsafe");
    $("statusTitle").textContent = "Condición no aceptable";
    $("statusText").textContent = "El esfuerzo máximo iguala o supera el límite de fluencia.";
  }
}

function render(runAnimation = false) {
  const values = readValues();
  ids.forEach(id => {
    outputs[id].value = id === "p" || id === "t" ? fmt(values[id], 1) : fmt(values[id], 0);
  });

  updateDiagram(values);

  const errors = validate(values);
  const warning = $("warning");

  if (errors.length) {
    warning.textContent = errors.join(" ");
    warning.classList.remove("hidden");
    return;
  }

  warning.classList.add("hidden");
  const r = calculate(values);

  $("areaCalc").textContent =
    `A = (${fmt(values.w, 0)} × ${fmt(values.h, 0)}) − (${fmt(r.wi, 0)} × ${fmt(r.hi, 0)})`;
  $("inertiaCalc").textContent =
    `I = [${fmt(values.w, 0)} × ${fmt(values.h, 0)}³ − ${fmt(r.wi, 0)} × ${fmt(r.hi, 0)}³] / 12`;

  $("areaResult").textContent = fmt(r.A, 0);
  $("inertiaResult").textContent = fmt(r.I, 0);
  $("momentResult").textContent = fmt(r.M / 1_000_000, 2);
  $("axialResult").textContent = fmt(r.sigmaAxial, 2);
  $("bendResult").textContent = fmt(r.sigmaBending, 2);
  $("stressAResult").textContent = `${fmt(r.sigmaA, 2)} MPa`;
  $("stressBResult").textContent = `${fmt(r.sigmaB, 2)} MPa`;
  $("maxStressResult").textContent = fmt(r.sigmaMax, 2);
  $("fosResult").textContent = fmt(r.fos, 2);

  const barScale = Math.max(r.sigmaMax, values.sy, 1);
  $("barA").style.width = `${Math.min(100, Math.abs(r.sigmaA) / barScale * 100)}%`;
  $("barB").style.width = `${Math.min(100, Math.abs(r.sigmaB) / barScale * 100)}%`;

  setStatus(r);

  if (runAnimation) {
    document.querySelectorAll(".results-panel").forEach(el => {
      el.classList.remove("pulse");
      void el.offsetWidth;
      el.classList.add("pulse");
    });

    $("log").textContent =
`SIMULACIÓN EJECUTADA
P = ${fmt(values.p, 1)} kN
e = ${fmt(values.e, 0)} mm
Sección exterior = ${fmt(values.w, 0)} × ${fmt(values.h, 0)} mm
Espesor = ${fmt(values.t, 1)} mm

A = ${fmt(r.A, 2)} mm²
I = ${fmt(r.I, 2)} mm⁴
M = ${fmt(r.M / 1_000_000, 3)} kN·m
σ axial = ${fmt(r.sigmaAxial, 3)} MPa
σ flexión = ${fmt(r.sigmaBending, 3)} MPa
σA = ${fmt(r.sigmaA, 3)} MPa
σB = ${fmt(r.sigmaB, 3)} MPa
FS = ${fmt(r.fos, 3)}`;
  }
}

ids.forEach(id => inputs[id].addEventListener("input", () => render(false)));

$("simulateBtn").addEventListener("click", () => render(true));

$("resetBtn").addEventListener("click", () => {
  ids.forEach(id => {
    inputs[id].value = defaults[id];
  });
  $("log").textContent = "Valores restablecidos. Presione “Iniciar simulación”.";
  render(true);
});

render(false);
