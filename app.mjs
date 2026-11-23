import { cities, plan, formatAir, nextAirWindow } from './planner.mjs';

const el = id => document.getElementById(id);
const form = el('plan');
let version = 0;
let readingRequest = 0;
let currentPlan;

/* ─── Field-level validation ─── */
const validations = {
  trips: {
    check: v => Number.isInteger(v) && v >= 1 && v <= 20,
    msg: 'Enter a whole number from 1 to 20.'
  },
  km: {
    check: v => Number.isFinite(v) && v >= 0.1 && v <= 500,
    msg: 'Enter a distance between 0.1 and 500 km.'
  },
  combined: {
    check: v => Number.isFinite(v) && v >= 0.1 && v <= 1000,
    msg: 'Enter a distance between 0.1 and 1000 km.'
  }
};

function validateField(id) {
  const input = el(id);
  const errEl = el(id + '-err');
  const rule = validations[id];
  if (!rule) return true;

  const v = input.valueAsNumber;
  const ok = rule.check(v) && !input.validity.stepMismatch;
  input.setAttribute('aria-invalid', String(!ok));

  if (ok) {
    input.classList.remove('invalid');
    errEl.classList.remove('visible');
    errEl.textContent = '';
  } else {
    input.classList.add('invalid');
    errEl.classList.add('visible');
    errEl.textContent = input.validity.stepMismatch && id !== 'trips' ? 'Use at most one decimal place.' : rule.msg;
  }
  return ok;
}

function validateAll() {
  let ok = true;
  for (const id of Object.keys(validations)) {
    if (!validateField(id)) ok = false;
  }
  return ok;
}

/* ─── Route comparison timetable renderer ─── */
function renderTimetable(p, trips, km, combined) {
  const target = el('result');
  target.replaceChildren();

  const separateTotal = Math.round(trips * km * 10) / 10;
  const combinedKm = Math.round(combined * 10) / 10;
  const maxKm = Math.max(separateTotal, combinedKm, 0.1);

  // Build table via DOM text APIs
  const table = document.createElement('table');
  table.className = 'route-table';

  const caption = document.createElement('caption');
  caption.textContent = p.outing;
  table.appendChild(caption);

  // Thead
  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  for (const text of ['Route', 'Distance', 'Total km']) {
    const th = document.createElement('th');
    th.textContent = text;
    headRow.appendChild(th);
  }
  thead.appendChild(headRow);
  table.appendChild(thead);

  // Tbody — two rows: Separate trips, Combined route
  const tbody = document.createElement('tbody');
  const rows = [
    { label: trips + ' separate trip' + (trips > 1 ? 's' : ''), km: separateTotal, cls: 'separate' },
    { label: 'Combined route', km: combinedKm, cls: 'combined' }
  ];

  const isEqual = separateTotal === combinedKm;

  for (const row of rows) {
    const tr = document.createElement('tr');

    const tdLabel = document.createElement('td');
    tdLabel.className = 'col-label';
    tdLabel.textContent = row.label;
    tr.appendChild(tdLabel);

    const tdBar = document.createElement('td');
    tdBar.className = 'col-bar';
    const track = document.createElement('div');
    track.className = 'bar-track';
    const fill = document.createElement('div');
    fill.className = 'bar-fill ' + row.cls;
    const pct = (row.km / maxKm) * 100;
    fill.style.width = pct + '%';
    track.appendChild(fill);
    // Equal-length marker when both bars are the same
    if (isEqual) {
      const mark = document.createElement('div');
      mark.className = 'bar-equal-mark';
      fill.appendChild(mark);
    }
    tdBar.appendChild(track);
    tr.appendChild(tdBar);

    const tdKm = document.createElement('td');
    tdKm.className = 'col-km';
    tdKm.textContent = row.km + ' km';
    tr.appendChild(tdKm);

    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  target.appendChild(table);

  // Verdict block
  const delta = Math.round((separateTotal - combinedKm) * 10) / 10;
  const isDetour = delta < 0;
  const verdict = document.createElement('div');
  verdict.className = 'verdict' + (isDetour ? ' detour' : '');

  const deltaEl = document.createElement('div');
  deltaEl.className = 'delta';
  if (delta === 0) {
    deltaEl.textContent = 'Same distance — no km saved or added.';
  } else {
    deltaEl.textContent = Math.abs(delta) + ' vehicle-km ' + (isDetour ? 'added by the detour.' : 'avoided by combining.');
  }
  verdict.appendChild(deltaEl);

  const calcEl = document.createElement('div');
  calcEl.className = 'calc';
  calcEl.textContent = p.calculation;
  verdict.appendChild(calcEl);

  target.appendChild(verdict);

  // Advice rows: indoor
  const adviceBlock = document.createElement('div');
  adviceBlock.className = 'advice-row';

  const indoorLabel = document.createElement('span');
  indoorLabel.className = 'advice-label';
  indoorLabel.textContent = 'At home';
  adviceBlock.appendChild(indoorLabel);

  const indoorText = document.createElement('span');
  indoorText.className = 'advice-text';
  indoorText.textContent = p.indoor;
  adviceBlock.appendChild(indoorText);

  target.appendChild(adviceBlock);
}

/* ─── Main render ─── */
function render() {
  version++;
  const valid = validateAll();
  const target = el('result');

  // Reset briefing hint on input changes — use current version for stale check
  el('brief').textContent = 'Gemini Nano writes a short English briefing on supported Chrome devices. The first use may download the model.';

  if (!valid) {
    currentPlan = null;
    target.replaceChildren();
    const err = document.createElement('p');
    err.className = 'error-state';
    err.textContent = 'Check the marked trip fields.';
    target.appendChild(err);
    return;
  }

  const trips = el('trips').valueAsNumber;
  const km = el('km').valueAsNumber;
  const combined = el('combined').valueAsNumber;

  currentPlan = plan({
    outing: el('outing').value,
    source: el('source').value,
    trips,
    km,
    combined
  });

  if (!currentPlan) {
    target.replaceChildren();
    const err = document.createElement('p');
    err.className = 'error-state';
    err.textContent = 'Could not build a plan from these inputs.';
    target.appendChild(err);
    return;
  }

  renderTimetable(currentPlan, trips, km, combined);
}

/* ─── Events ─── */
form.addEventListener('submit', e => e.preventDefault());

form.addEventListener('input', e => {

  if (e.target === el('city')) {
    readingRequest++;
    el('air').textContent = 'No reading loaded for ' + el('city').value + '.';
  }
  render();
});

/* ─── Air quality fetch ─── */
el('refresh').onclick = async () => {
  const request = ++readingRequest;
  const [latitude, longitude] = cities[el('city').value];
  el('air').textContent = 'Retrieving city estimate…';
  render();

  try {
    const params = new URLSearchParams({
      latitude, longitude,
      current: 'pm2_5', hourly: 'pm2_5', forecast_days: '2',
      timeformat: 'unixtime'
    });
    const response = await fetch(
      'https://air-quality-api.open-meteo.com/v1/air-quality?' + params,
      { signal: AbortSignal.timeout(9000) }
    );
    if (!response.ok) throw Error('provider');
    const data = await response.json();
    const text = [formatAir(data), nextAirWindow(data)].filter(Boolean).join(' ');
    if (request === readingRequest) el('air').textContent = text;
  } catch {
    if (request === readingRequest) {
      el('air').textContent = 'A recent estimate is unavailable. Check the official AQI dashboard below.';
    }
  } finally {
    if (request === readingRequest) render();
  }
};

/* ─── Gemini Nano briefing — stale-safe ─── */
el('generate').onclick = async () => {
  if (!currentPlan) {
    // Trigger visible field errors instead of native reportValidity
    validateAll();
    return;
  }

  const revision = version;
  const button = el('generate');
  const status = el('brief');
  // Snapshot the plan and air text at generation time
  const planSnapshot = Object.assign({}, currentPlan);
  const airSnapshot = el('air').textContent;
  const citySnapshot = el('city').value;

  let session;
  button.disabled = true;

  try {
    const model = globalThis.LanguageModel;
    const options = {
      expectedInputs: [{ type: 'text', languages: ['en'] }],
      expectedOutputs: [{ type: 'text', languages: ['en'] }]
    };
    if (!model || await model.availability(options) === 'unavailable') {
      throw Error('unavailable');
    }

    // Check staleness after async availability check
    if (revision !== version) { button.disabled = false; return; }

    status.textContent = 'Preparing the on-device model…';
    session = await model.create(options);

    // Check staleness after async model creation
    if (revision !== version) { button.disabled = false; return; }

    const prompt =
      'Write a three-sentence English briefing for a family using only the supplied plan. ' +
      'Label model estimates and missing readings accurately. ' +
      'Explain one feasible swap and its direct impact. ' +
      'Preserve the trip arithmetic. ' +
      'Examples of tone: for a longer route, say “Try a closer pickup point.” For equal distances, say “Choose whichever pickup is easier.” ' +
      'Apply only the example that fits. For a forecast describe the hour as modelled, never as safe. Avoid medical advice, emissions conversions or invented readings. Facts: ';

    const text = await session.prompt(
      prompt + JSON.stringify({ city: citySnapshot, air: airSnapshot, plan: planSnapshot })
    );

    // Final staleness guard: only write if inputs haven't changed
    if (revision === version) {
      status.textContent = 'Gemini Nano · ' + text;
    }
  } catch {
    if (revision === version) {
      status.textContent = 'On-device AI is unavailable in this browser. Your calculated household plan is ready above.';
    }
  } finally {
    session?.destroy();
    button.disabled = false;
  }
};

/* ─── Boot ─── */
render();
