terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

data "aws_caller_identity" "current" {}
data "aws_ami" "amazon_linux_2" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

locals {
  name_prefix = "${var.app_name}-${var.environment}"

  common_tags = {
    App         = var.app_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }

  backend_port   = 5000
  frontend_port  = 80
  sonarqube_port = 9000
  prometheus_port = 9090
  grafana_port   = 3000

  backend_repo  = aws_ecr_repository.backend.repository_url
  frontend_repo = aws_ecr_repository.frontend.repository_url
}

# ---------------------------------------------------------------------------
# VPC
# ---------------------------------------------------------------------------
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-vpc" })
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-igw" })
}

resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidr
  availability_zone       = var.availability_zone
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-public" })
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-public-rt" })
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

# ---------------------------------------------------------------------------
# Security Group
# ---------------------------------------------------------------------------
resource "aws_security_group" "main" {
  name        = "${local.name_prefix}-sg"
  description = "Security group for the EC2 instance"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Backend API"
    from_port   = 5000
    to_port     = 5000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "SonarQube"
    from_port   = 9000
    to_port     = 9000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Prometheus"
    from_port   = 9090
    to_port     = 9090
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Grafana"
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-sg" })
}

# ---------------------------------------------------------------------------
# IAM Role for EC2
# ---------------------------------------------------------------------------
resource "aws_iam_role" "ec2" {
  name = "${local.name_prefix}-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "ec2_ssm" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy" "ec2_secrets" {
  name = "${local.name_prefix}-ec2-secrets-policy"
  role = aws_iam_role.ec2.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "ssm:GetParameter",
        "ssm:GetParameters"
      ]
      Resource = ["arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/${local.name_prefix}/*"]
    }]
  })
}

resource "aws_iam_role_policy" "ec2_ecr" {
  name = "${local.name_prefix}-ec2-ecr-policy"
  role = aws_iam_role.ec2.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage"
      ]
      Resource = ["*"]
    }]
  })
}

resource "aws_iam_role_policy" "ec2_s3" {
  name = "${local.name_prefix}-ec2-s3-policy"
  role = aws_iam_role.ec2.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ]
      Resource = [
        "arn:aws:s3:::${local.name_prefix}-uploads",
        "arn:aws:s3:::${local.name_prefix}-uploads/*"
      ]
    }]
  })
}

resource "aws_iam_instance_profile" "main" {
  name = "${local.name_prefix}-instance-profile"
  role = aws_iam_role.ec2.name

  tags = local.common_tags
}

# ---------------------------------------------------------------------------
# ECR Repositories
# ---------------------------------------------------------------------------
resource "aws_ecr_repository" "backend" {
  name                 = "${local.name_prefix}-backend"
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = local.common_tags
}

resource "aws_ecr_repository" "frontend" {
  name                 = "${local.name_prefix}-frontend"
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = local.common_tags
}

# ---------------------------------------------------------------------------
# S3 Bucket for Uploads
# ---------------------------------------------------------------------------
resource "aws_s3_bucket" "uploads" {
  bucket = "${local.name_prefix}-uploads"
  tags   = local.common_tags
}

resource "aws_s3_bucket_public_access_block" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ---------------------------------------------------------------------------
# SSM Parameters for Secrets
# ---------------------------------------------------------------------------
resource "aws_ssm_parameter" "mongodb_uri" {
  name  = "/${local.name_prefix}/mongodb-uri"
  type  = "SecureString"
  value = var.mongodb_uri
  tags  = local.common_tags
}

resource "aws_ssm_parameter" "jwt_secret" {
  name  = "/${local.name_prefix}/jwt-secret"
  type  = "SecureString"
  value = var.jwt_secret
  tags  = local.common_tags
}

resource "aws_ssm_parameter" "openai_api_key" {
  count = var.openai_api_key != "" ? 1 : 0
  name  = "/${local.name_prefix}/openai-api-key"
  type  = "SecureString"
  value = var.openai_api_key
  tags  = local.common_tags
}

# ---------------------------------------------------------------------------
# Elastic IP
# ---------------------------------------------------------------------------
resource "aws_eip" "main" {
  domain = "vpc"

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-eip" })
}

resource "aws_eip_association" "main" {
  instance_id   = aws_instance.main.id
  allocation_id = aws_eip.main.id
}

# ---------------------------------------------------------------------------
# EC2 Instance + User Data
# ---------------------------------------------------------------------------
resource "aws_instance" "main" {
  ami                    = data.aws_ami.amazon_linux_2.id
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.main.id]
  key_name               = var.ssh_key_name != "" ? var.ssh_key_name : null
  iam_instance_profile   = aws_iam_instance_profile.main.name

  user_data = templatefile("${path.module}/user-data.sh", {
    aws_region      = var.aws_region
    aws_account_id  = data.aws_caller_identity.current.account_id
    name_prefix     = local.name_prefix
    backend_port    = local.backend_port
    frontend_port   = local.frontend_port
    sonarqube_port  = local.sonarqube_port
    prometheus_port = local.prometheus_port
    grafana_port    = local.grafana_port
    environment     = var.environment
    s3_bucket       = aws_s3_bucket.uploads.id
    backend_image   = local.backend_repo
    frontend_image  = local.frontend_repo
    openai_enabled  = var.openai_api_key != ""
    sonarqube_enabled = var.sonarqube_enabled
    prometheus_enabled = var.prometheus_enabled
    grafana_enabled    = var.grafana_enabled
    grafana_admin_pass = var.grafana_admin_password
  })

  user_data_replace_on_change = true

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-instance" })
}

# ---------------------------------------------------------------------------
# Route53 (optional)
# ---------------------------------------------------------------------------
data "aws_route53_zone" "main" {
  count = var.domain_name != "" ? 1 : 0
  name  = var.domain_name
}

resource "aws_route53_record" "app" {
  count   = var.domain_name != "" ? 1 : 0
  zone_id = data.aws_route53_zone.main[0].zone_id
  name    = var.domain_name
  type    = "A"

  ttl  = 300
  records = [aws_eip.main.public_ip]
}
