FROM gcr.io/exac-gnomad/gnomadbase

MAINTAINER MacArthur Lab

CMD pip install -U crcmod && \
  mkdir /var/data/readviz/combined_bams_genomes \
  /var/data/readviz/combined_bams_exomes/ && \
  gsutil -m cp -r gs://gnomad-browser/combined_bams_genomes/* /var/data/readviz/combined_bams_genomes/ && \
  gsutil -m cp -r gs://gnomad-browser/combined_bams_exomes/* /var/data/readviz/combined_bams_exomes/ && \
  gsutil cp gs://exac/gencode.v19.sorted.bed /var/data/readviz/ && \
  gsutil cp gs://exac/gencode.v19.sorted.bed.idx /var/data/readviz/
