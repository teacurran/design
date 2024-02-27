resource "aws_ecr_repository" "appi" {
  name = "appi"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = local.tags
}
