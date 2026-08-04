const defaults = Object.freeze({
  d: 0.75,
  t: 0.08,
  k: 4,
  p: 1
});

const parameterIds = Object.keys(defaults);
const sliders = Object.fromEntries(
  parameterIds.map((id) => [id, document.getElementById(id)])
);
const numbers = Object.fromEntries(
  parameterIds.map((id) => [id, document.getElementById(`${id}Number`)])
);

const $ = (id) => document.getElementById(id);

const fmt = (value, decimals = 3) =>
  Number(value).toLocaleString("es-EC", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function updateProgress(input) {
  const min = Number(input.min);
  const max = Number(input.max);
  const value = Number(input.value);
  const percentage = ((value - min) / (max - min)) * 100;
  input.style.setProperty("--progress", `${percentage}%`);
}

function sync(id, source) {
  const slider = sliders[id];
  const number = numbers[id];
  const min = Number(slider.min);
  const max = Number(slider.max);
  const step = Number(slider.step);

  let value = Number(source.value);
  if (!Number.isFinite(value)) value = defaults[id];

  value = clamp(value, min, max);
  value = Math.round(value / step) * step;

  slider.value = String(value);
  number.value = String(value);
  updateProgress(slider);
}

function readValues() {
  return Object.fromEntries(
    parameterIds.map((id) => [id, Number(sliders[id].value)])
  );
}

function validate({ d, t, k, p }) {
  const errors = [];

  if (d <= 0 || t <= 0 || p <= 0) {
    errors.push("El diámetro, el espesor y la carga deben ser mayores que cero.");
  }

  if (2 * t >= d) {
    errors.push("La geometría no es válida: debe cumplirse 2t < D.");
  }

  if (k <= 1) {
    errors.push("La relación k debe ser mayor que 1.");
  }

  return errors;
}

function calculate({ d, t, k, p }) {
  const di = d - 2 * t;
  const area = (Math.PI / 4) * (d ** 2 - di ** 2);
  const inertia = (Math.PI / 64) * (d ** 4 - di ** 4);
  const c = d / 2;

  const h = ((k - 1) * inertia) / (area * c);

  // P en kip y área en pulg² producen esfuerzo en ksi.
  const straightStress = p / area;
  const moment = p * h;
  const bendingStress = (moment * c) / inertia;
  const bentStress = straightStress + bendingStress;
  const ratio = bentStress / straightStress;

  return {
    di,
    area,
    inertia,
    c,
    h,
    hMm: h * 25.4,
    straightStress,
    moment,
    bendingStress,
    bentStress,
    ratio
  };
}

function updateSectionGraphic(values, result) {
  $("doLabel").textContent = `D = ${fmt(values.d, 2)}`;
  $("cLabel").textContent = `c = ${fmt(result.c, 3)}`;
  $("tLabel").textContent = `t = ${fmt(values.t, 2)}`;
  $("straightDLabel").textContent = `D = ${fmt(values.d, 2)} pulg`;

  const outerRadius = 78;
  const innerRatio = result.di / values.d;
  const innerRadius = clamp(outerRadius * innerRatio, 8, outerRadius - 6);
  $("innerCircle").setAttribute("r", String(innerRadius));
}

function updateGauge(result, values) {
  const normalized = clamp(result.ratio / Math.max(values.k, 1), 0, 1);
  const degrees = normalized * 220;

  $("ratioGauge").style.background =
    `conic-gradient(from 220deg, #20c997 0deg, #20c997 ${degrees}deg, ` +
    `#182b42 ${degrees}deg, #182b42 280deg, transparent 280deg)`;
}

function buildReport(values, result) {
  return [
    "EJERCICIO 4.112 — MÁXIMO DOBLEZ EN UN TUBO",
    "",
    "DATOS",
    `Diámetro exterior D = ${fmt(values.d, 3)} pulg`,
    `Espesor t = ${fmt(values.t, 3)} pulg`,
    `Relación máxima k = ${fmt(values.k, 2)}`,
    `Carga de referencia P = ${fmt(values.p, 2)} kip`,
    "",
    "PROPIEDADES",
    `Diámetro interior Di = ${fmt(result.di, 4)} pulg`,
    `Área A = ${fmt(result.area, 6)} pulg²`,
    `Momento de inercia I = ${fmt(result.inertia, 6)} pulg⁴`,
    `c = ${fmt(result.c, 4)} pulg`,
    "",
    "ECUACIÓN",
    "hmax = (k - 1) I / (A c)",
    "",
    "RESULTADO",
    `hmax = ${fmt(result.h, 4)} pulg`,
    `hmax = ${fmt(result.hMm, 2)} mm`,
    "",
    "VERIFICACIÓN",
    `σrecto = ${fmt(result.straightStress, 3)} ksi`,
    `σflexión = ${fmt(result.bendingStress, 3)} ksi`,
    `σmáx doblado = ${fmt(result.bentStress, 3)} ksi`,
    `σmáx / σrecto = ${fmt(result.ratio, 3)}`,
    "",
    "Modelo: esfuerzo axial excéntrico y flexión combinada."
  ].join("\n");
}

function render(animate = false) {
  const values = readValues();

  parameterIds.forEach((id) => {
    numbers[id].value = sliders[id].value;
    updateProgress(sliders[id]);
  });

  const errors = validate(values);

  if (errors.length) {
    $("warningText").textContent = errors.join(" ");
    $("warning").classList.remove("hidden");
    return;
  }

  $("warning").classList.add("hidden");

  const result = calculate(values);
  window.currentCalculation = { values, result };

  $("diResult").textContent = fmt(result.di, 3);
  $("areaResult").textContent = fmt(result.area, 4);
  $("inertiaResult").textContent = fmt(result.inertia, 5);
  $("hResult").textContent = fmt(result.h, 3);

  $("hBigResult").textContent = fmt(result.h, 4);
  $("hMmResult").textContent = fmt(result.hMm, 2);

  $("straightStressResult").textContent = fmt(result.straightStress, 2);
  $("bendingStressResult").textContent = fmt(result.bendingStress, 2);
  $("bentStressResult").textContent = fmt(result.bentStress, 2);
  $("ratioResult").textContent = fmt(result.ratio, 2);

  $("diCalc").textContent =
    `${fmt(values.d, 2)} − 2(${fmt(values.t, 2)}) = ${fmt(result.di, 3)} pulg`;
  $("areaCalc").textContent = `A = ${fmt(result.area, 6)} pulg²`;
  $("inertiaCalc").textContent = `I = ${fmt(result.inertia, 6)} pulg⁴`;
  $("cCalc").textContent = `c = ${fmt(result.c, 4)} pulg`;

  $("hSubstitution").textContent =
    `h = (${fmt(values.k, 1)} − 1)(${fmt(result.inertia, 6)}) / ` +
    `(${fmt(result.area, 6)} × ${fmt(result.c, 4)})`;

  $("hDiagramLabel").textContent = `h = ${fmt(result.h, 3)} pulg`;
  $("verificationText").textContent =
    `El esfuerzo máximo es ${fmt(result.ratio, 2)} veces el esfuerzo recto.`;

  updateSectionGraphic(values, result);
  updateGauge(result, values);

  if (animate) {
    document.querySelectorAll(".card, .kpi-card").forEach((element) => {
      element.classList.remove("flash");
      void element.offsetWidth;
      element.classList.add("flash");
    });
  }
}

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}

parameterIds.forEach((id) => {
  sliders[id].addEventListener("input", (event) => {
    sync(id, event.target);
    render(false);
  });

  numbers[id].addEventListener("input", (event) => {
    sync(id, event.target);
    render(false);
  });

  numbers[id].addEventListener("blur", (event) => {
    sync(id, event.target);
    render(false);
  });
});

$("calculateBtn").addEventListener("click", () => render(true));

$("resetBtn").addEventListener("click", () => {
  parameterIds.forEach((id) => {
    sliders[id].value = String(defaults[id]);
    numbers[id].value = String(defaults[id]);
  });
  render(true);
  showToast("Valores restablecidos");
});

$("copyBtn").addEventListener("click", async () => {
  const { values, result } = window.currentCalculation;
  const text = buildReport(values, result);

  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }

  showToast("Resultados copiados");
});

$("downloadBtn").addEventListener("click", () => {
  const { values, result } = window.currentCalculation;
  const text = buildReport(values, result);
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "ejercicio_4_112_resultados.txt";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  showToast("Reporte descargado");
});

render(false);
