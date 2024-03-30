resource "aws_vpc" "main" {
  cidr_block = "10.10.0.0/16"
  assign_generated_ipv6_cidr_block = true
  tags = merge(local.tags, { Name = "main" })
  enable_dns_hostnames = true
  enable_dns_support = true
}
