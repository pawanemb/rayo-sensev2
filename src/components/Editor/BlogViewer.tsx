'use client';

import { useEffect } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import { RichTextProvider } from 'reactjs-tiptap-editor';

// Base Kit
import { Document } from '@tiptap/extension-document';
import { Text } from '@tiptap/extension-text';
import { Paragraph } from '@tiptap/extension-paragraph';
import { Dropcursor, Gapcursor } from '@tiptap/extensions';
import { HardBreak } from '@tiptap/extension-hard-break';
import { TextStyle } from '@tiptap/extension-text-style';
import { ListItem } from '@tiptap/extension-list';

// Extensions
import { History } from 'reactjs-tiptap-editor/history';
import { FontFamily } from 'reactjs-tiptap-editor/fontfamily';
import { Heading } from 'reactjs-tiptap-editor/heading';
import { FontSize } from 'reactjs-tiptap-editor/fontsize';
import { Bold } from 'reactjs-tiptap-editor/bold';
import { Italic } from 'reactjs-tiptap-editor/italic';
import { TextUnderline } from 'reactjs-tiptap-editor/textunderline';
import { Strike } from 'reactjs-tiptap-editor/strike';
import { Color } from 'reactjs-tiptap-editor/color';
import { Highlight } from 'reactjs-tiptap-editor/highlight';
import { BulletList } from 'reactjs-tiptap-editor/bulletlist';
import { OrderedList } from 'reactjs-tiptap-editor/orderedlist';
import { TextAlign } from 'reactjs-tiptap-editor/textalign';
import { Indent } from 'reactjs-tiptap-editor/indent';
import { LineHeight } from 'reactjs-tiptap-editor/lineheight';
import { TaskList } from 'reactjs-tiptap-editor/tasklist';
import { Link } from 'reactjs-tiptap-editor/link';
import { Image } from 'reactjs-tiptap-editor/image';
import { Video } from 'reactjs-tiptap-editor/video';
import { Blockquote } from 'reactjs-tiptap-editor/blockquote';
import { HorizontalRule } from 'reactjs-tiptap-editor/horizontalrule';
import { Code } from 'reactjs-tiptap-editor/code';
import { CodeBlock } from 'reactjs-tiptap-editor/codeblock';
import { Column, ColumnNode, MultipleColumnNode } from 'reactjs-tiptap-editor/column';
import { Table } from 'reactjs-tiptap-editor/table';

import 'reactjs-tiptap-editor/style.css';

const DocumentColumn = Document.extend({
  content: '(block|columns)+',
});

const BaseKit = [
  DocumentColumn,
  Text,
  Dropcursor,
  Gapcursor,
  HardBreak,
  Paragraph,
  ListItem,
  TextStyle,
];

const extensions = [
  ...BaseKit,
  History,
  FontFamily,
  Heading,
  FontSize,
  Bold,
  Italic,
  TextUnderline,
  Strike,
  Color,
  Highlight,
  BulletList,
  OrderedList,
  TextAlign,
  Indent,
  LineHeight,
  TaskList,
  Link,
  Image,
  Video,
  Blockquote,
  HorizontalRule,
  Code,
  CodeBlock,
  Column,
  ColumnNode,
  MultipleColumnNode,
  Table,
];

interface BlogViewerProps {
  content: string;
  title?: string;
}

export default function BlogViewer({ content, title }: BlogViewerProps) {
  const editor = useEditor({
    extensions,
    content: content || '<p>No content available</p>',
    editable: false, // Read-only mode
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor && content) {
      editor.commands.setContent(content);
    }
  }, [editor, content]);

  return (
    <div className="w-full max-w-screen-lg mx-auto">
      {title && (
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
          {title}
        </h1>
      )}

      {editor && <RichTextProvider editor={editor} dark={false}>
        <div className="overflow-hidden rounded-lg bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="p-6">
            <EditorContent editor={editor} />
          </div>
        </div>
      </RichTextProvider>}
    </div>
  );
}
