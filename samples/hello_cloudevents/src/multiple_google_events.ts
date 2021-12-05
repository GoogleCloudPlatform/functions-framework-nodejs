/**
 * The samples in the file demonstrate using the `isGoogleEvent` type predicate
 * provided by the @google/events library to implement a function that accepts
 * multiple different Google CloudEvents.
 */
import * as functions from '@google-cloud/functions-framework';
import {isGoogleEvent} from '../google_events';

functions.cloudEvent('MultiGoogleEvent1', ce => {
  if (!isGoogleEvent(ce)) {
    throw "woops this shouldn't happen!";
  }
  // in this branch the typechecker knows ce is a GoogleCloudEvent
  switch (ce.type) {
    case 'google.cloud.audit.log.v1.written':
      ce.data.insertId.length; // OK!
      break;
    case 'google.cloud.pubsub.topic.v1.messagePublished':
      ce.data.subscription.length; // OK!
      break;
    // etc...
  }
});

/**
 * Alternative: the customer can use the provided type guard to narrow to a
 * specific event type.
 */
functions.cloudEvent('MultiGoogleEvent2', ce => {
  if (isGoogleEvent(ce, 'google.cloud.audit.log.v1.written')) {
    ce.data.insertId.length; // OK!
  }
  if (isGoogleEvent(ce, 'google.cloud.pubsub.topic.v1.messagePublished')) {
    ce.data.subscription.length; // OK!
  }
});

/**
 * Alternative: casting
 */
import {GoogleCloudEvent} from '../google_events';

functions.cloudEvent('MultiGoogleEvent3', ce => {
  const event = ce as GoogleCloudEvent;
  switch (event.type) {
    case 'google.cloud.audit.log.v1.written':
      event.data.insertId.length; // OK!
      break;
    case 'google.cloud.pubsub.topic.v1.messagePublished':
      event.data.subscription.length; // OK!
      break;
    // etc...
  }
});

// Type Error!
// Type 'string' is not assignable to type '"google.firebase.testlab.testMatrix.v1.completed"'.ts(2345)
//
// Unfortunately this makes sense. The typechecker knows the Functions Frameworks is does not guarantee
// that the event argument is one of the known Google CloudEvents.
functions.cloudEvent('TYPE_ERROR', (ce: GoogleCloudEvent) => {
    // :(
  }
);
