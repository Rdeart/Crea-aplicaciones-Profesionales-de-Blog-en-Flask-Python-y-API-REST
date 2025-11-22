"use client";
import React, { useState, useRef, useEffect } from "react";

type Message = { role: "user" | "model"; text: string };

const API_BASE = (process.env.NEXT_PUBLIC_API_URL as string) || "http://localhost:5000";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hovered, setHovered] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const scroller = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    // on open, fetch initial greeting
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [] }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          const errMsg = data?.error || data?.detail || JSON.stringify(data) || 'Error desconocido del servidor';
          setMessages([{ role: 'model', text: `Error: ${errMsg}` }]);
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
  }, [open]);

  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
  }, [messages]);

  async function send() {
    if (!input.trim()) return;
    const userMsg: Message = { role: "user", text: input.trim() };
    setMessages((p) => [...p, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const payload = { messages: [...messages, userMsg] };
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const errMsg = data?.error || data?.detail || JSON.stringify(data) || 'Error desconocido del servidor';
        setMessages((p) => [...p, { role: 'model', text: `Error: ${errMsg}` }]);
      } else {
        const reply = data?.reply || 'No hay respuesta';
        setMessages((p) => [...p, { role: 'model', text: reply }]);
      }
    } catch (e: any) {
      setMessages((p) => [...p, { role: "model", text: `Error de red: ${e?.message || e}` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed right-6 bottom-6 z-50">
      <div className="flex flex-col items-end">
          {open && (
          <div className="w-80 bg-white rounded-lg shadow-lg overflow-hidden mb-2">
            <div className="flex items-center justify-between p-2 bg-blue-600 text-white">
              <div className="font-medium">KAT IA — Asistente</div>
              <button aria-label="Cerrar chat" title="Cerrar" onClick={() => setOpen(false)} className="ml-2 px-2 py-0 text-white bg-transparent border-0 text-lg">×</button>
            </div>
            <div ref={scroller} className="p-2 h-56 overflow-auto bg-gray-50">
              {messages.map((m, i) => (
                <div key={i} className={m.role === "user" ? "text-right my-1" : "text-left my-1"}>
                  <div className={m.role === "user" ? "inline-block bg-blue-600 text-white px-3 py-1 rounded" : "inline-block bg-white px-3 py-1 rounded shadow-sm"}>
                    {m.text}
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

        <button onClick={() => setOpen((s) => !s)} className="avatar-only" title="Abrir chat" style={{ padding: 0, border: 'none', background: 'transparent' }}>
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
  );
}
