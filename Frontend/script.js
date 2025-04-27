const API_BASE = "http://localhost:8000"; // Change if backend running on another port

// DOM Elements
const generateBtn = document.getElementById("generate-btn");
const uploadBtn = document.getElementById("upload-btn");
const checkAnswersBtn = document.getElementById("check-answers-btn");
const newQuizBtn = document.getElementById("new-quiz-btn");
const downloadQuizBtn = document.getElementById("download-quiz-btn");

const loading = document.getElementById("loading");
const errorMessage = document.getElementById("error-message");
const quizContainer = document.getElementById("quiz-container");
const questionsContainer = document.getElementById("questions-container");
const formContainer = document.querySelector(".form-container");
const container = document.querySelector(".container");

let quizData = [];
let downloadUrl = "";

// Utility Functions
function showLoading(show) {
    loading.style.display = show ? "block" : "none";
}

function showError(msg) {
    errorMessage.innerText = msg;
    errorMessage.style.display = msg ? "block" : "none";
}

function resetQuiz() {
    quizContainer.style.display = "none";
    questionsContainer.innerHTML = "";
    document.getElementById("result").innerText = "";
    document.getElementById("file-upload").value = "";
    downloadQuizBtn.style.display = "none";

    // Slide back to the form
    formContainer.style.display = "block";
    quizContainer.style.display = "none";
}

function displayQuiz(questions) {
    questionsContainer.innerHTML = "";

    questions.forEach((q, index) => {
        const qDiv = document.createElement("div");
        qDiv.className = "question-block";
        qDiv.innerHTML = `
            <p><strong>Q${index + 1}:</strong> ${q.question}</p>
            ${q.options.map(opt => `
                <label>
                    <input type="radio" name="question-${index}" value="${opt.id}"> ${opt.id}. ${opt.text}
                </label>
            `).join("")}
        `;
        questionsContainer.appendChild(qDiv);
    });

    // Slide to the quiz section
    formContainer.style.display = "none";
    quizContainer.style.display = "block";
}

async function fetchQuizData(endpoint, options) {
    try {
        const res = await fetch(endpoint, options);
        if (!res.ok) throw new Error("Failed to fetch quiz data!");
        return await res.json();
    } catch (err) {
        throw new Error(err.message || "An error occurred while fetching quiz data.");
    }
}

// Event Listeners
generateBtn.addEventListener("click", async () => {
    const topic = document.getElementById("topic").value.trim();
    const numQuestions = parseInt(document.getElementById("num-questions").value);
    const difficulty = document.getElementById("difficulty").value;

    if (!topic) {
        showError("Please enter a topic!");
        return;
    }

    showLoading(true);
    showError("");

    try {
        const data = await fetchQuizData(`${API_BASE}/generate_quiz`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ topic, num_questions: numQuestions, difficulty })
        });

        quizData = data.questions;
        displayQuiz(quizData);
        downloadQuizBtn.style.display = "none"; // No file to download here
    } catch (err) {
        showError(err.message);
    } finally {
        showLoading(false);
    }
});

uploadBtn.addEventListener("click", async () => {
    const fileInput = document.getElementById("file-upload");
    if (!fileInput.files.length) {
        showError("Please upload a file first!");
        return;
    }

    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append("file", file);
    formData.append("num_questions", document.getElementById("num-questions").value);
    formData.append("difficulty", document.getElementById("difficulty").value);

    showLoading(true);
    showError("");

    try {
        const data = await fetchQuizData(`${API_BASE}/upload_and_generate_quiz`, {
            method: "POST",
            body: formData
        });

        quizData = data.questions;
        downloadUrl = data.download_url;

        displayQuiz(quizData);
        downloadQuizBtn.style.display = "inline-block";
    } catch (err) {
        showError(err.message);
    } finally {
        showLoading(false);
    }
});

checkAnswersBtn.addEventListener("click", () => {
    const results = quizData.map((q, index) => {
        const selected = document.querySelector(`input[name="question-${index}"]:checked`);
        return selected && selected.value === q.correctAnswer;
    });

    const correct = results.filter(r => r).length;
    document.getElementById("result").innerText = `You got ${correct}/${quizData.length} correct!`;
});

newQuizBtn.addEventListener("click", resetQuiz);

downloadQuizBtn.addEventListener("click", () => {
    if (downloadUrl) {
        window.open(`${API_BASE}${downloadUrl}`, "_blank");
    }
});
