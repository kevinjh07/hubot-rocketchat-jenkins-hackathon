FROM node:9

WORKDIR /home/hubot

ADD . /home/hubot

RUN npm install

CMD bin/hubot
