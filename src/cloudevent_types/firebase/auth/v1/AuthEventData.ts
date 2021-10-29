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
 * The data within all Firebase Auth events.
 *
 * @public
 */
export interface AuthEventData {
  /**
   * The user identifier in the Firebase app.
   */
  uid: string;

  /**
   * The user's primary email, if set.
   */
  email: string;

  /**
   * Whether or not the user's primary email is verified.
   */
  emailVerified: boolean;

  /**
   * The user's display name.
   */
  displayName: string;

  /**
   * The user's photo URL.
   */
  photoURL: string;

  /**
   * Whether the user is disabled.
   */
  disabled: boolean;

  /**
   * Additional metadata about the user.
   */
  metadata: UserMetadata;

  /**
   * User's info at the providers
   */
  providerData: UserInfo[];

  /**
   * The user's phone number.
   */
  phoneNumber: string;

  /**
   * User's custom claims, typically used to define user roles and propagated
   * to an authenticated user's ID token.
   */
  customClaims: object;
}

/**
 * User's info at the identity provider
 *
 * @public
 */
export interface UserInfo {
  /**
   * The user identifier for the linked provider.
   */
  uid: string;

  /**
   * The email for the linked provider.
   */
  email: string;

  /**
   * The display name for the linked provider.
   */
  displayName: string;

  /**
   * The photo URL for the linked provider.
   */
  photoURL: string;

  /**
   * The linked provider ID (e.g. "google.com" for the Google provider).
   */
  providerId: string;
}

/**
 * Additional metadata about the user.
 *
 * @public
 */
export interface UserMetadata {
  /**
   * The date the user was created.
   */
  createTime: string;

  /**
   * The date the user last signed in.
   */
  lastSignInTime: string;
}
