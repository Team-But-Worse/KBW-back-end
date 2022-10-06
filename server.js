'use strict';

// make three files:
// 1. one for MessageQueue class

// 2. file to define the `.on` functions do

// 3. file to do the io, PORT, MessageQueue, and onGoingQueue stuff

const io = require('socket.io');
const PORT = process.env.PORT || 3002;
const MessageQueue = require('./lib/MessageQueue/MessageQueue.js');

const server = io(PORT);
const messages = server.of('messages');

// queue for outgoing messages
const outGoing = new MessageQueue();

// const receivedQueue = new MessageQueue();

// when a client connects to the 'messages' namespace, look at their `socket`
messages.on('connection', (socket) =>
{
  // log their `socket.id` to the console
  console.log('Socket Connected!!', socket.id);

  // listen for 'join' events
  socket.on('join', (payload) =>
  {
    // log the room that a client 'join's, as well as their clientId attached to the `payload`
    console.log('Room registered', payload.clientId);

    // have the client, (socket), join a room named after their own `payload.clientId`
    socket.join(payload.clientId);
  });

  // listen for when clients, (aka a 'socket'), emits a 'message' event and take in their `payload`
  socket.on('message', (payload) =>
  {
    // log 'MESSAGE SENT' and the entire attached `payload` object
    console.log('MESSAGE SENT', payload);

    // add a record into the `outGoing` queue instance
    // the record will have the `client.Id`, as well as the actual message, (attached to the `payload.body`)
    // the `client.Id` is the intended recipient of the message
    outGoing.add(payload.clientId, payload.body);

    // send out a 'message' event to the intended recipient (the 'Chores' room, in this case), along with the entire, original `payload` from the original sender
    socket.to(payload.clientId).emit('message', payload);
  });

  // client is asking for all messages they missed
  // server listens for a 'get-messages' event, with a `payload` attached
  // the payload in this case looks like this:
  /*
    { clientId: 'Chores' }

    just a clientId key and a 'Chores' value
  */
  socket.on('get-messages', (payload) =>
  {
    // use the `.get()` method on the `MessageQueue` class instance
    // `.get()` is expecting to receive a `clientId`
    // it then returns an array of message keys
    // we'll loop with `.forEach()` of all of the messages
    outGoing.get(payload.clientId).forEach(message =>
    {
      // send out a 'message' event for each missed message in the array
      socket.emit('message', message);
    });
  });

  // this function is for processing a message object in the `outGoing` MessageQueue after a client has confirmed they've 'received' it
  socket.on('received', (payload) =>
  {
    // MessageQueue.read() is expecting to receive two parameters: (clientId, messageId)
    // .read() will delete the `message` record from itself with the matching clientId, messageId combination
    // `receipt` is expected to be and object that looks like this:
    /*
      {
        status: 'received',
        // attach the messageId to the return, so that users can confirm that the thing was deleted
        messageId,
      }
    */
    let receipt = outGoing.read(payload.clientId, payload.body.messageId);

    // log 'MESSAGE REMOVED', as well as the original payload
    console.log('MESSAGE REMOVED', payload);

    // `socket.to`-> emit to all clients in room: `payload.clientId`  except the sender
    // everyone sees a 'received' event and the `receipt{}` object
    socket.to(payload.clientId).emit('received', receipt);
  });
});
