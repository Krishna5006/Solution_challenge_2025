const WebSocket = require('ws');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// WebSocket server configuration
const PORT = 8888;

// Ensure the script exists before trying to spawn
function validatePythonScript(scriptPath) {
    if (!fs.existsSync(scriptPath)) {
        console.error(`Error: Python script not found at ${scriptPath}`);
        process.exit(1);
    }
}

// Spawn Python face recognition server
function startPythonServer(scriptPath) {
    // Validate script path
    validatePythonScript(scriptPath);

    // Determine Python executable (you might need to adjust this)
    const pythonExecutable = process.platform === 'win32' ? 'python' : 'python3';

    // Spawn process with enhanced error handling
    const pythonProcess = spawn(pythonExecutable, [scriptPath], {
        stdio: 'pipe',
        shell: false
    });

    // Stdout logging
    pythonProcess.stdout.on('data', (data) => {
        console.log(`Python Server Output: ${data.toString().trim()}`);
    });

    // Stderr logging (critical for debugging)
    pythonProcess.stderr.on('data', (data) => {
        console.error(`Python Server Error: ${data.toString().trim()}`);
    });

    // Process exit handling
    pythonProcess.on('close', (code, signal) => {
        console.log(`Python process exited with code ${code}, signal: ${signal}`);
        
        // Automatic restart strategy
        if (code !== 0) {
            console.log('Unexpected exit. Attempting restart...');
            setTimeout(() => {
                console.log('Restarting Python server...');
                startPythonServer(scriptPath);
            }, 5000);
        }
    });

    // Error event handling
    pythonProcess.on('error', (err) => {
        console.error('Failed to start Python process:', err);
    });

    return pythonProcess;
}

// Main server setup function
function setupWebSocketServer() {
    try {
        // Comprehensive path resolution
        const PYTHON_SCRIPT_PATH = path.resolve(__dirname, 'face_recognition_server.py');

        // Create WebSocket server
        const wss = new WebSocket.Server({ port: PORT });

        // WebSocket connection handler
        wss.on('connection', (ws) => {
            console.log('Client connected to WebSocket server');

            ws.on('message', (rawMessage) => {
                try {
                    // Handle both string and buffer messages
                    const message = rawMessage instanceof Buffer 
                        ? rawMessage.toString() 
                        : rawMessage;
                    
                    const data = JSON.parse(message);
                    console.log('Received message:', data);

                    // Broadcast to all other clients
                    wss.clients.forEach((client) => {
                        if (client !== ws && client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify(data));
                        }
                    });
                } catch (error) {
                    console.error('Message processing error:', error);
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Invalid message format'
                    }));
                }
            });

            ws.on('close', () => {
                console.log('Client disconnected');
            });

            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
            });
        });

        // Server error handling
        wss.on('error', (error) => {
            console.error('WebSocket server error:', error);
        });

        // Start Python server
        const pythonServerProcess = startPythonServer(PYTHON_SCRIPT_PATH);

        console.log(`WebSocket server running on ws://localhost:${PORT}`);

        // Graceful shutdown
        process.on('SIGINT', () => {
            console.log('Shutting down servers...');
            wss.close(() => {
                console.log('WebSocket server closed');
                if (pythonServerProcess) {
                    pythonServerProcess.kill();
                }
                process.exit(0);
            });
        });

        return { wss, pythonServerProcess };
    } catch (error) {
        console.error('Critical server setup error:', error);
        process.exit(1);
    }
}

// Run the server
setupWebSocketServer();