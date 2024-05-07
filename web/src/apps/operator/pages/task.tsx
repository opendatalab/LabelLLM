import { Link, Outlet, useLocation, useMatches, useNavigate, useOutlet } from 'react-router-dom';
import { useEffect, useMemo } from 'react';
import clsx from 'clsx';
import styled from 'styled-components';

import CustomPageContainer from '../layouts/CustomPageContainer';

const HeaderWrapper = styled.div`
  border-bottom: 1px solid var(--color-border-secondary);

  .active::after {
    content: '';
    display: block;
    width: 100%;
    height: 2px;
    background-color: var(--color-primary);
    border-radius: 2px;
    z-index: 2;
    position: absolute;
    top: 47px;
  }
`;

export default function TaskLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const matches = useMatches();
  const isLabelTask = location.pathname === '/task/label' || location.pathname === '/task/label/';
  const outlet = useOutlet();

  useEffect(() => {
    if (!outlet) {
      navigate('/task/label');
    }
  }, [navigate, outlet]);

  const tabs = useMemo(() => {
    return (
      <HeaderWrapper className="flex font-bold text-base py-6 mx-8 border">
        <Link
          className={clsx(
            {
              'text-[var(--color-text)]': !isLabelTask,
              active: isLabelTask,
            },
            'relative ',
          )}
          to="label"
        >
          标注
        </Link>
        <Link
          className={clsx(
            {
              'text-[var(--color-text)]': isLabelTask,
              active: !isLabelTask,
            },
            'mx-8 relative',
          )}
          to="audit"
        >
          审核
        </Link>
      </HeaderWrapper>
    );
  }, [isLabelTask]);

  // 创建任务的页面不使用这个布局
  if (matches.length > 3) {
    return <Outlet />;
  }

  return (
    <CustomPageContainer bodyClassName="flex flex-col flex-1" header={tabs}>
      <Outlet />
    </CustomPageContainer>
  );
}
