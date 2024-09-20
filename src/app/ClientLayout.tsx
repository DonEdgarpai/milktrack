'use client'

import { useUser } from '@clerk/nextjs'
import { useEffect } from 'react'
import { db } from '../firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { initializeFirestore } from '../initFirestore'

function FirebaseUserProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, user } = useUser();

  useEffect(() => {
    const createUserDocument = async () => {
      if (isSignedIn && user) {
        try {
          const userRef = doc(db, 'users', user.id);
          const userDoc = await getDoc(userRef);
          
          if (!userDoc.exists()) {
            // El usuario no existe, inicializar Firestore
            await initializeFirestore(user.id);
          } else {
            // El usuario ya existe, actualizar última conexión
            await setDoc(userRef, { 
              email: user.primaryEmailAddress?.emailAddress,
              lastSignIn: new Date().toISOString()
            }, { merge: true });
          }
        } catch (error) {
          console.error("Error al crear/actualizar documento de usuario:", error);
        }
      }
    };

    createUserDocument();
  }, [isSignedIn, user]);

  return <>{children}</>;
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseUserProvider>
      {children}
    </FirebaseUserProvider>
  )
}