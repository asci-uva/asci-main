# ASCI-Main
The main repository for the ASCI application. Contains the primary tools, database, and backend.


# Installation Steps (One time steps)

These installation steps are **one time** steps that must be taken to run the project:

### Install Docker and Docker compose

- Install Docker (Docker Desktop) from the [Docker website](https://docker.com)
- Install [Docker Compose](https://docs.docker.com/compose/install/)

### Pull Docker Images

Open up a terminal and run the following commands to pull the proper Docker base images (some of these might be extraneous)

```
docker pull postgres
docker pull php
docker pull httpd
```

### Clone this github repository

Navigate to your desired folder on your machine and clone this repository:

```
git clone http://github.com/asci-uva/asci-main
```

### Initialize the submodules

The Gradescope service lives in a git submodule, which a plain clone leaves empty. Navigate into the
root directory of this repository and fetch it (if you cloned with `--recurse-submodules`, this is
already done):

```
git submodule update --init --recursive
```

### Build the images

Navigate intot the root directory of this repository and use docker-compose to build the images (you only have to do this once, and again if you change any of the custom Dockerfiles)

```
docker compose build
```

# Running the Project

Once installed, running the project is quite simple. Navigate to the root directory of this repository and execute the following command:

```
docker compose up
```

You can also add the option *-d* flag if you want to continue using your terminal window for other tasks. Navigate to *localhost* in your browser to see the project.


## Update composer

Before you access the project, you should install composer dependencies.  This can be done by:

```
docker exec -it <CONTAINER_ID> bash
cd /opt/src
composer install
```
