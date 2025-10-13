from collections import namedtuple

PromptPath = namedtuple("PromptPath", ["system", "user"])

prompt_paths = {
    "code_removal": PromptPath(
        system="../llm_prompts/openai_code_remover_sys.txt",
        user="../llm_prompts/openai_code_remover_user.txt",
    ),
    "new_chat": PromptPath(
        system="../llm_prompts/openai_chatcompletions_sys.txt",
        user="../llm_prompts/openai_chatcompletions_user.txt",
    ),
    "question_starter": PromptPath(
        system="../llm_prompts/openai_question_starter_sys.txt",
        user="../llm_prompts/openai_question_starter_user.txt",
    ),
    "condense_chat_history": PromptPath(
        system=None,
        user="../llm_prompts/openai_condense_chat_history.txt",
    ),
    "summary": PromptPath(
        system="../llm_prompts/openai_summary_sys.txt",
        user="../llm_prompts/openai_summary_user.txt",
    ),
}

OPENAI_MODEL = "gpt-3.5-turbo"
OPENAI_MAX_TOKENS = 300

SHOWING_ONLY_ONE_CONTEXT = False
RAG_DISABLED = True

LLAMAFILE_KEY_PLACEHOLDER = "sk-no-key-required"
LLAMAFILE_BASE_URL = "http://titanx01.cs.virginia.edu:8080/v1"
LLAMAFILE_BASE_URL_HOME = "http://titanx01.cs.virginia.edu:8080"

PERSIST_DIR = "/opt/data/COURSEID/storage"
DATA_DIR = "/opt/data/COURSEID/data"
