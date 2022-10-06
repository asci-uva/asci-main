FROM php:7.4-apache

RUN echo "THIS IS THE DOCKERFILE"

RUN apt-get update && apt-get install -y libpq-dev
RUN docker-php-ext-install pgsql pdo pdo_pgsql

COPY ./php-ini/php.prod.ini /usr/local/etc/php/php.ini


RUN service apache2 restart