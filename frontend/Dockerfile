# Use an official Nginx image
FROM nginx:alpine

# Remove default Nginx configuration
RUN rm -rf /usr/share/nginx/html/*

# Copy React build files to Nginx web directory
COPY build /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose the correct port
EXPOSE 8080

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
