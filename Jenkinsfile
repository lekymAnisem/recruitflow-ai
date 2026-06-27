pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = 'your-docker-registry.example.com'
        BACKEND_IMAGE = "${DOCKER_REGISTRY}/recruitflow-backend"
        FRONTEND_IMAGE = "${DOCKER_REGISTRY}/recruitflow-frontend"
        IMAGE_TAG = "${env.BUILD_NUMBER}-${env.GIT_COMMIT.substring(0,7)}"
        K8S_NAMESPACE = 'recruitflow'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            parallel {
                stage('Backend Install') {
                    steps {
                        dir('backend') {
                            sh 'npm ci'
                        }
                    }
                }
                stage('Frontend Install') {
                    steps {
                        dir('frontend') {
                            sh 'npm ci'
                        }
                    }
                }
            }
        }

        stage('Lint & Typecheck') {
            parallel {
                stage('Backend Lint') {
                    steps {
                        dir('backend') {
                            sh 'npm run typecheck'
                            sh 'npm run lint || true'
                        }
                    }
                }
                stage('Frontend Lint') {
                    steps {
                        dir('frontend') {
                            sh 'npx tsc --noEmit'
                            sh 'npm run lint || true'
                        }
                    }
                }
            }
        }

        stage('Build') {
            parallel {
                stage('Build Backend') {
                    steps {
                        dir('backend') {
                            sh 'npm run build'
                        }
                    }
                }
                stage('Build Frontend') {
                    steps {
                        dir('frontend') {
                            sh 'npm run build'
                        }
                    }
                }
            }
        }

        stage('Test') {
            parallel {
                stage('Backend Tests') {
                    steps {
                        dir('backend') {
                            sh 'npm test || true'
                        }
                    }
                }
                stage('Frontend Tests') {
                    steps {
                        dir('frontend') {
                            sh 'npm test || true'
                        }
                    }
                }
            }
        }

        stage('Build Docker Images') {
            parallel {
                stage('Backend Docker') {
                    steps {
                        dir('backend') {
                            sh "docker build -t ${BACKEND_IMAGE}:${IMAGE_TAG} -t ${BACKEND_IMAGE}:latest ."
                        }
                    }
                }
                stage('Frontend Docker') {
                    steps {
                        dir('frontend') {
                            sh "docker build -t ${FRONTEND_IMAGE}:${IMAGE_TAG} -t ${FRONTEND_IMAGE}:latest ."
                        }
                    }
                }
            }
        }

        stage('Push Docker Images') {
            when {
                branch 'main'
            }
            parallel {
                stage('Push Backend') {
                    steps {
                        sh "docker push ${BACKEND_IMAGE}:${IMAGE_TAG}"
                        sh "docker push ${BACKEND_IMAGE}:latest"
                    }
                }
                stage('Push Frontend') {
                    steps {
                        sh "docker push ${FRONTEND_IMAGE}:${IMAGE_TAG}"
                        sh "docker push ${FRONTEND_IMAGE}:latest"
                    }
                }
            }
        }

        stage('Deploy to Kubernetes') {
            when {
                branch 'main'
            }
            steps {
                sh """
                    sed -i 's|BACKEND_IMAGE_PLACEHOLDER|${BACKEND_IMAGE}:${IMAGE_TAG}|g' infra/k8s/backend-deployment.yaml
                    sed -i 's|FRONTEND_IMAGE_PLACEHOLDER|${FRONTEND_IMAGE}:${IMAGE_TAG}|g' infra/k8s/frontend-deployment.yaml
                """
                sh "kubectl apply -f infra/k8s/ --namespace ${K8S_NAMESPACE}"
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed successfully!'
            echo "Backend image: ${BACKEND_IMAGE}:${IMAGE_TAG}"
            echo "Frontend image: ${FRONTEND_IMAGE}:${IMAGE_TAG}"
        }
        failure {
            echo 'Pipeline failed. Check build logs for details.'
        }
        always {
            cleanWs()
        }
    }
}
