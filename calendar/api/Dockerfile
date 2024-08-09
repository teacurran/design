##############################
# Base Image
##############################
FROM ruby:3.1.4-slim-bullseye AS base_image

RUN apt-get update \
  && apt-get install -y --fix-missing --no-install-recommends \
  build-essential libssl-dev libpq-dev shared-mime-info \
  nodejs npm curl wget zlib1g-dev liblzma-dev patch \
  && apt-get clean && rm -rf /var/lib/apt/lists/*

##############################
# install bundler
##############################
ENV BUNDLER_VERSION 2.3.26
RUN unset GEM_HOME \
	&& gem uninstall bundler -a -x \
	&& export GEM_HOME=/usr/local/bundle \
	&& gem install bundler -v $BUNDLER_VERSION

# Skip installing gem documentation
RUN echo 'gem: -no-document' >> "/root/.gemrc"

##############################
# install wkhtmltopdf - PDF rendering
##############################

RUN apt-get update \
    && apt-get install -y \
      fontconfig \
      libc6 \
      libfreetype6 \
      libjpeg62-turbo \
      libpng16-16 \
      libssl1.1 \
      libstdc++6 \
      libx11-6 \
      libxcb1 \
      libxext6 \
      libxrender1 \
      xfonts-75dpi \
      xfonts-base \
      zlib1g \
    && apt-get clean \
    && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/*

# RUN fc-cache -f
WORKDIR /opt

RUN export TARGETARCH=$(dpkg --print-architecture) \
  && wget https://github.com/wkhtmltopdf/packaging/releases/download/0.12.6.1-2/wkhtmltox_0.12.6.1-2.bullseye_${TARGETARCH}.deb \
  && apt-get -y install ./wkhtmltox_0.12.6.1-2.bullseye_${TARGETARCH}.deb \
  && rm wkhtmltox_0.12.6.1-2.bullseye_${TARGETARCH}.deb

# Wait
ADD https://github.com/ufoscout/docker-compose-wait/releases/download/2.9.0/wait ./wait
RUN chmod +x ./wait

##############################
# assetbuild stage
##############################
FROM base_image AS assetbuild

# install git
RUN apt-get update \
    && apt-get install -y \
      git \
      python3 \
      gcc \
    && apt-get clean \
    && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/*

# install node
ENV NODE_VERSION 20.12.2
ENV NVM_DIR /usr/local/nvm

# install nvm
# https://github.com/nvm-sh/nvm#install-script
RUN mkdir -p $NVM_DIR
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash

RUN /bin/bash -c "source $NVM_DIR/nvm.sh \
    && nvm install $NODE_VERSION \
    && nvm alias default $NODE_VERSION \
    && nvm use default"

# add node and npm to path so the commands are available
ENV NODE_PATH $NVM_DIR/v$NODE_VERSION/lib/node_modules
ENV PATH $NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH

ENV INSTALL_PATH /app
RUN mkdir -p $INSTALL_PATH/log
RUN touch $INSTALL_PATH/.env.local

WORKDIR $INSTALL_PATH

# Copy gem files
COPY ./Rakefile $INSTALL_PATH/Rakefile
COPY ./Gemfile $INSTALL_PATH/Gemfile
COPY ./Gemfile.lock $INSTALL_PATH/Gemfile.lock

# Bundle install
ARG DEPLOYMENT=development
ENV RAILS_ENV=${DEPLOYMENT}
RUN bundle config set --local path 'vendor/bundle'
RUN bundle install --jobs=`getconf _NPROCESSORS_ONLN` --retry=3 --verbose

# Copy app files
COPY ./.env $INSTALL_PATH
COPY ./public $INSTALL_PATH/public
COPY ./lib $INSTALL_PATH/lib
COPY ./config $INSTALL_PATH/config
COPY ./app $INSTALL_PATH/app

ENV RAILS_LOG_TO_STDOUT=TRUE

RUN bundle exec rake app:update:bin
RUN bundle exec rake assets:precompile

##############################
# Final Build
##############################
FROM base_image AS release

EXPOSE 3000

ENV INSTALL_PATH /app
RUN mkdir -p $INSTALL_PATH
RUN mkdir $INSTALL_PATH/log
WORKDIR $INSTALL_PATH

# Copy app code
COPY ./.env $INSTALL_PATH

COPY ./config.ru $INSTALL_PATH/config.ru
COPY ./Rakefile $INSTALL_PATH/Rakefile
COPY ./lib $INSTALL_PATH/lib
COPY ./config $INSTALL_PATH/config
COPY ./Gemfile $INSTALL_PATH/Gemfile
COPY ./Gemfile.lock $INSTALL_PATH/Gemfile.lock
COPY ./db $INSTALL_PATH/db
COPY ./app $INSTALL_PATH/app

# Copy gems
COPY --from=assetbuild $INSTALL_PATH/vendor/ $INSTALL_PATH/vendor
# Copy assets. Only need public. client isn't required because assets are already built
COPY --from=assetbuild $INSTALL_PATH/public/ $INSTALL_PATH/public

# Should get the gems from the earlier bundle install
RUN bundle config set --local path 'vendor/bundle'
RUN bundle config set --local without 'development test ci'
RUN bundle install

ARG deployment=development
ENV RAILS_ENV=${deployment}
ENV RAILS_LOG_TO_STDOUT=TRUE
ENV RAILS_SERVE_STATIC_FILES=1

RUN bundle exec rake app:update:bin

FROM assetbuild AS development

ENTRYPOINT ["bash"]

FROM release
