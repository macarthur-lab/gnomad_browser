FROM mongo

MAINTAINER Matthew Solomonson, <msolomon@broadinstitute.org>, MacArthur Lab

RUN mkdir /data/metrics

COPY deploy/dockerfiles/cloudscripts/load-metrics.sh /data/metrics/

COPY metrics /data/metrics

CMD /data/metrics/load-metrics.sh
