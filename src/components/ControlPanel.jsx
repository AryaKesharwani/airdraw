import { Button, Space, Tooltip } from 'antd';
import { ClearOutlined, UndoOutlined, RedoOutlined, CameraOutlined, DownloadOutlined } from '@ant-design/icons';
import ColorPicker from './ColorPicker';
import BrushSizeSlider from './BrushSizeSlider';
import ModeSwitch from './ModeSwitch';

const ControlPanel = ({
  color,
  setColor,
  brushSize,
  setBrushSize,
  eraserMode,
  setEraserMode,
  isDebugMode,
  setIsDebugMode,
  clearCanvas,
  calibrate,
  undo,
  redo,
  takeSnapshot,
  saveCanvasState,
  currentStateIndex,
  canvasStates
}) => (
  <>
    <Space>
      <ColorPicker color={color} setColor={setColor} />
      <BrushSizeSlider brushSize={brushSize} setBrushSize={setBrushSize} />
      <ModeSwitch checked={eraserMode} onChange={setEraserMode} title="Eraser mode" />
      <ModeSwitch checked={isDebugMode} onChange={setIsDebugMode} title="Debug mode" />
    </Space>
    <Space>
      <Tooltip title="Clear canvas">
        <Button onClick={clearCanvas} icon={<ClearOutlined />}>Clear</Button>
      </Tooltip>
      <Tooltip title="Calibrate hand position">
        <Button onClick={calibrate}>Calibrate</Button>
      </Tooltip>
      <Tooltip title="Undo">
        <Button onClick={undo} icon={<UndoOutlined />} disabled={currentStateIndex <= 0}>Undo</Button>
      </Tooltip>
      <Tooltip title="Redo">
        <Button onClick={redo} icon={<RedoOutlined />} disabled={currentStateIndex >= canvasStates.length - 1}>Redo</Button>
      </Tooltip>
      <Tooltip title="Take snapshot">
        <Button onClick={takeSnapshot} icon={<CameraOutlined />}>Snapshot</Button>
      </Tooltip>
      <Tooltip title="Save drawing">
        <Button onClick={saveCanvasState} icon={<DownloadOutlined />}>Save</Button>
      </Tooltip>
    </Space>
  </>
);

export default ControlPanel;