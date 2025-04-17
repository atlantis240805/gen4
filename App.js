// App.js
import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import * as Notifications from 'expo-notifications';
import { registerRootComponent } from 'expo';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function App() {
  const WORK_TIME   = 25 * 60;
  const SHORT_BREAK= 5  * 60;
  const LONG_BREAK = 15 * 60;
  const CYCLES     = 4;

  const [sessionType, setSessionType] = useState('work');// 'work'|'short'|'long'
  const [timeLeft, setTimeLeft]         = useState(WORK_TIME);
  const [isActive, setIsActive]         = useState(false);
  const [cycleCount, setCycleCount]     = useState(0);
  const intervalRef = useRef(null);

  // Yêu cầu quyền thông báo khi app khởi động
  useEffect(() => {
    Notifications.requestPermissionsAsync();
  }, []);

  // Countdown logic
  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            _notifyAndSwitch();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isActive]);

  // Khi phiên kết thúc: gửi notification & chuyển session
  const _notifyAndSwitch = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🍅 Pomodoro Timer',
        body: sessionType === 'work'
          ? 'Hết 25 phút làm việc! Thư giãn 1 chút nhé.'
          : 'Hết giờ nghỉ! Bắt đầu lại thôi.',
      },
      trigger: null,
    });

    if (sessionType === 'work') {
      const next = cycleCount + 1;
      setCycleCount(next);
      if (next % CYCLES === 0) {
        setSessionType('long');
        setTimeLeft(LONG_BREAK);
      } else {
        setSessionType('short');
        setTimeLeft(SHORT_BREAK);
      }
    } else {
      setSessionType('work');
      setTimeLeft(WORK_TIME);
    }
    setIsActive(false);
  };

  const formatTime = sec => {
    const m = String(Math.floor(sec/60)).padStart(2,'0');
    const s = String(sec%60).padStart(2,'0');
    return `${m}:${s}`;
  };

  const resetAll = () => {
    clearInterval(intervalRef.current);
    setIsActive(false);
    setSessionType('work');
    setTimeLeft(WORK_TIME);
    setCycleCount(0);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🍅 Pomodoro</Text>
      <Text style={styles.session}>
        {sessionType === 'work'  ? 'Làm việc'  :
         sessionType === 'short' ? 'Nghỉ ngắn' : 'Nghỉ dài'}
      </Text>
      <Text style={styles.timer}>{formatTime(timeLeft)}</Text>

      <View style={styles.buttons}>
        <TouchableOpacity
          onPress={() => setIsActive(!isActive)}
          style={[styles.btn, { backgroundColor: isActive ? '#AAA' : '#008080' }]}
        >
          <Text style={styles.btnText}>{isActive ? 'Tạm dừng' : 'Bắt đầu'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={resetAll} style={styles.btn}>
          <Text style={styles.btnText}>Đặt lại</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.cycles}>Chu kỳ hoàn thành: {cycleCount}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#fff' },
  title:     { fontSize:28, fontWeight:'bold', marginBottom:20 },
  session:   { fontSize:18, marginBottom:8 },
  timer:     { fontSize:64, marginBottom:24, fontVariant:['tabular-nums'] },
  buttons:   { flexDirection:'row', marginBottom:16 },
  btn:       { padding:12, marginHorizontal:8, borderRadius:6, backgroundColor:'#008080' },
  btnText:   { color:'#fff', fontSize:16 },
  cycles:    { fontSize:14, color:'#555' },
});

export default registerRootComponent(App);
