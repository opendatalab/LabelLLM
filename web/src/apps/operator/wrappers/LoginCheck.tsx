import type { To } from 'react-router-dom';
import { useRouteLoaderData, useNavigate } from 'react-router-dom';

// 已登录的用户访问登录页时，自动返回前一页
export default function LoginCheck({ children }: { children: JSX.Element }) {
  const auth = useRouteLoaderData('root');
  const navigate = useNavigate();

  if (auth) {
    setTimeout(() => {
      navigate(-1 as To);
    });

    return null;
  }

  return children;
}
