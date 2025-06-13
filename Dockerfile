FROM node:18

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# .env o'rniga environment o'zgaruvchilarni sozlash
ENV PORT=${ENV_PORT}
ENV DATABASE_URL=${ENV_DATABASE_URL}
ENV ALLOWED_ORIGINS=${ENV_ALLOWED_ORIGINS}
ENV NODE_ENV=${ENV_NODE_ENV}

RUN npm run build

CMD ["npm", "run", "dev"]