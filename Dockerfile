# Latest LTS node
FROM node:fermium

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json yarn.lock /usr/src/app/
RUN yarn install --frozen-lockfile --prefer-offline

# Bundle app source
COPY . /usr/src/app

# Generate CSS
RUN npm start

EXPOSE 8080
# Run Sass watcher for Chrome
CMD [ "npm", "start" ]
