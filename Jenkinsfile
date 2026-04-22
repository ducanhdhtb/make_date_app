pipeline {
  agent any

  // ── Tools — Jenkins sẽ tự download nếu chưa có ────────────────────────────
  tools {
    maven 'maven3'   // tên phải khớp với Manage Jenkins → Tools → Maven

  }

  // ── Configurable parameters ────────────────────────────────────────────────
  parameters {
    string(name: 'BASE_URL',  defaultValue: 'http://localhost:3002',       description: 'Web app URL')
    string(name: 'API_URL',   defaultValue: 'http://localhost:3001/api/',  description: 'API base URL (trailing slash required)')
    booleanParam(name: 'HEADLESS', defaultValue: true, description: 'Run browser headless')
  }

  // ── Environment ────────────────────────────────────────────────────────────
  environment {
    NOTIFY_EMAIL   = 'ducanhdhtb@gmail.com'
    ALLURE_RESULTS = 'e2e-playwright-java/target/allure-results'
    ALLURE_REPORT  = 'e2e-playwright-java/target/allure-report'
  }

  // ── Auto trigger khi GitHub push ──────────────────────────────────────────
  triggers {
    githubPush()
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
      allure([
        includeProperties: false,
        jdk: '',
        results: [[path: "${ALLURE_RESULTS}"]],
        report:  "${ALLURE_REPORT}"
      ])

      archiveArtifacts(
        artifacts: 'e2e-playwright-java/target/allure-results/**,e2e-playwright-java/target/surefire-reports/**',
        allowEmptyArchive: true
      )

      script {
        // Đọc kết quả từ JUnit XML thay vì getRawBuild (không cần approve)
        def passed  = 0
        def failed  = 0
        def skipped = 0
        def failedTests = []

        try {
          def xmlFiles = findFiles(glob: 'e2e-playwright-java/target/surefire-reports/TEST-*.xml')
          xmlFiles.each { f ->
            def xml = readFile(f.path)
            def suite = new XmlSlurper().parseText(xml)
            passed  += (suite.@tests.toInteger()  ?: 0) - (suite.@failures.toInteger() ?: 0) - (suite.@errors.toInteger() ?: 0) - (suite.@skipped.toInteger() ?: 0)
            failed  += (suite.@failures.toInteger() ?: 0) + (suite.@errors.toInteger() ?: 0)
            skipped += (suite.@skipped.toInteger() ?: 0)
            suite.testcase.each { tc ->
              if (tc.failure.size() > 0 || tc.error.size() > 0) {
                def msg = tc.failure.size() > 0 ? tc.failure.@message.text() : tc.error.@message.text()
                failedTests << [name: "${tc.@classname}.${tc.@name}", message: msg?.take(300) ?: 'No details']
              }
            }
          }
        } catch (e) {
          echo "Could not parse test results: ${e.message}"
        }

        def total     = passed + failed + skipped
        def allureUrl = "${env.BUILD_URL}allure/"
        def subject   = "[NearMatch E2E] ${currentBuild.currentResult} — Build #${env.BUILD_NUMBER} | ✅${passed} ❌${failed} ⚠️${skipped}"

        def failRows = ''
        if (failedTests) {
          def rows = failedTests.collect { t ->
            "<tr><td style='color:red'>${t.name}</td><td><pre style='font-size:11px;white-space:pre-wrap'>${t.message.replaceAll('<','&lt;').replaceAll('>','&gt;')}</pre></td></tr>"
          }.join('\n')
          failRows = """
<h3>❌ Failed / Blocked Tests</h3>
<table border='1' cellpadding='6' cellspacing='0' style='border-collapse:collapse;width:100%'>
  <tr style='background:#ffe0e0'><th>Test</th><th>Error / Trace</th></tr>
  ${rows}
</table>"""
        } else {
          failRows = "<p style='color:green'>✅ Tất cả test đều pass.</p>"
        }

        def statusClr = currentBuild.currentResult == 'SUCCESS' ? '#2e7d32' : currentBuild.currentResult == 'UNSTABLE' ? '#f57f17' : '#c62828'

        def body = """
<html><body style='font-family:Arial,sans-serif;font-size:14px'>
<h2 style='color:${statusClr}'>NearMatch E2E — ${currentBuild.currentResult}</h2>

<table border='1' cellpadding='6' cellspacing='0' style='border-collapse:collapse'>
  <tr><th>Build</th><td><a href='${env.BUILD_URL}'>#${env.BUILD_NUMBER}</a></td></tr>
  <tr><th>Branch</th><td>${env.GIT_BRANCH ?: 'main'}</td></tr>
  <tr><th>Duration</th><td>${currentBuild.durationString}</td></tr>
  <tr><th>Status</th><td style='color:${statusClr};font-weight:bold'>${currentBuild.currentResult}</td></tr>
</table>

<h3>Test Results</h3>
<table border='1' cellpadding='6' cellspacing='0' style='border-collapse:collapse'>
  <tr style='background:#f0f0f0'><th>✅ Passed</th><th>❌ Failed</th><th>⚠️ Skipped</th><th>🔵 Total</th></tr>
  <tr>
    <td style='color:green;font-weight:bold'>${passed}</td>
    <td style='color:red;font-weight:bold'>${failed}</td>
    <td style='color:orange;font-weight:bold'>${skipped}</td>
    <td><strong>${total}</strong></td>
  </tr>
</table>

${failRows}

<h3>📊 Allure Report (trace chi tiết từng test)</h3>
<p><a href='${allureUrl}' style='font-size:16px;font-weight:bold'>👉 Xem Allure Report</a></p>

<h3>🔗 Links</h3>
<ul>
  <li><a href='${env.BUILD_URL}'>Jenkins Build</a></li>
  <li><a href='${env.BUILD_URL}console'>Console Output</a></li>
  <li><a href='${env.BUILD_URL}testReport/'>Test Report</a></li>
  <li><a href='${allureUrl}'>Allure Report</a></li>
</ul>

<hr/>
<p style='color:gray;font-size:12px'>Tự động gửi bởi Jenkins CI — NearMatch E2E Suite</p>
</body></html>
"""
        emailext(
          to:          env.NOTIFY_EMAIL,
          subject:     subject,
          body:        body,
          mimeType:    'text/html',
          attachLog:   false,
          compressLog: false
        )
      }
    }
  }

} // end pipeline
