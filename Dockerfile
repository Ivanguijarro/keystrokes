# usa imagen ligera de Node.js
FROM node:20-alpine

WORKDIR /usr/src/app

COPY package.json package-lock.json ./

# instala dependencias
RUN npm ci

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
