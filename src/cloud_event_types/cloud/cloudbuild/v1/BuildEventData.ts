// Copyright 2021 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/* eslint-disable @typescript-eslint/no-explicit-any*/

/**
 * Build event data for Google Cloud Platform API operations.
 *
 * @public
 */
export interface BuildEventData {
  /**
   * Unique identifier of the build.
   */
  id: string;

  /**
   * ID of the project.
   */
  projectId: string;

  /**
   * Status of the build.
   */
  status: number;

  /**
   * Customer-readable message about the current status.
   */
  statusDetail: string;

  /**
   * The location of the source files to build.
   */
  source: Source;

  /**
   * The operations to be performed on the workspace.
   */
  steps: BuildStep[];

  /**
   * Results of the build.
   */
  results: Results;

  /**
   * Time at which the request to create the build was received.
   */
  createTime: string;

  /**
   * Time at which execution of the build was started.
   */
  startTime: string;

  /**
   * Time at which execution of the build was finished.
   *
   * The difference between finish_time and start_time is the duration of the
   * build's execution.
   */
  finishTime: string;

  /**
   * Amount of time that this build should be allowed to run, to second
   * granularity. If this amount of time elapses, work on the build will cease
   * and the build status will be `TIMEOUT`.
   */
  timeout: string;

  /**
   * A list of images to be pushed upon the successful completion of all build
   * steps.
   *
   * The images are pushed using the builder service account's credentials.
   *
   * The digests of the pushed images will be stored in the `Build` resource's
   * results field.
   *
   * If any of the images fail to be pushed, the build status is marked
   * `FAILURE`.
   */
  images: string[];

  /**
   * TTL in queue for this build. If provided and the build is enqueued longer
   * than this value, the build will expire and the build status will be
   * `EXPIRED`.
   *
   * The TTL starts ticking from create_time.
   */
  queueTtl: string;

  /**
   * Artifacts produced by the build that should be uploaded upon
   * successful completion of all build steps.
   */
  artifacts: Artifacts;

  /**
   * Google Cloud Storage bucket where logs should be written (see
   * [Bucket Name
   * Requirements](https://cloud.google.com/storage/docs/bucket-naming#requirements)).
   * Logs file names will be of the format `${logs_bucket}/log-${build_id}.txt`.
   */
  logsBucket: string;

  /**
   * A permanent fixed identifier for source.
   */
  sourceProvenance: SourceProvenance;

  /**
   * The ID of the `BuildTrigger` that triggered this build, if it
   * was triggered automatically.
   */
  buildTriggerId: string;

  /**
   * Special options for this build.
   */
  options: BuildOptions;

  /**
   * URL to logs for this build in Google Cloud Console.
   */
  logUrl: string;

  /**
   * Substitutions data for `Build` resource.
   */
  substitutions: object;

  /**
   * Tags for annotation of a `Build`. These are not docker tags.
   */
  tags: string[];

  /**
   * Secrets to decrypt using Cloud Key Management Service.
   */
  secrets: Secret[];

  /**
   * Stores timing information for phases of the build. Valid keys
   * are:
   *
   * * BUILD: time to execute all build steps
   * * PUSH: time to push all specified images.
   * * FETCHSOURCE: time to fetch source.
   *
   * If the build does not specify source or images,
   * these keys will not be included.
   */
  timing: object;
}

/**
 * Artifacts produced by a build that should be uploaded upon
 * successful completion of all build steps.
 *
 * @public
 */
export interface Artifacts {
  /**
   * A list of images to be pushed upon the successful completion of all build
   * steps.
   *
   * The images will be pushed using the builder service account's credentials.
   *
   * The digests of the pushed images will be stored in the Build resource's
   * results field.
   *
   * If any of the images fail to be pushed, the build is marked FAILURE.
   */
  images: string[];

  /**
   * A list of objects to be uploaded to Cloud Storage upon successful
   * completion of all build steps.
   *
   * Files in the workspace matching specified paths globs will be uploaded to
   * the specified Cloud Storage location using the builder service account's
   * credentials.
   *
   * The location and generation of the uploaded objects will be stored in the
   * Build resource's results field.
   *
   * If any objects fail to be pushed, the build is marked FAILURE.
   */
  objects: ArtifactObjects;
}

/**
 * Files in the workspace to upload to Cloud Storage upon successful
 * completion of all build steps.
 *
 * @public
 */
export interface ArtifactObjects {
  /**
   * Cloud Storage bucket and optional object path, in the form
   * "gs://bucket/path/to/somewhere/". (see [Bucket Name
   * Requirements](https://cloud.google.com/storage/docs/bucket-naming#requirements)).
   *
   * Files in the workspace matching any path pattern will be uploaded to
   * Cloud Storage with this location as a prefix.
   */
  location: string;

  /**
   * Path globs used to match files in the build's workspace.
   */
  paths: string[];

  /**
   * Stores timing information for pushing all artifact objects.
   */
  timing: TimeSpan;
}

/**
 * Optional arguments to enable specific features of builds.
 *
 * @public
 */
export interface BuildOptions {
  /**
   * Requested hash for SourceProvenance.
   */
  sourceProvenanceHash: number[];

  /**
   * Requested verifiability options.
   */
  requestedVerifyOption: number;

  /**
   * Compute Engine machine type on which to run the build.
   */
  machineType: number;

  /**
   * Requested disk size for the VM that runs the build. Note that this is *NOT*
   * "disk free"; some of the space will be used by the operating system and
   * build utilities. Also note that this is the minimum disk size that will be
   * allocated for the build -- the build may run with a larger disk than
   * requested. At present, the maximum disk size is 1000GB; builds that request
   * more than the maximum are rejected with an error.
   */
  diskSizeGb: number;

  /**
   * Option to specify behavior when there is an error in the substitution
   * checks.
   */
  substitutionOption: number;

  /**
   * Option to define build log streaming behavior to Google Cloud
   * Storage.
   */
  logStreamingOption: number;

  /**
   * Option to specify a `WorkerPool` for the build.
   * Format: projects/{project}/locations/{location}/workerPools/{workerPool}
   */
  workerPool: string;

  /**
   * Option to specify the logging mode, which determines where the logs are
   * stored.
   */
  logging: number;

  /**
   * A list of global environment variable definitions that will exist for all
   * build steps in this build. If a variable is defined in both globally and in
   * a build step, the variable will use the build step value.
   *
   * The elements are of the form "KEY=VALUE" for the environment variable "KEY"
   * being given the value "VALUE".
   */
  env: string[];

  /**
   * A list of global environment variables, which are encrypted using a Cloud
   * Key Management Service crypto key. These values must be specified in the
   * build's `Secret`. These variables will be available to all build steps
   * in this build.
   */
  secretEnv: string[];

  /**
   * Global list of volumes to mount for ALL build steps
   *
   * Each volume is created as an empty volume prior to starting the build
   * process. Upon completion of the build, volumes and their contents are
   * discarded. Global volume names and paths cannot conflict with the volumes
   * defined a build step.
   *
   * Using a global volume in a build with only one step is not valid as
   * it is indicative of a build request with an incorrect configuration.
   */
  volumes: Volume[];
}

/**
 * A step in the build pipeline.
 *
 * @public
 */
export interface BuildStep {
  /**
   * The name of the container image that will run this particular
   * build step.
   *
   * If the image is available in the host's Docker daemon's cache, it
   * will be run directly. If not, the host will attempt to pull the image
   * first, using the builder service account's credentials if necessary.
   *
   * The Docker daemon's cache will already have the latest versions of all of
   * the officially supported build steps
   * ([https://github.com/GoogleCloudPlatform/cloud-builders](https://github.com/GoogleCloudPlatform/cloud-builders)).
   * The Docker daemon will also have cached many of the layers for some popular
   * images, like "ubuntu", "debian", but they will be refreshed at the time you
   * attempt to use them.
   *
   * If you built an image in a previous build step, it will be stored in the
   * host's Docker daemon's cache and is available to use as the name for a
   * later build step.
   */
  name: string;

  /**
   * A list of environment variable definitions to be used when running a step.
   *
   * The elements are of the form "KEY=VALUE" for the environment variable "KEY"
   * being given the value "VALUE".
   */
  env: string[];

  /**
   * A list of arguments that will be presented to the step when it is started.
   *
   * If the image used to run the step's container has an entrypoint, the `args`
   * are used as arguments to that entrypoint. If the image does not define
   * an entrypoint, the first element in args is used as the entrypoint,
   * and the remainder will be used as arguments.
   */
  args: string[];

  /**
   * Working directory to use when running this step's container.
   *
   * If this value is a relative path, it is relative to the build's working
   * directory. If this value is absolute, it may be outside the build's working
   * directory, in which case the contents of the path may not be persisted
   * across build step executions, unless a `volume` for that path is specified.
   *
   * If the build specifies a `RepoSource` with `dir` and a step with a `dir`,
   * which specifies an absolute path, the `RepoSource` `dir` is ignored for
   * the step's execution.
   */
  dir: string;

  /**
   * Unique identifier for this build step, used in `wait_for` to
   * reference this build step as a dependency.
   */
  id: string;

  /**
   * The ID(s) of the step(s) that this build step depends on.
   * This build step will not start until all the build steps in `wait_for`
   * have completed successfully. If `wait_for` is empty, this build step will
   * start when all previous build steps in the `Build.Steps` list have
   * completed successfully.
   */
  waitFor: string[];

  /**
   * Entrypoint to be used instead of the build step image's default entrypoint.
   * If unset, the image's default entrypoint is used.
   */
  entrypoint: string;

  /**
   * A list of environment variables which are encrypted using a Cloud Key
   * Management Service crypto key. These values must be specified in the
   * build's `Secret`.
   */
  secretEnv: string[];

  /**
   * List of volumes to mount into the build step.
   *
   * Each volume is created as an empty volume prior to execution of the
   * build step. Upon completion of the build, volumes and their contents are
   * discarded.
   *
   * Using a named volume in only one step is not valid as it is indicative
   * of a build request with an incorrect configuration.
   */
  volumes: Volume[];

  /**
   * Stores timing information for executing this build step.
   */
  timing: TimeSpan;

  /**
   * Stores timing information for pulling this build step's
   * builder image only.
   */
  pullTiming: TimeSpan;

  /**
   * Time limit for executing this build step. If not defined, the step has no
   * time limit and will be allowed to continue to run until either it completes
   * or the build itself times out.
   */
  timeout: string;

  /**
   * Status of the build step. At this time, build step status is
   * only updated on build completion; step status is not updated in real-time
   * as the build progresses.
   */
  status: number;
}

/**
 * An image built by the pipeline.
 *
 * @public
 */
export interface BuiltImage {
  /**
   * Name used to push the container image to Google Container Registry, as
   * presented to `docker push`.
   */
  name: string;

  /**
   * Docker Registry 2.0 digest.
   */
  digest: string;

  /**
   * Stores timing information for pushing the specified image.
   */
  pushTiming: TimeSpan;
}

/**
 * Container message for hashes of byte content of files, used in
 * SourceProvenance messages to verify integrity of source input to the build.
 *
 * @public
 */
export interface FileHashes {
  /**
   * Collection of file hashes.
   */
  fileHash: Hash[];
}

/**
 * Container message for hash values.
 *
 * @public
 */
export interface Hash {
  /**
   * The type of hash that was performed.
   */
  type: number;

  /**
   * The hash value.
   */
  value: string;
}

/**
 * Location of the source in a Google Cloud Source Repository.
 *
 * @public
 */
export interface RepoSource {
  /**
   * ID of the project that owns the Cloud Source Repository.
   */
  projectId: string;

  /**
   * Name of the Cloud Source Repository.
   */
  repoName: string;

  /**
   * Regex matching branches to build.
   *
   * The syntax of the regular expressions accepted is the syntax accepted by
   * RE2 and described at https://github.com/google/re2/wiki/Syntax
   */
  branchName: string;

  /**
   * Regex matching tags to build.
   *
   * The syntax of the regular expressions accepted is the syntax accepted by
   * RE2 and described at https://github.com/google/re2/wiki/Syntax
   */
  tagName: string;

  /**
   * Explicit commit SHA to build.
   */
  commitSha: string;

  /**
   * Directory, relative to the source root, in which to run the build.
   *
   * This must be a relative path. If a step's `dir` is specified and is an
   * absolute path, this value is ignored for that step's execution.
   */
  dir: string;

  /**
   * Only trigger a build if the revision regex does NOT match the revision
   * regex.
   */
  invertRegex: boolean;

  /**
   * Substitutions to use in a triggered build.
   * Should only be used with RunBuildTrigger
   */
  substitutions: object;
}

/**
 * Artifacts created by the build pipeline.
 *
 * @public
 */
export interface Results {
  /**
   * Container images that were built as a part of the build.
   */
  images: BuiltImage[];

  /**
   * List of build step digests, in the order corresponding to build step
   * indices.
   */
  buildStepImages: string[];

  /**
   * Path to the artifact manifest. Only populated when artifacts are uploaded.
   */
  artifactManifest: string;

  /**
   * Number of artifacts uploaded. Only populated when artifacts are uploaded.
   */
  numArtifacts: number;

  /**
   * List of build step outputs, produced by builder images, in the order
   * corresponding to build step indices.
   *
   * [Cloud Builders](https://cloud.google.com/cloud-build/docs/cloud-builders)
   * can produce this output by writing to `$BUILDER_OUTPUT/output`.
   * Only the first 4KB of data is stored.
   */
  buildStepOutputs: string[];

  /**
   * Time to push all non-container artifacts.
   */
  artifactTiming: TimeSpan;
}

/**
 * Pairs a set of secret environment variables containing encrypted
 * values with the Cloud KMS key to use to decrypt the value.
 *
 * @public
 */
export interface Secret {
  /**
   * Cloud KMS key name to use to decrypt these envs.
   */
  kmsKeyName: string;

  /**
   * Map of environment variable name to its encrypted value.
   *
   * Secret environment variables must be unique across all of a build's
   * secrets, and must be used by at least one build step. Values can be at most
   * 64 KB in size. There can be at most 100 secret values across all of a
   * build's secrets.
   */
  secretEnv: object;
}
export interface Source {
  /**
   * If provided, get the source from this location in Google Cloud Storage.
   */
  storageSource: StorageSource;

  /**
   * If provided, get the source from this location in a Cloud Source
   * Repository.
   */
  repoSource: RepoSource;
}

/**
 * Provenance of the source. Ways to find the original source, or verify that
 * some source was used for this build.
 *
 * @public
 */
export interface SourceProvenance {
  /**
   * A copy of the build's `source.storage_source`, if exists, with any
   * generations resolved.
   */
  resolvedStorageSource: StorageSource;

  /**
   * A copy of the build's `source.repo_source`, if exists, with any
   * revisions resolved.
   */
  resolvedRepoSource: RepoSource;

  /**
   * Hash(es) of the build source, which can be used to verify that
   * the original source integrity was maintained in the build. Note that
   * `FileHashes` will only be populated if `BuildOptions` has requested a
   * `SourceProvenanceHash`.
   *
   * The keys to this map are file paths used as build source and the values
   * contain the hash values for those files.
   *
   * If the build source came in a single package such as a gzipped tarfile
   * (`.tar.gz`), the `FileHash` will be for the single path to that file.
   */
  fileHashes: object;
}

/**
 * Location of the source in an archive file in Google Cloud Storage.
 *
 * @public
 */
export interface StorageSource {
  /**
   * Google Cloud Storage bucket containing the source (see
   * [Bucket Name
   * Requirements](https://cloud.google.com/storage/docs/bucket-naming#requirements)).
   */
  bucket: string;

  /**
   * Google Cloud Storage object containing the source.
   */
  object: string;

  /**
   * Google Cloud Storage generation for the object. If the generation is
   * omitted, the latest generation will be used.
   */
  generation: number;
}

/**
 * Start and end times for a build execution phase.
 *
 * @public
 */
export interface TimeSpan {
  /**
   * Start of time span.
   */
  startTime: string;

  /**
   * End of time span.
   */
  endTime: string;
}

/**
 * Volume describes a Docker container volume which is mounted into build steps
 * in order to persist files across build step execution.
 *
 * @public
 */
export interface Volume {
  /**
   * Name of the volume to mount.
   *
   * Volume names must be unique per build step and must be valid names for
   * Docker volumes. Each named volume must be used by at least two build steps.
   */
  name: string;

  /**
   * Path at which to mount the volume.
   *
   * Paths must be absolute and cannot conflict with other volume paths on the
   * same build step or with certain reserved volume paths.
   */
  path: string;
}
