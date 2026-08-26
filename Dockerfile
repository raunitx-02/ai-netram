FROM python:3.11-slim

# Install system libraries for OpenCV and FFmpeg
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libgl1-mesa-glx \
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

# Set default port
ENV PORT=5010
EXPOSE 5010

# Run with Gunicorn production server
CMD ["gunicorn", "--bind", "0.0.0.0:5010", "--workers", "2", "--timeout", "120", "app:app"]
