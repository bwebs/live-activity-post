import React, { useEffect, useState } from 'react';
import { auth, db } from './firebase_config';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      if (u) {
        setUser(u);
        // Fetch token from Firestore
        try {
          const docRef = doc(db, "users", u.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setToken(docSnap.data().webhookToken);
          }
        } catch (e) {
          console.error("Error fetching data", e);
        }
        setLoading(false);
      } else {
        navigate('/');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  if (loading) return <div>Loading...</div>;

  const webhookUrl = token ? `${window.location.protocol}//${window.location.hostname}:8000/webhook/${token}` : "Not generated yet";

  return (
    <div style={{ padding: '20px' }}>
      <h1>Dashboard</h1>
      <p>Logged in as: {user.email}</p>

      {!token ? (
        <div style={{ border: '1px solid #ccc', padding: '20px', margin: '20px 0' }}>
          <h2>1. Download the iOS App</h2>
          <p>Please download our iOS app and log in to generate your webhook token.</p>
          <a href="#" style={{ background: '#007AFF', color: 'white', padding: '10px 20px', textDecoration: 'none', borderRadius: '5px' }}>
            Download on App Store
          </a>
        </div>
      ) : (
        <div style={{ border: '1px solid #4caf50', padding: '20px', margin: '20px 0' }}>
          <h2>2. Your Webhook URL</h2>
          <p>Send a POST request to this URL to trigger a Live Activity.</p>
          <code style={{ background: '#eee', padding: '5px', display: 'block' }}>
            {webhookUrl}
          </code>
          <br />
          <h3>Example cURL:</h3>
          <pre style={{ background: '#eee', padding: '10px' }}>
{`curl -X POST ${webhookUrl} \\
  -H "Content-Type: application/json" \\
  -d '{"event": "Goal!", "value": 0.8}'`}
          </pre>
        </div>
      )}

      <button onClick={() => auth.signOut()}>Sign Out</button>
    </div>
  );
};

export default Dashboard;
