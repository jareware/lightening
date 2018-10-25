FROM node:10.11

RUN mkdir /app
WORKDIR /app

COPY package.json /app
COPY package-lock.json /app

RUN npm install --production

COPY . /app

EXPOSE 8080
EXPOSE 8081

CMD [ "npm", "run", "server-start" ]
