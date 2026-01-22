/**
 * Authentication & Authorization Penetration Tests
 * Tests for JWT manipulation, session hijacking, and privilege escalation
 */

const axios = require('axios');
const jwt = require('jsonwebtoken');

const BASE_URL = process.env.API_URL || 'http://localhost:5000';

// Create axios instance with timeout
const axiosInstance = axios.create({
    timeout: 10000,
    maxRedirects: 5,
    validateStatus: () => true
});

class AuthenticationPentester {
    constructor() {
        this.results = [];
        this.vulnerabilities = [];
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    log(message, type = 'INFO') {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [${type}] ${message}`);
        this.results.push({ timestamp, type, message });
    }

    logVulnerability(severity, area, description, details) {
        this.log(`🚨 VULNERABILITY FOUND: ${description}`, 'CRITICAL');
        this.vulnerabilities.push({
            severity,
            area,
            description,
            details,
            timestamp: new Date().toISOString()
        });
    }

    async createTestUser(role = 'user') {
        const timestamp = Date.now();
        const email = `authtest${timestamp}@test.com`;
        const password = 'AuthTest123!';

        try {
            await axiosInstance.post(`${BASE_URL}/api/auth/register`, {
                username: email,
                password,
                name: `Auth Tester ${role}`
            });

            const loginResponse = await axiosInstance.post(`${BASE_URL}/api/auth/login`, {
                username: email,
                password
            });

            return {
                email,
                password,
                token: loginResponse.data.token,
                userId: loginResponse.data.userId
            };
        } catch (error) {
            this.log(`Failed to create test user: ${error.message}`, 'ERROR');
            return null;
        }
    }

    // JWT Token Manipulation Tests
    async testJWTManipulation() {
        this.log('Starting JWT Token Manipulation Tests', 'TEST');

        const user = await this.createTestUser();
        if (!user) return;

        try {
            // Decode the real token to understand its structure
            const decoded = jwt.decode(user.token, { complete: true });
            this.log(`Token structure: ${JSON.stringify(decoded?.payload)}`, 'INFO');

            // Test 1: Algorithm None Attack
            const noneToken = jwt.sign(decoded.payload, '', { algorithm: 'none' });
            await this.testTokenAtEndpoint(noneToken, 'Algorithm None Attack');

            // Test 2: Modify user role in token
            if (decoded?.payload) {
                const modifiedPayload = { ...decoded.payload, role: 'admin', isAdmin: true };
                
                // Try with weak secrets
                const weakSecrets = ['secret', 'password', '123456', 'admin', 'test', ''];
                for (const secret of weakSecrets) {
                    try {
                        const weakToken = jwt.sign(modifiedPayload, secret);
                        const result = await this.testTokenAtEndpoint(weakToken, 
                            `Weak secret (${secret}) with admin role`);
                        
                        if (result.success) {
                            this.logVulnerability('CRITICAL', 'JWT Security',
                                'JWT signed with weak secret accepted',
                                { secret, modifiedRole: 'admin' });
                        }
                    } catch (error) {
                        // Expected
                    }
                }

                // Test 3: Expired token
                const expiredPayload = { ...decoded.payload, exp: Math.floor(Date.now() / 1000) - 3600 };
                const expiredToken = jwt.sign(expiredPayload, 'secret');
                await this.testTokenAtEndpoint(expiredToken, 'Expired token');

                // Test 4: Modified user ID
                const modifiedUserPayload = { ...decoded.payload, userId: 1, sub: '1' };
                const modifiedUserToken = jwt.sign(modifiedUserPayload, 'secret');
                await this.testTokenAtEndpoint(modifiedUserToken, 'Modified user ID');
            }

            // Test 5: Token reuse after logout (if logout endpoint exists)
            try {
                await axiosInstance.post(`${BASE_URL}/api/auth/logout`, {}, {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                });

                const reusedResult = await this.testTokenAtEndpoint(user.token, 
                    'Token reuse after logout');
                
                if (reusedResult.success) {
                    this.logVulnerability('HIGH', 'Session Management',
                        'Token still valid after logout',
                        { token: user.token.substring(0, 20) + '...' });
                }
            } catch (error) {
                // Logout might not exist
            }

        } catch (error) {
            this.log(`JWT manipulation test error: ${error.message}`, 'ERROR');
        }

        this.log('JWT Token Manipulation Tests Completed', 'TEST');
    }

    async testTokenAtEndpoint(token, testName) {
        try {
            const response = await axiosInstance.get(`${BASE_URL}/api/users/me`, {
                headers: { 'Authorization': `Bearer ${token}` },
                validateStatus: () => true
            });

            if (response.status === 200) {
                this.log(`⚠️  ${testName}: Token accepted!`, 'WARN');
                return { success: true, response };
            }
            return { success: false };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Privilege Escalation Tests
    async testPrivilegeEscalation() {
        this.log('Starting Privilege Escalation Tests', 'TEST');

        const regularUser = await this.createTestUser('user');
        if (!regularUser) return;

        // Test accessing admin endpoints
        const adminEndpoints = [
            { method: 'GET', path: '/api/admin/users' },
            { method: 'POST', path: '/api/admin/users' },
            { method: 'DELETE', path: '/api/admin/users/1' },
            { method: 'PUT', path: '/api/admin/users/1' },
            { method: 'GET', path: '/api/admin/settings' },
            { method: 'POST', path: '/api/admin/settings' },
            { method: 'GET', path: '/api/moderator/queue' },
            { method: 'POST', path: '/api/moderator/approve/1' }
        ];

        for (const endpoint of adminEndpoints) {
            try {
                const response = await axios({
                    method: endpoint.method,
                    url: `${BASE_URL}${endpoint.path}`,
                    headers: { 'Authorization': `Bearer ${regularUser.token}` },
                    validateStatus: () => true
                });

                if (response.status === 200 || response.status === 201) {
                    this.logVulnerability('CRITICAL', 'Authorization',
                        `Regular user can access admin endpoint: ${endpoint.path}`,
                        { method: endpoint.method, status: response.status });
                }
            } catch (error) {
                // Expected
            }
        }

        // Test modifying other users' data
        try {
            const response = await axiosInstance.put(
                `${BASE_URL}/api/users/1`,
                { displayName: 'Hacked', role: 'admin' },
                {
                    headers: { 'Authorization': `Bearer ${regularUser.token}` },
                    validateStatus: () => true
                }
            );

            if (response.status === 200) {
                this.logVulnerability('CRITICAL', 'Authorization',
                    'User can modify other users data',
                    { targetUserId: 1 });
            }
        } catch (error) {
            // Expected
        }

        // Test role manipulation in update profile
        try {
            const response = await axiosInstance.put(
                `${BASE_URL}/api/users/me`,
                { role: 'admin', isAdmin: true },
                {
                    headers: { 'Authorization': `Bearer ${regularUser.token}` },
                    validateStatus: () => true
                }
            );

            if (response.status === 200 && response.data?.role === 'admin') {
                this.logVulnerability('CRITICAL', 'Authorization',
                    'User can elevate their own privileges',
                    { oldRole: 'user', newRole: 'admin' });
            }
        } catch (error) {
            // Expected
        }

        this.log('Privilege Escalation Tests Completed', 'TEST');
    }

    // Session Management Tests
    async testSessionManagement() {
        this.log('Starting Session Management Tests', 'TEST');

        const user = await this.createTestUser();
        if (!user) return;

        // Test 1: Session fixation
        const fixedToken = 'fixed_session_token_12345';
        try {
            const response = await axiosInstance.get(`${BASE_URL}/api/users/me`, {
                headers: { 'Authorization': `Bearer ${fixedToken}` },
                validateStatus: () => true
            });

            if (response.status === 200) {
                this.logVulnerability('HIGH', 'Session Management',
                    'Session fixation possible - predictable token accepted',
                    { fixedToken });
            }
        } catch (error) {
            // Expected
        }

        // Test 2: Concurrent sessions
        const login1 = await axiosInstance.post(`${BASE_URL}/api/auth/login`, {
            username: user.email,
            password: user.password
        });

        const login2 = await axiosInstance.post(`${BASE_URL}/api/auth/login`, {
            username: user.email,
            password: user.password
        });

        // Both tokens should be valid (or old one should be invalidated)
        const test1 = await this.testTokenAtEndpoint(login1.data.token, 'First session');
        const test2 = await this.testTokenAtEndpoint(login2.data.token, 'Second session');

        if (test1.success && test2.success) {
            this.log('Multiple concurrent sessions allowed', 'INFO');
        }

        // Test 3: Token in URL (if applicable)
        try {
            const response = await axiosInstance.get(
                `${BASE_URL}/api/users/me?token=${user.token}`,
                { validateStatus: () => true }
            );

            if (response.status === 200) {
                this.logVulnerability('HIGH', 'Session Management',
                    'Authentication token accepted in URL parameter',
                    { risk: 'Token exposure in logs' });
            }
        } catch (error) {
            // Expected
        }

        this.log('Session Management Tests Completed', 'TEST');
    }

    // Password Security Tests
    async testPasswordSecurity() {
        this.log('Starting Password Security Tests', 'TEST');

        const weakPasswords = [
            '123456',
            'password',
            '12345678',
            'qwerty',
            'abc123',
            'password1',
            'admin'
        ];

        for (const password of weakPasswords) {
            try {
                const username = `weakpass${Date.now()}`;
                const response = await axiosInstance.post(`${BASE_URL}/api/auth/register`, {
                    username,
                    password,
                    name: 'Weak Pass Test'
                }, { validateStatus: () => true });

                if (response.status === 200 || response.status === 201) {
                    this.logVulnerability('MEDIUM', 'Password Policy',
                        `Weak password accepted: ${password}`,
                        { password });
                }
            } catch (error) {
                // Expected
            }
        }

        // Test password reset without rate limiting
        let resetSuccessCount = 0;
        for (let i = 0; i < 20; i++) {
            try {
                const response = await axiosInstance.post(
                    `${BASE_URL}/api/auth/forgot-password`,
                    { email: 'test@test.com' },
                    { validateStatus: () => true }
                );

                if (response.status === 200) {
                    resetSuccessCount++;
                }
            } catch (error) {
                // Continue
            }
        }

        if (resetSuccessCount > 10) {
            this.logVulnerability('MEDIUM', 'Password Reset',
                'No rate limiting on password reset',
                { attempts: 20, successful: resetSuccessCount });
        }

        this.log('Password Security Tests Completed', 'TEST');
    }

    // Brute Force Tests
    async testBruteForceProtection() {
        this.log('Starting Brute Force Protection Tests', 'TEST');

        const username = `bruteforce${Date.now()}`;
        const password = 'BruteForce123!';

        // Create user
        await axiosInstance.post(`${BASE_URL}/api/auth/register`, {
            username,
            password,
            name: 'Brute Force Test'
        });

        // Attempt multiple failed logins
        let failedAttempts = 0;
        let blockedAttempts = 0;

        for (let i = 0; i < 30; i++) {
            try {
                const response = await axiosInstance.post(
                    `${BASE_URL}/api/auth/login`,
                    { username, password: 'wrongpassword' },
                    { validateStatus: () => true }
                );

                if (response.status === 401) {
                    failedAttempts++;
                } else if (response.status === 429) {
                    blockedAttempts++;
                }
            } catch (error) {
                // Continue
            }
        }

        if (blockedAttempts === 0) {
            this.logVulnerability('MEDIUM', 'Brute Force',
                'No account lockout after multiple failed login attempts',
                { attempts: 30, failed: failedAttempts, blocked: blockedAttempts });
        }

        this.log('Brute Force Protection Tests Completed', 'TEST');
    }

    // CORS and CSRF Tests
    async testCORSAndCSRF() {
        this.log('Starting CORS and CSRF Tests', 'TEST');

        try {
            // Test CORS with malicious origin
            const response = await axiosInstance.get(`${BASE_URL}/api/users/me`, {
                headers: { 'Origin': 'http://evil.com' },
                validateStatus: () => true
            });

            const corsHeader = response.headers['access-control-allow-origin'];
            if (corsHeader === '*' || corsHeader === 'http://evil.com') {
                this.logVulnerability('MEDIUM', 'CORS',
                    'Permissive CORS policy',
                    { allowedOrigin: corsHeader });
            }

            // Test CSRF token requirement
            const user = await this.createTestUser();
            if (user) {
                const csrfResponse = await axiosInstance.post(
                    `${BASE_URL}/api/listings`,
                    { title: 'CSRF Test', price: 100 },
                    {
                        headers: { 
                            'Authorization': `Bearer ${user.token}`,
                            'Origin': 'http://evil.com'
                        },
                        validateStatus: () => true
                    }
                );

                if (csrfResponse.status === 200 || csrfResponse.status === 201) {
                    this.logVulnerability('MEDIUM', 'CSRF',
                        'No CSRF protection on state-changing operations',
                        { endpoint: '/api/listings' });
                }
            }
        } catch (error) {
            this.log(`CORS/CSRF test error: ${error.message}`, 'ERROR');
        }

        this.log('CORS and CSRF Tests Completed', 'TEST');
    }

    // Generate Report
    generateReport() {
        console.log('\n' + '='.repeat(80));
        console.log('AUTHENTICATION & AUTHORIZATION PENETRATION TEST REPORT');
        console.log('='.repeat(80));
        console.log(`Report Generated: ${new Date().toISOString()}`);
        console.log(`Target: ${BASE_URL}`);
        console.log('='.repeat(80));

        if (this.vulnerabilities.length === 0) {
            console.log('\n✅ No authentication/authorization vulnerabilities detected!');
        } else {
            console.log(`\n🚨 VULNERABILITIES FOUND: ${this.vulnerabilities.length}\n`);
            
            const critical = this.vulnerabilities.filter(v => v.severity === 'CRITICAL');
            const high = this.vulnerabilities.filter(v => v.severity === 'HIGH');
            const medium = this.vulnerabilities.filter(v => v.severity === 'MEDIUM');

            console.log(`Critical: ${critical.length}`);
            console.log(`High: ${high.length}`);
            console.log(`Medium: ${medium.length}\n`);

            this.vulnerabilities.forEach((vuln, index) => {
                console.log(`${index + 1}. [${vuln.severity}] ${vuln.area}`);
                console.log(`   ${vuln.description}`);
                console.log(`   Details: ${JSON.stringify(vuln.details)}\n`);
            });
        }

        console.log('='.repeat(80));

        // Save report
        const fs = require('fs');
        const reportPath = `auth-security-report-${Date.now()}.json`;
        fs.writeFileSync(reportPath, JSON.stringify({
            timestamp: new Date().toISOString(),
            target: BASE_URL,
            vulnerabilities: this.vulnerabilities,
            summary: {
                total: this.vulnerabilities.length,
                critical: critical.length,
                high: high.length,
                medium: medium.length
            }
        }, null, 2));

        console.log(`\nDetailed report saved to: ${reportPath}`);
    }

    async runAllTests() {
        console.log('🔐 Starting Authentication & Authorization Penetration Tests');
        console.log(`Target: ${BASE_URL}\n`);

        await this.testJWTManipulation();
        await this.testPrivilegeEscalation();
        await this.testSessionManagement();
        await this.testPasswordSecurity();
        await this.testBruteForceProtection();
        await this.testCORSAndCSRF();

        this.generateReport();
    }
}

// Run tests
if (require.main === module) {
    const tester = new AuthenticationPentester();
    tester.runAllTests().catch(error => {
        console.error('Test execution failed:', error);
        process.exit(1);
    });
}

module.exports = AuthenticationPentester;
