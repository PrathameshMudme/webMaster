from flask import Flask, request, jsonify
from flask_cors import CORS
from bs4 import BeautifulSoup
import google.generativeai as genai
from sentence_transformers import SentenceTransformer
from pinecone import Pinecone, ServerlessSpec
import os
from colorama import Fore
import requests
from dotenv import load_dotenv
import logging
from waitress import serve

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)

app = Flask(__name__)
CORS(
    app,
    resources={r"/*": {"origins": "http://localhost:3000"}},
    supports_credentials=True,
)


# Initialize Gemini API
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-pro")

# Initialize Sentence Transformer
sentence_model = SentenceTransformer("all-MiniLM-L6-v2")

# Initialize Pinecone
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index_name = os.getenv("PINECONE_INDEX_NAME", "quickstart")

# Check if index exists, if not create it
if index_name not in pc.list_indexes().names():
    pc.create_index(
        name=index_name,
        dimension=sentence_model.get_sentence_embedding_dimension(),
        metric="cosine",
        spec=ServerlessSpec(cloud="aws", region="us-east-1"),
    )
    logging.info(f"Created new Pinecone index: {index_name}")

index = pc.Index(index_name)


@app.route("/scrape", methods=["POST"])
def scrape_website():
    url = request.json.get("url")
    if not url:
        return jsonify({"error": "URL is required"}), 400

    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")
        text = soup.get_text()

        chunks = [text[i : i + 1000] for i in range(0, len(text), 1000)]

        vectors = []
        for i, chunk in enumerate(chunks):
            embedding = sentence_model.encode(chunk).tolist()
            vectors.append((f"{url}_{i}", embedding, {"text": chunk}))

        index.upsert(vectors=vectors)

        logging.info(f"Website scraped and indexed successfully: {url}")
        return jsonify({"message": "Website scraped and indexed successfully"}), 200
    except requests.RequestException as e:
        print(Fore.RED + f"Error scraping website {url}: {str(e)}")
        logging.error(f"Error scraping website {url}: {str(e)}")
        return jsonify({"error": f"Error scraping website: {str(e)}"}), 500
    except Exception as e:
        logging.error(f"Unexpected error: {str(e)}")
        return jsonify({"error": "An unexpected error occurred"}), 500


@app.route("/ask", methods=["POST"])
def ask_question():
    question = request.json.get("question")
    if not question:
        return jsonify({"error": "Question is required"}), 400

    try:
        question_embedding = sentence_model.encode(question).tolist()
        results = index.query(vector=question_embedding, top_k=3, include_metadata=True)

        context = " ".join([result.metadata["text"] for result in results.matches])

        response = model.generate_content(
            f"Context: {context}\n\nQuestion: {question}\n\nAnswer:"
        )
        print(Fore.GREEN + response.text)

        logging.info(f"Question answered successfully: {question[:50]}...")
        return jsonify({"answer": response.text}), 200
    except Exception as e:
        logging.error(f"Error answering question: {str(e)}")
        return jsonify({"error": "Error processing your question"}), 500


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    if os.getenv("ENVIRONMENT") == "production":
        serve(app, host="0.0.0.0", port=port)
    else:
        app.run(host="0.0.0.0", port=port, debug=True)
