# Technology Stack

## Core Technologies
- **Language**: TypeScript/JavaScript (Node.js >=10.0.0)
- **Framework**: Express.js for HTTP handling
- **Build System**: TypeScript compiler with Google TypeScript Style (gts)
- **Testing**: Mocha test framework
- **Package Manager**: npm

## Key Dependencies
- `express` - HTTP server framework
- `cloudevents` - CloudEvents specification support
- `body-parser` - Request body parsing
- `minimist` - Command-line argument parsing

## Development Tools
- **Linting**: ESLint with Google TypeScript Style (gts)
- **Formatting**: Prettier (configured via gts)
- **Type Checking**: TypeScript 5.8.2
- **API Documentation**: Microsoft API Extractor

## Common Commands

### Development
```bash
npm run build          # Clean, compile TypeScript
npm run compile        # Compile TypeScript only
npm run watch          # Compile with watch mode
npm run clean          # Clean build directory
```

### Testing
```bash
npm test              # Run unit tests
npm run conformance   # Run conformance tests (requires Go 1.16+)
npm run pretest       # Compile before testing
```

### Code Quality
```bash
npm run check         # Run gts linting
npm run fix           # Auto-fix linting issues
npm run docs          # Generate API documentation
```

### Local Development
```bash
npx @google-cloud/functions-framework --target=functionName
functions-framework --target=functionName  # If globally installed
```

## Build Output
- Compiled JavaScript: `build/src/`
- Type definitions: `build/src/**/*.d.ts`
- Main entry: `build/src/index.js`
- CLI binary: `build/src/main.js`