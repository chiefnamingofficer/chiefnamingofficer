#!/usr/bin/env node

/**
 * Dynatrace Monitoring Dashboard
 * 
 * This script combines both API token and OAuth authentication methods
 * to provide comprehensive monitoring of your Dynatrace environment.
 * 
 * Features:
 * - Dual authentication support (API Token + OAuth)
 * - Problem analysis and categorization
 * - Service health monitoring
 * - Alert prioritization
 * - Trend analysis
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { exec } = require('child_process');

// Colors for better console output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m'
};

// Load environment configuration
function loadConfig() {
    const envPath = path.join(__dirname, '..', 'env', '.env.dev');
    if (!fs.existsSync(envPath)) {
        console.error('❌ env/.env.dev file not found');
        process.exit(1);
    }
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    const config = {};
    
    envContent.split('\n').forEach(line => {
        line = line.trim();
        if (line && !line.startsWith('#')) {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
                const value = valueParts.join('=');
                if (key === 'DT_ENVIRONMENT') config.environment = value;
                if (key === 'API_TOKEN') config.apiToken = value;
                if (key === 'OAUTH_CLIENT_ID') config.oauthClientId = value;
                if (key === 'OAUTH_CLIENT_SECRET') config.oauthClientSecret = value;
                if (key === 'OAUTH_RESOURCE_URN') config.oauthResourceUrn = value;
            }
        }
    });
    
    return config;
}

// Execute tool and capture output
function runTool(toolPath, args = []) {
    return new Promise((resolve, reject) => {
        const fullPath = path.join(__dirname, toolPath);
        const cmd = `node ${fullPath} ${args.join(' ')}`;
        exec(cmd, { cwd: path.join(__dirname, '..') }, (error, stdout, stderr) => {
            if (error) {
                reject({ error, stderr });
            } else {
                resolve(stdout);
            }
        });
    });
}

// Make direct API request
function makeApiRequest(endpoint, config, authType = 'token') {
    return new Promise((resolve, reject) => {
        // Detect if this is a Grail environment and adjust endpoint
        const isGrailEnvironment = config.environment.includes('.apps.dynatrace.com');
        let url;
        
        if (isGrailEnvironment) {
            // Use Grail platform endpoints
            url = `${config.environment}/platform/classic/environment-api/v2${endpoint}`;
        } else {
            // Use classic endpoints
            url = `${config.environment}/api/v2${endpoint}`;
        }
        
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (authType === 'token') {
            if (isGrailEnvironment) {
                console.log(`⚠️ API Token not supported on Grail environment - needs OAuth`);
                reject(new Error('API Token not supported on Grail environment'));
                return;
            }
            headers['Authorization'] = `Api-Token ${config.apiToken}`;
        } else {
            // OAuth would require token refresh logic here
            headers['Authorization'] = `Bearer ${config.oauthToken}`;
        }
        
        console.log(`📡 GET ${url}`);
        
        const options = {
            method: 'GET',
            headers: headers,
            rejectUnauthorized: false
        };

        const req = https.request(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`📡 Response: ${res.statusCode} (${data.length} bytes)`);
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(data);
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

// Analyze problems by service
function analyzeProblems(problems) {
    const analysis = {
        totalProblems: problems.length,
        openProblems: 0,
        closedProblems: 0,
        serviceBreakdown: {},
        severityBreakdown: {},
        impactBreakdown: {},
        recentProblems: []
    };
    
    problems.forEach(problem => {
        // Count by status
        if (problem.status === 'OPEN') analysis.openProblems++;
        else analysis.closedProblems++;
        
        // Count by severity
        const severity = problem.severityLevel || 'UNKNOWN';
        analysis.severityBreakdown[severity] = (analysis.severityBreakdown[severity] || 0) + 1;
        
        // Count by impact
        const impact = problem.impactLevel || 'UNKNOWN';
        analysis.impactBreakdown[impact] = (analysis.impactBreakdown[impact] || 0) + 1;
        
        // Extract service names from affected entities
        if (problem.affectedEntities && problem.affectedEntities.length > 0) {
            problem.affectedEntities.forEach(entity => {
                const serviceName = entity.name || 'Unknown Service';
                analysis.serviceBreakdown[serviceName] = (analysis.serviceBreakdown[serviceName] || 0) + 1;
            });
        }
        
        // Track recent problems (last 24 hours)
        const problemTime = new Date(problem.startTime);
        const now = new Date();
        const hoursDiff = (now - problemTime) / (1000 * 60 * 60);
        
        if (hoursDiff <= 24) {
            analysis.recentProblems.push({
                title: problem.title,
                service: problem.affectedEntities?.[0]?.name || 'Unknown',
                severity: problem.severityLevel,
                hoursAgo: Math.round(hoursDiff)
            });
        }
    });
    
    return analysis;
}

// Format and display monitoring dashboard
function displayDashboard(apiResults, oauthResults, analysis) {
    console.log('\n' + colors.bold + colors.cyan + '🔍 DYNATRACE MONITORING DASHBOARD' + colors.reset);
    console.log('=' .repeat(50));
    
    // Authentication Status
    console.log(colors.bold + '\n📡 Authentication Status:' + colors.reset);
    console.log(`  API Token: ${apiResults.success ? colors.green + '✅ Working' : colors.red + '❌ Failed'} ${colors.reset}`);
    console.log(`  OAuth:     ${oauthResults.success ? colors.green + '✅ Working' : colors.red + '❌ Failed'} ${colors.reset}`);
    
    // Problem Summary
    console.log(colors.bold + '\n📊 Problem Summary:' + colors.reset);
    console.log(`  Total Problems: ${colors.yellow}${analysis.totalProblems}${colors.reset}`);
    console.log(`  Open Problems:  ${colors.red}${analysis.openProblems}${colors.reset}`);
    console.log(`  Closed Problems: ${colors.green}${analysis.closedProblems}${colors.reset}`);
    
    // Severity Breakdown
    console.log(colors.bold + '\n⚠️  Severity Breakdown:' + colors.reset);
    Object.entries(analysis.severityBreakdown).forEach(([severity, count]) => {
        const color = severity === 'ERROR' ? colors.red : severity === 'WARNING' ? colors.yellow : colors.blue;
        console.log(`  ${severity}: ${color}${count}${colors.reset}`);
    });
    
    // Service Impact
    console.log(colors.bold + '\n🏢 Most Affected Services:' + colors.reset);
    const sortedServices = Object.entries(analysis.serviceBreakdown)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);
    
    sortedServices.forEach(([service, count], index) => {
        const color = count >= 3 ? colors.red : count >= 2 ? colors.yellow : colors.green;
        console.log(`  ${index + 1}. ${service}: ${color}${count} problems${colors.reset}`);
    });
    
    // Recent Activity
    if (analysis.recentProblems.length > 0) {
        console.log(colors.bold + '\n🕐 Recent Activity (24h):' + colors.reset);
        analysis.recentProblems.slice(0, 5).forEach((problem, index) => {
            const color = problem.hoursAgo <= 1 ? colors.red : problem.hoursAgo <= 6 ? colors.yellow : colors.blue;
            console.log(`  ${index + 1}. ${problem.title}`);
            console.log(`     Service: ${problem.service} | ${color}${problem.hoursAgo}h ago${colors.reset}`);
        });
    }
    
    // Recommendations
    console.log(colors.bold + '\n💡 Recommendations:' + colors.reset);
    if (analysis.openProblems > 5) {
        console.log(`  ${colors.red}🚨 High number of open problems - immediate attention required${colors.reset}`);
    }
    if (analysis.recentProblems.length > 3) {
        console.log(`  ${colors.yellow}⚡ Recent spike in problems - investigate trends${colors.reset}`);
    }
    
    const topService = sortedServices[0];
    if (topService && topService[1] > 2) {
        console.log(`  ${colors.cyan}🎯 Focus on ${topService[0]} - highest impact service${colors.reset}`);
    }
    
    console.log(colors.bold + '\n🔄 Refresh this dashboard: node tools/dynatrace-monitor.js' + colors.reset);
    console.log('=' .repeat(50) + '\n');
}

// Main monitoring function
async function runMonitoring() {
    console.log(colors.bold + colors.blue + '🚀 Starting Dynatrace Monitoring...' + colors.reset);
    
    const config = loadConfig();
    console.log(`🔗 Environment: ${config.environment}`);
    console.log(`🔑 API Token: ${config.apiToken ? 'Configured' : 'Missing'}`);
    console.log(`🔐 OAuth: ${config.oauthClientId ? 'Configured' : 'Missing'}`);
    
    let apiResults = { success: false, data: null };
    let oauthResults = { success: false, data: null };
    let problems = [];
    
    // Test API Token method
    console.log('\n📡 Testing API Token authentication...');
    try {
        const apiData = await makeApiRequest('/problems?pageSize=50', config, 'token');
        if (apiData.problems) {
            apiResults = { success: true, data: apiData };
            problems = apiData.problems;
            console.log(`✅ API Token: Found ${apiData.totalCount} total problems`);
        }
    } catch (error) {
        console.log(`❌ API Token failed: ${error.message}`);
    }
    
    // Test OAuth method (using the tool)
    console.log('\n🔐 Testing OAuth authentication...');
    try {
        const oauthOutput = await runTool('dynatrace-oauth-tool.js', ['problems']);
        if (oauthOutput.includes('Found') && oauthOutput.includes('problems')) {
            oauthResults = { success: true, data: oauthOutput };
            console.log('✅ OAuth: Connection successful');
        }
    } catch (error) {
        console.log(`❌ OAuth failed: ${error.error?.message || 'Unknown error'}`);
    }
    
    // Analyze the problems data
    if (problems.length > 0) {
        const analysis = analyzeProblems(problems);
        displayDashboard(apiResults, oauthResults, analysis);
    } else {
        console.log('\n❌ No problem data available for analysis');
        console.log('Check your authentication configuration and try again.');
    }
}

// CLI interface
async function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'monitor';
    
    if (command === 'help') {
        console.log('Dynatrace Monitoring Dashboard');
        console.log('=============================');
        console.log('');
        console.log('Usage:');
        console.log('  node dynatrace-monitor.js [command]');
        console.log('');
        console.log('Commands:');
        console.log('  monitor    Run full monitoring dashboard (default)');
        console.log('  help       Show this help message');
        console.log('');
        console.log('Features:');
        console.log('  • Dual authentication testing (API Token + OAuth)');
        console.log('  • Problem analysis and categorization');
        console.log('  • Service impact assessment');
        console.log('  • Recent activity tracking');
        console.log('  • Actionable recommendations');
        return;
    }
    
    if (command === 'monitor') {
        await runMonitoring();
    } else {
        console.log('Unknown command. Use "help" for usage information.');
    }
}

// Export for use in other scripts
module.exports = {
    loadConfig,
    runTool,
    makeApiRequest,
    analyzeProblems,
    runMonitoring
};

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Monitoring failed:', error.message);
        process.exit(1);
    });
} 