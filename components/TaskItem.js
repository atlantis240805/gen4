// components/TaskItem.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Checkbox } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';

export default function TaskItem({ task, onToggleComplete, onDelete }) {
  return (
    <View style={styles.container}>
      {/* Checkbox hoàn thành */}
      <Checkbox 
        status={task.completed ? 'checked' : 'unchecked'}
        onPress={() => onToggleComplete(!task.completed)}
        color="#008080"  // màu icon khi checked
      />
      {/* Tiêu đề task */}
      <Text style={[styles.title, task.completed && styles.completedTitle]}>
        {task.title}
      </Text>
      {/* Nút xóa task */}
      <TouchableOpacity onPress={onDelete} style={styles.deleteButton} hitSlop={16}>
        <Feather name="trash-2" size={20} color="#888" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  title: { flex: 1, fontSize: 16, color: '#333' },
  completedTitle: { textDecorationLine: 'line-through', color: '#999' },
  deleteButton: { padding: 4, marginLeft: 8 }
});
