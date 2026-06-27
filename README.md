# RecruitFlow AI

**AI-Powered Applicant Tracking System & Candidate CRM**

A modern SaaS application for small recruitment agencies, solo recruiters, and HR freelancers. Built with React, Node.js, MongoDB, and OpenAI.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, TanStack Query |
| Backend | Node.js, Express, TypeScript, Mongoose |
| Database | MongoDB |
| AI | OpenAI GPT-4o-mini |
| Auth | JWT + Refresh Tokens |
| Containerization | Docker, docker-compose |
| Orchestration | Kubernetes (manifests included) |
| CI/CD | Jenkins |

---

## Project Structure

```
recruitflow-ai/
├── frontend/           # React SPA
│   ├── src/
│   │   ├── api/        # API client functions
│   │   ├── components/ # UI and layout components
│   │   ├── features/   # Feature-specific components
│   │   ├── pages/      # Route pages
│   │   ├── routes/     # Route configuration
│   │   ├── store/      # Auth context
│   │   └── types/      # TypeScript interfaces
│   ├── Dockerfile
│   └── nginx.conf
├── backend/            # Express API server
│   ├── src/
│   │   ├── config/     # App config, database, seed
│   │   ├── modules/    # Feature modules (MVC pattern)
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── organizations/
│   │   │   ├── dashboard/
│   │   │   ├── jobs/
│   │   │   ├── candidates/
│   │   │   ├── resumes/
│   │   │   ├── applications/
│   │   │   ├── notes/
│   │   │   ├── tags/
│   │   │   └── ai/
│   │   ├── middleware/ # Auth, validation, error handling
│   │   ├── lib/        # Utilities
│   │   └── types/      # TypeScript declarations
│   ├── uploads/        # Resume file storage (local dev)
│   ├── Dockerfile
│   └── .env.example
├── infra/
│   └── k8s/            # Kubernetes manifests
├── docker-compose.yml  # Local development setup
├── Jenkinsfile         # CI/CD pipeline
└── README.md
```

---

## Local Development Setup

### Prerequisites

- Node.js 20+
- npm
- MongoDB 7+ (or Docker)
- OpenAI API key (optional — mock mode works without it)

### 1. Clone and Install

```bash
git clone <repo-url> recruitflow-ai
cd recruitflow-ai

# Install backend dependencies
cd backend
cp .env.example .env
npm install

# Install frontend dependencies
cd ../frontend
cp .env.example .env
npm install
```

### 2. Configure Environment

**Backend** (`backend/.env`):
```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/recruitflow
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
CORS_ORIGIN=http://localhost:5173
OPENAI_API_KEY=sk-your-openai-api-key
UPLOAD_DIR=../uploads
```

**Frontend** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:5000
```

### 3. Start Development Servers

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```
Server starts at http://localhost:5000.

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```
App opens at http://localhost:5173.

### 4. Seed Demo Data

```bash
cd backend
npm run seed
```

This creates an organization, 2 users, 5 jobs, 8 candidates, 11 applications, and AI analyses.

**Demo credentials:**
- Email: `john@techrecruit.com` / Password: `password123`
- Email: `sarah@techrecruit.com` / Password: `password123`

---

## Docker Setup

### Build and Run with docker-compose

```bash
# From project root
docker-compose up --build
```

This starts:
- **MongoDB** on port 27017
- **Backend** on port 5000 (with auto-restart)
- **Frontend** on port 5173 (served via Nginx)

### Run Seed in Docker

```bash
docker exec -it recruitflow-backend npm run seed
```

### Services

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000 |
| MongoDB | mongodb://localhost:27017 |

---

## API Overview

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user + org |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Current user info |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/summary` | Dashboard metrics |

### Jobs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/jobs` | List jobs (paginated, filterable) |
| POST | `/api/jobs` | Create job |
| GET | `/api/jobs/:id` | Get job detail |
| PUT | `/api/jobs/:id` | Update job |
| DELETE | `/api/jobs/:id` | Delete job |

### Candidates
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/candidates` | List candidates |
| POST | `/api/candidates` | Create candidate |
| GET | `/api/candidates/:id` | Get candidate detail |
| PUT | `/api/candidates/:id` | Update candidate |
| DELETE | `/api/candidates/:id` | Delete candidate |

### Resumes
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/resumes/upload` | Upload and parse resume |
| GET | `/api/resumes/:id` | Get resume info |

### Applications
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/applications` | Link candidate to job |
| PUT | `/api/applications/:id/stage` | Update hiring stage |
| GET | `/api/applications/job/:jobId` | Candidates for a job |
| GET | `/api/applications/candidate/:candidateId` | Jobs for a candidate |

### Notes & Tags
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/notes/candidate/:id` | List/add notes |
| PUT/DELETE | `/api/notes/:id` | Edit/delete note |
| GET/POST | `/api/tags` | List/create tags |
| POST/DELETE | `/api/tags/candidate/:id/tagId` | Add/remove tag |

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/candidate-match` | Analyze candidate-job match |
| GET | `/api/ai/candidate/:candidateId` | Get candidate analyses |
| GET | `/api/ai/job/:jobId` | Get job analyses |
| POST | `/api/ai/interview-questions` | Generate interview questions |
| POST | `/api/ai/recruiter-summary` | Generate recruiter summary |

All endpoints (except auth) require `Authorization: Bearer <token>` header.

---

## CI/CD — Jenkins Pipeline

The `Jenkinsfile` at the project root implements:

1. **Checkout** — Clone repository
2. **Install** — npm ci for frontend and backend
3. **Lint & Typecheck** — TypeScript compilation checks
4. **Build** — Compile both applications
5. **Test** — Run test suites
6. **Docker Build** — Build container images
7. **Push** — Push to registry (main branch only)
8. **Deploy** — Apply Kubernetes manifests (main branch only)

### Pipeline Variables

Configure these in Jenkins:
- `DOCKER_REGISTRY` — Your container registry URL
- `K8S_NAMESPACE` — Kubernetes namespace (default: `recruitflow`)

### Required Jenkins Plugins
- Pipeline
- Docker Pipeline
- Kubernetes CLI
- Git

---

## Kubernetes Deployment

### Prerequisites
- Kubernetes cluster (EKS, AKS, GKE, or local)
- kubectl configured
- Container registry access

### Manifests Location

`infra/k8s/` contains:

| File | Description |
|------|-------------|
| `backend-deployment.yaml` | Backend deployment (2 replicas) |
| `backend-service.yaml` | Backend ClusterIP service |
| `frontend-deployment.yaml` | Frontend deployment (2 replicas) |
| `frontend-service.yaml` | Frontend ClusterIP service |
| `ingress.yaml` | Nginx ingress with routing rules |
| `configmap.yaml` | Non-sensitive configuration |
| `secret.yaml` | Secret template (JWT, API keys) |

### Deploy Manually

```bash
# Create namespace
kubectl create namespace recruitflow

# Apply manifests
kubectl apply -f infra/k8s/configmap.yaml -n recruitflow
kubectl apply -f infra/k8s/secret.yaml -n recruitflow
kubectl apply -f infra/k8s/backend-deployment.yaml -n recruitflow
kubectl apply -f infra/k8s/backend-service.yaml -n recruitflow
kubectl apply -f infra/k8s/frontend-deployment.yaml -n recruitflow
kubectl apply -f infra/k8s/frontend-service.yaml -n recruitflow
kubectl apply -f infra/k8s/ingress.yaml -n recruitflow
```

### Update Image Tags

Update the image field in `backend-deployment.yaml` and `frontend-deployment.yaml` before deploying:

```yaml
image: your-registry/recruitflow-backend:v1.0.0
```

Or use Jenkins to auto-replace the `BACKEND_IMAGE_PLACEHOLDER` and `FRONTEND_IMAGE_PLACEHOLDER` values.

---

## Suggested AWS Deployment Architecture

```
                         ┌──────────────┐
                         │   Route 53   │
                         └──────┬───────┘
                                │
                         ┌──────▼───────┐
                         │  ALB / Ingress│
                         └──────┬───────┘
                                │
               ┌────────────────┼────────────────┐
               │                │                 │
        ┌──────▼──────┐  ┌─────▼──────┐   ┌──────▼──────┐
        │  Frontend   │  │  Backend   │   │  Jenkins    │
        │  Pods (EKS) │  │  Pods (EKS)│   │  (EC2/EKS)  │
        └─────────────┘  └─────┬──────┘   └─────────────┘
                               │
                    ┌──────────▼──────────┐
                    │  MongoDB Atlas      │
                    │  (Managed)          │
                    └─────────────────────┘
```

### Recommended AWS Services

| Component | AWS Service | Notes |
|-----------|-------------|-------|
| Compute | Amazon EKS (Kubernetes) | Managed Kubernetes control plane |
| OR | EC2 + Docker Swarm | Simpler but less scalable |
| Database | MongoDB Atlas | Fully managed, auto-scaling |
| OR | Amazon DocumentDB | MongoDB-compatible managed service |
| File Storage | Amazon S3 | For resume files (swap the upload service) |
| CI/CD | Jenkins on EC2 or EKS | Pipeline as defined in Jenkinsfile |
| Container Registry | Amazon ECR | Store Docker images |
| Secrets | AWS Secrets Manager | JWT keys, API keys, DB credentials |
| DNS | Route 53 | Domain management |
| CDN | CloudFront | Frontend static asset delivery |
| Monitoring | CloudWatch | Logs, metrics, alerts |

### Production Checklist

- [ ] Set strong `JWT_SECRET` in Secrets Manager
- [ ] Set `OPENAI_API_KEY` in Secrets Manager
- [ ] Configure `CORS_ORIGIN` to the production domain
- [ ] Set up MongoDB Atlas cluster (at least M10 for production)
- [ ] Configure S3 for resume file storage
- [ ] Set up S3 lifecycle policies for temp files
- [ ] Enable MongoDB backups
- [ ] Set up CloudWatch alarms
- [ ] Configure autoscaling for EKS node groups
- [ ] Set up SSL/TLS certificates via ACM
- [ ] Enable rate limiting on auth endpoints
- [ ] Configure WAF rules for API protection
- [ ] Set up VPC with private subnets for databases

---

## Future Enhancements

### Short-term
- [ ] **Stripe Billing** — Subscribe to plans (Free, Pro, Enterprise)
- [ ] **Team Seats** — Invite team members, role-based permissions
- [ ] **Email Notifications** — Stage changes, interview reminders
- [ ] **S3 File Storage** — Replace local disk with AWS S3
- [ ] **Audit Logs** — Track all user actions for compliance

### Medium-term
- [ ] **Advanced RBAC** — Granular permissions per module
- [ ] **Activity Timeline** — Visual history of candidate interactions
- [ ] **Email Integration** — Send/receive emails within the platform
- [ ] **Calendar Sync** — Google/Outlook calendar interview scheduling
- [ ] **Advanced Analytics** — Time-to-hire, source effectiveness, conversion funnels
- [ ] **Bulk Operations** — Bulk resume upload, bulk stage updates

### Long-term
- [ ] **Multi-language Support** — i18n for international teams
- [ ] **Webhooks** — Integrate with external HR tools
- [ ] **Mobile App** — React Native companion app
- [ ] **Custom Workflows** — Configurable hiring pipelines
- [ ] **AI-Powered Ranking** — Auto-rank candidates for new jobs
- [ ] **Resume Database Search** — Semantic search across all parsed resumes
- [ ] **Chrome Extension** — One-click candidate import from LinkedIn

---

## Architecture Decisions

### Resume Parsing Strategy
The current implementation uses regex-based parsing for MVP speed. For production, consider:
- **OpenAI Parsing** — Use GPT to extract structured data from resume text (more accurate)
- **Specialized Parser** — Affinda, Sovren, or RChilli for enterprise-grade parsing
- **Hybrid** — Regex for quick fields, GPT for complex extraction

### AI Analysis
The AI module uses OpenAI's GPT-4o-mini with structured JSON prompts. The system falls back to mock data when no API key is configured, making development possible offline.

### Multi-tenancy
Data is scoped by `organizationId` on every query. Every model includes this field, and the auth middleware ensures users only access their organization's data — ready for multi-tenant SaaS scaling.

---

## License

MIT
