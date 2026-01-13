# 🤖 AI Website Chatbot (RAG-Based)

An intelligent **website chatbot** built using **FastAPI, LangChain, FAISS, and HuggingFace flan-t5-base**.  
The chatbot provides **accurate answers strictly based on website data**, supports **employee-related workflows**, and avoids hallucinations.

---

## 📌 Features

- ✅ Retrieval-Augmented Generation (RAG)
- ✅ Answers limited to website content (no hallucinations)
- ✅ Employee profile workflow (ID → dashboard, salary, etc.)
- ✅ Polite, human-like responses
- ✅ Out-of-scope question blocking
- ✅ Session-based conversation handling
- ✅ Fast and stable on CPU
- ✅ Production-ready architecture

---

## 🛠️ Tech Stack

- **Backend:** FastAPI
- **LLM:** HuggingFace `google/flan-t5-base`
- **Vector Store:** FAISS
- **Embeddings:** `sentence-transformers/all-MiniLM-L6-v2`
- **Framework:** LangChain
- **Frontend:** HTML, CSS, JavaScript
- **Language:** Python 3.10+

---

## 📂 Project Structure

chatbot-project/
│
├── backend/
│ ├── app.py
│ ├── chatbot.py
│ ├── ingest.py
│ └── init.py
│
├── data/
│ ├── website_content/
│ │ └── info.txt
│ └── sessions.json
│
├── vectorstore/
│ ├── index.faiss
│ └── index.pkl
│
├── frontend/
│ └── index.html
│
├── requirements.txt
├── README.md
└── venv/

yaml file
---

## ⚙️ Prerequisites

- Python **3.10 or above**
- pip
- Internet connection (for first-time model download)

---

## 🚀 Setup & Execution Steps

step-1 (create virtual environment)
python -m venv venv
step-2   (activate virtual environment)
venv\Scripts\activate
step-3  (upgrade your pip)
python -m pip install --upgrade pip
step-4 (install all required packages or libraries)
pip install -r requirements.txt 
step-5   (run ingest.py file )
python backend/ingest.py
step-6 (run backend file)
uvicorn backend.app:app --reload
step-7  (open frontend code)
