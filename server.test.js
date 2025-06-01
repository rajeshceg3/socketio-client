const http = require('http');
const { Server } = require('socket.io');
const Client = require('socket.io-client');
const express = require('express'); // Ensure express is available for the app
const path = require('path'); // Ensure path is available

// Import parts of server.js logic or structure it for testing
// For this simple case, we might need to slightly adapt server.js or replicate its core for testing
// Let's assume server.js is started externally or we start a similar server instance here.

describe('Socket.io Server', () => {
  let io, serverSocket, clientSocket, httpServer, app;
  let noOfClicks = 0; // Replicate and manage state for testing

  beforeAll((done) => {
    app = express(); // Create an express app for the server
    httpServer = http.createServer(app);
    io = new Server(httpServer);

    // Replicate server.js connection logic
    io.on('connection', (socket) => {
      serverSocket = socket; // Keep a reference to the server's socket
      console.log("Test Client connected");
      socket.on('pressed', (data) => {
        noOfClicks++;
        io.emit('buttonUpdate', noOfClicks);
      });
      socket.on('resetClicks', () => { // Add a utility for tests
        noOfClicks = 0;
        io.emit('buttonUpdate', noOfClicks);
      });
    });

    app.get('/',(req,res)=>{ // Ensure server has a route
        res.sendFile(path.resolve(__dirname,'client.html')) // Needs client.html or a mock
    })


    httpServer.listen(() => {
      const port = httpServer.address().port;
      clientSocket = Client(`http://localhost:${port}`);
      clientSocket.on('connect', done);
    });
  });

  afterAll(() => {
    io.close();
    clientSocket.close();
    httpServer.close();
  });

  beforeEach((done) => { // Reset clicks before each test
    if (serverSocket) {
        serverSocket.emit('resetClicks'); // Emit reset to the server side logic
         // Wait for the server to process and emit the update
        clientSocket.once('buttonUpdate', (count) => {
            if (count === 0) done();
        });
    } else {
        noOfClicks = 0; // Fallback if direct emit is not set up for this specific test structure
        done();
    }
  });

  test('should connect a client', () => {
    expect(clientSocket.connected).toBe(true);
  });

  test('should increment clicks and emit buttonUpdate', (done) => {
    clientSocket.once('buttonUpdate', (count) => {
      expect(count).toBe(1);
      clientSocket.once('buttonUpdate', (count2) => {
        expect(count2).toBe(2);
        done();
      });
      clientSocket.emit('pressed');
    });
    clientSocket.emit('pressed');
  });

  test('noOfClicks should be reset between tests', (done) => {
    clientSocket.once('buttonUpdate', (count) => {
      expect(count).toBe(1);
      done();
    });
    clientSocket.emit('pressed');
  });
});
