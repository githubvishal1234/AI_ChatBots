from langchain_community.vectorstores import FAISS
from langchain_huggingface.embeddings import HuggingFaceEmbeddings
from transformers import pipeline

# Load embeddings once
embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

# Load FAISS once
db = FAISS.load_local(
    "vectorstore",
    embeddings,
    allow_dangerous_deserialization=True
)

# Correct model for CPU + accuracy
generator = pipeline(
    "text2text-generation",
    model="google/flan-t5-base",
    max_length=256
)

def chat(query: str) -> str:
    # Retrieve with scores
    docs_with_scores = db.similarity_search_with_score(query, k=5)

    # Lower score = better match
    filtered_docs = [doc for doc, score in docs_with_scores if score < 0.7]

    if not filtered_docs:
        return "Information not available on this website."

    # Deduplicate + limit context size
    unique_docs = []
    for d in filtered_docs:
        if d.page_content not in unique_docs:
            unique_docs.append(d.page_content)

    context = " ".join(unique_docs)[:1500]  # safety cutoff

    prompt = f"""
You are a website support chatbot.

Rules:
- Answer ONLY using the context
- If answer is missing, say:
"Information not available on this website."
- Keep answer short (1–2 sentences)

Context:
{context}

Question:
{query}

Answer:
"""

    result = generator(
        prompt,
        do_sample=False,
        max_new_tokens=120
    )

    return result[0]["generated_text"].strip()
