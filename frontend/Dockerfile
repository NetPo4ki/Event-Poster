FROM node:16-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Second stage: nginx to serve static content
FROM nginx:stable-alpine

# Copy build output
COPY --from=builder /app/build /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose the service port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"] 