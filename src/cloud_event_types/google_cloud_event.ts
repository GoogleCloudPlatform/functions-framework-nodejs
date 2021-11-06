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
import {LogEntryData} from './cloud/audit/v1/log_entry_data';
import {BuildEventData} from './cloud/cloudbuild/v1/build_event_data';
import {DocumentEventData} from './cloud/firestore/v1/document_event_data';
import {MessagePublishedData} from './cloud/pubsub/v1/message_published_data';
import {SchedulerJobData} from './cloud/scheduler/v1/scheduler_job_data';
import {StorageObjectData} from './cloud/storage/v1/storage_object_data';
import {AnalyticsLogData} from './firebase/analytics/v1/analytics_log_data';
import {AuthEventData} from './firebase/auth/v1/auth_event_data';
import {ReferenceEventData} from './firebase/database/v1/reference_event_data';
import {RemoteConfigEventData} from './firebase/remoteconfig/v1/remote_config_event_data';
import {TestMatrixEventData} from './firebase/testlab/v1/test_matrix_event_data';
import {CloudEventsContext} from './cloud_events_context';

/**
 * The schema of CloudEvents emmitted by Cloud Audit Logs.
 *
 * @public
 */
export interface LogEntryCloudEvent extends CloudEventsContext {
  type: 'google.cloud.audit.log.v1.written';
  data: LogEntryData;
}

/**
 * The schema of CloudEvents emmitted by Cloud Build.
 *
 * @public
 */
export interface BuildEventCloudEvent extends CloudEventsContext {
  type: 'google.cloud.cloudbuild.build.v1.statusChanged';
  data: BuildEventData;
}

/**
 * The schema of CloudEvents emmitted by Cloud Firestore.
 *
 * @public
 */
export interface DocumentEventCloudEvent extends CloudEventsContext {
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
export interface MessagePublishedCloudEvent extends CloudEventsContext {
  type: 'google.cloud.pubsub.topic.v1.messagePublished';
  data: MessagePublishedData;
}

/**
 * The schema of CloudEvents emmitted by Cloud Scheduler.
 *
 * @public
 */
export interface SchedulerJobCloudEvent extends CloudEventsContext {
  type: 'google.cloud.scheduler.job.v1.executed';
  data: SchedulerJobData;
}

/**
 * The schema of CloudEvents emmitted by Cloud Storage.
 *
 * @public
 */
export interface StorageObjectCloudEvent extends CloudEventsContext {
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
export interface AnalyticsLogCloudEvent extends CloudEventsContext {
  type: 'google.firebase.analytics.log.v1.written';
  data: AnalyticsLogData;
}

/**
 * The schema of CloudEvents emmitted by Firebase Authentication.
 *
 * @public
 */
export interface AuthEventCloudEvent extends CloudEventsContext {
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
export interface ReferenceEventCloudEvent extends CloudEventsContext {
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
export interface RemoteConfigEventCloudEvent extends CloudEventsContext {
  type: 'google.firebase.remoteconfig.remoteConfig.v1.updated';
  data: RemoteConfigEventData;
}

/**
 * The schema of CloudEvents emmitted by Firebase Test Lab.
 *
 * @public
 */
export interface TestMatrixEventCloudEvent extends CloudEventsContext {
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
