locals {
  config = {
    defaults = {
      site = "calendar"
      domain_name = "calendar.mostlycats.com"
    }

    dev = {
      domain_prefix = "dev."
    }
    production = {
      domain_prefix = ""
    }
  }

  environment = terraform.workspace
  deployment = merge(local.config.defaults, local.config[terraform.workspace])
  domain_name = "${local.deployment.domain_prefix}${local.deployment.domain_name}"
  bucket_name = "${local.deployment.domain_name}-${local.environment}"

  tags = {
    Namespace = local.domain_name
    Environment = local.environment
    Owner = "Terrence Curran"
    ManagedBy = "Terraform"
  }
}
