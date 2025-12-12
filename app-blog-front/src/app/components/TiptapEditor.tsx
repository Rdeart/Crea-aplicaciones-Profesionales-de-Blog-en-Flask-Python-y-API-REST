import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';

interface TiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export const TiptapEditor: React.FC<TiptapEditorProps> = ({ content, onChange }) => {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
      Underline,
      Image,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'ProseMirror focus:outline-none',
      },
    },
  });

  if (!editor) {
    return <div>Cargando editor...</div>;
  }

  return (
    <div className="tiptap-editor border border-gray-300 rounded-lg overflow-hidden bg-white">
      {/* Barra de herramientas estilo Word */}
      <div className="toolbar bg-white border-b border-gray-300 p-1">
        <div className="flex items-center space-x-1">
          {/* Sección: Portapapeles */}
          <div className="flex items-center border-r border-gray-300 pr-2 mr-2">
            <button
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              className="px-3 py-2 text-sm hover:bg-gray-100 disabled:opacity-50 rounded flex items-center justify-center w-8 h-8"
              title="Deshacer"
            >
              ↶
            </button>
            <button
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              className="px-3 py-2 text-sm hover:bg-gray-100 disabled:opacity-50 rounded flex items-center justify-center w-8 h-8"
              title="Rehacer"
            >
              ↷
            </button>
          </div>

          {/* Sección: Fuente */}
          <div className="flex items-center border-r border-gray-300 pr-2 mr-2">
            <select
              value={
                editor.isActive('heading', { level: 1 })
                  ? 'h1'
                  : editor.isActive('heading', { level: 2 })
                  ? 'h2'
                  : editor.isActive('heading', { level: 3 })
                  ? 'h3'
                  : 'p'
              }
              onChange={(e) => {
                const value = e.target.value;
                if (value === 'p') {
                  editor.chain().focus().setParagraph().run();
                } else if (value === 'h1') {
                  editor.chain().focus().toggleHeading({ level: 1 }).run();
                } else if (value === 'h2') {
                  editor.chain().focus().toggleHeading({ level: 2 }).run();
                } else if (value === 'h3') {
                  editor.chain().focus().toggleHeading({ level: 3 }).run();
                }
              }}
              className="px-2 py-1 text-sm border border-gray-300 rounded h-8"
            >
              <option value="p">Normal</option>
              <option value="h1">Título 1</option>
              <option value="h2">Título 2</option>
              <option value="h3">Título 3</option>
            </select>
          </div>

          {/* Sección: Formato de texto */}
          <div className="flex items-center border-r border-gray-300 pr-2 mr-2">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center justify-center w-8 h-8 font-bold ${
                editor.isActive('bold') ? 'bg-gray-200' : ''
              }`}
              title="Negrita"
            >
              B
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center justify-center w-8 h-8 italic ${
                editor.isActive('italic') ? 'bg-gray-200' : ''
              }`}
              title="Cursiva"
            >
              I
            </button>
            <button
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={`px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center justify-center w-8 h-8 underline ${
                editor.isActive('underline') ? 'bg-gray-200' : ''
              }`}
              title="Subrayado"
            >
              U
            </button>
            <button
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={`px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center justify-center w-8 h-8 line-through ${
                editor.isActive('strike') ? 'bg-gray-200' : ''
              }`}
              title="Tachado"
            >
              S
            </button>
          </div>

          {/* Sección: Color */}
          <div className="flex items-center border-r border-gray-300 pr-2 mr-2">
            <div className="relative">
              <input
                type="color"
                id="text-color"
                onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
                className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                title="Color de texto"
              />
              <label 
                htmlFor="text-color" 
                className="absolute inset-0 cursor-pointer flex items-center justify-center"
                title="Color de texto"
              >
                <span className="text-xs font-bold">A</span>
              </label>
            </div>
          </div>

          {/* Sección: Alineación */}
          <div className="flex items-center border-r border-gray-300 pr-2 mr-2">
            <button
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              className={`px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center justify-center w-8 h-8 ${
                editor.isActive({ textAlign: 'left' }) ? 'bg-gray-200' : ''
              }`}
              title="Alinear a la izquierda"
            >
              ⬅
            </button>
            <button
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              className={`px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center justify-center w-8 h-8 ${
                editor.isActive({ textAlign: 'center' }) ? 'bg-gray-200' : ''
              }`}
              title="Centrar"
            >
              ⬌
            </button>
            <button
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              className={`px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center justify-center w-8 h-8 ${
                editor.isActive({ textAlign: 'right' }) ? 'bg-gray-200' : ''
              }`}
              title="Alinear a la derecha"
            >
              ➡
            </button>
            <button
              onClick={() => editor.chain().focus().setTextAlign('justify').run()}
              className={`px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center justify-center w-8 h-8 ${
                editor.isActive({ textAlign: 'justify' }) ? 'bg-gray-200' : ''
              }`}
              title="Justificar"
            >
              ≡
            </button>
          </div>

          {/* Sección: Listas */}
          <div className="flex items-center border-r border-gray-300 pr-2 mr-2">
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center justify-center w-8 h-8 ${
                editor.isActive('bulletList') ? 'bg-gray-200' : ''
              }`}
              title="Lista con viñetas"
            >
              •
            </button>
            <button
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center justify-center w-8 h-8 ${
                editor.isActive('orderedList') ? 'bg-gray-200' : ''
              }`}
              title="Lista numerada"
            >
              1.
            </button>
          </div>

          {/* Sección: Multimedia */}
          <div className="flex items-center border-r border-gray-300 pr-2 mr-2">
            <input
              type="file"
              id="image-upload"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    const dataUrl = event.target?.result as string;
                    editor.chain().focus().setImage({ src: dataUrl }).run();
                  };
                  reader.readAsDataURL(file);
                }
                // Limpiar el input para permitir subir el mismo archivo nuevamente
                e.target.value = '';
              }}
              className="hidden"
            />
            <label
              htmlFor="image-upload"
              className="px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center justify-center w-8 h-8 cursor-pointer"
              title="Insertar imagen"
            >
              🖼
            </label>
            
            <button
              onClick={() => {
                const url = window.prompt('URL del enlace:');
                if (url) {
                  editor.chain().focus().setLink({ href: url }).run();
                }
              }}
              className={`px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center justify-center w-8 h-8 ${
                editor.isActive('link') ? 'bg-gray-200' : ''
              }`}
              title="Insertar enlace"
            >
              🔗
            </button>
          </div>

          {/* Sección: Herramientas */}
          <div className="flex items-center">
            <button
              onClick={() => editor.chain().focus().unsetAllMarks().run()}
              className="px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center justify-center w-8 h-8"
              title="Limpiar formato"
            >
              ✖
            </button>
          </div>
        </div>
      </div>

      {/* Área de edición */}
      <div className="min-h-[300px] bg-white p-4">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};
