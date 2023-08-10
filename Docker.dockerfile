# Utilisez l'image Node.js pour construire votre application
FROM node:14 as builder

WORKDIR /app

# Copiez les fichiers de l'application
COPY . .

# Installez les dépendances et construisez l'application
RUN npm install
RUN npm run build

# Utilisez l'image NGINX pour servir l'application
FROM nginx:alpine

# Copiez les fichiers construits à partir de l'étape précédente
COPY --from=builder /app/dist/your-app-name /usr/share/nginx/html

# Exposez le port 80
EXPOSE 80

# Démarrez NGINX
CMD ["nginx", "-g", "daemon off;"]
