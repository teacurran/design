variable "db_username" {
  description = "The username for the main user of the database."
  type        = string
}

variable "db_password" {
  description = "The password for the main user of the database."
  type        = string
}

resource "aws_db_subnet_group" "appi" {
  name       = "appi-subnet-group"
  subnet_ids = [aws_subnet.private-subnet-1.id, aws_subnet.private-subnet-2.id]
}

# postgresql aurora instance
resource "aws_rds_cluster" "appi" {
  cluster_identifier        = "appi-cluster"
  engine                    = "aurora-postgresql"
  engine_version            = "14.6"
  database_name             = "appi"
  master_username           = var.db_username
  master_password           = var.db_password
  port                      = 5432
  db_subnet_group_name      = aws_db_subnet_group.appi.name
  vpc_security_group_ids    = [aws_security_group.rds.id]
  network_type              = "IPV4"
}

resource "aws_rds_cluster_instance" "appi_instance" {
  count                   = 1
  identifier              = "appi-cluster-instance-${count.index}"
  cluster_identifier      = aws_rds_cluster.appi.id
  instance_class          = "db.t4g.medium"
  engine                  = "aurora-postgresql"
  engine_version          = "14.6"
  publicly_accessible     = true
  db_subnet_group_name    = aws_db_subnet_group.appi.name
  performance_insights_enabled = true
  performance_insights_retention_period = 7
}
