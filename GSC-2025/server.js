// Save this as 'server.js' in your Visual Studio Code project
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

// Create 'images' directory if it doesn't exist
const imagesDir = path.join(__dirname, 'images');
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir);
}

// Use port 8888 as specified
const PORT = 8888;

// Create WebSocket server
const wss = new WebSocket.Server({ port: PORT });
console.log(`WebSocket server started on port ${PORT}`);

wss.on('connection', (ws, req) => {
    const clientIp = req.socket.remoteAddress;
    console.log(`Client connected from ${clientIp}`);
    
    // Send connection confirmation to client
    ws.send(JSON.stringify({
        type: 'status',
        message: 'Connected to server successfully'
    }));
    
    ws.on('message', (message) => {
        try {
            // For Node.js > 16, message might be a Buffer
            const messageStr = message.toString();
            console.log(`Received message of length: ${messageStr.length.toLocaleString()} bytes`);
            
            const data = JSON.parse(messageStr);
            
            if (data.type === 'save' && data.filename && data.data) {
                // Extract base64 data from data URL
                const base64Data = data.data.replace(/^data:image\/png;base64,/, '');
                
                // Create file path
                const filePath = path.join(imagesDir, data.filename);
                console.log(`Attempting to save file to: ${filePath}`);
                
                // Write the file
                fs.writeFile(filePath, base64Data, 'base64', (err) => {
                    if (err) {
                        console.error('Error saving file:', err);
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: 'Failed to save the file: ' + err.message
                        }));
                    } else {
                        console.log(`File saved successfully: ${filePath}`);
                        ws.send(JSON.stringify({
                            type: 'success',
                            message: `File saved: ${data.filename}`,
                            filePath: filePath
                        }));
                    }
                });
            } else {
                console.log('Received message with unknown format:', Object.keys(data));
                ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Invalid message format'
                }));
            }
        } catch (error) {
            console.error('Error processing message:', error);
            try {
                ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Server error: ' + error.message
                }));
            } catch (sendError) {
                console.error('Failed to send error response:', sendError);
            }
        }
    });
    
    ws.on('close', (code, reason) => {
        console.log(`Client disconnected. Code: ${code}, Reason: ${reason || 'No reason provided'}`);
    });
    
    ws.on('error', (error) => {
        console.error('WebSocket connection error:', error);
    });
});

// Handle server errors
wss.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Try another port.`);
    } else {
        console.error('WebSocket server error:', error);
    }
});

// Handle uncaught exceptions to prevent server crash
process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
    // Keep the server running despite the error
});

console.log(`Server is listening for connections. Images will be saved to: ${imagesDir}`);