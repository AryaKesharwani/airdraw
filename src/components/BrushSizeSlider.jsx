
import { Slider, Tooltip } from 'antd';

const BrushSizeSlider = ({ brushSize, setBrushSize }) => (
  <Tooltip title="Brush size">
    <Slider
      min={1}
      max={50}
      value={brushSize}
      onChange={setBrushSize}
      style={{ width: 200 }}
    />
  </Tooltip>
);

export default BrushSizeSlider;