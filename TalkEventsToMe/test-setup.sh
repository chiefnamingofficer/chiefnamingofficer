#!/bin/bash

echo "🔍 TalkEventsToMe - Setup Verification"
echo "======================================"
echo

# Test 1: Check if npx is available
echo "✅ Testing npx availability..."
if command -v npx &> /dev/null; then
    echo "   ✓ npx is available"
else
    echo "   ❌ npx is not available - please install Node.js"
    exit 1
fi
echo

# Test 2: Test EventCatalog MCP server installation
echo "✅ Testing EventCatalog MCP server installation..."
if npx -y @eventcatalog/mcp-server --help &> /dev/null; then
    echo "   ✓ EventCatalog MCP server can be installed"
else
    echo "   ❌ EventCatalog MCP server installation failed"
fi
echo

# Test 3: Check EventCatalog instance accessibility
echo "✅ Testing EventCatalog instance accessibility..."
if curl -I -s -m 10 https://eventcatalog.compassdigital.org/ | grep -q "HTTP/"; then
    echo "   ✓ EventCatalog instance is accessible"
else
    echo "   ⚠️  EventCatalog instance might not be accessible (could be due to OAuth protection)"
fi
echo

# Test 4: Check MCP configuration file
echo "✅ Checking MCP configuration..."
if [ -f ".mcp.json" ]; then
    echo "   ✓ .mcp.json file exists"
    if grep -q "YOUR_EVENTCATALOG_SCALE_LICENSE_KEY" .mcp.json; then
        echo "   ⚠️  License key placeholder found - please update with your actual key"
    else
        echo "   ✓ License key appears to be configured"
    fi
else
    echo "   ❌ .mcp.json file not found"
fi
echo

# Test 5: Check package.json
echo "✅ Checking project configuration..."
if [ -f "package.json" ]; then
    echo "   ✓ package.json exists"
else
    echo "   ❌ package.json not found"
fi
echo

echo "🎯 Next Steps:"
echo "=============="
echo "1. If you see any ❌ errors above, please fix them first"
echo "2. Update your EventCatalog Scale license key in .mcp.json"
echo "3. Restart Cursor to load the MCP server"
echo "4. Start asking questions about your EventCatalog!"
echo
echo "📚 For help, check:"
echo "   - README.md for setup instructions"
echo "   - LEARNING_GUIDE.md for learning exercises"
echo
echo "Happy learning! 🚀" 