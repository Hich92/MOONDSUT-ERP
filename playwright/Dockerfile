FROM node:20-slim

ENV DEBIAN_FRONTEND=noninteractive
ENV PLAYWRIGHT_BROWSERS_PATH=/pw-browsers

WORKDIR /app

COPY package*.json ./
RUN npm install

# Installe Chromium + toutes ses dépendances système via Playwright
RUN npx playwright install chromium --with-deps

COPY . .
RUN mkdir -p /results

EXPOSE 3001
CMD ["node", "server.js"]
