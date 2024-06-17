import sys
import os
import traceback
from pathlib import Path
from dotenv import load_dotenv
load_dotenv()

from llama_index.core import (
    VectorStoreIndex,
    SimpleDirectoryReader,
    StorageContext,
    load_index_from_storage,
)
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.core import Settings


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

    if not (dir_exists and doc_file_exists):
        # load the documents and create the index
        documents = SimpleDirectoryReader(realdatadir, recursive=True).load_data()

        index = VectorStoreIndex.from_documents(documents)

        # store it for later
        index.storage_context.persist(persist_dir=realdir)
    else:
        # load the existing index

        storage_context = StorageContext.from_defaults(persist_dir=realdir)
        try:

            index = load_index_from_storage(storage_context)
            return index
        except Exception as e:
            print(str(e))
            traceback.print_exc()


if __name__ == "__main__":
    load_rag_index(sys.argv[1])
