# Tap Game PWA with OSC Integration

## Overview

This project is a Progressive Web App (PWA) that allows users to tap a button to fill a progress bar. As the progress increases, the app sends messages using the OSC (Open Sound Control) protocol via UDP to control visual effects in MadMapper, such as LED strips.

## Features

* **Progressive Web App**: Can be installed on mobile devices and works offline.
* **Real-time Interaction**: Uses WebSocket to send tap events to a Node.js server.
* **OSC Communication**: The server sends OSC messages to MadMapper to trigger visual feedback.
* **Simple UI**: Displays a logo and a progress bar that fills up as the user taps.

## Technologies Used

* **Frontend**: HTML, CSS, JavaScript
* **Backend**: Node.js with Express and WebSocket (`ws` library)
* **OSC Library**: `node-osc`
* **Visual Feedback**: MadMapper software

## How It Works

1. The user opens the PWA and taps the button.
2. Each tap increases the progress bar.
3. The app sends a message via WebSocket to the Node.js server.
4. The server receives the message and sends an OSC message to MadMapper.
5. MadMapper receives the OSC message and updates the visual effects accordingly.

## Setup Instructions

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/yourusername/tap-game-pwa.git
   cd tap-game-pwa
   ```

2. **Install Dependencies**:

   ```bash
   npm install
   ```

3. **Generate SSL Certificates** (for HTTPS):

   * Use tools like `mkcert` to create `cert.pem` and `key.pem` files.
   * Place them in the project root directory.

4. **Start the Server**:

   ```bash
   node server.js
   ```

5. **Access the App**:

   * Open your browser and navigate to `https://localhost:3000`.

6. **Configure MadMapper**:

   * Set MadMapper to listen for OSC messages on port `3333`.
   * Map the `/progress` OSC address to control your desired visual effect.

## Notes

* Ensure that MadMapper and the Node.js server are on the same network.
* The app is designed for demonstration purposes and may require additional features for production use.

## License

This project is licensed under the MIT License.

---

Feel free to customize this `README.md` to better fit your project's specific details or to add more information as needed.
