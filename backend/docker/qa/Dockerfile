FROM python:3

WORKDIR /usr/app/src

COPY requirements.txt ./
COPY piazza.py ./
COPY posts.csv ./

RUN pip install --no-cache-dir --upgrade pip \
 && pip install --no-cache-dir -r requirements.txt

RUN python3 piazza.py -c posts.csv