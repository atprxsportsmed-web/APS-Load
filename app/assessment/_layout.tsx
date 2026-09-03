import { Stack } from 'expo-router';

export default function AssessmentLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="safety" />
      <Stack.Screen name="symptom" />
      <Stack.Screen name="symptom-details" />
      <Stack.Screen name="movement" />
      <Stack.Screen name="load-test" />
      <Stack.Screen name="reassessment" />
      <Stack.Screen name="result" />
      <Stack.Screen name="modifications" />
      <Stack.Screen name="session-checkin" />
    </Stack>
  );
}
