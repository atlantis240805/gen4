// screens/StatsScreen.js
import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
// Giả sử dùng một thư viện biểu đồ, ví dụ react-native-chart-kit hoặc Victory
import { VictoryBar, VictoryChart, VictoryTheme, VictoryPie } from 'victory-native';
// Hoặc ChartKit: import { BarChart, PieChart } from 'react-native-chart-kit';

import { getStatsData } from '../utils/firebase';  // giả sử hàm lấy dữ liệu thống kê đã tổng hợp

export default function StatsScreen() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    // Lấy dữ liệu thống kê từ Firebase (hoặc tính toán client từ tasks & sessions)
    getStatsData().then(data => setStats(data));
  }, []);

  if (!stats) {
    return <Text style={{ textAlign: 'center', marginTop: 20 }}>Đang tải thống kê...</Text>;
  }

  const { pomodorosByDay, totalPomodoros, totalFocusMinutes, topTasks, hourlyDistribution, taskCompletionRate } = stats;

  return (
    <ScrollView style={styles.container}>
      {/* Tổng số Pomodoro theo ngày (7 ngày gần đây) */}
      <Text style={styles.sectionTitle}>Pomodoro mỗi ngày (tuần qua)</Text>
      <VictoryChart theme={VictoryTheme.material} domainPadding={10}>
        <VictoryBar data={pomodorosByDay} x="day" y="count" style={{ data: { fill: "#69b4ff" } }} />
      </VictoryChart>
      {/* Ghi chú: VictoryBar ở trên là ví dụ, hiển thị cột count theo day (viết tắt ngày trong tuần) */}

      {/* Tổng thời gian tập trung */}
      <Text style={styles.sectionTitle}>Tổng thời gian tập trung</Text>
      <Text style={styles.metricText}>
        {Math.floor(totalFocusMinutes/60)} giờ {totalFocusMinutes % 60} phút 
        ({totalPomodoros} phiên)
      </Text>

      {/* Task tốn thời gian nhất */}
      <Text style={styles.sectionTitle}>Task tốn thời gian nhất</Text>
      {topTasks.length > 0 ? (
        <View style={styles.topTasksList}>
          {topTasks.map((task, index) => (
            <Text key={task.id} style={styles.topTaskItem}>
              {index+1}. {task.title} – {Math.floor(task.minutes/60)}h{task.minutes % 60}' 
            </Text>
          ))}
        </View>
      ) : (
        <Text style={styles.metricText}>Chưa có dữ liệu.</Text>
      )}

      {/* Biểu đồ hiệu suất theo giờ */}
      <Text style={styles.sectionTitle}>Pomodoro theo giờ (trung bình)</Text>
      <VictoryChart theme={VictoryTheme.material} domainPadding={5}>
        <VictoryBar data={hourlyDistribution} x="hour" y="count" style={{ data: { fill: "#ffc658" } }} />
      </VictoryChart>
      {/* Giả sử hourlyDistribution là mảng 0-23 giờ với count trung bình pomodoro mỗi giờ */}

      {/* Tỷ lệ hoàn thành task */}
      <Text style={styles.sectionTitle}>Tỷ lệ hoàn thành Task</Text>
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <VictoryPie 
          data={[
            { x: "Hoàn thành", y: taskCompletionRate.completed }, 
            { x: "Chưa xong", y: taskCompletionRate.total - taskCompletionRate.completed }
          ]}
          colorScale={[ "#00C851", "#ff4444" ]}
          width={200} height={200}
          labels={({ datum }) => `${datum.x}\n${Math.round(datum.y / taskCompletionRate.total * 100)}%`}
          style={{ labels: { fontSize: 14, fill: "#333" } }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9', padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginVertical: 8 },
  metricText: { fontSize: 16, marginBottom: 12 },
  topTasksList: { marginBottom: 16 },
  topTaskItem: { fontSize: 15, marginVertical: 2 }
});
