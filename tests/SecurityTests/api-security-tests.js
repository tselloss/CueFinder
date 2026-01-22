/**
 * API Security Penetration Tests
 * Tests for SQL injection, authentication bypass, and input validation vulnerabilities
 */

const axios = require('axios');
const FormData = require('form-data');

const BASE_URL = process.env.API_URL || 'http://localhost:5000';

// Create axios instance with timeout
const axiosInstance = axios.create({
    timeout: 10000, // 10 second timeout
    maxRedirects: 5,
    validateStatus: () => true // Don't throw on any status
});

class APISecurityTester {
    constructor() {
        this.results = [];
        this.vulnerabilities = [];
        this.rateLimitHit = false;
    }

    log(message, type = 'INFO') {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [${type}] ${message}`);
        this.results.push({ timestamp, type, message });
    }

    logVulnerability(severity, endpoint, description, payload) {
        this.log(`🚨 VULNERABILITY FOUND: ${description}`, 'CRITICAL');
        this.vulnerabilities.push({
            severity,
            endpoint,
            description,
            payload,
            timestamp: new Date().toISOString()
        });
    }

    // SQL Injection Tests
    async testSQLInjection() {
        this.log('Starting SQL Injection Tests', 'TEST');
        
        const sqlPayloads = [
            "' OR '1'='1",
            "' OR '1'='1' --",
            "' OR '1'='1' /*",
            "admin'--",
            "' UNION SELECT NULL--",
            "1' AND 1=1--",
            "1' AND 1=2--",
            "' OR 'a'='a",
            "'; DROP TABLE users--",
            "1'; DROP TABLE listings--",
            "' OR 1=1#",
            "1 UNION SELECT username, password FROM users--"
        ];

        // Test login endpoint
        let testedCount = 0;
        for (const payload of sqlPayloads) {
            try {
                this.log(`Testing payload ${++testedCount}/${sqlPayloads.length}: ${payload.substring(0, 30)}...`, 'DEBUG');
                
                const response = await axiosInstance.post(`${BASE_URL}/api/auth/login`, {
                    username: payload,
                    password: payload
                });

                // Check for rate limiting
                if (response.status === 429) {
                    this.log('⚠️  Rate limiting detected - waiting 60 seconds...', 'WARN');
                    this.rateLimitHit = true;
                    await this.sleep(60000);
                    continue;
                }

                if (response.status === 200 || response.data?.token) {
                    this.logVulnerability('CRITICAL', '/api/auth/login', 
                        'SQL Injection in login endpoint', payload);
                }
                
                // Small delay between requests to avoid rate limiting
                await this.sleep(500);
            } catch (error) {
                if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
                    this.log(`⚠️  Request timeout for payload: ${payload.substring(0, 30)}`, 'WARN');
                } else if (error.code === 'ECONNREFUSED') {
                    this.log('❌ Cannot connect to server - is it running?', 'ERROR');
                    break;
                }
                // Other errors are expected
            }
        }

        // Test search/filter endpoints
        const searchEndpoints = [
            '/api/cues/search',
            '/api/cases/search',
            '/api/listings'
        ];

        for (const endpoint of searchEndpoints) {
            this.log(`Testing endpoint: ${endpoint}`, 'DEBUG');
            let endpointTestedCount = 0;
            
            for (const payload of sqlPayloads) {
                try {
                    const response = await axiosInstance.get(`${BASE_URL}${endpoint}`, {
                        params: { query: payload, search: payload }
                    });

                    if (response.status === 429) {
                        this.log('⚠️  Rate limiting detected - waiting 60 seconds...', 'WARN');
                        await this.sleep(60000);
                        continue;
                    }

                    // Check for SQL error messages in response
                    const body = JSON.stringify(response.data).toLowerCase();
                    if (body.includes('sql') || body.includes('syntax') || 
                        body.includes('mysql') || body.includes('postgresql')) {
                        this.logVulnerability('HIGH', endpoint, 
                            'SQL error exposed in response', payload);
                    }
                    
                    endpointTestedCount++;
                    if (endpointTestedCount % 5 === 0) {
                        this.log(`  Tested ${endpointTestedCount}/${sqlPayloads.length} payloads`, 'DEBUG');
                    }
                    
                    await this.sleep(300);
                } catch (error) {
                    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
                        this.log(`⚠️  Timeout for ${endpoint}`, 'WARN');
                    }
                    // Expected errors
                }
            }
        }

        this.log('SQL Injection Tests Completed', 'TEST');
    }
    
    // Helper method for delays
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Authentication Bypass Tests
    async testAuthenticationBypass() {
        this.log('Starting Authentication Bypass Tests', 'TEST');

        // Test protected endpoints without authentication
        const protectedEndpoints = [
            { method: 'GET', path: '/api/users/me' },
            { method: 'POST', path: '/api/listings' },
            { method: 'PUT', path: '/api/listings/1' },
            { method: 'DELETE', path: '/api/listings/1' },
            { method: 'POST', path: '/api/messages' },
            { method: 'GET', path: '/api/messages/inbox' },
            { method: 'POST', path: '/api/admin/users' }
        ];

        for (const endpoint of protectedEndpoints) {
            try {
                const config = {
                    method: endpoint.method,
                    url: `${BASE_URL}${endpoint.path}`,
                    validateStatus: () => true
                };

                const response = await axios(config);

                if (response.status === 200) {
                    this.logVulnerability('CRITICAL', endpoint.path, 
                        'Protected endpoint accessible without authentication', 'No token');
                }
            } catch (error) {
                // Expected
            }
        }

        // Test with malformed tokens
        const malformedTokens = [
            'Bearer invalid',
            'Bearer null',
            'Bearer undefined',
            'Bearer eyJhbGciOiJub25lIn0.eyJzdWIiOiIxMjM0NTY3ODkwIn0.',
            'Bearer .',
            'Bearer ...',
            ''
        ];

        for (const token of malformedTokens) {
            try {
                const response = await axiosInstance.get(`${BASE_URL}/api/users/me`, {
                    headers: { 'Authorization': token },
                    validateStatus: () => true
                });

                if (response.status === 200) {
                    this.logVulnerability('CRITICAL', '/api/users/me', 
                        'Authentication bypass with malformed token', token);
                }
            } catch (error) {
                // Expected
            }
        }

        this.log('Authentication Bypass Tests Completed', 'TEST');
    }

    // Input Validation Tests
    async testInputValidation() {
        this.log('Starting Input Validation Tests', 'TEST');

        // Test XSS payloads
        const xssPayloads = [
            '<script>alert("XSS")</script>',
            '<img src=x onerror=alert("XSS")>',
            '<svg/onload=alert("XSS")>',
            'javascript:alert("XSS")',
            '<iframe src="javascript:alert(\'XSS\')">',
            '<body onload=alert("XSS")>'
        ];

        // Register user with XSS in username
        for (const payload of xssPayloads) {
            try {
                const response = await axiosInstance.post(`${BASE_URL}/api/auth/register`, {
                    username: `test${Date.now()}`,
                    password: 'Test123!',
                    name: payload
                }, { validateStatus: () => true });

                if (response.status === 200 || response.status === 201) {
                    // Check if XSS payload is reflected without sanitization
                    const responseBody = JSON.stringify(response.data);
                    if (responseBody.includes('<script>') || responseBody.includes('onerror=')) {
                        this.logVulnerability('HIGH', '/api/auth/register', 
                            'XSS vulnerability in user registration', payload);
                    }
                }
            } catch (error) {
                // Expected
            }
        }

        // Test buffer overflow with extremely long strings
        const longString = 'A'.repeat(100000);
        try {
            await axiosInstance.post(`${BASE_URL}/api/auth/register`, {
                email: `test${Date.now()}@test.com`,
                password: longString,
                username: longString,
                displayName: longString
            }, { validateStatus: () => true, timeout: 5000 });
        } catch (error) {
            if (error.code === 'ECONNABORTED') {
                this.logVulnerability('MEDIUM', '/api/auth/register', 
                    'Possible DoS with large input', 'Long string');
            }
        }

        this.log('Input Validation Tests Completed', 'TEST');
    }

    // API Rate Limiting Tests
    async testRateLimiting() {
        this.log('Starting Rate Limiting Tests', 'TEST');

        const endpoint = `${BASE_URL}/api/auth/login`;
        const requests = 100;
        let successCount = 0;

        for (let i = 0; i < requests; i++) {
            try {
                const response = await axiosInstance.post(endpoint, {
                    email: 'test@test.com',
                    password: 'wrong'
                }, { validateStatus: () => true });

                if (response.status !== 429) {
                    successCount++;
                }
            } catch (error) {
                // Continue
            }
        }

        if (successCount > 50) {
            this.logVulnerability('MEDIUM', endpoint, 
                `No rate limiting detected. ${successCount}/${requests} requests succeeded`, 
                'Rapid requests');
        }

        this.log('Rate Limiting Tests Completed', 'TEST');
    }

    // IDOR (Insecure Direct Object Reference) Tests
    async testIDOR() {
        this.log('Starting IDOR Tests', 'TEST');

        // Create test user and login
        const testEmail = `pentest${Date.now()}@test.com`;
        const testPassword = 'PenTest123!';

        try {
            await axiosInstance.post(`${BASE_URL}/api/auth/register`, {
                username: testEmail,
                password: testPassword,
                name: 'Pen Tester'
            });

            const loginResponse = await axiosInstance.post(`${BASE_URL}/api/auth/login`, {
                username: testEmail,
                password: testPassword
            });

            const token = loginResponse.data.token;

            // Try accessing other users' data
            const userIds = [1, 2, 3, 4, 5, 100, 999];
            for (const userId of userIds) {
                try {
                    const response = await axiosInstance.get(`${BASE_URL}/api/users/${userId}`, {
                        headers: { 'Authorization': `Bearer ${token}` },
                        validateStatus: () => true
                    });

                    if (response.status === 200 && response.data?.id !== loginResponse.data.userId) {
                        this.logVulnerability('HIGH', `/api/users/${userId}`, 
                            'IDOR: Can access other users data', userId);
                    }
                } catch (error) {
                    // Expected
                }
            }

            // Try accessing/modifying other users' listings
            const listingIds = [1, 2, 3, 4, 5];
            for (const listingId of listingIds) {
                try {
                    const deleteResponse = await axiosInstance.delete(
                        `${BASE_URL}/api/listings/${listingId}`, 
                        {
                            headers: { 'Authorization': `Bearer ${token}` },
                            validateStatus: () => true
                        }
                    );

                    if (deleteResponse.status === 200 || deleteResponse.status === 204) {
                        this.logVulnerability('CRITICAL', `/api/listings/${listingId}`, 
                            'IDOR: Can delete other users listings', listingId);
                    }
                } catch (error) {
                    // Expected
                }
            }

        } catch (error) {
            this.log(`IDOR test setup failed: ${error.message}`, 'ERROR');
        }

        this.log('IDOR Tests Completed', 'TEST');
    }

    // Generate Report
    generateReport() {
        console.log('\n' + '='.repeat(80));
        console.log('API SECURITY PENETRATION TEST REPORT');
        console.log('='.repeat(80));
        console.log(`Report Generated: ${new Date().toISOString()}`);
        console.log(`Target: ${BASE_URL}`);
        console.log('='.repeat(80));

        if (this.vulnerabilities.length === 0) {
            console.log('\n✅ No vulnerabilities detected!');
        } else {
            console.log(`\n🚨 VULNERABILITIES FOUND: ${this.vulnerabilities.length}\n`);
            
            const critical = this.vulnerabilities.filter(v => v.severity === 'CRITICAL');
            const high = this.vulnerabilities.filter(v => v.severity === 'HIGH');
            const medium = this.vulnerabilities.filter(v => v.severity === 'MEDIUM');

            console.log(`Critical: ${critical.length}`);
            console.log(`High: ${high.length}`);
            console.log(`Medium: ${medium.length}\n`);

            this.vulnerabilities.forEach((vuln, index) => {
                console.log(`${index + 1}. [${vuln.severity}] ${vuln.endpoint}`);
                console.log(`   ${vuln.description}`);
                console.log(`   Payload: ${vuln.payload}\n`);
            });
        }

        console.log('='.repeat(80));

        // Save report to file
        const fs = require('fs');
        const reportPath = `security-report-${Date.now()}.json`;
        fs.writeFileSync(reportPath, JSON.stringify({
            timestamp: new Date().toISOString(),
            target: BASE_URL,
            vulnerabilities: this.vulnerabilities,
            summary: {
                total: this.vulnerabilities.length,
                critical: this.vulnerabilities.filter(v => v.severity === 'CRITICAL').length,
                high: this.vulnerabilities.filter(v => v.severity === 'HIGH').length,
                medium: this.vulnerabilities.filter(v => v.severity === 'MEDIUM').length
            }
        }, null, 2));

        console.log(`\nDetailed report saved to: ${reportPath}`);
    }

    async runAllTests() {
        console.log('🔒 Starting API Security Penetration Tests');
        console.log(`Target: ${BASE_URL}\n`);

        await this.testSQLInjection();
        await this.testAuthenticationBypass();
        await this.testInputValidation();
        await this.testRateLimiting();
        await this.testIDOR();

        this.generateReport();
    }
}

// Run tests
if (require.main === module) {
    const tester = new APISecurityTester();
    tester.runAllTests().catch(error => {
        console.error('Test execution failed:', error);
        process.exit(1);
    });
}

module.exports = APISecurityTester;
