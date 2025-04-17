// app/(tabs)/settings.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TextInput, TouchableOpacity, Alert
} from 'react-native';
import Slider from '@react-native-community/slider';
import Collapsible from 'react-native-collapsible';
import AsyncStorage from '@react-native-async-storage/async-storage';

type PomodoroSettings = {
  workTime: number;
  shortBreak: number;
  longBreak: number;
  cycles: number;
};

const STORAGE_KEY = '@pomodoro_settings';
const PRESETS = [15, 25, 30, 45];

export default function SettingsPage() {
  const [settings, setSettings] = useState<PomodoroSettings>({
    workTime: 25,
    shortBreak: 5,
    longBreak: 15,
    cycles: 4,
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Load settings khi component mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(data => {
      if (data) setSettings(JSON.parse(data));
    });
  }, []);

  // Lưu settings vào AsyncStorage
  const saveSettings = async (newSettings: PomodoroSettings) => {
    setSettings(newSettings);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    Alert.alert('Lưu thành công!');
  };

  // Cập nhật 1 field rồi lưu
  const updateAndSave = (field: keyof PomodoroSettings, value: number) => {
    const updated = { ...settings, [field]: value };
    saveSettings(updated);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Work Time */}
      <View style={styles.section}>
        <Text style={styles.label}>Thời gian làm việc (phút)</Text>
        <Text style={styles.value}>{settings.workTime}</Text>
        <Slider
          style={styles.slider}
          minimumValue={5}
          maximumValue={60}
          step={1}
          value={settings.workTime}
          onValueChange={val => setSettings(s => ({ ...s, workTime: val }))}
          onSlidingComplete={val => updateAndSave('workTime', val)}
          minimumTrackTintColor="#008080"
          maximumTrackTintColor="#CCC"
        />
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={String(settings.workTime)}
          onChangeText={txt => {
            const num = parseInt(txt.replace(/[^0-9]/g, ''), 10) || 0;
            setSettings(s => ({ ...s, workTime: num }));
          }}
          onEndEditing={e => updateAndSave('workTime', Number(e.nativeEvent.text))}
        />

        {/* Preset Buttons */}
        <View style={styles.presets}>
          {PRESETS.map(p => (
            <TouchableOpacity
              key={p}
              style={styles.presetBtn}
              onPress={() => updateAndSave('workTime', p)}
            >
              <Text style={styles.presetText}>{p}’</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Advanced Settings */}
      <TouchableOpacity
        onPress={() => setShowAdvanced(v => !v)}
        style={styles.advancedToggle}
      >
        <Text style={styles.advancedToggleText}>
          {showAdvanced ? 'Ẩn thiết lập nâng cao' : 'Hiển thị thiết lập nâng cao'}
        </Text>
      </TouchableOpacity>
      <Collapsible collapsed={!showAdvanced}>
        <View style={styles.section}>
          <Text style={styles.label}>Thời gian nghỉ ngắn (phút)</Text>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={30}
            step={1}
            value={settings.shortBreak}
            onSlidingComplete={val => updateAndSave('shortBreak', val)}
            minimumTrackTintColor="#008080"
            maximumTrackTintColor="#CCC"
          />
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={String(settings.shortBreak)}
            onEndEditing={e => updateAndSave('shortBreak', Number(e.nativeEvent.text))}
          />

          <Text style={styles.label}>Thời gian nghỉ dài (phút)</Text>
          <Slider
            style={styles.slider}
            minimumValue={5}
            maximumValue={60}
            step={1}
            value={settings.longBreak}
            onSlidingComplete={val => updateAndSave('longBreak', val)}
            minimumTrackTintColor="#008080"
            maximumTrackTintColor="#CCC"
          />
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={String(settings.longBreak)}
            onEndEditing={e => updateAndSave('longBreak', Number(e.nativeEvent.text))}
          />

          <Text style={styles.label}>Số chu kỳ trước khi nghỉ dài</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={String(settings.cycles)}
            onEndEditing={e => updateAndSave('cycles', Number(e.nativeEvent.text))}
          />
        </View>
      </Collapsible>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  section: {
    marginBottom: 24,
    padding: 12,
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
  },
  label: { fontSize: 16, marginBottom: 4, fontWeight: '600' },
  value: { fontSize: 24, fontWeight: 'bold', color: '#008080', marginBottom: 8 },
  slider: { width: '100%', height: 40 },
  input: {
    borderWidth: 1, borderColor: '#CCC', borderRadius: 6,
    padding: 8, marginTop: 8, marginBottom: 12, textAlign: 'center'
  },
  presets: { flexDirection: 'row', justifyContent: 'space-around' },
  presetBtn: {
    paddingVertical: 6, paddingHorizontal: 12,
    borderRadius: 16, backgroundColor: '#E0F2F1'
  },
  presetText: { color: '#00796B', fontWeight: '500' },
  advancedToggle: { marginBottom: 12, alignItems: 'center' },
  advancedToggleText: { color: '#008080', fontWeight: '600' },
});
