"use client";
import React, { useState, useRef, useEffect } from "react";
import Swal from 'sweetalert2';

type Message = { role: "user" | "model"; text: string };
type ChatType = "comercial" | "training";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL as string) || "http://localhost:5000";

// Función para convertir **texto** a <strong>texto</strong> y preservar saltos de línea
const formatBoldText = (text: string) => {
  // Primero convertir **texto** a <strong>texto</strong>
  let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Luego convertir saltos de línea a <br />
  formatted = formatted.replace(/\n/g, '<br />');
  return formatted;
};

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [chatType, setChatType] = useState<ChatType>("comercial");
  const [showMenu, setShowMenu] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const scroller = useRef<HTMLDivElement | null>(null);

  // Obtener ID del usuario actual desde el backend
  useEffect(() => {
    const fetchCurrentUserId = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/user/current`, {
          method: 'GET',
          credentials: 'include'
        });
        
        if (response.ok) {
          const userData = await response.json();
          const userId = userData.id;
          console.log('ID de usuario obtenido del backend:', userId, userData);
          setCurrentUserId(userId);
          
          // Guardar en sessionStorage como respaldo
          sessionStorage.setItem('current_user_id', userId);
        } else {
          // Fallback si falla la autenticación
          let userId = sessionStorage.getItem('current_user_id');
          if (!userId) {
            userId = 'fallback_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('current_user_id', userId);
          }
          console.log('ID de usuario fallback:', userId);
          setCurrentUserId(userId);
        }
      } catch (error) {
        console.warn('Error obteniendo ID del usuario:', error);
        
        // Fallback si hay error de red
        let userId = sessionStorage.getItem('current_user_id');
        if (!userId) {
          userId = 'fallback_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
          sessionStorage.setItem('current_user_id', userId);
        }
        console.log('ID de usuario error fallback:', userId);
        setCurrentUserId(userId);
      }
    };

    fetchCurrentUserId();
  }, []);

  // Cargar mensajes guardados al montar (separados por usuario y tipo de chat)
  useEffect(() => {
    if (!currentUserId) return;
    
    const storageKey = `chatMessages_${currentUserId}_${chatType}`;
    console.log('Cargando mensajes para:', storageKey);
    
    const savedMessages = localStorage.getItem(storageKey);
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        console.log('Mensajes cargados:', parsed.length, 'mensajes');
        setMessages(parsed);
      } catch (e) {
        console.warn('Error loading saved messages:', e);
      }
    } else {
      console.log('No hay mensajes guardados para:', storageKey);
    }
  }, [chatType, currentUserId]);

  // Guardar mensajes cuando cambien (separados por usuario y tipo de chat)
  useEffect(() => {
    if (!currentUserId || messages.length === 0) return;
    
    const storageKey = `chatMessages_${currentUserId}_${chatType}`;
    console.log('Guardando mensajes en:', storageKey, 'Total:', messages.length);
    localStorage.setItem(storageKey, JSON.stringify(messages));
  }, [messages, chatType, currentUserId]);

  // Limpiar conversación
  const clearChat = () => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "¡No podrás revertir esto!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminarlo!',
      target: '.chat-window',
      customClass: {
        container: 'chat-modal-container',
        popup: 'chat-modal-popup'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        setMessages([]);
        
        // Limpiar solo la conversación del usuario actual y tipo de chat
        if (currentUserId) {
          const storageKey = `chatMessages_${currentUserId}_${chatType}`;
          console.log('Eliminando conversación en:', storageKey);
          localStorage.removeItem(storageKey);
        }
        
        // Mensaje de confirmación
        setMessages([{ role: 'model', text: 'Conversación eliminada. ¡Podemos empezar de nuevo!' }]);
        
        Swal.fire({
          title: "Eliminado",
          text: 'La conversación ha sido eliminada.',
          icon: "success",
          target: '.chat-window',
          customClass: {
            container: 'chat-modal-container',
            popup: 'chat-modal-popup'
          }
        });
      }
    });
  };

  // Seleccionar chatbot
  const selectChatbot = (type: ChatType) => {
    console.log('Seleccionando chatbot:', type);
    setChatType(type);
    setShowMenu(false);
    
    // Limpiar mensajes actuales y cargar los del nuevo chatbot para este usuario
    setMessages([]);
    
    // Cargar mensajes guardados del nuevo chatbot para este usuario
    if (currentUserId) {
      const storageKey = `chatMessages_${currentUserId}_${type}`;
      console.log('Buscando mensajes en:', storageKey);
      const savedMessages = localStorage.getItem(storageKey);
      if (savedMessages) {
        try {
          const parsed = JSON.parse(savedMessages);
          console.log('Mensajes encontrados:', parsed.length);
          setMessages(parsed);
        } catch (e) {
          console.warn('Error loading saved messages:', e);
        }
      } else {
        console.log('No hay mensajes guardados, iniciando chatbot nuevo');
        // Forzar un mensaje inicial limpio
        setTimeout(() => {
          // Esto forzará el useEffect a cargar el saludo inicial correcto
          setMessages([{ role: 'model', text: 'Cargando...' }]);
        }, 100);
      }
    }
    
    setOpen(true);
  };

  // Eliminar completamente el chatbot
  const disableChatbot = async () => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "¡No podrás revertir esto! El chatbot será eliminado completamente.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminarlo!',
      target: '.chat-window',
      customClass: {
        container: 'chat-modal-container',
        popup: 'chat-modal-popup'
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(`${API_BASE}/api/chat/disable`, {
            method: 'DELETE',
            credentials: 'include'
          });
          
          if (res.ok) {
            // Limpiar localStorage y estado
            localStorage.removeItem('chatMessages');
            setMessages([]);
            setOpen(false);
            
            Swal.fire({
              title: "Eliminado",
              text: 'El chatbot ha sido eliminado correctamente.',
              icon: "success",
              target: '.chat-window',
              customClass: {
                container: 'chat-modal-container',
                popup: 'chat-modal-popup'
              }
            });
          } else {
            const data = await res.json();
            Swal.fire({
              title: "Error",
              text: data?.error || 'No se pudo eliminar el chatbot',
              icon: "error",
              target: '.chat-window',
              customClass: {
                container: 'chat-modal-container',
                popup: 'chat-modal-popup'
              }
            });
          }
        } catch (e) {
          Swal.fire({
            title: "Error",
            text: 'Error de conexión al eliminar el chatbot',
            icon: "error",
            target: '.chat-window',
            customClass: {
              container: 'chat-modal-container',
              popup: 'chat-modal-popup'
            }
          });
        }
      }
    });
  };

  useEffect(() => {
    if (!open) return;
    // Solo mostrar saludo inicial si no hay mensajes guardados
    if (messages.length === 0) {
      (async () => {
        setLoading(true);
        try {
          const res = await fetch(`${API_BASE}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: 'include',
            body: JSON.stringify({ messages: [] }),
          });
          const data = await res.json().catch(() => null);
          if (!res.ok) {
            if (res.status === 401) {
              // Error de autenticación - mostrar mensaje sin redirigir
              setMessages([{ role: 'model', text: 'Debes iniciar sesión para usar el chatbot. Por favor, inicia sesión en la página principal.' }]);
            } else {
              const errMsg = data?.error || data?.detail || JSON.stringify(data) || 'Error desconocido del servidor';
              setMessages([{ role: 'model', text: `Error: ${errMsg}` }]);
            }
          } else if (data && data.reply) {
            setMessages([{ role: "model", text: data.reply }]);
          } else {
            setMessages([{ role: "model", text: "No se recibió respuesta del servidor." }]);
          }
        } catch (e: any) {
          setMessages([{ role: "model", text: `Error de red: ${e?.message || e}` }]);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [open, messages.length]);

  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
  }, [messages]);

  async function send() {
    if (!input.trim()) return;
    const userMsg: Message = { role: "user", text: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    
    // Debug: mostrar qué chat_type se está enviando
    console.log('Enviando mensaje con chat_type:', chatType);
    
    try {
      const payload = { 
        messages: newMessages,
        chat_type: chatType
      };
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      
      // Debug: mostrar respuesta del servidor
      console.log('Respuesta del servidor:', data);
      
      if (!res.ok) {
        if (res.status === 401) {
          // Error de autenticación - mostrar mensaje sin redirigir
          setMessages((p) => [...p, { role: 'model', text: 'Debes iniciar sesión para usar el chatbot. Por favor, inicia sesión en la página principal.' }]);
        } else {
          const errMsg = data?.error || data?.detail || JSON.stringify(data) || 'Error desconocido del servidor';
          setMessages((p) => [...p, { role: 'model', text: `Error: ${errMsg}` }]);
        }
      } else {
        const reply = data?.reply || 'No hay respuesta';
        setMessages((p) => [...p, { role: "model", text: reply }]);
      }
    } catch (e: any) {
      setMessages((p) => [...p, { role: "model", text: `Error de red: ${e?.message || e}` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed right-6 bottom-6 z-50">
      <style jsx>{`
        .chat-modal-container {
          position: absolute !important;
          inset: auto !important;
          width: 100% !important;
          height: 100% !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          background: rgba(0, 0, 0, 0.5) !important;
          border-radius: 8px !important;
        }
        
        .chat-modal-popup {
          margin: 20px !important;
          max-width: calc(100% - 40px) !important;
          max-height: calc(100% - 40px) !important;
          transform: none !important;
        }
      `}</style>
      <div className="flex flex-col items-end">
          {open && (
          <div className="w-80 bg-white rounded-lg shadow-lg overflow-hidden mb-2">
            <div className={`flex items-center justify-between p-2 text-white ${chatType === 'training' ? 'bg-green-600' : 'bg-blue-600'}`}>
              <div className="font-medium">
                {chatType === 'training' ? 'Asistente de Capacitación' : 'KAT IA — Asistente'}
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={clearChat}
                  className="text-white hover:bg-white/10 rounded p-1 transition-colors"
                  title="Eliminar conversación"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18"/>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                    <line x1="10" x2="10" y1="11" y2="17"/>
                    <line x1="14" x2="14" y1="11" y2="17"/>
                  </svg>
                </button>
                <button 
                  aria-label="Cerrar chat" 
                  title="Cerrar" 
                  onClick={() => setOpen(false)} 
                  className="ml-2 px-2 py-0 text-white bg-transparent border-0 text-lg"
                >
                  ×
                </button>
              </div>
            </div>
            <div ref={scroller} className="p-2 h-56 overflow-auto bg-gray-50">
              {messages.map((m, i) => (
                <div key={i} className={m.role === "user" ? "text-right my-1" : "text-left my-1"}>
                  <div className={m.role === "user" ? "inline-block bg-blue-600 text-white px-3 py-1 rounded" : "inline-block bg-white px-3 py-1 rounded shadow-sm"}>
                    {m.role === "model" ? (
                      <span dangerouslySetInnerHTML={{ __html: formatBoldText(m.text) }} />
                    ) : (
                      m.text
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-2 border-t flex gap-2">
              <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} className="flex-1 px-2 py-1 border rounded" placeholder="Escribe tu consulta..." />
              <button onClick={send} className="bg-blue-600 text-white px-3 py-1 rounded">Enviar</button>
            </div>
          </div>
        )}

        <div 
          className="relative"
          onMouseEnter={() => setShowMenu(true)}
          onMouseLeave={() => setShowMenu(false)}
        >
          {/* Menú emergente */}
          {showMenu && !open && (
            <div className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-64 z-50">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 text-center">Selecciona un asistente</h3>
              <div className="space-y-2">
                <button
                  onClick={() => selectChatbot('comercial')}
                  className="w-full text-left p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors border border-blue-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                      K
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">KAT-IA Asistente</div>
                      <div className="text-sm text-gray-600">Asistente Comercial</div>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => selectChatbot('training')}
                  className="w-full text-left p-3 rounded-lg bg-green-50 hover:bg-green-100 transition-colors border border-green-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
                      C
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">Asistente de Capacitación</div>
                      <div className="text-sm text-gray-600">Instructor Digital Experto</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}
          
          <button 
            className="avatar-only" 
            title="Abrir chat" 
            style={{ padding: 0, border: 'none', background: 'transparent' }}
          >
            {open ? (
              <span className="text-white">Cerrar</span>
            ) : (
              <img
                ref={imgRef}
                src={`${API_BASE}/static/img/chatbot-avatar-transparent.png`}
                alt="avatar"
                style={{
                  height: 112,
                  width: 'auto',
                  borderRadius: 0,
                  display: 'block',
                  background: 'transparent',
                  transition: 'transform 220ms cubic-bezier(.2,.9,.2,1), box-shadow 220ms',
                  willChange: 'transform',
                  WebkitTransform: 'translateZ(0)',
                  transform: 'translateY(0) scale(1)',
                  WebkitBackfaceVisibility: 'hidden',
                  backfaceVisibility: 'hidden',
                  cursor: 'pointer',
                }}
                onMouseEnter={() => {
                  setHovered(true);
                  const el = imgRef.current;
                  if (el) {
                    el.style.transform = 'translateY(-12px) scale(1.18)';
                  }
                }}
                onMouseLeave={() => {
                  setHovered(false);
                  const el = imgRef.current;
                  if (el) {
                    el.style.transform = 'translateY(0) scale(1)';
                  }
                }}
                onTouchStart={() => {
                  const el = imgRef.current;
                  if (el) {
                    el.style.transform = 'translateY(-8px) scale(1.08)';
                  }
                }}
                onTouchEnd={() => {
                  const el = imgRef.current;
                  if (el) {
                    el.style.transform = 'translateY(0) scale(1)';
                  }
                }}
                onMouseDown={() => {
                  const el = imgRef.current;
                  if (el) {
                    el.style.transform = 'translateY(-3px) scale(0.98)';
                  }
                }}
                onMouseUp={() => {
                  const el = imgRef.current;
                  if (el) {
                    el.style.transform = 'translateY(0) scale(1)';
                  }
                }}
              />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
