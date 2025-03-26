import asyncio
import websockets
import base64
import os
import json
from deepface import DeepFace

# Directory to save uploaded images
UPLOAD_DIR = 'captured_images'
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Reference image path (you should replace this with your actual reference image path)
REFERENCE_IMAGE_PATH = '/path/to/your/reference/image.jpg'

async def handle_client(websocket, path):
    try:
        async for message in websocket:
            try:
                # Parse the incoming message
                data = json.loads(message)
                
                # Handle different message types
                if data['type'] == 'save':
                    # Save the uploaded image
                    filename = os.path.join(UPLOAD_DIR, data['filename'])
                    
                    # Remove the data URL prefix
                    image_data = data['data'].split(',')[1]
                    
                    # Decode base64 image
                    with open(filename, 'wb') as f:
                        f.write(base64.b64decode(image_data))
                    
                    # Perform face verification
                    try:
                        result = DeepFace.verify(filename, REFERENCE_IMAGE_PATH)
                        
                        # Prepare response
                        if result['verified']:
                            response = {
                                'type': 'success',
                                'message': '✅ Face verified successfully!'
                            }
                        else:
                            response = {
                                'type': 'error',
                                'message': '❌ Face verification failed.'
                            }
                    except Exception as verify_error:
                        response = {
                            'type': 'error',
                            'message': f'Error during verification: {str(verify_error)}'
                        }
                    
                    # Send response back to client
                    await websocket.send(json.dumps(response))
                
                elif data['type'] == 'status':
                    # Handle status requests
                    await websocket.send(json.dumps({
                        'type': 'status',
                        'message': 'Server is running and ready.'
                    }))
                
            except json.JSONDecodeError:
                # Handle invalid JSON
                await websocket.send(json.dumps({
                    'type': 'error',
                    'message': 'Invalid message format'
                }))
            except Exception as e:
                # Handle other unexpected errors
                await websocket.send(json.dumps({
                    'type': 'error',
                    'message': f'Server error: {str(e)}'
                }))
    
    except websockets.exceptions.ConnectionClosed:
        print("Client disconnected")

async def start_server():
    # Start WebSocket server on port 8888
    server = await websockets.serve(handle_client, "localhost", 8888)
    print("WebSocket server started on ws://localhost:8888")
    await server.wait_closed()

# Run the server
if __name__ == "_main_":
    asyncio.run(start_server())

# Dependencies:
# pip install websockets
# pip install deepface
# pip install opencv-python
# pip install tensorflow