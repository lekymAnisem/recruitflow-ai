output "cicd_public_ip" {
  description = "Public IP address of Server 1, the CI/CD server"
  value       = aws_eip.cicd.public_ip
}

output "cicd_ssh_command" {
  description = "SSH command for Server 1, the CI/CD server"
  value       = var.ssh_key_name != "" ? "ssh -i ${var.ssh_key_name}.pem ubuntu@${aws_eip.cicd.public_ip}" : ""
}

output "jenkins_url" {
  description = "Jenkins URL"
  value       = "http://${aws_eip.cicd.public_ip}:8080"
}

output "sonarqube_url" {
  description = "SonarQube URL"
  value       = var.sonarqube_enabled ? "http://${aws_eip.cicd.public_ip}:9000" : ""
}

output "monitoring_public_ip" {
  description = "Public IP address of Server 2, the monitoring server"
  value       = aws_eip.monitoring.public_ip
}

output "monitoring_ssh_command" {
  description = "SSH command for Server 2, the monitoring server"
  value       = var.ssh_key_name != "" ? "ssh -i ${var.ssh_key_name}.pem ubuntu@${aws_eip.monitoring.public_ip}" : ""
}

output "prometheus_url" {
  description = "Prometheus URL"
  value       = var.prometheus_enabled ? "http://${aws_eip.monitoring.public_ip}:9090" : ""
}

output "grafana_url" {
  description = "Grafana URL"
  value       = var.grafana_enabled ? "http://${aws_eip.monitoring.public_ip}:3000" : ""
}

output "alertmanager_url" {
  description = "Alertmanager URL"
  value       = var.alertmanager_enabled ? "http://${aws_eip.monitoring.public_ip}:9093" : ""
}

output "eks_cluster_name" {
  description = "EKS cluster name"
  value       = var.eks_enabled ? aws_eks_cluster.main[0].name : ""
}

output "eks_update_kubeconfig_command" {
  description = "Command to configure kubectl for the EKS cluster"
  value       = var.eks_enabled ? "aws eks update-kubeconfig --region ${var.aws_region} --name ${aws_eks_cluster.main[0].name}" : ""
}

output "ecr_backend_url" {
  description = "ECR repository URL for backend images"
  value       = aws_ecr_repository.backend.repository_url
}

output "ecr_frontend_url" {
  description = "ECR repository URL for frontend images"
  value       = aws_ecr_repository.frontend.repository_url
}

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}
