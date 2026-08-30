FROM python:3.11-slim

# Install system libraries for OpenCV and FFmpeg
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# Copy project files
COPY . .

ENV PORT=10000
EXPOSE 10000

# Run with Gunicorn production server on port 10000
CMD exec gunicorn -w 1 -b 0.0.0.0:10000 --threads 4 --timeout 120 app:app
