import React, { useRef, useEffect, useState } from 'react';

interface SimpleEditorProps {
  content: string;
  onChange: (content: string) => void;
}

const SimpleEditor: React.FC<SimpleEditorProps> = ({ content, onChange }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrike, setIsStrike] = useState(false);
  const [alignment, setAlignment] = useState('left');
  const [fontSize, setFontSize] = useState('5');
  const [fontFamily, setFontFamily] = useState('Arial');
  const [textColor, setTextColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');

  // Cargar contenido inicial cuando se edita un artículo
  useEffect(() => {
    if (editorRef.current && content) {
      // Solo cargar si el editor está vacío o si es un cambio externo
      if (editorRef.current.innerHTML === '' || editorRef.current.innerHTML !== content) {
        editorRef.current.innerHTML = content;
        setTimeout(() => makeImagesResizable(), 100);
      }
    }
  }, [content]);

  const executeCommand = (command: string, value?: string) => {
    if (editorRef.current) {
      // Guardar la selección actual
      const selection = window.getSelection();
      const range = selection?.getRangeAt(0);
      
      // Asegurar que el editor tiene foco
      editorRef.current.focus();
      
      // Verificar si el comando es soportado
      try {
        // Ejecutar el comando
        const result = document.execCommand(command, false, value);
        console.log(`Comando ${command} ejecutado: ${result}`);
      } catch (error) {
        console.error(`Error ejecutando comando ${command}:`, error);
      }
      
      // Restaurar la selección si se perdió
      if (selection && range && editorRef.current.contains(range.startContainer)) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
      
      updateContent();
      
      // Prevenir que el foco se mueva a otros elementos
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.focus();
        }
      }, 0);
    }
  };

  const updateContent = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const insertList = (type: 'ul' | 'ol') => {
    if (editorRef.current) {
      editorRef.current.focus();
      
      // Obtener la selección actual
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        
        // Crear un elemento de lista
        const li = document.createElement('li');
        li.innerHTML = '&nbsp;'; // Espacio para que el usuario pueda escribir
        
        // Crear el contenedor de lista
        const listElement = document.createElement(type);
        listElement.appendChild(li);
        
        // Insertar en la posición actual
        try {
          range.insertNode(listElement);
          
          // Posicionar cursor dentro del li
          const newRange = document.createRange();
          newRange.selectNodeContents(li);
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);
          
          updateContent();
        } catch (error) {
          console.error('Error insertando lista:', error);
          
          // Método alternativo: insertar como HTML
          const listHTML = type === 'ul' ? '<ul><li></li></ul>' : '<ol><li></li></ol>';
          document.execCommand('insertHTML', false, listHTML);
          updateContent();
        }
      } else {
        // Si no hay selección, insertar al final
        const listHTML = type === 'ul' ? '<ul><li></li></ul>' : '<ol><li></li></ol>';
        editorRef.current.innerHTML += listHTML;
        updateContent();
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editorRef.current) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imgSrc = event.target?.result as string;
        const img = `<img src="${imgSrc}" class="resizable-image" style="max-width: 100%; height: auto; cursor: move; display: inline-block; margin: 5px;" />`;
        
        if (editorRef.current) {
          editorRef.current.focus();
          const selection = window.getSelection();
          const range = selection?.getRangeAt(0);
          
          if (range && range.startContainer !== editorRef.current && !editorRef.current.contains(range.startContainer)) {
            // Si el cursor no está en el editor, moverlo al final
            const newRange = document.createRange();
            newRange.selectNodeContents(editorRef.current);
            newRange.collapse(false);
            selection?.removeAllRanges();
            selection?.addRange(newRange);
          }
          
          // Insertar en la posición actual
          document.execCommand('insertHTML', false, img);
          updateContent();
          
          // Hacer las imágenes redimensionables después de insertar
          setTimeout(() => makeImagesResizable(), 100);
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const makeImagesResizable = () => {
    const images = editorRef.current?.querySelectorAll('.resizable-image');
    images?.forEach(img => {
      const imgElement = img as HTMLImageElement;
      
      imgElement.onclick = function(e: MouseEvent) {
        e.preventDefault();
        e.stopPropagation();
        
        document.querySelectorAll('.image-size-menu').forEach(menu => menu.remove());
        
        const sizeMenu = document.createElement('div');
        sizeMenu.className = 'image-size-menu';
        sizeMenu.style.cssText = `
          position: fixed;
          background: white;
          border: 2px solid #0081a1;
          padding: 8px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          z-index: 10000;
          min-width: 120px;
        `;
        
        const sizes = [
          { label: '🔹 Pequeña', width: '150px' },
          { label: '🔸 Mediana', width: '300px' },
          { label: '🔺 Grande', width: '500px' },
          { label: '⬜ Original', width: '100%' }
        ];
        
        sizes.forEach(size => {
          const btn = document.createElement('button');
          btn.textContent = size.label;
          btn.style.cssText = `
            display: block;
            padding: 8px 12px;
            margin: 3px 0;
            border: none;
            background: #f8f9fa;
            cursor: pointer;
            border-radius: 4px;
            width: 100%;
            text-align: left;
            font-size: 12px;
            transition: background 0.2s;
          `;
          btn.onmouseover = () => btn.style.background = '#e9ecef';
          btn.onmouseout = () => btn.style.background = '#f8f9fa';
          
          btn.onclick = (e: MouseEvent) => {
            e.stopPropagation();
            imgElement.style.width = size.width;
            if (document.body.contains(sizeMenu)) {
              document.body.removeChild(sizeMenu);
            }
            updateContent();
          };
          sizeMenu.appendChild(btn);
        });
        
        sizeMenu.style.left = e.clientX + 'px';
        sizeMenu.style.top = (e.clientY + 10) + 'px';
        document.body.appendChild(sizeMenu);
        
        const closeMenu = (event: MouseEvent) => {
          if (!sizeMenu.contains(event.target as Node)) {
            if (document.body.contains(sizeMenu)) {
              document.body.removeChild(sizeMenu);
            }
            document.removeEventListener('click', closeMenu);
            document.removeEventListener('keydown', escapeKey);
          }
        };
        
        const escapeKey = (event: KeyboardEvent) => {
          if (event.key === 'Escape') {
            if (document.body.contains(sizeMenu)) {
              document.body.removeChild(sizeMenu);
            }
            document.removeEventListener('click', closeMenu);
            document.removeEventListener('keydown', escapeKey);
          }
        };
        
        setTimeout(() => {
          document.addEventListener('click', closeMenu);
          document.addEventListener('keydown', escapeKey);
        }, 100);
      };
    });
  };

  const handleAlignment = (align: string) => {
    setAlignment(align);
    // Usar el comando correcto para justificar
    if (align === 'justify') {
      executeCommand('justifyFull');
    } else {
      executeCommand('justify' + align.charAt(0).toUpperCase() + align.slice(1));
    }
  };

  const handleTextColor = (color: string) => {
    setTextColor(color);
    executeCommand('foreColor', color);
  };

  const handleBgColor = (color: string) => {
    setBgColor(color);
    executeCommand('hiliteColor', color);
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
      <div className="bg-gray-50 border-b border-gray-300 p-2">
        <div className="flex flex-wrap items-center gap-1">
          {/* Portapapeles */}
          <div className="flex gap-1 p-1 border-r border-gray-300">
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                executeCommand('undo');
              }} 
              className="w-7 h-7 flex items-center justify-center hover:bg-gray-200 rounded text-xs" 
              title="Deshacer"
              type="button"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 3a5 5 0 1 1-4.546 2.914.5.5 0 0 0-.908-.417A6 6 0 1 0 8 2v1z"/>
                <path d="M8 4.466V.534a.25.25 0 0 0-.41-.192L5.23 2.308a.25.25 0 0 0 0 .384l2.36 1.966A.25.25 0 0 0 8 4.466z"/>
              </svg>
            </button>
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                executeCommand('redo');
              }} 
              className="w-7 h-7 flex items-center justify-center hover:bg-gray-200 rounded text-xs" 
              title="Rehacer"
              type="button"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
                <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
              </svg>
            </button>
          </div>

          {/* Fuente */}
          <div className="flex gap-1 p-1 border-r border-gray-300 items-center">
            <select value={fontFamily} onChange={(e) => {setFontFamily(e.target.value); executeCommand('fontName', e.target.value);}} className="h-7 px-2 text-xs border border-gray-300 rounded">
              <option value="Arial">Arial</option>
              <option value="Calibri">Calibri</option>
              <option value="Times New Roman">Times</option>
              <option value="Georgia">Georgia</option>
            </select>
            <select value={fontSize} onChange={(e) => {setFontSize(e.target.value); executeCommand('fontSize', e.target.value);}} className="h-7 px-1 text-xs border border-gray-300 rounded w-10">
              <option value="3">10</option>
              <option value="4">11</option>
              <option value="5">12</option>
              <option value="6">14</option>
              <option value="7">16</option>
              <option value="8">18</option>
            </select>
          </div>

          {/* Formato */}
          <div className="flex gap-1 p-1 border-r border-gray-300">
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsBold(!isBold);
                executeCommand('bold');
              }} 
              className={`w-7 h-7 flex items-center justify-center hover:bg-gray-200 rounded text-xs font-bold ${isBold ? 'bg-blue-200' : ''}`} 
              title="Negrita"
              type="button"
            >B</button>
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsItalic(!isItalic);
                executeCommand('italic');
              }} 
              className={`w-7 h-7 flex items-center justify-center hover:bg-gray-200 rounded text-xs italic ${isItalic ? 'bg-blue-200' : ''}`} 
              title="Cursiva"
              type="button"
            >I</button>
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsUnderline(!isUnderline);
                executeCommand('underline');
              }} 
              className={`w-7 h-7 flex items-center justify-center hover:bg-gray-200 rounded text-xs underline ${isUnderline ? 'bg-blue-200' : ''}`} 
              title="Subrayado"
              type="button"
            >U</button>
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsStrike(!isStrike);
                executeCommand('strikeThrough');
              }} 
              className={`w-7 h-7 flex items-center justify-center hover:bg-gray-200 rounded text-xs line-through ${isStrike ? 'bg-blue-200' : ''}`} 
              title="Tachado"
              type="button"
            >S</button>
          </div>

          {/* Colores */}
          <div className="flex gap-1 p-1 border-r border-gray-300">
            <div className="relative">
              <input
                type="color"
                value={bgColor}
                onChange={(e) => handleBgColor(e.target.value)}
                className="w-7 h-7 border border-gray-300 rounded cursor-pointer"
                title="Resaltar"
              />
            </div>
            <div className="relative">
              <input
                type="color"
                value={textColor}
                onChange={(e) => handleTextColor(e.target.value)}
                className="w-7 h-7 border border-gray-300 rounded cursor-pointer"
                title="Color texto"
              />
            </div>
          </div>

          {/* Alineación */}
          <div className="flex gap-1 p-1 border-r border-gray-300">
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAlignment('left');
              }} 
              className={`w-7 h-7 flex items-center justify-center hover:bg-gray-200 rounded text-xs ${alignment === 'left' ? 'bg-blue-200' : ''}`} 
              title="Izquierda"
              type="button"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                <path d="M2 2h12v1H2V2zm0 3h9v1H2V5zm0 3h12v1H2V8zm0 3h9v1H2v-1z"/>
              </svg>
            </button>
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAlignment('center');
              }} 
              className={`w-7 h-7 flex items-center justify-center hover:bg-gray-200 rounded text-xs ${alignment === 'center' ? 'bg-blue-200' : ''}`} 
              title="Centrar"
              type="button"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                <path d="M2 2h12v1H2V2zm2 3h8v1H4V5zm-2 3h12v1H2V8zm2 3h8v1H4v-1z"/>
              </svg>
            </button>
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAlignment('right');
              }} 
              className={`w-7 h-7 flex items-center justify-center hover:bg-gray-200 rounded text-xs ${alignment === 'right' ? 'bg-blue-200' : ''}`} 
              title="Derecha"
              type="button"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                <path d="M2 2h12v1H2V2zm3 3h9v1H5V5zm-3 3h12v1H2V8zm3 3h9v1H5v-1z"/>
              </svg>
            </button>
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAlignment('justify');
              }} 
              className={`w-7 h-7 flex items-center justify-center hover:bg-gray-200 rounded text-xs ${alignment === 'justify' ? 'bg-blue-200' : ''}`} 
              title="Justificado"
              type="button"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                <path d="M2 2h12v1H2V2zm0 3h12v1H2V5zm0 3h12v1H2V8zm0 3h12v1H2v-1z"/>
              </svg>
            </button>
          </div>

          {/* Listas */}
          <div className="flex gap-1 p-1 border-r border-gray-300">
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const selection = window.getSelection();
                if (selection && selection.rangeCount > 0) {
                  const range = selection.getRangeAt(0);
                  const selectedText = range.toString();
                  
                  if (selectedText.trim()) {
                    // Si hay texto seleccionado, convertirlo a lista con viñetas
                    // Primero intentar dividir por saltos de línea, si no hay suficientes líneas, dividir por frases
                    let lines = selectedText
                      .split(/[\n\r]+/)
                      .map(line => line.trim())
                      .filter(line => line.length > 0);
                    
                    // Si solo hay una línea o pocas líneas, dividir por frases (puntos seguidos de espacio)
                    if (lines.length <= 1) {
                      lines = selectedText
                        .split(/[.!?]+(?=\s|$)/)
                        .map(line => line.trim())
                        .filter(line => line.length > 0);
                    }
                    
                    const listItems = lines.map(line => `<div style="margin-left: 20px;">• ${line}</div>`).join('');
                    range.deleteContents();
                    const fragment = document.createRange().createContextualFragment(listItems);
                    range.insertNode(fragment);
                  } else {
                    // Si no hay selección, insertar una viñeta vacía
                    const listHTML = '<div style="margin-left: 20px;">• </div>';
                    range.insertNode(document.createRange().createContextualFragment(listHTML));
                  }
                  
                  // Mover cursor al final
                  range.collapse(false);
                  selection.removeAllRanges();
                  selection.addRange(range);
                } else {
                  // Si no hay selección, insertar al final del editor
                  const listHTML = '<div style="margin-left: 20px;">• </div>';
                  document.execCommand('insertHTML', false, listHTML);
                }
                updateContent();
              }} 
              className="w-7 h-7 flex items-center justify-center hover:bg-gray-200 rounded text-xs" 
              title="Viñetas"
              type="button"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                <circle cx="3" cy="3" r="1.5"/>
                <circle cx="3" cy="8" r="1.5"/>
                <circle cx="3" cy="13" r="1.5"/>
                <path d="M7 2h7v1H7V2zm0 5h7v1H7V7zm0 5h7v1H7v-1z"/>
              </svg>
            </button>
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const selection = window.getSelection();
                if (selection && selection.rangeCount > 0) {
                  const range = selection.getRangeAt(0);
                  const selectedText = range.toString();
                  
                  if (selectedText.trim()) {
                    // Si hay texto seleccionado, convertirlo a lista numerada
                    // Primero intentar dividir por saltos de línea, si no hay suficientes líneas, dividir por frases
                    let lines = selectedText
                      .split(/[\n\r]+/)
                      .map(line => line.trim())
                      .filter(line => line.length > 0);
                    
                    // Si solo hay una línea o pocas líneas, dividir por frases (puntos seguidos de espacio)
                    if (lines.length <= 1) {
                      lines = selectedText
                        .split(/[.!?]+(?=\s|$)/)
                        .map(line => line.trim())
                        .filter(line => line.length > 0);
                    }
                    
                    const listItems = lines.map((line, index) => `<div style="margin-left: 20px;">${index + 1}. ${line}</div>`).join('');
                    range.deleteContents();
                    const fragment = document.createRange().createContextualFragment(listItems);
                    range.insertNode(fragment);
                  } else {
                    // Si no hay selección, insertar una numeración vacía
                    const listHTML = '<div style="margin-left: 20px;">1. </div>';
                    range.insertNode(document.createRange().createContextualFragment(listHTML));
                  }
                  
                  // Mover cursor al final
                  range.collapse(false);
                  selection.removeAllRanges();
                  selection.addRange(range);
                } else {
                  // Si no hay selección, insertar al final del editor
                  const listHTML = '<div style="margin-left: 20px;">1. </div>';
                  document.execCommand('insertHTML', false, listHTML);
                }
                updateContent();
              }} 
              className="w-7 h-7 flex items-center justify-center hover:bg-gray-200 rounded text-xs" 
              title="Numeración"
              type="button"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                <text x="2" y="4" fontSize="6" fill="currentColor">1</text>
                <text x="2" y="9" fontSize="6" fill="currentColor">2</text>
                <text x="2" y="14" fontSize="6" fill="currentColor">3</text>
                <path d="M7 2h7v1H7V2zm0 5h7v1H7V7zm0 5h7v1H7v-1z"/>
              </svg>
            </button>
          </div>

          {/* Sangría */}
          <div className="flex gap-1 p-1 border-r border-gray-300">
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                executeCommand('outdent');
              }} 
              className="w-7 h-7 flex items-center justify-center hover:bg-gray-200 rounded text-xs" 
              title="Disminuir sangría"
              type="button"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                <path d="M2 2h12v1H2V2zm0 3h12v1H2V5zm0 3h12v1H2V8zm0 3h12v1H2v-1z"/>
                <path d="M1 6l3-3v6l-3-3z"/>
              </svg>
            </button>
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                executeCommand('indent');
              }} 
              className="w-7 h-7 flex items-center justify-center hover:bg-gray-200 rounded text-xs" 
              title="Aumentar sangría"
              type="button"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                <path d="M2 2h12v1H2V2zm0 3h12v1H2V5zm0 3h12v1H2V8zm0 3h12v1H2v-1z"/>
                <path d="M15 6l-3-3v6l3-3z"/>
              </svg>
            </button>
          </div>

          {/* Insertar */}
          <div className="flex gap-1 p-1">
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="image-upload"/>
            <label htmlFor="image-upload" className="w-7 h-7 flex items-center justify-center hover:bg-gray-200 rounded cursor-pointer" title="Imagen">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
                <path d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-12zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1h12z"/>
              </svg>
            </label>
          </div>
        </div>
      </div>

      <div
        ref={editorRef}
        contentEditable
        className="editor-content min-h-[400px] max-h-[500px] p-4 focus:outline-none bg-white overflow-y-auto"
        style={{ 
          fontSize: '14px', 
          fontFamily: 'Arial'
        }}
        onInput={updateContent}
        suppressContentEditableWarning={true}
        data-gramm="false"
      />
    </div>
  );
};

export default SimpleEditor;
