FROM node:4-onbuild

# So we don't have to do everything as root
RUN useradd --user-group --create-home --shell /bin/false app &&\
  npm install --global npm@latest

# Default value, but will be overriden 
# by whatever user or docker-compose provides
ENV NODE_ENV=dev

# Workdir
ENV HOME=/home/app

# NPM Requirements
COPY package.json $HOME/atlas/
# Application source code
COPY config/ $HOME/atlas/config
COPY index.js $HOME/atlas/
COPY scripts.js $HOME/atlas/

# Correct file permissions
RUN chown -R app:app $HOME/*

# Set Run Settings
USER app
WORKDIR $HOME/atlas

# Install the dependencies
RUN npm install

# Expose application server port
EXPOSE 8000

CMD npm run ${NODE_ENV}