# AWS Deployment Guide for Testing System

## Overview
This guide covers deploying the Testing System to AWS using containerized services.

## Architecture
- **Frontend**: React app served via nginx (containerized)
- **Backend**: Node.js/Express API (containerized)
- **Database**: AWS RDS PostgreSQL
- **Container Orchestration**: AWS ECS or EKS

## Prerequisites
1. AWS CLI configured
2. Docker installed
3. AWS account with appropriate permissions

## Deployment Options

### Option 1: AWS ECS (Recommended for simplicity)

#### 1. Create ECR Repositories
```bash
# Create repositories for both services
aws ecr create-repository --repository-name testing-system-client
aws ecr create-repository --repository-name testing-system-server
```

#### 2. Build and Push Images
```bash
# Get login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and tag client
cd client
docker build -t testing-system-client .
docker tag testing-system-client:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/testing-system-client:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/testing-system-client:latest

# Build and tag server
cd ../server
docker build -t testing-system-server .
docker tag testing-system-server:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/testing-system-server:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/testing-system-server:latest
```

#### 3. Set up RDS PostgreSQL
```bash
aws rds create-db-instance \
  --db-instance-identifier testing-system-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username postgres \
  --master-user-password <your-password> \
  --allocated-storage 20 \
  --vpc-security-group-ids <security-group-id>
```

#### 4. Create ECS Cluster
```bash
aws ecs create-cluster --cluster-name testing-system-cluster
```

#### 5. Create Task Definitions
Use the provided `ecs-task-definition.json` files for both services.

#### 6. Create Services
```bash
aws ecs create-service \
  --cluster testing-system-cluster \
  --service-name testing-system-server \
  --task-definition testing-system-server:1 \
  --desired-count 1

aws ecs create-service \
  --cluster testing-system-cluster \
  --service-name testing-system-client \
  --task-definition testing-system-client:1 \
  --desired-count 1
```

### Option 2: AWS EKS (For advanced users)

#### 1. Create EKS Cluster
```bash
eksctl create cluster --name testing-system --region us-east-1 --nodegroup-name standard-workers --node-type t3.medium --nodes 2
```

#### 2. Apply Kubernetes Manifests
Use the provided `k8s/` directory manifests.

## Environment Variables for Production

### Server Environment Variables
```
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://username:password@rds-endpoint:5432/database
JWT_SECRET=your-super-secure-jwt-secret
FRONTEND_URL=https://your-domain.com
```

### Client Build Environment Variables
```
REACT_APP_API_URL=https://api.your-domain.com
```

## Security Considerations
1. Use AWS Secrets Manager for sensitive data
2. Configure VPC with private subnets for database
3. Use Application Load Balancer with SSL/TLS
4. Enable CloudWatch logging
5. Set up proper IAM roles and policies

## Monitoring
- CloudWatch for logs and metrics
- AWS X-Ray for distributed tracing
- Health checks configured in load balancer

## Cost Optimization
- Use t3.micro instances for development
- Enable auto-scaling based on CPU/memory usage
- Use spot instances for non-critical workloads
- Set up billing alerts

## Backup Strategy
- RDS automated backups enabled
- Container images stored in ECR
- Application logs in CloudWatch

## Scaling
- Horizontal scaling via ECS service auto-scaling
- Database read replicas for read-heavy workloads
- CloudFront CDN for static assets
