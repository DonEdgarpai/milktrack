import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { getAuth, signInWithCustomToken, User as FirebaseUser } from 'firebase/auth';

interface FirebaseAuthState {
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  error: string | null;
}

export function useFirebaseAuth(): FirebaseAuthState {
  const { isSignedIn, user } = useUser();
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const authenticateFirebase = async () => {
      if (isSignedIn && user) {
        try {
          const response = await fetch('/api/getFirebaseToken', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id }),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const { token } = await response.json();
          const auth = getAuth();
          const userCredential = await signInWithCustomToken(auth, token);
          setFirebaseUser(userCredential.user);
          setError(null);
        } catch (err) {
          console.error('Error authenticating with Firebase:', err);
          setError(err instanceof Error ? err.message : 'Unknown error');
          setFirebaseUser(null);
        }
      } else {
        setFirebaseUser(null);
        setError(null);
      }
      setLoading(false);
    };

    authenticateFirebase();
  }, [isSignedIn, user]);

  return { firebaseUser, loading, error };
}