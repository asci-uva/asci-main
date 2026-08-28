# FROM postgres
FROM postgres:17

ENV POSTGRES_USER asci
ENV POSTGRES_PASSWORD asci
ENV POSTGRES_DB asci

COPY ./backend/docker/postgres/init.sql /docker-entrypoint-initdb.d
