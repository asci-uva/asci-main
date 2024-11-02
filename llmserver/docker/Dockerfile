FROM php:7.4-apache

RUN echo "THIS IS THE DOCKERFILE"

RUN apt-get update && apt-get install -y libpq-dev git libzip-dev wget xvfb unzip jq
RUN docker-php-ext-install zip 

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

RUN pip install 'accelerate>=0.26.0'
RUN pip install -U openai
RUN pip install -U python-dotenv 
RUN pip install -U llama-index
RUN pip install -U llama-index-core
RUN pip install -U llama-index-readers-file
RUN pip install -U llama-index-embeddings-huggingface
RUN pip install -U llama-index-llms-llamafile
RUN pip install -U llama-index-vector-stores-postgres 


RUN service apache2 restart

RUN mkdir /opt/log
RUN touch /opt/log/server.log && chmod a+w /opt/log/server.log

