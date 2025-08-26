FROM node:20-alpine

WORKDIR /server

COPY . /server

RUN npm install && npm run build

ENTRYPOINT [ "./entrypoint.sh" ]