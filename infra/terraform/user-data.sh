#!/bin/bash
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

apt-get update -y
apt-get install -y \
  apt-transport-https \
  ca-certificates \
  curl \
  fontconfig \
  gnupg \
  lsb-release \
  openjdk-21-jre \
  software-properties-common \
  unzip \
  wget

# Docker
apt-get install -y docker.io
systemctl enable docker
systemctl start docker
usermod -aG docker ubuntu || true
chmod 660 /var/run/docker.sock || true
chown root:docker /var/run/docker.sock || true

# Jenkins
mkdir -p /etc/apt/keyrings
wget -O /etc/apt/keyrings/jenkins-keyring.asc https://pkg.jenkins.io/debian-stable/jenkins.io-2026.key
echo "deb [signed-by=/etc/apt/keyrings/jenkins-keyring.asc] https://pkg.jenkins.io/debian-stable binary/" > /etc/apt/sources.list.d/jenkins.list
apt-get update -y
apt-get install -y jenkins
usermod -aG docker jenkins || true
systemctl enable jenkins
systemctl restart jenkins

# AWS CLI v2
cd /tmp
curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip -q -o awscliv2.zip
./aws/install --update

# kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Helm
curl -fsSL https://packages.buildkite.com/helm-linux/helm-debian/gpgkey | gpg --dearmor > /usr/share/keyrings/helm.gpg
echo "deb [signed-by=/usr/share/keyrings/helm.gpg] https://packages.buildkite.com/helm-linux/helm-debian/any/ any main" > /etc/apt/sources.list.d/helm-stable-debian.list
apt-get update -y
apt-get install -y helm

# Optional eksctl, useful from Jenkins jobs and the ubuntu shell.
curl --silent --location "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" | tar xz -C /tmp
mv /tmp/eksctl /usr/local/bin/eksctl

%{ if sonarqube_enabled }
# SonarQube on Docker
mkdir -p /opt/sonarqube/{data,logs,extensions}
chown -R 1000:1000 /opt/sonarqube
docker rm -f sonarqube || true
docker run -d \
  --name sonarqube \
  --restart unless-stopped \
  -p ${sonarqube_port}:9000 \
  -v /opt/sonarqube/data:/opt/sonarqube/data \
  -v /opt/sonarqube/logs:/opt/sonarqube/logs \
  -v /opt/sonarqube/extensions:/opt/sonarqube/extensions \
  sonarqube:lts-community
%{ endif }

%{ if eks_enabled }
# Configure kubectl for Jenkins and ubuntu users.
aws eks update-kubeconfig --region ${aws_region} --name ${eks_cluster_name}
mkdir -p /var/lib/jenkins/.kube
cp /root/.kube/config /var/lib/jenkins/.kube/config
chown -R jenkins:jenkins /var/lib/jenkins/.kube
mkdir -p /home/ubuntu/.kube
cp /root/.kube/config /home/ubuntu/.kube/config
chown -R ubuntu:ubuntu /home/ubuntu/.kube
%{ endif }

chmod 660 /var/run/docker.sock || true
chown root:docker /var/run/docker.sock || true
