# STAYON – Your Hostel. One Smart Space.

STAYON is a simple hostel utility web application designed to make hostel life easier. It provides a convenient way for students to access basic hostel services and contact the warden.

The project demonstrates the complete DevOps workflow using Git, GitHub, Jenkins, Docker, and Kubernetes.

## Features

- Simple and user-friendly hostel interface
- Basic hostel utility features
- Contact warden functionality
- Responsive web application

## Tech Stack

**Application**
- Java 21
- Spring Boot
- Spring MVC
- Thymeleaf
- H2 Database

**DevOps Tools**
- Git and GitHub
- Jenkins
- Maven
- Docker
- Kubernetes
- Docker Desktop

## DevOps Workflow

The project follows this workflow:

```text
Developer
   ↓
Git
   ↓
GitHub
   ↓
Jenkins
   ↓
Maven Build and Test
   ↓
Docker Image
   ↓
Docker Container
   ↓
Kubernetes Deployment
   ↓
Kubernetes Service
   ↓
Running Application
```

Jenkins automates the build, testing, Docker image creation, and container execution stages. Kubernetes deployment is performed using `kubectl`.

## Project Structure

```text
STAYON/
├── pom.xml
├── Dockerfile
├── Jenkinsfile
├── k8s.yaml
└── src/
    └── main/
        ├── java/
        │   └── com/stayon/
        └── resources/
            ├── application.properties
            ├── schema.sql
            ├── static/
            └── templates/
```

## Run the Application Locally

### Prerequisites

- Java 21
- Maven
- Git

### Steps

Clone the repository:

```bash
git clone https://github.com/anushka2566/stayon.git
cd stayon
```

Build the application:

```bash
mvn clean package
```

Run the application:

```bash
java -jar target/stayon-1.0.0.jar
```

Open the application in your browser:

```text
http://localhost:8080
```

## Docker

Build the Docker image:

```bash
docker build -t stayon-app:latest .
```

Run the container:

```bash
docker run -d --name stayon-container -p 8080:8080 stayon-app:latest
```

Open:

```text
http://localhost:8080
```

## Kubernetes Deployment

Make sure Docker Desktop Kubernetes is running and the `stayon-app:latest` image is available to the cluster.

Apply the Kubernetes configuration:

```bash
kubectl apply -f k8s.yaml
```

Check the deployment and pod:

```bash
kubectl get deployments
kubectl get pods
kubectl get services
```

Access the application through port forwarding:

```bash
kubectl port-forward service/stayon-service 8090:8080
```

Open:

```text
http://localhost:8090
```

## Purpose

The main purpose of this project is to understand and demonstrate a basic DevOps lifecycle by building, testing, containerizing, and deploying a web application.

## Author

**Maruthi Anushka Bonam**

GitHub: [anushka2566](https://github.com/anushka2566)
