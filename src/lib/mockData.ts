export type Emotion = 'Happy' | 'Sad' | 'Angry' | 'Fear' | 'Neutral' | 'Disgust' | 'Surprise';

export type RobotStatus = 'SAFE' | 'CAUTION' | 'PAUSE';

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  diagnosis: string;
  affectedLimb: 'Left' | 'Right';
}

export interface SessionRecord {
  id: string;
  patient: Patient;
  date: string;
  duration: string;
  dominantEmotion: Emotion;
  avgGripForce: number;
  status: RobotStatus;
  emotionLog: { time: number; emotion: Emotion; confidence: number }[];
  vitals: { heartRate: number; bpSystolic: number; bpDiastolic: number; spo2: number; painLevel: number; stressIndex: number };
  robotLog: { gripForce: number; xAxis: number; yAxis: number; zAxis: number; speed: number }[];
}

export const EMOTIONS: Emotion[] = ['Happy', 'Sad', 'Angry', 'Fear', 'Neutral', 'Disgust', 'Surprise'];

export const EMOTION_COLORS: Record<Emotion, string> = {
  Happy: '#10b981',
  Sad: '#6366f1',
  Angry: '#ef4444',
  Fear: '#f59e0b',
  Neutral: '#6b7280',
  Disgust: '#8b5cf6',
  Surprise: '#3b82f6',
};

export function getEmotionRobotParams(emotion: Emotion, confidence: number) {
  const base = { gripForce: 15, xAxis: 0, yAxis: 0, zAxis: 0, speed: 50, status: 'SAFE' as RobotStatus };
  switch (emotion) {
    case 'Fear':
      return { gripForce: 8 + Math.random() * 3, xAxis: -5, yAxis: 2, zAxis: -3, speed: 25, status: 'CAUTION' as RobotStatus };
    case 'Angry':
    case 'Disgust':
      return { gripForce: 5, xAxis: 0, yAxis: 0, zAxis: 0, speed: 0, status: 'PAUSE' as RobotStatus };
    case 'Happy':
    case 'Neutral':
      return { gripForce: 14 + Math.random() * 4, xAxis: Math.random() * 10 - 5, yAxis: Math.random() * 8, zAxis: Math.random() * 6 - 3, speed: 45 + Math.random() * 15, status: 'SAFE' as RobotStatus };
    case 'Sad':
      return { gripForce: 12, xAxis: Math.random() * 6 - 3, yAxis: Math.random() * 5, zAxis: 0, speed: 35, status: 'CAUTION' as RobotStatus };
    case 'Surprise':
      return { gripForce: 10, xAxis: 0, yAxis: 3, zAxis: -2, speed: 30, status: 'SAFE' as RobotStatus };
    default:
      return base;
  }
}

export function getStressIndex(emotion: Emotion, painLevel: number): number {
  const emotionStress: Record<Emotion, number> = { Happy: 10, Neutral: 20, Surprise: 35, Sad: 50, Fear: 70, Disgust: 60, Angry: 80 };
  return Math.min(100, Math.round(emotionStress[emotion] * 0.6 + painLevel * 4));
}

const patients: Patient[] = [
  { id: '1', name: 'Sarah Johnson', age: 45, gender: 'Female', diagnosis: 'Post-stroke hemiparesis', affectedLimb: 'Right' },
  { id: '2', name: 'Michael Chen', age: 62, gender: 'Male', diagnosis: 'Rotator cuff repair', affectedLimb: 'Left' },
  { id: '3', name: 'Emily Davis', age: 34, gender: 'Female', diagnosis: 'Carpal tunnel syndrome', affectedLimb: 'Right' },
  { id: '4', name: 'Robert Wilson', age: 71, gender: 'Male', diagnosis: 'Total knee replacement', affectedLimb: 'Left' },
  { id: '5', name: 'Ana Martinez', age: 28, gender: 'Female', diagnosis: 'ACL reconstruction', affectedLimb: 'Right' },
];

function generateEmotionLog(): SessionRecord['emotionLog'] {
  const log = [];
  for (let t = 0; t < 30; t++) {
    const emotion = EMOTIONS[Math.floor(Math.random() * EMOTIONS.length)];
    log.push({ time: t, emotion, confidence: 60 + Math.random() * 35 });
  }
  return log;
}

export const mockSessions: SessionRecord[] = [
  ...patients.map((p, i) => ({
    id: `s${i + 1}`,
    patient: p,
    date: new Date(2026, 2, 25 - i).toISOString().split('T')[0],
    duration: `${20 + i * 5}:00`,
    dominantEmotion: (['Neutral', 'Happy', 'Sad', 'Fear', 'Neutral'] as Emotion[])[i],
    avgGripForce: 12 + Math.random() * 6,
    status: (['SAFE', 'SAFE', 'CAUTION', 'CAUTION', 'SAFE'] as RobotStatus[])[i],
    emotionLog: generateEmotionLog(),
    vitals: { heartRate: 68 + i * 3, bpSystolic: 118 + i * 2, bpDiastolic: 78 + i, spo2: 99 - i * 0.3, painLevel: 2 + i, stressIndex: 20 + i * 10 },
    robotLog: Array.from({ length: 30 }, () => ({ gripForce: 10 + Math.random() * 8, xAxis: Math.random() * 10 - 5, yAxis: Math.random() * 8, zAxis: Math.random() * 6 - 3, speed: 30 + Math.random() * 25 })),
  })),
];
