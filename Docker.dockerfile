# Étape de construction
FROM node:14 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build -- --configuration=production

# Étape finale
FROM nginx:alpine

# Copiez le fichier de configuration NGINX
COPY default.conf /etc/nginx/conf.d/

# Copiez les fichiers construits à partir de l'étape de construction
COPY --from=builder /app/dist/rattrapage-eval360 /usr/share/nginx/html

# Exposez le port 8080 (port de l'application Angular)
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
