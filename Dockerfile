# Build a lightweight container for production
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci || npm install --only=production
COPY . .
ENV NODE_ENV=production PORT=3000
EXPOSE 3000
CMD ["node", "server.js"]
