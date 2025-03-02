// lib/firebase/users.ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config';
import { User } from '@/types';
import { convertDoc } from '../../utils';

// Get all users
export const getUsers = async (): Promise<User[]> => {
  const usersRef = collection(db, 'users');
  const querySnapshot = await getDocs(usersRef);
  const users: User[] = [];

  querySnapshot.forEach((doc) => {
    users.push(convertDoc<User>(doc));
  });

  return users;
};

// Get user by ID
export const getUserById = async (id: string): Promise<User | null> => {
  const docRef = doc(db, 'users', id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return convertDoc<User>(docSnap);
  }

  return null;
};

// Get user by phone number
export const getUserByPhone = async (phone: string): Promise<User | null> => {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('phone', '==', phone));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return null;
  }

  const userDoc = querySnapshot.docs[0];
  return convertDoc<User>(userDoc);
};

// Create new user
export const createUser = async (
  user: Omit<User, 'id' | 'createdAt'>
): Promise<string> => {
  // Check if phone is already registered
  const existingUser = await getUserByPhone(user.phone);

  if (existingUser) {
    throw new Error('A user with this phone number already exists');
  }

  // Create user document
  const userData = {
    ...user,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, 'users'), userData);
  return docRef.id;
};

// Update user
export const updateUser = async (
  id: string,
  data: Partial<User>
): Promise<void> => {
  const docRef = doc(db, 'users', id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

// Delete user
export const deleteUser = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'users', id));
};

// Get all employees (role = 'employee')
export const getEmployees = async (): Promise<User[]> => {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('role', '==', 'employee'));
  const querySnapshot = await getDocs(q);
  const employees: User[] = [];

  querySnapshot.forEach((doc) => {
    employees.push(convertDoc<User>(doc));
  });

  return employees;
};

// Get all admins (role = 'admin')
export const getAdmins = async (): Promise<User[]> => {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('role', '==', 'admin'));
  const querySnapshot = await getDocs(q);
  const admins: User[] = [];

  querySnapshot.forEach((doc) => {
    admins.push(convertDoc<User>(doc));
  });

  return admins;
};
