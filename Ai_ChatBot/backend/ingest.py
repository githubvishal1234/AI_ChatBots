from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
import os

# DATA_PATH = "../data/website_content"
DATA_PATH= r"C:\Users\kondaparthy vishal\OneDrive\Desktop\Ai_ChatBot\data\website_content"

docs = []

for file in os.listdir(DATA_PATH):
    if file.endswith(".txt"):
        loader = TextLoader(
            os.path.join(DATA_PATH, file),
            encoding="utf-8"   # IMPORTANT for Windows
        )
        docs.extend(loader.load())

splitter = RecursiveCharacterTextSplitter(
    chunk_size=400,
    chunk_overlap=50
)

# docs = splitter.create_documents(texts)
chunks = splitter.split_documents(docs)

embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

db = FAISS.from_documents(chunks, embeddings)
db.save_local("vectorstore")

print("Website content indexed successfully")
