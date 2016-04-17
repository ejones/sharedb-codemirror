FROM node:0.12

RUN mkdir /code
WORKDIR /code

ADD package.json /code/
RUN npm install

ADD . /code

EXPOSE 7007
