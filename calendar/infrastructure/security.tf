resource "aws_security_group" "all_traffic" {
  name   = "all-traffic"
  vpc_id = aws_vpc.main.id

  ingress {
    ipv6_cidr_blocks = ["2600:6c64:477f:4000::/64"]
    from_port   = 0
    to_port     = 0
    protocol    = -1
    description = "maple vortex ipv6"
  }

  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = -1
    cidr_blocks = ["174.83.69.28/32"]
    description = "maple vortex ipv4"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    self = false
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = []
    ipv6_cidr_blocks = ["::/0"]
    self = false
  }
}


resource "aws_security_group" "all_web_traffic" {
  name   = "web-traffic"
  vpc_id = aws_vpc.main.id

  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = -1
    self        = "false"
    cidr_blocks = ["0.0.0.0/0"]
    description = "any"
  }

  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = -1
    self        = "false"
    ipv6_cidr_blocks = ["::/0"]
    description = ""
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    self = false
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = []
    ipv6_cidr_blocks = ["::/0"]
    self = false
  }
}

resource "aws_security_group" "web_traffic" {
  name   = "ecs-web-traffic"
  vpc_id = aws_vpc.main.id

  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow inbound HTTP traffic from anywhere"
  }

  # todo, only allow traffic from LB
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = []
    ipv6_cidr_blocks = ["::/0"]
    self = false
  }

  tags   = merge(local.tags, {
    Name = "ecs-web-traffic"
  })
}

resource "aws_security_group" "load_balancer" {
  name   = "load_balancer"
  vpc_id = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow inbound HTTP traffic from anywhere"
  }

  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = -1
    self        = "false"
    ipv6_cidr_blocks = ["::/0"]
    description = ""
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow inbound HTTPS traffic from anywhere"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = []
    ipv6_cidr_blocks = ["::/0"]
    self = false
  }

}

resource "aws_security_group" "rds" {
  name   = "rds-database-access"
  vpc_id = aws_vpc.main.id

  # allow postgresql traffic from within the VPC
  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.main.cidr_block]
  }

  ingress {
    ipv6_cidr_blocks = ["2600:6c64:477f:4000::/64"]
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    description = "Allow inbound PostgreSQL traffic from maple-vortex"
  }

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["174.83.69.28/32"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = []
    ipv6_cidr_blocks = ["::/0"]
    self = false
  }

}
