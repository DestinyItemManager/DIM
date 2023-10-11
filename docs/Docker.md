# Docker Development Quick Start

### Pre-Requisites
To get started with Docker, follow the steps below.

If you already have Docker installed on your machine, you may skip to step 2.

If you already have docker-compose installed on your machine, you may skip to step 3.

1. Install Docker ([https://www.docker.com/get-started](https://www.docker.com/get-started))
2. Install docker-compose ([https://docs.docker.com/compose/install/](https://docs.docker.com/compose/install/))
3. Getting an API key in [CONTRIBUTING.md](CONTRIBUTING.md#get-your-own-api-key)

### Managing DIM Docker Containers
Run the following commands from the DIM cloned directory on your machine:

* `docker-compose up` to start the docker containers and build the dist files
* `docker-compose up -d` to start the containers and build the dist files in detached mode
* `docker-compose stop` to stop detached mode
* `docker-compose down` to stop the container and purge its containers and networks
* `ctrl+c` to stop

> Building dist files will take a while on the first startup while yarn installs dependencies and webpack builds DIM.

### Tips and Troubleshooting
You can get an interactive terminal with `docker-compose exec webpack bash`.

This is very useful for troubleshooting issues that arise inside of the container when it's spun up.



## Commit hook won't run
If you `git commit` inside the container, you may see one of the following warnings:

```txt
Can't find Husky, skipping pre-commit hook
You can reinstall it using `npm install husky --save-dev` or delete this hook
```
```txt
Can't find Husky, skipping prepare-commit-msg hook
You can reinstall it using `npm install husky --save-dev` or delete this hook
```

These can be fixed with the suggested commands.



## No editor on system
When using `git commit`, you may encounter:

- `error: cannot run editor: No such file or directory`
- `error: unable to start editor 'editor'`

This means that `git` cannot launch a text-editor for you to customize your commit-message with. A quick workaround is to use the `-m` flag, ex:

```sh
git commit -m "This is my commit message"
```

For an interactive editor, try `nano` or `vim`:

```sh
apt-get update
apt-get install nano
```



<<<<<<< HEAD
If you need to install new node dependencies, you should run those commands from inside the container. Once inside, use `pnpm add NameOfTheDependency` as normal.
=======
## Installing new packages
If you need to install new node dependencies, you should run those commands from inside the container via:
```sh
docker-compose exec webpack bash
```

Once inside, use `yarn add NameOfTheDependency` as normal.


>>>>>>> origin/master

## Container terminates unexpectedly
On Windows, you may see the error:

```sh
dim-webpack | error Command failed with exit code 137.
```

This may indicate that the Docker VM which hosts containers has run out of memory, and a higher setting is needed.
