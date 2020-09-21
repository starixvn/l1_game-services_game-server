# Base image
FROM node:14.10-slim

USER root
RUN apt-get update
RUN apt-get install -y build-essential python

ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV
RUN mkdir /opt/node_app && chown node:node /opt/node_app
WORKDIR /opt/node_app

USER node
COPY package.json package-lock.json* ./

RUN npm run reg
RUN npm install && npm cache clean --force
ENV PATH /opt/node_app/node_modules/.bin:$PATH

WORKDIR /opt/node_app/src
COPY ./src .

HEALTHCHECK --interval=30s CMD node --es-module-specifier-resolution=node healthcheck.js

CMD [ "node", "--max-old-space-size=8192", "./server.js" ]