#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

console.log('🧪 Testing MCP tool registration...\n');

const mcpsConfig = JSON.parse(
  fs.readFileSync('packages/mcp/mcps.json', 'utf8')
);

async function getMCPTools(mcpName) {
  return new Promise((resolve, reject) => {
    const mcpPath = path.join('packages/mcps', mcpName, 'build', 'index.js');

    // Set up environment variables if needed
    const envVars = { ...process.env };

    // Add any environment variables declared in the MCP config
    const mcpConfig = mcpsConfig[mcpName];
    if (mcpConfig.client && mcpConfig.client.env) {
      for (const [envVar, defaultValue] of Object.entries(
        mcpConfig.client.env
      )) {
        if (!envVars[envVar]) {
          envVars[envVar] = defaultValue || 'test-value';
        }
      }
    }

    const child = spawn('node', [mcpPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: envVars,
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    // Send MCP initialization
    const initMessage = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'test-client', version: '1.0.0' },
      },
    };

    child.stdin.write(JSON.stringify(initMessage) + '\n');

    // Send tools list request
    setTimeout(() => {
      const toolsMessage = {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list',
        params: {},
      };
      child.stdin.write(JSON.stringify(toolsMessage) + '\n');
      child.stdin.end();
    }, 1000);

    child.on('close', (code) => {
      // Parse MCP responses
      const lines = stdout.split('\n').filter((line) => line.trim());
      const tools = [];

      for (const line of lines) {
        try {
          const msg = JSON.parse(line);
          if (msg.result && msg.result.tools) {
            tools.push(...msg.result.tools.map((t) => t.name));
          }
        } catch (e) {
          // Ignore non-JSON lines (like stderr output)
        }
      }

      if (tools.length === 0 && code !== 0) {
        reject(new Error(`MCP ${mcpName} failed. stderr: ${stderr}`));
      } else {
        resolve(tools);
      }
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      child.kill();
      reject(new Error(`Timeout testing ${mcpName}`));
    }, 10000);
  });
}

async function validateAllTools() {
  let hasErrors = false;

  for (const [mcpName, config] of Object.entries(mcpsConfig)) {
    console.log(`\n📋 Testing ${mcpName}...`);

    const mcpPath = path.join('packages/mcps', mcpName, 'build', 'index.js');
    if (!fs.existsSync(mcpPath)) {
      console.error(`❌ Build not found: ${mcpPath}`);
      hasErrors = true;
      continue;
    }

    // Get declared tools from config
    const declaredTools = config.promptInfo?.tools || [];
    console.log(`📝 Declared tools: ${declaredTools.join(', ')}`);

    // Get actual tools from MCP
    try {
      const actualTools = await getMCPTools(mcpName);
      console.log(`🔧 Actual tools: ${actualTools.join(', ')}`);

      // Check for missing tools
      const missingTools = declaredTools.filter(
        (tool) => !actualTools.includes(tool)
      );
      if (missingTools.length > 0) {
        console.error(
          `❌ Tools declared in config but not implemented: ${missingTools.join(', ')}`
        );
        hasErrors = true;
      }

      // Check for undeclared tools
      const undeclaredTools = actualTools.filter(
        (tool) => !declaredTools.includes(tool)
      );
      if (undeclaredTools.length > 0) {
        console.error(
          `❌ Tools implemented but not declared in config: ${undeclaredTools.join(', ')}`
        );
        hasErrors = true;
      }

      if (missingTools.length === 0 && undeclaredTools.length === 0) {
        console.log(`✅ ${mcpName} tool configuration matches implementation`);
      }
    } catch (error) {
      console.error(`❌ Failed to test ${mcpName}:`, error.message);
      hasErrors = true;
    }
  }

  if (hasErrors) {
    console.error('\n❌ Tool validation failed!');
    process.exit(1);
  } else {
    console.log('\n✅ All tool configurations are valid!');
  }
}

validateAllTools();
