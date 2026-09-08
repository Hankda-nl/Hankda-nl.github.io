'use strict';
// Fictional examples with preset outputs; no model is called.
const scenarios = {
  "complete": {
    "segments": [
      "For the sample account, ",
      [
        "direction",
        "buy"
      ],
      " ",
      [
        "product",
        "Sample Bond A"
      ],
      " for ",
      [
        "amount",
        "CNY 1 million"
      ],
      ", settling on ",
      [
        "date",
        "15 September 2026"
      ],
      "."
    ],
    "insight": "With complete information, extract the details stated explicitly and standardise the amount and date formats.",
    "instructions": [
      {
        "direction": "buy",
        "product": "Sample Bond A",
        "amount": "CNY 1,000,000",
        "date": "2026-09-15"
      }
    ],
    "status": "Complete"
  },
  "missing": {
    "segments": [
      "For the sample account, ",
      [
        "direction",
        "buy"
      ],
      " ",
      [
        "product",
        "Sample Bond A"
      ],
      ", settling on ",
      [
        "date",
        "15 September 2026"
      ],
      "."
    ],
    "insight": "The message gives no amount. Keep the known fields and flag the missing value for confirmation rather than inferring it.",
    "instructions": [
      {
        "direction": "buy",
        "product": "Sample Bond A",
        "amount": null,
        "date": "2026-09-15"
      }
    ],
    "status": "1 field to confirm"
  },
  "multiple": {
    "segments": [
      [
        "0-direction",
        "buy"
      ],
      " ",
      [
        "0-product",
        "Sample Bond A"
      ],
      " for ",
      [
        "0-amount",
        "CNY 1 million"
      ],
      ", settling on ",
      [
        "0-date",
        "15 September 2026"
      ],
      "; also ",
      [
        "1-direction",
        "sell"
      ],
      " ",
      [
        "1-product",
        "Sample Bond B"
      ],
      " for ",
      [
        "1-amount",
        "CNY 500,000"
      ],
      ", settling on ",
      [
        "1-date",
        "16 September 2026"
      ],
      "."
    ],
    "insight": "Split the message into two instructions, then extract each set of fields. Keep the amounts and dates with the correct instruction.",
    "instructions": [
      {
        "direction": "buy",
        "product": "Sample Bond A",
        "amount": "CNY 1,000,000",
        "date": "2026-09-15"
      },
      {
        "direction": "sell",
        "product": "Sample Bond B",
        "amount": "CNY 500,000",
        "date": "2026-09-16"
      }
    ],
    "status": "2 instructions"
  }
};
const labels = { direction: 'Side', product: 'Product', amount: 'Amount', date: 'Settlement date' };
const sourceMessage = document.getElementById('source-message');
const fieldResults = document.getElementById('field-results');
const instructionSwitch = document.getElementById('instruction-switch');
const explanation = document.getElementById('field-explanation');
let scenarioKey = 'complete';
let instructionIndex = 0;
let selectedField = 'amount';
let walkthroughTimer = null;
let walkthroughStage = -1;
let walkthroughPlaying = false;
let motionPaused = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const playButton = document.getElementById('play-walkthrough');
const walkthroughDescription = document.getElementById('walkthrough-description');
const workspace = document.querySelector('.demo-workspace');

function renderSource() {
  sourceMessage.replaceChildren();
  for (const segment of scenarios[scenarioKey].segments) {
    if (typeof segment === 'string') sourceMessage.append(document.createTextNode(segment));
    else {
      const mark = document.createElement('mark');
      mark.dataset.field = segment[0];
      mark.textContent = segment[1];
      sourceMessage.append(mark);
    }
  }
}

function selectField(key) {
  selectedField = key;
  const record = scenarios[scenarioKey].instructions[instructionIndex];
  const sourceKey = scenarioKey === 'multiple' ? `${instructionIndex}-${key}` : key;
  for (const mark of sourceMessage.querySelectorAll('mark')) mark.classList.toggle('highlighted', mark.dataset.field === sourceKey);
  for (const button of fieldResults.querySelectorAll('button')) {
    const selected = button.dataset.field === key;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  }
  const prefix = scenarioKey === 'multiple' ? `Instruction ${instructionIndex + 1} · ` : '';
  if (record[key] === null) explanation.textContent = `${prefix}The source gives no amount. Flag it for confirmation instead of filling it in.`;
  else if (key === 'amount') explanation.textContent = `${prefix}The amount is expressed in CNY using the units in the source; its value is unchanged.`;
  else if (key === 'date') explanation.textContent = `${prefix}The day, month and year all come from the source and are shown as YYYY-MM-DD.`;
  else explanation.textContent = `${prefix}“${record[key]}” comes directly from the highlighted source text.`;
}

function renderFields() {
  fieldResults.replaceChildren();
  const record = scenarios[scenarioKey].instructions[instructionIndex];
  for (const [key, label] of Object.entries(labels)) {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = `field-row${record[key] === null ? ' missing' : ''}`;
    row.dataset.field = key;
    row.setAttribute('aria-label', `${label}: ${record[key] ?? 'Not provided; confirm'}. View source text`);
    const name = document.createElement('span');
    name.className = 'field-name';
    name.textContent = label;
    const value = document.createElement('span');
    value.className = 'field-value';
    value.textContent = record[key] ?? 'Not provided / Confirm';
    row.append(name, value);
    row.addEventListener('click', () => selectField(key));
    fieldResults.append(row);
  }
  selectField(selectedField);
}

function renderInstructionSwitch() {
  instructionSwitch.replaceChildren();
  const records = scenarios[scenarioKey].instructions;
  instructionSwitch.hidden = records.length === 1;
  records.forEach((record, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = `Instruction ${index + 1} · ${record.direction}`;
    button.setAttribute('aria-pressed', String(index === instructionIndex));
    button.addEventListener('click', () => {
      stopWalkthrough();
      instructionIndex = index;
      for (const [i, item] of [...instructionSwitch.children].entries()) item.setAttribute('aria-pressed', String(i === index));
      renderFields();
    });
    instructionSwitch.append(button);
  });
}

function setScenario(key) {
  if (!Object.hasOwn(scenarios, key)) return;
  resetWalkthrough();
  scenarioKey = key;
  instructionIndex = 0;
  selectedField = 'amount';
  for (const button of document.querySelectorAll('[data-scenario]')) {
    const active = button.dataset.scenario === key;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  }
  document.getElementById('scenario-insight').textContent = scenarios[key].insight;
  const status = document.getElementById('output-status');
  status.textContent = scenarios[key].status;
  status.classList.toggle('warning', key === 'missing');
  renderSource();
  renderInstructionSwitch();
  renderFields();
}

for (const button of document.querySelectorAll('[data-scenario]')) button.addEventListener('click', () => setScenario(button.dataset.scenario));
setScenario('complete');

function setPlayLabel(text, icon) {
  playButton.replaceChildren();
  const symbol = document.createElement('span');
  symbol.setAttribute('aria-hidden', 'true');
  symbol.textContent = icon;
  playButton.append(symbol, document.createTextNode(text));
}

function stopWalkthrough() {
  if (walkthroughTimer !== null) window.clearTimeout(walkthroughTimer);
  walkthroughTimer = null;
  walkthroughPlaying = false;
  setPlayLabel(walkthroughStage === 3 ? 'Replay' : walkthroughStage >= 0 ? 'Resume' : 'Play walkthrough', '▶');
}

function resetWalkthrough() {
  stopWalkthrough();
  walkthroughStage = -1;
  delete workspace.dataset.stage;
  for (const button of document.querySelectorAll('[data-stage]')) {
    button.classList.remove('active', 'completed');
    button.setAttribute('aria-pressed', 'false');
  }
  walkthroughDescription.textContent = 'Press play to walk through this fictional example, or select a step directly.';
  setPlayLabel('Play walkthrough', '▶');
}

function showStage(stage) {
  walkthroughStage = stage;
  workspace.dataset.stage = String(stage);
  for (const button of document.querySelectorAll('[data-stage]')) {
    const index = Number(button.dataset.stage);
    button.classList.toggle('active', index === stage);
    button.classList.toggle('completed', index < stage);
    button.setAttribute('aria-pressed', String(index === stage));
  }
  const descriptions = [
    'Clean input: identify the content of this fictional message and retain the original text for verification.',
    scenarioKey === 'multiple' ? 'Split instructions: this message contains a buy and a sell instruction. Keep each product, amount and date together.' : 'Split instructions: this message contains one operation, so treat it as a single instruction.',
    scenarioKey === 'missing' ? 'Extract fields: the side, product and settlement date are explicit. Leave the missing amount empty and flag it for confirmation.' : 'Extract fields: read the side, product, amount and date from the source, then standardise the units and date format.',
    scenarioKey === 'missing' ? 'Check results: the amount is missing, so retain the confirmation flag. Do not infer an amount from other fields.' : scenarioKey === 'multiple' ? 'Check results: verify each instruction against its own source text. Select Instruction 1 or 2 to inspect the results.' : 'Check results: verify the source of each field, the amount conversion and the date format. Select a field to inspect its source.'
  ];
  walkthroughDescription.textContent = descriptions[stage];
  if (stage < 2) {
    for (const mark of sourceMessage.querySelectorAll('mark')) mark.classList.remove('highlighted');
  } else selectField('amount');
}

function advanceWalkthrough() {
  showStage(walkthroughStage + 1);
  if (walkthroughStage === 3) {
    stopWalkthrough();
    return;
  }
  walkthroughTimer = window.setTimeout(advanceWalkthrough, 2100);
}

playButton.addEventListener('click', () => {
  if (walkthroughPlaying) { stopWalkthrough(); return; }
  if (walkthroughStage === 3) walkthroughStage = -1;
  walkthroughPlaying = true;
  setPlayLabel('Pause', 'Ⅱ');
  advanceWalkthrough();
});
document.getElementById('reset-walkthrough').addEventListener('click', () => { resetWalkthrough(); selectField('amount'); });
for (const button of document.querySelectorAll('[data-stage]')) {
  button.setAttribute('aria-pressed', 'false');
  button.addEventListener('click', () => { stopWalkthrough(); showStage(Number(button.dataset.stage)); setPlayLabel(walkthroughStage === 3 ? 'Replay' : 'Resume', '▶'); });
}
document.addEventListener('visibilitychange', () => { if (document.hidden) stopWalkthrough(); });

// Motion is decorative and can be disabled without changing page content.
const motionToggle = document.getElementById('motion-toggle');
const portrait = document.getElementById('portrait-card');
const portraitStage = document.getElementById('portrait-stage');
function updateMotion() {
  document.body.classList.toggle('motion-paused', motionPaused);
  motionToggle.setAttribute('aria-pressed', String(motionPaused));
  motionToggle.querySelector('.motion-label').textContent = motionPaused ? 'Enable motion' : 'Pause motion';
  motionToggle.querySelector('.motion-icon').textContent = motionPaused ? '▶' : 'Ⅱ';
  motionToggle.setAttribute('aria-label', motionPaused ? 'Enable page animations' : 'Pause page animations');
  if (motionPaused) {
    portrait.style.removeProperty('--portrait-x');
    portrait.style.removeProperty('--portrait-y');
    stopWalkthrough();
  }
}
motionToggle.addEventListener('click', () => { motionPaused = !motionPaused; updateMotion(); });
updateMotion();
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
reducedMotion.addEventListener('change', event => { motionPaused = event.matches; updateMotion(); });
portraitStage.addEventListener('pointermove', event => {
  if (motionPaused || event.pointerType !== 'mouse') return;
  const rect = portraitStage.getBoundingClientRect();
  portrait.style.setProperty('--portrait-x', `${((event.clientY - rect.top) / rect.height - .5) * -4}deg`);
  portrait.style.setProperty('--portrait-y', `${((event.clientX - rect.left) / rect.width - .5) * 4}deg`);
});
portraitStage.addEventListener('pointerleave', () => {
  portrait.style.removeProperty('--portrait-x');
  portrait.style.removeProperty('--portrait-y');
});

if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) {
      if (!motionPaused) entry.target.classList.add('reveal-visible');
      revealObserver.unobserve(entry.target);
    }
  }, { threshold: .08 });
  for (const element of document.querySelectorAll('.about-intro,.education-timeline article,.section-heading,.case-summary,.contribution-list article,.decision-card,.research-card,.approach-title,.approach-steps article')) revealObserver.observe(element);
  const navLinks = [...document.querySelectorAll('.site-header nav a')];
  const navObserver = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) {
      for (const link of navLinks) {
        if (link.getAttribute('href') === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      }
    }
  }, { rootMargin: '-10% 0px -55% 0px', threshold: 0 });
  for (const element of document.querySelectorAll('#top,#about,#experience,#demo,#research,#life')) navObserver.observe(element);
}

let scrollScheduled = false;
function updateReadingProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
  document.getElementById('reading-progress').style.transform = `scaleX(${progress})`;
  scrollScheduled = false;
}
window.addEventListener('scroll', () => {
  if (!scrollScheduled) { scrollScheduled = true; window.requestAnimationFrame(updateReadingProgress); }
}, { passive: true });
window.addEventListener('resize', updateReadingProgress);
updateReadingProgress();
