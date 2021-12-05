/**
 * The samples in the file demonstrate using the CloudEvent function signature
 * with a user provided interface for the event payload.
 */
import * as functions from '@google-cloud/functions-framework';

interface MyPayloadType {
  foo: string;
  bar: number;
}

functions.cloudEvent<MyPayloadType>('UserDefinedCloudEvent1', ce => {
  ce.data.foo; // OK!
});

/**
 * Alternative: casting
 */
functions.cloudEvent('UserDefinedCloudEvent2', ce => {
  const data = ce.data as MyPayloadType; // data is "unknown" by default so it needs to be cast
  data.foo; // OK!
});

/**
 * Alternative: parameter type hint. Typescript is flexible about where the
 * parameter is provided.
 */

// the CloudEvent type is re-exported by the functions framework
import {CloudEvent} from '@google-cloud/functions-framework';

functions.cloudEvent(
  'UserDefinedCloudEvent3',
  (ce: CloudEvent<MyPayloadType>) => {
    ce.data.foo; // OK!
  }
);
