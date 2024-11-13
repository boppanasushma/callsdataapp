FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Copy requirements file
COPY requirements.txt .

# Install dependencies
# Fix GPG error by updating keys
RUN apt-get update -y && \
    apt-get install -y gnupg && \
    apt-key update && \
    apt-get clean

# Install dependencies
RUN apt-get update && \
    apt-get install -y curl iputils-ping net-tools gcc && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY . .

# Expose port 5004
EXPOSE 5004

# Command to run the application
CMD ["python", "app.py"]
