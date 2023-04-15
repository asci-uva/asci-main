FROM php:7.4-apache

RUN echo "THIS IS THE DOCKERFILE"

RUN apt-get update && apt-get install -y libpq-dev git libzip-dev
RUN docker-php-ext-install pgsql pdo pdo_pgsql zip 

RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

COPY ./php-ini/php.prod.ini /usr/local/etc/php/php.ini

WORKDIR /opt/src/
COPY ../src/composer.json composer.json
RUN composer install --no-interaction --no-plugins --no-scripts --no-dev --prefer-dist
RUN composer dump-autoload --optimize --apcu --no-dev
RUN apt-get install -y python3 python3-pip

COPY ./docker/php/requirements.txt ./
COPY ./docker/php/piazza.py ./
COPY ./docker/php/posts.csv ./

RUN pip install --no-cache-dir --upgrade pip \
 && pip install --no-cache-dir -r requirements.txt

RUN mkdir ./.cache

RUN python3 piazza.py -c posts.csv

RUN service apache2 restart