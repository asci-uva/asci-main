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

RUN apt update
RUN echo "Y" | apt install python3-pip
RUN pip install pandas
RUN pip install numpy
RUN pip install -U scikit-learn

# Install dependencies
RUN apt-get update -y && apt-get install -y wget xvfb unzip jq chromium chromium-driver

# Set up Chromedriver Environment variables
ENV CHROMEDRIVER_DIR /usr/bin
ENV PATH $CHROMEDRIVER_DIR:$PATH

RUN pip install selenium
RUN service apache2 restart