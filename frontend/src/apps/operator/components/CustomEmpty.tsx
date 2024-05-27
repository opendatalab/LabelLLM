import type { EmptyProps } from 'antd';
import { Empty } from 'antd';

import { ReactComponent as EmptyElement } from '../assets/empty.svg';

export default function CustomEmpty(props: EmptyProps) {
  return <Empty image={<EmptyElement />} {...props} />;
}
