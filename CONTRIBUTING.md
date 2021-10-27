# How to Contribute

We'd love to accept your patches and contributions to this project. There are
just a few small guidelines you need to follow.

## Contributor License Agreement

Contributions to this project must be accompanied by a Contributor License
Agreement. You (or your employer) retain the copyright to your contribution;
this simply gives us permission to use and redistribute your contributions as
part of the project. Head over to <https://cla.developers.google.com/> to see
your current agreements on file or to sign a new one.

You generally only need to submit a CLA once, so if you've already submitted one
(even if it was for a different project), you probably don't need to do it
again.

## Code reviews

All submissions, including submissions by project members, require review. We
use GitHub pull requests for this purpose. Consult
[GitHub Help](https://help.github.com/articles/about-pull-requests/) for more
information on using pull requests.

## Testing

### Unit Tests

All pull requests should have an associated test to ensure foward compatibility.

To run an individual test, you can run a command such as the following:

```
npm run test -- -g 'loading function'
```

### Conformance Tests

To run the conformance tests, first install Go 1.16+, then run the tests:

```
npm run conformance
```

### Manual Testing

When developing a feature locally, you can install a local version of the Functions Framework
using `npm link`. First compile your local clone of the Functions Framework:

```
npm compile
```

Then link the Functions Framework using `npm link`.

```
npm link
```

You can then run the Functions Framework locally using `functions-framework`.

## Publishing (Admins only)

This module is published using Release Please. When you merge a release PR, the npm package will be automatically published.

### Reverting a Publish

If the release process fails, you can revert the publish by running the following (i.e. unpublishing `1.10.0`):

```sh
# Login to the Wombat Dressing Room. Create a 24 hour token. Close the window.
npm login --registry https://wombat-dressing-room.appspot.com
# Unpublish the package (must be done within 72 hours of publishing).
# If >72 hours, deprecate a specific release and publish a newer version.
# i.e. `npm deprecate @google-cloud/functions-framework@1.10.0 "Deprecate 1.10.0" 
# See https://docs.npmjs.com/policies/unpublish#what-to-do-if-your-package-does-not-meet-the-unpublish-criteria
npm unpublish @google-cloud/functions-framework@1.10.0
# Set the default version to the previous working version.
npm dist-tag add @google-cloud/functions-framework@1.9.0 latest --registry=https://wombat-dressing-room.appspot.com
```

### API Extractor

To generate the API Extractor documentation, run the API extractor with the following command:

```sh
npm run docs
```

The docs will be generated in [`docs/generated/`](docs/generated/).

## Community Guidelines

This project follows [Google's Open Source Community
Guidelines](https://opensource.google.com/conduct/).
