
#!/usr/bin/env python3

import asyncio
import websockets
import json
import random
import time
from datetime import datetime

# Configuration
HOST = "localhost"
PORT = 8080
FEED_IDS = ["1", "2"]  # These should match your camera feed IDs
EVENT_TYPES = [
    "Person detected", 
    "Vehicle detected",
    "Motion detected",
    "Animal detected",
    "Unknown object"
]

connected_clients = set()

async def send_detection_events():
    """Periodically send detection events to all connected clients"""
    while True:
        if not connected_clients:
            await asyncio.sleep(1)
            continue

        # Generate a random detection event
        feed_id = random.choice(FEED_IDS)
        event_type = random.choice(EVENT_TYPES)
        current_time = datetime.now().strftime("%H:%M:%S")
        confidence = round(random.uniform(0.6, 0.99), 2)
        
        payload = {
            "event": event_type,
            "timestamp": current_time,
            "feedId": feed_id,
            "confidence": confidence
        }
        
        # Add bounding box sometimes
        if random.random() > 0.7:
            payload["boundingBox"] = {
                "x": random.randint(10, 300),
                "y": random.randint(10, 200),
                "width": random.randint(50, 200),
                "height": random.randint(50, 200)
            }
        
        # Convert to JSON
        json_payload = json.dumps(payload)
        
        # Send to all connected clients
        websockets_to_remove = set()
        for websocket in connected_clients:
            try:
                await websocket.send(json_payload)
                print(f"✅ Sent detection event to client: {json_payload}")
            except websockets.exceptions.ConnectionClosed:
                websockets_to_remove.add(websocket)
        
        # Remove closed connections
        connected_clients.difference_update(websockets_to_remove)
        
        # Wait a bit before sending next event
        await asyncio.sleep(random.uniform(2, 5))

async def handler(websocket, path):
    """Handle new WebSocket connections"""
    print(f"Client connected: {websocket.remote_address}")
    connected_clients.add(websocket)
    
    try:
        # Send welcome message
        welcome_message = {
            "event": "Server connection",
            "message": "Connected to WebSocket server",
            "timestamp": datetime.now().strftime("%H:%M:%S"),
        }
        await websocket.send(json.dumps(welcome_message))
        
        # Keep connection alive until client disconnects
        await websocket.wait_closed()
    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        connected_clients.remove(websocket)
        print(f"Client disconnected: {websocket.remote_address}")

async def main():
    """Start the WebSocket server and periodic detection events"""
    print(f"Starting WebSocket server on ws://{HOST}:{PORT}/ws")
    
    # Start the detection event sender task
    asyncio.create_task(send_detection_events())
    
    # Start the WebSocket server
    async with websockets.serve(handler, HOST, PORT, path="/ws"):
        print(f"WebSocket server running at ws://{HOST}:{PORT}/ws")
        # Keep the server running indefinitely
        await asyncio.Future()

if __name__ == "__main__":
    print("WebSocket Detection Event Server")
    print("===============================")
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nServer stopped by user")
