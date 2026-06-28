#!/bin/bash
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

apt-get update -y
apt-get install -y apt-transport-https ca-certificates curl gnupg software-properties-common tar wget

%{ if prometheus_enabled }
# Prometheus
useradd --no-create-home --shell /bin/false prometheus || true
mkdir -p /etc/prometheus /etc/prometheus/data

cd /tmp
wget -q https://github.com/prometheus/prometheus/releases/download/v${prometheus_version}/prometheus-${prometheus_version}.linux-amd64.tar.gz
tar -xzf prometheus-${prometheus_version}.linux-amd64.tar.gz
cp -R prometheus-${prometheus_version}.linux-amd64/* /etc/prometheus/
ln -sf /etc/prometheus/prometheus /usr/local/bin/prometheus
ln -sf /etc/prometheus/promtool /usr/local/bin/promtool

cat > /etc/prometheus/prometheus.yml <<PROMEOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s
%{ if alertmanager_enabled }

alerting:
  alertmanagers:
    - static_configs:
        - targets: ["localhost:${alertmanager_port}"]
%{ endif }

scrape_configs:
  - job_name: "prometheus"
    static_configs:
      - targets: ["localhost:${prometheus_port}"]
PROMEOF

chown -R prometheus:prometheus /etc/prometheus

cat > /etc/systemd/system/prometheus.service <<SERVICEEOF
[Unit]
Description=Prometheus Monitoring System
Wants=network-online.target
After=network-online.target

[Service]
User=prometheus
Group=prometheus
Type=simple
ExecStart=/usr/local/bin/prometheus \
  --config.file=/etc/prometheus/prometheus.yml \
  --storage.tsdb.path=/etc/prometheus/data \
  --web.listen-address=0.0.0.0:${prometheus_port} \
  --web.console.templates=/etc/prometheus/consoles \
  --web.console.libraries=/etc/prometheus/console_libraries
Restart=always

[Install]
WantedBy=multi-user.target
SERVICEEOF

systemctl daemon-reload
systemctl enable prometheus
systemctl start prometheus
%{ endif }

%{ if alertmanager_enabled }
# Alertmanager
useradd --no-create-home --shell /bin/false alertmanager || true
mkdir -p /etc/alertmanager /etc/alertmanager/data

cd /tmp
wget -q https://github.com/prometheus/alertmanager/releases/download/v${alertmanager_version}/alertmanager-${alertmanager_version}.linux-amd64.tar.gz
tar -xzf alertmanager-${alertmanager_version}.linux-amd64.tar.gz
cp alertmanager-${alertmanager_version}.linux-amd64/alertmanager /usr/local/bin/alertmanager
cp alertmanager-${alertmanager_version}.linux-amd64/amtool /usr/local/bin/amtool

cat > /etc/alertmanager/alertmanager.yml <<ALERTEOF
global:
  resolve_timeout: 5m

route:
  receiver: "default"

receivers:
  - name: "default"
ALERTEOF

chown -R alertmanager:alertmanager /etc/alertmanager

cat > /etc/systemd/system/alertmanager.service <<SERVICEEOF
[Unit]
Description=Prometheus Alertmanager
Wants=network-online.target
After=network-online.target

[Service]
User=alertmanager
Group=alertmanager
Type=simple
ExecStart=/usr/local/bin/alertmanager \
  --config.file=/etc/alertmanager/alertmanager.yml \
  --storage.path=/etc/alertmanager/data \
  --web.listen-address=0.0.0.0:${alertmanager_port}
Restart=always

[Install]
WantedBy=multi-user.target
SERVICEEOF

systemctl daemon-reload
systemctl enable alertmanager
systemctl start alertmanager
%{ endif }

%{ if grafana_enabled }
# Grafana
mkdir -p /etc/apt/keyrings
wget -q -O - https://apt.grafana.com/gpg.key | gpg --dearmor > /etc/apt/keyrings/grafana.gpg
echo "deb [signed-by=/etc/apt/keyrings/grafana.gpg] https://apt.grafana.com stable main" > /etc/apt/sources.list.d/grafana.list
apt-get update -y
apt-get install -y grafana

mkdir -p /etc/grafana/provisioning/datasources
cat > /etc/grafana/provisioning/datasources/prometheus.yml <<GRAFEOF
apiVersion: 1
datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://localhost:${prometheus_port}
    isDefault: true
GRAFEOF

sed -i "s/;http_port = 3000/http_port = ${grafana_port}/" /etc/grafana/grafana.ini
%{ if grafana_admin_pass != "" }
sed -i "s/;admin_password = admin/admin_password = ${grafana_admin_pass}/" /etc/grafana/grafana.ini
%{ endif }

systemctl enable grafana-server
systemctl start grafana-server
%{ endif }
