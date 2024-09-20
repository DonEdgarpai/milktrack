import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

if (!getApps().length) {
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    throw error;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    console.log('Creating custom token for userId:', userId);
    const customToken = await getAuth().createCustomToken(userId);
    console.log('Custom token created successfully');
    res.status(200).json({ token: customToken });
  } catch (error) {
    console.error('Error creating custom token:', error);
    if (error instanceof Error) {
      res.status(500).json({ error: `Unable to create token: ${error.message}` });
    } else {
      res.status(500).json({ error: 'An unknown error occurred while creating the token' });
    }
  }
}