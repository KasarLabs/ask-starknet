# Publication Strategy for Ask Starknet

This document explains the publication strategy for the Ask Starknet monorepo with Lerna.

## Architecture Overview

Ask Starknet uses a **monorepo** with the following structure:

```
packages/
├── core/                    # @ask-starknet/core - Shared utilities
├── mcp/                     # @kasarlabs/ask-starknet-mcp - Main router
└── mcps/                    # Individual MCP servers
    ├── argent/
    ├── avnu/
    ├── cairo-coder/
    ├── extended/
    └── ... (20 MCPs total)
```

### How the Router Works

The MCP router (`packages/mcp`) uses `@langchain/mcp-adapters` to:
1. Receive user requests
2. Route to the appropriate MCP via AI-powered decision
3. Launch MCPs as **subprocesses** via `npx` command
4. Execute MCP tools and return results

**Key point**: MCPs are launched dynamically using `npx @kasarlabs/{mcp-name}`, which downloads and caches them from npm registry on first use.

## Publication Strategy: Independent Packages with npx

### Chosen Approach: Independent Mode without Bundle

**Lerna Mode**: `independent` (each package has its own version)

**Rationale**:
- All packages (router + MCPs) are published independently to npm
- Router uses `npx` to dynamically launch MCPs from npm registry
- No bundling needed - npx handles downloading and caching
- Each MCP can be updated and published without affecting the router
- Users get automatic updates via npx cache invalidation

### Packages Published to npm

#### 1. Core Package (always published)
- **`@ask-starknet/core`** - Shared utilities used by all MCPs
- Published separately as a dependency

#### 2. Main Router (always published)
- **`@kasarlabs/ask-starknet-mcp`** - AI-powered routing agent
- Users run: `npx @kasarlabs/ask-starknet-mcp`
- Lightweight package (~500 KB) - no MCPs bundled
- Launches MCPs via `npx` dynamically

#### 3. All Individual MCPs (published separately)
All 20 MCPs are published individually:
- `@kasarlabs/argent-mcp` - Argent wallet integration
- `@kasarlabs/avnu-mcp` - AVNU DEX integration
- `@kasarlabs/braavos-mcp` - Braavos wallet integration
- `@kasarlabs/cairo-coder-mcp` - AI-powered Cairo assistance
- `@kasarlabs/contract-mcp` - Contract deployment
- `@kasarlabs/ekubo-mcp` - Ekubo AMM integration
- `@kasarlabs/endurfi-mcp` - Endur.fi liquid staking
- `@kasarlabs/erc20-mcp` - ERC20 operations
- `@kasarlabs/erc721-mcp` - ERC721 NFT operations
- `@kasarlabs/extended-mcp` - Perpetuals trading
- `@kasarlabs/fibrous-mcp` - Fibrous DEX integration
- `@kasarlabs/okx-mcp` - OKX wallet integration
- `@kasarlabs/openzeppelin-mcp` - OpenZeppelin accounts
- `@kasarlabs/opus-mcp` - Opus lending protocol
- `@kasarlabs/scarb-mcp` - Scarb toolchain
- `@kasarlabs/starknet-rpc-mcp` - Starknet RPC operations
- `@kasarlabs/transaction-mcp` - Transaction management
- `@kasarlabs/unruggable-mcp` - Memecoin creation
- `@kasarlabs/vesu-mcp` - Vesu lending protocol
- `@kasarlabs/artpeace-mcp` - Collaborative pixel art

## Technical Details

### Router Package Structure

The main package `@kasarlabs/ask-starknet-mcp` contains:

```
build/
  ├── index.js              # Router entry point
  └── graph/                # AI routing logic
mcps.json                   # MCP configuration (commands to launch via npx)
package.json
README.md
```

### Size Metrics

- Router package: ~500 KB (just the routing logic)
- Individual MCPs: 48 KB to 1.1 MB each
- Largest: extended (1.1 MB), ekubo (628 KB), opus (584 KB)
- Smallest: cairo-coder (48 KB)
- Total if all MCPs downloaded: ~6.5 MB (cached by npx)

### MCP Launch Configuration (mcps.json)

MCPs are configured to launch via `npx`:

```json
{
  "erc20": {
    "client": {
      "command": "npx",
      "args": ["@kasarlabs/erc20-mcp"],
      "transport": "stdio",
      "env": {
        "STARKNET_RPC_URL": "",
        "STARKNET_ACCOUNT_ADDRESS": "",
        "STARKNET_PRIVATE_KEY": ""
      }
    },
    "description": "Management of ERC20 operations",
    "promptInfo": {
      "expertise": "ERC20 tokens on Starknet",
      "tools": ["erc20_transfer", "erc20_get_balance", ...]
    }
  }
}
```

### Workspace Dependencies

MCPs use `workspace:^` protocol for core dependency:

```json
{
  "dependencies": {
    "@ask-starknet/core": "workspace:^"
  }
}
```

**Publishing behavior**: pnpm automatically converts `workspace:^` to `^1.0.0` when publishing.

## Lerna Configuration

### lerna.json

```json
{
  "version": "independent",
  "npmClient": "pnpm",
  "useWorkspaces": true,
  "command": {
    "publish": {
      "ignoreChanges": [
        "*.md",
        "*.test.ts",
        "*.spec.ts"
      ],
      "message": "chore(release): publish %s"
    },
    "version": {
      "allowBranch": "main",
      "message": "chore(release): version packages"
    }
  }
}
```

### Package Configuration

All packages should be publishable (no `"private": true` unless intentionally excluded).

**Example MCP package.json:**
```json
{
  "name": "@kasarlabs/erc20-mcp",
  "version": "0.1.0",
  "main": "build/index.js",
  "bin": {
    "erc20-mcp": "./build/index.js"
  },
  "files": ["build"],
  "dependencies": {
    "@ask-starknet/core": "workspace:^",
    "@modelcontextprotocol/sdk": "^1.11.2"
  }
}
```

## Publication Workflow

### Prerequisites

1. Install Lerna:
```bash
pnpm add -D lerna
```

2. Configure npm authentication:
```bash
npm login
# OR
export NPM_TOKEN="your_npm_token"
```

### Manual Publication Steps

#### Publishing All Packages (First Time)

```bash
# 1. Build all packages
pnpm build

# 2. Version all packages
lerna version --no-private
# Lerna prompts for version of each package

# 3. Publish to npm
lerna publish from-package --no-private
```

#### Publishing Updated MCP(s)

```bash
# 1. Make changes to specific MCP(s)
# 2. Build
pnpm build

# 3. Version changed packages only
lerna version --no-private
# Lerna detects only changed packages

# 4. Publish
lerna publish from-package --no-private
```

**Note**: Router automatically uses the latest published MCP version via npx - no need to republish the router!

#### Publishing Router Updates

```bash
# 1. Make changes to router
# 2. Build
pnpm build

# 3. Version router only
lerna version --no-private
# Lerna detects only router changed

# 4. Publish
lerna publish from-package --no-private
```

### What Gets Published

With `--no-private` flag, Lerna publishes all non-private packages:
- `@ask-starknet/core`
- `@kasarlabs/ask-starknet-mcp` (router)
- All 20 individual MCPs

### Publication Order

Lerna automatically handles the correct order based on dependencies:
1. First: `@ask-starknet/core` (no dependencies)
2. Then: All MCPs (depend on core)
3. Finally: `@kasarlabs/ask-starknet-mcp` (router, no dependencies on MCPs)

## Version Management

### Independent Mode Behavior

Each package has its own version:
- Only changed packages are prompted for version bump
- Router and MCPs have completely independent versions
- Updating one MCP doesn't affect the router or other MCPs
- npx always downloads the latest published version

**Example Scenario: Publishing Individual MCP**
```
Initial state:
@ask-starknet/core                v1.0.0
@kasarlabs/cairo-coder-mcp        v0.1.0
@kasarlabs/extended-mcp           v0.5.0
@kasarlabs/ask-starknet-mcp       v1.0.0

Change cairo-coder → Run lerna version

Result:
@ask-starknet/core                v1.0.0 (unchanged)
@kasarlabs/cairo-coder-mcp        v0.1.0 → v0.2.0 (updated)
@kasarlabs/extended-mcp           v0.5.0 (unchanged)
@kasarlabs/ask-starknet-mcp       v1.0.0 (unchanged)

When user runs: npx @kasarlabs/ask-starknet-mcp
→ Router launches: npx @kasarlabs/cairo-coder-mcp
→ npx downloads v0.2.0 automatically ✅
```

### When to Publish

**Individual MCPs**:
- Publish when the MCP code is modified
- Independent of router
- Users automatically get updates via npx

**Router (`@kasarlabs/ask-starknet-mcp`)**:
- Publish when router logic changes
- Publish when mcps.json configuration changes
- No need to republish when MCPs update

**Core (`@ask-starknet/core`)**:
- Publish when shared utilities change
- MCPs that depend on it should be republished

## Usage Scenarios

### User: Full Router Experience
```bash
npx @kasarlabs/ask-starknet-mcp
# Router launches MCPs via npx as needed
# MCPs are downloaded and cached automatically
```

### User: Specific MCP Only
```bash
npx @kasarlabs/cairo-coder-mcp
# Only Cairo coding assistance

npx @kasarlabs/extended-mcp
# Only perpetuals trading
```

### Developer: Local Development
```bash
git clone https://github.com/kasarlabs/ask-starknet
cd ask-starknet
pnpm install
pnpm build
cd packages/mcp
node build/index.js
```

## Advantages of This Strategy

1. **Ultra simple**: No bundling, no complex build scripts
2. **Lightweight router**: ~500 KB package size
3. **Automatic updates**: npx downloads latest versions automatically
4. **Independent releases**: Update any MCP without touching the router
5. **No version synchronization needed**: Each package evolves independently
6. **npx caching**: MCPs are cached locally after first download
7. **Standard npm workflow**: Uses established tools (Lerna, pnpm, npx)

## Disadvantages and Trade-offs

1. **First use latency**: npx downloads MCPs on first use (~10-30 seconds total)
2. **Network dependency**: Requires internet to download MCPs initially
3. **More packages to manage**: 22 total packages (1 core + 1 router + 20 MCPs)
4. **npx cache management**: Users may need to clear npx cache for updates

## Implementation Checklist

### Code Changes Required

1. **Modify `packages/mcps/mcps.json`**:
   - Change all `"args": ["build/index.js"]` to `"args": ["@kasarlabs/{mcp-name}-mcp"]`
   - Change all `"command": "node"` to `"command": "npx"`

2. **Modify `packages/mcp/src/graph/mcps/utilities.ts`**:
   - Change `process.cwd()` to `__dirname` for loading mcps.json
   - Remove path manipulation for MCP args (npx handles it)

3. **Update `packages/mcp/package.json`**:
   - Add `mcps.json` to `"files"` array
   - Ensure NO dependencies on MCP packages

4. **Verify all MCP package.json files**:
   - Have `"bin"` field pointing to build/index.js
   - Have `"files": ["build"]`
   - Have proper `"repository"` field

### Build Changes

1. **Copy mcps.json to build output**:
   - Ensure mcps.json is accessible in published package

### Testing Before Publishing

```bash
# Test locally with npx
cd packages/mcp
npm pack
npm install -g ./kasarlabs-ask-starknet-mcp-*.tgz
ask-starknet-mcp # Should work
```

## Questions & Decisions Log

**Q: Bundle vs separate packages?**
A: Separate packages. Router uses npx to launch MCPs dynamically.

**Q: How are MCPs launched?**
A: Via `npx @kasarlabs/{mcp-name}-mcp` configured in mcps.json.

**Q: Do users need to install MCPs manually?**
A: No. npx downloads and caches them automatically.

**Q: Fixed vs Independent versioning?**
A: Independent. Each package version evolves separately.

**Q: What happens when an MCP is updated?**
A: Publish the MCP. Users automatically get the update via npx (may need cache clear).

**Q: Does the router need republishing when MCPs update?**
A: No. npx always uses the latest published version.

---

Last updated: 2025-10-28
