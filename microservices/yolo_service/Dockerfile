# Use an official Python image as base
FROM python:3.10

# Set the working directory inside the container
WORKDIR /app

# Install system dependencies (Fixed the package name)
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 

# Copy the requirements file and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY . .

# Expose the Flask port
EXPOSE 8080

# Run the Flask application
CMD ["python", "app.py"]
