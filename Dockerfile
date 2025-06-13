FROM node:18

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# .env faylni containerga ko'chirish
COPY .env .env

RUN npm run build

CMD ["npm", "run", "dev"]