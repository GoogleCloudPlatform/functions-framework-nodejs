# Product Overview

The Google Cloud Functions Framework for Node.js is an open-source FaaS (Function as a Service) framework built on Express.js for writing portable Node.js functions.

## Core Purpose
- Enables writing lightweight functions that run across multiple environments (Google Cloud Functions, Cloud Run, local development, Knative)
- Provides automatic request handling and event unmarshalling
- Supports multiple function signatures: HTTP, background events, and CloudEvents
- Eliminates the need to write HTTP server boilerplate

## Key Features
- Local development server for testing
- Automatic CloudEvents spec compliance
- Portable between serverless platforms
- Express.js-based request/response handling
- Support for Google Cloud Functions event payloads

## Target Users
Developers building serverless functions for Google Cloud Platform and other Knative-compatible environments.