import type { HTMLAttributes } from 'react';
import React from 'react';
import { clsx } from 'clsx';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { prism } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';
import type { ExtraProps } from 'react-markdown';
import ReactMarkdown from 'react-markdown';
import { ErrorBoundary } from 'react-error-boundary';
import { Image } from 'antd';

import { parseDocumentType } from '@/utils/parseDocumentType';

import 'katex/dist/katex.min.css';

interface IProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
}

const markdownComponents = (imageLinks: string[]) => {
  return {
    code(props: React.ClassAttributes<HTMLElement> & HTMLAttributes<HTMLElement> & ExtraProps) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { children, className, node, ...rest } = props;
      const match = /language-(\w+)/.exec(className || '');
      return match ? (
        // @ts-ignore
        <SyntaxHighlighter
          {...rest}
          PreTag="div"
          // eslint-disable-next-line react/no-children-prop
          children={String(children).replace(/\n$/, '')}
          language={match[1]}
          style={prism as any}
        />
      ) : (
        <code {...rest} className={className}>
          {children}
        </code>
      );
    },
    img({ src, alt }: { src?: string; alt?: string }) {
      // 解析图片格式 如果是mp3格式的音频文件则解析成audio标签 如果是mp4格式的视频文件则解析成video标签
      if (['mp3'].includes(parseDocumentType(src as string))) {
        return <audio controls src={src} />;
      }
      if (['mp4', 'mov'].includes(parseDocumentType(src as string))) {
        return <video controls src={src} style={{ maxWidth: '100%' }} />;
      }
      // 解析文档类型 如果是 txt, pdf 则解析成iframe标签
      if (['pdf', 'txt'].includes(parseDocumentType(src as string))) {
        return (
          <iframe
            src={src}
            allowFullScreen
            style={{ border: 'none', maxWidth: '100%', height: '700px', width: '100%' }}
          />
        );
      }

      return (
        <Image.PreviewGroup items={imageLinks}>
          <Image
            style={{
              maxWidth: '100%',
            }}
            alt={alt}
            src={src}
          />
        </Image.PreviewGroup>
      );
    },
  };
};

const getImageLinks = (v: string) => {
  const regex = /!\[.*?\]\((https?:\/\/.*?\.(?:jpg|jpeg|png|gif|bmp|webp))\s*(".*?")?\)/gi;
  const links: string[] = [];
  let match;
  while ((match = regex.exec(v)) !== null) {
    links.push(match[1]);
  }
  return links;
};

const MarkdownRenderer: React.FC<IProps> = ({ value, className: classNameb }) => {
  const imageLinks = getImageLinks(value);
  return (
    <ErrorBoundary
      fallback={
        <div className={'text-error'}>
          很抱歉，数据结构渲染出错。可能是由于数据格式不正确、数据不完整或数据结构与预期不符等原因导致的。请检查您的数据是否符合要求，并尝试重新渲染。如果您需要帮助或有任何问题，请随时联系我们的技术支持团队。
        </div>
      }
    >
      <ReactMarkdown
        className={clsx('chat-markdown !text-sm !text-color', classNameb)}
        // eslint-disable-next-line react/no-children-prop
        children={value}
        remarkPlugins={[remarkGfm, remarkBreaks, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeRaw]}
        components={markdownComponents(imageLinks)}
      />
    </ErrorBoundary>
  );
};

export default MarkdownRenderer;
