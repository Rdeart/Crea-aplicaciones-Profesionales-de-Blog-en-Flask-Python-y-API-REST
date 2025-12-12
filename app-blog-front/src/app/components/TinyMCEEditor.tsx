import React, { useEffect, useRef } from 'react';

interface TinyMCEEditorProps {
  content: string;
  onChange: (content: string) => void;
}

const TinyMCEEditor: React.FC<TinyMCEEditorProps> = ({ content, onChange }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && !editorRef.current) {
      // Cargar TinyMCE desde CDN
      const script = document.createElement('script');
      script.src = 'https://cdn.tiny.cloud/1/no-api-key/tinymce/7/tinymce.min.js';
      script.referrerPolicy = 'origin';
      script.onload = () => {
        // @ts-ignore
        if (window.tinymce && textareaRef.current) {
          // @ts-ignore
          window.tinymce.init({
            selector: '#contenido_articulo',
            skin: 'oxide',          // tema claro (fondo blanco)
            content_css: 'default', // contenido claro
            height: 400,
            menubar: false,
            toolbar: `
              undo redo |
              fontselect fontsizeselect |
              bold italic underline strikethrough |
              forecolor backcolor |
              alignleft aligncenter alignright alignjustify |
              bullist numlist |
              image
            `,
            plugins: 'lists image',
            // Subida de imágenes
            images_upload_handler: function (blobInfo: any, success: any, failure: any) {
              // Convertir imagen a base64
              const reader = new FileReader();
              reader.onload = () => {
                const base64 = reader.result as string;
                success(base64);
              };
              reader.onerror = () => {
                failure('Error al cargar la imagen');
              };
              reader.readAsDataURL(blobInfo.blob());
            },
            automatic_uploads: true,
            setup: (editor: any) => {
              editorRef.current = editor;
              
              // Establecer contenido inicial
              if (content) {
                editor.setContent(content);
              }

              // Manejar cambios de contenido
              editor.on('change', () => {
                onChange(editor.getContent());
              });

              editor.on('keyup', () => {
                onChange(editor.getContent());
              });
            }
          });
        }
      };
      document.head.appendChild(script);

      return () => {
        // Limpiar TinyMCE al desmontar
        if (editorRef.current) {
          // @ts-ignore
          if (window.tinymce) {
            // @ts-ignore
            window.tinymce.remove('#contenido_articulo');
          }
        }
      };
    }

    // Actualizar contenido cuando cambia externamente
    if (editorRef.current && content !== editorRef.current.getContent()) {
      editorRef.current.setContent(content);
    }
  }, [content, onChange]);

  return (
    <div className="tinymce-editor-container">
      <textarea
        id="contenido_articulo"
        ref={textareaRef}
        defaultValue={content}
        style={{ width: '100%', height: '400px' }}
      />
    </div>
  );
};

export default TinyMCEEditor;
