output "alb_dns_name" {
  description = "Public DNS of the Application Load Balancer — paste this in your browser"
  value       = aws_alb.main.dns_name
}

output "ecr_repository_url" {
  description = "ECR repository URL — used in docker push and ECS task definition"
  value       = aws_ecr_repository.app.repository_url
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}
