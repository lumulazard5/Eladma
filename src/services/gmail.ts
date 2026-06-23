import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase';

const provider = new GoogleAuthProvider();
// Add required Gmail scopes
provider.addScope('https://mail.google.com/');
provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
provider.addScope('https://www.googleapis.com/auth/gmail.send');
provider.addScope('https://www.googleapis.com/auth/gmail.labels');

// In-memory access token cache
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Initialize auth state and handle state change
export const initGmailAuth = (
  onSuccess: (user: User, token: string) => void,
  onFailure: () => void
) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      if (cachedAccessToken) {
        onSuccess(user, cachedAccessToken);
      } else {
        onFailure();
      }
    } else {
      cachedAccessToken = null;
      onFailure();
    }
  });
};

// Sign in with Google with requested scopes
export const signInWithGmail = async (): Promise<{ user: User; token: string } | null> => {
  if (isSigningIn) return null;
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;
    
    if (!token) {
      throw new Error('Failed to retrieve Gmail access token.');
    }
    
    cachedAccessToken = token;
    return { user: result.user, token };
  } catch (err) {
    console.error('Gmail Sign In Error:', err);
    throw err;
  } finally {
    isSigningIn = false;
  }
};

// Logout from Gmail Auth
export const logoutGmail = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

// Get active token
export const getGmailAccessToken = (): string | null => {
  return cachedAccessToken;
};

export interface GmailMessageHeader {
  id: string;
  threadId: string;
  snippet: string;
  subject: string;
  from: string;
  date: string;
  labelIds: string[];
}

export interface GmailMessageDetails extends GmailMessageHeader {
  body: string;
  to: string;
}

// Fetch list of user's Gmail messages
export const fetchGmailMessages = async (searchQuery: string = ''): Promise<GmailMessageHeader[]> => {
  const token = cachedAccessToken;
  if (!token) throw new Error('Not authenticated with Google (Gmail).');

  const queryParam = searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : '';
  const res = await fetch(`/api/gmail/messages${queryParam}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch messages.');
  }
  
  const data = await res.json();
  return data.messages || [];
};

// Fetch a single Gmail message details
export const fetchGmailMessageDetails = async (messageId: string): Promise<GmailMessageDetails> => {
  const token = cachedAccessToken;
  if (!token) throw new Error('Not authenticated with Google (Gmail).');

  const res = await fetch(`/api/gmail/messages/${messageId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch email details.');
  }
  
  return await res.json();
};

// Send a Gmail message
export const sendGmailMessage = async (to: string, subject: string, body: string): Promise<any> => {
  const token = cachedAccessToken;
  if (!token) throw new Error('Not authenticated with Google (Gmail).');

  const res = await fetch('/api/gmail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ to, subject, body })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to send email.');
  }

  return await res.json();
};
