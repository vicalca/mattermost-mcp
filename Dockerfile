FROM node:20-alpine

WORKDIR /server

COPY . /server

RUN npm install -g supergateway && npm install && npm run build

EXPOSE 8001

ENTRYPOINT [ "./entrypoint.sh" ]