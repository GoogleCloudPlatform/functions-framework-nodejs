/**
 * This file contains proposed modifications to the @google/events package. The cloud
 * function samples in ./src import this file in lieu of the @google/events npm package
 * so they use the amended API.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import {LogEntryData as CloudAuditV1LogEntryData} from '@google/events/cloud/audit/v1/LogEntryData';
import {BuildEventData as CloudCloudbuildV1BuildEventData} from '@google/events/cloud/cloudbuild/v1/BuildEventData';
import {DocumentEventData as CloudFirestoreV1DocumentEventData} from '@google/events/cloud/firestore/v1/DocumentEventData';
import {MessagePublishedData as CloudPubsubV1MessagePublishedData} from '@google/events/cloud/pubsub/v1/MessagePublishedData';
import {SchedulerJobData as CloudSchedulerV1SchedulerJobData} from '@google/events/cloud/scheduler/v1/SchedulerJobData';
import {StorageObjectData as CloudStorageV1StorageObjectData} from '@google/events/cloud/storage/v1/StorageObjectData';
import {AnalyticsLogData as FirebaseAnalyticsV1AnalyticsLogData} from '@google/events/firebase/analytics/v1/AnalyticsLogData';
import {AuthEventData as FirebaseAuthV1AuthEventData} from '@google/events/firebase/auth/v1/AuthEventData';
import {ReferenceEventData as FirebaseDatabaseV1ReferenceEventData} from '@google/events/firebase/database/v1/ReferenceEventData';
import {RemoteConfigEventData as FirebaseRemoteconfigV1RemoteConfigEventData} from '@google/events/firebase/remoteconfig/v1/RemoteConfigEventData';
import {TestMatrixEventData as FirebaseTestlabV1TestMatrixEventData} from '@google/events/firebase/testlab/v1/TestMatrixEventData';

/**
 * Modification 1: The @google/events package uses the CloudEvent interface provided by
 * the CloudEvents SDK. The mechanism by which it obtains this interface is unimportant
 * but it must match the CloudEvent interface used by the Functions Framework.
 */
import {CloudEventV1 as CloudEvent} from 'cloudevents';

/**
 * Modification 2: All components of the public API (i.e. the data schema interfaces) should
 * be exported from the package root (this is a best practice when publishing NPM packages).
 */
export {
  CloudAuditV1LogEntryData,
  CloudCloudbuildV1BuildEventData,
  CloudFirestoreV1DocumentEventData,
  CloudPubsubV1MessagePublishedData,
  CloudSchedulerV1SchedulerJobData,
  CloudStorageV1StorageObjectData,
  FirebaseAnalyticsV1AnalyticsLogData,
  FirebaseAuthV1AuthEventData,
  FirebaseDatabaseV1ReferenceEventData,
  FirebaseRemoteconfigV1RemoteConfigEventData,
  FirebaseTestlabV1TestMatrixEventData,
};

/**
 * Modification 3: Declare a mapped type that defines which CloudEvent types correspond
 * to which data payload schemas. This is an internal implementation detail of the
 * @google/events library, it is not exposed in the public API.
 *
 * see https://www.typescriptlang.org/docs/handbook/2/mapped-types.html
 */
type GoogleCloudEventTypesToDataType = {
  'google.cloud.audit.log.v1.written': CloudAuditV1LogEntryData;
  'google.cloud.cloudbuild.build.v1.statusChanged': CloudCloudbuildV1BuildEventData;
  'google.cloud.firestore.document.v1.created': CloudFirestoreV1DocumentEventData;
  'google.cloud.firestore.document.v1.updated': CloudFirestoreV1DocumentEventData;
  'google.cloud.firestore.document.v1.deleted': CloudFirestoreV1DocumentEventData;
  'google.cloud.firestore.document.v1.written': CloudFirestoreV1DocumentEventData;
  'google.cloud.pubsub.topic.v1.messagePublished': CloudPubsubV1MessagePublishedData;
  'google.cloud.scheduler.job.v1.executed': CloudSchedulerV1SchedulerJobData;
  'google.cloud.storage.object.v1.finalized': CloudStorageV1StorageObjectData;
  'google.cloud.storage.object.v1.archived': CloudStorageV1StorageObjectData;
  'google.cloud.storage.object.v1.deleted': CloudStorageV1StorageObjectData;
  'google.cloud.storage.object.v1.metadataUpdated': CloudStorageV1StorageObjectData;
  'google.firebase.analytics.log.v1.written': FirebaseAnalyticsV1AnalyticsLogData;
  'google.firebase.auth.user.v1.created': FirebaseAuthV1AuthEventData;
  'google.firebase.auth.user.v1.deleted': FirebaseAuthV1AuthEventData;
  'google.firebase.database.ref.v1.created': FirebaseDatabaseV1ReferenceEventData;
  'google.firebase.database.ref.v1.updated': FirebaseDatabaseV1ReferenceEventData;
  'google.firebase.database.ref.v1.deleted': FirebaseDatabaseV1ReferenceEventData;
  'google.firebase.database.ref.v1.written': FirebaseDatabaseV1ReferenceEventData;
  'google.firebase.remoteconfig.remoteConfig.v1.updated': FirebaseRemoteconfigV1RemoteConfigEventData;
  'google.firebase.testlab.testMatrix.v1.completed': FirebaseTestlabV1TestMatrixEventData;
};

/**
 * This is a bit of syntactic sugar the allows us to create a concrete CloudEvent type
 * with known "type" of literal type and known data type.
 */
interface KnownGoogleCloudEvent<T extends keyof GoogleCloudEventTypesToDataType>
  extends CloudEvent<GoogleCloudEventTypesToDataType[T]> {
  type: T;
}

/**
 * Modification 4: Define the GoogleCloudEvent type as a union type of all known
 * Google Events.
 *
 * see https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#union-types
 * and https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions
 */
export type GoogleCloudEvent =
  | KnownGoogleCloudEvent<'google.cloud.audit.log.v1.written'>
  | KnownGoogleCloudEvent<'google.cloud.cloudbuild.build.v1.statusChanged'>
  | KnownGoogleCloudEvent<'google.cloud.firestore.document.v1.created'>
  | KnownGoogleCloudEvent<'google.cloud.firestore.document.v1.updated'>
  | KnownGoogleCloudEvent<'google.cloud.firestore.document.v1.deleted'>
  | KnownGoogleCloudEvent<'google.cloud.firestore.document.v1.written'>
  | KnownGoogleCloudEvent<'google.cloud.pubsub.topic.v1.messagePublished'>
  | KnownGoogleCloudEvent<'google.cloud.scheduler.job.v1.executed'>
  | KnownGoogleCloudEvent<'google.cloud.storage.object.v1.finalized'>
  | KnownGoogleCloudEvent<'google.cloud.storage.object.v1.archived'>
  | KnownGoogleCloudEvent<'google.cloud.storage.object.v1.deleted'>
  | KnownGoogleCloudEvent<'google.cloud.storage.object.v1.metadataUpdated'>
  | KnownGoogleCloudEvent<'google.firebase.analytics.log.v1.written'>
  | KnownGoogleCloudEvent<'google.firebase.auth.user.v1.created'>
  | KnownGoogleCloudEvent<'google.firebase.auth.user.v1.deleted'>
  | KnownGoogleCloudEvent<'google.firebase.database.ref.v1.created'>
  | KnownGoogleCloudEvent<'google.firebase.database.ref.v1.updated'>
  | KnownGoogleCloudEvent<'google.firebase.database.ref.v1.deleted'>
  | KnownGoogleCloudEvent<'google.firebase.database.ref.v1.written'>
  | KnownGoogleCloudEvent<'google.firebase.remoteconfig.remoteConfig.v1.updated'>
  | KnownGoogleCloudEvent<'google.firebase.testlab.testMatrix.v1.completed'>;

/**
 * Modification 5: Keep a set of of all known GoogleCloudEvent types to be used
 * in the type predicates defined below. This is an internal implementation detail
 * of the @google/events library, it is not exposed in the public API.
 */
const knownEventTypes = new Set([
  'google.cloud.audit.log.v1.written',
  'google.cloud.cloudbuild.build.v1.statusChanged',
  'google.cloud.firestore.document.v1.created',
  'google.cloud.firestore.document.v1.updated',
  'google.cloud.firestore.document.v1.deleted',
  'google.cloud.firestore.document.v1.written',
  'google.cloud.pubsub.topic.v1.messagePublished',
  'google.cloud.scheduler.job.v1.executed',
  'google.cloud.storage.object.v1.finalized',
  'google.cloud.storage.object.v1.archived',
  'google.cloud.storage.object.v1.deleted',
  'google.cloud.storage.object.v1.metadataUpdated',
  'google.firebase.analytics.log.v1.written',
  'google.firebase.auth.user.v1.created',
  'google.firebase.auth.user.v1.deleted',
  'google.firebase.database.ref.v1.created',
  'google.firebase.database.ref.v1.updated',
  'google.firebase.database.ref.v1.deleted',
  'google.firebase.database.ref.v1.written',
  'google.firebase.remoteconfig.remoteConfig.v1.updated',
  'google.firebase.testlab.testMatrix.v1.completed',
]);

/**
 * Modification 6: provide a type predicate function that enabled developers to narrow
 * a CloudEvent to a GoogleCloudEvent.
 *
 * see https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates
 */

/**
 * Check if a given a CloudEvent is a known GoogleCloudEvent.
 *
 * NOTE: The "is" return type makes this a type predicate
 *
 * @param event the CloudEvent to check the type of

 * @returns true if this event is a GoogleCloudEvent of the provided type, false otherwise
 */
export function isGoogleEvent(
  event: CloudEvent<any>
): event is GoogleCloudEvent;
/**
 * Check if a given a CloudEvent is a known GoogleCloudEvent of a given type.
 *
 * NOTE: The "is" return type makes this a type predicate
 * NOTE: This is an overload of the above function that takes an additional parameter.
 *
 * @param event the CloudEvent to check the type of
 * @param eventType one of the know GoogleCloudEvent literal types
 * @returns true if this event is a GoogleCloudEvent of the provided type, false otherwise
 */
export function isGoogleEvent<T extends keyof GoogleCloudEventTypesToDataType>(
  event: CloudEvent<any>,
  eventType: T
): event is KnownGoogleCloudEvent<T>;

export function isGoogleEvent(
  event: CloudEvent<any>,
  eventType?: keyof GoogleCloudEventTypesToDataType
): event is GoogleCloudEvent {
  if (eventType) {
    return event.type === eventType;
  }
  return knownEventTypes.has(event.type);
}
