FROM node:20-slim
WORKDIR /workspace
ENV NODE_ENV=production
COPY package*.json ./
COPY apps/investor-portal/package*.json apps/investor-portal/
COPY packages packages
COPY apps/investor-portal apps/investor-portal
RUN npm ci --omit=dev --workspaces --include-workspace-root=false || npm install --omit=dev
EXPOSE 4001
CMD ["npm", "--workspace", "@udyogsetu/investor-portal", "start"]
