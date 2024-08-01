

import { useRef, useState, useEffect, useCallback } from 'react';
import * as handpose from '@tensorflow-models/handpose';
import '@tensorflow/tfjs';
import { message } from 'antd';

const useHandDetection = ({
  color,
  brushSize,
  eraserMode,
  isDebugMode,
  canvasStates,
  currentStateIndex,
  setCanvasStates,
  setCurrentStateIndex
}) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const debugCanvasRef = useRef(null);
  const [model, setModel] = useState(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastX, setLastX] = useState(0);
  const [lastY, setLastY] = useState(0);
  const [smoothX, setSmoothX] = useState(0);
  const [smoothY, setSmoothY] = useState(0);
  const [calibrationZ, setCalibrationZ] = useState(0);

  const loadModel = useCallback(async () => {
    try {
      const loadedModel = await handpose.load();
      setModel(loadedModel);
      setIsModelLoaded(true);
      message.success('Handpose model loaded successfully');
    } catch (error) {
      message.error('Failed to load Handpose model');
      console.error('Error loading model:', error);
    }
  }, []);

  const setupCamera = useCallback(async () => {
    if (!videoRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      message.success('Camera initialized successfully');
    } catch (error) {
      message.error('Failed to access the camera');
      console.error('Error accessing camera:', error);
    }
  }, []);

  const detectHand = useCallback(async () => {
    if (!model || !videoRef.current || !canvasRef.current || !debugCanvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const debugCanvas = debugCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const debugCtx = debugCanvas.getContext('2d');

    debugCtx.clearRect(0, 0, debugCanvas.width, debugCanvas.height);
    if (isDebugMode) {
      debugCtx.drawImage(video, 0, 0, debugCanvas.width, debugCanvas.height);
    }

    try {
      const predictions = await model.estimateHands(video);
      if (predictions.length > 0) {
        const landmarks = predictions[0].landmarks;

        if (isDebugMode) {
          landmarks.forEach(point => {
            debugCtx.beginPath();
            debugCtx.arc(debugCanvas.width - point[0], point[1], 5, 0, 2 * Math.PI);
            debugCtx.fillStyle = 'red';
            debugCtx.fill();
          });
        }

        const indexTip = landmarks[8];
        const indexBase = landmarks[5];
        const middleTip = landmarks[12];
        const middleBase = landmarks[9];

        if ((indexTip[1] < indexBase[1] && middleTip[1] < middleBase[1]) || 
            (indexTip[1] < indexBase[1] && Math.abs(middleTip[1] - middleBase[1]) < 20)) {
          const x = debugCanvas.width - indexTip[0];
          const y = indexTip[1];
          const z = indexTip[2];

          setSmoothX(prevX => prevX * 0.7 + x * 0.3);
          setSmoothY(prevY => prevY * 0.7 + y * 0.3);

          const scale = Math.max(0.1, (calibrationZ - z) / calibrationZ);

          drawOnCanvas(ctx, smoothX, smoothY, scale);
          
          if (isDebugMode) {
            debugCtx.beginPath();
            debugCtx.arc(debugCanvas.width - indexTip[0], indexTip[1], 10, 0, 2 * Math.PI);
            debugCtx.fillStyle = 'green';
            debugCtx.fill();
          }
        } else {
          setIsDrawing(false);
        }
      }
    } catch (error) {
      console.error('Error detecting hand:', error);
    }

    requestAnimationFrame(detectHand);
  }, [model, calibrationZ, smoothX, smoothY, isDebugMode]);

  const drawOnCanvas = useCallback((ctx, x, y, scale) => {
    if (!isDrawing) {
      setIsDrawing(true);
      setLastX(x);
      setLastY(y);
      return;
    }

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.strokeStyle = eraserMode ? '#FFFFFF' : color;
    ctx.globalCompositeOperation = eraserMode ? 'destination-out' : 'source-over';
    ctx.lineWidth = brushSize * scale;
    ctx.lineCap = 'round';
    ctx.stroke();

    setLastX(x);
    setLastY(y);
  }, [isDrawing, lastX, lastY, color, eraserMode, brushSize]);

  const calibrate = useCallback(async () => {
    if (!model || !videoRef.current) return;

    try {
      const video = videoRef.current;
      const predictions = await model.estimateHands(video);
      if (predictions.length > 0) {
        const indexTip = predictions[0].landmarks[8];
        setCalibrationZ(indexTip[2]);
        message.success(`Calibrated at depth: ${indexTip[2].toFixed(2)}`);
      } else {
        message.warning('No hand detected for calibration');
      }
    } catch (error) {
      message.error('Calibration failed');
      console.error('Error during calibration:', error);
    }
  }, [model]);

  useEffect(() => {
    loadModel();
    setupCamera();
  }, [loadModel, setupCamera]);

  useEffect(() => {
    if (isModelLoaded) {
      detectHand();
    }
  }, [isModelLoaded, detectHand]);

  return {
    videoRef,
    canvasRef,
    debugCanvasRef,
    isModelLoaded,
    calibrate,
    drawOnCanvas
  };
};

export default useHandDetection