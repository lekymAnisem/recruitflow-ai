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

data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  name_prefix = "${var.app_name}-${var.environment}"

  common_tags = {
    App         = var.app_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }

  jenkins_port      = 8080
  sonarqube_port    = 9000
  prometheus_port   = 9090
  grafana_port      = 3000
  alertmanager_port = 9093
}

# ---------------------------------------------------------------------------
# Network
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
  count = length(var.public_subnet_cidrs)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name                                             = "${local.name_prefix}-public-${count.index + 1}"
    "kubernetes.io/role/elb"                         = "1"
    "kubernetes.io/cluster/${local.name_prefix}-eks" = "shared"
  })
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
  count = length(aws_subnet.public)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# ---------------------------------------------------------------------------
# Security Groups
# ---------------------------------------------------------------------------
resource "aws_security_group" "cicd" {
  name        = "${local.name_prefix}-cicd-sg"
  description = "CI/CD server access for Jenkins, SonarQube, Docker, kubectl, and Helm"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.admin_allowed_cidr_blocks
  }

  ingress {
    description = "Jenkins"
    from_port   = local.jenkins_port
    to_port     = local.jenkins_port
    protocol    = "tcp"
    cidr_blocks = var.cicd_allowed_cidr_blocks
  }

  ingress {
    description = "SonarQube"
    from_port   = local.sonarqube_port
    to_port     = local.sonarqube_port
    protocol    = "tcp"
    cidr_blocks = var.cicd_allowed_cidr_blocks
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-cicd-sg" })
}

resource "aws_security_group" "monitoring" {
  name        = "${local.name_prefix}-monitoring-sg"
  description = "Monitoring server access for Prometheus, Grafana, and Alertmanager"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.admin_allowed_cidr_blocks
  }

  ingress {
    description = "Grafana"
    from_port   = local.grafana_port
    to_port     = local.grafana_port
    protocol    = "tcp"
    cidr_blocks = var.monitoring_allowed_cidr_blocks
  }

  ingress {
    description = "Prometheus"
    from_port   = local.prometheus_port
    to_port     = local.prometheus_port
    protocol    = "tcp"
    cidr_blocks = var.monitoring_allowed_cidr_blocks
  }

  dynamic "ingress" {
    for_each = var.alertmanager_enabled ? [1] : []

    content {
      description = "Alertmanager"
      from_port   = local.alertmanager_port
      to_port     = local.alertmanager_port
      protocol    = "tcp"
      cidr_blocks = var.monitoring_allowed_cidr_blocks
    }
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-monitoring-sg" })
}

# ---------------------------------------------------------------------------
# IAM for EC2 CI/CD server
# ---------------------------------------------------------------------------
resource "aws_iam_role" "cicd" {
  name = "${local.name_prefix}-cicd-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "cicd_ssm" {
  role       = aws_iam_role.cicd.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy_attachment" "cicd_ecr" {
  role       = aws_iam_role.cicd.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser"
}

resource "aws_iam_role_policy" "cicd_eks" {
  name = "${local.name_prefix}-cicd-eks-policy"
  role = aws_iam_role.cicd.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "eks:DescribeCluster",
        "eks:ListClusters",
        "sts:GetCallerIdentity"
      ]
      Resource = "*"
    }]
  })
}

resource "aws_iam_instance_profile" "cicd" {
  name = "${local.name_prefix}-cicd-instance-profile"
  role = aws_iam_role.cicd.name

  tags = local.common_tags
}

# ---------------------------------------------------------------------------
# IAM for EKS
# ---------------------------------------------------------------------------
resource "aws_iam_role" "eks_cluster" {
  count = var.eks_enabled ? 1 : 0

  name = "${local.name_prefix}-eks-cluster-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "eks.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "eks_cluster" {
  count = var.eks_enabled ? 1 : 0

  role       = aws_iam_role.eks_cluster[0].name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
}

resource "aws_iam_role" "eks_nodes" {
  count = var.eks_enabled ? 1 : 0

  name = "${local.name_prefix}-eks-node-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "eks_nodes_worker" {
  count = var.eks_enabled ? 1 : 0

  role       = aws_iam_role.eks_nodes[0].name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
}

resource "aws_iam_role_policy_attachment" "eks_nodes_cni" {
  count = var.eks_enabled ? 1 : 0

  role       = aws_iam_role.eks_nodes[0].name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
}

resource "aws_iam_role_policy_attachment" "eks_nodes_ecr" {
  count = var.eks_enabled ? 1 : 0

  role       = aws_iam_role.eks_nodes[0].name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

# ---------------------------------------------------------------------------
# ECR repositories for Kubernetes workloads
# ---------------------------------------------------------------------------
resource "aws_ecr_repository" "backend" {
  name                 = "${local.name_prefix}-backend"
  image_tag_mutability = "MUTABLE"
  force_delete         = var.ecr_force_delete

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = local.common_tags
}

resource "aws_ecr_repository" "frontend" {
  name                 = "${local.name_prefix}-frontend"
  image_tag_mutability = "MUTABLE"
  force_delete         = var.ecr_force_delete

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = local.common_tags
}

# ---------------------------------------------------------------------------
# EC2 servers
# ---------------------------------------------------------------------------
resource "aws_eip" "cicd" {
  domain = "vpc"

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-cicd-eip" })
}

resource "aws_eip" "monitoring" {
  domain = "vpc"

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-monitoring-eip" })
}

resource "aws_instance" "cicd" {
  ami                    = var.ubuntu_ami_id
  instance_type          = var.cicd_instance_type
  subnet_id              = aws_subnet.public[0].id
  vpc_security_group_ids = [aws_security_group.cicd.id]
  key_name               = var.ssh_key_name != "" ? var.ssh_key_name : null
  iam_instance_profile   = aws_iam_instance_profile.cicd.name

  user_data = templatefile("${path.module}/user-data.sh", {
    aws_region        = var.aws_region
    eks_enabled       = var.eks_enabled
    eks_cluster_name  = var.eks_enabled ? aws_eks_cluster.main[0].name : ""
    jenkins_port      = local.jenkins_port
    sonarqube_port    = local.sonarqube_port
    sonarqube_enabled = var.sonarqube_enabled
  })

  user_data_replace_on_change = true

  root_block_device {
    volume_size           = var.cicd_root_volume_size
    volume_type           = "gp3"
    delete_on_termination = true
  }

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-cicd" })
}

resource "aws_eip_association" "cicd" {
  instance_id   = aws_instance.cicd.id
  allocation_id = aws_eip.cicd.id
}

resource "aws_instance" "monitoring" {
  ami                    = var.ubuntu_ami_id
  instance_type          = var.monitoring_instance_type
  subnet_id              = aws_subnet.public[0].id
  vpc_security_group_ids = [aws_security_group.monitoring.id]
  key_name               = var.ssh_key_name != "" ? var.ssh_key_name : null

  user_data = templatefile("${path.module}/monitoring-user-data.sh", {
    prometheus_enabled   = var.prometheus_enabled
    prometheus_version   = var.prometheus_version
    prometheus_port      = local.prometheus_port
    grafana_enabled      = var.grafana_enabled
    grafana_port         = local.grafana_port
    grafana_admin_pass   = var.grafana_admin_password
    alertmanager_enabled = var.alertmanager_enabled
    alertmanager_version = var.alertmanager_version
    alertmanager_port    = local.alertmanager_port
  })

  user_data_replace_on_change = true

  root_block_device {
    volume_size           = var.monitoring_root_volume_size
    volume_type           = "gp3"
    delete_on_termination = true
  }

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-monitoring" })
}

resource "aws_eip_association" "monitoring" {
  instance_id   = aws_instance.monitoring.id
  allocation_id = aws_eip.monitoring.id
}

# ---------------------------------------------------------------------------
# EKS cluster and worker nodes
# ---------------------------------------------------------------------------
resource "aws_eks_cluster" "main" {
  count = var.eks_enabled ? 1 : 0

  name     = "${local.name_prefix}-eks"
  role_arn = aws_iam_role.eks_cluster[0].arn
  version  = var.eks_version

  access_config {
    authentication_mode                         = "API_AND_CONFIG_MAP"
    bootstrap_cluster_creator_admin_permissions = true
  }

  vpc_config {
    endpoint_private_access = true
    endpoint_public_access  = true
    public_access_cidrs     = var.eks_public_access_cidr_blocks
    subnet_ids              = aws_subnet.public[*].id
  }

  depends_on = [aws_iam_role_policy_attachment.eks_cluster]

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-eks" })
}

resource "aws_eks_node_group" "main" {
  count = var.eks_enabled ? 1 : 0

  cluster_name    = aws_eks_cluster.main[0].name
  node_group_name = "${local.name_prefix}-workers"
  node_role_arn   = aws_iam_role.eks_nodes[0].arn
  subnet_ids      = aws_subnet.public[*].id

  ami_type       = "AL2_x86_64"
  capacity_type  = var.eks_node_capacity_type
  disk_size      = var.eks_node_disk_size
  instance_types = var.eks_node_instance_types

  scaling_config {
    desired_size = var.eks_node_desired_size
    max_size     = var.eks_node_max_size
    min_size     = var.eks_node_min_size
  }

  labels = {
    workload = "backend-frontend"
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_nodes_worker,
    aws_iam_role_policy_attachment.eks_nodes_cni,
    aws_iam_role_policy_attachment.eks_nodes_ecr
  ]

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-workers" })
}

resource "aws_eks_access_entry" "cicd" {
  count = var.eks_enabled ? 1 : 0

  cluster_name  = aws_eks_cluster.main[0].name
  principal_arn = aws_iam_role.cicd.arn
  type          = "STANDARD"
}

resource "aws_eks_access_policy_association" "cicd_admin" {
  count = var.eks_enabled ? 1 : 0

  cluster_name  = aws_eks_cluster.main[0].name
  principal_arn = aws_iam_role.cicd.arn
  policy_arn    = "arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy"

  access_scope {
    type = "cluster"
  }

  depends_on = [aws_eks_access_entry.cicd]
}
