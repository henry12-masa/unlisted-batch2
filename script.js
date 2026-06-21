const QUESTION_COUNT = 50;
const ANSWER_DELAY_MS = 1200;

let currentQuestions = [];
let currentPool = [];
let current = 0;
let score = 0;
let currentTitle = '全資格ミックス';
let timerId = null;

const $ = (id) => document.getElementById(id);

function getData() {
  return typeof quizData !== 'undefined' ? quizData : window.quizData;
}

function unique(values) {
  return [...new Set(values)];
}

function shuffle(array) {
  const copied = [...array];
  for (let i = copied.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copied[i], copied[j]] = [copied[j], copied[i]];
  }
  return copied;
}

function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function showOnly(sectionId) {
  ['menu', 'quiz', 'finish'].forEach((id) => {
    $(id).classList.toggle('hidden', id !== sectionId);
  });
}

function resetState() {
  clearTimeout(timerId);
  timerId = null;
  currentQuestions = [];
  current = 0;
  score = 0;
  $('result').textContent = '';
  $('choices').innerHTML = '';
  $('progress').textContent = '0/0';
  $('score').textContent = '正解 0';
  $('progressBar').style.width = '0%';
}

function goHome() {
  resetState();
  showOnly('menu');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function init() {
  const data = getData();
  if (!Array.isArray(data)) {
    $('categoryButtons').innerHTML = '<p class="empty">問題データを読み込めませんでした。</p>';
    return;
  }

  const categories = unique(data.map((q) => q.category));

  $('categoryButtons').innerHTML = categories
    .map((category) => `<button type="button" class="category-btn" data-category="${escapeHtml(category)}">${escapeHtml(category)}</button>`)
    .join('');

  document.querySelectorAll('.category-btn').forEach((button) => {
    button.addEventListener('click', () => showExams(button.dataset.category));
  });

  $('mixBtn').addEventListener('click', () => start(data, '全資格ミックス'));
  $('retryBtn').addEventListener('click', retry);
  $('homeBtnTop').addEventListener('click', goHome);
  $('homeBtnQuiz').addEventListener('click', goHome);
  $('homeBtnFinish').addEventListener('click', goHome);
}

function showExams(category) {
  const data = getData();
  const exams = unique(data.filter((q) => q.category === category).map((q) => q.exam));

  $('examButtons').innerHTML = exams
    .map((exam) => {
      const item = data.find((q) => q.exam === exam);
      return `<button type="button" class="exam-btn" data-exam="${escapeHtml(exam)}">${escapeHtml(item.examName)}</button>`;
    })
    .join('');

  document.querySelectorAll('.exam-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const pool = data.filter((q) => q.exam === button.dataset.exam);
      const title = pool[0]?.examName || '資格クイズ';
      start(pool, title);
    });
  });
}

function start(pool, title) {
  clearTimeout(timerId);
  currentPool = [...pool];
  currentQuestions = shuffle(pool).slice(0, Math.min(QUESTION_COUNT, pool.length));
  current = 0;
  score = 0;
  currentTitle = title;

  showOnly('quiz');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  showQuestion();
}

function retry() {
  if (currentPool.length === 0) {
    goHome();
    return;
  }
  start(currentPool, currentTitle);
}

function showQuestion() {
  if (current >= currentQuestions.length) {
    finish();
    return;
  }

  const q = currentQuestions[current];
  const progressPercent = Math.round((current / currentQuestions.length) * 100);

  $('progress').textContent = `${current + 1}/${currentQuestions.length}`;
  $('score').textContent = `正解 ${score}`;
  $('progressBar').style.width = `${progressPercent}%`;
  $('examTitle').textContent = currentTitle;
  $('question').textContent = q.question;
  $('result').textContent = '';

  $('choices').innerHTML = q.choices
    .map((choice, index) => `<button type="button" class="choice" data-index="${index}">${index + 1}. ${escapeHtml(choice)}</button>`)
    .join('');

  document.querySelectorAll('.choice').forEach((button) => {
    button.addEventListener('click', () => answer(Number(button.dataset.index)));
  });
}

function answer(selectedIndex) {
  const q = currentQuestions[current];
  const buttons = [...document.querySelectorAll('.choice')];

  buttons.forEach((button) => {
    button.disabled = true;
  });

  if (selectedIndex === q.answer) {
    score++;
    buttons[selectedIndex].classList.add('correct');
    $('result').textContent = `正解！ ${q.explanation}`;
  } else {
    buttons[selectedIndex]?.classList.add('wrong');
    buttons[q.answer]?.classList.add('correct');
    $('result').textContent = `不正解。${q.explanation}`;
  }

  current++;
  $('score').textContent = `正解 ${score}`;
  $('progressBar').style.width = `${Math.round((current / currentQuestions.length) * 100)}%`;
  timerId = setTimeout(showQuestion, ANSWER_DELAY_MS);
}

function finish() {
  showOnly('finish');
  $('finalScore').textContent = `${currentQuestions.length}問中 ${score}問正解です。`;
  $('progressBar').style.width = '100%';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

init();
