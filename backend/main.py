import os
from fastapi import FastAPI, HTTPException, Request, BackgroundTasks, Header
from pydantic import BaseModel
from typing import Dict, Any, Optional

from firebase_utils import init_firebase, get_user_by_webhook_token, save_user_tokens
from ai_agent import process_payload_with_ai
from apns_utils import send_live_activity_update

app = FastAPI()

APP_VERSION = os.getenv("APP_VERSION", "unknown")

async def process_and_push(user: Dict[str, Any], payload: Any):
    print(f"Processing payload for user {user.get('userId')}")

    # 1. AI processing
    update_model = await process_payload_with_ai(payload)
    print(f"Generated update: {update_model}")

    # 2. Push to APNs
    push_token = user.get("pushToken")
    if push_token:
        await send_live_activity_update(push_token, update_model)
    else:
        print("No push token found for user.")

@app.on_event("startup")
async def startup_event():
    print(f"Starting Backend Version: {APP_VERSION}")
    init_firebase()

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Backend is running", "version": APP_VERSION}

class RegisterRequest(BaseModel):
    userId: str
    pushToken: str
    webhookToken: str

@app.post("/register")
def register_user(req: RegisterRequest, x_app_version: Optional[str] = Header(None)):
    """
    Endpoint for mobile app to register tokens.
    """
    print(f"Register request from App Version: {x_app_version}")

    success = save_user_tokens(req.userId, req.webhookToken, req.pushToken)
    if not success and os.getenv("TEST_MODE") != "true":
        raise HTTPException(status_code=500, detail="Failed to save tokens")
    return {"status": "registered"}

@app.post("/webhook/{token}")
async def webhook_handler(token: str, request: Request, background_tasks: BackgroundTasks, x_app_version: Optional[str] = Header(None)):
    """
    Public webhook url.
    """
    if x_app_version:
        print(f"Webhook request with App Version: {x_app_version}")

    # 1. Get raw payload
    try:
        payload = await request.json()
    except:
        payload = await request.body()
        if isinstance(payload, bytes):
            payload = payload.decode("utf-8")

    print(f"Received webhook for token: {token}, payload: {payload}")

    # 2. Lookup user
    user = get_user_by_webhook_token(token)
    if not user:
        raise HTTPException(status_code=404, detail="Token not found")

    print(f"Found user: {user.get('userId')}")

    # 3. Process and Push
    background_tasks.add_task(process_and_push, user, payload)

    return {"status": "received", "user_id": user.get("userId")}
