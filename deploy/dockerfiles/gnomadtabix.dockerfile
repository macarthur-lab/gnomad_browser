FROM gcr.io/exac-gnomad/gnomadbase

MAINTAINER MacArthur Lab

COPY deploy/keys/* /var/www/deploy/keys/

# Authorize container with service account
RUN gcloud auth activate-service-account \
  --key-file=/var/www/deploy/keys/exac-gnomad-baa22a3e25ed.json

RUN mkdir /var/data/

CMD pip install -U crcmod && \
  echo "Creating directories..." && \
  mkdir /var/data/tabixtemp/exomes /var/data/tabixtemp/genomes && \
  echo "Copying VCF files from buckets..." && \
  gsutil -m cp gs://gnomad-browser/exomes/feb-2017-release/* /var/data/tabixtemp/exomes/ && \
  gsutil -m cp gs://gnomad-browser/genomes/feb-2017-release/* /var/data/tabixtemp/genomes/ && \
  echo "Genome files:" && \
  ls /var/data/tabixtemp/genomes/ && \
  echo "Exome files:" && \
  ls /var/data/tabixtemp/exomes/ && \
  echo "Creating tabix index for genomes..." && \
  `for i in /var/data/tabixtemp/genomes/*gz; do tabix -f -p vcf $i & done`; \
  echo "Done creating indexes for genomes: " && \
  ls /var/data/tabixtemp/genomes/ && \
  echo "Creating tabix index for exomes..." && \
  `for i in /var/data/tabixtemp/exomes/*gz; do tabix -f -p vcf  $i; done`; \
  echo "Done creating indexes for exomes: " && \
  ls /var/data/tabixtemp/exomes/ && \
  echo "Copying files to storage bucket" && \
  gsutil -m cp /var/data/tabixtemp/exomes/*tbi gs://gnomad-browser/exomes/feb-2017-release/ && \
  gsutil -m cp /var/data/tabixtemp/genomes/*tbi gs://gnomad-browser/genomes/feb-2017-release/ && \
  echo "Cleaning up" && \
  rm -rf /var/data/tabixtemp/exomes /var/data/tabixtemp/genomes && \
  echo "Exiting"
