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
                    docker build -t "${FRONTEND_IMAGE}" -t "${ECR_REGISTRY}/${FRONTEND_REPO}:latest" frontend

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

        stage('Deploy to EKS') {
            environment {
                MONGO_URI = credentials('mongo-uri')
                JWT_SECRET = credentials('jwt-secret')
                AWS_S3_BUCKET_NAME = credentials('aws-s3-bucket')
            }
            steps {
                dir('infra/k8s') {
                    script {
                        sh '''
                            echo "Verifying AWS credentials..."
                            aws sts get-caller-identity

                            echo "Configuring kubectl for EKS cluster..."
                            aws eks update-kubeconfig --region ap-southeast-2 --name Cloudaseem

                            
                            echo "Replacing image placeholders..."
                            sed -i "s|BACKEND_IMAGE_PLACEHOLDER|${DOCKER_IMAGE_BACKEND}:latest|g" backend-deployment.yaml
                            sed -i "s|FRONTEND_IMAGE_PLACEHOLDER|${DOCKER_IMAGE_FRONTEND}:latest|g" frontend-deployment.yaml


                            echo "Deploying application to EKS..."
                            kubectl apply -f backend-deployment.yaml
                            kubectl apply -f backend-service.yaml
                            kubectl apply -f frontend-deployment.yaml
                            kubectl apply -f frontend-service.yaml
                            kubectl apply -f configmap.yaml

                        kubectl rollout status deployment/recruitflow-backend --timeout=180s
                        kubectl rollout status deployment/recruitflow-frontend --timeout=180s
                        kubectl get pods
                        kubectl get svc
                    '''
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
