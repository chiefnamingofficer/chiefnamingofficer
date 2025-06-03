#!/usr/bin/env node

/**
 * Comprehensive Dynatrace Query Tool
 * Supports querying: problems, logs, metrics, and traces
 * Uses API tokens for authentication (proven working approach)
 * Supports multiple environments: dev, staging, prod
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// Load environment variables from env/.env.{environment}
function loadEnv(environment = 'dev') {
    const envFile = `.env.${environment}`;
    const envPath = path.join(__dirname, '..', 'env', envFile);
    
    if (!fs.existsSync(envPath)) {
        console.error(`❌ Environment file not found: ${envFile}`);
        console.error(`   Expected path: ${envPath}`);
        console.error(`   Available environments: dev, staging, prod`);
        console.error(`   Create ${envFile} by copying env.template`);
        process.exit(1);
    }
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    const config = { environment };
    lines.forEach(line => {
        line = line.trim();
        if (line && !line.startsWith('#')) {
            if (line.startsWith('DT_ENVIRONMENT=')) {
                config.dtEnvironment = line.split('=').slice(1).join('=');
            }
            if (line.startsWith('API_TOKEN=')) {
                config.apiToken = line.split('=').slice(1).join('=');
            }
            if (line.startsWith('OAUTH_CLIENT_ID=')) {
                config.oauthClientId = line.split('=').slice(1).join('=');
            }
            if (line.startsWith('OAUTH_CLIENT_SECRET=')) {
                config.oauthClientSecret = line.split('=').slice(1).join('=');
            }
            if (line.startsWith('OAUTH_RESOURCE_URN=')) {
                config.oauthResourceUrn = line.split('=').slice(1).join('=');
            }
        }
    });
    
    return config;
}

// Get OAuth token for advanced queries
async function getOAuthToken(config) {
    console.log('🔑 Attempting OAuth token generation...');
    console.log(`   Client ID: ${config.oauthClientId ? 'Present' : 'Missing'}`);
    console.log(`   Client Secret: ${config.oauthClientSecret ? 'Present' : 'Missing'}`);
    console.log(`   Resource URN: ${config.oauthResourceUrn ? 'Present' : 'Missing'}`);
    
    if (!config.oauthClientId || !config.oauthClientSecret || !config.oauthResourceUrn) {
        console.log('❌ Missing OAuth credentials in environment file');
        return null;
    }
    
    return new Promise((resolve, reject) => {
        const postData = new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: config.oauthClientId,
            client_secret: config.oauthClientSecret,
            resource: config.oauthResourceUrn
        }).toString();

        console.log('📡 Making OAuth request to sso.dynatrace.com...');
        const options = {
            hostname: 'sso.dynatrace.com',
            port: 443,
            path: '/sso/oauth2/token',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': postData.length
            },
            rejectUnauthorized: false
        };

        const req = https.request(options, (res) => {
            console.log(`📡 OAuth response status: ${res.statusCode}`);
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    if (response.access_token) {
                        console.log('✅ OAuth token generated successfully');
                        resolve(response.access_token);
                    } else {
                        console.log('❌ OAuth response missing access_token:', data);
                        resolve(null);
                    }
                } catch (e) {
                    console.log('❌ Failed to parse OAuth response:', data);
                    resolve(null);
                }
            });
        });

        req.on('error', (error) => {
            console.log('❌ OAuth request error:', error.message);
            resolve(null);
        });
        req.write(postData);
        req.end();
    });
}

// Enhanced API request function supporting both GET and POST
function makeRequest(endpoint, config, options = {}) {
    return new Promise((resolve, reject) => {
        // Detect if this is a Grail environment and adjust endpoint
        const isGrailEnvironment = config.dtEnvironment.includes('.apps.dynatrace.com');
        let url;
        
        // Special handling for storage query endpoints (already have full path)
        if (endpoint.startsWith('/platform/storage/')) {
            url = `${config.dtEnvironment}${endpoint}`;
        } else {
            // Regular API endpoints need environment detection
            if (isGrailEnvironment) {
                // Use Grail platform endpoints
                url = `${config.dtEnvironment}/platform/classic/environment-api/v2${endpoint}`;
            } else {
                // Use classic endpoints
                url = `${config.dtEnvironment}/api/v2${endpoint}`;
            }
        }
        
        const parsedUrl = new URL(url);
        
        console.log(`📡 ${options.method || 'GET'} ${url}`);
        
        const requestOptions = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || 443,
            path: parsedUrl.pathname + parsedUrl.search,
            method: options.method || 'GET',
            headers: {
                'Authorization': options.useOAuth ? `Bearer ${options.oauthToken}` : 
                    (isGrailEnvironment && !options.useOAuth ? 
                        (() => { console.log('⚠️ API Token not supported on Grail - using OAuth fallback'); return `Bearer ${options.oauthToken || 'MISSING_OAUTH'}`; })() :
                        `Api-Token ${config.apiToken}`),
                'Content-Type': 'application/json',
                ...options.headers
            },
            rejectUnauthorized: false
        };

        const req = https.request(requestOptions, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`📡 Response: ${res.statusCode} (${data.length} bytes)`);
                try {
                    const parsed = JSON.parse(data);
                    resolve(parsed);
                } catch (e) {
                    resolve(data);
                }
            });
        });

        req.on('error', reject);
        if (options.body) {
            req.write(options.body);
        }
        req.end();
    });
}

// PROBLEMS queries
async function getProblems(config, pageSize = 10, entitySelector = '') {
    console.log('🔍 Fetching problems...');
    try {
        let endpoint = `/problems?pageSize=${pageSize}`;
        if (entitySelector) {
            endpoint += `&entitySelector=${encodeURIComponent(entitySelector)}`;
        }
        
        // Check if we're on a Grail environment and need OAuth
        const isGrailEnvironment = config.dtEnvironment.includes('.apps.dynatrace.com');
        let requestOptions = {};
        
        if (isGrailEnvironment) {
            console.log('🔄 Grail environment detected - getting OAuth token...');
            const oauthToken = await getOAuthToken(config);
            if (!oauthToken) {
                console.log('❌ Failed to get OAuth token for Grail environment');
                return null;
            }
            requestOptions = { useOAuth: true, oauthToken: oauthToken };
        }
        
        const result = await makeRequest(endpoint, config, requestOptions);
        return result;
    } catch (error) {
        console.error('❌ Error fetching problems:', error.message);
        return null;
    }
}

async function getLambdaProblems(config, timeRange = 'now-24h') {
    console.log('🔍 Fetching Lambda-specific problems...');
    try {
        const endpoint = `/problems?entitySelector=type(AWS_LAMBDA_FUNCTION)&from=${timeRange}&to=now`;
        const result = await makeRequest(endpoint, config);
        return result;
    } catch (error) {
        console.error('❌ Error fetching Lambda problems:', error.message);
        return null;
    }
}

// LOGS queries (require OAuth)
async function searchLogs(config, query, timeRange = 'now-1h', limit = 20) {
    console.log(`🔍 Searching logs: "${query}"`);
    try {
        // Get OAuth token for logs access
        const oauthToken = await getOAuthToken(config);
        if (!oauthToken) {
            console.log('❌ Failed to get OAuth token for logs access');
            return null;
        }
        
        // Use the correct Platform Storage Query API endpoint
        const dqlQuery = `fetch logs | filter ${query} | limit ${limit}`;
        const requestBody = JSON.stringify({
            query: dqlQuery,
            defaultTimeframeStart: timeRange,
            defaultTimeframeEnd: 'now',
            maxResultRecords: limit,
            fetchTimeoutSeconds: 60
        });
        
        console.log('📡 Making logs API request...');
        console.log(`   Endpoint: ${config.dtEnvironment}/platform/storage/query/v1/query:execute`);
        console.log(`   DQL Query: ${dqlQuery}`);
        
        const result = await makeRequest('/platform/storage/query/v1/query:execute', config, { 
            method: 'POST',
            useOAuth: true, 
            oauthToken: oauthToken,
            body: requestBody,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📡 Logs API response received');
        console.log('   Response type:', typeof result);
        console.log('   Response keys:', result ? Object.keys(result) : 'null');
        
        return result;
    } catch (error) {
        console.error('❌ Error searching logs:', error.message);
        return null;
    }
}

async function getLambdaErrorLogs(config, lambdaName, timeRange = 'now-24h') {
    console.log(`🔍 Getting ERROR logs for Lambda: ${lambdaName}`);
    try {
        // Get OAuth token for logs access
        const oauthToken = await getOAuthToken(config);
        if (!oauthToken) {
            console.log('❌ Failed to get OAuth token for logs access');
            return null;
        }
        
        // Use DQL syntax for Lambda function logs
        const dqlQuery = `fetch logs | filter content.level == "ERROR" and matchesPhrase(content, "${lambdaName}") | limit 100`;
        const requestBody = JSON.stringify({
            query: dqlQuery,
            defaultTimeframeStart: timeRange,
            defaultTimeframeEnd: 'now',
            maxResultRecords: 100,
            fetchTimeoutSeconds: 60
        });
        
        const result = await makeRequest('/platform/storage/query/v1/query:execute', config, { 
            method: 'POST',
            useOAuth: true, 
            oauthToken: oauthToken,
            body: requestBody,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return result;
    } catch (error) {
        console.error('❌ Error fetching Lambda error logs:', error.message);
        return null;
    }
}

// METRICS queries
async function getMetrics(config, metricSelector, timeRange = 'now-1h') {
    console.log(`🔍 Querying metrics: ${metricSelector}`);
    try {
        const endpoint = `/metrics/query?metricSelector=${encodeURIComponent(metricSelector)}&resolution=1m&from=${timeRange}&to=now`;
        const result = await makeRequest(endpoint, config);
        return result;
    } catch (error) {
        console.error('❌ Error querying metrics:', error.message);
        return null;
    }
}

async function getLambdaMetrics(config, entityId, metricType = 'errors', timeRange = 'now-2h') {
    console.log(`🔍 Getting Lambda ${metricType} metrics...`);
    try {
        const metricMap = {
            'errors': `builtin:cloud.aws.lambda.errors:filter(eq("dt.entity.aws_lambda_function","${entityId}"))`,
            'duration': `builtin:cloud.aws.lambda.duration:filter(eq("dt.entity.aws_lambda_function","${entityId}"))`,
            'invocations': `builtin:cloud.aws.lambda.invocations:filter(eq("dt.entity.aws_lambda_function","${entityId}"))`
        };
        
        const metricSelector = metricMap[metricType] || metricMap.errors;
        const endpoint = `/metrics/query?metricSelector=${encodeURIComponent(metricSelector)}&resolution=1m&from=${timeRange}&to=now`;
        const result = await makeRequest(endpoint, config);
        return result;
    } catch (error) {
        console.error(`❌ Error fetching Lambda ${metricType} metrics:`, error.message);
        return null;
    }
}

// ENTITIES queries
async function getEntities(config, entitySelector = 'type(AWS_LAMBDA_FUNCTION)', fields = 'displayName,entityId') {
    console.log(`🔍 Getting entities: ${entitySelector}`);
    try {
        const endpoint = `/entities?entitySelector=${encodeURIComponent(entitySelector)}&fields=${fields}`;
        const result = await makeRequest(endpoint, config);
        return result;
    } catch (error) {
        console.error('❌ Error fetching entities:', error.message);
        return null;
    }
}

// Analysis functions
async function analyzeLambdaErrors(config) {
    console.log('🔍 Analyzing Lambda functions for most ERROR logs today...\n');
    
    // Get all Lambda functions
    const lambdas = await getEntities(config);
    if (!lambdas || !lambdas.entities) {
        console.log('❌ Failed to get Lambda functions');
        return;
    }
    
    console.log(`📋 Found ${lambdas.entities.length} Lambda functions\n`);
    
    const errorCounts = [];
    
    // Analyze first 5 Lambda functions (to avoid rate limiting)
    for (const lambda of lambdas.entities.slice(0, 5)) {
        const logs = await getLambdaErrorLogs(config, lambda.displayName);
        const errorCount = logs && logs.results ? logs.results.length : 0;
        errorCounts.push({
            name: lambda.displayName,
            entityId: lambda.entityId,
            errorCount: errorCount
        });
        console.log(`   ${lambda.displayName}: ${errorCount} ERROR logs`);
    }
    
    // Sort by error count
    errorCounts.sort((a, b) => b.errorCount - a.errorCount);
    
    console.log('\n🎯 RESULTS - Lambda functions with most ERROR logs today:');
    console.log('=' .repeat(60));
    errorCounts.forEach((lambda, index) => {
        const rank = index + 1;
        const bar = "█".repeat(Math.max(1, Math.floor(lambda.errorCount / 5)));
        console.log(`${rank}. ${lambda.name}: ${lambda.errorCount} errors ${bar}`);
    });
    
    if (errorCounts.length > 0 && errorCounts[0].errorCount > 0) {
        console.log(`\n🏆 ${errorCounts[0].name} has the most ERROR logs (${errorCounts[0].errorCount})`);
    }
}

// Display help
function showHelp() {
    console.log(`
🔧 Comprehensive Dynatrace Query Tool
====================================

Usage: node tools/dynatrace-query.js <environment> <command> [options]

🌍 ENVIRONMENTS:
  dev      - Development environment (uses env/.env.dev)
  staging  - Staging environment (uses env/.env.staging)  
  prod     - Production environment (uses env/.env.prod)

📋 PROBLEMS:
  problems [pageSize]              - Get recent problems (default: 5)
  lambda-problems [timeRange]      - Get Lambda-specific problems (default: now-24h)

📄 LOGS:
  logs <query> [timeRange] [limit] - Search logs with DQL query
  lambda-errors <lambdaName>       - Get ERROR logs for specific Lambda
  analyze-lambda-errors            - Find Lambda with most errors today

📊 METRICS:
  metrics <selector> [timeRange]   - Query metrics with selector
  lambda-metrics <entityId> <type> - Get Lambda metrics (errors|duration|invocations)

🏢 ENTITIES:
  entities [selector] [fields]     - Get entities (default: Lambda functions)

Examples:
  node tools/dynatrace-query.js dev problems 10
  node tools/dynatrace-query.js staging lambda-problems now-2h
  node tools/dynatrace-query.js prod logs "status:ERROR" now-1h 50
  node tools/dynatrace-query.js dev lambda-errors "compassdigital-report-dev-eod_consumer"
  node tools/dynatrace-query.js dev analyze-lambda-errors
  node tools/dynatrace-query.js prod metrics "builtin:service.response.time" now-30m
  node tools/dynatrace-query.js staging entities "type(SERVICE)" "displayName,entityId,tags"

⚡ Quick Commands (uses dev environment by default):
  node tools/dynatrace-query.js analyze-lambda-errors
  node tools/dynatrace-query.js problems
`);
}

// Main CLI interface
async function main() {
    const args = process.argv.slice(2);
    
    // Parse environment and command
    let environment = 'dev';
    let command = args[0];
    let commandArgs = args.slice(1);
    
    // Check if first argument is an environment
    if (['dev', 'staging', 'prod'].includes(args[0])) {
        environment = args[0];
        command = args[1];
        commandArgs = args.slice(2);
    }
    
    if (!command || command === 'help' || command === '--help') {
        showHelp();
        return;
    }
    
    console.log('🚀 Comprehensive Dynatrace Query Tool');
    console.log('====================================');
    
    const config = loadEnv(environment);
    if (!config.dtEnvironment || !config.apiToken) {
        console.error(`❌ Missing DT_ENVIRONMENT or API_TOKEN in env/.env.${environment}`);
        process.exit(1);
    }
    
    console.log(`🌍 Environment: ${environment.toUpperCase()}`);
    console.log(`🔗 Dynatrace URL: ${config.dtEnvironment}`);
    console.log(`🔑 Token: ${config.apiToken.substring(0, 15)}...`);
    console.log('');

    try {
        switch (command) {
            case 'problems':
                const pageSize = parseInt(commandArgs[0]) || 5;
                const result = await getProblems(config, pageSize);
                if (result && result.problems) {
                    console.log(`📋 Found ${result.totalCount} total problems (showing ${result.problems.length}):`);
                    result.problems.forEach((problem, i) => {
                        console.log(`${i + 1}. ${problem.title} (${problem.status})`);
                        console.log(`   Impact: ${problem.impactLevel} | Severity: ${problem.severityLevel}`);
                        console.log(`   Started: ${new Date(problem.startTime).toLocaleString()}`);
                        if (problem.affectedEntities && problem.affectedEntities[0]) {
                            console.log(`   Entity: ${problem.affectedEntities[0].name}`);
                        }
                        console.log('');
                    });
                } else {
                    console.log('No problems found or error occurred');
                }
                break;

            case 'lambda-problems':
                const timeRange = commandArgs[0] || 'now-24h';
                const lambdaProblems = await getLambdaProblems(config, timeRange);
                if (lambdaProblems && lambdaProblems.problems) {
                    console.log(`📋 Found ${lambdaProblems.problems.length} Lambda problems:`);
                    lambdaProblems.problems.forEach((problem, i) => {
                        console.log(`${i + 1}. ${problem.title} (${problem.status})`);
                        console.log(`   Entity: ${problem.affectedEntities[0]?.name}`);
                        console.log(`   Started: ${new Date(problem.startTime).toLocaleString()}`);
                        console.log('');
                    });
                } else {
                    console.log('No Lambda problems found');
                }
                break;

            case 'logs':
                if (!commandArgs[0]) {
                    console.log('❌ Please provide a search query');
                    break;
                }
                const query = commandArgs[0];
                const logTimeRange = commandArgs[1] || 'now-1h';
                const limit = parseInt(commandArgs[2]) || 20;
                const logs = await searchLogs(config, query, logTimeRange, limit);
                if (logs && logs.results) {
                    console.log(`📄 Found ${logs.results.length} log entries:`);
                    logs.results.forEach((log, i) => {
                        console.log(`${i + 1}. [${new Date(log.timestamp).toLocaleString()}] ${log.status || 'INFO'}`);
                        console.log(`   ${log.content.substring(0, 200)}...`);
                        console.log('');
                    });
                } else {
                    console.log('No logs found');
                }
                break;

            case 'lambda-errors':
                if (!commandArgs[0]) {
                    console.log('❌ Please provide a Lambda function name');
                    break;
                }
                const lambdaName = commandArgs[0];
                const errorLogs = await getLambdaErrorLogs(config, lambdaName);
                if (errorLogs && errorLogs.results) {
                    console.log(`📄 Found ${errorLogs.results.length} ERROR logs for ${lambdaName}:`);
                    errorLogs.results.forEach((log, i) => {
                        console.log(`${i + 1}. [${new Date(log.timestamp).toLocaleString()}]`);
                        try {
                            const content = JSON.parse(log.content);
                            console.log(`   Error: ${content.message?.errorMessage || content.message || log.content.substring(0, 100)}`);
                        } catch (e) {
                            console.log(`   ${log.content.substring(0, 100)}...`);
                        }
                        console.log('');
                    });
                } else {
                    console.log(`No ERROR logs found for ${lambdaName}`);
                }
                break;

            case 'analyze-lambda-errors':
                await analyzeLambdaErrors(config);
                break;

            case 'metrics':
                if (!commandArgs[0]) {
                    console.log('❌ Please provide a metric selector');
                    break;
                }
                const metricSelector = commandArgs[0];
                const metricTimeRange = commandArgs[1] || 'now-1h';
                const metrics = await getMetrics(config, metricSelector, metricTimeRange);
                if (metrics && metrics.result && metrics.result[0]) {
                    const data = metrics.result[0].data[0];
                    console.log(`📊 Metric: ${metrics.result[0].metricId}`);
                    console.log(`📊 Data points: ${data.values.length}`);
                    const nonNullValues = data.values.filter(v => v !== null);
                    if (nonNullValues.length > 0) {
                        console.log(`📊 Recent values: ${nonNullValues.slice(-5).join(', ')}`);
                    }
                } else {
                    console.log('No metric data found');
                }
                break;

            case 'lambda-metrics':
                if (!commandArgs[0]) {
                    console.log('❌ Please provide a Lambda entity ID');
                    break;
                }
                const entityId = commandArgs[0];
                const metricType = commandArgs[1] || 'errors';
                const lambdaMetrics = await getLambdaMetrics(config, entityId, metricType);
                if (lambdaMetrics && lambdaMetrics.result && lambdaMetrics.result[0]) {
                    const data = lambdaMetrics.result[0].data[0];
                    console.log(`📊 Lambda ${metricType} metrics:`);
                    const nonNullValues = data.values.filter(v => v !== null && v > 0);
                    if (nonNullValues.length > 0) {
                        console.log(`📊 Non-zero values: ${nonNullValues.join(', ')}`);
                        console.log(`📊 Total: ${nonNullValues.reduce((a, b) => a + b, 0)}`);
                    } else {
                        console.log('📊 No non-zero values found');
                    }
                } else {
                    console.log('No Lambda metrics found');
                }
                break;

            case 'entities':
                const entitySelector = commandArgs[0] || 'type(AWS_LAMBDA_FUNCTION)';
                const fields = commandArgs[1] || 'displayName,entityId';
                const entities = await getEntities(config, entitySelector, fields);
                if (entities && entities.entities) {
                    console.log(`🏢 Found ${entities.entities.length} entities:`);
                    entities.entities.forEach((entity, i) => {
                        console.log(`${i + 1}. ${entity.displayName}`);
                        console.log(`   ID: ${entity.entityId}`);
                        if (entity.tags) {
                            console.log(`   Tags: ${entity.tags.map(t => `${t.key}:${t.value}`).join(', ')}`);
                        }
                        console.log('');
                    });
                } else {
                    console.log('No entities found');
                }
                break;

            default:
                console.log(`❌ Unknown command: ${command}`);
                showHelp();
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    loadEnv,
    getProblems,
    searchLogs,
    getMetrics,
    getEntities,
    analyzeLambdaErrors
}; 