FROM node:10-alpine as environment

# @TODO: Build node_modules into the build
COPY ./package.json ./package-lock.json /code/
WORKDIR /code

RUN npm install

# -----------------------------------------------------
FROM environment as build

COPY . /code

RUN npm run build:ts

# -----------------------------------------------------
FROM environment as runtime

COPY --from=build /code/build /code/build
COPY ./docker-entrypoint.sh /sbin/

ENTRYPOINT [ "/sbin/docker-entrypoint.sh" ]
CMD "prod"
