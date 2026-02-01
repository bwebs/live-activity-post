import time
import jwt
import httpx
import os
import json
from ai_agent import LiveActivityUpdate

ALGORITHM = 'ES256'

def get_apns_token():
    team_id = os.getenv("APPLE_TEAM_ID")
    key_id = os.getenv("APPLE_KEY_ID")
    p8_path = os.getenv("APPLE_P8_PATH")

    if not team_id or not key_id or not p8_path or not os.path.exists(p8_path):
        return None

    with open(p8_path, 'r') as f:
        secret = f.read()

    token = jwt.encode(
        {
            'iss': team_id,
            'iat': time.time()
        },
        secret,
        algorithm=ALGORITHM,
        headers={
            'alg': ALGORITHM,
            'kid': key_id,
        }
    )
    return token

async def send_live_activity_update(device_push_token: str, update: LiveActivityUpdate):
    """
    Sends the update to APNs.
    """
    token = get_apns_token()
    bundle_id = os.getenv("APPLE_BUNDLE_ID")

    if not token:
        print("Skipping APNs send: configuration missing.")
        return

    # Endpoint: Development (sandbox) or Production
    # Usually determined by environment. Default to sandbox for dev.
    apns_host = "https://api.sandbox.push.apple.com"
    if os.getenv("APNS_ENV") == "production":
        apns_host = "https://api.push.apple.com"

    url = f"{apns_host}/3/device/{device_push_token}"

    headers = {
        "authorization": f"bearer {token}",
        "apns-topic": f"{bundle_id}.push-type.liveactivity", # Topic usually implies push type
        "apns-push-type": "liveactivity",
        "apns-priority": "10",
        "content-type": "application/json"
    }

    # Payload for Live Activity
    # Must match the ContentState of the ActivityAttributes in Swift
    payload = {
        "aps": {
            "timestamp": int(time.time()),
            "event": "update",
            "content-state": {
                "headline": update.headline,
                "statusText": update.status_text,
                "progress": update.progress
            },
            "alert": {
                "title": update.alert_title or "Update",
                "body": update.status_text,
                "sound": "default"
            }
        }
    }

    try:
        async with httpx.AsyncClient(http2=True) as client:
            response = await client.post(url, headers=headers, json=payload)
            print(f"APNs Response: {response.status_code} {response.text}")
    except Exception as e:
        print(f"Error sending to APNs: {e}")
