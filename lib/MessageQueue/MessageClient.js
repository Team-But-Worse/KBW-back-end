'use strict';

const io = require('socket.io-client');

// client-side interface, for users to interact with the MessageQueue server
class MessageClient
{
  // which clientId are you trying to connect to?
  // url param has default value
  constructor(clientId, url = 'http://localhost:3002/messages')
  {
    this.clientId = clientId;
    // this is the line where the instance of the message client gets assigned the socket
    this.socket = io.connect(url);
  }

  // subscribe method
  subscribe(event, handler)
  {
    // have the client join a room with their clientId, all on their own
    // THIS is the spot where the client connects to the CAPS server
    this.socket.emit('join', { clientId: this.clientId });
    this.socket.on(event, handler);
  }

  // `payload = {}`, so that the payload is configured as an object
  publish(event, payload = {})
  {
    this.socket.emit(event, {
      // the `body` has the `clientId` and the `messageId` attached to it, already
      // so the MessagesQueue.read() will know what to delete
      body: payload,
      clientId: this.clientId,
    });
  }
}

module.exports = MessageClient;
