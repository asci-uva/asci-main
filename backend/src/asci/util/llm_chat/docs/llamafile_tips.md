# Tips on Llamafile Operations and Building new Llamafiles

## Llamafile Operations

- [ChatGPT](https://chat.openai.com/), especially `gpt-4o`, can be very helpful with debugging CUDA-related issues.
- To check the current GPU memory (VRAM) usage, run `nvidia-smi`
- Llamafiles can be run in terminals -- this can be helpful for simple testing. To do so, run commands in the format of `./mistral-7b-instruct-v0.2.Q5_K_M.llamafile  -p '[INST]Explain how does DFS work. Be brief.[/INST]' --gpu NVIDIA -ngl 22`. (You may change each parameter based on the model size/prompt format.)

## Building new Llamafiles

Notes on building/running a Llamafile executable for the first time. (This is a one-time operation.)

- The maximum Llamafile size for `titanx01` is approximately 5 to 7 GB.
  - Llamafiles larger than 7 GB typically do not fit in the Nvidia GPU memory (VRAM).
  - In order to run bigger models, you need to reduce the `-ngl` parameter to decrease VRAM usage. This will increase latency.
- To download a Llamafile, run the bash command `wget <Llamafile URL>`
- [The Llamafile Github page](https://github.com/Mozilla-Ocho/llamafile?tab=readme-ov-file) provides a good selection of available Llamafiles. The maintainer has a more complete list on their [HuggingFace profile](https://huggingface.co/jartine).
- Building Llamafiles for the first time requires (1) CUDA toolkit and (2) a Clang compiler. To load them to your system, run the following commands:

```bash
module load cuda-toolkit-11.7.0
module load clang-llvm
```

- Clang may return warning messages on the Llamafile C++ code styles. As long as they are warnings (rather than errors that terminate the compilation process), you may ignore them. Warnings will not impact the Llamafile compilation.