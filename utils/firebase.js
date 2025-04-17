// utils/firebase.js

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  where,
  onSnapshot,
  serverTimestamp
} from "firebase/firestore";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithCredential,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

// ===== Firebase configuration =====
const firebaseConfig = {
  apiKey: "AIzaSyCqmMr8poM4a8Xo1lxG72R-8OqaEtNdyNU",
  authDomain: "pomodoropro-452ec.firebaseapp.com",
  projectId: "pomodoropro-452ec",
  storageBucket: "pomodoropro-452ec.appspot.com",
  messagingSenderId: "953574279883",
  appId: "1:953574279883:android:7b550c954b0f25be33294e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ===== Configure Google Sign-In =====
GoogleSignin.configure({
  webClientId: "953574279883-gn7lqc4urkc3uaftt7jfg5hthe0b2jgp.apps.googleusercontent.com",
  offlineAccess: true
});

// ===== Authentication helpers =====
/**
 * Sign in with Google OAuth
 * @returns {Promise<import('firebase/auth').UserCredential>} 
 */
export async function signInWithGoogle() {
  const { idToken } = await GoogleSignin.signIn();
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);
  return result.user;
}

/**
 * Sign up using email and password
 */
export async function signUpWithEmail(email, password) {
  const userCred = await createUserWithEmailAndPassword(auth, email, password);
  return userCred.user;
}

/**
 * Sign in using email and password
 */
export async function signInWithEmail(email, password) {
  const userCred = await signInWithEmailAndPassword(auth, email, password);
  return userCred.user;
}

/**
 * Sign out current user
 */
export async function logOut() {
  await signOut(auth);
}

/**
 * Get current user UID, fallback to 'demoUser'
 */
export function getCurrentUserId() {
  return auth.currentUser?.uid || "demoUser";
}

// ===== Firestore task & session functions =====

/**
 * Add a new task
 */
export async function addTask(task) {
  const userId = getCurrentUserId();
  const tasksRef = collection(db, 'users', userId, 'tasks');
  const docRef = await addDoc(tasksRef, {
    title: task.title,
    completed: false,
    createdAt: serverTimestamp()
  });
  return { id: docRef.id };
}

/**
 * Update an existing task
 */
export async function updateTask(taskId, updates) {
  const userId = getCurrentUserId();
  const taskDoc = doc(db, 'users', userId, 'tasks', taskId);
  await updateDoc(taskDoc, updates);
}

/**
 * Delete a task
 */
export async function deleteTask(taskId) {
  const userId = getCurrentUserId();
  const taskDoc = doc(db, 'users', userId, 'tasks', taskId);
  await deleteDoc(taskDoc);
}

/**
 * Subscribe to real-time task updates
 */
export function subscribeTasks(callback) {
  const userId = getCurrentUserId();
  const tasksQuery = query(
    collection(db, 'users', userId, 'tasks'),
    orderBy('createdAt')
  );
  return onSnapshot(tasksQuery, (snapshot) => {
    const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(tasks);
  });
}

/**
 * Log a completed Pomodoro session
 */
export async function logPomodoroSession() {
  const userId = getCurrentUserId();
  await addDoc(collection(db, 'users', userId, 'sessions'), {
    type: 'work',
    duration: 25 * 60,
    timestamp: serverTimestamp()
  });
}

/**
 * Get statistics data (sessions and tasks)
 */
export async function getStatsData() {
  const userId = getCurrentUserId();
  const stats = {};

  // Sessions in last 7 days
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 6);
  const sessionQuery = query(
    collection(db, 'users', userId, 'sessions'),
    where('timestamp', '>=', weekAgo)
  );
  const sessionSnap = await getDocs(sessionQuery);
  const sessions = sessionSnap.docs.map(d => d.data());

  stats.totalPomodoros = sessions.length;
  stats.totalFocusMinutes = sessions.length * 25;

  // Pomodoros by weekday
  const countsByDay = {};
  sessions.forEach(s => {
    const day = s.timestamp.toDate().toLocaleDateString('vi-VN', { weekday: 'short' });
    countsByDay[day] = (countsByDay[day] || 0) + 1;
  });
  const weekDays = ['T2','T3','T4','T5','T6','T7','CN'];
  stats.pomodorosByDay = weekDays.map(d => ({ day: d, count: countsByDay[d] || 0 }));

  // Task details for stats
  const tasksSnap = await getDocs(collection(db, 'users', userId, 'tasks'));
  const tasks = tasksSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  // Top tasks by totalMinutes
  const sorted = tasks
    .filter(t => t.totalMinutes > 0)
    .sort((a,b) => b.totalMinutes - a.totalMinutes)
    .slice(0,3);
  stats.topTasks = sorted.map(t => ({ id: t.id, title: t.title, minutes: t.totalMinutes }));

  // Hourly distribution
  const allSessionsSnap = await getDocs(collection(db, 'users', userId, 'sessions'));
  const hourCount = Array(24).fill(0);
  allSessionsSnap.docs.forEach(d => {
    const s = d.data();
    if (s.type === 'work') {
      const h = s.timestamp.toDate().getHours();
      hourCount[h]++;
    }
  });
  stats.hourlyDistribution = hourCount.map((count,hour) => ({ hour, count }));

  // Task completion rate
  const completedCount = tasks.filter(t => t.completed).length;
  stats.taskCompletionRate = { completed: completedCount, total: tasks.length };

  return stats;
}
