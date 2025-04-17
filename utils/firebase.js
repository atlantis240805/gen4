// utils/firebase.js
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

// Khởi tạo Firebase nếu chưa có
const firebaseConfig = {
  // ...điền config của bạn ở đây...
};
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// Giả sử bạn có hàm này để lấy userId (sau khi đã sign-in)
function getCurrentUserId() {
  // return firebase.auth().currentUser.uid;
  return 'demoUser'; // tạm dùng nếu bạn chưa setup Auth
}

// Thêm task mới
export async function addTask(task) {
  const userId = getCurrentUserId();
  const docRef = await db
    .collection('users').doc(userId)
    .collection('tasks')
    .add({
      title: task.title,
      completed: false,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
  const doc = await docRef.get();
  return { id: doc.id, ...doc.data() };
}

// Cập nhật task (chẳng hạn toggle complete)
export async function updateTask(taskId, updates) {
  const userId = getCurrentUserId();
  await db
    .collection('users').doc(userId)
    .collection('tasks').doc(taskId)
    .update(updates);
}

// Xóa task
export async function deleteTask(taskId) {
  const userId = getCurrentUserId();
  await db
    .collection('users').doc(userId)
    .collection('tasks').doc(taskId)
    .delete();
}

// Đăng ký listener real-time cho tasks
export function subscribeTasks(callback) {
  const userId = getCurrentUserId();
  return db
    .collection('users').doc(userId)
    .collection('tasks')
    .orderBy('createdAt')
    .onSnapshot(snapshot => {
      const tasks = [];
      snapshot.forEach(doc => tasks.push({ id: doc.id, ...doc.data() }));
      callback(tasks);
    });
}

// Ghi log phiên Pomodoro hoàn thành
export async function logPomodoroSession() {
  const userId = getCurrentUserId();
  await db
    .collection('users').doc(userId)
    .collection('sessions')
    .add({
      type: 'work',
      duration: 25 * 60,  // 25 phút
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    });
}

// Lấy dữ liệu thống kê từ Firestore
export async function getStatsData() {
  const userId = getCurrentUserId();
  const stats = {};

  // Lấy sessions trong 7 ngày qua
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 6);
  const sessionsSnap = await db
    .collection('users').doc(userId)
    .collection('sessions')
    .where('timestamp', '>=', weekAgo)
    .get();

  const sessions = sessionsSnap.docs.map(d => d.data());
  stats.totalPomodoros = sessions.length;
  stats.totalFocusMinutes = sessions.length * 25;

  // Pomodoro by day
  const countsByDay = {};
  sessions.forEach(s => {
    const day = s.timestamp.toDate().toLocaleDateString('vi-VN', { weekday: 'short' });
    countsByDay[day] = (countsByDay[day] || 0) + 1;
  });
  const weekDays = ['T2','T3','T4','T5','T6','T7','CN'];
  stats.pomodorosByDay = weekDays.map(d => ({ day: d, count: countsByDay[d] || 0 }));

  // Lấy tasks để tính topTasks và completionRate
  const tasksSnap = await db
    .collection('users').doc(userId)
    .collection('tasks')
    .get();
  const tasks = tasksSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  // Top tasks by totalMinutes (giả sử bạn lưu totalMinutes mỗi task)
  const sorted = tasks
    .filter(t => t.totalMinutes > 0)
    .sort((a, b) => b.totalMinutes - a.totalMinutes)
    .slice(0, 3);
  stats.topTasks = sorted.map(t => ({ id: t.id, title: t.title, minutes: t.totalMinutes }));

  // Hourly distribution (toàn bộ sessions)
  const allSessionsSnap = await db
    .collection('users').doc(userId)
    .collection('sessions')
    .get();
  const hourCount = Array(24).fill(0);
  allSessionsSnap.docs.forEach(d => {
    const s = d.data();
    if (s.type === 'work') {
      const h = s.timestamp.toDate().getHours();
      hourCount[h]++;
    }
  });
  stats.hourlyDistribution = hourCount.map((count, hour) => ({ hour, count }));

  // Task completion rate
  const completedCount = tasks.filter(t => t.completed).length;
  stats.taskCompletionRate = { completed: completedCount, total: tasks.length };

  return stats;
}
