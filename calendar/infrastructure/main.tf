terraform {
  required_version = "~> 1.5.7"

  required_providers {
    aws = {
      version = "~> 5.30.0"
      source  = "hashicorp/aws"
    }
  }

  backend "s3" {
    bucket = "appi-infrastructure-terraform-state"
    key    = "calendar.tfstate"
    region = "us-east-1"
  }
}
provider "aws" {
  region = "us-east-1"
}

provider "aws" {
  alias  = "acm_provider"
  region = "us-east-1"
}


