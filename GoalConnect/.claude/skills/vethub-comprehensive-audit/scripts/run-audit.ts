#!/usr/bin/env tsx
/**
 * VetHub Comprehensive Audit Script
 *
 * Systematically tests all VetHub features and generates a detailed report
 * of what's working and what's broken.
 */

import { writeFileSync } from 'fs';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

interface TestResult {
  category: string;
  testName: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message?: string;
  error?: string;
  details?: any;
}

const results: TestResult[] = [];

function log(category: string, testName: string, status: 'PASS' | 'FAIL' | 'SKIP', message?: string, error?: any) {
  const result: TestResult = { category, testName, status, message };
  if (error) {
    result.error = error.message || String(error);
    result.details = error.stack;
  }
  results.push(result);

  const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏭️';
  console.log(`${emoji} [${category}] ${testName}${message ? ': ' + message : ''}`);
  if (error) {
    console.error(`   Error: ${error.message || String(error)}`);
  }
}

async function testAPIEndpoint(method: string, path: string, body?: any): Promise<{ ok: boolean; status: number; data?: any; error?: string }> {
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
    });

    const text = await response.text();
    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }

    return {
      ok: response.ok,
      status: response.status,
      data,
    };
  } catch (error: any) {
    return {
      ok: false,
      status: 0,
      error: error.message,
    };
  }
}

async function test1_PatientDataLoading() {
  const category = '1. Patient Data Loading';

  // Test GET /api/patients
  try {
    const result = await testAPIEndpoint('GET', '/api/patients');
    if (result.ok && Array.isArray(result.data)) {
      log(category, 'GET /api/patients', 'PASS', `Loaded ${result.data.length} patients`);
    } else {
      log(category, 'GET /api/patients', 'FAIL', `Expected array, got ${typeof result.data}`, result.error);
    }
  } catch (error) {
    log(category, 'GET /api/patients', 'FAIL', 'Request failed', error);
  }

  // Test patient has type field
  try {
    const result = await testAPIEndpoint('GET', '/api/patients');
    if (result.ok && Array.isArray(result.data) && result.data.length > 0) {
      const patient = result.data[0];
      if ('type' in patient) {
        log(category, 'Patient type field exists', 'PASS', `Type: ${patient.type}`);
      } else {
        log(category, 'Patient type field exists', 'FAIL', 'type field missing from patient object');
      }
    } else {
      log(category, 'Patient type field exists', 'SKIP', 'No patients to check');
    }
  } catch (error) {
    log(category, 'Patient type field exists', 'FAIL', 'Could not check', error);
  }
}

async function test2_PatientCRUD() {
  const category = '2. Patient CRUD Operations';

  let createdPatientId: number | null = null;

  // Test POST /api/patients (Create)
  try {
    const testPatient = {
      demographics: {
        name: 'Audit Test Patient',
        species: 'Canine',
        breed: 'Test Breed',
        age: '5',
        sex: 'M',
        weight: 25,
      },
      status: 'Active',
      type: 'Medical',
    };

    const result = await testAPIEndpoint('POST', '/api/patients', testPatient);
    if (result.ok && result.data && result.data.id) {
      createdPatientId = result.data.id;
      log(category, 'POST /api/patients', 'PASS', `Created patient ID: ${createdPatientId}`);
    } else {
      log(category, 'POST /api/patients', 'FAIL', `Status: ${result.status}`, result.error || result.data);
    }
  } catch (error) {
    log(category, 'POST /api/patients', 'FAIL', 'Request failed', error);
  }

  // Test PUT /api/patients/:id (Update)
  if (createdPatientId) {
    try {
      const updateData = { type: 'Surgery' };
      const result = await testAPIEndpoint('PUT', `/api/patients/${createdPatientId}`, updateData);
      if (result.ok) {
        log(category, 'PUT /api/patients/:id', 'PASS', `Updated patient ${createdPatientId} type to Surgery`);
      } else {
        log(category, 'PUT /api/patients/:id', 'FAIL', `Status: ${result.status}`, result.error || result.data);
      }
    } catch (error) {
      log(category, 'PUT /api/patients/:id', 'FAIL', 'Request failed', error);
    }
  } else {
    log(category, 'PUT /api/patients/:id', 'SKIP', 'No patient created to update');
  }

  // Test DELETE /api/patients/:id
  if (createdPatientId) {
    try {
      const result = await testAPIEndpoint('DELETE', `/api/patients/${createdPatientId}`);
      if (result.ok) {
        log(category, 'DELETE /api/patients/:id', 'PASS', `Deleted patient ${createdPatientId}`);
      } else {
        log(category, 'DELETE /api/patients/:id', 'FAIL', `Status: ${result.status}`, result.error || result.data);
      }
    } catch (error) {
      log(category, 'DELETE /api/patients/:id', 'FAIL', 'Request failed', error);
    }
  } else {
    log(category, 'DELETE /api/patients/:id', 'SKIP', 'No patient created to delete');
  }
}

async function test3_TaskManagement() {
  const category = '3. Task Management';

  // First get a patient to add tasks to
  try {
    const patientsResult = await testAPIEndpoint('GET', '/api/patients');
    if (!patientsResult.ok || !Array.isArray(patientsResult.data) || patientsResult.data.length === 0) {
      log(category, 'Task creation', 'SKIP', 'No patients available for task testing');
      return;
    }

    const patientId = patientsResult.data[0].id;

    // Test POST /api/patients/:id/tasks
    try {
      const testTask = {
        title: 'Audit Test Task',
        description: 'Morning medication',
        category: 'medication',
        timeOfDay: 'morning',
        priority: 1,
        completed: false,
      };

      const result = await testAPIEndpoint('POST', `/api/patients/${patientId}/tasks`, testTask);
      if (result.ok && result.data && result.data.id) {
        log(category, 'POST /api/patients/:id/tasks', 'PASS', `Created task ID: ${result.data.id}`);

        // Test DELETE task
        const deleteResult = await testAPIEndpoint('DELETE', `/api/patients/${patientId}/tasks/${result.data.id}`);
        if (deleteResult.ok) {
          log(category, 'DELETE /api/patients/:id/tasks/:taskId', 'PASS', `Deleted task ${result.data.id}`);
        } else {
          log(category, 'DELETE /api/patients/:id/tasks/:taskId', 'FAIL', `Status: ${deleteResult.status}`);
        }
      } else {
        log(category, 'POST /api/patients/:id/tasks', 'FAIL', `Status: ${result.status}`, result.error || result.data);
      }
    } catch (error) {
      log(category, 'POST /api/patients/:id/tasks', 'FAIL', 'Request failed', error);
    }
  } catch (error) {
    log(category, 'Task management', 'FAIL', 'Failed to setup', error);
  }
}

async function test4_TaskAutoCreation() {
  const category = '4. Task Auto-Creation';

  try {
    const patientsResult = await testAPIEndpoint('GET', '/api/patients');
    if (!patientsResult.ok || !Array.isArray(patientsResult.data)) {
      log(category, 'Task auto-creation', 'SKIP', 'No patients available');
      return;
    }

    // Create a patient with type MRI to trigger auto-task creation
    const testPatient = {
      demographics: {
        name: 'MRI Auto Task Test',
        species: 'Canine',
        breed: 'Test',
        age: '3',
        sex: 'F',
        weight: 20,
      },
      status: 'Active',
      type: 'MRI',
    };

    const createResult = await testAPIEndpoint('POST', '/api/patients', testPatient);
    if (createResult.ok && createResult.data && createResult.data.id) {
      const patientId = createResult.data.id;

      // Get patient with tasks
      const patientResult = await testAPIEndpoint('GET', `/api/patients/${patientId}`);
      if (patientResult.ok && patientResult.data) {
        const tasks = patientResult.data.tasks || [];
        if (tasks.length > 0) {
          log(category, 'MRI tasks auto-created', 'PASS', `${tasks.length} tasks created`);
        } else {
          log(category, 'MRI tasks auto-created', 'FAIL', 'No tasks were auto-created for MRI patient');
        }
      }

      // Cleanup
      await testAPIEndpoint('DELETE', `/api/patients/${patientId}`);
    } else {
      log(category, 'Task auto-creation', 'FAIL', 'Could not create test patient');
    }
  } catch (error) {
    log(category, 'Task auto-creation', 'FAIL', 'Test failed', error);
  }
}

async function test5_VetRadarParsing() {
  const category = '5. VetRadar Integration';

  // Test VetRadar login endpoint exists
  try {
    const result = await testAPIEndpoint('POST', '/api/vetradar/login', {
      email: 'test@example.com',
      password: 'test',
    });

    // We expect this to fail with 401 or similar, but endpoint should exist
    if (result.status === 404) {
      log(category, 'VetRadar login endpoint', 'FAIL', 'Endpoint not found (404)');
    } else {
      log(category, 'VetRadar login endpoint', 'PASS', `Endpoint exists (status: ${result.status})`);
    }
  } catch (error) {
    log(category, 'VetRadar login endpoint', 'FAIL', 'Request failed', error);
  }
}

async function test6_DatabaseHealth() {
  const category = '6. Database Health';

  // Test that we can query the database
  try {
    const result = await testAPIEndpoint('GET', '/api/patients');
    if (result.ok) {
      log(category, 'Database connectivity', 'PASS', 'Database queries working');
    } else {
      log(category, 'Database connectivity', 'FAIL', 'Database query failed', result.error);
    }
  } catch (error) {
    log(category, 'Database connectivity', 'FAIL', 'Database unreachable', error);
  }
}

async function test7_ApplicationHealth() {
  const category = '7. Application Health';

  // Test homepage loads
  try {
    const response = await fetch(BASE_URL);
    if (response.ok) {
      log(category, 'Homepage loads', 'PASS', `Status: ${response.status}`);
    } else {
      log(category, 'Homepage loads', 'FAIL', `Status: ${response.status}`);
    }
  } catch (error) {
    log(category, 'Homepage loads', 'FAIL', 'Request failed', error);
  }

  // Test API routes are accessible
  try {
    const result = await testAPIEndpoint('GET', '/api/patients');
    if (result.status !== 404) {
      log(category, 'API routes accessible', 'PASS', 'API is responding');
    } else {
      log(category, 'API routes accessible', 'FAIL', 'API returned 404');
    }
  } catch (error) {
    log(category, 'API routes accessible', 'FAIL', 'API unreachable', error);
  }
}

async function generateReport() {
  const passCount = results.filter(r => r.status === 'PASS').length;
  const failCount = results.filter(r => r.status === 'FAIL').length;
  const skipCount = results.filter(r => r.status === 'SKIP').length;
  const total = results.length;
  const healthScore = Math.round((passCount / (total - skipCount)) * 100) || 0;

  const report = `# VetHub Comprehensive Audit Report

**Generated:** ${new Date().toISOString()}
**Test URL:** ${BASE_URL}
**Health Score:** ${healthScore}% (${passCount}/${total - skipCount} tests passing)

## Summary

- ✅ **PASS:** ${passCount}
- ❌ **FAIL:** ${failCount}
- ⏭️ **SKIP:** ${skipCount}
- **Total Tests:** ${total}

---

## Test Results by Category

${Array.from(new Set(results.map(r => r.category))).map(category => {
  const categoryResults = results.filter(r => r.category === category);
  const categoryPass = categoryResults.filter(r => r.status === 'PASS').length;
  const categoryFail = categoryResults.filter(r => r.status === 'FAIL').length;
  const categorySkip = categoryResults.filter(r => r.status === 'SKIP').length;

  return `### ${category}

**Status:** ${categoryFail === 0 ? '✅ PASSING' : '❌ FAILING'} (${categoryPass}/${categoryResults.length - categorySkip} tests)

${categoryResults.map(r => {
    const emoji = r.status === 'PASS' ? '✅' : r.status === 'FAIL' ? '❌' : '⏭️';
    let output = `- ${emoji} **${r.testName}**`;
    if (r.message) output += `: ${r.message}`;
    if (r.error) output += `\n  \`\`\`\n  ${r.error}\n  \`\`\``;
    return output;
  }).join('\n')}
`;
}).join('\n---\n\n')}

## Critical Failures

${results.filter(r => r.status === 'FAIL').map(r =>
  `### ${r.category} - ${r.testName}

**Error:** ${r.error || 'Unknown error'}

${r.details ? `\`\`\`\n${r.details}\n\`\`\`` : ''}
`
).join('\n') || 'None'}

## Recommendations

${failCount === 0 ? '🎉 All tests passing! Application is healthy.' : `
### Immediate Actions Required

${results.filter(r => r.status === 'FAIL').map(r => `1. **Fix ${r.testName}** in ${r.category}`).join('\n')}

### Root Cause Analysis

Based on the failures:

${results.some(r => r.status === 'FAIL' && r.error?.includes('type')) ?
  '- **Database Schema Issue:** The patient.type column appears to be missing. Run the manual SQL migration:\n  \`\`\`sql\n  ALTER TABLE "Patient" ADD COLUMN "type" TEXT DEFAULT \'Medical\';\n  \`\`\`\n' : ''}
${results.some(r => r.status === 'FAIL' && r.error?.includes('ECONNREFUSED')) ?
  '- **Server Connectivity:** The application server is not running or unreachable.\n' : ''}
${results.some(r => r.status === 'FAIL' && r.error?.includes('404')) ?
  '- **Missing Endpoints:** Some API routes are not implemented or misconfigured.\n' : ''}
`}

## Next Steps

1. Address critical failures first (database schema, connectivity)
2. Re-run audit after fixes: \`npx tsx .claude/skills/vethub-comprehensive-audit/scripts/run-audit.ts\`
3. Verify in production environment
4. Update documentation with any changes

---

*Generated by VetHub Comprehensive Audit Skill*
`;

  writeFileSync('vethub-audit-report.md', report);
  console.log('\n📊 Audit report generated: vethub-audit-report.md');
  console.log(`\n🏆 Health Score: ${healthScore}% (${passCount}/${total - skipCount} passing)\n`);
}

async function main() {
  console.log('🔍 VetHub Comprehensive Audit Starting...\n');
  console.log(`Testing: ${BASE_URL}\n`);

  await test1_PatientDataLoading();
  await test2_PatientCRUD();
  await test3_TaskManagement();
  await test4_TaskAutoCreation();
  await test5_VetRadarParsing();
  await test6_DatabaseHealth();
  await test7_ApplicationHealth();

  await generateReport();
}

main().catch(console.error);
