# Cloud Infrastructure Monitor — DevOps College Project

> Secure and Scalable Deployment of a Cloud Infrastructure Monitoring Dashboard  
> using AWS ECS Fargate, Docker, Terraform, and GitHub Actions CI/CD

---

## Project Overview

A full-stack cloud infrastructure monitoring web application that tracks deployment status, service health, and resource lifecycle across AWS environments. The project demonstrates a complete, production-style DevOps pipeline — from local containerised development to a cloud-deployed application on AWS ECS Fargate.

Users can register infrastructure resources (ECS services, RDS instances, Lambda functions, etc.), track their deployment status, set criticality levels, and monitor overall environment health through a real-time dashboard.

**Tech Stack**

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Node.js + Express.js |
| Data Store | In-memory store (MongoDB Atlas ready) |
| Containerisation | Docker |
| Container Registry | AWS ECR |
| Orchestration | AWS ECS Fargate |
| Infrastructure as Code | Terraform |
| Load Balancer | AWS Application Load Balancer |
| CI/CD | GitHub Actions |
| Monitoring & Logging | AWS CloudWatch |
| Networking | AWS VPC, Subnets, Security Groups, IGW |

---

## Architecture

```
Internet
   │
   ▼
Application Load Balancer (port 80)
   │   Health check: GET /health every 30s
   ▼
ECS Fargate Task (Node.js container, port 3000)
   │  ↑
   │  └── Pulls image from AWS ECR on every deployment
   ▼
CloudWatch Logs  (/ecs/task-manager, 7-day retention)

GitHub Actions CI/CD Pipeline:
  git push → docker build → ECR push → ECS force-deploy → wait stable
```

**AWS Resources provisioned by Terraform:**
- VPC (`10.0.0.0/16`) with 2 public subnets across 2 Availability Zones
- Internet Gateway + Public Route Table
- Security Groups — ALB: port 80 open; ECS tasks: port 3000 from ALB only
- ECR Repository — image scan on push, lifecycle retains last 5 images
- IAM Execution Role — ECS task pulls from ECR, writes to CloudWatch
- ECS Cluster + Fargate Task Definition + ECS Service
- Application Load Balancer + Target Group + HTTP Listener
- CloudWatch Log Group — 7-day retention

---

## Project Structure

```
devops-project/
├── app/
│   ├── src/
│   │   ├── routes/
│   │   │   └── tasks.js          # REST API — resource CRUD endpoints
│   │   ├── middleware/
│   │   │   └── validate.js       # Input validation middleware
│   │   └── server.js             # Express entry point, health check
│   ├── public/
│   │   ├── index.html            # Monitoring dashboard UI
│   │   ├── style.css             # AWS-style responsive stylesheet
│   │   └── app.js                # Fetch API, DOM rendering, stats bar
│   ├── package.json
│   └── .env.example
├── terraform/
│   ├── provider.tf               # AWS provider, region config
│   ├── variables.tf              # Input variables with defaults
│   ├── vpc.tf                    # VPC, subnets, IGW, route table
│   ├── security_groups.tf        # ALB and ECS Fargate security groups
│   ├── ecr.tf                    # ECR repository + lifecycle policy
│   ├── iam.tf                    # ECS task execution IAM role
│   ├── ecs.tf                    # ECS cluster, task definition, service
│   ├── alb.tf                    # Load balancer, target group, listener
│   └── outputs.tf                # ALB DNS, ECR URL, cluster name
├── .github/
│   └── workflows/
│       └── deploy.yml            # GitHub Actions CI/CD pipeline
├── Dockerfile                    # Node.js 18 Alpine, non-root user, HEALTHCHECK
├── docker-compose.yml            # Local development environment
├── .dockerignore
└── README.md
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tasks` | List all monitored resources |
| `GET` | `/api/tasks/:id` | Get a single resource by ID |
| `POST` | `/api/tasks` | Register a new infrastructure resource |
| `PATCH` | `/api/tasks/:id` | Update resource or toggle deployment status |
| `DELETE` | `/api/tasks/:id` | Remove resource from monitoring |
| `GET` | `/health` | Service health check (consumed by ALB) |

**Resource object:**
```json
{
  "id": "3943c368-da16-428e-a329-e7bc1ad3d4e8",
  "title": "Deploy ECS Fargate Service",
  "subject": "ECS",
  "priority": "high",
  "dueDate": "2026-05-01",
  "completed": false,
  "createdAt": "2026-04-29T12:00:00.000Z"
}
```

**Priority levels:** `high` = Critical, `medium` = Standard, `low` = Low Impact

---

## Local Development

### Prerequisites

- [Node.js 18+](https://nodejs.org/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### Option A — Run with Node directly

```bash
cd app
npm install
npm start
```

Open **http://localhost:3000**

### Option B — Run with Docker Compose

```bash
# From project root
docker compose up --build
```

Open **http://localhost:3000**

### Test the API

```bash
# Health check
curl http://localhost:3000/health

# List all resources
curl http://localhost:3000/api/tasks

# Register a new resource
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Configure RDS Subnet Group","subject":"RDS","priority":"high","dueDate":"2026-05-10"}'

# Mark resource as deployed
curl -X PATCH http://localhost:3000/api/tasks/:id \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'

# Remove resource from monitoring
curl -X DELETE http://localhost:3000/api/tasks/:id
```

---

## AWS Deployment

### Prerequisites

- [AWS CLI v2](https://aws.amazon.com/cli/) — run `aws configure` with your IAM credentials
- [Terraform >= 1.5](https://developer.hashicorp.com/terraform/install)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### Step 1 — Provision infrastructure with Terraform

```bash
cd terraform
terraform init
terraform plan        # preview all resources to be created
terraform apply       # type 'yes' to confirm
```

Note the outputs:
```
alb_dns_name       = "task-manager-alb-xxxx.us-east-1.elb.amazonaws.com"
ecr_repository_url = "123456789.dkr.ecr.us-east-1.amazonaws.com/task-manager"
ecs_cluster_name   = "task-manager-cluster"
```

### Step 2 — Push first Docker image to ECR

```bash
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <ecr_repository_url>

docker build -t <ecr_repository_url>:latest .
docker push <ecr_repository_url>:latest
```

### Step 3 — Configure GitHub Actions secrets

`GitHub repo → Settings → Secrets and variables → Actions → New repository secret`

| Secret | Value |
|--------|-------|
| `AWS_ACCESS_KEY_ID` | Your IAM access key ID |
| `AWS_SECRET_ACCESS_KEY` | Your IAM secret access key |

### Step 4 — Trigger the CI/CD pipeline

```bash
git add .
git commit -m "feat: deploy cloud infrastructure monitor"
git push origin main
```

### Step 5 — Access the live dashboard

```
http://<alb_dns_name>
```

### Step 6 — Verify deployment

```bash
aws ecs describe-services \
  --cluster task-manager-cluster \
  --services task-manager-service \
  --query "services[0].{Status:status,Running:runningCount,Desired:desiredCount}"

curl http://<alb_dns_name>/health
# Expected: {"status":"healthy","timestamp":"..."}
```

### Destroy all resources

```bash
cd terraform && terraform destroy
```

---

## CI/CD Pipeline

```
git push to main
      │
      ▼
┌──────────────────────────────────────┐
│   GitHub Actions  (ubuntu-latest)    │
│                                      │
│  1. Checkout source code             │
│  2. Configure AWS credentials        │
│  3. Authenticate to Amazon ECR       │
│  4. docker build -t <ecr>:<sha> .    │
│  5. docker push  :sha  +  :latest    │
│  6. aws ecs update-service           │
│       --force-new-deployment         │
│  7. aws ecs wait services-stable     │
└──────────────────────────────────────┘
      │
      ▼
ECS pulls new image → zero-downtime container replacement
```

---

## Security Highlights

| Feature | Implementation |
|---------|---------------|
| Non-root container | Runs as `appuser` — limits blast radius |
| Secure HTTP headers | Helmet.js — XSS, no-sniff, frame deny |
| Network isolation | ECS tasks only reachable via ALB security group |
| Input validation | Resource name required, priority enum-checked server-side |
| XSS prevention | All user data HTML-escaped before DOM insertion |
| Image scanning | ECR scans every pushed image for CVEs |
| Secret management | AWS credentials stored only in GitHub Secrets |

---

## Terraform Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `aws_region` | `us-east-1` | AWS deployment region |
| `app_name` | `task-manager` | Prefix for all resource names |
| `container_port` | `3000` | Port the container exposes |
| `desired_count` | `1` | Running ECS task count |
| `cpu` | `256` | Fargate CPU units (256 = 0.25 vCPU) |
| `memory` | `512` | Fargate memory in MB |

---

## Estimated AWS Cost

| Resource | Approx. monthly cost |
|----------|---------------------|
| ECS Fargate (0.25 vCPU / 512 MB / 1 task) | ~$6–8 |
| Application Load Balancer | ~$16 |
| ECR storage (< 500 MB) | ~$0.05 |
| CloudWatch Logs | ~$0.50 |
| VPC / Networking | ~$0 |
| **Total** | **~$23/month** |

> Run `terraform destroy` after submission to stop all charges.

---

## Screenshots Checklist (for Report)

- [ ] Dashboard in browser — stats bar showing Total / Active / Deployed counts
- [ ] Registering a new infrastructure resource (ECS, RDS, Lambda, etc.)
- [ ] Marking a resource Deployed — status badge turns blue
- [ ] Reactivating a resource — status badge turns green
- [ ] GitHub Actions — green pipeline with all steps passing
- [ ] AWS Console — ECS cluster showing running service
- [ ] AWS Console — ECR repository with pushed images
- [ ] AWS Console — ALB in Active state, healthy target group
- [ ] AWS Console — CloudWatch log stream with container output
- [ ] Terminal — `terraform apply` output
- [ ] Terminal — `terraform output` showing ALB DNS and ECR URL

---

## Author

**Cloud Infrastructure Monitor — DevOps College Submission**  
Stack: Node.js · Docker · AWS ECS Fargate · Terraform · GitHub Actions CI/CD
