import { Outlet, useMatches, useNavigate, useOutlet } from 'react-router-dom';
import { useEffect } from 'react';

import CustomPageContainer from '../layouts/CustomPageContainer';

export default function TaskLayout() {
  const navigate = useNavigate();
  const matches = useMatches();
  const outlet = useOutlet();

  useEffect(() => {
    if (!outlet) {
      navigate('/task/label');
    }
  }, [navigate, outlet]);

  // 创建任务的页面不使用这个布局
  if (matches.length > 3) {
    return <Outlet />;
  }

  return (
    <CustomPageContainer bodyClassName="flex flex-col flex-1">
      <Outlet />
    </CustomPageContainer>
  );
}
