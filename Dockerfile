# usa imagen ligera de Node.js
FROM node:22-alpine

WORKDIR /usr/src/app

COPY package.json package-lock.json ./

# instala dependencias
RUN npm i

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
