# Troubleshooting issues from running Llamafile on the `titanx01` GPU server

> My `runllama` command failed to start the Llamafile instance! It returned an out-of-memory error message.

The cause of the issue is likely that the OS failed to clear the GPU memory after the Llamafile process terminated.

To check if this is the case, run `nvidia-smi` and check if the `Processes` list is empty. If it is not, run `kill <PID of the process listed>`, and try re-running `runllama`.

> I got "NVIDIA-SMI has failed because it couldn't communicate with the NVIDIA driver. Make sure that the latest NVIDIA driver is installed and running." when running `nvidia-smi`.

This error is usually caused by an incompatible Nvidia driver. To fix it, follow the steps below:

1. Remove existing NVIDIA drivers:

    ```bash
    sudo apt-get purge nvidia*
    sudo apt autoremove
    ```

2. Make sure your system's package list and installed packages are updated:

    ```bash
    sudo apt update
    sudo apt upgrade
    ```

3. Install the recommended driver:
    * Important: You need two Nvidia driver packages to run Llamafile: `nvidia-driver-<version #>` and `nvidia-utils-<version #>` from the Ubuntu package manager `apt`.
    * `nvidia-driver-<version #>` is the driver itself. You can find the driver versions compatible with the server using the command `ubuntu-drivers devices`.
    * `nvidia-utils-<version #>` provides various tools to manage Nvidia-related programs. Notably, it includes the `nvidia-smi` tool used to manage/monitor running CUDA programs. You can find its compatible version by simply running `nvidia-smi`; the system will suggest a list of versions to install.

    **The two packages must have the same version number.** This means you must find a version number that appears in outputs from both `ubuntu-drivers devices` and `nvidia-smi`. The number is a three-digit number starting with 5. You can install the two packages by running the following commands:

    ```bash
    sudo apt install nvidia-driver-535
    sudo apt install nvidia-utils-535
    ```

4. After the installation is complete, reboot your system to ensure the new driver is loaded correctly:

    ```bash
    sudo reboot
    ```

    *Note: When the server is rebooting, it is normal for it to be unavailable through SSH. Simply wait 3-5 minutes and the access will be automatically re-activated once the reboot completes.*

5. Load `nvcc`:

    ```bash
    module load cuda-toolkit-11.7.0
    ```

Finally, run `nvidia-smi` to verify if the driver is working properly.

> I got "`nvcc` is not found" when running the `runllama` command.

**IMPORTANT: Do not download NVCC directly from Nvidia and install it on `titanx01`; this will cause hard-to-debug problems caused by conflicting versions of `nvcc`.**

Llamafile needs `nvcc` (CUDA compiler driver) to build its dependencies. To load `nvcc`, load the parent module by running the following command:

```bash
module load cuda-toolkit-11.7.0
```

Re-run `runllama`; you should be able to execute it with no problem.