// import { useRef, useEffect, useState, useCallback } from 'react';
// import * as handpose from '@tensorflow-models/handpose';
// import '@tensorflow/tfjs';
// import { Button, Slider, Switch, Row, Col, Typography, Space, message, Tooltip, ConfigProvider } from 'antd';
// import { ClearOutlined, UndoOutlined, RedoOutlined, CameraOutlined, DownloadOutlined } from '@ant-design/icons';

// const { Title } = Typography;

// const AirCanvas = () => {
//   const videoRef = useRef(null);
//   const canvasRef = useRef(null);
//   const debugCanvasRef = useRef(null);
//   const [model, setModel] = useState(null);
//   const [isDrawing, setIsDrawing] = useState(false);
//   const [lastX, setLastX] = useState(0);
//   const [lastY, setLastY] = useState(0);
//   const [smoothX, setSmoothX] = useState(0);
//   const [smoothY, setSmoothY] = useState(0);
//   const [calibrationZ, setCalibrationZ] = useState(0);
//   const [brushSize, setBrushSize] = useState(5);
//   const [eraserMode, setEraserMode] = useState(false);
//   const [canvasStates, setCanvasStates] = useState([]);
//   const [currentStateIndex, setCurrentStateIndex] = useState(-1);
//   const [color, setColor] = useState('#000000');
//   const [isModelLoaded, setIsModelLoaded] = useState(false);
//   const [isDebugMode, setIsDebugMode] = useState(false);

//   const loadModel = useCallback(async () => {
//     try {
//       const loadedModel = await handpose.load();
//       setModel(loadedModel);
//       setIsModelLoaded(true);
//       message.success('Handpose model loaded successfully');
//     } catch (error) {
//       message.error('Failed to load Handpose model');
//       console.error('Error loading model:', error);
//     }
//   }, []);

//   const setupCamera = useCallback(async () => {
//     if (!videoRef.current) return;

//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ video: true });
//       videoRef.current.srcObject = stream;
//       message.success('Camera initialized successfully');
//     } catch (error) {
//       message.error('Failed to access the camera');
//       console.error('Error accessing camera:', error);
//     }
//   }, []);

//   const detectHand = useCallback(async () => {
//     if (!model || !videoRef.current || !canvasRef.current || !debugCanvasRef.current) return;

//     const video = videoRef.current;
//     const canvas = canvasRef.current;
//     const debugCanvas = debugCanvasRef.current;
//     const ctx = canvas.getContext('2d');
//     const debugCtx = debugCanvas.getContext('2d');

//     debugCtx.clearRect(0, 0, debugCanvas.width, debugCanvas.height);
//     if (isDebugMode) {
//       debugCtx.drawImage(video, 0, 0, debugCanvas.width, debugCanvas.height);
//     }

//     try {
//       const predictions = await model.estimateHands(video);
//       if (predictions.length > 0) {
//         const landmarks = predictions[0].landmarks;

//         if (isDebugMode) {
//           landmarks.forEach(point => {
//             debugCtx.beginPath();
//             debugCtx.arc(debugCanvas.width - point[0], point[1], 5, 0, 2 * Math.PI);
//             debugCtx.fillStyle = 'red';
//             debugCtx.fill();
//           });
//         }

//         const indexTip = landmarks[8];
//         const indexBase = landmarks[5];
//         const middleTip = landmarks[12];
//         const middleBase = landmarks[9];

//         if ((indexTip[1] < indexBase[1] && middleTip[1] < middleBase[1]) || 
//             (indexTip[1] < indexBase[1] && Math.abs(middleTip[1] - middleBase[1]) < 20)) {
//           const x = debugCanvas.width - indexTip[0];
//           const y = indexTip[1];
//           const z = indexTip[2];

//           setSmoothX(prevX => prevX * 0.7 + x * 0.3);
//           setSmoothY(prevY => prevY * 0.7 + y * 0.3);

//           const scale = Math.max(0.1, (calibrationZ - z) / calibrationZ);

//           drawOnCanvas(ctx, smoothX, smoothY, scale);
          
//           if (isDebugMode) {
//             debugCtx.beginPath();
//             debugCtx.arc(debugCanvas.width - indexTip[0], indexTip[1], 10, 0, 2 * Math.PI);
//             debugCtx.fillStyle = 'green';
//             debugCtx.fill();
//           }
//         } else {
//           setIsDrawing(false);
//         }
//       }
//     } catch (error) {
//       console.error('Error detecting hand:', error);
//     }

//     requestAnimationFrame(detectHand);
//   }, [model, calibrationZ, smoothX, smoothY, isDebugMode]);

//   const drawOnCanvas = useCallback((ctx, x, y, scale) => {
//     if (!isDrawing) {
//       setIsDrawing(true);
//       setLastX(x);
//       setLastY(y);
//       return;
//     }

//     ctx.beginPath();
//     ctx.moveTo(lastX, lastY);
//     ctx.lineTo(x, y);
//     ctx.strokeStyle = eraserMode ? '#FFFFFF' : color;
//     ctx.globalCompositeOperation = eraserMode ? 'destination-out' : 'source-over';
//     ctx.lineWidth = brushSize * scale;
//     ctx.lineCap = 'round';
//     ctx.stroke();

//     setLastX(x);
//     setLastY(y);
//   }, [isDrawing, lastX, lastY, color, eraserMode, brushSize]);

//   const clearCanvas = useCallback(() => {
//     const canvas = canvasRef.current;
//     const ctx = canvas.getContext('2d');
//     ctx.clearRect(0, 0, canvas.width, canvas.height);
//     saveCanvasState();
//   }, []);

//   const calibrate = useCallback(async () => {
//     if (!model || !videoRef.current) return;

//     try {
//       const video = videoRef.current;
//       const predictions = await model.estimateHands(video);
//       if (predictions.length > 0) {
//         const indexTip = predictions[0].landmarks[8];
//         setCalibrationZ(indexTip[2]);
//         message.success(`Calibrated at depth: ${indexTip[2].toFixed(2)}`);
//       } else {
//         message.warning('No hand detected for calibration');
//       }
//     } catch (error) {
//       message.error('Calibration failed');
//       console.error('Error during calibration:', error);
//     }
//   }, [model]);

//   const saveCanvasState = useCallback(() => {
//     const canvas = canvasRef.current;
//     setCanvasStates(prevStates => [...prevStates.slice(0, currentStateIndex + 1), canvas.toDataURL()]);
//     setCurrentStateIndex(prevIndex => prevIndex + 1);
//   }, [currentStateIndex]);

//   const undo = useCallback(() => {
//     if (currentStateIndex <= 0) return;

//     setCurrentStateIndex(prevIndex => prevIndex - 1);
//     const canvasState = canvasStates[currentStateIndex - 1];
//     const img = new Image();
//     img.onload = () => {
//       const canvas = canvasRef.current;
//       const ctx = canvas.getContext('2d');
//       ctx.clearRect(0, 0, canvas.width, canvas.height);
//       ctx.drawImage(img, 0, 0);
//     };
//     img.src = canvasState;
//   }, [currentStateIndex, canvasStates]);

//   const redo = useCallback(() => {
//     if (currentStateIndex >= canvasStates.length - 1) return;

//     setCurrentStateIndex(prevIndex => prevIndex + 1);
//     const canvasState = canvasStates[currentStateIndex + 1];
//     const img = new Image();
//     img.onload = () => {
//       const canvas = canvasRef.current;
//       const ctx = canvas.getContext('2d');
//       ctx.clearRect(0, 0, canvas.width, canvas.height);
//       ctx.drawImage(img, 0, 0);
//     };
//     img.src = canvasState;
//   }, [currentStateIndex, canvasStates]);

//   const takeSnapshot = useCallback(() => {
//     const canvas = canvasRef.current;
//     const dataURL = canvas.toDataURL('image/png');
//     const link = document.createElement('a');
//     link.href = dataURL;
//     link.download = 'air-canvas-snapshot.png';
//     link.click();
//   }, []);

//   useEffect(() => {
//     loadModel();
//     setupCamera();
//   }, [loadModel, setupCamera]);

//   useEffect(() => {
//     if (isModelLoaded) {
//       detectHand();
//     }
//   }, [isModelLoaded, detectHand]);

//   return (
//     <ConfigProvider
//       theme={{
//         token: {
//           colorPrimary: '#1890ff',
//         },
//       }}
//     >
//     <div style={{ padding: '20px' }}>
//       <Title level={2} style={{ textAlign: 'center' }}>Air Canvas</Title>
//       <Row gutter={16}>
//         <Col span={12}>
//           <video ref={videoRef} width="640" height="480" autoPlay style={{ transform: 'scaleX(-1)', display: isDebugMode ? 'none' : 'block' }} />
//           <canvas ref={debugCanvasRef} width="640" height="480" style={{ border: '1px solid #000', display: isDebugMode ? 'block' : 'none' }} />
//         </Col>
//         <Col span={12}>
//           <canvas ref={canvasRef} width="640" height="480" style={{ border: '1px solid #000' }} />
//           <Space direction="vertical" style={{ marginTop: 16, width: '100%' }}>
//             <Space>
//               <Tooltip title="Choose color">
//                 <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{ width: 50, height: 32 }} />
//               </Tooltip>
//               <Tooltip title="Brush size">
//                 <Slider min={1} max={50} value={brushSize} onChange={setBrushSize} style={{ width: 200 }} />
//               </Tooltip>
//               <Tooltip title="Eraser mode">
//                 <Switch checked={eraserMode} onChange={setEraserMode} />
//               </Tooltip>
//               <Tooltip title="Debug mode">
//                 <Switch checked={isDebugMode} onChange={setIsDebugMode} />
//               </Tooltip>
//             </Space>
//             <Space>
//               <Tooltip title="Clear canvas">
//                 <Button onClick={clearCanvas} icon={<ClearOutlined />}>Clear</Button>
//               </Tooltip>
//               <Tooltip title="Calibrate hand position">
//                 <Button onClick={calibrate}>Calibrate</Button>
//               </Tooltip>
//               <Tooltip title="Undo">
//                 <Button onClick={undo} icon={<UndoOutlined />} disabled={currentStateIndex <= 0}>Undo</Button>
//               </Tooltip>
//               <Tooltip title="Redo">
//                 <Button onClick={redo} icon={<RedoOutlined />} disabled={currentStateIndex >= canvasStates.length - 1}>Redo</Button>
//               </Tooltip>
//               <Tooltip title="Take snapshot">
//                 <Button onClick={takeSnapshot} icon={<CameraOutlined />}>Snapshot</Button>
//               </Tooltip>
//               <Tooltip title="Save drawing">
//                 <Button onClick={saveCanvasState} icon={<DownloadOutlined />}>Save</Button>
//               </Tooltip>
//             </Space>
//           </Space>
//         </Col>
//       </Row>
//     </div>
//     </ConfigProvider>
//   );
// };

// export default AirCanvas;


import { useState, useCallback, useEffect, useRef } from 'react';
import { ConfigProvider, Typography, Row, Col, Space, message, Spin } from 'antd';
import CanvasArea from './CanvasArea';
import ControlPanel from './ControlPanel';
import useHandDetection from '../hooks/useHandDetection';

const { Title } = Typography;

const AirCanvas = () => {
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [eraserMode, setEraserMode] = useState(false);
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [canvasStates, setCanvasStates] = useState([]);
  const [currentStateIndex, setCurrentStateIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(true);

  const containerRef = useRef(null);

  const {
    videoRef,
    canvasRef,
    debugCanvasRef,
    isModelLoaded,
    calibrate,
    drawOnCanvas,
    error
  } = useHandDetection({
    color,
    brushSize,
    eraserMode,
    isDebugMode,
    canvasStates,
    currentStateIndex,
    setCanvasStates,
    setCurrentStateIndex
  });

  useEffect(() => {
    if (isModelLoaded) {
      setIsLoading(false);
      message.success('Air Canvas is ready to use!');
    }
  }, [isModelLoaded]);

  useEffect(() => {
    if (error) {
      setIsLoading(false);
      message.error('Failed to initialize Air Canvas. Please refresh and try again.');
    }
  }, [error]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      saveCanvasState();
      message.info('Canvas cleared');
    }
  }, [canvasRef]);

  const undo = useCallback(() => {
    if (currentStateIndex <= 0) return;
    setCurrentStateIndex(prevIndex => prevIndex - 1);
    const canvasState = canvasStates[currentStateIndex - 1];
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      }
    };
    img.src = canvasState;
    message.info('Undo action performed');
  }, [currentStateIndex, canvasStates, canvasRef]);

  const redo = useCallback(() => {
    if (currentStateIndex >= canvasStates.length - 1) return;
    setCurrentStateIndex(prevIndex => prevIndex + 1);
    const canvasState = canvasStates[currentStateIndex + 1];
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      }
    };
    img.src = canvasState;
    message.info('Redo action performed');
  }, [currentStateIndex, canvasStates, canvasRef]);

  const takeSnapshot = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const dataURL = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = `air-canvas-snapshot-${new Date().toISOString()}.png`;
      link.click();
      message.success('Snapshot saved');
    }
  }, [canvasRef]);

  const saveCanvasState = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      setCanvasStates(prevStates => [...prevStates.slice(0, currentStateIndex + 1), canvas.toDataURL()]);
      setCurrentStateIndex(prevIndex => prevIndex + 1);
      message.success('Canvas state saved');
    }
  }, [canvasRef, currentStateIndex]);

  const handleCalibrate = useCallback(() => {
    calibrate();
    message.info('Calibration completed');
  }, [calibrate]);

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#1890ff' } }}>
      <div ref={containerRef} style={{ padding: '20px' }}>
        <Title level={2} style={{ textAlign: 'center' }}>Air Canvas</Title>
        {isLoading ? (
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <Spin size="large" />
            <p>Loading Air Canvas...</p>
          </div>
        ) : (
          <Row gutter={16}>
            <Col span={12}>
              <CanvasArea
                videoRef={videoRef}
                canvasRef={canvasRef}
                debugCanvasRef={debugCanvasRef}
                isDebugMode={isDebugMode}
              />
            </Col>
            <Col span={12}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <ControlPanel
                  color={color}
                  setColor={setColor}
                  brushSize={brushSize}
                  setBrushSize={setBrushSize}
                  eraserMode={eraserMode}
                  setEraserMode={setEraserMode}
                  isDebugMode={isDebugMode}
                  setIsDebugMode={setIsDebugMode}
                  clearCanvas={clearCanvas}
                  calibrate={handleCalibrate}
                  undo={undo}
                  redo={redo}
                  takeSnapshot={takeSnapshot}
                  saveCanvasState={saveCanvasState}
                  currentStateIndex={currentStateIndex}
                  canvasStates={canvasStates}
                />
              </Space>
            </Col>
          </Row>
        )}
      </div>
    </ConfigProvider>
  );
};

export default AirCanvas;