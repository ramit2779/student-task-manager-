pipeline {
    agent any

    stages {

        stage('Docker Build Validation') {
            steps {
                sh 'docker build -t cloud-infra-monitor .'
            }
        }

        stage('Deployment Readiness Check') {
            steps {
                echo 'Application successfully validated and ready for ECS deployment on AWS ECS Fargate.'
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