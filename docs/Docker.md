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

### Tips and Troubleshooting

You can get an interactive terminal with `docker-compose exec webpack bash`.

## Commit hook won't run

If you `git commit` inside the container, you may see:

    Can't find Husky, skipping pre-commit hook
    You can reinstall it using 'npm install husky --save-dev' or delete this hook
    Can't find Husky, skipping prepare-commit-msg hook
    You can reinstall it using 'npm install husky --save-dev' or delete this hook

This can be fixed with the suggested commands.

## No editor on system

When using `git commit`, you may encounter:

    error: cannot run editor: No such file or directory
    error: unable to start editor 'editor'

This means that `git` cannot launch a text-editor for you to customize your commit-message with. A quick workaround is to use the `-m` flag, ex:

    git commit -m "This is my commit message"

For an interactive editor, try:

    apt-get update
    apt-get install nano

This will install the `nano` editor. Another option is `vim`.

## Node modules

If you need to install new node dependencies, you should run those commands from inside the container. Once inside, use `yarn install NameOfTheDependency` as normal.

## Container terminates unexpectedly

On Windows, you may see the error:

    dim-webpack | error Command failed with exit code 137.

This may indicate that the Docker VM which hosts containers has run out of memory, and a higher setting is needed.
