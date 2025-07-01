    
    const express = require('express')
    const socketio = require('socket.io')
    const path = require('path')
    const fs = require('fs') // Added fs module
    const PORT = 3000
    const app = express()
    let noOfClicks = 0
    const clickCountFile = 'clickCount.json';

    // Read click count from file on startup
    try {
      if (fs.existsSync(clickCountFile)) {
        const data = fs.readFileSync(clickCountFile, 'utf8');
        if (data) {
          noOfClicks = JSON.parse(data).count;
          console.log('Read click count from file:', noOfClicks);
        } else {
          console.log('clickCount.json is empty, initializing count to 0.');
          noOfClicks = 0;
        }
      } else {
        console.log('clickCount.json not found, initializing count to 0.');
        noOfClicks = 0;
      }
    } catch (err) {
      console.error('Error reading clickCount.json:', err);
      noOfClicks = 0; // Initialize to 0 in case of an error
    }

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
          // Write updated click count to file
          try {
            fs.writeFileSync(clickCountFile, JSON.stringify({ count: noOfClicks }));
            console.log('Wrote click count to file:', noOfClicks);
          } catch (err) {
            console.error('Error writing clickCount.json:', err);
          }
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
 