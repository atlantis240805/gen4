// screens/TimerScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { Checkbox } from 'react-native-paper'; // sử dụng Checkbox của Paper cho đồng bộ giao diện MD
import { AntDesign, Feather } from '@expo/vector-icons'; // Expo icons: AntDesign for arrows, Feather for trash icon (hoặc Ionicons)

import TaskItem from '../components/TaskItem';
import { addTask, updateTask, deleteTask, logPomodoroSession } from '../utils/firebase'; // giả sử các hàm firebase utils

export default function TimerScreen() {
  // Pomodoro states
  const WORK_TIME = 25 * 60;  // 25 phút làm việc (giây)
  const [timeLeft, setTimeLeft] = useState(WORK_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionType, setSessionType] = useState('work'); // 'work' | 'short' | 'long'
  const [cycleCount, setCycleCount] = useState(0);
  const intervalRef = useRef(null);

  // Tasks state
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Effect: Timer countdown logic
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            handleSessionEnd();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      // pause or stop
      clearInterval(intervalRef.current);
    }
    // Cleanup
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  // Xử lý khi hết thời gian một phiên Pomodoro
  const handleSessionEnd = () => {
    // Gửi thông báo và chuyển trạng thái phiên
    if (sessionType === 'work') {
      // Log phiên làm việc hoàn thành vào Firestore
      logPomodoroSession();  // (hàm này sẽ thêm bản ghi phiên làm việc mới, kèm user, timestamp, etc.)
      const newCount = cycleCount + 1;
      setCycleCount(newCount);
      if (newCount % 4 === 0) {
        // Sau 4 phiên làm việc -> nghỉ dài
        setSessionType('long');
        setTimeLeft(15 * 60);  // 15 phút nghỉ dài
      } else {
        // Nghỉ ngắn
        setSessionType('short');
        setTimeLeft(5 * 60);   // 5 phút nghỉ ngắn
      }
    } else {
      // Nếu đang ở phiên nghỉ, sau khi hết giờ nghỉ -> quay lại phiên làm việc mới
      setSessionType('work');
      setTimeLeft(WORK_TIME);
    }
    setIsRunning(false);
    // (Thông báo đẩy đã được gửi trong logic nội bộ của logPomodoroSession hoặc tại đây nếu cần)
  };

  // Định dạng hiển thị mm:ss
  const formatTime = secs => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Nút reset: đặt lại mọi thứ về ban đầu (Work session 25:00)
  const handleReset = () => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
    setSessionType('work');
    setTimeLeft(WORK_TIME);
    setCycleCount(0);
  };

  // Xử lý thêm task mới
  const handleAddTask = async () => {
    if (newTaskTitle.trim().length === 0) return;
    const title = newTaskTitle.trim();
    setNewTaskTitle('');
    // Thêm task vào Firestore, hàm addTask sẽ trả về task mới
    const newTask = await addTask({ title });
    // Cập nhật state (có thể Firestore onSnapshot lo việc này, nhưng ta cập nhật tức thì cho cảm giác mượt)
    setTasks(prev => [...prev, newTask]);
  };

  // Lắng nghe danh sách tasks từ Firebase (đồng bộ real-time)
  useEffect(() => {
    const unsubscribe = /* Firebase listener giả định */
      // ví dụ dùng Firestore: 
      // firebase.firestore().collection('tasks').where('userId','==',currentUserId).onSnapshot(...)
      // Ở đây để đơn giản, ta giả định có hàm tiện ích subscribeTasks để lắng nghe
      subscribeTasks(newTasks => {
        setTasks(newTasks);
      });
    return unsubscribe;
  }, []);

  // Nút tăng/giảm thời gian mỗi lần bấm mũi tên
  const adjustTime = (deltaMinutes) => {
    // Chỉ cho điều chỉnh khi đang không chạy
    if (isRunning) return;
    setTimeLeft(prev => {
      let newTime = prev + deltaMinutes * 60;
      if (newTime < 60) newTime = 60;            // tối thiểu 1 phút
      if (newTime > 60 * 60) newTime = 60 * 60;  // tối đa 60 phút (giả định giới hạn)
      return newTime;
    });
  };

  // Giữ nút để tăng/giảm liên tục
  let holdInterval = useRef(null);
  const handlePressInArrow = (delta) => {
    // Gọi ngay một lần
    adjustTime(delta);
    // Sau 300ms, bắt đầu lặp mỗi 100ms
    holdInterval.current = setInterval(() => adjustTime(delta), 100);
  };
  const handlePressOutArrow = () => {
    clearInterval(holdInterval.current);
  };

  return (
    <View style={[styles.container, { backgroundColor: '#fff' }]}>
      {/* Header đơn giản với tên app (có thể bỏ nếu đã có ở tab navigator) */}
      <Text style={styles.header}>Genflow</Text>

      {/* Hiển thị loại phiên: Làm việc / Nghỉ ngắn / Nghỉ dài */}
      <Text style={styles.sessionLabel}>
        {sessionType === 'work' ? 'Làm việc' : (sessionType === 'short' ? 'Nghỉ ngắn' : 'Nghỉ dài')}
      </Text>

      {/* Đồng hồ Pomodoro */}
      <View style={styles.timerContainer}>
        {/* Nút giảm thời gian */}
        <TouchableOpacity 
          onPress={() => adjustTime(-1)} 
          onPressIn={() => handlePressInArrow(-1)}
          onPressOut={handlePressOutArrow}
          style={styles.arrowButton}
          hitSlop={20}  // mở rộng vùng chạm lên ít nhất 40px
        >
          <AntDesign name="minuscircleo" size={32} color="#555" />
        </TouchableOpacity>

        <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>

        {/* Nút tăng thời gian */}
        <TouchableOpacity 
          onPress={() => adjustTime(1)} 
          onPressIn={() => handlePressInArrow(1)}
          onPressOut={handlePressOutArrow}
          style={styles.arrowButton}
          hitSlop={20}
        >
          <AntDesign name="pluscircleo" size={32} color="#555" />
        </TouchableOpacity>
      </View>

      {/* Thanh tiến trình (dùng View làm progress bar) */}
      <View style={styles.progressBarBackground}>
        <View 
          style={[styles.progressBarFill, { width: `${(1 - timeLeft/(sessionType==='work'?WORK_TIME:sessionType==='short'?5*60:15*60)) * 100}%` }]} 
        />
      </View>

      {/* Danh sách Task */}
      <FlatList 
        data={tasks}
        keyExtractor={item => item.id}
        style={styles.taskList}
        renderItem={({ item }) => (
          <TaskItem 
            task={item} 
            onToggleComplete={(completed) => updateTask(item.id, { completed })}
            onDelete={() => deleteTask(item.id)}
          />
        )}
        ListEmptyComponent={<Text style={styles.noTaskText}>Chưa có công việc nào.</Text>}
      />

      {/* Input thêm task mới */}
      <View style={styles.addTaskContainer}>
        <TextInput 
          style={styles.taskInput}
          placeholder="Thêm nhiệm vụ mới..."
          value={newTaskTitle}
          onChangeText={setNewTaskTitle}
          onSubmitEditing={handleAddTask}
          returnKeyType="done"
        />
        <TouchableOpacity onPress={handleAddTask} style={styles.addTaskButton}>
          <Feather name="plus-circle" size={28} color="#008080" />
        </TouchableOpacity>
      </View>

      {/* Nút điều khiển Start/Pause và Reset */}
      <View style={styles.controls}>
        <TouchableOpacity 
          onPress={() => setIsRunning(!isRunning)} 
          style={[styles.controlButton, isRunning && { backgroundColor: '#aaa' }]}
        >
          <Text style={styles.controlButtonText}>
            {isRunning ? 'Tạm dừng' : 'Bắt đầu'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleReset} style={styles.controlButton}>
          <Text style={styles.controlButtonText}>Đặt lại</Text>
        </TouchableOpacity>
      </View>

      {/* Thông tin chu kỳ Pomodoro */}
      <Text style={styles.cycleInfo}>
        Chu kỳ hoàn thành: {cycleCount}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 24 },
  header: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  sessionLabel: { fontSize: 18, textAlign: 'center', marginBottom: 4, color: '#666' },
  timerContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 8 },
  timerText: { fontSize: 64, fontWeight: 'bold', marginHorizontal: 16, fontVariant: ['tabular-nums'] },
  arrowButton: { padding: 8 },
  progressBarBackground: { height: 4, backgroundColor: '#eee', width: '80%', alignSelf: 'center', borderRadius: 2, marginVertical: 8 },
  progressBarFill: { height: 4, backgroundColor: '#008080', borderRadius: 2 },
  taskList: { flex: 1, marginTop: 8 },
  noTaskText: { fontStyle: 'italic', color: '#999', textAlign: 'center', marginTop: 16 },
  addTaskContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  taskInput: { flex: 1, borderColor: '#ccc', borderWidth: 1, borderRadius: 4, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8 },
  addTaskButton: { padding: 4 },
  controls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 12 },
  controlButton: { backgroundColor: '#008080', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 6, marginHorizontal: 8 },
  controlButtonText: { color: '#fff', fontSize: 16, fontWeight: '500' },
  cycleInfo: { textAlign: 'center', color: '#555', marginTop: 8, fontSize: 14 }
});
