/* src/components/FaceDetector.js */
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useStore } from '../store/useStore';

// Load face-api.js from CDN dynamically (works in web builds)
const loadFaceApi = () => {
  return new Promise((resolve, reject) => {
    if (window.faceapi) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js';
    script.onload = () => resolve();
    script.onerror = (e) => reject(e);
    document.body.appendChild(script);
  });
};

export const FaceDetector = () => {
  const videoRef = useRef(null);
  const { setCurrentEmotion } = useStore();
  const [loading, setLoading] = useState(true);
  const [emotion, setEmotion] = useState('neutral');

  useEffect(() => {
    let intervalId;
    const start = async () => {
      try {
        await loadFaceApi();
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceExpressionNet.loadFromUri('/models'),
        ]);
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) videoRef.current.srcObject = stream;
        setLoading(false);
        intervalId = setInterval(async () => {
          if (!videoRef.current) return;
          const detections = await faceapi
            .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
            .withFaceExpressions();
          if (detections && detections.expressions) {
            const expr = Object.entries(detections.expressions).reduce((prev, cur) =>
              cur[1] > prev[1] ? cur : prev
            );
            const dominant = expr[0];
            setEmotion(dominant);
            setCurrentEmotion(dominant);
          }
        }, 300);
      } catch (err) {
        console.warn('Face detection error', err);
        setLoading(false);
      }
    };
    start();
    return () => {
      if (intervalId) clearInterval(intervalId);
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      {loading && <ActivityIndicator size="large" color="#a78bfa" />}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={styles.video}
      />
      <View style={styles.overlay}>
        <Text style={styles.emotionText}>{emotion.toUpperCase()}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { position: 'relative', width: '100%', height: 300, backgroundColor: '#000' },
  video: { width: '100%', height: '100%', objectFit: 'cover' },
  overlay: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 6,
    borderRadius: 4,
  },
  emotionText: { color: '#fff', fontFamily: 'Inter', fontWeight: '600' },
});
