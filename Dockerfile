FROM node:4-onbuild

# Application source code
COPY config/ /app/config
COPY index.js /app/
COPY scripts.js /app/
COPY package.json /app/

COPY src/ /app/src
WORKDIR /app/src

# Install node-gyp as global and ensure it's all clean and tide
RUN npm install -g node-gyp && \
    node-gyp clean && \
    npm cache clean

RUN npm install

ENV NODE_ENV development
# Expose application server port
EXPOSE 8000

CMD ["npm", "run", "dev"]