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
 * The data within all Firestore document events.
 *
 * @public
 */
export interface DocumentEventData {
  /**
   * A Document object containing a post-operation document snapshot.
   * This is not populated for delete events.
   */
  value: Document;

  /**
   * A Document object containing a pre-operation document snapshot.
   * This is only populated for update and delete events.
   */
  oldValue: Document;

  /**
   * A DocumentMask object that lists changed fields.
   * This is only populated for update events.
   */
  updateMask: DocumentMask;
}

/**
 * An array value.
 *
 * @public
 */
export interface ArrayValue {
  /**
   * Values in the array.
   */
  values: Value[];
}

/**
 * A Firestore document.
 *
 * @public
 */
export interface Document {
  /**
   * The resource name of the document. For example:
   * `projects/{project_id}/databases/{database_id}/documents/{document_path}`
   */
  name: string;

  /**
   * The document's fields.
   *
   * The map keys represent field names.
   *
   * A simple field name contains only characters `a` to `z`, `A` to `Z`,
   * `0` to `9`, or `_`, and must not start with `0` to `9`. For example,
   * `foo_bar_17`.
   *
   * Field names matching the regular expression `__.*__` are reserved. Reserved
   * field names are forbidden except in certain documented contexts. The map
   * keys, represented as UTF-8, must not exceed 1,500 bytes and cannot be
   * empty.
   *
   * Field paths may be used in other contexts to refer to structured fields
   * defined here. For `map_value`, the field path is represented by the simple
   * or quoted field names of the containing fields, delimited by `.`. For
   * example, the structured field
   * `"foo" : { map_value: { "x&y" : { string_value: "hello" }}}` would be
   * represented by the field path `foo.x&y`.
   *
   * Within a field path, a quoted field name starts and ends with `` ` `` and
   * may contain any character. Some characters, including `` ` ``, must be
   * escaped using a `\`. For example, `` `x&y` `` represents `x&y` and
   * `` `bak\`tik` `` represents `` bak`tik ``.
   */
  fields: object;

  /**
   * The time at which the document was created.
   *
   * This value increases monotonically when a document is deleted then
   * recreated. It can also be compared to values from other documents and
   * the `read_time` of a query.
   */
  createTime: string;

  /**
   * The time at which the document was last changed.
   *
   * This value is initially set to the `create_time` then increases
   * monotonically with each change to the document. It can also be
   * compared to values from other documents and the `read_time` of a query.
   */
  updateTime: string;
}

/**
 * A set of field paths on a document.
 *
 * @public
 */
export interface DocumentMask {
  /**
   * The list of field paths in the mask.
   * See [Document.fields][google.cloud.firestore.v1.events.Document.fields]
   * for a field path syntax reference.
   */
  fieldPaths: string[];
}

/**
 * A map value.
 *
 * @public
 */
export interface MapValue {
  /**
   * The map's fields.
   *
   * The map keys represent field names. Field names matching the regular
   * expression `__.*__` are reserved. Reserved field names are forbidden except
   * in certain documented contexts. The map keys, represented as UTF-8, must
   * not exceed 1,500 bytes and cannot be empty.
   */
  fields: object;
}

/**
 * A message that can hold any of the supported value types.
 *
 * @public
 */
export interface Value {
  /**
   * A null value.
   */
  nullValue: number;

  /**
   * A boolean value.
   */
  booleanValue: boolean;

  /**
   * An integer value.
   */
  integerValue: number;

  /**
   * A double value.
   */
  doubleValue: number;

  /**
   * A timestamp value.
   *
   * Precise only to microseconds. When stored, any additional precision is
   * rounded down.
   */
  timestampValue: string;

  /**
   * A string value.
   *
   * The string, represented as UTF-8, must not exceed 1 MiB - 89 bytes.
   * Only the first 1,500 bytes of the UTF-8 representation are considered by
   * queries.
   */
  stringValue: string;

  /**
   * A bytes value.
   *
   * Must not exceed 1 MiB - 89 bytes.
   * Only the first 1,500 bytes are considered by queries.
   */
  bytesValue: string;

  /**
   * A reference to a document. For example:
   * `projects/{project_id}/databases/{database_id}/documents/{document_path}`.
   */
  referenceValue: string;

  /**
   * A geo point value representing a point on the surface of Earth.
   */
  geoPointValue: LatLng;

  /**
   * An array value.
   *
   * Cannot directly contain another array value, though can contain an
   * map which contains another array.
   */
  arrayValue: ArrayValue;

  /**
   * A map value.
   */
  mapValue: MapValue;
}

/**
 * An object representing a latitude/longitude pair. This is expressed as a pair
 * of doubles representing degrees latitude and degrees longitude. Unless
 * specified otherwise, this must conform to the
 * <a href="http://www.unoosa.org/pdf/icg/2012/template/WGS_84.pdf">WGS84
 * standard</a>. Values must be within normalized ranges.
 *
 * @public
 */
export interface LatLng {
  /**
   * The latitude in degrees. It must be in the range [-90.0, +90.0].
   */
  latitude: number;

  /**
   * The longitude in degrees. It must be in the range [-180.0, +180.0].
   */
  longitude: number;
}
