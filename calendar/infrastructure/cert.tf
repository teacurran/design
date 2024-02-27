data "aws_acm_certificate" "mostly_cats" {
  domain = local.base_domain_name
  tags = local.tags
}
