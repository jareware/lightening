FROM node:10.11

RUN mkdir /app
WORKDIR /app

COPY package.json /app
COPY package-lock.json /app
COPY tsconfig.json /app

RUN npm install

COPY src /app/src

RUN npm run build-client
RUN npm run build-server

EXPOSE 8080
EXPOSE 8081

CMD [ "npm", "start" ]
