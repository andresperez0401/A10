FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build

ENV JWT_SECRET="dev-secret-change-me"

EXPOSE 4000

CMD ["npm", "run", "docker:start"]
