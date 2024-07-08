import sys
import os
import traceback
from pathlib import Path
from dotenv import load_dotenv
load_dotenv()

from llm_chat.constants import PERSIST_DIR, DATA_DIR 
from llama_index.core import (
    VectorStoreIndex,
    SimpleDirectoryReader,
    StorageContext,
    load_index_from_storage,
)
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.core import Settings
from llama_index.vector_stores.postgres import PGVectorStore
from sqlalchemy import make_url

# Get the directory of the current script
script_directory = os.path.abspath(os.path.dirname(__file__))

# Add the script's directory to the Python path
if script_directory not in sys.path:
    sys.path.append(script_directory)

DEV_MODE = False


Settings.embed_model = HuggingFaceEmbedding(model_name="BAAI/bge-small-en-v1.5", model_kwargs={'device_map':'cuda'}, device="cuda")


def load_rag_index(course):
    realdir = PERSIST_DIR.replace("COURSEID", course)
    realdatadir = DATA_DIR.replace("COURSEID", course)

    dir = Path(realdir)
    dir_exists = os.path.exists(dir)
    doc_file_exists = os.path.exists(dir / "docstore.json")
    
    vector_store = PGVectorStore.from_params(
        database="asci",
        host="db",
        password="asci",
        port="5432",
        user="asci",
        table_name="rag_"+str(course),
        embed_dim=384)

    if not (dir_exists):
        print("Cannot load RAG - Chatbot does not exist")
    else:
        # load the existing index
        try:
            index = VectorStoreIndex.from_vector_store(vector_store=vector_store)
            return index
        except Exception as e:
            print(str(e))
            traceback.print_exc()


if __name__ == "__main__":
    print("start")
    load_rag_index(3)
    print("done")
