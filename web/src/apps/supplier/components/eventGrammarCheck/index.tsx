import type { HTMLAttributes, PropsWithChildren } from 'react';
import React, { useEffect, useRef } from 'react';

interface IProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
}

const EventGrammarCheck: React.FC<PropsWithChildren<IProps>> = ({ value, children }) => {
  const ref = useRef<HTMLDivElement | undefined>();

  useEffect(() => {
    const spans = ref.current?.querySelectorAll('.check-word');

    // 鼠标移入事件
    const mouseoverFn = (dom: HTMLSpanElement) => {
      const child: HTMLSpanElement | null = dom.querySelector('.child');
      const { left, top, width, height } = dom.getBoundingClientRect();
      if (child) {
        child.style.display = 'block';
        child.style.left = `${left - width / 2}px`;
        child.style.top = `${top + height - 1}px`;
      }
    };

    // 鼠标移出事件
    const mouseoutFn = (dom: HTMLSpanElement) => {
      const child: HTMLSpanElement | null = dom.querySelector('.child');
      if (child) {
        child.style.display = 'none';
      }
    };

    // 事件监听
    const eventListener = (type: 'add' | 'remove') => {
      spans?.forEach((span) => {
        if (type === 'add') {
          span.addEventListener('mouseover', () => mouseoverFn(span as HTMLSpanElement));
          span.addEventListener('mouseout', () => mouseoutFn(span as HTMLSpanElement));
        }
        if (type === 'remove') {
          span.removeEventListener('mouseover', () => mouseoverFn(span as HTMLSpanElement));
          span.removeEventListener('mouseout', () => mouseoutFn(span as HTMLSpanElement));
        }
      });
    };

    eventListener('add');

    return () => {
      eventListener('remove');
    };
  }, [value]);

  return <div ref={ref as any}>{children}</div>;
};

export default EventGrammarCheck;
