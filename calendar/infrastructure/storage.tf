resource "aws_s3_bucket" "static_site" {
  bucket = local.bucket_name

  tags = local.tags
}

resource "aws_s3_bucket_acl" "static_site" {
  depends_on = [
    aws_s3_bucket_ownership_controls.static_site,
    aws_s3_bucket_public_access_block.static_site,
  ]

  bucket = aws_s3_bucket.static_site.bucket
  acl = "public-read"
}

resource "aws_s3_bucket_website_configuration" "static_site" {
  bucket = aws_s3_bucket.static_site.bucket

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "404.html"
  }
}

resource "aws_s3_bucket_public_access_block" "static_site" {
  bucket = aws_s3_bucket.static_site.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_ownership_controls" "static_site" {
  bucket = aws_s3_bucket.static_site.id
  rule {
    object_ownership = "BucketOwnerPreferred"
  }
  depends_on = [aws_s3_bucket_public_access_block.static_site]
}

resource "aws_s3_bucket_cors_configuration" "root_bucket" {
  bucket = aws_s3_bucket.static_site.bucket

  cors_rule {
    allowed_headers = ["Authorization", "Content-Length"]
    allowed_methods = ["GET", "POST"]
    allowed_origins = ["https://${local.domain_name}"]
    max_age_seconds = 3000
  }
}

data "aws_iam_policy_document" "static_site" {
  statement {
    sid = "${local.app_name}-${local.environment}-policy"
    effect = "Allow"
    actions = [
      "s3:GetObject"
    ]
    resources = [
      "arn:aws:s3:::${local.bucket_name}/*"
    ]
    principals {
      identifiers = [
        "*"
      ]
      type = "AWS"
    }
  }
}

resource "aws_s3_bucket_policy" "static_site" {
  bucket = aws_s3_bucket.static_site.id
  policy = data.aws_iam_policy_document.static_site.json
}

