FROM gcr.io/exac-gnomad/gnomadbase

MAINTAINER Matthew Solomonson, <msolomon@broadinstitute.org>, MacArthur Lab

COPY deploy/keys/* /var/www/deploy/keys/

# Authorize container with service account
RUN gcloud auth activate-service-account \
  --key-file=/var/www/deploy/keys/exac-gnomad-baa22a3e25ed.json

RUN mkdir /var/data/

COPY deploy/dockerfiles/cloudscripts/create-tabix-indexes.sh /var/www/deploy/dockerfiles/cloudscripts/

RUN pip install -U crcmod

ENV BUCKET_PATH=

ENTRYPOINT ["/var/www/deploy/dockerfiles/cloudscripts/create-tabix-indexes.sh"]

