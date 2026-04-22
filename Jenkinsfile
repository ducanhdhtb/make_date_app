pipeline {
  agent any

  // ── Configurable parameters ────────────────────────────────────────────────
  parameters {
    string(name: 'BASE_URL',  defaultValue: 'http://localhost:3002',      description: 'Web app URL')
    string(name: 'API_URL',   defaultValue: 'http://localhost:3001/api/', description: 'API base URL (trailing slash required)')
    booleanParam(name: 'HEADLESS', defaultValue: true, description: 'Run browser headless')
  }

  // ── Environment ────────────────────────────────────────────────────────────
  environment {
    NOTIFY_EMAIL = 'ducanhdhtb@gmail.com'
    ALLURE_RESULTS = 'e2e-playwright-java/target/allure-results'
    ALLURE_REPORT  = 'e2e-playwright-java/target/allure-report'
  }

  // ── Auto trigger khi GitHub push ──────────────────────────────────────────
  triggers {
    githubPush()   // fires on every push via GitHub webhook → Jenkins
  }

  options {
    timestamps()
    timeout(time: 30, unit: 'MINUTES')
    buildDiscarder(logRotator(numToKeepStr: '20'))
  }

  // ── Stages ─────────────────────────────────────────────────────────────────
  stages {

    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install Playwright Browsers') {
      steps {
        dir('e2e-playwright-java') {
          sh '''
            mvn generate-test-resources -q \
              -DbaseUrl="${BASE_URL}" \
              -DapiUrl="${API_URL}" \
              -Dheadless="${HEADLESS}"
          '''
        }
      }
    }

    stage('Run E2E + API Tests') {
      steps {
        dir('e2e-playwright-java') {
          // Always continue so Allure can collect results even on failure
          catchError(buildResult: 'UNSTABLE', stageResult: 'UNSTABLE') {
            sh '''
              mvn test \
                -DbaseUrl="${BASE_URL}" \
                -DapiUrl="${API_URL}" \
                -Dheadless="${HEADLESS}" \
                -Dsurefire.failIfNoSpecifiedTests=false
            '''
          }
        }
      }
      post {
        always {
          // Publish JUnit XML results (pass / fail / skip counts in Jenkins UI)
          junit(
            testResults: 'e2e-playwright-java/target/surefire-reports/*.xml',
            allowEmptyResults: true
          )
        }
      }
    }

    stage('Generate Allure Report') {
      steps {
        dir('e2e-playwright-java') {
          sh 'mvn allure:report -q'
        }
      }
    }

  } // end stages

  // ── Post actions ───────────────────────────────────────────────────────────
  post {
    always {
      // Publish Allure report as a Jenkins build artifact with navigation link
      allure([
        includeProperties: false,
        jdk: '',
        results: [[path: "${ALLURE_RESULTS}"]],
        report:  "${ALLURE_REPORT}"
      ])

      // Archive raw results so they can be downloaded
      archiveArtifacts(
        artifacts: 'e2e-playwright-java/target/allure-results/**,e2e-playwright-java/target/surefire-reports/**',
        allowEmptyArchive: true
      )

      // Send email with pass/fail/blocked summary + Allure link
      script {
        def summary  = buildSummary()
        def subject  = "[NearMatch E2E] ${currentBuild.currentResult} — Build #${env.BUILD_NUMBER}"
        def allureUrl = "${env.BUILD_URL}allure/"
        def body = """
<html><body style="font-family:Arial,sans-serif;font-size:14px">
<h2 style="color:${statusColor()}">NearMatch E2E — ${currentBuild.currentResult}</h2>

<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse">
  <tr><th>Build</th><td><a href="${env.BUILD_URL}">#${env.BUILD_NUMBER}</a></td></tr>
  <tr><th>Branch</th><td>${env.GIT_BRANCH ?: env.BRANCH_NAME ?: 'N/A'}</td></tr>
  <tr><th>Duration</th><td>${currentBuild.durationString}</td></tr>
  <tr><th>Status</th><td style="color:${statusColor()};font-weight:bold">${currentBuild.currentResult}</td></tr>
</table>

<h3>Test Results</h3>
<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse">
  <tr style="background:#f0f0f0"><th>✅ Passed</th><th>❌ Failed</th><th>⚠️ Skipped</th><th>🔵 Total</th></tr>
  <tr>
    <td style="color:green;font-weight:bold">${summary.passed}</td>
    <td style="color:red;font-weight:bold">${summary.failed}</td>
    <td style="color:orange;font-weight:bold">${summary.skipped}</td>
    <td><strong>${summary.total}</strong></td>
  </tr>
</table>

${failedTestsTable(summary.failedTests)}

<h3>📊 Allure Report</h3>
<p><a href="${allureUrl}" style="font-size:16px;font-weight:bold">👉 Xem Allure Report (với trace chi tiết)</a></p>

<h3>🔗 Links</h3>
<ul>
  <li><a href="${env.BUILD_URL}">Jenkins Build</a></li>
  <li><a href="${env.BUILD_URL}console">Console Output</a></li>
  <li><a href="${env.BUILD_URL}testReport/">Test Report</a></li>
  <li><a href="${allureUrl}">Allure Report</a></li>
</ul>

<hr/>
<p style="color:gray;font-size:12px">Tự động gửi bởi Jenkins CI — NearMatch E2E Suite</p>
</body></html>
"""
        emailext(
          to:           env.NOTIFY_EMAIL,
          subject:      subject,
          body:         body,
          mimeType:     'text/html',
          attachLog:    false,
          compressLog:  false
        )
      }
    }
  }

} // end pipeline

// ── Helper functions ──────────────────────────────────────────────────────────

def buildSummary() {
  def passed  = 0
  def failed  = 0
  def skipped = 0
  def failedTests = []

  try {
    def testResultAction = currentBuild.rawBuild.getAction(hudson.tasks.junit.TestResultAction)
    if (testResultAction) {
      def result = testResultAction.result
      passed  = result.passCount
      failed  = result.failCount
      skipped = result.skipCount
      result.failedTests.each { t ->
        failedTests << [
          name:    "${t.className}.${t.name}",
          message: t.errorDetails ?: t.errorStackTrace?.take(300) ?: 'No details'
        ]
      }
    }
  } catch (e) {
    echo "Could not read test results: ${e.message}"
  }

  return [
    passed:      passed,
    failed:      failed,
    skipped:     skipped,
    total:       passed + failed + skipped,
    failedTests: failedTests
  ]
}

def failedTestsTable(failedTests) {
  if (!failedTests) return '<p style="color:green">✅ Không có test nào thất bại.</p>'

  def rows = failedTests.collect { t ->
    """<tr>
      <td style="color:red">${t.name}</td>
      <td><pre style="font-size:11px;white-space:pre-wrap">${t.message.replaceAll('<','&lt;').replaceAll('>','&gt;')}</pre></td>
    </tr>"""
  }.join('\n')

  return """
<h3>❌ Failed Tests</h3>
<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%">
  <tr style="background:#ffe0e0"><th>Test</th><th>Error</th></tr>
  ${rows}
</table>"""
}

def statusColor() {
  switch (currentBuild.currentResult) {
    case 'SUCCESS':  return '#2e7d32'
    case 'UNSTABLE': return '#f57f17'
    case 'FAILURE':  return '#c62828'
    default:         return '#555555'
  }
}
