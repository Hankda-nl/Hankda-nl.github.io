'use strict';

// All examples are synthetic. These records illustrate UI behavior; no model is called.
const scenarios = {
  complete: {
    segments: ['请为示例账户', ['direction', '买入'], ['product', '示例债券A'], '，金额', ['amount', '人民币100万元'], '，结算日期', ['date', '2026年9月15日'], '。'],
    insight: '信息完整时，提取明确出现的内容，并统一金额和日期格式。',
    instructions: [{ direction: '买入', product: '示例债券A', amount: '1,000,000 元', date: '2026-09-15' }],
    status: '信息完整'
  },
  missing: {
    segments: ['请为示例账户', ['direction', '买入'], ['product', '示例债券A'], '，结算日期', ['date', '2026年9月15日'], '。'],
    insight: '消息没有给出金额。保留已知字段，将缺失项交回确认，避免从其他信息推断。',
    instructions: [{ direction: '买入', product: '示例债券A', amount: null, date: '2026-09-15' }],
    status: '1 项待确认'
  },
  multiple: {
    segments: [['0-direction', '买入'], ['0-product', '示例债券A'], '，金额', ['0-amount', '人民币100万元'], '，', ['0-date', '2026年9月15日'], '结算；另', ['1-direction', '卖出'], ['1-product', '示例债券B'], '，金额', ['1-amount', '人民币50万元'], '，', ['1-date', '2026年9月16日'], '结算。'],
    insight: '先拆分为两条指令，再分别提取字段。每条指令独立保留金额和日期，避免混淆。',
    instructions: [
      { direction: '买入', product: '示例债券A', amount: '1,000,000 元', date: '2026-09-15' },
      { direction: '卖出', product: '示例债券B', amount: '500,000 元', date: '2026-09-16' }
    ],
    status: '已拆分 2 条指令'
  }
};
const labels = { direction: '方向', product: '产品', amount: '金额', date: '结算日期' };
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
  const prefix = scenarioKey === 'multiple' ? `指令 ${instructionIndex + 1} · ` : '';
  if (record[key] === null) explanation.textContent = `${prefix}原文未提供金额：标记为“需确认”，不自动补全。`;
  else if (key === 'amount') explanation.textContent = `${prefix}金额按原文单位换算为人民币元；不改变原始数值含义。`;
  else if (key === 'date') explanation.textContent = `${prefix}年、月、日均来自原文，统一显示为 YYYY-MM-DD。`;
  else explanation.textContent = `${prefix}“${record[key]}”直接来自原文高亮部分。`;
}

function renderFields() {
  fieldResults.replaceChildren();
  const record = scenarios[scenarioKey].instructions[instructionIndex];
  for (const [key, label] of Object.entries(labels)) {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = `field-row${record[key] === null ? ' missing' : ''}`;
    row.dataset.field = key;
    row.setAttribute('aria-label', `${label}：${record[key] ?? '未提供，需确认'}。查看原文依据`);
    const name = document.createElement('span');
    name.className = 'field-name';
    name.textContent = label;
    const value = document.createElement('span');
    value.className = 'field-value';
    value.textContent = record[key] ?? '未提供 / 需确认';
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
    button.textContent = `指令 ${index + 1} · ${record.direction}`;
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
  setPlayLabel(walkthroughStage === 3 ? '重新播放' : walkthroughStage >= 0 ? '继续播放' : '播放处理过程', '▶');
}

function resetWalkthrough() {
  stopWalkthrough();
  walkthroughStage = -1;
  delete workspace.dataset.stage;
  for (const button of document.querySelectorAll('[data-stage]')) {
    button.classList.remove('active', 'completed');
    button.setAttribute('aria-pressed', 'false');
  }
  walkthroughDescription.textContent = '点击播放，分步查看当前虚构样例的处理思路；也可以直接选择步骤。';
  setPlayLabel('播放处理过程', '▶');
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
    '整理输入：从这条虚构消息中识别表达内容，保留原始文本作为后续核对依据。',
    scenarioKey === 'multiple' ? '拆分指令：这条消息包含“买入”和“卖出”两项操作，分别保留各自的对象、金额与日期。' : '拆分指令：当前消息只有一项操作，作为一条独立指令处理。',
    scenarioKey === 'missing' ? '提取字段：方向、产品和结算日期都有明确依据；金额未提供，保持为空并提示确认。' : '提取字段：根据原文确定方向、产品、金额与日期，并对金额单位和日期格式作统一。',
    scenarioKey === 'missing' ? '核对结果：发现缺少金额，因此保留“需确认”状态，不从其他字段猜测金额。' : scenarioKey === 'multiple' ? '核对结果：分别检查两条指令的字段与原文对应关系。点击“指令 1 / 2”查看各自结果。' : '核对结果：检查每个字段的来源、金额换算及日期格式。点击字段，可以再次查看原文依据。'
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
  setPlayLabel('暂停播放', 'Ⅱ');
  advanceWalkthrough();
});
document.getElementById('reset-walkthrough').addEventListener('click', () => { resetWalkthrough(); selectField('amount'); });
for (const button of document.querySelectorAll('[data-stage]')) {
  button.setAttribute('aria-pressed', 'false');
  button.addEventListener('click', () => { stopWalkthrough(); showStage(Number(button.dataset.stage)); setPlayLabel(walkthroughStage === 3 ? '重新播放' : '继续播放', '▶'); });
}
document.addEventListener('visibilitychange', () => { if (document.hidden) stopWalkthrough(); });

// Motion is decorative and can be disabled without changing page content.
const motionToggle = document.getElementById('motion-toggle');
const portrait = document.getElementById('portrait-card');
const portraitStage = document.getElementById('portrait-stage');
function updateMotion() {
  document.body.classList.toggle('motion-paused', motionPaused);
  motionToggle.setAttribute('aria-pressed', String(motionPaused));
  motionToggle.querySelector('.motion-label').textContent = motionPaused ? '启用动效' : '暂停动效';
  motionToggle.querySelector('.motion-icon').textContent = motionPaused ? '▶' : 'Ⅱ';
  motionToggle.setAttribute('aria-label', motionPaused ? '启用页面装饰动效' : '暂停页面装饰动效');
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
