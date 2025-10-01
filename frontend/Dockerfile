FROM node:20-alpine

WORKDIR /app

# Copia package.json e package-lock.json
COPY package*.json ./

# Installa dipendenze
RUN npm install

# Copia tutto il codice
COPY . .

# Esponi porta
EXPOSE 5173

# Comando di default
CMD ["npm", "run", "dev", "--", "--host"]
