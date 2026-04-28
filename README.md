# Student Task Manager — DevOps College Project

> Secure and Scalable Deployment of a Student Task Management Web App  
> using AWS ECS Fargate, Docker, Terraform, and GitHub Actions CI/CD

---

## Project Overview

A full-stack web application that allows students to manage their academic tasks. The project demonstrates a complete DevOps pipeline — from local development to a cloud-deployed, containerised application on AWS.

**Tech Stack**

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Node.js + Express.js |
| Database | In-memory store (MongoDB Atlas ready) |
| Containerisation | Docker |
| Container Registry | AWS ECR |
| Orchestration | AWS ECS Fargate |
| Infrastructure as Code | Terraform |
| Load Balancer | AWS Application Load Balancer |
| CI/CD | GitHub Actions |
| Monitoring | AWS CloudWatch |
| Networking | AWS VPC, Subnets, Security Groups |

---

## Architecture

```
Internet
   │
   ▼
Application Load Balancer (port 80)
   │
   ▼
ECS Fargate Task (Node.js container, port 3000)
   │  ↑
   │  └── Pulls image from AWS ECR
   ▼
CloudWatch Logs (/ecs/task-manager)

GitHub Actions CI/CD:
  push to main → docker build → push to ECR → force ECS deploy → wait stable
```

**AWS Resources provisioned by Terraform:**
- VPC (`10.0.0.0/16`) with 2 public subnets across 2 Availability Zones
- Internet Gateway + Route Table
- Security Groups (ALB: port 80 open; ECS: port 3000 from ALB only)
- ECR Repository (image scan on push, lifecycle keeps last 5 images)
- IAM Role for ECS task execution (ECR pull + CloudWatch write)
- ECS Cluster + Fargate Task Definition + ECS Service
- Application Load Balancer + Target Group + HTTP Listener
- CloudWatch Log Group (7-day retention)

---

## Project Structure

```
devops-project/
├── app/
│   ├── src/
│   │   ├── routes/
│   │   │   └── tasks.js          # CRUD API routes
│   │   ├── middleware/
│   │   │   └── validate.js       # Input validation middleware
│   │   └── server.js             # Express entry point
│   ├── public/
│   │   ├── index.html            # Frontend UI
│   │   ├── style.css             # Responsive styles
│   │   └── app.js                # Fetch API + DOM rendering
│   ├── package.json
│   └── .env.example
├── terraform/
│   ├── provider.tf               # AWS provider configuration
│   ├── variables.tf              # Input variables with defaults
│   ├── vpc.tf                    # VPC, subnets, IGW, route table
│   ├── security_groups.tf        # ALB and ECS security groups
│   ├── ecr.tf                    # ECR repository + lifecycle policy
│   ├── iam.tf                    # ECS task execution IAM role
│   ├── ecs.tf                    # ECS cluster, task definition, service
│   ├── alb.tf                    # Load balancer, target group, listener
│   └── outputs.tf                # ALB DNS, ECR URL, cluster name
├── .github/
│   └── workflows/
│       └── deploy.yml            # GitHub Actions CI/CD pipeline
├── Dockerfile                    # Node.js 18 Alpine image, non-root user
├── docker-compose.yml            # Local development setup
├── .dockerignore
└── README.md
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tasks` | Get all tasks |
| `GET` | `/api/tasks/:id` | Get a single task by ID |
| `POST` | `/api/tasks` | Create a new task |
| `PATCH` | `/api/tasks/:id` | Update fields or toggle complete |
| `DELETE` | `/api/tasks/:id` | Delete a task |
| `GET` | `/health` | Health check endpoint (used by ALB) |

**Task object:**
```json
{
  "id": "3943c368-da16-428e-a329-e7bc1ad3d4e8",
  "title": "Complete DevOps Assignment",
  "subject": "Cloud Computing",
  "priority": "high",
  "dueDate": "2025-05-01",
  "completed": false,
  "createdAt": "2025-04-28T12:00:00.000Z"
}
```

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

# Get all tasks
curl http://localhost:3000/api/tasks

# Add a task
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Study Terraform","subject":"DevOps","priority":"high","dueDate":"2025-05-01"}'

# Toggle complete (replace :id with actual UUID)
curl -X PATCH http://localhost:3000/api/tasks/:id \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'

# Delete a task
curl -X DELETE http://localhost:3000/api/tasks/:id
```

---

## AWS Deployment

### Prerequisites

- [AWS CLI v2](https://aws.amazon.com/cli/) — run `aws configure` with your IAM credentials
- [Terraform >= 1.5](https://developer.hashicorp.com/terraform/install)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### Step 1 — Provision infrastructure

```bash
cd terraform
terraform init
terraform plan        # preview what will be created
terraform apply       # type 'yes' to confirm
```

Save the printed outputs:
```
alb_dns_name       = "task-manager-alb-xxxx.us-east-1.elb.amazonaws.com"
ecr_repository_url = "123456789.dkr.ecr.us-east-1.amazonaws.com/task-manager"
ecs_cluster_name   = "task-manager-cluster"
```

### Step 2 — Push first Docker image

```bash
# Authenticate to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <ecr_repository_url>

# Build and push from project root
docker build -t <ecr_repository_url>:latest .
docker push <ecr_repository_url>:latest
```

### Step 3 — Add GitHub Secrets

`GitHub repo → Settings → Secrets and variables → Actions → New repository secret`

| Secret | Value |
|--------|-------|
| `AWS_ACCESS_KEY_ID` | Your IAM access key ID |
| `AWS_SECRET_ACCESS_KEY` | Your IAM secret access key |

### Step 4 — Deploy via CI/CD

```bash
git add .
git commit -m "feat: initial deployment"
git push origin main
```

GitHub Actions will build → push to ECR → deploy to ECS automatically.

### Step 5 — Access the live application

```
http://<alb_dns_name>
```

### Step 6 — Verify

```bash
# Check ECS service health
aws ecs describe-services \
  --cluster task-manager-cluster \
  --services task-manager-service \
  --query "services[0].{Status:status,Running:runningCount,Desired:desiredCount}"

# Test health endpoint
curl http://<alb_dns_name>/health
# Expected: {"status":"healthy","timestamp":"..."}
```

### Destroy resources (avoid ongoing charges)

```bash
cd terraform
terraform destroy
```

---

## CI/CD Pipeline

```
Push to main branch
        │
        ▼
┌──────────────────────────────────────┐
│   GitHub Actions  (ubuntu-latest)    │
│                                      │
│  1. Checkout code                    │
│  2. Configure AWS credentials        │
│  3. Login to Amazon ECR              │
│  4. docker build -t <ecr>:<sha> .    │
│  5. docker push :sha + :latest       │
│  6. aws ecs update-service           │
│       --force-new-deployment         │
│  7. aws ecs wait services-stable     │
└──────────────────────────────────────┘
        │
        ▼
ECS pulls new image → replaces container
```

---

## Security Highlights

| Feature | Implementation |
|---------|---------------|
| Non-root container | Docker runs as `appuser`, not root |
| Secure HTTP headers | Helmet.js middleware |
| Network isolation | ECS tasks only reachable via ALB (Security Group rule) |
| Input validation | Title required, priority enum-checked before processing |
| XSS prevention | All user data HTML-escaped before DOM insertion |
| Image vulnerability scanning | ECR scan on every push |
| No hardcoded secrets | AWS credentials stored in GitHub Secrets only |

---

## Terraform Variables

Customise in `terraform/variables.tf`:

| Variable | Default | Description |
|----------|---------|-------------|
| `aws_region` | `us-east-1` | AWS deployment region |
| `app_name` | `task-manager` | Prefix for all resource names |
| `container_port` | `3000` | Port the container exposes |
| `desired_count` | `1` | Number of running ECS tasks |
| `cpu` | `256` | Fargate CPU units (256 = 0.25 vCPU) |
| `memory` | `512` | Fargate memory in MB |

To scale horizontally, set `desired_count = 3` and re-run `terraform apply`.

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

> Run `terraform destroy` after project submission to stop all charges.

---

## Screenshots Checklist (for Report)

- [ ] App running in browser with tasks visible
- [ ] Adding a new task — appears in list
- [ ] Marking a task Done — strikethrough style
- [ ] GitHub Actions — green pipeline run
- [ ] AWS Console — ECS cluster showing running service
- [ ] AWS Console — ECR repository with pushed image
- [ ] AWS Console — ALB showing Active state
- [ ] AWS Console — CloudWatch log stream with container logs
- [ ] Terminal — `terraform apply` output
- [ ] Terminal — `terraform output` showing ALB DNS and ECR URL

---

## Author

**College DevOps Submission**  
Stack: Node.js · Docker · AWS ECS Fargate · Terraform · GitHub Actions
#   s t u d e n t - t a s k - m a n a g e r -  
 