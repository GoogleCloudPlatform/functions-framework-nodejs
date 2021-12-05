/**
 * The samples in the file demonstrate using the CloudEvent functions signature
 * with a known GoogleEvent type.
 */
import * as functions from '@google-cloud/functions-framework';
import {CloudPubsubV1MessagePublishedData} from '../google_events';

functions.cloudEvent<CloudPubsubV1MessagePublishedData>('GoogleEvent1', ce => {
  ce.data.subscription.length; // OK!
});

/**
 * Alternative: casting
 */
functions.cloudEvent('GoogleEvent2', ce => {
  const data = ce.data as CloudPubsubV1MessagePublishedData; // data is "unknown" by default so it needs to be cast
  data.subscription.length; // OK!
});

/**
 * Alternative: parameter type hint
 */

// the CloudEvent type is re-exported by the functions framework
import {CloudEvent} from '@google-cloud/functions-framework';

functions.cloudEvent(
  'GoogleEvent3',
  (ce: CloudEvent<CloudPubsubV1MessagePublishedData>) => {
    ce.data.subscription.length; // OK!
  }
);
