import clsx from 'clsx';
import React from 'react';
import { styled } from 'styled-components';

const StyledSvg = styled.svg`
  transform: rotate(90deg);

  .circular-progress-bar {
    fill: none;
    stroke-linecap: round;
  }
`;

export type PercentageCircleProps = React.PropsWithChildren<{
  percentage: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  color?: string;
}>;

export default function PercentageCircle({
  className,
  percentage,
  size = 100,
  strokeWidth = 14,
  children,
}: PercentageCircleProps) {
  const radius = size / 2 - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className={clsx(className, 'relative')} style={{ width: size, height: size }}>
      <StyledSvg className="circular-progress" width={size} height={size}>
        <defs>
          <linearGradient x1="1" y1="0" x2="0" y2="0" id="gradient1">
            <stop offset="0%" stopColor="var(--geekblue-1)" />
            <stop offset="100%" stopColor="var(--geekblue-5)" />
          </linearGradient>
          <linearGradient x1="1" y1="0" x2="0" y2="0" id="gradient2">
            <stop offset="0%" stopColor="var(--geekblue-5)" />
            <stop offset="100%" stopColor="var(--color-primary)" />
          </linearGradient>
          <linearGradient x1="1" y1="0" x2="0" y2="0" id="gradient4">
            <stop offset="0%" stopColor="var(--geekblue-5)" />
            <stop offset="100%" stopColor="var(--color-primary)" />
          </linearGradient>
        </defs>
        <g>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#F1F5F9" strokeWidth={strokeWidth} />
          <circle
            className="circular-progress-bar"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            stroke="url('#gradient1')"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={offset}
          />
          {percentage > 50 && (
            <circle
              transform={`rotate(180 ${size / 2} ${size / 2})`}
              className="circular-progress-bar"
              cx={size / 2}
              cy={size / 2}
              stroke="url('#gradient4')"
              r={radius}
              strokeWidth={strokeWidth}
              strokeDasharray={`${circumference / 2} ${circumference}`}
              strokeDashoffset={offset}
            />
          )}
        </g>
      </StyledSvg>
      {children}
    </div>
  );
}
