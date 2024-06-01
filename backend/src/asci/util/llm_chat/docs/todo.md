# To Dos

- **Update the Llamafile with better models as new ones get released. (Ideas: Llama-3-7B, Phi-3-mini)**
- **Refactor the Python component of the `llm_chat` -- which currently runs inside `asci` -- into its own RESTful API service, and run it on `titanx01`.**
  - Currently, `asci` runs on the `kytos02` server, and the server has a very outdated GPU. Since the Python component requires GPU to run RAG, the slow GPU performance leads to higher latency in the RAG process.
  - Refactoring this to `titanx01` will enable the component to use the Nvidia GPU for this task and speed up the process.
- **Refactor the `asci`-related components to enable the bot to use different course's documents for concurrent classes.** Currently, the bot only supports conversation about one course at a time. It will be helpful to expand the `llm_chat/storage` to support retriving from multiple courses based on course name/ID in the ASCI requests.
- **Enhance `titanx01` security.** Add firewall rules on `titanx01` to allow only incoming and outbound traffic from the UVA network and `kytos02`. Drop all other traffic.
