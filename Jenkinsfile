pipeline {
    agent any

    // Optional: Define Maven tool name configured in Jenkins Global Tool Configuration
    // tools {
    //     maven 'Maven-3'
    // }

    environment {
        IMAGE_NAME = 'stayon-app'
        CONTAINER_NAME = 'stayon-container'
        VOLUME_NAME = 'stayon_data'
    }

    stages {
        stage('Checkout') {
            steps {
                // Pull the latest source code from the Git repository
                checkout scm
            }
        }

        stage('Maven Build') {
            steps {
                // Compile the Java 21 project and package the Spring Boot JAR
                sh 'mvn clean package -DskipTests'
            }
        }

        stage('Test') {
            steps {
                // Run JUnit and Spring Boot integration tests
                sh 'mvn test'
            }
        }

        stage('Docker Build') {
            steps {
                // Build the Docker image using the project Dockerfile
                sh "docker build -t ${IMAGE_NAME}:latest ."
            }
        }

        stage('Docker Run') {
            steps {
                // Stop and remove any old container, then launch STAYON with persistent H2 storage
                sh """
                    docker stop ${CONTAINER_NAME} || true
                    docker rm ${CONTAINER_NAME} || true
                    docker volume create ${VOLUME_NAME}
                    docker run -d \\
                        --name ${CONTAINER_NAME} \\
                        -p 8080:8080 \\
                        -v ${VOLUME_NAME}:/app/data \\
                        --restart unless-stopped \\
                        ${IMAGE_NAME}:latest
                """
            }
        }
    }

    post {
        success {
            echo 'STAYON pipeline completed successfully. App is running on port 8080.'
        }
        failure {
            echo 'STAYON pipeline failed. Check the stage logs for details.'
        }
    }
}
