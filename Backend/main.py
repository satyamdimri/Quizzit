from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
import os
from dotenv import load_dotenv
import json
import re

# Load environment variables from .env file
load_dotenv()

# Initialize the Gemini client
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise Exception("GEMINI_API_KEY not found in environment variables!")

genai.configure(api_key=api_key)

# Create FastAPI app
app = FastAPI()

# Allow frontend (React) to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Gemini model
model = genai.GenerativeModel(model_name="gemini-1.5-flash")

class QuizRequest(BaseModel):
    topic: str
    num_questions: int
    difficulty: str
    
@app.post("/generate_quiz")
async def generate_quiz(req: QuizRequest):
    prompt = (
        f"Generate {req.num_questions} {req.difficulty} level multiple-choice quiz questions about {req.topic}.\n"
        "Each question should have 4 options (A, B, C, D) with exactly one correct answer.\n"
        "Use the following format for each question:\n\n"
        "Question: <your question>\n"
        "A. <option A>\n"
        "B. <option B>\n"
        "C. <option C>\n"
        "D. <option D>\n"
        "Correct Answer: <letter of correct answer>\n\n"
        "Respond only with the questions, options, and correct answers in the specified format, no extra text."
    )
    
    try:
        response = model.generate_content(
            contents=[{"role": "user", "parts": [{"text": prompt}]}]
        )
        
        content = response.text
        
        # Clean up
        content = re.sub(r"```.*?```", "", content, flags=re.DOTALL).strip()
        content = content.replace("```json", "").replace("```", "").strip()
        
        # Parse MCQ questions
        questions = []
        blocks = re.split(r"\n\s*\n", content)  # Split by double newlines
        
        for block in blocks:
            if not block.strip():
                continue
                
            q_match = re.search(r"Question:\s*(.*)", block, re.IGNORECASE)
            
            # Match options A through D
            options = {
                'A': None, 'B': None, 'C': None, 'D': None
            }
            
            for opt in options.keys():
                opt_match = re.search(rf"{opt}\.\s*(.*)", block, re.IGNORECASE)
                if opt_match:
                    options[opt] = opt_match.group(1).strip()
            
            # Match correct answer
            correct_match = re.search(r"Correct Answer:\s*([A-D])", block, re.IGNORECASE)
            
            if q_match and all(options.values()) and correct_match:
                question = q_match.group(1).strip()
                correct_answer = correct_match.group(1).upper()
                
                questions.append({
                    "question": question,
                    "options": [
                        {"text": options['A'], "id": "A"},
                        {"text": options['B'], "id": "B"},
                        {"text": options['C'], "id": "C"},
                        {"text": options['D'], "id": "D"}
                    ],
                    "correctAnswer": correct_answer
                })
        
        return {"questions": questions}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate quiz: {str(e)}")