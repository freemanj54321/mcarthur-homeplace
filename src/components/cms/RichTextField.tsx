'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { useEffect } from 'react'

type Props = {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}

export function RichTextField({ value, onChange }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Link.configure({ openOnClick: false, autolink: false }),
    ],
    content: value || '<p></p>',
    onUpdate({ editor }) {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: { class: 'ProseMirror' },
    },
    immediatelyRender: false,
  })

  useEffect(() => {
    if (!editor) return
    if (editor.getHTML() !== value) {
      editor.commands.setContent(value || '<p></p>', { emitUpdate: false })
    }
  }, [value, editor])

  if (!editor) return <div className="tiptap-editor" />

  const toggle = (cmd: () => void) => (e: React.MouseEvent) => {
    e.preventDefault()
    cmd()
  }

  return (
    <div>
      <div className="tiptap-toolbar">
        <button type="button" className={editor.isActive('bold') ? 'is-active' : ''} onClick={toggle(() => editor.chain().focus().toggleBold().run())}>B</button>
        <button type="button" className={editor.isActive('italic') ? 'is-active' : ''} onClick={toggle(() => editor.chain().focus().toggleItalic().run())}><em>I</em></button>
        <button type="button" className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''} onClick={toggle(() => editor.chain().focus().toggleHeading({ level: 2 }).run())}>H2</button>
        <button type="button" className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''} onClick={toggle(() => editor.chain().focus().toggleHeading({ level: 3 }).run())}>H3</button>
        <button type="button" className={editor.isActive('bulletList') ? 'is-active' : ''} onClick={toggle(() => editor.chain().focus().toggleBulletList().run())}>• List</button>
        <button type="button" className={editor.isActive('orderedList') ? 'is-active' : ''} onClick={toggle(() => editor.chain().focus().toggleOrderedList().run())}>1. List</button>
        <button
          type="button"
          className={editor.isActive('link') ? 'is-active' : ''}
          onClick={toggle(() => {
            const previous = editor.getAttributes('link').href as string | undefined
            const url = window.prompt('URL', previous ?? 'https://')
            if (url === null) return
            if (url === '') {
              editor.chain().focus().extendMarkRange('link').unsetLink().run()
            } else {
              editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
            }
          })}
        >
          Link
        </button>
      </div>
      <div className="tiptap-editor">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
