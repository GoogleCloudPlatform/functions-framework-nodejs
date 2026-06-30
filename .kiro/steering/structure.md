# Project Structure

## Root Directory
- `package.json` - Main package configuration and dependencies
- `tsconfig.json` - TypeScript configuration extending gts
- `api-extractor.json` - API documentation extraction config
- `.eslintrc.json` - ESLint configuration extending gts
- `.prettierrc.js` - Prettier configuration via gts

## Source Code (`src/`)
- `index.ts` - Main public API exports
- `main.ts` - CLI entry point and server startup
- `functions.ts` - Core function registration and handling
- `function_registry.ts` - Function registration system
- `function_wrappers.ts` - Function signature adapters
- `server.ts` - Express server setup and configuration
- `invoker.ts` - Function invocation logic
- `loader.ts` - Dynamic function loading
- `types.ts` - TypeScript type definitions
- `options.ts` - Configuration and command-line options
- `logger.ts` - Logging utilities
- `testing.ts` - Testing utilities (exported separately)

### Middleware (`src/middleware/`)
- `background_event_to_cloud_event.ts` - Event format conversion
- `cloud_event_to_background_event.ts` - Reverse event conversion
- `timeout.ts` - Request timeout handling

### Other Core Files
- `cloud_events.ts` - CloudEvents specification handling
- `execution_context.ts` - Request execution context
- `async_local_storage.ts` - Async context management
- `pubsub_middleware.ts` - Pub/Sub specific middleware

## Testing (`test/`)
- Mirror structure of `src/` directory
- `integration/` - Integration tests for different function types
- `system-test/` - End-to-end system tests
- `conformance/` - Conformance test setup
- `data/` - Test fixtures and sample functions

## Build Output (`build/`)
- Generated JavaScript and type definitions
- Mirrors `src/` structure
- Main exports: `build/src/index.js` and `build/src/index.d.ts`

## Documentation (`docs/`)
- `generated/` - Auto-generated API documentation
- Various markdown guides for specific features
- `esm/` - ESM usage examples

## Conventions
- TypeScript source files in `src/`
- Corresponding test files in `test/` with same name
- Middleware components in dedicated subdirectory
- Integration tests grouped by function signature type
- All exports go through `src/index.ts` for clean public API