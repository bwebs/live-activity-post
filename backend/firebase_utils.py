import os
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv

load_dotenv()

# Global Firestore client
db = None

def init_firebase():
    global db
    cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH")

    if not cred_path or not os.path.exists(cred_path):
        print("Warning: Firebase credentials not found. Firestore will not work.")
        return

    try:
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        print("Firebase initialized successfully.")
    except Exception as e:
        print(f"Error initializing Firebase: {e}")

def get_user_by_webhook_token(token: str):
    """
    Looks up the user ID associated with a webhook token.
    Assuming structure: tokens/{token} -> { userId: "..." }
    """
    if db is None:
        # For testing purposes if DB is not init
        if os.getenv("TEST_MODE") == "true":
             # Mock data
            if token == "mock_token":
                return {"userId": "mock_user_id", "pushToken": "mock_push_token"}
        return None

    try:
        doc_ref = db.collection("tokens").document(token)
        doc = doc_ref.get()
        if doc.exists:
            data = doc.to_dict()
            user_id = data.get("userId")
            if user_id:
                # Fetch user details (push token)
                user_doc = db.collection("users").document(user_id).get()
                if user_doc.exists:
                    user_data = user_doc.to_dict()
                    return {**user_data, "userId": user_id}
        return None
    except Exception as e:
        print(f"Error fetching token: {e}")
        return None

def save_user_tokens(user_id: str, webhook_token: str, push_token: str):
    if db is None:
        return False

    try:
        # Save user mapping
        db.collection("users").document(user_id).set({
            "webhookToken": webhook_token,
            "pushToken": push_token
        }, merge=True)

        # Save token mapping
        db.collection("tokens").document(webhook_token).set({
            "userId": user_id
        })
        return True
    except Exception as e:
        print(f"Error saving tokens: {e}")
        return False
