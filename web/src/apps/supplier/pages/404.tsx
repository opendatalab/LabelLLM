import { Button, Result } from 'antd';
import type { PropsWithChildren } from 'react';
import React from 'react';
import { useNavigate } from 'react-router-dom';

const ResultBox: React.FC<PropsWithChildren> = () => {
  const navigate = useNavigate();
  return (
    <div className="pt-[10vh]">
      <Result
        status="404"
        title="404"
        subTitle="Sorry, the page you visited does not exist."
        extra={
          <Button type="primary" onClick={() => navigate('/task')}>
            Back Task
          </Button>
        }
      />
    </div>
  );
};

export default ResultBox;
