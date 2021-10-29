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
 * The data within Firebase Analytics log events.
 *
 * @public
 */
export interface AnalyticsLogData {
  /**
   * User related dimensions.
   */
  userDim: UserDimensions;

  /**
   * A repeated record of event related dimensions.
   */
  eventDim: EventDimensions[];
}

/**
 * Value for Event Params and UserProperty can be of type string or int or
 * float or double.
 *
 * @public
 */
export interface AnalyticsValue {
  stringValue: string;
  intValue: number;
  floatValue: number;
  doubleValue: number;
}

/**
 * Message which contains App Information.
 *
 * @public
 */
export interface AppInfo {
  /**
   * The app's version name
   * Examples: "1.0", "4.3.1.1.213361", "2.3 (1824253)", "v1.8b22p6"
   */
  appVersion: string;

  /**
   * Unique id for this instance of the app.
   * Example: "71683BF9FA3B4B0D9535A1F05188BAF3"
   */
  appInstanceId: string;

  /**
   * The identifier of the store that installed the app.
   * Eg. "com.sec.android.app.samsungapps", "com.amazon.venezia",
   * "com.nokia.nstore"
   */
  appStore: string;

  /**
   * The app platform.
   * Eg "ANDROID", "IOS".
   */
  appPlatform: string;

  /**
   * Unique application identifier within an app store.
   */
  appId: string;
}

/**
 * Message containing device informations.
 *
 * @public
 */
export interface DeviceInfo {
  /**
   * Device category.
   * Eg. tablet or mobile.
   */
  deviceCategory: string;

  /**
   * Device brand name.
   * Eg. Samsung, HTC, etc.
   */
  mobileBrandName: string;

  /**
   * Device model name.
   * Eg. GT-I9192
   */
  mobileModelName: string;

  /**
   * Device marketing name.
   * Eg. Galaxy S4 Mini
   */
  mobileMarketingName: string;

  /**
   * Device model.
   * Eg. GT-I9192
   */
  deviceModel: string;

  /**
   * Device OS version when data capture ended.
   * Eg. 4.4.2
   */
  platformVersion: string;

  /**
   * Vendor specific device identifier. This is IDFV on iOS. Not used for
   * Android.
   * Example: "599F9C00-92DC-4B5C-9464-7971F01F8370"
   */
  deviceId: string;

  /**
   * The type of the resettable_device_id is always IDFA on iOS and AdId
   * on Android.
   * Example: "71683BF9-FA3B-4B0D-9535-A1F05188BAF3"
   */
  resettableDeviceId: string;

  /**
   * The user language.
   * Eg. "en-us", "en-za", "zh-tw", "jp"
   */
  userDefaultLanguage: string;

  /**
   * The timezone of the device when data was uploaded as seconds skew from UTC.
   */
  deviceTimeZoneOffsetSeconds: number;

  /**
   * The device's Limit Ad Tracking setting.
   * When true, we cannot use device_id for remarketing, demographics or
   * influencing ads serving behaviour. However, we can use device_id for
   * conversion tracking and campaign attribution.
   */
  limitedAdTracking: boolean;
}

/**
 * Message containing information pertaining to the event.
 *
 * @public
 */
export interface EventDimensions {
  /**
   * The date on which this event was logged.
   * (YYYYMMDD format in the registered timezone of your app.)
   */
  date: string;

  /**
   * The name of this event.
   */
  name: string;

  /**
   * A repeated record of the parameters associated with this event.
   */
  params: object;

  /**
   * UTC client time when the event happened.
   */
  timestampMicros: number;

  /**
   * UTC client time when the previous event happened.
   */
  previousTimestampMicros: number;

  /**
   * Value param in USD.
   */
  valueInUsd: number;
}

/**
 * Message containing information regarding the bundle in which these
 * events were uploaded.
 *
 * @public
 */
export interface ExportBundleInfo {
  /**
   * Monotonically increasing index for each bundle set by SDK.
   */
  bundleSequenceId: number;

  /**
   * Timestamp offset between collection time and upload time.
   */
  serverTimestampOffsetMicros: number;
}

/**
 * User's geographic informaiton.
 *
 * @public
 */
export interface GeoInfo {
  /**
   * The geographic continent.
   * Eg. Americas
   */
  continent: string;

  /**
   * The geographic country.
   * Eg. Brazil
   */
  country: string;

  /**
   * The geographic region.
   * Eg. State of Sao Paulo
   */
  region: string;

  /**
   * The geographic city.
   * Eg. Sao Paulo
   */
  city: string;
}

/**
 * Lifetime Value information about this user.
 *
 * @public
 */
export interface LtvInfo {
  /**
   * The Lifetime Value revenue of this user.
   */
  revenue: number;

  /**
   * The currency corresponding to the revenue.
   */
  currency: string;
}

/**
 * Mesage containing marketing campaign information which acquired the user.
 *
 * @public
 */
export interface TrafficSource {
  /**
   * The name of the campaign which acquired the user.
   */
  userAcquiredCampaign: string;

  /**
   * The name of the network which acquired the user.
   */
  userAcquiredSource: string;

  /**
   * The name of the medium which acquired the user.
   */
  userAcquiredMedium: string;
}

/**
 * Message containing information about the user associated with the event.
 *
 * @public
 */
export interface UserDimensions {
  /**
   * The user ID set via the setUserId API.
   */
  userId: string;

  /**
   * The time (in microseconds) at which the user first opened the app.
   */
  firstOpenTimestampMicros: number;

  /**
   * A repeated record of user properties set with the setUserProperty API.
   * https://firebase.google.com/docs/analytics/android/properties
   */
  userProperties: object;

  /**
   * Device information.
   */
  deviceInfo: DeviceInfo;

  /**
   * User's geographic information.
   */
  geoInfo: GeoInfo;

  /**
   * App information.
   */
  appInfo: AppInfo;

  /**
   * Information about marketing campaign which acquired the user.
   */
  trafficSource: TrafficSource;

  /**
   * Information regarding the bundle in which these events were uploaded.
   */
  bundleInfo: ExportBundleInfo;

  /**
   * Lifetime Value information about this user.
   */
  ltvInfo: LtvInfo;
}

/**
 * Predefined (eg: LTV) or custom properties (eg: birthday) stored on client
 * side and associated with subsequent HitBundles.
 *
 * @public
 */
export interface UserPropertyValue {
  /**
   * Last set value of user property.
   */
  value: AnalyticsValue;

  /**
   * UTC client time when user property was last set.
   */
  setTimestampUsec: number;

  /**
   * Index for user property (one-based).
   */
  index: number;
}
