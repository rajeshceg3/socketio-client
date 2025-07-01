# Real-Time Click Tracker

## Description
This application tracks button clicks in real-time across all connected clients. When a user clicks a button, the click count is updated and broadcasted to everyone viewing the page.

## Technology Stack
- Node.js
- Express.js
- Socket.io
- HTML
- JavaScript (client-side)

## Features
- Real-time updates of click count.
- Broadcasts updates to all connected clients.
- Simple, intuitive interface.
- Basic error handling for socket connections.
- Click count persistence: The total click count is saved to `clickCount.json` and reloaded when the server restarts.

## Prerequisites
- Node.js and npm (Node Package Manager) installed on your system.

## Setup and Installation
1.  **Clone the repository (or download the files):**
    ```bash
    git clone <repository_url>
    ```
    (If you downloaded the files, extract them to a directory of your choice.)

2.  **Navigate to the project directory:**
    ```bash
    cd <project-directory>
    ```

3.  **Install dependencies:**
    ```bash
    npm install
    ```

## Running the Application
1.  **Start the server:**
    ```bash
    npm start
    ```
    Alternatively, you can run:
    ```bash
    node server.js
    ```
    You should see a message in the console: `Server listening in 3000`.

2.  **Open the application in your web browser:**
    Navigate to `http://localhost:3000`. The `client.html` page will be served.

## How to Use
1.  Open `http://localhost:3000` in one or more web browser windows or tabs.
2.  Click the "Click me" button in any of the open windows.
3.  Observe that the counter ("Button has been pressed X times") updates in real-time across all open instances of the application.

## Project Structure
-   `server.js`: Contains the main server-side logic using Node.js, Express.js, and Socket.io. It handles client connections, button press events, and broadcasts updates.
-   `client.html`: The client-side HTML file that users interact with. It includes JavaScript to connect to the server via Socket.io, send button press events, and update the display with the latest click count.
-   `package.json`: Defines project metadata, dependencies (like Express and Socket.io), and scripts (like `npm start`).
-   `clickCount.json`: Stores the current click count, allowing persistence across server restarts.
-   `README.md`: This file, providing information about the project.
