from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.chatbot import chat
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    query: str

@app.post("/chatbot")
def chatbot_api(request: ChatRequest):
    response = chat(request.query)
    return {"reply": response}
