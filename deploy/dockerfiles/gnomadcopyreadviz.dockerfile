FROM gcr.io/exac-gnomad/gnomadbase

MAINTAINER Matthew Solomonson, <msolomon@broadinstitute.org> MacArthur Lab

CMD \
  # pip install -U crcmod && \
  # mkdir /var/data/readviz/combined_bams_genomes \
  # /var/data/readviz/combined_bams_exomes/ && \
  # gsutil -m cp -r gs://gnomad-browser/combined_bams_genomes/* /var/data/readviz/combined_bams_genomes/ && \
  echo "Removing old bams" && \
  rm -rf /var/data/readviz/combined_bams_exomes/* && \
  echo "Copying new bams" && \
  gsutil -m cp -r gs://gnomad-browser/combined_bams_exomes_20170317/* /var/data/readviz/combined_bams_exomes/

  # gsutil cp gs://exac/gencode.v19.sorted.bed /var/data/readviz/ && \
  # gsutil cp gs://exac/gencode.v19.sorted.bed.idx /var/data/readviz/
  # gsutil cp gs://exac/hg19.fa /var/data/readviz/ && \
  # gsutil cp gs://exac/hg19.fa.fai /var/data/readviz/
