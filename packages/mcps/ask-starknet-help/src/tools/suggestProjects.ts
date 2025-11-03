import { z } from 'zod';
import { suggestProjectsSchema } from '../schemas/index.js';
import { PROJECT_IDEAS } from '../lib/projectIdeas.js';

/**
 * Suggest project ideas that can be built with Ask Starknet
 */
export const suggestProjects = async (
  params: z.infer<typeof suggestProjectsSchema>
) => {
  try {
    const { domain = 'all', mcps } = params;

    let filteredProjects = PROJECT_IDEAS;

    // Filter by domain if specified
    if (domain && domain !== 'all') {
      filteredProjects = filteredProjects.filter(
        (project) => project.domain === domain
      );
    }

    // Filter by MCPs if specified
    if (mcps && mcps.length > 0) {
      filteredProjects = filteredProjects.filter((project) =>
        mcps.some((mcp) => project.requiredMCPs.includes(mcp))
      );
    }

    return {
      status: 'success',
      data: {
        projects: filteredProjects,
        totalProjects: filteredProjects.length,
        filters: {
          domain: domain || 'all',
          mcps: mcps || [],
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
