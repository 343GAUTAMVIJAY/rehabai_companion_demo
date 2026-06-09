# 🏥 Rehab AI – Emotion-Aware Rehabilitation Robot System

## 📌 Overview

**Rehab AI** is a hospital-grade intelligent rehabilitation platform that combines **facial emotion recognition**, **patient vital signs monitoring**, and **robot-assisted therapy** to deliver safer, adaptive, and personalized rehabilitation sessions.

Unlike traditional rehabilitation robots that operate on predefined programs, Rehab AI continuously analyzes the patient's emotional state and physiological condition, allowing the robot to dynamically adjust therapy parameters such as grip force, movement speed, and range of motion in real time.

---

## 🎯 Problem Statement

Conventional rehabilitation systems often lack awareness of a patient's emotional discomfort or physical stress during therapy sessions. This may result in:

* Excessive force application
* Patient discomfort
* Increased injury risk
* Delayed therapist intervention

Rehab AI addresses these challenges by introducing an intelligent feedback loop that monitors emotions and vital signs to improve patient safety and therapy effectiveness.

---

## 💡 Core Concept

### Emotion + Vitals Feedback Loop

1. 📷 Camera captures the patient's face.
2. 🧠 Machine Learning model detects facial emotions.
3. ⌚ Wearable devices provide real-time vital signs.
4. ⚙️ Safety engine evaluates patient condition.
5. 🤖 Rehabilitation robot automatically adjusts therapy parameters.
6. 👨‍⚕️ Therapist monitors everything through a live dashboard.

---

## 🛡️ Safety Protocol

| Detected Emotion       | Robot Status | Action                          |
| ---------------------- | ------------ | ------------------------------- |
| Happy / Neutral        | 🟢 SAFE      | Continue normal therapy         |
| Fear / Pain / Surprise | 🟡 CAUTION   | Reduce force and speed          |
| Angry / Disgust / Sad  | 🔴 PAUSE     | Stop robot and notify therapist |

### Additional Safety Rule

* If **PAUSE** is triggered **3 or more times** during a session:

  * Display a warning banner.
  * Alert therapist for immediate review.
  * Recommend therapy reassessment.

---

# 🚀 Features

## 🔐 Authentication

* Email & Password Login
* User Registration
* Google OAuth
* Forgot Password & Reset Flow
* Secure Session Management
* Auto-confirmed User Accounts

### Demo Credentials

```text
Email: admin@rehabai.com
Password: admin123
```

---

## 📊 Dashboard

Real-time rehabilitation analytics:

* Total Therapy Sessions
* Active Patients
* Dominant Emotions
* Safety Status Statistics
* Recent Session Activity

---

## ➕ New Session

Patient onboarding and session creation:

* Patient Name
* Age
* Gender
* Diagnosis
* Affected Limb
* Clinical Notes

Creates patient and therapy session records instantly.

---

## 🎥 Live Session

The central module of Rehab AI.

### Real-Time Facial Emotion Detection

* Webcam feed
* Face bounding box detection
* Emotion label prediction
* Confidence percentage

### Vital Signs Monitoring

* Heart Rate
* Blood Pressure
* SpO₂
* Pain Scale (1–10)

Supports:

* Automatic Simulation
* Manual Therapist Override

### Robot Control Panel

Adjustable robot parameters:

* Grip Force
* Speed
* X-Axis Motion
* Y-Axis Motion
* Z-Axis Motion
* Robot Status

### 3D Robot Visualization

* Three.js powered robotic arm
* Real-time movement rendering
* Dynamic response to safety state

### Session Monitoring

* Live timer
* SAFE / CAUTION / PAUSE badge
* Automatic activity logging

---

## 📜 Session History

* View past rehabilitation sessions
* Search and filter records
* Access patient-specific history

---

## 📑 Session Report

Detailed session analytics including:

* Session Duration
* Dominant Emotion
* Average Grip Force
* Robot Safety Status
* Emotion Timeline
* Vital Signs Review

---

## 📈 Reports & Analytics

Generate and export:

* PDF Reports
* Excel Reports
* CSV Data

Includes:

* Patient Trends
* Therapy Performance
* Safety Metrics
* Emotion Analytics

---

## 👤 Therapist Profile

* Therapist Information
* Account Settings
* Profile Management

---

## 🛡️ Admin Panel

Administrative controls:

* View Registered Users
* Manage User Roles
* Delete User Accounts
* System Monitoring

### Secure User Deletion

Uses privileged Edge Functions to:

* Remove users
* Delete associated patients
* Delete sessions
* Remove roles and profiles

---

# 🧠 Machine Learning Pipeline

## Facial Emotion Recognition

### Model Architecture

```text
Input Face Frames
        ↓
      VGG16
(Facial Feature Extraction)
        ↓
      LSTM
(Temporal Emotion Analysis)
        ↓
Emotion Classification
        ↓
Safety Decision Engine
```

### Supported Emotions

* Happy
* Neutral
* Fear
* Pain
* Surprise
* Angry
* Disgust
* Sad

---

# 🤖 Robot Adaptation Logic

Based on detected emotions and vital signs:

### SAFE State

* Normal Grip Force
* Normal Speed
* Full Motion Range

### CAUTION State

* Reduced Grip Force
* Reduced Speed
* Limited Motion Range

### PAUSE State

* Robot Halt
* Therapist Alert
* Session Review Trigger

---

# 🏗️ System Architecture

```text
Patient
   │
   ▼
Webcam + Wearables
   │
   ▼
Emotion Detection Model
(VGG16 + LSTM)
   │
   ▼
Safety Evaluation Engine
   │
   ▼
Robot Control Layer
   │
   ▼
Rehabilitation Robot
   │
   ▼
Therapist Dashboard
```

---

# ⚙️ Technology Stack

## Frontend

* React 18
* Vite
* TypeScript
* Tailwind CSS
* shadcn/ui

## 3D Visualization

* Three.js

## Backend

* Supabase
* PostgreSQL
* Edge Functions
* Authentication
* Realtime Services

## Machine Learning

* VGG16
* LSTM

## Security

* Row Level Security (RLS)
* Role-Based Access Control (RBAC)
* Secure Edge Functions

---

# 🔒 Security Architecture

### Row Level Security (RLS)

Patient and session data are scoped to their owners.

### Role-Based Access

Roles are stored in:

```text
user_roles
```

instead of profile records to prevent privilege escalation.

### Security Function

```sql
has_role(auth.uid(), 'admin')
```

Provides secure administrative access.

---

# 📂 Database Modules

## Core Tables

* users
* user_roles
* patients
* sessions
* emotions
* robot_logs
* vital_signs
* reports

---

# 🎨 UI Design System

### Colors

| Purpose   | Color   |
| --------- | ------- |
| Primary   | #0D1B3E |
| Secondary | #00A896 |
| Accent    | #F0A500 |

### Typography

* Inter
* Roboto

### Themes

* Light Mode
* Dark Mode

---

# 🎯 Use Case Scenario

A physiotherapist conducts a stroke rehabilitation session using Rehab AI.

1. The robotic arm guides the patient's affected limb.
2. Facial analysis detects signs of pain or fear.
3. The system automatically reduces robot grip force.
4. A CAUTION state is activated.
5. If distress continues and PAUSE occurs three times:

   * The robot halts.
   * The therapist receives an alert.
   * Immediate intervention is recommended.

This adaptive behavior minimizes injury risk and improves rehabilitation outcomes.

---

# 🔮 Future Enhancements

* Real Emotion Detection API Integration
* IoT Medical Device Connectivity
* AI-Based Therapy Recommendations
* Voice-Based Patient Feedback
* Predictive Recovery Analytics
* Multi-Robot Support
* Mobile Companion Application

---

# 👩‍⚕️ Benefits

✅ Improved Patient Safety

✅ Real-Time Therapist Awareness

✅ Personalized Rehabilitation

✅ Reduced Risk of Injury

✅ Better Therapy Outcomes

✅ Emotion-Aware Adaptive Robotics

---

# 📄 License

This project is developed for academic, research, and healthcare innovation purposes.

---

