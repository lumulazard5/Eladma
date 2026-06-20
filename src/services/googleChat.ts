import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase';

const provider = new GoogleAuthProvider();
// Add required Google Chat scopes
provider.addScope('https://www.googleapis.com/auth/chat.spaces');
provider.addScope('https://www.googleapis.com/auth/chat.messages');
provider.addScope('https://www.googleapis.com/auth/chat.memberships');

// In-memory access token cache
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Initialize auth state and handle state change
export const initGoogleChatAuth = (
  onSuccess: (user: User, token: string) => void,
  onFailure: () => void
) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      // If we already have the token cached in memory, use it
      if (cachedAccessToken) {
        onSuccess(user, cachedAccessToken);
      } else {
        // Token was cleared (or refreshed/not retrieved yet).
        // Standard flow requests user to sign-in again to retrieve fresh access token.
        onFailure();
      }
    } else {
      cachedAccessToken = null;
      onFailure();
    }
  });
};

// Sign in with Google with requested scopes
export const signInWithGoogleChat = async (): Promise<{ user: User; token: string } | null> => {
  if (isSigningIn) return null;
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;
    
    if (!token) {
      throw new Error('Failed to retrieve Google Chat access token.');
    }
    
    cachedAccessToken = token;
    return { user: result.user, token };
  } catch (err) {
    console.error('Google Chat Sign In Error:', err);
    throw err;
  } finally {
    isSigningIn = false;
  }
};

// Logout from Google Chat Auth
export const logoutGoogleChat = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

// Get active token
export const getGoogleAccessToken = (): string | null => {
  return cachedAccessToken;
};

// --- API CLIENT CALLS TO SERVER ROUTE PROXIES ---

export interface ChatSpace {
  name: string; // e.g. "spaces/XXXX"
  displayName: string;
  spaceType: string; // e.g. "SPACE"
}

export interface ChatMessage {
  name: string;
  text: string;
  createTime: string;
  sender: {
    name: string;
    displayName: string;
    avatarUrl?: string;
    email?: string;
  };
}

// Fetch list of user's Google Chat spaces
export const fetchSpaces = async (): Promise<ChatSpace[]> => {
  const token = cachedAccessToken;
  if (!token) throw new Error('Not authenticated with Google Chat.');

  const res = await fetch('/api/chat/spaces', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch Google Chat spaces.');
  }
  
  const data = await res.json();
  return data.spaces || [];
};

// Create a new customized Google Chat room/space
export const createChatSpace = async (displayName: string): Promise<ChatSpace> => {
  const token = cachedAccessToken;
  if (!token) throw new Error('Not authenticated with Google Chat.');

  const res = await fetch('/api/chat/spaces', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      spaceType: 'SPACE',
      displayName
    })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to create Google Chat space.');
  }

  return await res.json();
};

// Fetch messages of a space
export const fetchMessages = async (spaceName: string): Promise<ChatMessage[]> => {
  const token = cachedAccessToken;
  if (!token) throw new Error('Not authenticated with Google Chat.');

  // Extract ID part from format "spaces/XXXX"
  const spaceId = spaceName.replace('spaces/', '');

  const res = await fetch(`/api/chat/spaces/${spaceId}/messages`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to load space messages.');
  }

  const data = await res.json();
  return data.messages || [];
};

// Send a chat message to a space
export const sendChatMessage = async (spaceName: string, text: string): Promise<ChatMessage> => {
  const token = cachedAccessToken;
  if (!token) throw new Error('Not authenticated with Google Chat.');

  const spaceId = spaceName.replace('spaces/', '');

  const res = await fetch(`/api/chat/spaces/${spaceId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to post message to Google Chat.');
  }

  return await res.json();
};
