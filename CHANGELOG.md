# Changelog

[npm history][1]

[1]: https://www.npmjs.com/package/@google-cloud/functions-framework?activeTab=versions

## v1.3.2

09-13-2019 18:06 PDT

- Revert "fixes [#33](https://github.com/GoogleCloudPlatform/functions-framework-nodejs/pull/33): Only listen to functionTarget. ([#81](https://github.com/GoogleCloudPlatform/functions-framework-nodejs/pull/81))"

### Implementation Changes

### New Features

### Dependencies

### Documentation

### Internal / Testing Changes

## v1.3.1

09-13-2019 10:00 PDT

### Implementation Changes
- fix: use empty string path when function source is not specified ([#90](https://github.com/GoogleCloudPlatform/functions-framework-nodejs/pull/90))

### New Features

### Dependencies

### Documentation

### Internal / Testing Changes

## v1.3.0

09-11-2019 10:17 PDT

### Implementation Changes
- fixes [#33](https://github.com/GoogleCloudPlatform/functions-framework-nodejs/pull/33): Only listen to functionTarget. ([#81](https://github.com/GoogleCloudPlatform/functions-framework-nodejs/pull/81))
- fix: change the default function directory to the current working directory instead of root ('/') ([#77](https://github.com/GoogleCloudPlatform/functions-framework-nodejs/pull/77))
- Adding null check in catch block ([#71](https://github.com/GoogleCloudPlatform/functions-framework-nodejs/pull/71))
- fix: Adds types for superagent. Fixes [#68](https://github.com/GoogleCloudPlatform/functions-framework-nodejs/pull/68) ([#69](https://github.com/GoogleCloudPlatform/functions-framework-nodejs/pull/69))

### New Features
- Add a source flag/env option to add flexibility to execution path ([#53](https://github.com/GoogleCloudPlatform/functions-framework-nodejs/pull/53))

### Dependencies

### Documentation
- Docs Updates ([#70](https://github.com/GoogleCloudPlatform/functions-framework-nodejs/pull/70))
- Fix small typo on link ([#79](https://github.com/GoogleCloudPlatform/functions-framework-nodejs/pull/79))
- New section documentation on how to perform local PubSub testing ([#76](https://github.com/GoogleCloudPlatform/functions-framework-nodejs/pull/76))
- Docs: Add Docker Tutorial Doc ([#58](https://github.com/GoogleCloudPlatform/functions-framework-nodejs/pull/58))

### Internal / Testing Changes
- chore: remove the converter

