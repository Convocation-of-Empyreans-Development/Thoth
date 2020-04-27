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
    stage('run-bot') {
      environment {
           DISCORD_BOT_TOKEN = credentials('discord_bot_token')
      }
      steps {
        sh 'node ./server.js'
      }
    }
  }
}
