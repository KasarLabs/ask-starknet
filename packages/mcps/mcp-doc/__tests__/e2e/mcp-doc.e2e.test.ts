import { describe, it, expect } from '@jest/globals';
import { getDataAsRecord } from '@kasarlabs/ask-starknet-core';
import { explainArchitecture } from '../../src/tools/explainArchitecture.js';
import { listCapabilities } from '../../src/tools/listCapabilities.js';
import { suggestProjects } from '../../src/tools/suggestProjects.js';
import { getHelp } from '../../src/tools/getHelp.js';

describe('MCP Doc E2E Tests', () => {
  describe('Explain Architecture tool', () => {
    it('should return architecture content without topic filter', async () => {
      const result = await explainArchitecture({});

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.content).toBeDefined();
        expect(typeof data.content).toBe('string');
        expect(data.content.length).toBeGreaterThan(0);
        expect(data.content.toLowerCase()).toContain('architecture');
      }
    });

    it('should return architecture content with topic="all"', async () => {
      const result = await explainArchitecture({ topic: 'all' });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.content).toBeDefined();
        expect(typeof data.content).toBe('string');
        expect(data.content.length).toBeGreaterThan(0);
      }
    });

    it('should return architecture content with topic="router"', async () => {
      const result = await explainArchitecture({ topic: 'router' });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.content).toBeDefined();
        expect(typeof data.content).toBe('string');
        expect(data.content.length).toBeGreaterThan(0);
      }
    });

    it('should return architecture content with topic="mcps"', async () => {
      const result = await explainArchitecture({ topic: 'mcps' });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.content).toBeDefined();
        expect(typeof data.content).toBe('string');
        expect(data.content.length).toBeGreaterThan(0);
      }
    });

    it('should return architecture content with topic="interaction"', async () => {
      const result = await explainArchitecture({ topic: 'interaction' });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.content).toBeDefined();
        expect(typeof data.content).toBe('string');
        expect(data.content.length).toBeGreaterThan(0);
      }
    });
  });

  describe('List Capabilities tool', () => {
    it('should return capabilities content without filters', async () => {
      const result = await listCapabilities({});

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.content).toBeDefined();
        expect(typeof data.content).toBe('string');
        expect(data.content.length).toBeGreaterThan(0);
        expect(data.content.toLowerCase()).toContain('capabilities');
      }
    });

    it('should return capabilities content with domain="all"', async () => {
      const result = await listCapabilities({ domain: 'all' });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.content).toBeDefined();
        expect(typeof data.content).toBe('string');
        expect(data.content.length).toBeGreaterThan(0);
      }
    });

    it('should return capabilities content with domain="wallets"', async () => {
      const result = await listCapabilities({ domain: 'wallets' });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.content).toBeDefined();
        expect(typeof data.content).toBe('string');
        expect(data.content.length).toBeGreaterThan(0);
      }
    });

    it('should return capabilities content with domain="defi"', async () => {
      const result = await listCapabilities({ domain: 'defi' });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.content).toBeDefined();
        expect(typeof data.content).toBe('string');
        expect(data.content.length).toBeGreaterThan(0);
      }
    });

    it('should return capabilities content with domain="blockchain"', async () => {
      const result = await listCapabilities({ domain: 'blockchain' });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.content).toBeDefined();
        expect(typeof data.content).toBe('string');
        expect(data.content.length).toBeGreaterThan(0);
      }
    });

    it('should return capabilities content with domain="dev-tools"', async () => {
      const result = await listCapabilities({ domain: 'dev-tools' });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.content).toBeDefined();
        expect(typeof data.content).toBe('string');
        expect(data.content.length).toBeGreaterThan(0);
      }
    });

    it('should return capabilities content with domain="special"', async () => {
      const result = await listCapabilities({ domain: 'special' });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.content).toBeDefined();
        expect(typeof data.content).toBe('string');
        expect(data.content.length).toBeGreaterThan(0);
      }
    });

    it('should return capabilities content with mcp filter', async () => {
      const result = await listCapabilities({ mcp: 'avnu' });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.content).toBeDefined();
        expect(typeof data.content).toBe('string');
        expect(data.content.length).toBeGreaterThan(0);
      }
    });

    it('should return capabilities content with domain and mcp filters', async () => {
      const result = await listCapabilities({ domain: 'defi', mcp: 'avnu' });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.content).toBeDefined();
        expect(typeof data.content).toBe('string');
        expect(data.content.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Suggest Projects tool', () => {
    it('should return projects content without filters', async () => {
      const result = await suggestProjects({});

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.content).toBeDefined();
        expect(typeof data.content).toBe('string');
        expect(data.content.length).toBeGreaterThan(0);
        expect(data.content.toLowerCase()).toContain('project');
      }
    });

    it('should return projects content with domain="all"', async () => {
      const result = await suggestProjects({ domain: 'all' });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.content).toBeDefined();
        expect(typeof data.content).toBe('string');
        expect(data.content.length).toBeGreaterThan(0);
      }
    });

    it('should return projects content with domain="defi"', async () => {
      const result = await suggestProjects({ domain: 'defi' });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.content).toBeDefined();
        expect(typeof data.content).toBe('string');
        expect(data.content.length).toBeGreaterThan(0);
      }
    });

    it('should return projects content with domain="nft"', async () => {
      const result = await suggestProjects({ domain: 'nft' });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.content).toBeDefined();
        expect(typeof data.content).toBe('string');
        expect(data.content.length).toBeGreaterThan(0);
      }
    });

    it('should return projects content with domain="trading"', async () => {
      const result = await suggestProjects({ domain: 'trading' });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.content).toBeDefined();
        expect(typeof data.content).toBe('string');
        expect(data.content.length).toBeGreaterThan(0);
      }
    });

    it('should return projects content with domain="automation"', async () => {
      const result = await suggestProjects({ domain: 'automation' });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.content).toBeDefined();
        expect(typeof data.content).toBe('string');
        expect(data.content.length).toBeGreaterThan(0);
      }
    });

    it('should return projects content with domain="analytics"', async () => {
      const result = await suggestProjects({ domain: 'analytics' });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.content).toBeDefined();
        expect(typeof data.content).toBe('string');
        expect(data.content.length).toBeGreaterThan(0);
      }
    });

    it('should return projects content with domain="gaming"', async () => {
      const result = await suggestProjects({ domain: 'gaming' });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.content).toBeDefined();
        expect(typeof data.content).toBe('string');
        expect(data.content.length).toBeGreaterThan(0);
      }
    });

    it('should return projects content with mcps filter', async () => {
      const result = await suggestProjects({ mcps: ['avnu', 'ekubo'] });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.content).toBeDefined();
        expect(typeof data.content).toBe('string');
        expect(data.content.length).toBeGreaterThan(0);
      }
    });

    it('should return projects content with domain and mcps filters', async () => {
      const result = await suggestProjects({
        domain: 'defi',
        mcps: ['avnu'],
      });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.content).toBeDefined();
        expect(typeof data.content).toBe('string');
        expect(data.content.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Get Help tool', () => {
    it('should return help content without topic filter', async () => {
      const result = await getHelp({});

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.content).toBeDefined();
        expect(typeof data.content).toBe('string');
        expect(data.content.length).toBeGreaterThan(0);
        expect(data.content.toLowerCase()).toContain('help');
      }
    });

    it('should return help content with topic="all"', async () => {
      const result = await getHelp({ topic: 'all' });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.content).toBeDefined();
        expect(typeof data.content).toBe('string');
        expect(data.content.length).toBeGreaterThan(0);
      }
    });

    it('should return help content with topic="quickstart"', async () => {
      const result = await getHelp({ topic: 'quickstart' });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.content).toBeDefined();
        expect(typeof data.content).toBe('string');
        expect(data.content.length).toBeGreaterThan(0);
      }
    });

    it('should return help content with topic="setup"', async () => {
      const result = await getHelp({ topic: 'setup' });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.content).toBeDefined();
        expect(typeof data.content).toBe('string');
        expect(data.content.length).toBeGreaterThan(0);
      }
    });

    it('should return help content with topic="capabilities"', async () => {
      const result = await getHelp({ topic: 'capabilities' });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.content).toBeDefined();
        expect(typeof data.content).toBe('string');
        expect(data.content.length).toBeGreaterThan(0);
      }
    });

    it('should return help content with topic="troubleshooting"', async () => {
      const result = await getHelp({ topic: 'troubleshooting' });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.content).toBeDefined();
        expect(typeof data.content).toBe('string');
        expect(data.content.length).toBeGreaterThan(0);
      }
    });
  });
});
