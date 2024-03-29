resource "aws_lb" "calendar" {
  name               = replace(local.domain_name, ".", "-")
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.load_balancer.id]
  subnets            = [aws_subnet.subnet1.id, aws_subnet.subnet2.id]

  enable_deletion_protection = true

  access_logs {
    enabled = true
    bucket = "aws-observability-logs-1ea61370"
    prefix = "elasticloadbalancing"
  }

  tags = {
    Environment = "production"
  }
}

resource "aws_lb_target_group" "calendar" {
  name     = "calendar"
  port     = 3000
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id
  target_type = "ip"

  health_check {
    enabled             = true
    interval            = 30
    path                = "/"
    timeout             = 3
    healthy_threshold   = 3
    unhealthy_threshold = 3
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.calendar.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "redirect"
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.calendar.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = data.aws_acm_certificate.mostly_cats.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.calendar.arn
  }
}
