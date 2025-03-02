// lib/firebase/auth.ts
import {
  PhoneAuthProvider,
  signInWithCredential,
  signOut,
  RecaptchaVerifier,
} from 'firebase/auth';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
  setDoc,
} from 'firebase/firestore';
import { auth, db } from '../config';
import { User } from '@/types';

// Initialize phone authentication
export const initPhoneAuth = (phoneNumber: string): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      // First check if phone number is registered as a user
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('phone', '==', phoneNumber));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        reject(new Error('This phone number is not registered in the system.'));
        return;
      }

      // Create a recaptcha verifier
      const recaptchaVerifier = new RecaptchaVerifier(
        auth,
        'recaptcha-container',
        {
          size: 'invisible',
        }
      );

      // Send verification code
      const phoneProvider = new PhoneAuthProvider(auth);
      const verificationId = await phoneProvider.verifyPhoneNumber(
        phoneNumber,
        recaptchaVerifier
      );

      resolve(verificationId);
    } catch (err) {
      reject(err);
    }
  });
};

// Verify OTP and sign in
export const verifyOtpAndSignIn = async (
  verificationId: string,
  otp: string
): Promise<User> => {
  // Create credential
  const credential = PhoneAuthProvider.credential(verificationId, otp);

  // Sign in with credential
  const userCredential = await signInWithCredential(auth, credential);
  const firebaseUser = userCredential.user;

  // Get user data from our users collection
  const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

  if (!userDoc.exists()) {
    throw new Error('User not found in database.');
  }

  // Update last login timestamp
  await updateDoc(doc(db, 'users', firebaseUser.uid), {
    lastLogin: serverTimestamp(),
  });

  const userData = userDoc.data();
  const user: User = {
    id: userDoc.id,
    name: userData.name,
    phone: userData.phone,
    role: userData.role,
    createdAt: userData.createdAt,
  };

  return user;
};

// Sign out
export const signOutUser = async (): Promise<void> => {
  await signOut(auth);
};

// Create a new user
export const createUserDocument = async (
  userId: string,
  userData: Omit<User, 'id' | 'createdAt'>
): Promise<void> => {
  await setDoc(doc(db, 'users', userId), {
    ...userData,
    createdAt: serverTimestamp(),
  });
};
