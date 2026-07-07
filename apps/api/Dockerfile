FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY apps/api/prisma ./apps/api/prisma/
COPY apps/web/package*.json ./apps/web/

RUN npm install

COPY apps/api ./apps/api

WORKDIR /app/apps/api

RUN npx prisma generate
RUN npm run build


ENV JWT_SECRET="dev-secret-change-me"
ENV PORT=4000

EXPOSE 4000

CMD ["npm", "run", "docker:start"]
