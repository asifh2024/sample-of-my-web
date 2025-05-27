let currentQuestionIndex = 0;
let answers = Array(25).fill(undefined); // 25 for total number of questions
const reviewList = new Set();

// Load the test based on query param
const urlParams = new URLSearchParams(window.location.search);
const testName = urlParams.get("test");

// Timer
let time = 1 * 60 * 60;
const timerDisplay = document.getElementById("timer");

function updateTimer() {
  const hrs = String(Math.floor(time / 3600)).padStart(2, "0");
  const mins = String(Math.floor((time % 3600) / 60)).padStart(2, "0");
  const secs = String(time % 60).padStart(2, "0");
  timerDisplay.textContent = `Time Left: ${hrs}:${mins}:${secs}`;
  time--;

  if (time < 0) {
    submitTest();
  }
}

setInterval(updateTimer, 1000);

// Fetch the test JSON
fetch(`tests/${testName}.json`)
  .then(res => {
    if (!res.ok) throw new Error("Test file not found");
    return res.json();
  })
  .then(data => {
    allQuestions = data;
    loadQuestion();
    updateQuestionList();
  })
  .catch(err => {
    alert("Error loading test data.");
    console.error(err);
  });

// Core Logic
function loadQuestion() {
  const q = allQuestions[currentQuestionIndex];
  const container = document.getElementById("questionContainer");

  // Render the question with MathJax LaTeX support and include the question number
  container.innerHTML = `
    <div class="question">
      <h2>Question ${currentQuestionIndex + 1}</h2> <!-- Display question number here -->
      <p>${q.question}</p>
      ${q.options.map((opt, idx) => `
        <label class="option">
          <input type="radio" name="q${currentQuestionIndex}" value="${idx}" />
          ${opt}
        </label>
      `).join('')}
    </div>
  `;

  // Re-render MathJax after updating HTML content
  MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
}




function nextQuestion() {
  const selectedOption = document.querySelector(`input[name="q${currentQuestionIndex}"]:checked`);
  if (selectedOption) {
    answers[currentQuestionIndex] = parseInt(selectedOption.value);
  }
  updateQuestionList(); // <-- ✅ Add this
  if (currentQuestionIndex < allQuestions.length - 1) {
    currentQuestionIndex++;
    loadQuestion();
  }
}

function clearResponse() {
  answers[currentQuestionIndex] = undefined;
  const selected = document.querySelector(`input[name="q${currentQuestionIndex}"]:checked`);
  if (selected) selected.checked = false;
 
  updateQuestionList();
}

function prevQuestion() {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    loadQuestion();
  }
}



function skipQuestion() {
  updateQuestionList(); // keeps status accurate
  if (currentQuestionIndex < allQuestions.length - 1) {
    currentQuestionIndex++;
    loadQuestion();
  }
}

function getQuestionStatus(index) {
  const isAnswered = answers[index] !== undefined;
 
  if (isAnswered) return "answered"; // Answered
 
  return "not-attempted"; // Not answered and not marked
}

function updateQuestionList() {
  const list = document.getElementById("questionList");
  list.innerHTML = "";

 
  document.getElementById("subjectTitle").textContent = "Navigation";

  const start = 0;
  const end = Math.min(start + 25, allQuestions.length); // Assuming only 25 questions are left

  for (let i = start; i < end; i++) {
    const btn = document.createElement("button");
    btn.classList.add("question-button");
    btn.classList.add(getQuestionStatus(i));
    btn.innerText = i + 1;
    btn.onclick = () => goToQuestion(i);
    list.appendChild(btn);
  }
}

function goToQuestion(index) {
  currentQuestionIndex = index;
  loadQuestion();
}

function submitTest() {
  const resultData = {
    subject: { correct: 0, incorrect: 0, unattempted: 0, wrongQuestions: [] },
    answers: answers
  };

  allQuestions.forEach((q, idx) => {
    const ans = answers[idx];
    const subject = "subject"; 

    if (ans === undefined) {
      resultData[subject].unattempted++;
      resultData[subject].wrongQuestions.push({
        qNo: idx + 1,
        question: q.question,
        yourAnswer: null,
        correctAnswer: q.options[q.correct],
        explanation: q.explanation
      });
    } else if (ans === q.correct) {
      resultData[subject].correct++;
    } else {
      resultData[subject].incorrect++;
      resultData[subject].wrongQuestions.push({
        qNo: idx + 1,
        question: q.question,
        yourAnswer: q.options[ans],
        correctAnswer: q.options[q.correct],
        explanation: q.explanation
      });
    }
  });

  // Store result with a test-specific key
  localStorage.setItem(`testResult_${testName}`, JSON.stringify(resultData));

  // Pass the test name in the URL to result.html
  window.location.href = `result.html?test=${testName}`;
}


let tabSwitchCount = 0;
const maxTabSwitches = 3;

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    tabSwitchCount++;
    console.warn(`You left the page ${tabSwitchCount} time(s).`);

    if (tabSwitchCount >= maxTabSwitches) {
      alert("You have switched tabs too many times. Submitting the test now.");
      submitTest(); // Automatically submit after max tab switches
    }
  }
});
