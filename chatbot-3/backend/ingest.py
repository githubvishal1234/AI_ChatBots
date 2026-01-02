import os
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "data", "website_content")
VECTORSTORE_PATH = os.path.join(BASE_DIR, "vectorstore")

docs = []
for file in os.listdir(DATA_PATH):
    if file.endswith(".txt"):
        docs.extend(TextLoader(os.path.join(DATA_PATH, file), encoding="utf-8").load())

splitter = RecursiveCharacterTextSplitter(chunk_size=400, chunk_overlap=50)
chunks = splitter.split_documents(docs)

embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

db = FAISS.from_documents(chunks, embeddings)
os.makedirs(VECTORSTORE_PATH, exist_ok=True)
db.save_local(VECTORSTORE_PATH)

print(" Vectorstore created successfully")
