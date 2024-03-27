import os.path
from llama_index.core import (
    VectorStoreIndex,
    SimpleDirectoryReader,
    StorageContext,
    load_index_from_storage,
)
import sys
import os
import traceback
from dotenv import load_dotenv

load_dotenv()

openai_api_key = os.getenv("OPENAI_API_KEY")

# Get the directory of the current script
script_directory = os.path.abspath(os.path.dirname(__file__))

# Add the script's directory to the Python path
if script_directory not in sys.path:
    sys.path.append(script_directory)


DEV_MODE = False

# check if storage already exists
PERSIST_DIR = "./storage" if DEV_MODE else "/opt/src/asci/util/llm_chat/storage"
DATA_DIR = "./data" if DEV_MODE else "/opt/src/asci/util/llm_chat/data"


def load_rag_index():
    if not os.path.exists(PERSIST_DIR):

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
