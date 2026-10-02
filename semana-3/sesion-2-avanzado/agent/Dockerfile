FROM node:22-slim
WORKDIR /app
COPY package.json ./
RUN npm install
COPY agent.ts tsconfig.json ./
# Pasa la pregunta como argumento: docker compose run --rm agent "tu pregunta"
ENTRYPOINT ["npx", "tsx", "agent.ts"]
