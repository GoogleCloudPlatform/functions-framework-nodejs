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
import {LogEntryData} from './cloud/audit/v1/LogEntryData';
import {BuildEventData} from './cloud/cloudbuild/v1/BuildEventData';
import {DocumentEventData} from './cloud/firestore/v1/DocumentEventData';
import {MessagePublishedData} from './cloud/pubsub/v1/MessagePublishedData';
import {SchedulerJobData} from './cloud/scheduler/v1/SchedulerJobData';
import {StorageObjectData} from './cloud/storage/v1/StorageObjectData';
import {AnalyticsLogData} from './firebase/analytics/v1/AnalyticsLogData';
import {AuthEventData} from './firebase/auth/v1/AuthEventData';
import {ReferenceEventData} from './firebase/database/v1/ReferenceEventData';
import {RemoteConfigEventData} from './firebase/remoteconfig/v1/RemoteConfigEventData';
import {TestMatrixEventData} from './firebase/testlab/v1/TestMatrixEventData';
import {CloudEvent} from './CloudEvent';

/**
 * The schema of CloudEvents emmitted by Cloud Audit Logs.
 *
 * @public
 */
export interface LogEntryCloudEvent extends CloudEvent {
  type: 'google.cloud.audit.log.v1.written';
  data: LogEntryData;
}

/**
 * The schema of CloudEvents emmitted by Cloud Build.
 *
 * @public
 */
export interface BuildEventCloudEvent extends CloudEvent {
  type: 'google.cloud.cloudbuild.build.v1.statusChanged';
  data: BuildEventData;
}

/**
 * The schema of CloudEvents emmitted by Cloud Firestore.
 *
 * @public
 */
export interface DocumentEventCloudEvent extends CloudEvent {
  type:
    | 'google.cloud.firestore.document.v1.created'
    | 'google.cloud.firestore.document.v1.updated'
    | 'google.cloud.firestore.document.v1.deleted'
    | 'google.cloud.firestore.document.v1.written';
  data: DocumentEventData;
}

/**
 * The schema of CloudEvents emmitted by Cloud Pub/Sub.
 *
 * @public
 */
export interface MessagePublishedCloudEvent extends CloudEvent {
  type: 'google.cloud.pubsub.topic.v1.messagePublished';
  data: MessagePublishedData;
}

/**
 * The schema of CloudEvents emmitted by Cloud Scheduler.
 *
 * @public
 */
export interface SchedulerJobCloudEvent extends CloudEvent {
  type: 'google.cloud.scheduler.job.v1.executed';
  data: SchedulerJobData;
}

/**
 * The schema of CloudEvents emmitted by Cloud Storage.
 *
 * @public
 */
export interface StorageObjectCloudEvent extends CloudEvent {
  type:
    | 'google.cloud.storage.object.v1.finalized'
    | 'google.cloud.storage.object.v1.archived'
    | 'google.cloud.storage.object.v1.deleted'
    | 'google.cloud.storage.object.v1.metadataUpdated';
  data: StorageObjectData;
}

/**
 * The schema of CloudEvents emmitted by Google Analytics for Firebase.
 *
 * @public
 */
export interface AnalyticsLogCloudEvent extends CloudEvent {
  type: 'google.firebase.analytics.log.v1.written';
  data: AnalyticsLogData;
}

/**
 * The schema of CloudEvents emmitted by Firebase Authentication.
 *
 * @public
 */
export interface AuthEventCloudEvent extends CloudEvent {
  type:
    | 'google.firebase.auth.user.v1.created'
    | 'google.firebase.auth.user.v1.deleted';
  data: AuthEventData;
}

/**
 * The schema of CloudEvents emmitted by Firebase Realtime Database.
 *
 * @public
 */
export interface ReferenceEventCloudEvent extends CloudEvent {
  type:
    | 'google.firebase.database.ref.v1.created'
    | 'google.firebase.database.ref.v1.updated'
    | 'google.firebase.database.ref.v1.deleted'
    | 'google.firebase.database.ref.v1.written';
  data: ReferenceEventData;
}

/**
 * The schema of CloudEvents emmitted by Firebase Remote Config.
 *
 * @public
 */
export interface RemoteConfigEventCloudEvent extends CloudEvent {
  type: 'google.firebase.remoteconfig.remoteConfig.v1.updated';
  data: RemoteConfigEventData;
}

/**
 * The schema of CloudEvents emmitted by Firebase Test Lab.
 *
 * @public
 */
export interface TestMatrixEventCloudEvent extends CloudEvent {
  type: 'google.firebase.testlab.testMatrix.v1.completed';
  data: TestMatrixEventData;
}

/**
 * Union of all known CloudEvents emitted by Google Cloud services
 */
export type GoogleCloudEvent =
  | LogEntryCloudEvent
  | BuildEventCloudEvent
  | DocumentEventCloudEvent
  | MessagePublishedCloudEvent
  | SchedulerJobCloudEvent
  | StorageObjectCloudEvent
  | AnalyticsLogCloudEvent
  | AuthEventCloudEvent
  | ReferenceEventCloudEvent
  | RemoteConfigEventCloudEvent
  | TestMatrixEventCloudEvent;
