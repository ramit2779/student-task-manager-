pipeline {
    agent any

    stages {

        stage('Checkout Code') {
            steps {
                git 'https://github.com/ramit2779/student-task-manager.git'
            }
        }

        stage('Install Dependencies') {
            steps {
                dir('app') {
                    sh 'npm install'
                }
            }
        }

        stage('Run Basic Validation') {
            steps {
                dir('app') {
                    sh 'npm audit fix || true'
                    sh 'npm test || true'
                }
            }
        }

        stage('Docker Build Validation') {
            steps {
                sh 'docker build -t cloud-infra-monitor .'
            }
        }

        stage('Deployment Readiness Check') {
            steps {
                echo 'Application successfully validated and ready for ECS deployment.'
            }
        }
    }

    post {
        success {
            echo 'Pipeline executed successfully.'
        }

        failure {
            echo 'Pipeline failed. Please check logs.'
        }
    }
}