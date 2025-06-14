# --- BASE IMAGE ---
FROM node:18

# --- CREATE APP DIR ---
WORKDIR /app

# --- COPY PACKAGE FILES AND INSTALL DEPENDENCIES ---
COPY package*.json ./
RUN npm install

# --- COPY REMAINING FILES AND BUILD ---
COPY . .
RUN npm run build

# --- SET ENVIRONMENT VARIABLES ---
ENV NODE_ENV=production

# --- START APPLICATION IN PRODUCTION MODE ---
CMD ["npm", "run", "start"]
