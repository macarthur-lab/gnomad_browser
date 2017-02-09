FROM gcr.io/exac-gnomad/gnomadbase

MAINTAINER MacArthur Lab

CMD pip install -U crcmod && \
  gsutil -m cp -r gs://gnomad-browser/combined_bams_genomes /var/data/readviz/ && \
  gsutil -m cp -r gs://gnomad-browser/combined_bams_exomes /var/data/readviz/ && \
  gsutil cp gs://exac/gencode.v19.sorted.bed /var/data/readviz/ && \
  gsutil cp gs://exac/gencode.v19.sorted.bed.idx /var/data/readviz/
