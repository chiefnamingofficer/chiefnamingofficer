#!/usr/bin/env node

/**
 * Working Dynatrace Log Query Tool
 * Addresses OAuth scope issues and provides working alternatives
 * Uses Events API and Entity logs as fallback approaches
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL, URLSearchParams } = require('url');

// Load environment variables
function loadEnv(environment = 'dev') {
    const envFile = `.env.${environment}`;
    const envPath = path.join(__dirname, '..', 'env', envFile);
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    const config = { environment };
    
    envContent.split('\n').forEach(line => {
        line = line.trim();
        if (line && !line.startsWith('#') && line.includes('=')) {
            const [key, ...valueParts] = line.split('=');
            const value = valueParts.join('=');
            
            switch (key) {
                case 'DT_ENVIRONMENT':
                    config.dtEnvironment = value;
                    break;
                case 'API_TOKEN':
                    config.apiToken = value;
                    break;
                case 'OAUTH_CLIENT_ID':
                    config.oauthClientId = value;
                    break;
                case 'OAUTH_CLIENT_SECRET':
                    config.oauthClientSecret = value;
                    break;
                case 'OAUTH_RESOURCE_URN':
                    config.oauthResourceUrn = value;
                    break;
            }
        }
    });
    
    return config;
}

// Get OAuth token for Grail environments
async function getOAuthToken(config) {
    if (!config.oauthClientId || !config.oauthClientSecret || !config.oauthResourceUrn) {
        console.log('❌ Missing OAuth credentials for Grail environment');
        return null;
    }
    
    return new Promise((resolve, reject) => {
        const postData = new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: config.oauthClientId,
            client_secret: config.oauthClientSecret,
            resource: config.oauthResourceUrn
        }).toString();

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
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    if (response.access_token) {
                        resolve(response.access_token);
                    } else {
                        resolve(null);
                    }
                } catch (e) {
                    resolve(null);
                }
            });
        });

        req.on('error', () => resolve(null));
        req.write(postData);
        req.end();
    });
}

// Enhanced API request
async function makeApiRequest(endpoint, config, options = {}) {
    // Detect if this is a Grail environment and get OAuth token if needed
    const isGrailEnvironment = config.dtEnvironment.includes('.apps.dynatrace.com');
    let authToken = null;
    
    if (isGrailEnvironment) {
        console.log('🔄 Grail environment detected - getting OAuth token...');
        authToken = await getOAuthToken(config);
        if (!authToken) {
            throw new Error('Failed to get OAuth token for Grail environment');
        }
    }
    
    return new Promise((resolve, reject) => {
        let baseUrl;
        
        if (endpoint.startsWith('/platform/')) {
            // Already platform endpoint, use as-is
            baseUrl = config.dtEnvironment + endpoint;
        } else if (endpoint.startsWith('/api/v1/') || endpoint.startsWith('/api/v2/')) {
            if (isGrailEnvironment) {
                // Convert classic API paths to Grail platform paths
                const grailPath = endpoint.replace('/api/', '/platform/classic/environment-api/');
                baseUrl = config.dtEnvironment + grailPath;
                console.log(`🔄 Grail environment detected, using: ${grailPath}`);
            } else {
                // Classic environment, use direct API path
                baseUrl = config.dtEnvironment + endpoint;
            }
        } else {
            // Default API endpoint
            if (isGrailEnvironment) {
                baseUrl = config.dtEnvironment + '/platform/classic/environment-api/v2' + endpoint;
                console.log(`🔄 Grail environment detected, using: /platform/classic/environment-api/v2${endpoint}`);
            } else {
                baseUrl = config.dtEnvironment + '/api/v2' + endpoint;
            }
        }
        
        const parsedUrl = new URL(baseUrl);
        
        const requestOptions = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || 443,
            path: parsedUrl.pathname + parsedUrl.search,
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': isGrailEnvironment ? 
                    `Bearer ${authToken}` : 
                    `Api-Token ${config.apiToken}`,
                ...options.headers
            },
            rejectUnauthorized: false
        };
        
        if (options.body) {
            requestOptions.headers['Content-Length'] = Buffer.byteLength(options.body);
        }

        console.log(`📡 ${options.method || 'GET'} ${baseUrl}`);

        const req = https.request(requestOptions, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`📡 Response: ${res.statusCode} (${data.length} bytes)`);
                
                if (res.statusCode >= 400) {
                    reject(new Error(`API request failed: ${res.statusCode} - ${data.substring(0, 200)}`));
                    return;
                }
                
                try {
                    const parsed = JSON.parse(data);
                    resolve(parsed);
                } catch (e) {
                    console.log(`⚠️  Non-JSON response: ${data.substring(0, 100)}...`);
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

// Method 1: Query Events API for log-like events
async function queryLogEvents(config, query, timeRange = 'now-1h') {
    console.log(`\n🔍 Method 1: Events API (Log Events)`);
    console.log(`   Searching for: ${query}`);
    console.log(`   Time range: ${timeRange}`);
    
    try {
        // Convert time range to milliseconds
        const now = Date.now();
        let fromMs;
        
        if (timeRange.includes('h')) {
            const hours = parseInt(timeRange.replace(/\D/g, ''));
            fromMs = now - (hours * 60 * 60 * 1000);
        } else if (timeRange.includes('m')) {
            const minutes = parseInt(timeRange.replace(/\D/g, ''));
            fromMs = now - (minutes * 60 * 1000);
        } else {
            fromMs = now - (60 * 60 * 1000); // Default 1 hour
        }
        
        const endpoint = `/events?from=${fromMs}&to=${now}&eventTypes=LOG_EVENT,ERROR_EVENT,CUSTOM_ANNOTATION`;
        
        const result = await makeApiRequest(endpoint, config);
        
        if (result && result.events) {
            const matchingEvents = result.events.filter(event => 
                event.title?.toLowerCase().includes(query.toLowerCase()) ||
                event.description?.toLowerCase().includes(query.toLowerCase()) ||
                JSON.stringify(event).toLowerCase().includes(query.toLowerCase())
            );
            
            console.log(`✅ Found ${matchingEvents.length} log-like events (out of ${result.events.length} total)`);
            
            if (matchingEvents.length > 0) {
                console.log('\n📋 Recent Events:');
                matchingEvents.slice(0, 10).forEach((event, i) => {
                    const timestamp = new Date(event.startTime).toLocaleString();
                    console.log(`${i + 1}. [${timestamp}] ${event.eventType}`);
                    console.log(`   Title: ${event.title || 'No title'}`);
                    console.log(`   Description: ${(event.description || '').substring(0, 150)}...`);
                    if (event.entityName) {
                        console.log(`   Entity: ${event.entityName}`);
                    }
                    console.log('');
                });
            }
            
            return matchingEvents;
        }
        
    } catch (error) {
        console.log(`❌ Events API failed: ${error.message}`);
    }
    
    return null;
}

// Method 2: Query Problems API for error-related information
async function queryProblemLogs(config, query, timeRange = 'now-1h') {
    console.log(`\n🔍 Method 2: Problems API (Error Analysis)`);
    
    try {
        const endpoint = `/problems?pageSize=50`;
        const result = await makeApiRequest(endpoint, config);
        
        if (result && result.problems) {
            const matchingProblems = result.problems.filter(problem => 
                problem.title?.toLowerCase().includes(query.toLowerCase()) ||
                problem.displayId?.toLowerCase().includes(query.toLowerCase()) ||
                JSON.stringify(problem.affectedEntities).toLowerCase().includes(query.toLowerCase())
            );
            
            console.log(`✅ Found ${matchingProblems.length} matching problems (out of ${result.totalCount} total)`);
            
            if (matchingProblems.length > 0) {
                console.log('\n📋 Related Problems:');
                matchingProblems.slice(0, 10).forEach((problem, i) => {
                    const timestamp = new Date(problem.startTime).toLocaleString();
                    console.log(`${i + 1}. [${timestamp}] ${problem.severityLevel}`);
                    console.log(`   Title: ${problem.title}`);
                    console.log(`   Status: ${problem.status}`);
                    console.log(`   Impact: ${problem.impactLevel}`);
                    if (problem.affectedEntities && problem.affectedEntities[0]) {
                        console.log(`   Entity: ${problem.affectedEntities[0].name}`);
                    }
                    console.log('');
                });
            }
            
            return matchingProblems;
        }
        
    } catch (error) {
        console.log(`❌ Problems API failed: ${error.message}`);
    }
    
    return null;
}

// Method 3: Query Entity metrics for log-related data
async function queryEntityLogs(config, entityType = 'SERVICE', query) {
    console.log(`\n🔍 Method 3: Entity Metrics (${entityType} logs)`);
    
    try {
        // First get entities - use correct field names
        const entitiesEndpoint = `/entities?entitySelector=type(${entityType})`;
        const entitiesResult = await makeApiRequest(entitiesEndpoint, config);
        
        if (entitiesResult && entitiesResult.entities) {
            console.log(`📋 Found ${entitiesResult.entities.length} ${entityType} entities`);
            
            // Filter entities that match the query
            const matchingEntities = entitiesResult.entities.filter(entity => 
                entity.displayName?.toLowerCase().includes(query.toLowerCase())
            );
            
            if (matchingEntities.length > 0) {
                console.log(`✅ Found ${matchingEntities.length} entities matching "${query}"`);
                
                // Get metrics for these entities
                for (const entity of matchingEntities.slice(0, 5)) {
                    console.log(`\n📊 Entity: ${entity.displayName}`);
                    console.log(`   ID: ${entity.entityId}`);
                    console.log(`   First seen: ${new Date(entity.firstSeenTms).toLocaleString()}`);
                    console.log(`   Last seen: ${new Date(entity.lastSeenTms).toLocaleString()}`);
                    
                    // Try to get error metrics for this entity
                    try {
                        const metricsEndpoint = `/metrics/query?metricSelector=builtin:service.errors.total.rate:filter(eq("dt.entity.service","${entity.entityId}"))&resolution=1m&from=now-1h&to=now`;
                        const metricsResult = await makeApiRequest(metricsEndpoint, config);
                        
                        if (metricsResult && metricsResult.result && metricsResult.result[0] && metricsResult.result[0].data[0]) {
                            const values = metricsResult.result[0].data[0].values;
                            const nonZeroValues = values.filter(v => v > 0);
                            if (nonZeroValues.length > 0) {
                                console.log(`   🔥 Error rate: ${nonZeroValues.slice(-3).join(', ')} (recent values)`);
                            } else {
                                console.log(`   ✅ No errors in last hour`);
                            }
                        }
                    } catch (metricsError) {
                        console.log(`   ⚠️  Could not fetch metrics: ${metricsError.message}`);
                    }
                }
                
                return matchingEntities;
            } else {
                console.log(`ℹ️  No entities found matching "${query}"`);
            }
        }
        
    } catch (error) {
        console.log(`❌ Entity query failed: ${error.message}`);
    }
    
    return null;
}

// Method 4: Query specific AWS Lambda logs if available
async function queryLambdaLogs(config, functionName) {
    console.log(`\n🔍 Method 4: AWS Lambda Analysis`);
    
    try {
        // Get Lambda functions - use correct endpoint
        const lambdasEndpoint = `/entities?entitySelector=type(AWS_LAMBDA_FUNCTION)`;
        const lambdasResult = await makeApiRequest(lambdasEndpoint, config);
        
        if (lambdasResult && lambdasResult.entities) {
            console.log(`📋 Found ${lambdasResult.entities.length} Lambda functions`);
            
            // Find matching Lambda function
            const matchingLambda = lambdasResult.entities.find(lambda => 
                lambda.displayName?.toLowerCase().includes(functionName.toLowerCase())
            );
            
            if (matchingLambda) {
                console.log(`✅ Found Lambda: ${matchingLambda.displayName}`);
                console.log(`   Entity ID: ${matchingLambda.entityId}`);
                console.log(`   First seen: ${new Date(matchingLambda.firstSeenTms).toLocaleString()}`);
                console.log(`   Last seen: ${new Date(matchingLambda.lastSeenTms).toLocaleString()}`);
                
                // Get Lambda metrics
                const metricsTypes = ['errors', 'duration', 'invocations'];
                
                for (const metricType of metricsTypes) {
                    try {
                        const metricSelector = `builtin:cloud.aws.lambda.${metricType}:filter(eq("dt.entity.aws_lambda_function","${matchingLambda.entityId}"))`;
                        const metricsEndpoint = `/metrics/query?metricSelector=${encodeURIComponent(metricSelector)}&resolution=1m&from=now-2h&to=now`;
                        
                        const metricsResult = await makeApiRequest(metricsEndpoint, config);
                        
                        if (metricsResult && metricsResult.result && metricsResult.result[0] && metricsResult.result[0].data[0]) {
                            const values = metricsResult.result[0].data[0].values;
                            const nonZeroValues = values.filter(v => v > 0);
                            
                            if (nonZeroValues.length > 0) {
                                console.log(`   📊 ${metricType}: ${nonZeroValues.slice(-5).join(', ')} (recent values)`);
                                console.log(`   📊 Total ${metricType}: ${nonZeroValues.reduce((a, b) => a + b, 0)}`);
                            } else {
                                console.log(`   📊 ${metricType}: No activity in last 2 hours`);
                            }
                        }
                    } catch (metricError) {
                        console.log(`   ⚠️  ${metricType} metrics unavailable`);
                    }
                }
                
                return matchingLambda;
            } else {
                console.log(`ℹ️  No Lambda function found matching "${functionName}"`);
            }
        }
        
    } catch (error) {
        console.log(`❌ Lambda query failed: ${error.message}`);
    }
    
    return null;
}

// Main search function
async function searchLogs(config, query, timeRange = 'now-1h') {
    console.log(`\n🔍 Comprehensive Log Search for: "${query}"`);
    console.log(`📅 Time Range: ${timeRange}`);
    console.log('=' .repeat(60));
    
    const results = [];
    
    // Try all methods
    const eventsResult = await queryLogEvents(config, query, timeRange);
    if (eventsResult && eventsResult.length > 0) {
        results.push({ method: 'Events API', count: eventsResult.length, data: eventsResult });
    }
    
    const problemsResult = await queryProblemLogs(config, query, timeRange);
    if (problemsResult && problemsResult.length > 0) {
        results.push({ method: 'Problems API', count: problemsResult.length, data: problemsResult });
    }
    
    const servicesResult = await queryEntityLogs(config, 'SERVICE', query);
    if (servicesResult && servicesResult.length > 0) {
        results.push({ method: 'Services', count: servicesResult.length, data: servicesResult });
    }
    
    const lambdasResult = await queryEntityLogs(config, 'AWS_LAMBDA_FUNCTION', query);
    if (lambdasResult && lambdasResult.length > 0) {
        results.push({ method: 'Lambda Functions', count: lambdasResult.length, data: lambdasResult });
    }
    
    // Summary
    console.log(`\n🎯 SEARCH SUMMARY for "${query}"`);
    console.log('=' .repeat(40));
    
    if (results.length > 0) {
        results.forEach(result => {
            console.log(`✅ ${result.method}: ${result.count} results`);
        });
        
        console.log(`\n📊 Total results found: ${results.reduce((sum, r) => sum + r.count, 0)}`);
    } else {
        console.log('❌ No results found across all methods');
        console.log('\n💡 Suggestions:');
        console.log('   - Try a broader search term');
        console.log('   - Check if the service/function name is correct');
        console.log('   - Verify that logs are being ingested into Dynatrace');
        console.log('   - Try searching for specific error codes or messages');
    }
    
    return results;
}

// CLI interface
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0 || args[0] === 'help') {
        console.log(`
🔧 Working Dynatrace Log Query Tool
===================================

This tool uses alternative approaches when direct log access is restricted.

Usage: node working-log-query.js <command> [options]

Commands:
  search <query> [timeRange]     - Comprehensive search across all APIs
  events <query> [timeRange]     - Search events API for log-like entries
  problems <query>               - Search problems for error information
  service <serviceName>          - Analyze specific service
  lambda <functionName>          - Analyze specific Lambda function
  help                          - Show this help

Examples:
  node working-log-query.js search "error" now-2h
  node working-log-query.js events "timeout" now-1h
  node working-log-query.js problems "database"
  node working-log-query.js service "payment-service"
  node working-log-query.js lambda "process-orders"
        `);
        return;
    }
    
    console.log('🚀 Working Dynatrace Log Query Tool');
    console.log('===================================');
    
    const config = loadEnv('dev');
    
    console.log(`🔗 Environment: ${config.dtEnvironment}`);
    console.log(`🔑 API Token: ${config.apiToken ? 'Present ✅' : 'Missing ❌'}`);
    
    const command = args[0];
    
    try {
        switch (command) {
            case 'search':
                if (!args[1]) {
                    console.log('❌ Please provide a search query');
                    break;
                }
                const query = args[1];
                const timeRange = args[2] || 'now-1h';
                await searchLogs(config, query, timeRange);
                break;
                
            case 'events':
                if (!args[1]) {
                    console.log('❌ Please provide a search query');
                    break;
                }
                await queryLogEvents(config, args[1], args[2] || 'now-1h');
                break;
                
            case 'problems':
                if (!args[1]) {
                    console.log('❌ Please provide a search query');
                    break;
                }
                await queryProblemLogs(config, args[1]);
                break;
                
            case 'service':
                if (!args[1]) {
                    console.log('❌ Please provide a service name');
                    break;
                }
                await queryEntityLogs(config, 'SERVICE', args[1]);
                break;
                
            case 'lambda':
                if (!args[1]) {
                    console.log('❌ Please provide a Lambda function name');
                    break;
                }
                await queryLambdaLogs(config, args[1]);
                break;
                
            default:
                console.log(`❌ Unknown command: ${command}`);
                console.log('Use "help" to see available commands');
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
    searchLogs,
    queryLogEvents,
    queryProblemLogs,
    queryEntityLogs,
    queryLambdaLogs
}; 