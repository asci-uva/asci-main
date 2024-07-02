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

## LLM component information

### Access the LLM host server

The LLM backend is hosted as a [Llamafile](https://github.com/Mozilla-Ocho/llamafile?tab=readme-ov-file) programm running on the UVA CS department's `titanx01.cs.virginia.edu` server.

To access the server, you can SSH into it:

```bash
ssh -Y cb5th@titanx01.cs.virginia.edu
```

> *Note: You may need to get access to the titanx01 server to be able to access it. To do so, reach out to [CS Computing Support Help Desk](cshelpdesk@virginia.edu).*

### Start/stop the LLM instance on `titanx01`

The Llamafiles are stored in `/localtmp/llm-server/models/` on `titanx01`. As of April 2024, there are two such files in the directory: `llava-v1.5-7b-q4.llamafile` and `mistral-7b-instruct-v0.2.Q5_K_M.llamafile`. The latter has performed better in testings and is used in production.

To easily start the LLM instance on the background as a HTTP web server, run the following Linux shell command:

```bash
current_dir=$(pwd) && cd /localtmp/llm-server/models/ && nohup ./mistral-7b-instruct-v0.2.Q5_K_M.llamafile -ngl 9999 --server --nobrowser --port 8080 --host 0.0.0.0 > /localtmp/llm-server/logs/llamafile.log 2>&1 & cd "$current_dir"
```

To stop the LLM instance, run the following Linux shell command:

```bash
pkill -f mistral-7b-instruct
```

### Note: simplify starting/stopping the LLM instance

To make the process simpler, it is recommended to add the following lines to your `~/.bashrc` file to create alias for the start/stop commands:

```bash
alias runllama='current_dir=$(pwd) && cd /localtmp/llm-server/models/ && nohup ./mistral-7b-instruct-v0.2.Q5_K_M.llamafile -ngl 9999 --server --nobrowser --port 8080 --host 0.0.0.0 --gpu NVIDIA > /localtmp/llm-server/logs/llamafile.log 2>&1 & cd "$current_dir"'
alias stopllama='pkill -f mistral-7b-instruct'
```

Then, run `source ~/.bashrc`, and you will be able to run `runllama` and `stopllama` instead of the more complex counterparts.

### Notes: how do the `runllama` and `stopllama` commands work?

The `runllama` command has a few key components. Below is an overview:

- First, the script moves to the Llamafile directory
- `nohup`: Run the command on the background, even after the user (you) log out of the SSH session
- The `-ngl 9999` flag forces Llamafile to use Nvidia GPU acceleration, provided by the Titan X GPU on the server. Literally, the command loads 999 model layers to the GPU. Since nearly all models have fewer than 999 layers, this essentially loads the entire model into the GPU memory, thus speeding up the inference.
- `--server --nobrowser` runs the Llamafile as a web server, without automatically opening the instance in a browser window. This is important as there is no GUI/browser on the `titanx01` server.
- `--port 8080` specifies the Llamafile web server to run on port 8080.
- `--host 0.0.0.0` specifies the Llamafile web server to run on the public URL. Together with the `--port 8080` flag, it enables the server to be accessible from `http://titanx01.cs.virginia.edu:8080/`.
- `--gpu NVIDIA` forces Llamafile to use the Nvidia GPU on the server.
- `> /localtmp/llm-server/logs/llamafile.log` saves Llamafile output into a log file

The `stopllama` is more straight-forward. It simply terminates the process with name containing `mistral-7b-instruct`, which in our case corresponds to the Llamafile process.

More information on Llamafile can be found by downloading an llamafile executable from [GitHub](https://github.com/Mozilla-Ocho/llamafile/releases) and run `llamafile --help`.

### Misc. Notes on LLM Operations

- A good selection of available Llamafiles are listed on its [Github page](https://github.com/Mozilla-Ocho/llamafile?tab=readme-ov-file). The maintainer has a more complete list on their [HuggingFace profile](https://huggingface.co/jartine).
- To download a Llamafile, run the bash command `wget <Llamafile URL>`
- The maximum Llamafile size for `titanx01` is approximately 5 to 7 GB.
  - Llamafiles larger than 7 GB typically do not fit in the Nvidia GPU memory (VRAM).
  - In order to run bigger models, you need to reduce the `-ngl` parameter to decrease VRAM usage. This will increase latency.
- To check the current GPU memory (VRAM) usage, run `nvidia-smi`
- Llamafiles can be run in terminals -- this can be helpful for simple testing. To do so, run commands in the format of `./mistral-7b-instruct-v0.2.Q5_K_M.llamafile  -p '[INST]Explain how does DFS work. Be brief.[/INST]' --gpu NVIDIA -ngl 22`. (You may change each parameter based on the model size/prompt format.)
- Building Llamafiles for the first time requires (1) CUDA toolkit and (2) a Clang compiler. To load them to your system, run the following commands:

```bash
module load cuda-toolkit-11.7.0
module load clang-llvm
```

- Clang may return warning messages on the Llamafile C++ code styles. As long as they are warnings (rather than errors that terminate the compilation process), you may ignore them. Warnings will not impact the Llamafile compilation.
- `llamafile --help` is a helpful resource, as mentioned above.

### Troubleshoot

> My `runllama` command failed to start the Llamafile instance! It returned an out-of-memory error message.

The cause of the issue is likely that the OS failed to clears the GPU memory after the Llamafile process terminates.

To check if it is the case, run `nvidia-smi` and check if the `Processes` list is empty. If it is not, run `kill <PID of the process listed>`, and try re-running `runllama`.

## To Dos

- **Update the Llamafile with better models as new ones get released. (Ideas: Llama-3-7B, Phi-3-mini)**
- **Refactor the Python component of the `llm_chat` -- which currently runs inside `asci` -- into its own RESTful API service, and run it on `titanx01`.**
  - Currently, `asci` runs on the `kytos02` server, and the server has a very outdated GPU. Since the Python component requires GPU to run RAG, the slow GPU performance leads to higher latency in the RAG process.
  - Refactoring this to `titanx01` will enable the component to use the Nvidia GPU for this task and speed up the process.
- **Refactor the `asci`-related components to enable the bot to use different course's documents for concurrent classes.** Currently, the bot only supports conversation about one course at a time. It will be helpful to expand the `llm_chat/storage` to support retriving from multiple courses based on course name/ID in the ASCI requests.
- **Enhance `titanx01` security.** Add firewall rules on `titanx01` to allow only incoming and outbound traffic from the UVA network and `kytos02`. Drop all other traffic.
