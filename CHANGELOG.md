# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2024-08-30

### Added
- **HTTP Streaming Interface**: Migrated from Docker to HTTP streaming using Smithery SDK
- **Factory Pattern Architecture**: Added `createServer()` export for HTTP streaming compatibility
- **Dual Transport Support**: HTTP streaming (default) and stdio (legacy) interfaces
- **Hot Reloading Development**: Enhanced development experience with `pnpm run dev`
- **Smithery Configuration**: Added `smithery.yaml` for HTTP streaming deployment
- **Build System Enhancement**: Separate build commands for HTTP (`build:http`) and stdio (`build:stdio`)

### Changed
- **Default Interface**: HTTP streaming is now the default deployment method
- **Version Bump**: Updated to v0.2.0 across package.json and smithery.yaml
- **Development Workflow**: `pnpm run dev` now uses Smithery CLI with hot reloading
- **Dependencies**: Updated to `@modelcontextprotocol/sdk@1.17.4` and `@smithery/sdk@1.5.6`
- **Module Configuration**: Added `module: "src/index.ts"` to package.json

### Removed
- **Docker Dependencies**: Removed `Dockerfile`, `Dockerfile.smithery`, and `.dockerignore`
- **Docker Scripts**: Removed `smithery:build` and `smithery:run` npm scripts

### Migration
- **Backwards Compatible**: Existing stdio integrations continue to work via `*:stdio` commands
- **Performance Improvement**: HTTP streaming offers better performance than Docker-based deployment
- **Simplified Deployment**: No Docker runtime required for HTTP streaming interface

## [0.1.1] - 2024-08-29

### Features
- **Limitless AI Integration**: Direct access to lifelog data via official API
- **MCP Tools**: `getLifelogs`, `getLifelogEntry`, and `searchLifelogs` functionality
- **Type-Safe Implementation**: Written in TypeScript with Zod validation
- **Error Handling**: Comprehensive error handling with informative messages
- **Pagination Support**: Cursor-based pagination for large lifelog datasets
- **Environment Configuration**: API access via `LIMITLESS_API_KEY` and optional `LIMITLESS_BASE_URL`
