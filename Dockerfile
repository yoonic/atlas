FROM debian:jessie

RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    nano \
    supervisor

# Install Node.js
RUN curl -sL https://deb.nodesource.com/setup_4.x | bash -
RUN apt-get install -y nodejs

# Improve cache invalidations by only running npm if requirements have indeed changed
WORKDIR /app
COPY package.json /app/
RUN npm install

# Supervisor settings
COPY docker/supervisord.conf /etc/supervisor/conf.d/atlas.conf

# Application source code
COPY config/ /app/config
COPY src/ /app/src
COPY index.js /app/
COPY scripts.js /app/

# Expose application server port
EXPOSE 8000

CMD ["supervisord", "-c", "/etc/supervisor/supervisord.conf", "-n"]
