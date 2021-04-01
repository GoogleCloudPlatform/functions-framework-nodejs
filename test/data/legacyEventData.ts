export const LEGACY_PUBSUB_LEGACY = {
  INPUT: {
    "eventId": "aaaaaa-1111-bbbb-2222-cccccccccccc",
    "timestamp": "2020-09-29T11:32:00.000Z",
    "eventType": "providers/cloud.pubsub/eventTypes/topic.publish",
    "resource": "projects/sample-project/topics/gcf-test",
    "data": {
      "@type": "type.googleapis.com/google.pubsub.v1.PubsubMessage",
      "attributes": {
        "attribute1": "value1"
      },
      "data": "VGhpcyBpcyBhIHNhbXBsZSBtZXNzYWdl"
    }
  },
  OUTPUT: {
    "context": {
      "eventId": "aaaaaa-1111-bbbb-2222-cccccccccccc",
      "timestamp": "2020-09-29T11:32:00.000Z",
      "eventType": "providers/cloud.pubsub/eventTypes/topic.publish",
      "resource": "projects/sample-project/topics/gcf-test"
    },
    "data": {
      "@type": "type.googleapis.com/google.pubsub.v1.PubsubMessage",
      "attributes": {
        "attribute1": "value1"
      },
      "data": "VGhpcyBpcyBhIHNhbXBsZSBtZXNzYWdl"
    }
  }
};