
import { Switch, Tooltip } from 'antd';

const ModeSwitch = ({ checked, onChange, title }) => (
  <Tooltip title={title}>
    <Switch checked={checked} onChange={onChange} />
  </Tooltip>
);

export default ModeSwitch;
