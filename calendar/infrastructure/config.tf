locals {
  config = {
    defaults = {
      site = "calendar"
      base_domain_name = "mostlycats.org"
      domain_name = "calendar.mostlycats.org"
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
  base_domain_name = "${local.deployment.base_domain_name}"
  domain_name = "${local.deployment.domain_prefix}${local.deployment.domain_name}"
  bucket_name = "${local.deployment.domain_name}-${local.environment}"

  tags = {
    Namespace = local.domain_name
    Environment = local.environment
    Owner = "Terrence Curran"
    ManagedBy = "Terraform"
  }
}
