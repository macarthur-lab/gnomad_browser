FROM gcr.io/exac-gnomad/gnomadbase

MAINTAINER MacArthur Lab

COPY . /var/www/

RUN mkdir /var/data/; mkdir /var/data/loading_data

CMD gcsfuse \
  --implicit-dirs \
  --key-file=/var/www/deploy/keys/exac-gnomad-30ea80400948.json \
  gnomad-browser /var/data/loading_data && \
  ls /var/data/loading_data && \
  python manage.py load_db
