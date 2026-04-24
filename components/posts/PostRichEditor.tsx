'use client'

import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { useCurrentEditor } from '@tiptap/react'
import {
  EditorBubbleMenu,
  EditorClearFormatting,
  EditorFloatingMenu,
  EditorFormatBold,
  EditorFormatItalic,
  EditorFormatStrike,
  EditorFormatUnderline,
  EditorLinkSelector,
  EditorNodeBulletList,
  EditorNodeCode,
  EditorNodeHeading1,
  EditorNodeHeading2,
  EditorNodeHeading3,
  EditorNodeOrderedList,
  EditorNodeQuote,
  EditorNodeTable,
  EditorNodeText,
  EditorProvider,
  EditorSelector,
  type JSONContent,
} from '@/components/kibo-ui/editor'

export type PostRichEditorHandle = {
  getJSON: () => JSONContent | null
  getHTML: () => string | null
}

type Props = {
  initialContent?: unknown
  placeholder?: string
}

const PostRichEditor = forwardRef<PostRichEditorHandle, Props>(
  function PostRichEditor({ initialContent, placeholder }, ref) {
    return (
      <EditorProvider
        className="article-prose min-h-[480px] max-w-none focus:outline-none"
        content={(initialContent as string | object | undefined) ?? ''}
        placeholder={
          placeholder ??
          "Start writing… type '/' for commands, or select text to format."
        }
      >
        <EditorBridge ref={ref} />
        <EditorFloatingMenu>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-neutral-500 pl-2 pr-1">
            Press
            <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-neutral-200 bg-neutral-50 px-1 font-mono text-[10px] text-neutral-600 shadow-[0_1px_0_rgb(0_0_0/0.04)]">
              /
            </kbd>
            for commands
          </span>
        </EditorFloatingMenu>
        <EditorBubbleMenu>
          <NodeSelector />
          <FormatGroup />
          <EditorLinkSelector />
        </EditorBubbleMenu>
      </EditorProvider>
    )
  },
)

const EditorBridge = forwardRef<PostRichEditorHandle>(function EditorBridge(
  _props,
  ref,
) {
  const { editor } = useCurrentEditor()
  useImperativeHandle(
    ref,
    () => ({
      getJSON: () => editor?.getJSON() ?? null,
      getHTML: () => editor?.getHTML() ?? null,
    }),
    [editor],
  )
  return null
})

function NodeSelector() {
  const [open, setOpen] = useState(false)
  const { editor } = useCurrentEditor()
  if (!editor) return null

  const active = editor.isActive('heading', { level: 2 })
    ? 'Heading 2'
    : editor.isActive('heading', { level: 3 })
      ? 'Heading 3'
      : editor.isActive('heading', { level: 1 })
        ? 'Heading 1'
        : editor.isActive('bulletList')
          ? 'Bullet List'
          : editor.isActive('orderedList')
            ? 'Numbered List'
            : editor.isActive('blockquote')
              ? 'Quote'
              : editor.isActive('codeBlock')
                ? 'Code'
                : 'Text'

  return (
    <EditorSelector onOpenChange={setOpen} open={open} title={active}>
      <EditorNodeText />
      <EditorNodeHeading1 />
      <EditorNodeHeading2 />
      <EditorNodeHeading3 />
      <EditorNodeBulletList />
      <EditorNodeOrderedList />
      <EditorNodeQuote />
      <EditorNodeCode />
      <EditorNodeTable />
    </EditorSelector>
  )
}

function FormatGroup() {
  return (
    <>
      <EditorFormatBold hideName />
      <EditorFormatItalic hideName />
      <EditorFormatUnderline hideName />
      <EditorFormatStrike hideName />
      <EditorClearFormatting hideName />
    </>
  )
}

export default PostRichEditor
