FROM python:2.7.12

MAINTAINER MacArthur Lab

ENV EXAC_DATA=/var/exac_data/ READ_VIZ=/mongo/readviz \
  CLOUD_SDK_REPO=cloud-sdk-jessie GCSFUSE_REPO=gcsfuse-jessie

COPY deploy/keys/* /var/www/deploy/keys/

RUN apt-get update && \
  apt-get install -y apt-transport-https apt-utils tabix

# Install gcloud
RUN echo "deb https://packages.cloud.google.com/apt $CLOUD_SDK_REPO main" | tee -a /etc/apt/sources.list.d/google-cloud-sdk.list && \
  curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key add - && \
  apt-get update && apt-get install -y google-cloud-sdk

# Install gcfuse
RUN echo "deb http://packages.cloud.google.com/apt $GCSFUSE_REPO main" | tee /etc/apt/sources.list.d/gcsfuse.list && \
  curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key add - && \
  apt-get update && apt-get -y install gcsfuse

# Authorize container with service account
RUN gcloud auth activate-service-account \
  --key-file=/var/www/deploy/keys/exac-gnomad-30ea80400948.json

RUN apt-get update && apt-get install -y git-core vim

RUN apt-get update && apt-get install -y build-essential libssl-dev  && \
  curl -sL https://raw.githubusercontent.com/creationix/nvm/v0.32.0/install.sh -o install_nvm.sh

RUN bash install_nvm.sh
RUN bash ~/.nvm/nvm.sh install 6.5.0

COPY requirements.txt /var/www/

WORKDIR /var/www

RUN pip install -r requirements.txt
