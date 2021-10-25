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
import {LogEntryCloudEvent} from './cloud/audit/v1/LogEntryData';
import {BuildEventCloudEvent} from './cloud/cloudbuild/v1/BuildEventData';
import {DocumentEventCloudEvent} from './cloud/firestore/v1/DocumentEventData';
import {MessagePublishedCloudEvent} from './cloud/pubsub/v1/MessagePublishedData';
import {SchedulerJobCloudEvent} from './cloud/scheduler/v1/SchedulerJobData';
import {StorageObjectCloudEvent} from './cloud/storage/v1/StorageObjectData';
import {AnalyticsLogCloudEvent} from './firebase/analytics/v1/AnalyticsLogData';
import {AuthEventCloudEvent} from './firebase/auth/v1/AuthEventData';
import {ReferenceEventCloudEvent} from './firebase/database/v1/ReferenceEventData';
import {RemoteConfigEventCloudEvent} from './firebase/remoteconfig/v1/RemoteConfigEventData';
import {TestMatrixEventCloudEvent} from './firebase/testlab/v1/TestMatrixEventData';

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
