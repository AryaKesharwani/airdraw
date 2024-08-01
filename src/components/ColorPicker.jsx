
import { Tooltip } from 'antd';

const ColorPicker = ({ color, setColor }) => (
  <Tooltip title="Choose color">
    <input
      type="color"
      value={color}
      onChange={(e) => setColor(e.target.value)}
      style={{ width: 50, height: 32 }}
    />
  </Tooltip>
);

export default ColorPicker;