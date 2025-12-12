import React, { useRef } from 'react';

const TestEditor: React.FC = () => {
  const editorRef = useRef<HTMLDivElement>(null);

  return (
    <div style={{ padding: '20px', border: '2px solid red', margin: '20px' }}>
      <h3>EDITOR DE PRUEBA - SIN CSS EXTRA</h3>
      <div
        ref={editorRef}
        contentEditable
        style={{
          minHeight: '200px',
          border: '1px solid black',
          padding: '10px',
          fontSize: '16px'
        }}
      />
      <p style={{ marginTop: '10px', fontSize: '12px', color: 'gray' }}>
        Escribe aquí para probar si el texto aparece al revés o normal
      </p>
    </div>
  );
};

export default TestEditor;
