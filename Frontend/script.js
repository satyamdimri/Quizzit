// Configuration
const API_URL = 'http://localhost:8000';

// DOM elements
const generateBtn = document.getElementById('generate-btn');
const loading = document.getElementById('loading');
const quizContainer = document.getElementById('quiz-container');
const questionsContainer = document.getElementById('questions-container');
const checkAnswersBtn = document.getElementById('check-answers-btn');
const newQuizBtn = document.getElementById('new-quiz-btn');
const resultDisplay = document.getElementById('result');
const errorMessage = document.getElementById('error-message');

// Current quiz data
let currentQuiz = [];

// Event listeners
generateBtn.addEventListener('click', generateQuiz);
checkAnswersBtn.addEventListener('click', checkAnswers);
newQuizBtn.addEventListener('click', resetQuiz);

/**
 * Generates a quiz by fetching questions from the API
 */
async function generateQuiz() {
    const topic = document.getElementById('topic').value.trim();
    const numQuestions = document.getElementById('num-questions').value;
    const difficulty = document.getElementById('difficulty').value;
    
    if (!topic) {
        showError('Please enter a topic');
        return;
    }
    
    // Show loading, hide other sections
    loading.style.display = 'block';
    quizContainer.style.display = 'none';
    errorMessage.style.display = 'none';
    
    try {
        const response = await fetch(`${API_URL}/generate_quiz`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                topic: topic,
                num_questions: parseInt(numQuestions),
                difficulty: difficulty
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to generate quiz');
        }
        
        const data = await response.json();
        currentQuiz = data.questions;
        
        if (currentQuiz.length === 0) {
            showError('No questions were generated. Please try a different topic.');
            loading.style.display = 'none';
            return;
        }
        
        renderQuiz(currentQuiz);
        
        // Hide loading, show quiz
        loading.style.display = 'none';
        quizContainer.style.display = 'block';
        
    } catch (error) {
        console.error('Error:', error);
        showError('Error generating quiz. Please try again.');
        loading.style.display = 'none';
    }
}

/**
 * Renders the quiz questions in the DOM
 * @param {Array} questions - Array of question objects
 */
function renderQuiz(questions) {
    questionsContainer.innerHTML = '';
    resultDisplay.style.display = 'none';
    
    questions.forEach((q, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question';
        questionDiv.innerHTML = `
            <h3>Question ${index + 1}: ${q.question}</h3>
            <ul class="options" data-question="${index}">
                ${q.options.map(option => `
                    <li class="option" data-option="${option.id}">
                        ${option.id}. ${option.text}
                    </li>
                `).join('')}
            </ul>
        `;
        
        questionsContainer.appendChild(questionDiv);
    });
    
    // Add click handlers for options
    document.querySelectorAll('.option').forEach(option => {
        option.addEventListener('click', function() {
            const questionIndex = this.parentElement.dataset.question;
            
            // Deselect all options in this question
            document.querySelectorAll(`.options[data-question="${questionIndex}"] .option`).forEach(opt => {
                opt.classList.remove('selected');
            });
            
            // Select this option
            this.classList.add('selected');
        });
    });
}

/**
 * Checks the user's answers and displays the score
 */
function checkAnswers() {
    let correct = 0;
    let unanswered = 0;
    
    currentQuiz.forEach((q, index) => {
        const selectedOption = document.querySelector(`.options[data-question="${index}"] .option.selected`);
        
        if (!selectedOption) {
            unanswered++;
            return;
        }
        
        const userAnswer = selectedOption.dataset.option;
        
        // Mark correct and incorrect answers
        document.querySelectorAll(`.options[data-question="${index}"] .option`).forEach(option => {
            const optionId = option.dataset.option;
            
            if (optionId === q.correctAnswer) {
                option.classList.add('correct');
            } else if (option.classList.contains('selected')) {
                option.classList.add('incorrect');
            }
        });
        
        if (userAnswer === q.correctAnswer) {
            correct++;
        }
    });
    
    // Show result
    const score = correct;
    const total = currentQuiz.length;
    const percentage = Math.round((score / total) * 100);
    
    resultDisplay.innerHTML = unanswered > 0 ? 
        `You have ${unanswered} unanswered question${unanswered > 1 ? 's' : ''}!` :
        `Your score: ${score}/${total} (${percentage}%)`;
        
    resultDisplay.style.backgroundColor = percentage >= 70 ? '#d4edda' : percentage >= 40 ? '#fff3cd' : '#f8d7da';
    resultDisplay.style.display = 'block';
    
    // Disable checking again
    checkAnswersBtn.disabled = true;
}

/**
 * Resets the quiz form and UI
 */
function resetQuiz() {
    quizContainer.style.display = 'none';
    document.getElementById('topic').value = '';
    checkAnswersBtn.disabled = false;
}

/**
 * Shows an error message
 * @param {string} message - Error message to display
 */
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}