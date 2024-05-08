import type { HTMLAttributes, PropsWithChildren } from 'react';
import React from 'react';
import { clsx } from 'clsx';
import MarkdownPreview from '@uiw/react-markdown-preview';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import { ErrorBoundary } from 'react-error-boundary';

import { isUrlMedia } from '@/utils/isUrlMedia';

import errorImage from './errorImage.png';

import 'katex/dist/katex.min.css';

interface IProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
}

const Image = (props: any) => {
  return (
    <img
      {...props}
      className="inline-block max-w-full"
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.onerror = null;
        target.src = errorImage;
      }}
      alt={props.alt || 'image'}
    />
  );
};

const Markdown: React.FC<PropsWithChildren<IProps>> = ({ value, className }) => {
  return (
    <ErrorBoundary
      fallback={
        <div className={'text-error'}>
          很抱歉，数据结构渲染出错。可能是由于数据格式不正确、数据不完整或数据结构与预期不符等原因导致的。请检查您的数据是否符合要求，并尝试重新渲染。如果您需要帮助或有任何问题，请随时联系我们的技术支持团队。
        </div>
      }
    >
      <MarkdownPreview
        disableCopy={true}
        wrapperElement={{
          'data-color-mode': 'light',
        }}
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        className={clsx('chat-markdown !text-sm !text-color', className)}
        source={value}
        components={{
          img: Image,
        }}
        rehypeRewrite={(node: any, index, parent: any) => {
          if (node.tagName === 'a' && parent && /^h(1|2|3|4|5|6)/.test(parent.tagName)) {
            parent.children = parent.children.slice(1);
          }
          // 检验图片是否为s3地址 如果是则替换成要转换的地址
          if (node.tagName === 'img') {
            const s3Reg = /^s3a?:\/\/([^\/]+)(?:\/(.*))?$/g;
            if (s3Reg.test(node.properties.src)) {
              node.properties.src = `https://data-asset.idc.shlab.tech/api/v1/s3/file_preview?path=${node.properties.src}`;
            }
            // 解析图片格式 如果是mp3格式的音频文件则解析成audio标签 如果是mp4格式的视频文件则解析成video标签
            if (isUrlMedia(node.properties.src, 'mp3')) {
              node.tagName = 'audio';
              node.properties.controls = true;
            }
            if (isUrlMedia(node.properties.src, 'mp4') || isUrlMedia(node.properties.src, 'mov')) {
              node.tagName = 'video';
              node.properties.controls = true;
              node.properties.style = 'max-width: 100%';
            }
            console.log(node.properties.src);
          }
        }}
      />
    </ErrorBoundary>
  );
};

export default Markdown;
