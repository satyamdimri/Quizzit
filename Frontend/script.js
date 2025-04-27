// --- THREE.JS BACKGROUND START ---
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.154.0/build/three.module.js';

let scene, camera, renderer, stars = [];

function initBackground() {
    scene = new THREE.Scene();
    
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    renderer.domElement.style.position = 'fixed';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.zIndex = '-1';

    addStars();
    animateBackground();
}

function addStars() {
    const geometry = new THREE.SphereGeometry(0.05, 24, 24);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });

    for (let i = 0; i < 500; i++) {
        const star = new THREE.Mesh(geometry, material);
        star.position.x = THREE.MathUtils.randFloatSpread(50);
        star.position.y = THREE.MathUtils.randFloatSpread(50);
        star.position.z = THREE.MathUtils.randFloatSpread(50);
        scene.add(star);
        stars.push(star);
    }
}

function animateBackground() {
    requestAnimationFrame(animateBackground);

    stars.forEach(star => {
        star.rotation.x += 0.001;
        star.rotation.y += 0.001;
    });

    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
});

initBackground();
// --- THREE.JS BACKGROUND END ---

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
