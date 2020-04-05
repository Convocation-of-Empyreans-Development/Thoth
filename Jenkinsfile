pipeline {
  agent {
    docker {
      image 'node:lts-alpine'
      args '-p 3010:3010'
    }

  }
  stages {
    stage('fetch-deps') {
      steps {
        sh 'npm install'
      }
    }

  }
}