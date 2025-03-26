import os
import json
import base64
import asyncio
import logging
import time
import hashlib
import re
from pathlib import Path
import websockets
from deepface import DeepFace
import concurrent.futures

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("face_verification.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("face_verification")

# Configuration
class Config:
    # Folders
    IMAGE_FOLDER = "images"  # Folder to save captured images
    REFERENCE_FOLDER = "faceimg_data"  # Folder containing reference images
    
    # WebSocket server settings
    HOST = "localhost"
    PORT = 8888
    
    # Security settings
    MAX_CONNECTIONS = 10  # Maximum number of simultaneous connections
    MAX_REQUESTS_PER_MINUTE = 20  # Rate limiting
    REQUEST_TIMEOUT = 30  # Seconds
    MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB
    
    # Cleanup settings
    IMAGE_RETENTION_DAYS = 1  # Days to keep captured images
    
    # Connection settings
    PING_INTERVAL = 30  # Send ping every 30 seconds
    PING_TIMEOUT = 20  # Increased timeout for ping responses
    
    # Secret token for basic authentication
    # In production, use a more robust authentication system
    API_TOKEN = os.environ.get("API_TOKEN", "your_default_token_here")

# Ensure folders exist
os.makedirs(Config.IMAGE_FOLDER, exist_ok=True)
os.makedirs(Config.REFERENCE_FOLDER, exist_ok=True)

# Create a thread pool for CPU-intensive tasks
executor = concurrent.futures.ThreadPoolExecutor(max_workers=4)

# Connection and rate limiting tracking
active_connections = set()
request_timestamps = {}
connection_stats = {}  # Track statistics for each connection

def sanitize_filename(filename):
    """Sanitize filename to prevent path traversal attacks."""
    # Extract file extension
    name, ext = os.path.splitext(filename)
    # Generate a hash of the original filename to preserve uniqueness
    safe_name = hashlib.md5(name.encode()).hexdigest()
    # Allow only alphanumeric characters and common extensions
    if re.match(r'^[a-zA-Z0-9]+\.(jpg|jpeg|png)$', f"{safe_name}{ext.lower()}"):
        return f"{safe_name}{ext.lower()}"
    return f"{safe_name}.jpg"  # Default to jpg if extension is suspicious

def cleanup_old_images():
    """Remove images older than the retention period."""
    retention_seconds = Config.IMAGE_RETENTION_DAYS * 24 * 60 * 60
    current_time = time.time()
    
    for img_path in Path(Config.IMAGE_FOLDER).glob("*.*"):
        if img_path.is_file():
            file_age = current_time - img_path.stat().st_mtime
            if file_age > retention_seconds:
                try:
                    os.remove(img_path)
                    logger.info(f"Deleted old image: {img_path}")
                except Exception as e:
                    logger.error(f"Failed to delete {img_path}: {e}")

async def run_in_executor(func, *args):
    """Run CPU-intensive task in thread pool."""
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(executor, func, *args)

async def verify_face(img1_path, img2_path):
    """Perform face verification in a separate thread."""
    try:
        result = await run_in_executor(DeepFace.verify, img1_path, img2_path)
        return result
    except Exception as e:
        logger.error(f"Face verification error: {e}")
        raise

def check_rate_limit(client_ip):
    """Check if client has exceeded rate limits."""
    current_time = time.time()
    minute_ago = current_time - 60
    
    # Initialize or update client's request history
    if client_ip not in request_timestamps:
        request_timestamps[client_ip] = []
    
    # Remove timestamps older than a minute
    request_timestamps[client_ip] = [ts for ts in request_timestamps[client_ip] if ts > minute_ago]
    
    # Check if rate limit exceeded
    if len(request_timestamps[client_ip]) >= Config.MAX_REQUESTS_PER_MINUTE:
        return False
    
    # Add current timestamp to history
    request_timestamps[client_ip].append(current_time)
    return True

def find_matching_reference_image(filename):
    """
    Find a matching reference image by person id.
    Allows different filenames as long as they contain the same person identifier.
    """
    # Extract person identifier from filename (assuming format: personID_*.jpg)
    match = re.match(r'([a-zA-Z0-9]+)_', filename)
    if not match:
        return None
    
    person_id = match.group(1)
    # Look for any reference image with the same person ID
    for ref_file in os.listdir(Config.REFERENCE_FOLDER):
        if ref_file.startswith(f"{person_id}_"):
            return os.path.join(Config.REFERENCE_FOLDER, ref_file)
    
    return None

async def handle_connection(websocket, path=None):
    """Handle WebSocket connection and messages."""
    client_ip = websocket.remote_address[0]
    connection_id = id(websocket)  # Unique identifier for this connection
    connection_time = time.time()
    
    logger.info(f"New connection {connection_id} from {client_ip}")
    
    # Store connection statistics
    connection_stats[connection_id] = {
        "ip": client_ip,
        "connected_at": connection_time,
        "messages_received": 0,
        "messages_sent": 0,
        "errors": 0
    }
    
    # Check max connections
    if len(active_connections) >= Config.MAX_CONNECTIONS:
        await websocket.send(json.dumps({
            "type": "error", 
            "message": "Server at capacity. Please try again later."
        }))
        connection_stats[connection_id]["messages_sent"] += 1
        connection_stats[connection_id]["errors"] += 1
        logger.warning(f"Connection {connection_id} rejected: server at capacity")
        return
    
    active_connections.add(websocket)
    logger.info(f"Active connections: {len(active_connections)}")
    
    try:
        async for message in websocket:
            connection_stats[connection_id]["messages_received"] += 1
            
            # Check rate limiting
            if not check_rate_limit(client_ip):
                await websocket.send(json.dumps({
                    "type": "error", 
                    "message": "Rate limit exceeded. Please try again later."
                }))
                connection_stats[connection_id]["messages_sent"] += 1
                connection_stats[connection_id]["errors"] += 1
                continue
                
            try:
                data = json.loads(message)
                
                # Validate message type
                if "type" not in data:
                    await websocket.send(json.dumps({
                        "type": "error", 
                        "message": "Invalid message format: missing 'type'"
                    }))
                    connection_stats[connection_id]["messages_sent"] += 1
                    connection_stats[connection_id]["errors"] += 1
                    continue
                
                # Token authentication
                if data.get("token") != Config.API_TOKEN and data["type"] != "health":
                    await websocket.send(json.dumps({
                        "type": "error", 
                        "message": "Authentication failed"
                    }))
                    connection_stats[connection_id]["messages_sent"] += 1
                    connection_stats[connection_id]["errors"] += 1
                    continue
                
                if data["type"] == "save":
                    # Validate required fields
                    if "data" not in data or "filename" not in data:
                        await websocket.send(json.dumps({
                            "type": "error", 
                            "message": "Missing required fields"
                        }))
                        connection_stats[connection_id]["messages_sent"] += 1
                        connection_stats[connection_id]["errors"] += 1
                        continue
                    
                    # Check image size (roughly)
                    image_size = len(data["data"]) * 0.75  # Base64 is ~4/3 the size of binary
                    if image_size > Config.MAX_IMAGE_SIZE:
                        await websocket.send(json.dumps({
                            "type": "error", 
                            "message": f"Image too large (max {Config.MAX_IMAGE_SIZE/1024/1024}MB)"
                        }))
                        connection_stats[connection_id]["messages_sent"] += 1
                        connection_stats[connection_id]["errors"] += 1
                        continue
                    
                    # Sanitize filename
                    safe_filename = sanitize_filename(data["filename"])
                    
                    try:
                        # Decode the base64 image data
                        image_data_parts = data["data"].split(",")
                        if len(image_data_parts) < 2:
                            raise ValueError("Invalid base64 data format")
                        
                        image_data = base64.b64decode(image_data_parts[1])
                        filename = os.path.join(Config.IMAGE_FOLDER, safe_filename)
                        
                        # Save the image to the folder
                        with open(filename, "wb") as f:
                            f.write(image_data)
                        logger.info(f"Image saved: {filename}")
                        
                        # Find a matching reference image
                        reference_image_path = find_matching_reference_image(safe_filename)
                        if not reference_image_path:
                            await websocket.send(json.dumps({
                                "type": "error", 
                                "message": f"No matching reference image found for ID in: {safe_filename}"
                            }))
                            connection_stats[connection_id]["messages_sent"] += 1
                            connection_stats[connection_id]["errors"] += 1
                            continue
                        
                        # Perform face verification
                        try:
                            result = await verify_face(filename, reference_image_path)
                            confidence = round(result.get("distance", 0) * 100, 2)
                            
                            if result["verified"]:
                                response = {
                                    "type": "success", 
                                    "message": f"✅ The faces match! (Confidence: {confidence}%)",
                                    "confidence": confidence
                                }
                            else:
                                response = {
                                    "type": "error", 
                                    "message": f"❌ The faces do not match. (Confidence: {confidence}%)",
                                    "confidence": confidence
                                }
                        except Exception as e:
                            response = {
                                "type": "error", 
                                "message": "Face verification failed: face not detected or error processing image"
                            }
                            logger.error(f"Face verification exception: {str(e)}")
                            connection_stats[connection_id]["errors"] += 1
                            
                        # Send the result back to the frontend
                        await websocket.send(json.dumps(response))
                        connection_stats[connection_id]["messages_sent"] += 1
                        
                    except Exception as e:
                        logger.error(f"Image processing error: {str(e)}")
                        await websocket.send(json.dumps({
                            "type": "error", 
                            "message": "Error processing image"
                        }))
                        connection_stats[connection_id]["messages_sent"] += 1
                        connection_stats[connection_id]["errors"] += 1
                
                elif data["type"] == "ping":
                    # Simple ping to keep connection alive
                    await websocket.send(json.dumps({"type": "pong"}))
                    connection_stats[connection_id]["messages_sent"] += 1
                    
                elif data["type"] == "health":
                    # Endpoint to check if server is healthy without authentication
                    await websocket.send(json.dumps({
                        "type": "health",
                        "status": "ok"
                    }))
                    connection_stats[connection_id]["messages_sent"] += 1
                
                elif data["type"] == "debug" and data.get("token") == Config.API_TOKEN:
                    # Debug endpoint for server state
                    conn_info = {
                        "active_connections": len(active_connections),
                        "connection_stats": {
                            k: v for k, v in connection_stats.items()
                            if time.time() - v["connected_at"] < 3600  # Show last hour
                        },
                        "rate_limits": {
                            ip: len(timestamps) for ip, timestamps in request_timestamps.items()
                        }
                    }
                    await websocket.send(json.dumps({
                        "type": "debug",
                        "data": conn_info
                    }))
                    connection_stats[connection_id]["messages_sent"] += 1
                    
                else:
                    await websocket.send(json.dumps({
                        "type": "error", 
                        "message": f"Unknown message type: {data['type']}"
                    }))
                    connection_stats[connection_id]["messages_sent"] += 1
                    connection_stats[connection_id]["errors"] += 1
                    
            except json.JSONDecodeError:
                await websocket.send(json.dumps({
                    "type": "error", 
                    "message": "Invalid JSON format"
                }))
                connection_stats[connection_id]["messages_sent"] += 1
                connection_stats[connection_id]["errors"] += 1
                
    except websockets.exceptions.ConnectionClosed as e:
        duration = time.time() - connection_stats[connection_id]["connected_at"]
        logger.info(f"Connection {connection_id} closed for {client_ip}: code={e.code}, reason='{e.reason}', duration={duration:.2f}s")
    except Exception as e:
        logger.error(f"Unexpected error in connection {connection_id}: {str(e)}")
        connection_stats[connection_id]["errors"] += 1
    finally:
        if websocket in active_connections:
            active_connections.remove(websocket)
            logger.info(f"Connection {connection_id} removed from active connections. Remaining: {len(active_connections)}")

async def periodic_cleanup():
    """Run cleanup tasks periodically."""
    while True:
        logger.info("Running periodic cleanup")
        cleanup_old_images()
        
        # Clean up old connection stats
        current_time = time.time()
        old_connections = [conn_id for conn_id, stats in connection_stats.items() 
                          if current_time - stats["connected_at"] > 24*3600]  # Older than 24 hours
        for conn_id in old_connections:
            del connection_stats[conn_id]
        
        await asyncio.sleep(3600)  # Run every hour

async def main():
    """Main function to start the server and periodic tasks."""
    # Start the periodic cleanup task
    asyncio.create_task(periodic_cleanup())
    
    # Start the WebSocket server
    server = await websockets.serve(
        handle_connection, 
        Config.HOST, 
        Config.PORT,
        ping_interval=Config.PING_INTERVAL,
        ping_timeout=Config.PING_TIMEOUT
    )
    
    logger.info(f"WebSocket server started on ws://{Config.HOST}:{Config.PORT}")
    logger.info(f"Using ping interval: {Config.PING_INTERVAL}s, ping timeout: {Config.PING_TIMEOUT}s")
    
    # Keep the server running
    await server.wait_closed()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Server shutdown requested")
    except Exception as e:
        logger.error(f"Server error: {e}")
        raise