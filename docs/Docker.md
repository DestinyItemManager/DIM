# Docker Compose Quick Start

Install Dependencies, and start webpack, with Docker

1. [Pre-requisites](#pre-requisites)
1. [Docker-compose up](#docker-compose-up)
1. Refer to [Entering your API credentials in CONTRIBUTING.md](CONTRIBUTING.md#enter-api-credentials)

### Pre-Requisites

* Install Docker https://www.docker.com/get-started
* Install docker-compose https://docs.docker.com/compose/install/
* Follow the steps for getting an API key in [CONTRIBUTING.md](CONTRIBUTING.md#get-your-own-api-key)

### Docker Compose Up

Run the following commands from the DIM cloned directory on your machine:

* `docker-compose up` to build the dist and start yarn watcher
* It will take a while for the dist files to build on the first startup while yarn installs dependencies
* `ctrl+c` to stop
* `docker-compose up -d` to start in detached mode
* `docker-compose stop` to stop detached mode
* `docker-compose build` to re-build if the compose files change

### Tips and How-To's

- when using docker for your development platform, you will need to install new node dependencies from within a running container. This can be done by
running `docker-compose exec yarn install nameofdependency webpack`
