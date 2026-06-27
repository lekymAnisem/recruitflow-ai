#!/bin/bash
set -e

# Install Docker
yum update -y
yum install -y docker amazon-efs-utils awscli jq
systemctl enable docker
systemctl start docker
usermod -aG docker ec2-user

# Install Docker Compose
arch=$(uname -m)
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-${arch}" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose

# Login to ECR
aws ecr get-login-password --region ${aws_region} | \
  docker login --username AWS --password-stdin ${aws_account_id}.dkr.ecr.${aws_region}.amazonaws.com

# Create app directories
mkdir -p /opt/recruitflow/sonarqube/{data,logs,extensions}
mkdir -p /opt/recruitflow/grafana/provisioning/{datasources,dashboards}
mkdir -p /opt/recruitflow/prometheus

# Get the public IP dynamically
PUBLIC_IP=$(curl -s http://checkip.amazonaws.com || curl -s http://169.254.169.254/latest/meta-data/public-ipv4)

# Write .env
cat > /opt/recruitflow/.env <<ENVEOF
NODE_ENV=${environment}
PORT=${backend_port}
CORS_ORIGIN=http://$PUBLIC_IP
AWS_REGION=${aws_region}
AWS_S3_BUCKET_NAME=${s3_bucket}
MONGO_URI=$(aws ssm get-parameter --name /${name_prefix}/mongodb-uri --with-decryption --region ${aws_region} --query Parameter.Value --output text)
JWT_SECRET=$(aws ssm get-parameter --name /${name_prefix}/jwt-secret --with-decryption --region ${aws_region} --query Parameter.Value --output text)
ENVEOF

%{ if openai_enabled }
echo "OPENAI_API_KEY=$(aws ssm get-parameter --name /${name_prefix}/openai-api-key --with-decryption --region ${aws_region} --query Parameter.Value --output text)" >> /opt/recruitflow/.env
%{ endif }

# Write docker-compose.yml
cat > /opt/recruitflow/docker-compose.yml <<COMPOSEEOF
version: "3.8"

services:
  backend:
    image: ${backend_image}:latest
    container_name: recruitflow-backend
    restart: unless-stopped
    ports:
      - "${backend_port}:${backend_port}"
    env_file: .env
    volumes:
      - backend_uploads:/app/uploads

  frontend:
    image: ${frontend_image}:latest
    container_name: recruitflow-frontend
    restart: unless-stopped
    ports:
      - "${frontend_port}:${frontend_port}"
    depends_on:
      - backend

%{ if sonarqube_enabled }
  sonarqube:
    image: sonarqube:community
    container_name: recruitflow-sonarqube
    restart: unless-stopped
    ports:
      - "${sonarqube_port}:${sonarqube_port}"
    environment:
      - SONAR_JDBC_URL=
      - SONAR_JDBC_USERNAME=
      - SONAR_JDBC_PASSWORD=
    volumes:
      - /opt/recruitflow/sonarqube/data:/opt/sonarqube/data
      - /opt/recruitflow/sonarqube/logs:/opt/sonarqube/logs
      - /opt/recruitflow/sonarqube/extensions:/opt/sonarqube/extensions
%{ endif }

%{ if prometheus_enabled }
  prometheus:
    image: prom/prometheus:latest
    container_name: recruitflow-prometheus
    restart: unless-stopped
    ports:
      - "${prometheus_port}:${prometheus_port}"
    volumes:
      - /opt/recruitflow/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - "--config.file=/etc/prometheus/prometheus.yml"
      - "--storage.tsdb.path=/prometheus"
      - "--web.console.libraries=/usr/share/prometheus/console_libraries"
      - "--web.console.templates=/usr/share/prometheus/consoles"
      - "--web.enable-lifecycle"
%{ endif }

%{ if grafana_enabled }
  grafana:
    image: grafana/grafana:latest
    container_name: recruitflow-grafana
    restart: unless-stopped
    ports:
      - "${grafana_port}:${grafana_port}"
    environment:
      - GF_SERVER_SERVE_FROM_SUB_PATH=false
      - GF_AUTH_ANONYMOUS_ENABLED=false
      - GF_SECURITY_ADMIN_USER=admin
%{ if grafana_admin_pass != "" }
      - GF_SECURITY_ADMIN_PASSWORD=${grafana_admin_pass}
%{ endif }
    volumes:
      - /opt/recruitflow/grafana/provisioning:/etc/grafana/provisioning
      - grafana_data:/var/lib/grafana
%{ endif }

volumes:
  backend_uploads:
  prometheus_data:
  grafana_data:
COMPOSEEOF

# Write Prometheus config
%{ if prometheus_enabled }
cat > /opt/recruitflow/prometheus/prometheus.yml <<PROMEOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: "prometheus"
    static_configs:
      - targets: ["localhost:9090"]

  - job_name: "backend"
    static_configs:
      - targets: ["backend:${backend_port}"]
PROMEOF
%{ endif }

# Write Grafana datasource config
%{ if grafana_enabled }
cat > /opt/recruitflow/grafana/provisioning/datasources/prometheus.yml <<GRAFEOF
apiVersion: 1
datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
GRAFEOF

cat > /opt/recruitflow/grafana/provisioning/dashboards/default.yml <<DASHEOF
apiVersion: 1
providers:
  - name: "default"
    orgId: 1
    folder: ""
    type: file
    disableDeletion: false
    editable: true
    options:
      path: /var/lib/grafana/dashboards
DASHEOF
%{ endif }

# Pull and start all services
cd /opt/recruitflow
docker-compose pull || true
docker-compose up -d

# Cleanup old images
docker system prune -af --filter "until=24h" || true
