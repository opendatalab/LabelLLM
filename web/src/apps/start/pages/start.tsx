import { useRef } from 'react';
import clsx from 'clsx';

import './style.css';

import type { ReactPageScrollerRef } from '../components/FullPageScroll';
import FullPageScroll from '../components/FullPageScroll';
import bg from './bg-min.jpg';
import blockBg from './blocks.png';
import { ReactComponent as Wheel } from './wheel.svg';
import { ReactComponent as Icon1 } from './icon-1.svg';
import { ReactComponent as Icon2 } from './icon-2.svg';
import { ReactComponent as Icon3 } from './icon-3.svg';
import { ReactComponent as LargeLogo } from './logo-large.svg';

const blocks = [
  {
    name: '保护濒危数据',
    desc: '挖掘、保存、活化互联网低频濒危数据',
    icon: <Icon1 />,
  },
  {
    name: '弥合信息差距',
    desc: '弥合AIGC时代对罕见信息的“注意力差距”',
    icon: <Icon2 />,
  },
  {
    name: '促进可持续性',
    desc: '助力人工智能数据的可持续',
    icon: <Icon3 />,
  },
];

const bgbox = clsx('w-full h-screen', 'flex flex-col justify-center items-center');

const linkButton = (
  <a href="/supplier" data-wiz="go-to-supplier">
    <div className="gradient-shadow">
      <div className="gradient-shadow__inner">
        <button className="border-0 rounded-full px-12 py-3 text-base text-color font-bold bg-white cursor-pointer transition-all duration-200 flex items-center gap-2">
          <span className="gradient-text">开启数据贡献之旅 ↗ </span>
        </button>
      </div>
    </div>
  </a>
);

export default function Start() {
  const ref = useRef<ReactPageScrollerRef>(null);

  return (
    <div style={{ backgroundImage: `url(${bg})` }} className="bg-no-repeat bg-cover bg-center">
      <FullPageScroll scrollRef={ref}>
        <div className={clsx(bgbox, 'gap-4 sm:gap-8 relative')}>
          <div className="flex flex-col justify-center items-center gap-4 sm:gap-4">
            <LargeLogo />
            <div className="text-3xl md:text-5xl lg:text-7xl font-bold mb-4">冰山之下</div>
            <div className="px-8 lg:px-0 text-center lg:text-left text-sm md:text-lg lg:text-xl text-secondary">
              诚邀您通过数据标注的方式，参与数据贡献，促进全球数据多元性
            </div>
          </div>
          <div className="flex flex-col justify-center items-center gap-4 sm:gap-10">
            <div className="flex flex-col lg:flex-row mt-6 md:mt-12 lg:mt-20 gap-8 lg:gap-6 lg:min-w-[72rem]">
              {blocks.map((block) => (
                <div
                  key={block.name}
                  className="relative flex flex-col justify-center items-center bg-white lg:py-12 lg:px-8 pt-6 pb-6 px-6 rounded-xl basis-1/3"
                >
                  <div className="flex items-center gap-2 mb-4">
                    {block.icon}
                    <div className="text-base sm:text-2xl font-bold">{block.name}</div>
                  </div>
                  <div className="text-secondary text-sm sm:text-base">{block.desc}</div>
                </div>
              ))}
            </div>
            {linkButton}
            <Wheel className="cursor-pointer animate-bounce -mt-4" onClick={() => ref.current?.scrollWindowDown()} />
          </div>
        </div>
        <div className={clsx(bgbox, 'gap-2 sm:gap-4 lg:gap-24 py-[5%] relative')}>
          <div className="text-3xl md:text-5xl lg:text-7xl font-bold">共筑互联网长尾数据生态</div>
          <div
            className="relative w-[20rem] sm:w-[30rem] md:w-[42rem] lg:w-[72rem] h-[328px] bg-no-repeat bg-center bg-contain"
            style={{ backgroundImage: `url(${blockBg})` }}
          />
          <div className="pt-2">{linkButton}</div>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-1">
            <a
              href="https://beian.miit.gov.cn/#/Integrated/index"
              className="text-secondary text-sm"
              target="_blank"
              rel="noreferrer"
            >
              ©2023 shlab. All Rights Reserved 沪ICP备2021009351号-3
            </a>
          </div>
        </div>
      </FullPageScroll>
    </div>
  );
}
