# 阶段 1：构建前端
FROM node:20-alpine AS frontend-builder
WORKDIR /app/client
RUN npm config set registry https://registry.npmmirror.com
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# 阶段 2：构建后端和最终运行环境
FROM node:20-alpine
WORKDIR /app/server
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories
RUN apk add --no-cache python3 make g++
RUN npm config set registry https://registry.npmmirror.com
COPY server/package*.json ./
RUN npm install --production
COPY server/ ./
COPY --from=frontend-builder /app/client/dist ./public
RUN mkdir -p /app/data
ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001
CMD ["node", "app.js"]
