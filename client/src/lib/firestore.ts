import { doc, getDoc, setDoc, type DocumentData } from "firebase/firestore";
import { firebaseDb } from "@/lib/firebase";

export const firestoreCollections = {
  users: "users",
  preferences: "preferences",
  watchlist: "watchlist",
} as const;

function requireDb() {
  if (!firebaseDb) throw new Error("Firebase Firestore is not configured yet.");
  return firebaseDb;
}

export async function getUserProfile<T extends DocumentData = DocumentData>(uid: string) {
  const snapshot = await getDoc(doc(requireDb(), firestoreCollections.users, uid));
  return snapshot.exists() ? (snapshot.data() as T) : null;
}

export async function setUserProfile(uid: string, data: DocumentData) {
  await setDoc(doc(requireDb(), firestoreCollections.users, uid), data, { merge: true });
}

export async function getUserPreferences<T extends DocumentData = DocumentData>(uid: string) {
  const snapshot = await getDoc(doc(requireDb(), firestoreCollections.users, uid, firestoreCollections.preferences, "default"));
  return snapshot.exists() ? (snapshot.data() as T) : null;
}

export async function setUserPreferences(uid: string, data: DocumentData) {
  await setDoc(doc(requireDb(), firestoreCollections.users, uid, firestoreCollections.preferences, "default"), data, { merge: true });
}
