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

/* eslint-disable @typescript-eslint/no-explicit-any */
import * as t from '@babel/types';
import * as https from 'https';

/**
 * Relative path of src dictory to write the TS files ts.
 */
export const RELATIVE_SRC_DIR = '../../src/cloud_event_types';

/**
 * Add a JSDoc comment to an AST node
 * @param node the AST node to add a comment to
 * @param comment the text content of the comment
 * @param isPublic whether or not to add an "@public" annotation
 * @returns the AST node with attached comment
 */
export const addComment = <T extends t.Node>(
  node: T,
  comment?: string,
  isPublic = false
): T => {
  if (comment) {
    const lines = comment.split('\n').map(l => ' * ' + l.trim());
    lines.unshift('*');

    if (isPublic) {
      lines.push(' * ');
      lines.push(' * @public');
    }

    t.addComment(node, 'leading', lines.join('\n') + '\n ');
  }
  return node;
};

/**
 * Fetch a url as a JSON object
 * @param url the URL to fetch
 * @returns the response parsed as json
 */
export const fetch = (url: string): Promise<{[key: string]: any}> => {
  return new Promise((resolve, reject) => {
    https
      .get(url, (resp: any) => {
        let data = '';
        resp.on('data', (chunk: string) => (data += chunk));
        resp.on('end', () => resolve(JSON.parse(data)));
      })
      .on('error', reject);
  });
};

/**
 * Get the relative file path of an interface file
 * @param url the URL of schema in the googleapis/google-cloudevents repo
 * @returns the relative file path to write the interface type to
 */
export const getDataFilePath = (url: string): string => {
  return (
    RELATIVE_SRC_DIR +
    url
      .split('jsonschema/google/events')[1]
      .replace('.json', '.ts')
      .replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
      .replace('/_', '/')
  );
};

/**
 * Get the relative import path of the cloudevent type for a given schema url
 * @param url the URL of the type schema in the googleapis/google-cloudevents repo
 * @returns the relative import path of containing the CloudEvent type
 */
export const getCloudEventImportPath = (url: string): string => {
  const dataPath = getDataFilePath(url);
  return dataPath.replace('.ts', '').replace(RELATIVE_SRC_DIR, '.');
};

/**
 * Get the name of a CloudEvent type that corresponds to the given data payload type.
 * @param dataTypeName the name of the data payload type
 * @returns the name of the CloudEvent type
 */
export const getCloudEventTypeName = (dataTypeName: string): string => {
  return dataTypeName.replace(/Data$/, 'CloudEvent');
};

/**
 * Add a copyright header to an AST file
 * @param file the file AST node to add the header to
 * @returns the updated AST node
 */
export const addCopyright = (file: t.File): t.File => {
  t.addComment(
    file,
    'leading',
    ' eslint-disable @typescript-eslint/no-explicit-any',
    false
  );
  [
    ' Copyright 2021 Google LLC',
    '',
    ' Licensed under the Apache License, Version 2.0 (the "License");',
    ' you may not use this file except in compliance with the License.',
    ' You may obtain a copy of the License at',
    '',
    '      http://www.apache.org/licenses/LICENSE-2.0',
    '',
    ' Unless required by applicable law or agreed to in writing, software',
    ' distributed under the License is distributed on an "AS IS" BASIS,',
    ' WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.',
    ' See the License for the specific language governing permissions and',
    ' limitations under the License.',
  ]
    .reverse()
    .forEach(line => {
      t.addComment(file, 'leading', line, true);
    });
  return file;
};
