/**
 * The samples in this file demonstrate using type guards in vanilla Javascript.
 * Developers will get the same autocompletion / intellisense benefits as they would
 * had they used Typescript to implement their functions.
 */
import * as functions from "@google-cloud/functions-framework";
import {isGoogleEvent} from '../google_events';


functions.cloudEvent("GoogleEventJs1", (ce) => {
  if (!isGoogleEvent(ce)) {
    throw "woops this shouldn't happen!"
  }
  // in this branch the typechecker knows ce is a GoogleCloudEvent
  switch (ce.type) {
    case "google.cloud.audit.log.v1.written":
      ce.data.insertId.length;
      break;
    case "google.cloud.pubsub.topic.v1.messagePublished":
      ce.data.subscription.length;
      break;
    // etc...
  }
});

functions.cloudEvent("GoogleEventJs2", (ce) => {
  if (isGoogleEvent(ce, 'google.cloud.audit.log.v1.written')) {
    ce.data.insertId.length;
  }
  if (isGoogleEvent(ce, 'google.cloud.pubsub.topic.v1.messagePublished')) {
    ce.data.subscription.length;
  }
});