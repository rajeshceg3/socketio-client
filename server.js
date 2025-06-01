    
    const express = require('express')
    const socketio = require('socket.io')
    const path = require('path')
    const PORT = 3000
    const app = express()
    let noOfClicks = 0

    const server = app.listen(PORT, ()=>{
      console.log(`Server listening in ${PORT}`)
    })
    io = socketio(server)

    // Listen for incoming connections
    io.on('connection', (client) => {  
        console.log("Client connected")

        client.on('error', (err) => {
          console.error('Client socket error:', err);
        });

        client.on('pressed', (data)=> {
          noOfClicks++;
          io.emit('buttonUpdate', noOfClicks);
        });
    });

    io.on('error', (err) => {
      console.error('Server socket error:', err);
    });

    // Serve static files from the React app build directory
    app.use(express.static(path.join(__dirname, 'my-app/build')));

    // The "catchall" handler: for any request that doesn't
    // match one above, send back React's index.html file.
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'my-app/build', 'index.html'));
    });
 