# FROM php:7.4-apache
FROM php:8.2-apache

RUN echo "THIS IS THE DOCKERFILE"

RUN apt-get update && apt-get install -y libpq-dev git libzip-dev wget xvfb unzip jq chromium chromium-driver
RUN docker-php-ext-install pgsql pdo pdo_pgsql zip 

RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

COPY ./php-ini/php.prod.ini /usr/local/etc/php/php.ini

# Set up Chromedriver Environment variables
ENV CHROMEDRIVER_DIR /usr/bin
ENV PATH $CHROMEDRIVER_DIR:$PATH

WORKDIR /opt/src/
COPY ../src/composer.json composer.json
RUN composer config --global audit.block-insecure false
RUN composer install --no-interaction --no-plugins --no-scripts --no-dev --prefer-dist
RUN composer dump-autoload --optimize --apcu --no-dev

RUN apt update
RUN echo "Y" | apt install python3-pip
RUN apt install -y python3-pandas python3-numpy python3-sklearn python3-selenium
# RUN pip install pandas
# RUN pip install numpy
# RUN pip install -U scikit-learn

# RUN pip install selenium


RUN service apache2 restart

RUN mkdir /opt/log
RUN touch /opt/log/server.log && chmod a+w /opt/log/server.log

RUN mkdir /opt/tmp && chmod a+rw /opt/tmp
