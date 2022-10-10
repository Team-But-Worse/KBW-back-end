'use strict';

// make three files:
// 1. one for MessageQueue class

// 2. file to define the `.on` functions do

// 3. file to do the io, PORT, MessageQueue, and onGoingQueue stuff
const express = require('express')
const app = express();
const cors = require('cors');
const http = require('http');
const io = require('socket.io');
const PORT = process.env.PORT || 3002;
const MessageQueue = require('./lib/MessageQueue/MessageQueue.js');

app.use(cors());

const server = http.createServer(app);
const socketServer = io(server, {
  cors: {
    origin: "https://6343a6a00602f628fea36e06--kbw.netlify.app/",
    methods:["GET", "POST"]
  }
})

server.listen(PORT)

// const server = io(PORT);
const messages = socketServer.of('messages');
const outGoing = new MessageQueue();
// queue for outgoing messages
//const receivedQueue = new MessageQueue();

// pickup queue
// enqueue pickup payload to pickup queue
// listen for in-transit event and then dequeue pickup from queue

// in-transit queue
// enqueue in-transit payload to in-transit queue
// listen for delivered event and then dequeue pickup from queue

// delivered queue
// enqueue delivered payload to delivered queue
// then dequeue the payload from this delivered queue

messages.on('connection', (socket) =>
{

  console.log('Socket Connected!!', socket.id);

  socket.on('questions', (payload) => {
    console.log(payload);
    socket.broadcast.emit('questions', payload)
  })
  socket.on('answers', (payload) => {
    console.log(payload)
    messages.emit('answers', payload)
  })
  socket.on('join', (payload) =>
  {
    console.log('Room registered', payload.clientId);
    socket.join(payload.clientId);
  });

  socket.on('message', (payload) =>
  {
    console.log('MESSAGE SENT', payload);
    outGoing.add(payload.clientId, payload.body);
    socket.to(payload.clientId).emit('message', payload);
  });

  // client needs all messages from a clientId
  socket.on('get-messages', (payload) =>
  {
    outGoing.get(payload.clientId).forEach(message =>
    {
      // this emits back to the same client that published the "get-messages"
      socket.emit('message', message);
    });
  });

  socket.on('received', (payload) =>
  {
    let receipt = outGoing.read(payload.clientId, payload.body.messageId);
    console.log('MESSAGE REMOVED', payload);
    socket.to(payload.clientId).emit('received', receipt);
  });
});
