import { Space } from 'antd';
import User from '../user';
import styled from './index.less';

const RightToolBar = () => {
  return (
    <div className={styled.toolbarWrapper}>
      <Space wrap size={16}>
        <User></User>
      </Space>
    </div>
  );
};

export default RightToolBar;
