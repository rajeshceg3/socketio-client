    
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
        console.log("Client connected:", client.id); // Log client ID for clarity
        // Send the current count to the newly connected client
        client.emit('updateCount', noOfClicks);

        client.on('error', (err) => {
          console.error('Client socket error:', err, client.id);
        });

        client.on('buttonClicked', ()=> { // data is not used
          noOfClicks++;
          console.log("Button clicked! New count:", noOfClicks); // Add server log for click
          io.emit('updateCount', noOfClicks);
        });

        client.on('disconnect', () => {
            console.log('Client disconnected:', client.id);
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
 