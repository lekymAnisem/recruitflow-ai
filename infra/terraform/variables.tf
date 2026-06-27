variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "ap-southeast-2"
}

variable "environment" {
  description = "Deployment environment (dev/staging/prod)"
  type        = string
  default     = "production"
}

variable "app_name" {
  description = "Application name used for resource naming"
  type        = string
  default     = "recruitflow"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zone" {
  description = "Availability zone to deploy into"
  type        = string
  default     = "ap-southeast-2a"
}

variable "public_subnet_cidr" {
  description = "CIDR block for the public subnet"
  type        = string
  default     = "10.0.1.0/24"
}

variable "instance_type" {
  description = "EC2 instance type (t2.micro is free tier eligible)"
  type        = string
  default     = "t2.micro"
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = ""
}

variable "jwt_secret" {
  description = "JWT signing secret"
  type        = string
  sensitive   = true
}

variable "openai_api_key" {
  description = "OpenAI API key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "mongodb_uri" {
  description = "MongoDB connection URI"
  type        = string
  sensitive   = true
}

variable "ssh_key_name" {
  description = "Name of an existing EC2 key pair for SSH access"
  type        = string
  default     = ""
}

variable "sonarqube_enabled" {
  description = "Whether to deploy SonarQube"
  type        = bool
  default     = true
}

variable "prometheus_enabled" {
  description = "Whether to deploy Prometheus"
  type        = bool
  default     = true
}

variable "grafana_enabled" {
  description = "Whether to deploy Grafana"
  type        = bool
  default     = true
}

variable "grafana_admin_password" {
  description = "Grafana admin password"
  type        = string
  sensitive   = true
  default     = ""
}

variable "github_repo_url" {
  description = "GitHub repository URL to clone the app code on the instance"
  type        = string
  default     = ""
}
