pipeline {
  agent any

  tools {
    maven 'maven3'
  }

  parameters {
    string(name: 'BASE_URL', defaultValue: 'http://localhost:3002', description: 'Web app URL')
    booleanParam(name: 'HEADLESS', defaultValue: true, description: 'Run browser headless')
  }

  environment {
    AUTOMATION_REPO   = 'https://github.com/ducanhdhtb/make_data_app_automation.git'
    AUTOMATION_BRANCH = 'main'
    AUTOMATION_DIR    = 'make_data_app_automation'
    NOTIFY_EMAIL      = 'ducanhdhtb@gmail.com'

    ALLURE_RESULTS    = "${AUTOMATION_DIR}/target/allure-results"
    ALLURE_REPORT     = "${AUTOMATION_DIR}/target/allure-report"
  }

  triggers {
    githubPush()
  }

  options {
    timestamps()
    timeout(time: 30, unit: 'MINUTES')
    buildDiscarder(logRotator(numToKeepStr: '20'))
    disableConcurrentBuilds()
  }

  stages {

    stage('Checkout Web Repo') {
      steps {
        checkout scm
      }
    }

    stage('Check Web App') {
      steps {
        sh '''
          echo "Checking ${BASE_URL}"
          curl -I --max-time 10 ${BASE_URL}
        '''
      }
    }

    stage('Checkout Automation Repo') {
      steps {
        dir("${AUTOMATION_DIR}") {
          deleteDir()
          git branch: "${AUTOMATION_BRANCH}",
              url: "${AUTOMATION_REPO}"
        }
      }
    }

    stage('Verify Environment') {
      steps {
        sh 'java -version || true'
        sh 'mvn -version'
      }
    }

    stage('Install Playwright Browsers') {
      steps {
        dir("${AUTOMATION_DIR}") {
          sh '''
            mvn generate-test-resources -q \
              -DbaseUrl="${BASE_URL}" \
              -Dheadless="${HEADLESS}"
          '''
        }
      }
    }

    stage('Run UI Tests') {
      steps {
        dir("${AUTOMATION_DIR}") {
          catchError(buildResult: 'UNSTABLE', stageResult: 'UNSTABLE') {
            sh '''
              mvn clean test -Pui \
                -DbaseUrl="${BASE_URL}" \
                -Dheadless="${HEADLESS}" \
                -Dsurefire.failIfNoSpecifiedTests=false
            '''
          }
        }
      }
      post {
        always {
          junit(
            testResults: "${AUTOMATION_DIR}/target/surefire-reports/*.xml",
            allowEmptyResults: true
          )
        }
      }
    }

    stage('Generate Allure Report') {
      steps {
        dir("${AUTOMATION_DIR}") {
          sh 'mvn allure:report -q'
        }
      }
    }

    stage('Publish Allure Report') {
      steps {
        script {
          allure([
            includeProperties: false,
            jdk: '',
            results: [[path: "${ALLURE_RESULTS}"]],
            report: "${ALLURE_REPORT}"
          ])
        }
      }
    }
  }

  post {
    always {
      // Archive artifacts
      archiveArtifacts(
        artifacts: "${AUTOMATION_DIR}/target/allure-results/**,${AUTOMATION_DIR}/target/surefire-reports/**",
        allowEmptyArchive: true
      )

      // Publish Allure report to Jenkins
      allure([
        includeProperties: false,
        jdk: '',
        results: [[path: "${ALLURE_RESULTS}"]],
        report: "${ALLURE_REPORT}"
      ])
    }

    success {
      script {
        def testSummary = getTestSummary()
        emailext(
          to: "${NOTIFY_EMAIL}",
          subject: "✅ [SUCCESS] ${env.JOB_NAME} #${env.BUILD_NUMBER}",
          body: """
<html>
<head>
<style>
  body { font-family: Arial, sans-serif; }
  .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
  .content { padding: 20px; }
  .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0; }
  .passed { color: #4CAF50; font-weight: bold; }
  .failed { color: #f44336; font-weight: bold; }
  .skipped { color: #FF9800; font-weight: bold; }
  table { width: 100%; border-collapse: collapse; margin-top: 15px; }
  th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
  th { background: #4CAF50; color: white; }
  .link-button { 
    display: inline-block; 
    background: #2196F3; 
    color: white; 
    padding: 10px 20px; 
    text-decoration: none; 
    border-radius: 5px; 
    margin-top: 15px;
  }
</style>
</head>
<body>
  <div class="header">
    <h1>✅ All Tests PASSED</h1>
  </div>
  <div class="content">
    <div class="summary">
      <h2>📊 Test Summary</h2>
      <p><strong>Job:</strong> ${env.JOB_NAME}</p>
      <p><strong>Build:</strong> #${env.BUILD_NUMBER}</p>
      <p><strong>Target URL:</strong> ${params.BASE_URL}</p>
      <p><strong>Duration:</strong> ${currentBuild.durationString}</p>
    </div>
    
    <h2>📈 Test Results</h2>
    <table>
      <tr>
        <th>Total</th>
        <th>Passed</th>
        <th>Failed</th>
        <th>Skipped</th>
      </tr>
      <tr>
        <td>${testSummary.total}</td>
        <td class="passed">${testSummary.passed}</td>
        <td class="failed">${testSummary.failed}</td>
        <td class="skipped">${testSummary.skipped}</td>
      </tr>
    </table>
    
    <a href="${env.BUILD_URL}allure/" class="link-button">📊 View Allure Report</a>
  </div>
</body>
</html>
""".stripIndent(),
          mimeType: 'text/html'
        )
      }
    }

    unstable {
      script {
        def testSummary = getTestSummary()
        def failedTests = getFailedTests()
        def passedTests = getPassedTests()
        
        emailext(
          to: "${NOTIFY_EMAIL}",
          subject: "⚠️ [UNSTABLE] ${env.JOB_NAME} #${env.BUILD_NUMBER} - ${testSummary.failed} Failed",
          body: """
<html>
<head>
<style>
  body { font-family: Arial, sans-serif; }
  .header { background: #FF9800; color: white; padding: 20px; text-align: center; }
  .content { padding: 20px; }
  .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0; }
  .passed { color: #4CAF50; font-weight: bold; }
  .failed { color: #f44336; font-weight: bold; }
  .skipped { color: #FF9800; font-weight: bold; }
  table { width: 100%; border-collapse: collapse; margin-top: 15px; }
  th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
  th { background: #333; color: white; }
  .fail-table th { background: #f44336; }
  .pass-table th { background: #4CAF50; }
  .link-button { 
    display: inline-block; 
    background: #2196F3; 
    color: white; 
    padding: 10px 20px; 
    text-decoration: none; 
    border-radius: 5px; 
    margin-top: 15px;
  }
  .section { margin-top: 20px; }
</style>
</head>
<body>
  <div class="header">
    <h1>⚠️ Tests UNSTABLE</h1>
    <p>Some tests failed - Please review</p>
  </div>
  <div class="content">
    <div class="summary">
      <h2>📊 Test Summary</h2>
      <p><strong>Job:</strong> ${env.JOB_NAME}</p>
      <p><strong>Build:</strong> #${env.BUILD_NUMBER}</p>
      <p><strong>Target URL:</strong> ${params.BASE_URL}</p>
      <p><strong>Duration:</strong> ${currentBuild.durationString}</p>
    </div>
    
    <h2>📈 Test Results</h2>
    <table>
      <tr>
        <th>Total</th>
        <th>Passed</th>
        <th>Failed</th>
        <th>Skipped</th>
      </tr>
      <tr>
        <td>${testSummary.total}</td>
        <td class="passed">${testSummary.passed}</td>
        <td class="failed">${testSummary.failed}</td>
        <td class="skipped">${testSummary.skipped}</td>
      </tr>
    </table>
    
    ${failedTests ? """
    <div class="section">
      <h2>❌ Failed Tests (${testSummary.failed})</h2>
      <table class="fail-table">
        <tr>
          <th>Test Name</th>
          <th>Error</th>
        </tr>
        ${failedTests}
      </table>
    </div>
    """ : ""}
    
    ${passedTests ? """
    <div class="section">
      <h2>✅ Passed Tests (${testSummary.passed})</h2>
      <table class="pass-table">
        <tr>
          <th>Test Name</th>
          <th>Duration</th>
        </tr>
        ${passedTests}
      </table>
    </div>
    """ : ""}
    
    <a href="${env.BUILD_URL}allure/" class="link-button">📊 View Full Allure Report</a>
  </div>
</body>
</html>
""".stripIndent(),
          mimeType: 'text/html'
        )
      }
    }

    failure {
      script {
        emailext(
          to: "${NOTIFY_EMAIL}",
          subject: "❌ [FAILURE] ${env.JOB_NAME} #${env.BUILD_NUMBER}",
          body: """
<html>
<head>
<style>
  body { font-family: Arial, sans-serif; }
  .header { background: #f44336; color: white; padding: 20px; text-align: center; }
  .content { padding: 20px; }
  .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0; }
  .link-button { 
    display: inline-block; 
    background: #2196F3; 
    color: white; 
    padding: 10px 20px; 
    text-decoration: none; 
    border-radius: 5px; 
    margin-top: 15px;
  }
</style>
</head>
<body>
  <div class="header">
    <h1>❌ Build FAILED</h1>
    <p>Build execution failed - Please check the logs</p>
  </div>
  <div class="content">
    <div class="summary">
      <h2>📊 Build Information</h2>
      <p><strong>Job:</strong> ${env.JOB_NAME}</p>
      <p><strong>Build:</strong> #${env.BUILD_NUMBER}</p>
      <p><strong>Target URL:</strong> ${params.BASE_URL}</p>
      <p><strong>Duration:</strong> ${currentBuild.durationString}</p>
    </div>
    
    <p>The build failed during execution. Please check the console output for details.</p>
    
    <a href="${env.BUILD_URL}console" class="link-button">📋 View Console Output</a>
    <a href="${env.BUILD_URL}allure/" class="link-button">📊 View Allure Report</a>
  </div>
</body>
</html>
""".stripIndent(),
          mimeType: 'text/html'
        )
      }
    }
  }
}

// Helper function to get test summary from JUnit results
def getTestSummary() {
  def summary = [total: 0, passed: 0, failed: 0, skipped: 0]
  try {
    def testResult = junit("${AUTOMATION_DIR}/target/surefire-reports/*.xml", allowEmptyResults: true)
    summary.total = testResult.totalCount
    summary.passed = testResult.passCount
    summary.failed = testResult.failCount
    summary.skipped = testResult.skipCount
  } catch (Exception e) {
    echo "Could not parse test results: ${e.message}"
  }
  return summary
}

// Helper function to get failed tests
def getFailedTests() {
  def failedRows = ""
  try {
    def testResult = junit("${AUTOMATION_DIR}/target/surefire-reports/*.xml", allowEmptyResults: true)
    testResult.failedTests?.each { test ->
      failedRows += "<tr><td>${test.className}.${test.testName}</td><td>${test.errorStackTrace?.take(200) ?: 'N/A'}</td></tr>"
    }
  } catch (Exception e) {
    echo "Could not get failed tests: ${e.message}"
  }
  return failedRows
}

// Helper function to get passed tests
def getPassedTests() {
  def passedRows = ""
  try {
    def testResult = junit("${AUTOMATION_DIR}/target/surefire-reports/*.xml", allowEmptyResults: true)
    testResult.passedTests?.each { test ->
      passedRows += "<tr><td>${test.className}.${test.testName}</td><td>${test.duration}s</td></tr>"
    }
  } catch (Exception e) {
    echo "Could not get passed tests: ${e.message}"
  }
  return passedRows
}
