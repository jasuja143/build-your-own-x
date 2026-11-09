const passages = {
  everyday: {
    beginner: [
      "A good habit grows one careful step at a time. Keep your hands relaxed, find the home row, and let every accurate word build your confidence.",
      "The sun is warm and the sky is blue. I like to take a walk, breathe fresh air, and enjoy the quiet start of a new day.",
      "Mia has a little red kite. She runs across the green field and watches it dance high above the trees."
    ],
    intermediate: [
      "A quiet morning is a good time to practice. Focus on the words ahead, keep a steady rhythm, and let accuracy guide your speed.",
      "Learning a new skill takes patience. Short practice sessions help you stay focused, notice small improvements, and grow your confidence over time.",
      "The old library had tall windows and long wooden tables. Every afternoon, sunlight filled the room while readers explored new ideas."
    ],
    advanced: [
      "Reliable progress comes from deliberate practice: notice each hesitation, correct errors calmly, and build a rhythm that remains comfortable.",
      "When attention is focused on precision rather than speed, consistent practice can transform difficult patterns into effortless movement.",
      "A well-designed routine balances challenge with recovery, giving the mind enough repetition to improve without turning practice into a race."
    ]
  },
  fables: {
    beginner: [
      "A small mouse heard a lion roar. The mouse was not afraid. It helped the lion, and the two became good friends.",
      "A thirsty crow found a jar with little water. It dropped in small stones until the water rose high enough to drink.",
      "A quick hare laughed at a slow tortoise. The tortoise kept moving and reached the finish while the hare took a nap."
    ],
    intermediate: [
      "A fox admired the grapes hanging high above the path. After several leaps, he walked away and said they were probably sour.",
      "A shepherd gave a wolf a warm coat to hide among the sheep. The disguise worked until the shepherd listened for the flock at dusk.",
      "An ant stored food during the sunny days. When winter came, the ant was ready and shared a few grains with a hungry neighbor."
    ],
    advanced: [
      "A traveler offered a cold snake shelter inside his coat. Once warmed, the snake returned to its nature, and the traveler learned to pair kindness with good judgment.",
      "Two friends argued over a small prize while a clever fox offered to divide it fairly. Each bite made one share smaller, until nothing remained.",
      "A proud oak mocked the reeds for bending in the wind. When a storm arrived, the flexible reeds survived while the rigid oak fell."
    ]
  },
  science: {
    beginner: [
      "Plants need light, water, and air to grow. Their roots take in water while green leaves use sunlight to make food.",
      "The moon moves around Earth. We see its bright shape change as sunlight reaches different parts of its surface.",
      "A magnet can pull some metals toward it. Its invisible force works across a small gap without touching the object."
    ],
    intermediate: [
      "Water changes state as its temperature shifts. It can freeze into ice, flow as a liquid, or become vapor in warm air.",
      "Some birds travel thousands of miles each year. They use landmarks, the sun, and Earth's magnetic field to find their way.",
      "A simple circuit needs a power source and a complete path. If the path breaks, electric current can no longer flow."
    ],
    advanced: [
      "Coral reefs support a remarkable range of marine life, yet warming oceans and changing chemistry place these delicate ecosystems under pressure.",
      "The scientific method turns curiosity into testable questions, repeatable observations, and explanations that can be revised as evidence grows.",
      "Light behaves both as a wave and as individual packets of energy; experiments reveal different aspects depending on how it is measured."
    ]
  },
  business: {
    beginner: [
      "A clear plan helps a team do good work. Set one goal, share the next steps, and check progress together.",
      "Good service starts with listening. Ask a simple question, understand the need, and offer a helpful answer.",
      "A small shop tracks each sale and cost. This helps the owner plan what to order and how much to save."
    ],
    intermediate: [
      "A useful meeting has a clear purpose, a short agenda, and enough time for each person to share practical ideas.",
      "Teams make better decisions when they compare the evidence, discuss risks openly, and agree on who will take the next step.",
      "A thoughtful budget balances current needs with future goals, leaving room to respond when plans or priorities change."
    ],
    advanced: [
      "Sustainable growth depends on understanding customer needs, measuring meaningful outcomes, and adapting before small problems become costly.",
      "A resilient organization communicates trade-offs clearly, gives teams room to act, and revisits assumptions when new information appears.",
      "Strong partnerships are built through reliable follow-through, candid conversations, and a shared view of what success should look like."
    ]
  }
};

const elements = {
  accuracy: document.querySelector("#accuracy"),
  bestScore: document.querySelector("#best-score"),
  bestSuffix: document.querySelector("#best-suffix"),
  duration: document.querySelector("#duration-select"),
  input: document.querySelector("#typing-input"),
  level: document.querySelector("#level-select"),
  message: document.querySelector("#session-message"),
  nextPassage: document.querySelector("#next-passage"),
  passage: document.querySelector("#passage"),
  panel: document.querySelector("#typing-panel"),
  topic: document.querySelector("#topic-select"),
  resultFeedback: document.querySelector("#result-feedback"),
  resultPanel: document.querySelector("#result-panel"),
  resultRestart: document.querySelector("#result-restart"),
  resultTitle: document.querySelector("#result-title"),
  restart: document.querySelector("#restart-button"),
  startPrompt: document.querySelector("#start-prompt"),
  styleScore: document.querySelector("#style-score"),
  timeLeft: document.querySelector("#time-left"),
  wpm: document.querySelector("#wpm")
};

let target = "";
let passageIndex = 0;
let duration = Number(elements.duration.value);
let startedAt = null;
let timerId = null;
let finished = false;
let previousKeyAt = null;
let intervals = [];
let completedCharacters = 0;
let completedCorrectCharacters = 0;

function getPassageList() {
  return passages[elements.topic.value][elements.level.value];
}

function getNextPassage() {
  const passageList = getPassageList();
  return passageList[passageIndex % passageList.length];
}

function getBestScore() {
  try {
    const stored = Number(localStorage.getItem("keyflow-best-score"));
    return Number.isFinite(stored) && stored > 0 ? stored : null;
  } catch {
    elements.bestSuffix.textContent = "";
    return null;
  }
}

function updateBestScore(score) {
  const best = getBestScore();
  if (best !== null && best >= score) {
    elements.bestScore.textContent = String(best);
    elements.bestSuffix.textContent = "/100";
    return;
  }

  elements.bestScore.textContent = String(score);
  elements.bestSuffix.textContent = "/100";
  try {
    localStorage.setItem("keyflow-best-score", String(score));
  } catch {
    elements.message.textContent = "Score shown for this session; browser storage is unavailable.";
  }
}

function renderPassage() {
  const typed = elements.input.value;
  elements.passage.replaceChildren();

  for (let index = 0; index < target.length; index += 1) {
    const character = document.createElement("span");
    character.textContent = target[index];
    if (index < typed.length) {
      character.className = typed[index] === target[index] ? "correct" : "incorrect";
    } else if (index === typed.length && !finished) {
      character.className = "current";
    }
    elements.passage.append(character);
  }
}

function getCurrentCorrectCharacters() {
  const typed = elements.input.value;
  let correct = 0;
  for (let index = 0; index < typed.length; index += 1) {
    if (typed[index] === target[index]) correct += 1;
  }
  return correct;
}

function getAccuracy() {
  const totalCharacters = completedCharacters + elements.input.value.length;
  if (totalCharacters === 0) return 100;
  const correctCharacters = completedCorrectCharacters + getCurrentCorrectCharacters();
  return Math.round((correctCharacters / totalCharacters) * 100);
}

function getRhythmScore() {
  if (intervals.length < 2) return 50;
  const average = intervals.reduce((sum, value) => sum + value, 0) / intervals.length;
  const variance = intervals.reduce((sum, value) => sum + ((value - average) ** 2), 0) / intervals.length;
  const coefficientOfVariation = Math.sqrt(variance) / average;
  return Math.max(0, Math.round(100 / (1 + coefficientOfVariation)));
}

function getElapsedSeconds() {
  if (startedAt === null) return 0;
  return Math.max(1, (Date.now() - startedAt) / 1000);
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function updateStats() {
  const elapsedMinutes = getElapsedSeconds() / 60;
  const correctCharacters = completedCorrectCharacters + getCurrentCorrectCharacters();
  const wpm = elapsedMinutes > 0 ? Math.round((correctCharacters / 5) / elapsedMinutes) : 0;

  elements.wpm.textContent = String(wpm);
  elements.accuracy.textContent = String(getAccuracy());
}

function startTimer() {
  if (startedAt !== null || finished) return;
  startedAt = Date.now();
  elements.startPrompt.hidden = true;
  elements.message.textContent = "Keep a comfortable pace and focus on accuracy.";
  timerId = window.setInterval(() => {
    const secondsLeft = Math.max(0, duration - Math.floor((Date.now() - startedAt) / 1000));
    elements.timeLeft.textContent = formatTime(secondsLeft);
    updateStats();
    if (secondsLeft === 0) finishSession();
  }, 200);
}

function getFeedback(accuracy, rhythm, wpm) {
  const suggestions = [];
  if (accuracy < 95) suggestions.push("slow down slightly and prioritize accurate keystrokes");
  else suggestions.push("excellent accuracy; keep that careful technique");
  if (rhythm < 65) suggestions.push("try to make your keystrokes more even");
  else suggestions.push("your keystroke rhythm is steady");
  if (wpm < 25) suggestions.push("repeat short home-row drills to build comfortable speed");
  else if (wpm >= 60) suggestions.push("you are typing at a fast, confident pace");
  else suggestions.push("keep practicing to build speed without losing accuracy");
  return `You typed ${wpm} WPM at ${accuracy}% accuracy. ${suggestions.join("; ")}.`;
}

function finishSession() {
  if (finished) return;
  finished = true;
  window.clearInterval(timerId);
  elements.input.disabled = true;
  elements.startPrompt.hidden = true;

  const accuracy = getAccuracy();
  const rhythm = getRhythmScore();
  const elapsedMinutes = getElapsedSeconds() / 60;
  const typedCount = completedCharacters + elements.input.value.length;
  const correctCount = completedCorrectCharacters + getCurrentCorrectCharacters();
  const wpm = elapsedMinutes > 0 ? Math.round((correctCount / 5) / elapsedMinutes) : 0;
  const pace = Math.min(100, Math.round((wpm / 60) * 100));
  const score = typedCount === 0 ? 0 : Math.round((accuracy * 0.5) + (rhythm * 0.3) + (pace * 0.2));

  elements.wpm.textContent = String(wpm);
  elements.accuracy.textContent = String(accuracy);
  elements.timeLeft.textContent = formatTime(0);
  elements.styleScore.textContent = String(score);
  elements.resultTitle.textContent = score >= 85 ? "Beautiful flow." : score >= 65 ? "Good progress." : "A strong start.";
  elements.resultFeedback.textContent = getFeedback(accuracy, rhythm, wpm);
  elements.resultPanel.hidden = false;
  elements.message.textContent = "Session complete. Your score reflects this practice run.";
  updateBestScore(score);
  renderPassage();
}

function resetSession() {
  window.clearInterval(timerId);
  duration = Number(elements.duration.value);
  passageIndex = 0;
  target = getNextPassage();
  startedAt = null;
  timerId = null;
  finished = false;
  previousKeyAt = null;
  intervals = [];
  completedCharacters = 0;
  completedCorrectCharacters = 0;
  elements.input.disabled = false;
  elements.input.value = "";
  elements.input.maxLength = target.length;
  elements.timeLeft.textContent = formatTime(duration);
  elements.wpm.textContent = "0";
  elements.accuracy.textContent = "100";
  elements.message.textContent = "Start typing to begin your timer.";
  elements.resultPanel.hidden = true;
  elements.startPrompt.hidden = false;
  renderPassage();
}

function advancePassage() {
  if (finished) return;
  const typed = elements.input.value;
  if (typed.length > 0) {
    completedCharacters += typed.length;
    completedCorrectCharacters += getCurrentCorrectCharacters();
  }
  passageIndex += 1;
  target = getNextPassage();
  elements.input.value = "";
  elements.input.maxLength = target.length;
  elements.startPrompt.hidden = startedAt !== null;
  elements.message.textContent = startedAt === null
    ? "New paragraph ready. Start typing when you are ready."
    : "New paragraph. Keep going; your test timer is still running.";
  renderPassage();
  updateStats();
  elements.input.focus();
}

elements.input.addEventListener("keydown", (event) => {
  if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey || finished) return;
  const now = event.timeStamp;
  if (previousKeyAt !== null) {
    const interval = now - previousKeyAt;
    if (interval >= 40 && interval <= 2000) intervals.push(interval);
  }
  previousKeyAt = now;
  startTimer();
});

elements.input.addEventListener("input", () => {
  if (elements.input.value.length > 0) startTimer();
  renderPassage();
  updateStats();
  if (elements.input.value.length >= target.length) advancePassage();
});

elements.panel.addEventListener("click", () => {
  if (!finished) elements.input.focus();
});

elements.startPrompt.addEventListener("click", () => elements.input.focus());
elements.restart.addEventListener("click", resetSession);
elements.nextPassage.addEventListener("click", advancePassage);
elements.resultRestart.addEventListener("click", () => {
  resetSession();
  elements.input.focus();
});
elements.level.addEventListener("change", () => {
  resetSession();
});
elements.duration.addEventListener("change", resetSession);
elements.topic.addEventListener("change", resetSession);

const initialBest = getBestScore();
if (initialBest !== null) {
  elements.bestScore.textContent = String(initialBest);
  elements.bestSuffix.textContent = "/100";
}
resetSession();
