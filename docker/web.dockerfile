FROM node:latest

RUN npm install serve -g

CMD [ "serve" ]