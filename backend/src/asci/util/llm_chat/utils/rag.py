import os.path
from llama_index.core import (
    VectorStoreIndex,
    SimpleDirectoryReader,
    StorageContext,
    load_index_from_storage,
)
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.core import Settings
import sys
import os
import traceback
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()


# Get the directory of the current script
script_directory = os.path.abspath(os.path.dirname(__file__))

# Add the script's directory to the Python path
if script_directory not in sys.path:
    sys.path.append(script_directory)


DEV_MODE = False

# check if storage already exists
PERSIST_DIR = "./storage" if DEV_MODE else "/opt/src/asci/util/llm_chat/storage"
DATA_DIR = "./data" if DEV_MODE else "/opt/src/asci/util/llm_chat/data"

Settings.embed_model = HuggingFaceEmbedding(model_name="BAAI/bge-small-en-v1.5")


def load_rag_index():
    dir = Path(PERSIST_DIR)
    dir_exists = os.path.exists(dir)
    doc_file_exists = os.path.exists(dir / "docstore.json")

    if not (dir_exists and doc_file_exists):
        # load the documents and create the index
        documents = SimpleDirectoryReader(DATA_DIR, recursive=True).load_data()

        index = VectorStoreIndex.from_documents(documents)

        # store it for later
        index.storage_context.persist(persist_dir=PERSIST_DIR)
    else:
        # load the existing index

        storage_context = StorageContext.from_defaults(persist_dir=PERSIST_DIR)
        try:

            index = load_index_from_storage(storage_context)
            return index
        except Exception as e:
            print(str(e))
            traceback.print_exc()


if __name__ == "__main__":
    print("start")
    load_rag_index()
    print("done")
