
import requests
import json
import time
import random
from datetime import datetime

# Configuration
API_ENDPOINT = "http://localhost:5173/detection_output"  # Update this URL if your app is hosted elsewhere
FEED_IDS = ["1", "2"]  # These should match your camera feed IDs
EVENT_TYPES = [
    "Person detected", 
    "Vehicle detected",
    "Motion detected",
    "Animal detected",
    "Unknown object"
]

def send_detection_event(feed_id, event_type=None):
    """Send a detection event to the API endpoint"""
    
    # Get current time as timestamp
    current_time = datetime.now().strftime("%H:%M:%S")
    
    # Generate a random confidence score between 0.6 and 0.99
    confidence = round(random.uniform(0.6, 0.99), 2)
    
    # If no event type specified, randomly select one
    if event_type is None:
        event_type = random.choice(EVENT_TYPES)
    
    # Create the payload
    payload = {
        "event": event_type,
        "timestamp": current_time,
        "feedId": feed_id,
        "confidence": confidence
    }
    
    # Additional data you might want to include (optional)
    if random.random() > 0.7:  # 30% chance to include bounding box
        payload["boundingBox"] = {
            "x": random.randint(10, 300),
            "y": random.randint(10, 200),
            "width": random.randint(50, 200),
            "height": random.randint(50, 200)
        }
    
    try:
        # Send POST request to the API endpoint
        response = requests.post(API_ENDPOINT, json=payload)
        
        # Check if request was successful
        if response.status_code == 200:
            print(f"✅ Successfully sent detection event: {json.dumps(payload)}")
            return True
        else:
            print(f"❌ Failed to send detection event. Status code: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.RequestException as e:
        print(f"❌ Error sending detection event: {e}")
        return False

def simulate_detections(count=5, interval=2):
    """Simulate multiple detection events with a delay between them"""
    print(f"Sending {count} detection events at {interval} second intervals...")
    
    for i in range(count):
        # Randomly select a feed ID
        feed_id = random.choice(FEED_IDS)
        
        # Send the detection event
        success = send_detection_event(feed_id)
        
        if i < count - 1 and success:
            print(f"Waiting {interval} seconds before sending next event...")
            time.sleep(interval)
    
    print("Detection simulation complete!")

if __name__ == "__main__":
    print("Detection Event Sender")
    print("=====================")
    print(f"Target API endpoint: {API_ENDPOINT}")
    
    # Ask user for simulation parameters
    try:
        count = int(input("Number of events to send (default 5): ") or "5")
        interval = float(input("Interval between events in seconds (default 2): ") or "2")
        
        # Run the simulation
        simulate_detections(count, interval)
    
    except ValueError:
        print("Please enter valid numbers for count and interval.")
    except KeyboardInterrupt:
        print("\nOperation cancelled by user.")
