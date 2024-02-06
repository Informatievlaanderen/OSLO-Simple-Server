FROM node:18-alpine

ARG PORT=3000
ENV ENV_PORT=$PORT

ARG FILE_URL
ENV ENV_FILE_URL=$FILE_URL

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# Bundle app source
COPY . .

EXPOSE $PORT
CMD [ "node", "index.js" ]
