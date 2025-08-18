/**
 * Performance Test Results Processor
 * Collects and reports performance metrics for drag-and-drop tests
 */

const fs = require('fs')
const path = require('path')

class PerformanceProcessor {
  constructor() {
    this.performanceData = {
      testSuites: [],
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        performanceTests: 0,
        averageTestTime: 0,
        memoryLeaks: 0,
        frameRateIssues: 0,
      },
      timestamp: new Date().toISOString(),
    }
  }

  processResults(results) {
    this.performanceData.summary.totalTests = results.numTotalTests
    this.performanceData.summary.passedTests = results.numPassedTests
    this.performanceData.summary.failedTests = results.numFailedTests

    results.testResults.forEach((testResult) => {
      this.processTestSuite(testResult)
    })

    this.calculateSummary()
    this.generateReport()

    return results
  }

  processTestSuite(testResult) {
    const suiteData = {
      filePath: testResult.testFilePath,
      testResults: [],
      performance: {
        totalTime: 0,
        averageTestTime: 0,
        slowTests: [],
        memoryTests: [],
        frameRateTests: [],
      },
    }

    testResult.testResults.forEach((test) => {
      const testData = this.processIndividualTest(test)
      suiteData.testResults.push(testData)
      suiteData.performance.totalTime += testData.duration || 0
    })

    suiteData.performance.averageTestTime = 
      suiteData.performance.totalTime / Math.max(suiteData.testResults.length, 1)

    // Identify performance-related tests
    suiteData.testResults.forEach((test) => {
      if (this.isPerformanceTest(test)) {
        this.performanceData.summary.performanceTests++

        if (test.duration > 1000) { // Tests taking over 1 second
          suiteData.performance.slowTests.push(test)
        }

        if (test.title.toLowerCase().includes('memory')) {
          suiteData.performance.memoryTests.push(test)
        }

        if (test.title.toLowerCase().includes('fps') || test.title.toLowerCase().includes('frame')) {
          suiteData.performance.frameRateTests.push(test)
        }
      }
    })

    this.performanceData.testSuites.push(suiteData)
  }

  processIndividualTest(test) {
    return {
      title: test.title,
      status: test.status,
      duration: test.duration,
      failureMessages: test.failureMessages,
      ancestorTitles: test.ancestorTitles,
      fullName: test.fullName,
      location: test.location,
    }
  }

  isPerformanceTest(test) {
    const performanceKeywords = [
      'performance', 'fps', 'frame', 'memory', 'leak', 'throttle', 
      '60 fps', 'animation', 'smooth', 'efficient'
    ]

    const testName = `${test.ancestorTitles.join(' ')} ${test.title}`.toLowerCase()
    return performanceKeywords.some(keyword => testName.includes(keyword))
  }

  calculateSummary() {
    const { testSuites } = this.performanceData

    // Calculate average test time across all suites
    const totalTime = testSuites.reduce((sum, suite) => sum + suite.performance.totalTime, 0)
    const totalTestCount = testSuites.reduce((sum, suite) => sum + suite.testResults.length, 0)
    this.performanceData.summary.averageTestTime = totalTime / Math.max(totalTestCount, 1)

    // Count performance issues
    this.performanceData.summary.memoryLeaks = testSuites.reduce(
      (sum, suite) => sum + suite.performance.memoryTests.filter(test => test.status === 'failed').length, 
      0
    )

    this.performanceData.summary.frameRateIssues = testSuites.reduce(
      (sum, suite) => sum + suite.performance.frameRateTests.filter(test => test.status === 'failed').length,
      0
    )
  }

  generateReport() {
    const reportPath = path.join(process.cwd(), 'coverage', 'drag-drop', 'performance-report.json')
    const reportDir = path.dirname(reportPath)

    // Ensure directory exists
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true })
    }

    // Write detailed performance report
    fs.writeFileSync(reportPath, JSON.stringify(this.performanceData, null, 2))

    // Generate human-readable summary
    this.generateTextReport(reportDir)

    console.log('\n📊 Performance Test Summary:')
    console.log(`   Total Tests: ${this.performanceData.summary.totalTests}`)
    console.log(`   Performance Tests: ${this.performanceData.summary.performanceTests}`)
    console.log(`   Average Test Time: ${this.performanceData.summary.averageTestTime.toFixed(2)}ms`)
    console.log(`   Memory Leak Issues: ${this.performanceData.summary.memoryLeaks}`)
    console.log(`   Frame Rate Issues: ${this.performanceData.summary.frameRateIssues}`)
    console.log(`   Report saved to: ${reportPath}`)
  }

  generateTextReport(reportDir) {
    const textReportPath = path.join(reportDir, 'performance-summary.txt')
    const { summary, testSuites } = this.performanceData

    let report = `
# Drag-and-Drop Performance Test Report
Generated: ${this.performanceData.timestamp}

## Summary
- Total Tests: ${summary.totalTests}
- Passed: ${summary.passedTests}
- Failed: ${summary.failedTests}
- Performance Tests: ${summary.performanceTests}
- Average Test Duration: ${summary.averageTestTime.toFixed(2)}ms
- Memory Leak Issues: ${summary.memoryLeaks}
- Frame Rate Issues: ${summary.frameRateIssues}

## Performance Analysis by Test Suite
`

    testSuites.forEach((suite) => {
      const relativePath = path.relative(process.cwd(), suite.filePath)
      report += `
### ${relativePath}
- Total Time: ${suite.performance.totalTime.toFixed(2)}ms
- Average per Test: ${suite.performance.averageTestTime.toFixed(2)}ms
- Slow Tests (>1s): ${suite.performance.slowTests.length}
- Memory Tests: ${suite.performance.memoryTests.length}
- Frame Rate Tests: ${suite.performance.frameRateTests.length}
`

      // List slow tests
      if (suite.performance.slowTests.length > 0) {
        report += '\n#### Slow Tests:\n'
        suite.performance.slowTests.forEach((test) => {
          report += `  - ${test.fullName}: ${test.duration.toFixed(2)}ms\n`
        })
      }

      // List failed performance tests
      const failedPerfTests = suite.testResults.filter(
        test => test.status === 'failed' && this.isPerformanceTest(test)
      )
      
      if (failedPerfTests.length > 0) {
        report += '\n#### Failed Performance Tests:\n'
        failedPerfTests.forEach((test) => {
          report += `  - ${test.fullName}\n`
          if (test.failureMessages.length > 0) {
            report += `    Error: ${test.failureMessages[0].split('\n')[0]}\n`
          }
        })
      }
    })

    report += `
## Recommendations

### Performance Optimization:
${summary.averageTestTime > 100 ? '- ⚠️  Average test time is high (>100ms). Consider optimizing test setup.' : '- ✅ Test performance is good.'}
${summary.frameRateIssues > 0 ? `- ⚠️  ${summary.frameRateIssues} frame rate issues found. Review 60 FPS requirements.` : '- ✅ No frame rate issues detected.'}
${summary.memoryLeaks > 0 ? `- ⚠️  ${summary.memoryLeaks} memory leak issues found. Review cleanup procedures.` : '- ✅ No memory leaks detected.'}

### Test Suite Health:
${summary.failedTests === 0 ? '- ✅ All tests passing.' : `- ⚠️  ${summary.failedTests} failed tests require attention.`}
${summary.performanceTests > 0 ? `- ✅ ${summary.performanceTests} performance tests provide good coverage.` : '- ⚠️  Consider adding more performance tests.'}

---
Report generated by Task-004 Drag-and-Drop Performance Processor
`

    fs.writeFileSync(textReportPath, report)
  }
}

// Export processor function for Jest
module.exports = (results) => {
  const processor = new PerformanceProcessor()
  return processor.processResults(results)
}
