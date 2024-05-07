import clsx from 'clsx';
import React, { useImperativeHandle, useLayoutEffect, useRef, useState, useMemo, useCallback } from 'react';

export interface ReactPageScrollerRef {
  scrollWindowDown: () => void;
  scrollWindowUp: () => void;
}

const DEFAULT_ANIMATION_TIMER = 1000;

export interface FullPageScrollProps {
  scrollRef: React.RefObject<ReactPageScrollerRef>;
}

export default function FullPageScroll({ children, scrollRef }: React.PropsWithChildren<FullPageScrollProps>) {
  const newChildren = useMemo(() => React.Children.toArray(children), [children]);
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);
  const [processing, toggleProcessing] = useState(false);
  const currentRef = useRef(0);

  const scrollWindowDown = useCallback(() => {
    if (currentRef.current === newChildren.length - 1) {
      return;
    }

    currentRef.current += 1;

    isScrolling.current = true;
    toggleProcessing(true);

    const timer = setTimeout(() => {
      isScrolling.current = false;
      toggleProcessing(false);

      clearTimeout(timer);
    }, DEFAULT_ANIMATION_TIMER);
  }, [newChildren.length]);

  const scrollWindowUp = () => {
    if (currentRef.current === 0) {
      return;
    }

    currentRef.current -= 1;

    isScrolling.current = true;
    toggleProcessing(true);

    const timer = setTimeout(() => {
      isScrolling.current = false;
      toggleProcessing(false);

      clearTimeout(timer);
    }, DEFAULT_ANIMATION_TIMER);
  };

  useLayoutEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const handleWheel = (e: WheelEvent) => {
      if (isScrolling.current) {
        return;
      }

      const delta = e.deltaY > 0 ? 1 : -1;

      if (delta === 1) {
        scrollWindowDown();
      } else {
        scrollWindowUp();
      }
    };

    let touchStart = 0;
    const touchStartHandler = (e: TouchEvent) => {
      touchStart = e.touches[0].clientY;
    };

    const touchEndHandler = (e: TouchEvent) => {
      const touchEnd = e.changedTouches[0].clientY;
      if (touchStart > touchEnd) {
        scrollWindowDown();
      } else {
        scrollWindowUp();
      }
    };

    document.addEventListener('wheel', handleWheel);
    document.addEventListener('touchstart', touchStartHandler);
    document.addEventListener('touchend', touchEndHandler);

    return () => {
      document.removeEventListener('wheel', handleWheel);
      document.removeEventListener('touchstart', touchStartHandler);
      document.removeEventListener('touchend', touchEndHandler);
    };
  }, [scrollWindowDown]);

  useImperativeHandle(scrollRef, () => ({
    scrollWindowDown,
    scrollWindowUp,
  }));

  return (
    <div
      className={clsx('transition-all duration-1000 in-expo out-expo', {
        'pointer-events-none': processing,
      })}
      ref={containerRef}
      style={{
        transform: `translateY(-${currentRef.current * 100}vh)`,
      }}
    >
      {newChildren}
    </div>
  );
}
