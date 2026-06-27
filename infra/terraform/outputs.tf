output "ec2_public_ip" {
  description = "Public IP address of the EC2 instance"
  value       = aws_eip.main.public_ip
}

output "ec2_public_dns" {
  description = "Public DNS name of the EC2 instance"
  value       = aws_instance.main.public_dns
}

output "app_url" {
  description = "Application URL (backend API available at /api)"
  value       = "http://${aws_eip.main.public_ip}"
}

output "sonarqube_url" {
  description = "SonarQube URL (if enabled)"
  value       = var.sonarqube_enabled ? "http://${aws_eip.main.public_ip}:9000" : ""
}

output "prometheus_url" {
  description = "Prometheus URL (if enabled)"
  value       = var.prometheus_enabled ? "http://${aws_eip.main.public_ip}:9090" : ""
}

output "grafana_url" {
  description = "Grafana URL (if enabled)"
  value       = var.grafana_enabled ? "http://${aws_eip.main.public_ip}:3000" : ""
}

output "ecr_backend_url" {
  description = "ECR repository URL for the backend image"
  value       = aws_ecr_repository.backend.repository_url
}

output "ecr_frontend_url" {
  description = "ECR repository URL for the frontend image"
  value       = aws_ecr_repository.frontend.repository_url
}

output "ssh_command" {
  description = "SSH command to connect to the instance"
  value       = var.ssh_key_name != "" ? "ssh -i ${var.ssh_key_name}.pem ec2-user@${aws_eip.main.public_ip}" : ""
}

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}
