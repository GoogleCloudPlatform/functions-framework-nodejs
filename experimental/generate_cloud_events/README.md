# Code Generation Pipeline For CloudEvent Interfaces

This directory contains an experimental code generation pipeline to generate TS interfaces for the CloudEvent types defined in [Google Events](https://github.com/googleapis/google-cloudevents).

It can be run via the following command:

```bash
npm run generate_cloudevents
```

This will regenerate all known CloudEvent type interfaces in the `src/cloud_event_types` directory of this repository.