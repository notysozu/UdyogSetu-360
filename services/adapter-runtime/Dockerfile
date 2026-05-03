FROM node:20-slim
WORKDIR /workspace
ENV NODE_ENV=production
COPY package*.json ./
COPY services/adapter-runtime/package*.json services/adapter-runtime/
COPY packages packages
COPY services/adapter-runtime services/adapter-runtime
RUN npm ci --omit=dev --workspaces --include-workspace-root=false || npm install --omit=dev
EXPOSE 4102
CMD ["npm", "--workspace", "@udyogsetu/adapter-runtime", "start"]
