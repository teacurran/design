# Create subnets in two different availability zones

resource "aws_subnet" "subnet1" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(aws_vpc.main.cidr_block, 8, 1)
  ipv6_cidr_block         = cidrsubnet(aws_vpc.main.ipv6_cidr_block, 8, 1)
  map_public_ip_on_launch = true
  availability_zone       = "us-east-1a"
  assign_ipv6_address_on_creation = true
  private_dns_hostname_type_on_launch = "resource-name"
  tags = merge(local.tags, {
    Name = "public-subnet-1"
  })
}

resource "aws_subnet" "subnet2" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(aws_vpc.main.cidr_block, 8, 2)
  ipv6_cidr_block         = cidrsubnet(aws_vpc.main.ipv6_cidr_block, 8, 2)
  map_public_ip_on_launch = true
  availability_zone       = "us-east-1b"
  assign_ipv6_address_on_creation = true
  private_dns_hostname_type_on_launch = "resource-name"
  tags = merge(local.tags, {
    Name = "public-subnet-2"
  })
}

resource "aws_internet_gateway" "internet_gateway" {
  vpc_id = aws_vpc.main.id
  tags   = merge(local.tags, {
      Name = "internet_gateway"
    }
  )
}

resource "aws_route_table" "route_table" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.internet_gateway.id
  }
  tags   = merge(local.tags, {
      Name = "public-egress"
    }
  )
}

resource "aws_route_table_association" "subnet_route" {
  subnet_id      = aws_subnet.subnet1.id
  route_table_id = aws_route_table.route_table.id
}

resource "aws_route_table_association" "subnet2_route" {
  subnet_id      = aws_subnet.subnet2.id
  route_table_id = aws_route_table.route_table.id
}

resource "aws_subnet" "private-subnet-1" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(aws_vpc.main.cidr_block, 8, 3)
  ipv6_cidr_block         = cidrsubnet(aws_vpc.main.ipv6_cidr_block, 8, 10)
  map_public_ip_on_launch = true
  availability_zone       = "us-east-1a"
  assign_ipv6_address_on_creation = true
  private_dns_hostname_type_on_launch = "resource-name"
  tags = merge(local.tags, {
    Name = "private-subnet-1"
  })
}

resource "aws_subnet" "private-subnet-2" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(aws_vpc.main.cidr_block, 8, 4)
  ipv6_cidr_block         = cidrsubnet(aws_vpc.main.ipv6_cidr_block, 8, 11)
  map_public_ip_on_launch = true
  availability_zone       = "us-east-1b"
  assign_ipv6_address_on_creation = true
  private_dns_hostname_type_on_launch = "resource-name"
  tags = merge(local.tags, {
    Name = "private-subnet-2"
  })
}

resource "aws_eip" "public" {
  domain = "vpc"

  tags = merge(local.tags, {
    "Name" = "eip-public-${local.environment}"
  })
}

resource "aws_nat_gateway" "nat_gateway" {
  allocation_id = aws_eip.public.id
  subnet_id     = aws_subnet.subnet1.id
  tags = merge(local.tags, {
    Name = "nat_gateway"
  })
}

resource "aws_route_table" "private_subnets" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat_gateway.id
  }
  tags   = merge(local.tags, {
      Name = "private-subnets"
    }
  )
}

resource "aws_route_table_association" "private_subnet1" {
  subnet_id      = aws_subnet.private-subnet-1.id
  route_table_id = aws_route_table.private_subnets.id
}

resource "aws_route_table_association" "private_subnet2" {
  subnet_id      = aws_subnet.private-subnet-2.id
  route_table_id = aws_route_table.private_subnets.id
}
