data "aws_route53_zone" "mostlycats" {
  name = "mostlycats.org"
}

resource "aws_route53_record" "calendar" {
  zone_id = data.aws_route53_zone.mostlycats.zone_id
  name    = local.domain_name
  type    = "A"
  alias {
    name                   = aws_cloudfront_distribution.calendar.domain_name
    zone_id                = aws_cloudfront_distribution.calendar.hosted_zone_id
    evaluate_target_health = false
  }
  allow_overwrite = true
}
