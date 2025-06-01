    
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

    app.get('/',(req,res)=>{
      res.sendFile(path.resolve(__dirname,'client.html'))
    })
 