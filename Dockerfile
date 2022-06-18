FROM node:alpine

WORKDIR /app

ADD src/package.json /app
RUN npm install

ADD src /app

CMD ["npm", "start"]