      // Initialize Socket.IO
      const socket = io('http://localhost:3000');

      // Wait for messages
      socket.on('message', (message) => {
        const messageContainer = document.createElement('div');
        messageContainer.classList.add('message');
        messageContainer.innerText = message;
        document.getElementById('messages').appendChild(messageContainer);
      });

      // Handle message submmission
      document.getElementById('chat-form').addEventListener('submit', (event) => {
        event.preventDefault();
        const input = document.getElementById('message-input');
        const message = input.value;
        input.value = '';

        // Send the message to the server
        socket.emit('message', message);
      });

