import odl from './odl.svg';
import labelu from './labelu.svg';
import mineru from './mineru.svg';
import arrow from './arrow.svg';
import { Popover } from 'antd';
import tool from './tool.svg';

const list = [
  {
    name: 'OpenDataLab',
    description: '一个引领 AI 大模型时代的开放数据平台，提供了海量的、多模态的优质数据集，助力 AI 开发落地',
    icon: odl,
    links: [{ name: '立即前往', url: 'https://opendatalab.com' }],
  },
  {
    name: 'Label U',
    description: '一款轻量级开源标注工具，自由组合多样工具，无缝兼容多格式数据，同时支持载入预标注，加速数据标注效率',
    icon: labelu,
    links: [
      { name: '在线体验', url: 'https://labelu.shlab.tech/tasks' },
      { name: 'Github', url: 'https://github.com/opendatalab/labelU' },
    ],
  },
  {
    name: 'Miner U',
    description: '一款轻量级开源标注工具，自由组合多样工具，无缝兼容多格式数据，同时支持载入预标注，加速数据标注效率',
    icon: mineru,
    links: [
      { name: '在线体验', url: 'https://opendatalab.com/OpenSourceTools/Extractor/PDF' },
      { name: 'Github', url: 'https://github.com/opendatalab/MinerU' },
    ],
  },
];

const Portal = () => {
  const handleGoApp = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className="w-[600px] grid grid-cols-2 gap-x-2">
      {list?.map((item, index) => {
        return (
          <div
            key={index}
            className="relative box-border rounded bg-white overflow-hidden px-4 py-3 pb-8 cursor-pointer group hover:bg-fill-tertiary"
            onClick={() => handleGoApp(item.links[0].url)}
          >
            <div className="flex items-center gap-x-3">
              <img className="block w-7 h-7" src={item.icon} alt="" />
              <div>
                <div className="text-base font-bold">{item.name}</div>
                <div className="text-secondary">{item.description}</div>
              </div>
            </div>
            <div
              className="absolute left-6 bottom-0 flex gap-6 transition ease-in-out opacity-0 group-hover:opacity-100 group-hover:-translate-y-2 duration-500"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              {item.links.map((link, inx) => {
                return (
                  <div
                    key={inx}
                    className="flex items-center group/item"
                    onClick={() => {
                      handleGoApp(link.url);
                    }}
                  >
                    <span className="mr-1">{link.name}</span>
                    <img
                      className="transform transition-transform duration-300 ease-in-out group-hover/item:translate-x-1"
                      src={arrow}
                      alt=""
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const AppPanel = () => {
  return (
    <Popover
      title={<div className="text-xl">欢迎使用OpenDataLab开源工具箱 🎉</div>}
      arrow={false}
      placement="rightTop"
      key="AppPanel"
      content={<Portal />}
    >
      <img className="w-[18px]" src={tool} alt="" />
    </Popover>
  );
};

export default AppPanel;
