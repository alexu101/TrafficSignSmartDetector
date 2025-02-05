# Use an official Python image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy application files
COPY . .

# Copy Google Cloud credentials
COPY my-project-key.json /app/my-project-key.json

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Set environment variable for credentials
ENV GOOGLE_APPLICATION_CREDENTIALS="/app/my-project-key.json"
ENV GCS_BUCKET_NAME="tras-bucket"

# Expose Flask port
EXPOSE 8080

# Run the application
CMD ["python", "app.py"]
