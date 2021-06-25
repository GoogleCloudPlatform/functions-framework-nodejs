# Changelog

[npm history][1]

[1]: https://www.npmjs.com/package/@google-cloud/functions-framework?activeTab=versions

## [1.9.0](https://www.github.com/GoogleCloudPlatform/functions-framework-nodejs/compare/v1.7.1...v1.9.0) (2021-06-25)


### Features

* disable x-powered-by header ([#223](https://www.github.com/GoogleCloudPlatform/functions-framework-nodejs/issues/223)) ([1ca74ae](https://www.github.com/GoogleCloudPlatform/functions-framework-nodejs/commit/1ca74aee74cdc803cba90721d98fffbf2db3ab60))
* updates event and cloudevent interfaces ([#276](https://www.github.com/GoogleCloudPlatform/functions-framework-nodejs/issues/276)) ([f67d11d](https://www.github.com/GoogleCloudPlatform/functions-framework-nodejs/commit/f67d11d9305965e6df2a10389e64389fa623f689))


### Bug Fixes

* **build:** release should be v1.9.0 ([#300](https://www.github.com/GoogleCloudPlatform/functions-framework-nodejs/issues/300)) ([4859f8b](https://www.github.com/GoogleCloudPlatform/functions-framework-nodejs/commit/4859f8b3e522b4718349844efbca454445312f37))
* Do not pass numeric arguments to res.send ([#242](https://www.github.com/GoogleCloudPlatform/functions-framework-nodejs/issues/242)) ([a8ace7b](https://www.github.com/GoogleCloudPlatform/functions-framework-nodejs/commit/a8ace7b7b62a00e25304f90e4ec0c87e8a114e1f))
* fix cloudevent signature callbacks ([#234](https://www.github.com/GoogleCloudPlatform/functions-framework-nodejs/issues/234)) ([2449956](https://www.github.com/GoogleCloudPlatform/functions-framework-nodejs/commit/2449956aeef7db4a33e89760ab97ce4a892ff03c))
* Log function signature type ([#228](https://www.github.com/GoogleCloudPlatform/functions-framework-nodejs/issues/228)) ([0726a2d](https://www.github.com/GoogleCloudPlatform/functions-framework-nodejs/commit/0726a2d9a7b715f992f473cf159397de51f4067c))
* re-add interfaces ([#218](https://www.github.com/GoogleCloudPlatform/functions-framework-nodejs/issues/218)) ([0e71491](https://www.github.com/GoogleCloudPlatform/functions-framework-nodejs/commit/0e714916f68ad39a6e893a91747fc56b37cb8272))
* run conformance tests against the current FF version ([#236](https://www.github.com/GoogleCloudPlatform/functions-framework-nodejs/issues/236)) ([240defc](https://www.github.com/GoogleCloudPlatform/functions-framework-nodejs/commit/240defc0a6c7076fcffef89bdf6b95a0a1f95f48)), closes [#231](https://www.github.com/GoogleCloudPlatform/functions-framework-nodejs/issues/231)
* smooth functions crash ([#264](https://www.github.com/GoogleCloudPlatform/functions-framework-nodejs/issues/264)) ([506c503](https://www.github.com/GoogleCloudPlatform/functions-framework-nodejs/commit/506c503a1a8da83ea68775899d33741693376e5a))

## v1.8.0

06-04-2021 16:11 PDT

### Features

- Update event and cloudevent interfaces (#276)
- Support local development with Pub/Sub emulator (#272)
- Disable x-powered-by header (#223)

### Bug Fixes

- Allow killing process with CTRL+C (#264)
- Do not pass numeric arguments to res.send (#242)
- Fix cloudevent signature callbacks (#234)
- Log function signature type (#228)
- Export the public interfaces (#218)

### Dependencies

- update lodash to 4.17.21 (#284)
- update hosted-git-info to 2.8.9 (#282)
- update googlecloudplatform/functions-framework-conformance action to v0.3.9 (#271)
- update typescript to v4.2.3 (#269)
- update mocha to v8.3.2 (#268)
- update @types/supertest to v2.0.11 (#267)
- update @types/node to v11.15.50 (#266)
- update supertest to v6 (#251)
- update gts to v3 (#250)
- update actions/setup-node action to v2 (#249)
- update @types/minimist to v1.2.1 (#245)
- update @types/express to v4.17.11 (#244)
- update ini to 1.3.7 (#240)
- update @types/mocha to v8.0.3 (#201)
- update minimist to 1.2.5 (#259)

### Documentation

- Add buildpacks/docker quickstart (#212)
- Mention express as the request/response parameters (#200)

### Internal / Testing Changues

- Updates to functions-framework-conformance action (#224, #236, #279, #280)
- Split up invoker tests into separate integration test files (#281)
- Enable eslint for tests (#275)
- Add useful npm scripts (#274)
- CI configuration updates (#219, #217)
- Refactor: split invoker and router (#213)
- Update renovate.json schedule (#210)

## v1.7.1

08-10-2020 11:13 PDT

### Implementation Changes
- fix: Don't call function after 404 on /{robots.txt,favicon.ico} ([#193](https://github.com/GoogleCloudPlatform/functions-framework-nodejs/pull/193))

### New Features

### Dependencies
- chore(deps): update dependency mocha to v8.1.1 ([#194](https://github.com/GoogleCloudPlatform/functions-framework-nodejs/pull/194))
- chore: remove tslint.json ([#190](https://github.com/GoogleCloudPlatform/functions-framework-nodejs/pull/190))

### Documentation

### Internal / Testing Changes

## v1.7.0

08-06-2020 12:01 PDT

### Implementation Changes
- fix: do not send error when error code is fine ([#187](https://github.com/GoogleCloudPlatform/functions-framework-nodejs/pull/187))

### New Features
- fix: add functions-framework-nodejs executable ([#152](https://github.com/GoogleCloudPlatform/functions-framework-nodejs/pull/152))

### Dependencies
- chore(deps): use gts v2 ([#186](https://github.com/GoogleCloudPlatform/functions-framework-nodejs/pull/186))
- chore(deps): update dependency @types/express to v4.17.7 ([#166](https://github.com/GoogleCloudPlatform/functions-framework-nodejs/pull/166))
- chore(deps): update dependency @types/node to v11.15.20 ([#172](https://github.com/GoogleCloudPlatform/functions-framework-nodejs/pull/172))
- chore(deps): update dependency @types/supertest to v2.0.10 ([#173](https://github.com/GoogleCloudPlatform/functions-framework-nodejs/pull/173))
- chore(deps): update dependency mocha to v8 ([#178](https://github.com/GoogleCloudPlatform/functions-framework-nodejs/pull/178))
- chore(deps): update dependency supertest to v4 ([#179](https://github.com/GoogleCloudPlatform/functions-framework-nodejs/pull/179))
- chore(deps): automerge all but major updates ([#183](https://github.com/GoogleCloudPlatform/functions-framework-nodejs/pull/183))
- chore(deps): update dependency typescript to v3.9.7 ([#176](https://github.com/GoogleCloudPlatform/functions-framework-nodejs/pull/176))
- chore: make renovate not update as often ([#170](https://github.com/GoogleCloudPlatform/functions-framework-nodejs/pull/170))
- chore(deps): bump lodash from 4.17.14 to 4.17.19 ([#156](https://github.com/GoogleCloudPlatform/functions-framework-nodejs/pull/156))
- chore(deps): pin dependencies ([#163](https://github.com/GoogleCloudPlatform/functions-framework-nodejs/pull/163))
- chore(deps): add renovate.json ([#65](https://github.com/GoogleCloudPlatform/functions-framework-nodejs/pull/65))

### Documentation
- docs: change badge to GitHub Actions ([#180](https://github.com/GoogleCloudPlatform/functions-framework-nodejs/pull/180))
- Fix typo: https -> http ([#153](https://github.com/GoogleCloudPlatform/functions-framework-nodejs/pull/153))

### Internal / Testing Changes
- test: run CI workflows on pull_request ([#185](https://github.com/GoogleCloudPlatform/functions-framework-nodejs/pull/185))
- test: lock the version of the conformance tool ([#181](https://github.com/GoogleCloudPlatform/functions-framework-nodejs/pull/181))
- Add GitHub Actions workflows ([#169](https://github.com/GoogleCloudPlatform/functions-framework-nodejs/pull/169))
- feat: add a script to run conformance tests ([#158](https://github.com/GoogleCloudPlatform/functions-framework-nod

## v1.6.0

06-17-2020 14:53 PDT

### Implementation Changes
- refactor: extract cloudevents functions, privateize file-global identifiers ([#138](https://github.com/GoogleCloudPlatform/functions-framework-nodejs/pull/138))
- refactor: Move the logic to load user's function to loader.ts ([#136](https://github.com/GoogleCloudPlatform/functions-framework-nodejs/pull/136))
- refactor: split files ([#135](https://github.com/GoogleCloudPlatform/functions-framework-nodejs/pull/135))

### New Features
- feat: prototype cloudevent function signature type ([#147](https://github.com/GoogleCloudPlatform/functions-framework-nodejs/pull/147))

### Dependencies

### Documentation
- docs: remove incorrect pubsub docs ([#145](https://github.com/GoogleCloudPlatform/functions-framework-nodejs/pull/145))
- Fix PubSub Event Example ([#141](https://github.com/GoogleCloudPlatform/functions-framework-nodejs/pull/141))

### Internal / Testing Changes
- Use CloudEvents v1.0 in CloudEventsContext and tests ([#139](https://github.com/GoogleCloudPlatform/functions-framework-nodejs/pull/139))

## v1.5.1

03-30-2020 11:05 PDT

### Implementation Changes
- fix: handle SIGINT in ErrorHandler ([#126](https://github.com/GoogleCloudPlatform/functions-framework-nodejs/pull/126))

### New Features

### Dependencies
- chore(deps): bump acorn from 5.7.3 to 5.7.4 ([#124](https://github.com/GoogleCloudPlatform/functions-framework-nodejs/pull/124))
- chore(deps): bump minimist from 1.2.0 to 1.2.2 ([#123](https://github.com/GoogleCloudPlatform/functions-framework-nodejs/pull/123))
- chore(deps): bump minimist from 1.2.2 to 1.2.3 ([#128](https://github.com/GoogleCloudPlatform/functions-framework-nodejs/pull/128))

### Documentation

### Internal / Testing Changes

## v1.5.0

03-06-2020 08:15 PST

### Implementation Changes
 - Adjust path handling ([#121](https://github.com/GoogleCloudPlatform/functions-framework-nodejs/pull/121))

### New Features

### Dependencies

### Documentation

### Internal / Testing Changes

## v1.4.0

01-30-2020 11:54 PST

### Implementation Changes

### New Features
- feat: add --dry-run option to load user's function but not start a server ([#118](https://github.com/GoogleCloudPlatform/functions-framework-nodejs/pull/118))

### Dependencies

### Documentation
- docs: Remove beta from gcloud run ([#114](https://github.com/GoogleCloudPlatform/functions-framework-nodejs/pull/114))
- Update README.md ([#115](https://github.com/GoogleCloudPlatform/functions-framework-nodejs/pull/115))
- docs: update pub sub docs with instructions that work ([#109](https://github.com/GoogleCloudPlatform/functions-framework-nodejs/pull/109))
- Fix double quotation from full-width character ([#107](https://github.com/GoogleCloudPlatform/functions-framework-nodejs/pull/107))
- docs: add video about FF ([#102](https://github.com/GoogleCloudPlatform/functions-framework-nodejs/pull/102))
- Changed curl command to include json content-type ([#100](https://github.com/GoogleCloudPlatform/functions-framework-nodejs/pull/100))

### Internal / Testing Changes

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
