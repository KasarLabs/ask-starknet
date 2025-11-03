import { z } from 'zod';
import { listCapabilitiesSchema } from '../schemas/index.js';
import { MCPS_DATA } from '../lib/mcpsData.js';
import { MCP_DOMAINS, DOMAIN_DESCRIPTIONS } from '../lib/constants.js';

/**
 * List Ask Starknet capabilities organized by domains
 */
export const listCapabilities = async (
  params: z.infer<typeof listCapabilitiesSchema>
) => {
  try {
    const { domain = 'all', mcp } = params;

    // If specific MCP requested, return only that MCP's info
    if (mcp) {
      const mcpData = MCPS_DATA[mcp as keyof typeof MCPS_DATA];
      if (!mcpData) {
        return {
          status: 'failure',
          error: `MCP "${mcp}" not found`,
        };
      }

      // Find which domain this MCP belongs to
      let mcpDomain = 'unknown';
      for (const [domainName, mcps] of Object.entries(MCP_DOMAINS)) {
        if ((mcps as readonly string[]).includes(mcp)) {
          mcpDomain = domainName;
          break;
        }
      }

      return {
        status: 'success',
        data: {
          mcp: mcp,
          domain: mcpDomain,
          description: mcpData.description,
          tools: mcpData.promptInfo.tools,
          expertise: mcpData.promptInfo.expertise,
          environmentVariables: Object.keys((mcpData.client as any).env || {}),
        },
      };
    }

    // Build domains data
    const domainsData: any = {};

    const domainFilter =
      domain === 'all' ? Object.keys(MCP_DOMAINS) : [domain];

    for (const domainName of domainFilter) {
      if (!MCP_DOMAINS[domainName as keyof typeof MCP_DOMAINS]) {
        continue;
      }

      const mcpsInDomain = MCP_DOMAINS[domainName as keyof typeof MCP_DOMAINS];
      const mcpsInfo: any = {};

      for (const mcpName of mcpsInDomain) {
        const mcpData = MCPS_DATA[mcpName as keyof typeof MCPS_DATA];
        if (mcpData) {
          mcpsInfo[mcpName] = {
            description: mcpData.description,
            tools: mcpData.promptInfo.tools,
            expertise: mcpData.promptInfo.expertise,
            toolCount: mcpData.promptInfo.tools.length,
            environmentVariables: Object.keys((mcpData.client as any).env || {}),
          };
        }
      }

      domainsData[domainName] = {
        description:
          DOMAIN_DESCRIPTIONS[domainName as keyof typeof DOMAIN_DESCRIPTIONS],
        mcps: mcpsInfo,
        mcpCount: Object.keys(mcpsInfo).length,
      };
    }

    // Calculate statistics
    const allMcps = Object.keys(MCPS_DATA);
    const totalTools = allMcps.reduce((sum, mcpName) => {
      const mcpData = MCPS_DATA[mcpName as keyof typeof MCPS_DATA];
      return sum + (mcpData?.promptInfo?.tools?.length || 0);
    }, 0);

    const mcpsByDomain: Record<string, number> = {};
    for (const [domainName, mcps] of Object.entries(MCP_DOMAINS)) {
      mcpsByDomain[domainName] = mcps.length;
    }

    return {
      status: 'success',
      data: {
        domains: domainsData,
        statistics: {
          totalMCPs: allMcps.length,
          totalTools: totalTools,
          mcpsByDomain: mcpsByDomain,
        },
      },
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
