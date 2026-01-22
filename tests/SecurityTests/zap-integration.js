/**
 * OWASP ZAP Integration for Automated Security Scanning
 * Requires OWASP ZAP to be installed and running
 * Download from: https://www.zaproxy.org/download/
 */

const ZapClient = require('zaproxy');
const fs = require('fs');

class ZAPSecurityScanner {
    constructor(zapApiKey = 'changeme', zapUrl = 'http://localhost:8080') {
        this.zapUrl = zapUrl;
        this.apiKey = zapApiKey;
        this.targetUrl = process.env.API_URL || 'http://localhost:5000';
        this.zaproxy = new ZapClient({
            apiKey: this.apiKey,
            proxy: zapUrl
        });
        this.scanResults = {
            alerts: [],
            summary: {},
            timestamp: new Date().toISOString()
        };
    }

    log(message, type = 'INFO') {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [${type}] ${message}`);
    }

    async waitForZAP() {
        this.log('Checking if OWASP ZAP is running...', 'INFO');
        let attempts = 0;
        const maxAttempts = 30;

        while (attempts < maxAttempts) {
            try {
                const version = await this.zaproxy.core.version();
                this.log(`Connected to OWASP ZAP version: ${version}`, 'SUCCESS');
                return true;
            } catch (error) {
                attempts++;
                if (attempts >= maxAttempts) {
                    this.log('Failed to connect to OWASP ZAP', 'ERROR');
                    this.log('Please ensure ZAP is running on ' + this.zapUrl, 'ERROR');
                    this.log('Start ZAP with: zap.sh -daemon -port 8080 -config api.key=changeme', 'INFO');
                    return false;
                }
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        return false;
    }

    async spiderScan() {
        this.log(`Starting spider scan on ${this.targetUrl}`, 'SCAN');
        
        try {
            // Start spider
            const scanId = await this.zaproxy.spider.scan(this.targetUrl);
            this.log(`Spider scan started with ID: ${scanId}`, 'INFO');

            // Wait for spider to complete
            let progress = 0;
            while (progress < 100) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                progress = await this.zaproxy.spider.status(scanId);
                this.log(`Spider progress: ${progress}%`, 'INFO');
            }

            // Get spider results
            const urls = await this.zaproxy.spider.results(scanId);
            this.log(`Spider found ${urls.length} URLs`, 'SUCCESS');
            
            return urls;
        } catch (error) {
            this.log(`Spider scan error: ${error.message}`, 'ERROR');
            return [];
        }
    }

    async activeScan() {
        this.log(`Starting active scan on ${this.targetUrl}`, 'SCAN');
        
        try {
            // Start active scan
            const scanId = await this.zaproxy.ascan.scan(this.targetUrl, 
                'true',  // recurse
                'false', // inScopeOnly
                '',      // scanPolicyName
                '',      // method
                ''       // postData
            );
            
            this.log(`Active scan started with ID: ${scanId}`, 'INFO');

            // Wait for scan to complete
            let progress = 0;
            while (progress < 100) {
                await new Promise(resolve => setTimeout(resolve, 5000));
                progress = await this.zaproxy.ascan.status(scanId);
                this.log(`Active scan progress: ${progress}%`, 'INFO');
            }

            this.log('Active scan completed', 'SUCCESS');
        } catch (error) {
            this.log(`Active scan error: ${error.message}`, 'ERROR');
        }
    }

    async ajaxSpider() {
        this.log(`Starting AJAX spider on ${this.targetUrl}`, 'SCAN');
        
        try {
            await this.zaproxy.ajaxSpider.scan(this.targetUrl);
            this.log('AJAX spider started', 'INFO');

            // Wait for AJAX spider
            let status = 'running';
            while (status === 'running') {
                await new Promise(resolve => setTimeout(resolve, 2000));
                status = await this.zaproxy.ajaxSpider.status();
                this.log(`AJAX spider status: ${status}`, 'INFO');
            }

            const results = await this.zaproxy.ajaxSpider.results();
            this.log(`AJAX spider found ${results.length} additional URLs`, 'SUCCESS');
        } catch (error) {
            this.log(`AJAX spider not available or error: ${error.message}`, 'WARN');
        }
    }

    async getAlerts() {
        this.log('Retrieving security alerts...', 'INFO');
        
        try {
            const alerts = await this.zaproxy.core.alerts(this.targetUrl);
            this.scanResults.alerts = alerts;

            // Categorize by risk
            const riskLevels = {
                High: alerts.filter(a => a.risk === 'High'),
                Medium: alerts.filter(a => a.risk === 'Medium'),
                Low: alerts.filter(a => a.risk === 'Low'),
                Informational: alerts.filter(a => a.risk === 'Informational')
            };

            this.scanResults.summary = {
                total: alerts.length,
                high: riskLevels.High.length,
                medium: riskLevels.Medium.length,
                low: riskLevels.Low.length,
                informational: riskLevels.Informational.length
            };

            this.log(`Found ${alerts.length} security alerts`, 'INFO');
            this.log(`  High: ${riskLevels.High.length}`, 'CRITICAL');
            this.log(`  Medium: ${riskLevels.Medium.length}`, 'WARN');
            this.log(`  Low: ${riskLevels.Low.length}`, 'INFO');
            this.log(`  Informational: ${riskLevels.Informational.length}`, 'INFO');

            return riskLevels;
        } catch (error) {
            this.log(`Error retrieving alerts: ${error.message}`, 'ERROR');
            return null;
        }
    }

    async authenticatedScan(username, password) {
        this.log('Setting up authenticated scanning...', 'INFO');
        
        try {
            // Set up authentication
            const contextName = 'CueFinder-Context';
            
            // Create context
            await this.zaproxy.context.newContext(contextName);
            
            // Include in context
            await this.zaproxy.context.includeInContext(contextName, `${this.targetUrl}.*`);
            
            // Set authentication method (form-based)
            await this.zaproxy.authentication.setAuthenticationMethod(
                contextName,
                'formBasedAuthentication',
                `loginUrl=${this.targetUrl}/api/auth/login&loginRequestData=email%3D{%username%}%26password%3D{%password%}`
            );

            // Create user
            await this.zaproxy.users.newUser(contextName, 'testuser');
            await this.zaproxy.users.setAuthenticationCredentials(
                contextName,
                'testuser',
                `username=${username}&password=${password}`
            );
            
            await this.zaproxy.users.setUserEnabled(contextName, 'testuser', 'true');

            this.log('Authenticated scanning configured', 'SUCCESS');
            
            // Now run scans with authentication
            await this.spiderScan();
            await this.activeScan();
            
        } catch (error) {
            this.log(`Authenticated scan setup error: ${error.message}`, 'ERROR');
        }
    }

    async passiveScan() {
        this.log('Running passive scan...', 'SCAN');
        
        try {
            // Enable all passive scanners
            await this.zaproxy.pscan.enableAllScanners();
            
            // Access the target to generate traffic
            const axios = require('axios');
            
            const endpoints = [
                '/',
                '/api/cues',
                '/api/cases',
                '/api/listings',
                '/api/auth/login',
                '/api/auth/register'
            ];

            for (const endpoint of endpoints) {
                try {
                    await axios.get(`${this.targetUrl}${endpoint}`, {
                        validateStatus: () => true
                    });
                } catch (error) {
                    // Continue
                }
            }

            this.log('Passive scan traffic generated', 'INFO');
            
            // Wait for passive scan to process
            await new Promise(resolve => setTimeout(resolve, 5000));
            
        } catch (error) {
            this.log(`Passive scan error: ${error.message}`, 'ERROR');
        }
    }

    generateHTMLReport(riskLevels) {
        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>OWASP ZAP Security Report - CueFinder</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        h1 { color: #333; border-bottom: 3px solid #e74c3c; padding-bottom: 10px; }
        h2 { color: #555; margin-top: 30px; }
        .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
        .summary-box { padding: 20px; border-radius: 5px; text-align: center; }
        .high { background: #e74c3c; color: white; }
        .medium { background: #f39c12; color: white; }
        .low { background: #3498db; color: white; }
        .info { background: #95a5a6; color: white; }
        .summary-box h3 { margin: 0; font-size: 36px; }
        .summary-box p { margin: 5px 0 0 0; }
        .alert { margin: 15px 0; padding: 15px; border-left: 4px solid #ccc; background: #f9f9f9; }
        .alert.high { border-left-color: #e74c3c; }
        .alert.medium { border-left-color: #f39c12; }
        .alert.low { border-left-color: #3498db; }
        .alert h3 { margin-top: 0; color: #333; }
        .alert-meta { font-size: 12px; color: #666; }
        .description { margin: 10px 0; }
        .solution { background: #e8f5e9; padding: 10px; margin-top: 10px; border-radius: 3px; }
        .reference { font-size: 12px; margin-top: 10px; }
        .timestamp { color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔒 OWASP ZAP Security Scan Report</h1>
        <p><strong>Target:</strong> ${this.targetUrl}</p>
        <p class="timestamp"><strong>Scan Date:</strong> ${this.scanResults.timestamp}</p>
        
        <div class="summary">
            <div class="summary-box high">
                <h3>${this.scanResults.summary.high}</h3>
                <p>High Risk</p>
            </div>
            <div class="summary-box medium">
                <h3>${this.scanResults.summary.medium}</h3>
                <p>Medium Risk</p>
            </div>
            <div class="summary-box low">
                <h3>${this.scanResults.summary.low}</h3>
                <p>Low Risk</p>
            </div>
            <div class="summary-box info">
                <h3>${this.scanResults.summary.informational}</h3>
                <p>Informational</p>
            </div>
        </div>

        ${this.generateAlertsHTML(riskLevels.High, 'High Risk Vulnerabilities', 'high')}
        ${this.generateAlertsHTML(riskLevels.Medium, 'Medium Risk Vulnerabilities', 'medium')}
        ${this.generateAlertsHTML(riskLevels.Low, 'Low Risk Vulnerabilities', 'low')}
    </div>
</body>
</html>`;

        const reportPath = `zap-security-report-${Date.now()}.html`;
        fs.writeFileSync(reportPath, html);
        this.log(`HTML report saved to: ${reportPath}`, 'SUCCESS');
        return reportPath;
    }

    generateAlertsHTML(alerts, title, severity) {
        if (!alerts || alerts.length === 0) return '';

        let html = `<h2>${title}</h2>`;
        
        alerts.forEach(alert => {
            html += `
            <div class="alert ${severity}">
                <h3>${alert.alert}</h3>
                <div class="alert-meta">
                    <strong>URL:</strong> ${alert.url}<br>
                    <strong>Parameter:</strong> ${alert.param || 'N/A'}<br>
                    <strong>CWE ID:</strong> ${alert.cweid || 'N/A'}<br>
                    <strong>WASC ID:</strong> ${alert.wascid || 'N/A'}
                </div>
                <div class="description">
                    <strong>Description:</strong><br>
                    ${alert.description || 'No description available'}
                </div>
                ${alert.solution ? `
                <div class="solution">
                    <strong>✅ Solution:</strong><br>
                    ${alert.solution}
                </div>` : ''}
                ${alert.reference ? `
                <div class="reference">
                    <strong>Reference:</strong> ${alert.reference}
                </div>` : ''}
            </div>`;
        });

        return html;
    }

    async runFullScan(includeAuthenticated = false, username = null, password = null) {
        console.log('🔍 Starting OWASP ZAP Security Scan');
        console.log(`Target: ${this.targetUrl}\n`);

        // Check if ZAP is running
        const zapRunning = await this.waitForZAP();
        if (!zapRunning) {
            console.log('\n❌ Cannot proceed without OWASP ZAP running');
            console.log('\nTo start ZAP in daemon mode:');
            console.log('  Linux/Mac: zap.sh -daemon -port 8080 -config api.key=changeme');
            console.log('  Windows: zap.bat -daemon -port 8080 -config api.key=changeme\n');
            return;
        }

        // Run scans
        await this.passiveScan();
        await this.spiderScan();
        
        if (includeAuthenticated && username && password) {
            await this.authenticatedScan(username, password);
        } else {
            await this.activeScan();
        }

        // Get and display results
        const riskLevels = await this.getAlerts();
        
        if (riskLevels) {
            // Save JSON report
            const jsonReportPath = `zap-scan-results-${Date.now()}.json`;
            fs.writeFileSync(jsonReportPath, JSON.stringify(this.scanResults, null, 2));
            this.log(`JSON report saved to: ${jsonReportPath}`, 'SUCCESS');

            // Generate HTML report
            this.generateHTMLReport(riskLevels);
        }

        console.log('\n' + '='.repeat(80));
        console.log('SCAN COMPLETED');
        console.log('='.repeat(80));
    }
}

// Run scan
if (require.main === module) {
    const scanner = new ZAPSecurityScanner();
    
    // Get command line args
    const args = process.argv.slice(2);
    const includeAuth = args.includes('--auth');
    const username = process.env.TEST_USERNAME || 'testuser@test.com';
    const password = process.env.TEST_PASSWORD || 'Test123!';

    scanner.runFullScan(includeAuth, username, password).catch(error => {
        console.error('Scan execution failed:', error);
        process.exit(1);
    });
}

module.exports = ZAPSecurityScanner;
