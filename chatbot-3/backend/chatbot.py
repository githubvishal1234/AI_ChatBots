from langchain_community.vectorstores import FAISS
from langchain_huggingface.embeddings import HuggingFaceEmbeddings
from transformers import pipeline
from functools import lru_cache
from datetime import datetime, timezone
import os, json, re

# ================= PATHS =================
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VECTORSTORE_PATH = os.path.join(BASE_DIR, "vectorstore")
SESSION_FILE = os.path.join(BASE_DIR, "data", "sessions.json")

# ================= SESSION =================
def load_sessions():
    if os.path.exists(SESSION_FILE):
        with open(SESSION_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

def save_sessions():
    with open(SESSION_FILE, "w", encoding="utf-8") as f:
        json.dump(session_store, f, indent=2)

session_store = load_sessions()

def get_session(session_id):
    if session_id not in session_store:
        session_store[session_id] = {
            "mode": "general",
            "stage": "idle",
            "employee_id": None,
            "last_topic": None
        }
        save_sessions()
    return session_store[session_id]

# ================= MODELS =================
embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

db = FAISS.load_local(
    VECTORSTORE_PATH,
    embeddings,
    allow_dangerous_deserialization=True
)

generator = pipeline(
    "text2text-generation",
    model="google/flan-t5-base",
    device=-1
)

# ================= GENERATION =================
@lru_cache(maxsize=300)
def generate_answer(prompt: str):
    result = generator(
        prompt,
        do_sample=False,
        max_new_tokens=160,
        min_new_tokens=40,
        repetition_penalty=1.35,
        no_repeat_ngram_size=3,
        early_stopping=True
    )
    return result[0]["generated_text"].strip()

# ================= CHAT =================
def chat(query: str, session_id: str):
    session = get_session(session_id)
    user_input = query.strip()
    q = user_input.lower()

    # ---------- POLITE ----------
    if q in ["thank you", "thanks", "ok", "okay", "fine", "cool"]:
        return {"reply": "You’re welcome 🙂 Feel free to ask anything about CORtracker.", "buttons": []}

    # ---------- BOT IDENTITY ----------
    if q in ["who are you", "what is your name"]:
        return {
            "reply": "I’m CORtracker’s virtual assistant, here to help you with information about the company, its services, and employee-related queries.",
            "buttons": []
        }

    # ---------- TIME ----------
    if "time" in q:
        now = datetime.now(timezone.utc)
        return {"reply": f"The current time is {now.strftime('%I:%M %p')} (UTC).", "buttons": []}

    # ---------- OUT OF SCOPE ----------
    if any(x in q for x in ["prime minister", "president", "weather", "news"]):
        return {
            "reply": "I can help with information related to CORtracker and its services. For general knowledge, please use a general AI assistant.",
            "buttons": []
        }

    # ---------- GREETING ----------
    if q in ["hi", "hello", "hey"]:
        return {"reply": "Hi 👋 How can I help you today?", "buttons": []}

    # ---------- EMPLOYEE PROFILE FLOW (STRICT) ----------
    if "employee information" in q or "employee profile" in q:
        session["mode"] = "employee"
        session["stage"] = "awaiting_employee_id"
        save_sessions()
        return {"reply": "Please provide your employee ID.", "buttons": []}

    if session["mode"] == "employee" and session["stage"] == "awaiting_employee_id":
        if not re.search(r"\d+", q):
            return {"reply": "Please enter a valid numeric employee ID.", "buttons": []}

        session["employee_id"] = user_input
        session["stage"] = "menu"
        save_sessions()
        return {
            "reply": f"Employee ID {user_input} noted. What would you like to view?",
            "buttons": ["Employee Dashboard", "Working Days", "Salary", "Position"]
        }

    if session["mode"] == "employee" and session["stage"] == "menu":
        if q in ["employee dashboard", "working days", "salary", "position"]:
            return {
                "reply": f"{q.title()} details for Employee ID {session['employee_id']} will be available soon.",
                "buttons": []
            }
        else:
            session["mode"] = "general"
            session["stage"] = "idle"
            save_sessions()

    # ---------- FOUNDER (CONTROLLED ANSWER) ----------
    if "founder" in q:
        return {
            "reply": "CORtracker’s founders are not explicitly listed on the official website. However, the company leadership includes experienced professionals driving its enterprise software and digital transformation initiatives.",
            "buttons": []
        }

    # ---------- COMPANY-LEVEL EMPLOYEES ----------
    if "employees" in q:
        return {
            "reply": "CORtracker employs over 100 professionals across different regions, supporting clients worldwide with enterprise software and consulting services.",
            "buttons": []
        }

    # ---------- RAG ----------
    docs = db.similarity_search_with_score(user_input, k=4)
    contents = [doc.page_content for doc, score in docs if score > 0.35]

    if not contents:
        return {"reply": "I don’t have that information on this website, but I can help with other CORtracker-related questions.", "buttons": []}

    sentences = []
    for text in contents:
        for s in re.split(r'(?<=[.!?])\s+', text):
            if s not in sentences:
                sentences.append(s)

    context = " ".join(sentences)[:700]

    prompt = f"""
Answer using only the context below.
Do not repeat sentences or guess.

Context:
{context}

Question:
{user_input}

Answer:
"""

    answer = generate_answer(prompt)
    session["last_topic"] = user_input
    save_sessions()

    return {"reply": answer, "buttons": []}



