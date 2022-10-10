'use strict';

// driver

const MessageClient = require('./lib/MessageQueue/MessageClient.js');

// 'Chores' is the clientId, here
const messages = new MessageClient('Chores');

// subscribe to 'message' events
// in the MessageClient class, as soon as a client runs the 'subscribe' method, they join a room with a a clientId
messages.subscribe('message', (payload) =>
{
  // log the entire payload attached to 'message' events in the 'chores' thingy
  console.log(payload);
  messages.publish('received', payload);
});

// get messages that this client missed
messages.publish('get-messages', { clientId: 'Chores' });
