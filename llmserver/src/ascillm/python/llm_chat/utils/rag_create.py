import sys
sys.path.insert(0,'/usr/lib/python3.10/site-packages')
import os
import traceback
from pathlib import Path
from dotenv import load_dotenv
load_dotenv()

from llama_index.core import VectorStoreIndex
from llama_index.core import SimpleDirectoryReader 
from llama_index.core import StorageContext
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


Settings.embed_model = HuggingFaceEmbedding(model_name="BAAI/bge-small-en-v1.5")

PERSIST_DIR = "/opt/data/COURSEID/storage"
DATA_DIR = "/opt/data/COURSEID/data"

def load_rag_index(course):
    realdir = PERSIST_DIR.replace("COURSEID", str(course))
    realdatadir = DATA_DIR.replace("COURSEID", str(course))

    dir_exists = os.path.exists(realdir)
    doc_file_exists = os.path.exists(realdir + "docstore.json")
    
    vector_store = PGVectorStore.from_params(
        database="asci",
        host="db",
        password="asci",
        port=5432,
        user="asci",
        table_name="rag_"+str(course),
        embed_dim=384) 

    # load the documents and create the index
    documents = SimpleDirectoryReader(realdatadir, recursive=True).load_data()

    # Sanitize for Postgres
    for document in documents:
        document.text = document.text.replace('\x00', '')

    storage_context = StorageContext.from_defaults(vector_store=vector_store)
    index = VectorStoreIndex.from_documents(documents, storage_context=storage_context)


if __name__ == "__main__":
    load_rag_index(sys.argv[1])
