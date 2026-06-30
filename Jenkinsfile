pipeline {
    agent any

    tools {
        jdk 'jdk21'
        nodejs 'node20'
    }

    environment {
        AWS_REGION = 'ap-southeast-2'
        APP_NAME = 'recruitflow'
        ENVIRONMENT_NAME = 'production'
        EKS_CLUSTER_NAME = 'recruitflow-production-eks'
        BACKEND_REPO = 'recruitflow-production-backend'
        FRONTEND_REPO = 'recruitflow-production-frontend'
        SCANNER_HOME = tool 'sonar-scanner'
    }

    stages {
        stage('Clean Workspace') {
            steps {
                cleanWs()
            }
        }

        stage('Checkout Code') {
            steps {
                git branch: 'main',
                    credentialsId: 'github-token',
                    url: 'https://github.com/lekymAnisem/recruitflow-ai.git'
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh '''
                        $SCANNER_HOME/bin/sonar-scanner \
                          -Dsonar.projectKey=recruitflow-ai \
                          -Dsonar.projectName=recruitflow-ai
                    '''
                }
            }
        }

        stage('Quality Gate') {
            steps {
                script {
                    waitForQualityGate abortPipeline: false, credentialsId: 'SonarQube'
                }
            }
        }

        stage('Install Dependencies') {
            parallel {
                stage('Backend') {
                    steps {
                        dir('backend') {
                            sh 'npm install'
                        }
                    }
                }

                stage('Frontend') {
                    steps {
                        dir('frontend') {
                            sh 'npm install'
                        }
                    }
                }
            }
        }

        stage('TypeScript Check') {
            parallel {
                stage('Backend') {
                    steps {
                        dir('backend') {
                            sh 'npm run typecheck'
                        }
                    }
                }
                stage('Frontend') {
                    steps {
                        dir('frontend') {
                            sh 'npx tsc -b --noEmit'
                        }
                    }
                }
            }
        }

        stage('Run Tests') {
            steps {
                dir('backend') {
                    sh 'npm test'
                }
            }
        }

        stage('Trivy FS Scan') {
            steps {
                sh 'trivy fs . --format table > trivy-fs.txt || true'
            }
        }

        stage('Build & Push Images to ECR') {
            steps {
                sh '''
                    set -e

                    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
                    ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
                    BACKEND_IMAGE="${ECR_REGISTRY}/${BACKEND_REPO}:${BUILD_NUMBER}"
                    FRONTEND_IMAGE="${ECR_REGISTRY}/${FRONTEND_REPO}:${BUILD_NUMBER}"

                    aws ecr get-login-password --region "${AWS_REGION}" | docker login --username AWS --password-stdin "${ECR_REGISTRY}"

                    docker build -t "${BACKEND_IMAGE}" -t "${ECR_REGISTRY}/${BACKEND_REPO}:latest" backend
                    docker build -t "${FRONTEND_IMAGE}" -t "${ECR_REGISTRY}/${FRONTEND_REPO}:latest" --build-arg VITE_API_URL=/api frontend

                    docker push "${BACKEND_IMAGE}"
                    docker push "${ECR_REGISTRY}/${BACKEND_REPO}:latest"
                    docker push "${FRONTEND_IMAGE}"
                    docker push "${ECR_REGISTRY}/${FRONTEND_REPO}:latest"

                    printf 'BACKEND_IMAGE=%s\\nFRONTEND_IMAGE=%s\\n' "${BACKEND_IMAGE}" "${FRONTEND_IMAGE}" > image.env
                '''
            }
        }

        stage('Trivy Image Scan') {
            steps {
                sh '''
                    set -e
                    . ./image.env
                    trivy image "${BACKEND_IMAGE}" > trivy-backend.txt || true
                    trivy image "${FRONTEND_IMAGE}" > trivy-frontend.txt || true
                '''
            }
        }

        stage('Local Docker Run') {
            steps {
                sh """
                    set -e
                    . "${WORKSPACE}/image.env"

                    echo "--- Creating Docker network ---"
                    docker network inspect recruitflow-net >/dev/null 2>&1 || docker network create recruitflow-net

                    echo "--- Stopping old containers ---"
                    docker rm -f mongo recruitflow-backend backend recruitflow-frontend 2>/dev/null || true

                    echo "--- Starting MongoDB ---"
                    docker run -d --name mongo --network recruitflow-net -p 27017:27017 mongo:7

                    MONGO_URI="mongodb://mongo:27017/recruitflow"
                    JWT_SECRET="local-dev-jwt-secret"
                    AWS_S3_BUCKET_NAME=""

                    echo "--- Starting backend ---"
                    docker run -d --name recruitflow-backend --network recruitflow-net -p 5000:5000 \\
                        -e NODE_ENV=production \\
                        -e PORT=5000 \\
                        -e MONGO_URI="\${MONGO_URI}" \\
                        -e JWT_SECRET="\${JWT_SECRET}" \\
                        "\${BACKEND_IMAGE}"

                    echo "--- Starting frontend ---"
                    docker run -d --name recruitflow-frontend --network recruitflow-net -p 5173:80 \\
                        "\${FRONTEND_IMAGE}"

                    echo ""
                    echo "============================================"
                    echo "Containers are running!"
                    echo "Frontend: http://52.63.77.5:5173"
                    echo "Backend:  http://52.63.77.5:5000"
                    echo "MongoDB:  localhost:27017"
                    echo "============================================"
                    docker ps --filter "name=mongo|recruitflow-backend|recruitflow-frontend" --format "table {{.Names}}\t{{.Image}}\t{{.Ports}}\t{{.Status}}"
                """
            }
        }

        stage('Deploy to EKS') {
            steps {
                dir('infra/k8s') {
                    withCredentials([string(credentialsId: 'mongo-uri', variable: 'MONGO_URI')]) {
                        withCredentials([string(credentialsId: 'jwt-secret', variable: 'JWT_SECRET')]) {
                            withCredentials([string(credentialsId: 'aws-s3-bucket', variable: 'AWS_S3_BUCKET_NAME')]) {
                                sh """
                                    set -e
                                    . "${WORKSPACE}/image.env"

                                    echo "Verifying AWS credentials..."
                                    aws sts get-caller-identity

                                    echo "Configuring kubectl for EKS cluster..."
                                    aws eks update-kubeconfig --region ap-southeast-2 --name ${env.EKS_CLUSTER_NAME}

                                    echo "Replacing image placeholders..."
                                    sed -i "s|BACKEND_IMAGE_PLACEHOLDER|\${BACKEND_IMAGE}|g" backend-deployment.yaml
                                    sed -i "s|FRONTEND_IMAGE_PLACEHOLDER|\${FRONTEND_IMAGE}|g" frontend-deployment.yaml

                                    echo "Creating namespace 'recruitflow'..."
                                    kubectl create namespace recruitflow --dry-run=client -o yaml | kubectl apply -f -

                                    echo "Setting kubectl namespace context to 'recruitflow'..."
                                    kubectl config set-context --current --namespace=recruitflow

                                    echo "Applying ConfigMap..."
                                    kubectl apply -f configmap.yaml

                                    echo "Creating/updating K8s secrets from Jenkins credentials..."
                                    kubectl create secret generic recruitflow-secrets \\
                                        --namespace recruitflow \\
                                        --from-literal=MONGO_URI='${MONGO_URI}' \\
                                        --from-literal=JWT_SECRET='${JWT_SECRET}' \\
                                        --from-literal=AWS_S3_BUCKET_NAME='${AWS_S3_BUCKET_NAME}' \\
                                        --dry-run=client -o yaml | kubectl apply -f -

                                    echo "Deploying application to EKS..."
                                    kubectl apply -f backend-deployment.yaml
                                    kubectl apply -f backend-service.yaml
                                    kubectl apply -f frontend-deployment.yaml
                                    kubectl apply -f frontend-service.yaml

                                    echo "Waiting for backend rollout (up to 5 mins)..."
                                    kubectl rollout status deployment/recruitflow-backend -n recruitflow --timeout=300s || \\
                                        { echo "=== Backend pod details ===" && \\
                                          kubectl get pods -n recruitflow -l app=recruitflow-backend && \\
                                          kubectl describe pods -n recruitflow -l app=recruitflow-backend | tail -40 && \\
                                          kubectl logs -n recruitflow -l app=recruitflow-backend --tail=30 && \\
                                          exit 1; }

                                    echo "Waiting for frontend rollout (up to 5 mins)..."
                                    kubectl rollout status deployment/recruitflow-frontend -n recruitflow --timeout=300s || \\
                                        { echo "=== Frontend pod details ===" && \\
                                          kubectl get pods -n recruitflow -l app=recruitflow-frontend && \\
                                          kubectl describe pods -n recruitflow -l app=recruitflow-frontend | tail -40 && \\
                                          kubectl logs -n recruitflow -l app=recruitflow-frontend --tail=30 && \\
                                          exit 1; }

                                    echo "=== Final pod and service status ==="
                                    kubectl get pods -n recruitflow
                                    kubectl get svc -n recruitflow
                                """
                            }
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            script {
                def buildStatus = currentBuild.currentResult ?: 'UNKNOWN'

                emailext(
                    subject: "Pipeline ${buildStatus}: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                    body: """
                        <h3>Recruitflow CI/CD Pipeline Report</h3>
                        <p>Project: ${env.JOB_NAME}</p>
                        <p>Build: ${env.BUILD_NUMBER}</p>
                        <p>Status: ${buildStatus}</p>
                        <p>URL: ${env.BUILD_URL}</p>
                    """,
                    to: 'silverioedgardo123@gmail.com',
                    mimeType: 'text/html',
                    attachmentsPattern: 'trivy-fs.txt,trivy-backend.txt,trivy-frontend.txt'
                )
            }
        }
    }
}