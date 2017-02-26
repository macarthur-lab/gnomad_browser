FROM gcr.io/exac-gnomad/gnomadbase

MAINTAINER MacArthur Lab

COPY . /var/www/

RUN mkdir /var/exac_data;

CMD gcsfuse \
  --implicit-dirs \
  --key-file=/var/www/deploy/keys/exac-gnomad-30ea80400948.json \
  exac /var/exac_data && \
  ls /var/exac_data && \
  python manage.py precalculate_metrics_exomes && \
  python manage.py precalculate_metrics_genomes
