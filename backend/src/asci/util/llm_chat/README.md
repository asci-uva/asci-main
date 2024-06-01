# README: The `llm_chat` module

The `llm_chat` module adds an LLM-based TA chatbot within the `asci` web app to help students through conversations.

## System overview

`llm_chat` has two main components, the `asci`-side component and `titanx01`-side component:

- The former is integrated as part of `asci`, deployed on `kytos02`.
- The latter connects with the `asci` app through HTTP API calls, and is deployed on `titanx01`.

Each of the two has its sub-components.

### `asci`-component

- `LlmChat.php`: A PHP module that interfaces with the main `ASCI` app. (Namely, it is called by the `startLlmChat` function in `ServerExecutor.php`.) It calls `llm_chat.py` to get LLM responses.
- `llm_chat.py` sends API requests to the LLM service deployed on `titanx01` and get responses. It uses helper modules in `llm_chat/utils` to do so.

The component also contains other helpful files to perform its task:

- `llm_chat/data`: Relevant course data for the service's [Retrieval-Augmented Generation (RAG)](https://aws.amazon.com/what-is/retrieval-augmented-generation/) feature. This includes course documents, slides, etc. *This folder does not need to be saved with the project or checked into Git. Only `llm_chat/storage` is needed at deployment to perform RAG.
- `llm_chat/llm_prompts/`: Prompts for different tasks for the LLM
- `llm_chat/storage`: Vector database created using files in `/data`. It enables the chatbot to use course-specific information for its responses.
- `llm_chat/utils`: Helper modules to support `llm_chat.py` to process API calls with the `titanx01` LLM service

### `titanx01` component

- The Llamafile-based LLM service. See the section below on the LLM component information.

## Running/Stopping Llamafiles

See [the guide](docs/run_stop_llamafile.md) on how to access the GPU server and run/stop Llamafiles

## Llamafile Tips

See the [Tips document](docs/llamafile_tips.md).

## Troubleshooting Llamafile/`titanx01` issues

See the [Troubleshoot guide](docs/llamafile_troubleshoot.md).

## To Dos

See the project's [To-Do list](docs/todo.md).
