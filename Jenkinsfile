pipeline {
    agent any

    tools {
        jdk 'jdk21'
        nodejs 'node20'
    }

    environment {
        SCANNER_HOME = tool 'sonar-scanner'
        DOCKER_IMAGE_BACKEND = "dracoo23/recruitflow-backend"
        DOCKER_IMAGE_FRONTEND = "dracoo23/recruitflow-frontend"
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
                    sh """
                        $SCANNER_HOME/bin/sonar-scanner \
                        -Dsonar.projectKey=recruitflow-ai \
                        -Dsonar.projectName=recruitflow-ai
                    """
                }
            }
        }

        stage('Quality Gate') {
            steps {
                script {
                    waitForQualityGate abortPipeline: false
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

        stage('Trivy FS Scan') {
            steps {
                sh 'trivy fs . --format table > trivy-fs.txt || true'
            }
        }

        stage('Docker Build & Push') {
            environment {
                DOCKER_CREDENTIALS = credentials('docker')
            }
            steps {
                sh "docker login -u $DOCKER_CREDENTIALS_USR -p $DOCKER_CREDENTIALS_PSW"

                dir('backend') {
                    sh """
                        docker build -t ${DOCKER_IMAGE_BACKEND}:latest .
                        docker push ${DOCKER_IMAGE_BACKEND}:latest
                    """
                }
                dir('frontend') {
                     sh "docker build -t ${DOCKER_IMAGE_FRONTEND}:latest ."



                }
            }
        }

        stage('Trivy Image Scan') {
            steps {
                sh """
                    trivy image ${DOCKER_IMAGE_BACKEND}:latest > trivy-backend.txt || true
                    trivy image ${DOCKER_IMAGE_FRONTEND}:latest > trivy-frontend.txt || true
                """
            }
        }

        stage('Deploy Containers') {
            environment {
                MONGO_URI = credentials('mongo-uri')
                AWS_ACCESS_KEY_ID = credentials('aws-access-key')
                AWS_SECRET_ACCESS_KEY = credentials('aws-secret-key')
                AWS_S3_BUCKET_NAME = credentials('aws-s3-bucket')
                JWT_SECRET = credentials('jwt-secret')
            }
            steps {
                sh """
                    docker rm -f recruitflow-backend || true
                    docker rm -f recruitflow-frontend || true

                    docker run -d --name recruitflow-backend \
                        -p 5000:5000 \
                        -e MONGO_URI \
                        -e AWS_REGION=ap-southeast-2 \
                        -e AWS_ACCESS_KEY_ID \
                        -e AWS_SECRET_ACCESS_KEY \
                        -e AWS_S3_BUCKET_NAME \
                        -e JWT_SECRET \
                        -e JWT_ACCESS_EXPIRY=15m \
                        -e JWT_REFRESH_EXPIRY=7d \
                        -e JWT_ISSUER=recruitflow-ai \
                        -e CORS_ORIGIN=http://13.211.245.10:5173 \
                        ${DOCKER_IMAGE_BACKEND}:latest

                    docker run -d --name recruitflow-frontend \
                        -p 5173:80 \
                        ${DOCKER_IMAGE_FRONTEND}:latest
                """
            }
        }

        stage('Deploy to EKS Cluster') {
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

                            echo "Verifying deployment..."
                            kubectl get pods
                            kubectl get svc
                        '''
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
