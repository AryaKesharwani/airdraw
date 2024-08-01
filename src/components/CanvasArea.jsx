
// eslint-disable-next-line react/prop-types
const CanvasArea = ({ videoRef, canvasRef, debugCanvasRef, isDebugMode }) => (
  <>
    <video
      ref={videoRef}
      width="640"
      height="480"
      autoPlay
      style={{
        transform: 'scaleX(-1)',
        display: isDebugMode ? 'none' : 'block'
      }}
    />
    <canvas
      ref={debugCanvasRef}
      width="640"
      height="480"
      style={{
        border: '1px solid #000',
        display: isDebugMode ? 'block' : 'none'
      }}
    />
    <canvas
      ref={canvasRef}
      width="640"
      height="480"
      style={{ border: '1px solid #000' }}
    />
  </>
);

export default CanvasArea;
