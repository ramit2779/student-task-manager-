# Cloud Infrastructure Monitor

### Secure and Scalable Deployment of a Cloud Infrastructure Monitoring Dashboard using AWS ECS Fargate, Docker, Terraform, and GitHub Actions CI/CD

![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=nodedotjs&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Containerised-2496ED?logo=docker&logoColor=white)
![Terraform](https://img.shields.io/badge/Terraform-IaC-7B42BC?logo=terraform&logoColor=white)
![AWS ECS](https://img.shields.io/badge/AWS-ECS%20Fargate-FF9900?logo=amazonaws&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088FF?logo=githubactions&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

---

## Table of Contents

- [Project Overview](#project-overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Local Development](#local-development)
- [AWS Deployment](#aws-deployment)
- [CI/CD Pipeline](#cicd-pipeline)
- [Security](#security)
- [Infrastructure Variables](#infrastructure-variables)
- [Estimated AWS Cost](#estimated-aws-cost)
- [Screenshots Checklist](#screenshots-checklist)
- [Viva Q&A](#viva-qa)

---

## Project Overview

**Cloud Infrastructure Monitor** is a full-stack DevOps project that demonstrates an end-to-end cloud deployment pipeline. The application provides a real-time dashboard for registering and tracking the status of AWS infrastructure resources — such as ECS services, RDS instances, Lambda functions, and more.

The project is intentionally built to showcase the full DevOps lifecycle:

| Phase | What it demonstrates |
|-------|---------------------|
| **Develop** | Node.js REST API + responsive frontend dashboard |
| **Containerise** | Docker image with security best practices (non-root user, health check) |
| **Provision** | Terraform IaC — entire AWS stack in declarative code |
| **Deploy** | AWS ECS Fargate — serverless container orchestration |
| **Automate** | GitHub Actions CI/CD — push-to-deploy pipeline |
| **Monitor** | AWS CloudWatch — live container logs and metrics |

---

## Key Features

- **Real-time Dashboard** — Stats bar showing Total / Active / Deployed resource counts
- **Resource Registry** — Register any AWS service (ECS, RDS, Lambda, ALB, S3, etc.)
- **Deployment Status Tracking** — Toggle resources between Active and Deployed states
- **Criticality Levels** — Critical / Standard / Low Impact priority classification
- **Service Health Endpoint** — `/health` consumed by ALB for automatic health checks
- **Full CRUD REST API** — GET, POST, PATCH, DELETE for all resource operations
- **Containerised** — Runs identically on local Docker and production AWS ECS Fargate
- **Infrastructure as Code** — 100% of AWS infrastructure defined in Terraform
- **Automated CI/CD** — Every `git push` to `main` triggers a full build and deploy
- **Secure by Design** — Helmet.js, non-root container, ALB-only ECS ingress, no hardcoded secrets

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        Internet                         │
└───────────────────────────┬─────────────────────────────┘
                            │ HTTP :80
                            ▼
┌─────────────────────────────────────────────────────────┐
│          Application Load Balancer (ALB)                │
│   • Accepts port 80 from 0.0.0.0/0                      │
│   • Health check: GET /health every 30s                 │
│   • Forwards to ECS Fargate target group                │
└───────────────────────────┬─────────────────────────────┘
                            │ HTTP :3000
                            ▼
┌─────────────────────────────────────────────────────────┐
│          ECS Fargate Task  (Node.js container)          │
│   • 0.25 vCPU / 512 MB memory                          │
│   • Runs as non-root user (appuser)                     │
│   • Pulls image from ECR on every deployment            │
│   • Streams logs to CloudWatch                          │
└───────────────────────────┬─────────────────────────────┘
                            │
              ┌─────────────┴──────────────┐
              ▼                            ▼
┌─────────────────────┐      ┌─────────────────────────┐
│  AWS ECR Repository │      │  CloudWatch Log Group   │
│  (Docker images)    │      │  /ecs/task-manager      │
│  Scan on push       │      │  7-day retention        │
└─────────────────────┘      └─────────────────────────┘

GitHub Actions CI/CD:
  git push to main
       │
       ├─ docker build + push to ECR  (tagged :sha + :latest)
       ├─ aws ecs update-service --force-new-deployment
       └─ aws ecs wait services-stable
```

**VPC & Networking:**
```
VPC: 10.0.0.0/16
├── Public Subnet A (10.0.1.0/24) — AZ-1
├── Public Subnet B (10.0.2.0/24) — AZ-2
├── Internet Gateway
└── Route Table → 0.0.0.0/0 via IGW

Security Groups:
  ALB SG  → Inbound: 80/tcp  from 0.0.0.0/0
  ECS SG  → Inbound: 3000/tcp from ALB SG only
            (containers never directly exposed to internet)
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | HTML5, CSS3, Vanilla JS | Dashboard UI, real-time stats bar |
| Backend | Node.js 18 + Express.js | REST API, static file serving |
| Validation | Custom middleware | Input sanitisation on all POST/PATCH |
| Security headers | Helmet.js | XSS, clickjacking, MIME-sniff protection |
| HTTP logging | Morgan | Request logging to stdout → CloudWatch |
| Data store | In-memory (MongoDB Atlas ready) | Resource state management |
| Containerisation | Docker 18 Alpine | Portable, reproducible builds |
| Registry | AWS ECR | Private Docker image storage + CVE scanning |
| Orchestration | AWS ECS Fargate | Serverless container hosting |
| Load balancing | AWS ALB | Traffic distribution, health checks |
| Networking | AWS VPC + Subnets + IGW + SG | Isolated, secure network topology |
| IAM | AWS IAM Role | Least-privilege ECS execution permissions |
| IaC | Terraform >= 1.5 | Declarative, version-controlled AWS infra |
| CI/CD | GitHub Actions | Automated build, push, deploy pipeline |
| Monitoring | AWS CloudWatch | Container logs, 7-day retention |

---

## Project Structure

```
devops-project/
├── app/
│   ├── src/
│   │   ├── routes/
│   │   │   └── tasks.js          # CRUD API — /api/tasks endpoints
│   │   ├── middleware/
│   │   │   └── validate.js       # Request body validation
│   │   └── server.js             # Express app, static serving, /health
│   ├── public/
│   │   ├── index.html            # Dashboard — stats bar, resource form, list
│   │   ├── style.css             # AWS-style dark-navy theme, responsive
│   │   └── app.js                # Fetch calls, DOM rendering, status badges
│   ├── package.json              # express, helmet, cors, morgan, uuid
│   └── .env.example              # Environment variable reference
├── terraform/
│   ├── provider.tf               # AWS provider ~> 5.0, region variable
│   ├── variables.tf              # All configurable inputs with defaults
│   ├── vpc.tf                    # VPC, 2 public subnets, IGW, route table
│   ├── security_groups.tf        # ALB SG (port 80) + ECS SG (port 3000)
│   ├── ecr.tf                    # ECR repo, scan on push, 5-image lifecycle
│   ├── iam.tf                    # ECS task execution role + policy attachment
│   ├── ecs.tf                    # Cluster, task definition, service, CW logs
│   ├── alb.tf                    # ALB, target group (/health check), listener
│   └── outputs.tf                # alb_dns_name, ecr_repository_url, cluster
├── .github/
│   └── workflows/
│       └── deploy.yml            # CI/CD: build → ECR push → ECS deploy
├── Dockerfile                    # Node 18 Alpine, non-root user, HEALTHCHECK
├── docker-compose.yml            # Local dev: port 3000, NODE_ENV=development
├── .dockerignore                 # Excludes node_modules, .git, terraform/
└── README.md
```

---

## API Reference

**Base URL (local):** `http://localhost:3000`
**Base URL (AWS):** `http://<alb_dns_name>`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tasks` | List all monitored resources |
| `GET` | `/api/tasks/:id` | Get one resource by ID |
| `POST` | `/api/tasks` | Register a new infrastructure resource |
| `PATCH` | `/api/tasks/:id` | Update fields or toggle deployment status |
| `DELETE` | `/api/tasks/:id` | Remove resource from monitoring |
| `GET` | `/health` | Service health check (consumed by ALB) |

### Resource Schema

```json
{
  "id":        "3943c368-da16-428e-a329-e7bc1ad3d4e8",
  "title":     "Deploy ECS Fargate Service",
  "subject":   "ECS",
  "priority":  "high",
  "dueDate":   "2026-05-01",
  "completed": false,
  "createdAt": "2026-04-29T12:00:00.000Z"
}
```

| Field | Type | Values | Description |
|-------|------|--------|-------------|
| `id` | string | UUID v4 | Auto-generated unique identifier |
| `title` | string | max 200 chars | Resource or deployment name |
| `subject` | string | any | AWS service type (ECS, RDS, Lambda…) |
| `priority` | string | `high` `medium` `low` | Criticality level |
| `dueDate` | string | YYYY-MM-DD | Target deployment date |
| `completed` | boolean | `true` `false` | Deployment status flag |
| `createdAt` | string | ISO 8601 | Auto-set on creation |

### Example Requests

```bash
# Register a new infrastructure resource
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title":    "Configure RDS Multi-AZ",
    "subject":  "RDS",
    "priority": "high",
    "dueDate":  "2026-05-10"
  }'

# Mark resource as deployed
curl -X PATCH http://localhost:3000/api/tasks/<id> \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'

# Health check
curl http://localhost:3000/health
# {"status":"healthy","timestamp":"2026-04-29T10:00:00.000Z"}
```

---

## Local Development

### Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 18.x+ | [nodejs.org](https://nodejs.org/) |
| Docker Desktop | Latest | [docker.com](https://www.docker.com/products/docker-desktop/) |
| Git | Any | [git-scm.com](https://git-scm.com/) |

### Option A — Node directly (fastest)

```bash
cd app
npm install
npm start
# → Task Manager API running on port 3000
```

Open **http://localhost:3000**

### Option B — Docker Compose (closest to production)

```bash
# From project root
docker compose up --build
```

Open **http://localhost:3000**

### Verify locally

```bash
curl http://localhost:3000/health
# {"status":"healthy","timestamp":"..."}

curl http://localhost:3000/api/tasks
# {"success":true,"data":[...],"total":5}
```

---

## AWS Deployment

### Prerequisites

| Tool | Purpose |
|------|---------|
| AWS CLI v2 | Run deploy commands |
| Terraform >= 1.5 | Provision infrastructure |
| Docker Desktop | Build and push images |
| IAM user | Programmatic access (see permissions below) |

IAM user requires: `AmazonECS_FullAccess`, `AmazonEC2ContainerRegistryFullAccess`, `AmazonVPCFullAccess`, `ElasticLoadBalancingFullAccess`, `IAMFullAccess`, `CloudWatchFullAccess`.

### Step 1 — Configure AWS CLI

```bash
aws configure
# AWS Access Key ID:     <your-key>
# AWS Secret Access Key: <your-secret>
# Default region:        us-east-1
# Default output format: json
```

### Step 2 — Provision all infrastructure with Terraform

```bash
cd terraform
terraform init          # download AWS provider plugin
terraform plan          # preview ~18 resources to be created
terraform apply         # type 'yes' — takes ~3 minutes
```

Expected outputs:
```
alb_dns_name       = "task-manager-alb-123456.us-east-1.elb.amazonaws.com"
ecr_repository_url = "123456789.dkr.ecr.us-east-1.amazonaws.com/task-manager"
ecs_cluster_name   = "task-manager-cluster"
```

### Step 3 — Push the first Docker image to ECR

```bash
# Authenticate Docker to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <ecr_repository_url>

# Build and push from project root
docker build -t <ecr_repository_url>:latest .
docker push <ecr_repository_url>:latest
```

### Step 4 — Add GitHub Actions secrets

`GitHub repo → Settings → Secrets and variables → Actions → New repository secret`

| Secret | Value |
|--------|-------|
| `AWS_ACCESS_KEY_ID` | Your IAM access key ID |
| `AWS_SECRET_ACCESS_KEY` | Your IAM secret access key |

### Step 5 — Trigger CI/CD with a git push

```bash
git add .
git commit -m "feat: deploy cloud infrastructure monitor"
git push origin main
```

Watch the pipeline live: **GitHub repo → Actions tab**

### Step 6 — Open the live dashboard

```
http://<alb_dns_name>
```

### Step 7 — Verify the deployment

```bash
# Check ECS service status
aws ecs describe-services \
  --cluster task-manager-cluster \
  --services task-manager-service \
  --query "services[0].{Status:status,Running:runningCount,Desired:desiredCount}"
# { "Status": "ACTIVE", "Running": 1, "Desired": 1 }

# Confirm health through ALB
curl http://<alb_dns_name>/health
# {"status":"healthy","timestamp":"..."}
```

### Destroy all resources (avoid charges after submission)

```bash
cd terraform
terraform destroy    # type 'yes' — removes all 18 AWS resources
```

---

## CI/CD Pipeline

Every push to `main` runs the full pipeline automatically:

```
git push origin main
       │
       ▼
┌──────────────────────────────────────────────────┐
│        GitHub Actions  (ubuntu-latest)           │
│                                                  │
│  1. Checkout source code                         │
│  2. Configure AWS credentials (from Secrets)     │
│  3. Login to Amazon ECR                          │
│  4. docker build -t <ecr>:<git-sha> .            │
│  5. docker push :<git-sha>  and  :latest         │
│  6. aws ecs update-service                       │
│       --force-new-deployment                     │
│  7. aws ecs wait services-stable                 │
│       (blocks until new container is healthy)    │
│  8. Log deployed image SHA                       │
└──────────────────────────────────────────────────┘
       │
       ▼
ECS drains old task → starts new task with latest image
ALB health check passes → traffic switches over
Total pipeline duration: ~2 minutes
```

Each Docker image is tagged with the **Git commit SHA** (immutable, traceable) and **`latest`** (ECS always pulls newest).

---

## Security

| Control | Implementation | Benefit |
|---------|---------------|---------|
| Non-root container | `adduser appuser` in Dockerfile | Limits blast radius if container is compromised |
| Secure HTTP headers | Helmet.js middleware | Prevents XSS, clickjacking, MIME sniffing |
| Network isolation | ECS SG only allows traffic from ALB SG | Containers never directly reachable from internet |
| Input validation | Server-side middleware on POST/PATCH | Prevents invalid or oversized payloads |
| XSS prevention | `escapeHtml()` before DOM insertion | User data never executed as HTML |
| Image scanning | ECR `scan_on_push = true` | Detects known CVEs in base image and deps |
| Secret management | GitHub Secrets only | No credentials in source code or Docker image |
| Immutable image tags | Tagged with Git SHA | Every deployment is traceable and reproducible |

---

## Infrastructure Variables

Edit `terraform/variables.tf` to customise:

| Variable | Default | Description |
|----------|---------|-------------|
| `aws_region` | `us-east-1` | AWS deployment region |
| `app_name` | `task-manager` | Prefix used for all resource names |
| `container_port` | `3000` | Port the Node.js container listens on |
| `desired_count` | `1` | Number of running ECS Fargate tasks |
| `cpu` | `256` | Fargate CPU units — 256 = 0.25 vCPU |
| `memory` | `512` | Fargate memory in MB |

To scale horizontally: set `desired_count = 3` and run `terraform apply`. The ALB distributes traffic across all tasks automatically.

---

## Estimated AWS Cost

| Resource | Specification | Monthly cost |
|----------|--------------|-------------|
| ECS Fargate | 0.25 vCPU, 512 MB, 1 task, 24/7 | ~$7 |
| Application Load Balancer | 1 ALB, minimal LCU | ~$16 |
| ECR | < 500 MB storage | ~$0.05 |
| CloudWatch Logs | ~100 MB/month | ~$0.50 |
| VPC / Data Transfer | Public subnets, minimal egress | ~$0 |
| **Total** | | **~$23–25/month** |

> Run `terraform destroy` immediately after submission to stop all charges.

---

## Screenshots Checklist

**Application**
- [ ] Dashboard loaded — stats bar shows Total / Active / Deployed counts
- [ ] Registering a new resource (fill form → Register Resource)
- [ ] Resource card with green **Active** status badge
- [ ] Clicking "Mark Deployed" → badge turns blue **Deployed**
- [ ] Filter bar switching between All Resources / Active / Deployed

**CI/CD**
- [ ] GitHub Actions — all 7 pipeline steps green
- [ ] GitHub Actions — build logs showing docker push to ECR with SHA tag

**AWS Console**
- [ ] ECS → Clusters → `task-manager-cluster` → Service ACTIVE, Tasks: 1/1
- [ ] ECS → Task definition showing CPU, memory, port, image URI
- [ ] ECR → `task-manager` → image list with SHA and `latest` tags
- [ ] EC2 → Load Balancers → `task-manager-alb` → State: Active
- [ ] EC2 → Target Groups → `task-manager-tg` → Target health: Healthy
- [ ] CloudWatch → Log groups → `/ecs/task-manager` → recent log stream
- [ ] VPC → Your VPCs → `task-manager-vpc` with CIDR 10.0.0.0/16

**Terraform Terminal**
- [ ] `terraform plan` — showing ~18 resources to add
- [ ] `terraform apply` — "Apply complete! Resources: 18 added"
- [ ] `terraform output` — showing `alb_dns_name` and `ecr_repository_url`

---

## Viva Q&A

**Q: What problem does this project solve?**
Teams lose track of which cloud services are deployed, which are still pending, and their criticality. This dashboard centralises that information and is itself hosted on the infrastructure it monitors — demonstrating the DevOps principle of dogfooding.

**Q: Why Docker instead of running Node.js directly on a server?**
Docker packages the application and all its dependencies into a single portable image. The same image runs identically on a developer laptop, in CI, and on AWS ECS Fargate — eliminating environment inconsistencies. Rollback means pulling the previous tagged image.

**Q: What is AWS ECS Fargate and why use it over EC2?**
ECS is AWS's container orchestration service. Fargate is the serverless compute mode — you specify CPU and memory, and AWS provisions the underlying server invisibly. There are no EC2 instances to patch, scale, or manage. It is ideal for containerised workloads that need reliable hosting without infrastructure overhead.

**Q: What does Terraform do and why is it better than clicking the AWS Console?**
Terraform is Infrastructure as Code. The entire AWS setup — VPC, subnets, security groups, ECR, IAM, ECS, and ALB — is declared in `.tf` files. This means the infrastructure is version-controlled, reproducible, peer-reviewable, and destroyable with one command. Manual console clicks leave no audit trail and cannot be replicated reliably.

**Q: Walk me through what happens when you push code to GitHub.**
GitHub Actions triggers: checks out the code → configures AWS credentials from secrets → authenticates to ECR → builds the Docker image tagged with the commit SHA → pushes it to ECR → calls `aws ecs update-service --force-new-deployment` → waits for `aws ecs wait services-stable` to confirm the new container passed health checks before the pipeline completes successfully.

**Q: What is the Application Load Balancer doing?**
The ALB receives all HTTP traffic on port 80 and forwards it to healthy ECS tasks via a target group. Every 30 seconds it calls `GET /health` on each container. If a container fails 3 consecutive checks, the ALB removes it from rotation. This gives zero-downtime deployments — old tasks keep serving traffic until new ones are healthy.

**Q: How are security groups configured?**
Two security groups: the ALB SG allows port 80 inbound from the internet. The ECS SG only allows port 3000 inbound from the ALB SG. This means containers are completely unreachable from the internet directly — all traffic must pass through the load balancer.

**Q: Why does the ECS task run as a non-root user?**
If the container were compromised through a dependency vulnerability, running as root would give an attacker full control of the container filesystem. Running as `appuser` applies the principle of least privilege and limits what an attacker could do.

**Q: How would you add a real database to this project?**
Replace the in-memory array in `routes/tasks.js` with Mongoose calls to MongoDB Atlas. Add the connection string as a GitHub Secret, inject it as an ECS task environment variable in `ecs.tf`, and add `mongoose` to `package.json`. No changes are needed to Docker, Terraform, or the CI/CD pipeline.

**Q: How do you scale the application?**
Set `desired_count = 3` in `terraform/variables.tf` and run `terraform apply`. ECS starts 3 Fargate tasks and the ALB automatically distributes traffic across all of them using round-robin. No application code changes are needed because the app is stateless.

---

## License

MIT — free to use for educational and portfolio purposes.

---

*Cloud Infrastructure Monitor — DevOps College Submission*
*Stack: Node.js · Docker · AWS ECS Fargate · Terraform · GitHub Actions CI/CD*
