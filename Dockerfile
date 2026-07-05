# ====== STAGE 1: BUILD STAGE ======
FROM node:20-alpine AS build
WORKDIR /app

# Copy package dependency definitions
COPY package.json package-lock.json ./

# Install npm dependencies cleanly (clean install)
RUN npm ci

# Copy the rest of the source code
COPY . .

# Set up build arguments for environment variables
# Vite embeds env variables at build time, so this must be passed during build
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Compile TypeScript and build production bundle
RUN npm run build

# ====== STAGE 2: RUN STAGE ======
FROM nginx:1.25-alpine

# Remove default Nginx configuration
RUN rm -rf /etc/nginx/conf.d/default.conf

# Copy custom Nginx configuration for single page application routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build artifacts from the build stage to Nginx web root
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
