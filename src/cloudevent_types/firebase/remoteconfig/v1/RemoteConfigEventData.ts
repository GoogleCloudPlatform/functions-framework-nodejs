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

/**
 * The data within all Firebase Remote Config events.
 */
export interface RemoteConfigEventData {
  /**
   * The version number of the version's corresponding Remote Config template.
   */
  versionNumber: number;

  /**
   * When the Remote Config template was written to the Remote Config server.
   */
  updateTime: string;

  /**
   * Aggregation of all metadata fields about the account that performed the
   * update.
   */
  updateUser: RemoteConfigUser;

  /**
   * The user-provided description of the corresponding Remote Config template.
   */
  description: string;

  /**
   * Where the update action originated.
   */
  updateOrigin: number;

  /**
   * What type of update was made.
   */
  updateType: number;

  /**
   * Only present if this version is the result of a rollback, and will be the
   * version number of the Remote Config template that was rolled-back to.
   */
  rollbackSource: number;
}

/**
 * All the fields associated with the person/service account
 * that wrote a Remote Config template.
 */
export interface RemoteConfigUser {
  /**
   * Display name.
   */
  name: string;

  /**
   * Email address.
   */
  email: string;

  /**
   * Image URL.
   */
  imageUrl: string;
}

/**
 * The CloudEvent schema emmitted by Firebase Remote Config.
 */
export interface RemoteConfigEventCloudEvent {
  type: 'google.firebase.remoteconfig.remoteConfig.v1.updated';
  data: RemoteConfigEventData;
}
