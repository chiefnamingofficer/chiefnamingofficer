#!/usr/bin/env node

/**
 * Grail-Compatible Dynatrace Log Query Tool
 * Uses OAuth Bearer authentication for Grail environments (apps.dynatrace.com)
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// Handle certificate issues for testing
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

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

// Get OAuth Bearer token
async function getOAuthToken(config) {
    return new Promise((resolve, reject) => {
        const postData = `grant_type=client_credentials&client_id=${config.oauthClientId}&client_secret=${config.oauthClientSecret}&scope=environment-api:problems:read environment-api:entities:read environment-api:events:read`;
        
        const options = {
            hostname: 'sso.dynatrace.com',
            path: '/sso/oauth2/token',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    const tokenData = JSON.parse(data);
                    console.log(`🔐 OAuth token obtained (expires in ${tokenData.expires_in}s)`);
                    resolve(tokenData.access_token);
                } else {
                    reject(`OAuth failed: ${res.statusCode} - ${data}`);
                }
            });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

// Grail API request with Bearer authentication
function makeGrailApiRequest(endpoint, bearerToken, config, options = {}) {
    return new Promise((resolve, reject) => {
        // Always use Grail platform paths
        let fullPath;
        if (endpoint.startsWith('/platform/')) {
            fullPath = endpoint;
        } else if (endpoint.startsWith('/api/')) {
            fullPath = endpoint.replace('/api/', '/platform/classic/environment-api/');
        } else {
            fullPath = '/platform/classic/environment-api/v2' + endpoint;
        }
        
        const baseUrl = config.dtEnvironment + fullPath;
        const parsedUrl = new URL(baseUrl);
        
        const requestOptions = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || 443,
            path: parsedUrl.pathname + parsedUrl.search,
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${bearerToken}`,
                'Accept': 'application/json',
                ...options.headers
            }
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
                    reject(new Error(`API request failed: ${res.statusCode} - ${data.substring(0, 300)}`));
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

// Query Problems API for error information
async function queryProblemsAPI(bearerToken, config, query) {
    console.log(`\n🔍 Searching Problems API for: "${query}"`);
    
    try {
        const endpoint = `/problems?pageSize=50`;
        const result = await makeGrailApiRequest(endpoint, bearerToken, config);
        
        if (result && result.problems) {
            const matchingProblems = result.problems.filter(problem => 
                problem.title?.toLowerCase().includes(query.toLowerCase()) ||
                problem.displayId?.toLowerCase().includes(query.toLowerCase()) ||
                JSON.stringify(problem.affectedEntities || []).toLowerCase().includes(query.toLowerCase())
            );
            
            console.log(`✅ Found ${matchingProblems.length} matching problems (out of ${result.problems.length} total)`);
            
            if (matchingProblems.length > 0) {
                console.log('\n📋 Related Problems:');
                matchingProblems.slice(0, 10).forEach((problem, i) => {
                    const timestamp = new Date(problem.startTime).toLocaleString();
                    console.log(`${i + 1}. [${timestamp}] ${problem.severityLevel} - ${problem.status}`);
                    console.log(`   Title: ${problem.title}`);
                    console.log(`   Impact: ${problem.impactLevel}`);
                    if (problem.affectedEntities && problem.affectedEntities[0]) {
                        console.log(`   Entity: ${problem.affectedEntities[0].name}`);
                    }
                    console.log('');
                });
                return matchingProblems;
            }
        }
        
    } catch (error) {
        console.log(`❌ Problems API failed: ${error.message}`);
    }
    
    return [];
}

// Query Events API
async function queryEventsAPI(bearerToken, config, query, timeRange = 'now-1h') {
    console.log(`\n🔍 Searching Events API for: "${query}"`);
    
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
        
        const endpoint = `/events?from=${fromMs}&to=${now}&eventTypes=LOG_EVENT,ERROR_EVENT,CUSTOM_ANNOTATION,AVAILABILITY_EVENT`;
        const result = await makeGrailApiRequest(endpoint, bearerToken, config);
        
        if (result && result.events) {
            const matchingEvents = result.events.filter(event => 
                event.title?.toLowerCase().includes(query.toLowerCase()) ||
                event.description?.toLowerCase().includes(query.toLowerCase()) ||
                JSON.stringify(event).toLowerCase().includes(query.toLowerCase())
            );
            
            console.log(`✅ Found ${matchingEvents.length} matching events (out of ${result.events.length} total)`);
            
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
                return matchingEvents;
            }
        }
        
    } catch (error) {
        console.log(`❌ Events API failed: ${error.message}`);
    }
    
    return [];
}

// Query Entities API
async function queryEntitiesAPI(bearerToken, config, entityType = 'AWS_LAMBDA_FUNCTION') {
    console.log(`\n🔍 Searching ${entityType} entities`);
    
    try {
        const endpoint = `/entities?entitySelector=type(${entityType})&pageSize=50`;
        const result = await makeGrailApiRequest(endpoint, bearerToken, config);
        
        if (result && result.entities) {
            console.log(`✅ Found ${result.entities.length} ${entityType} entities`);
            
            if (result.entities.length > 0) {
                console.log(`\n📋 ${entityType} Entities:`);
                result.entities.slice(0, 20).forEach((entity, i) => {
                    console.log(`${i + 1}. ${entity.displayName || entity.entityId}`);
                    if (entity.properties && entity.properties.awsAccountId) {
                        console.log(`   AWS Account: ${entity.properties.awsAccountId}`);
                    }
                    if (entity.tags && entity.tags.length > 0) {
                        console.log(`   Tags: ${entity.tags.map(t => t.value).join(', ')}`);
                    }
                });
                return result.entities;
            }
        }
        
    } catch (error) {
        console.log(`❌ Entities API failed: ${error.message}`);
    }
    
    return [];
}

// Main search function
async function searchLogs(config, query, timeRange = 'now-1h') {
    console.log(`\n🚀 Grail-Compatible Dynatrace Search`);
    console.log(`🔗 Environment: ${config.dtEnvironment}`);
    console.log(`🔍 Searching for: "${query}"`);
    console.log(`📅 Time Range: ${timeRange}`);
    console.log('============================================================');

    try {
        // Get OAuth token
        const bearerToken = await getOAuthToken(config);
        
        // Search across different APIs
        const results = {
            problems: await queryProblemsAPI(bearerToken, config, query),
            events: await queryEventsAPI(bearerToken, config, query, timeRange),
            lambdas: await queryEntitiesAPI(bearerToken, config, 'AWS_LAMBDA_FUNCTION'),
            services: await queryEntitiesAPI(bearerToken, config, 'SERVICE')
        };
        
        // Summary
        console.log(`\n🎯 SEARCH SUMMARY for "${query}"`);
        console.log('========================================');
        console.log(`📊 Problems: ${results.problems.length}`);
        console.log(`📊 Events: ${results.events.length}`);
        console.log(`📊 Lambda Functions: ${results.lambdas.length}`);
        console.log(`📊 Services: ${results.services.length}`);
        
        return results;
        
    } catch (error) {
        console.error('❌ Search failed:', error);
        return null;
    }
}

// CLI interface
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0 || args[0] === 'help') {
        console.log(`
🔧 Grail-Compatible Dynatrace Log Query Tool
===========================================

This tool uses OAuth Bearer authentication for Grail environments.

Usage: node grail-log-query.js <query> [timeRange]

Examples:
  node grail-log-query.js "error" now-2h
  node grail-log-query.js "timeout" now-1h
  node grail-log-query.js "lambda" now-30m
        `);
        return;
    }
    
    const config = loadEnv();
    
    if (!config.dtEnvironment || !config.oauthClientId || !config.oauthClientSecret) {
        console.error('❌ Missing OAuth configuration in .env.dev file');
        console.error('Required: DT_ENVIRONMENT, OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET');
        return;
    }
    
    const query = args[0];
    const timeRange = args[1] || 'now-1h';
    
    await searchLogs(config, query, timeRange);
}

if (require.main === module) {
    main();
} 