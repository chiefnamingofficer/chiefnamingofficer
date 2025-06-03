#!/usr/bin/env node

/**
 * Dynatrace OAuth Tool
 * Working OAuth-based Dynatrace integration (bypassing MCP server issues)
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load environment variables from env/.env.dev
function loadEnv() {
    // Look for env/.env.dev relative to the project root (parent directory of tools)
    const envPath = path.join(__dirname, '..', 'env', '.env.dev');
    if (!fs.existsSync(envPath)) {
        console.error('❌ env/.env.dev file not found');
        console.error(`   Expected path: ${envPath}`);
        process.exit(1);
    }
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    const config = {};
    lines.forEach(line => {
        line = line.trim();
        if (line && !line.startsWith('#')) {
            if (line.startsWith('DT_ENVIRONMENT=')) config.dtEnvironment = line.split('=').slice(1).join('=');
            if (line.startsWith('OAUTH_CLIENT_ID=')) config.clientId = line.split('=').slice(1).join('=');
            if (line.startsWith('OAUTH_CLIENT_SECRET=')) config.clientSecret = line.split('=').slice(1).join('=');
            if (line.startsWith('OAUTH_RESOURCE_URN=')) config.resourceUrn = line.split('=').slice(1).join('=');
        }
    });
    
    return config;
}

// Get OAuth bearer token
async function getBearerToken(config, scopes = 'environment-api:problems:read environment-api:entities:read') {
    return new Promise((resolve, reject) => {
        const postData = `grant_type=client_credentials&client_id=${config.clientId}&client_secret=${config.clientSecret}&scope=${encodeURIComponent(scopes)}&resource=${encodeURIComponent(config.resourceUrn)}`;
        
        const options = {
            hostname: 'sso.dynatrace.com',
            port: 443,
            path: '/sso/oauth2/token',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData)
            },
            // Handle SSL certificate issues
            rejectUnauthorized: false
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.access_token) {
                        resolve(parsed.access_token);
                    } else {
                        reject(new Error(`OAuth failed: ${data}`));
                    }
                } catch (e) {
                    reject(new Error(`OAuth parse error: ${e.message}`));
                }
            });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

// Make authenticated API request
async function apiRequest(endpoint, token, config) {
    return new Promise((resolve, reject) => {
        // Detect if this is a Grail environment and adjust endpoint
        const isGrailEnvironment = config.dtEnvironment.includes('.apps.dynatrace.com');
        let url;
        
        if (isGrailEnvironment) {
            // Use Grail platform endpoints
            url = `${config.dtEnvironment}/platform/classic/environment-api/v2${endpoint}`;
        } else {
            // Use classic endpoints
            url = `${config.dtEnvironment}/api/v2${endpoint}`;
        }
        
        const options = {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            // Handle SSL certificate issues
            rejectUnauthorized: false
        };

        console.log(`📡 GET ${url}`);

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

// Main CLI
async function main() {
    const config = loadEnv();
    const command = process.argv[2] || 'problems';
    
    console.log('🚀 Dynatrace OAuth Tool (Updated for env/ structure)');
    console.log('===================================================');
    console.log(`🔗 Environment: ${config.dtEnvironment}`);
    console.log(`🔑 Client: ${config.clientId ? config.clientId.substring(0, 15) + '...' : 'Missing'}`);
    
    if (!config.clientId || !config.clientSecret || !config.resourceUrn) {
        console.error('❌ Missing OAuth configuration in env/.env.dev');
        console.error('   Required: OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET, OAUTH_RESOURCE_URN');
        process.exit(1);
    }
    
    try {
        console.log('🔄 Getting OAuth token...');
        const token = await getBearerToken(config);
        console.log('✅ OAuth token obtained!');
        console.log('');

        if (command === 'problems') {
            console.log('🔍 Fetching problems...');
            const result = await apiRequest('/problems?pageSize=5', token, config);
            
            if (result.problems) {
                console.log(`📋 Found ${result.totalCount} total problems (showing ${result.problems.length}):`);
                result.problems.forEach((problem, i) => {
                    console.log(`${i + 1}. ${problem.title} (${problem.status})`);
                    console.log(`   🎯 ${problem.impactLevel} | ⚠️ ${problem.severityLevel}`);
                    console.log(`   🕐 ${new Date(problem.startTime).toLocaleString()}`);
                    if (problem.affectedEntities && problem.affectedEntities[0]) {
                        console.log(`   📦 Entity: ${problem.affectedEntities[0].name}`);
                    }
                    console.log('');
                });
            } else {
                console.log('No problems found or error occurred');
                console.log('Response:', result);
            }
        } else if (command === 'entities') {
            console.log('🏢 Fetching entities...');
            const result = await apiRequest('/entities?pageSize=5', token, config);
            
            if (result.entities) {
                console.log(`🏢 Found ${result.entities.length} entities:`);
                result.entities.forEach((entity, i) => {
                    console.log(`${i + 1}. ${entity.displayName} (${entity.type})`);
                    console.log(`   ID: ${entity.entityId}`);
                    console.log('');
                });
            } else {
                console.log('No entities found or error occurred');
                console.log('Response:', result);
            }
        } else {
            console.log('Usage: node dynatrace-oauth-tool.js [problems|entities]');
            console.log('');
            console.log('Examples:');
            console.log('  node tools/dynatrace-oauth-tool.js problems');
            console.log('  node tools/dynatrace-oauth-tool.js entities');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

if (require.main === module) {
    main().catch(console.error);
} 