terraform {
  required_version = "~> 1.6.2"

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



