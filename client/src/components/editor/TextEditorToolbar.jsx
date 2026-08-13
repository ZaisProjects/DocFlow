import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

import '../../styles/TextEditorToolbar.css';

export default function RichTextEditor({
  content,
  onChange,
  editable = true,
}) {
  const editor = useEditor({
    editable,
    extensions: [StarterKit],
    content: content || '',

    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  return (
    <div className="rich-editor-wrapper">
      {editable && (
        <div className="editor-toolbar">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'active' : ''}
          >
            Bold
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'active' : ''}
          >
            Italic
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={editor.isActive('heading', { level: 1 }) ? 'active' : ''}
          >
            H1
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={editor.isActive('heading', { level: 2 }) ? 'active' : ''}
          >
            H2
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive('bulletList') ? 'active' : ''}
          >
            • List
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editor.isActive('orderedList') ? 'active' : ''}
          >
            1. List
          </button>
        </div>
      )}

      <EditorContent editor={editor} className="editor-content" />
    </div>
  );
}