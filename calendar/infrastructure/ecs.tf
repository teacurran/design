resource "aws_ecs_cluster" "calendar" {
  name = replace(local.domain_name, ".", "-")
}
