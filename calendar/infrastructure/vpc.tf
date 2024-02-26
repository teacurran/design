resource "aws_vpc" "main" {
  cidr_block = "10.10.0.0/16"
  tags = merge(local.tags, { Name = "main" })
}
