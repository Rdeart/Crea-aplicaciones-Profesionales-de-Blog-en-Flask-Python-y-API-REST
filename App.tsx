import React, {useState, useEffect, useRef} from 'react'

export type Message = {
  role: 'user' | 'model'
  text: string
}

export const SYSTEM_INSTRUCTION = `
🔵 BLOQUE 1 — Rol del Agente

Eres KAT IA, el Agente Virtual de Inteligencia Comercial de Cure LATAM, especializado en acompañar a la fuerza de ventas en dispositivos para cuidado de heridas.
Tu función es guiar, entrenar y potenciar cada visita médica o de acceso a decisión, usando datos reales, personalización por DISC y lógica del SOP.

Respondes por WhatsApp, así que todo debe ser corto, directo y listo para usar frente al cliente.
`;

export const INITIAL_GREETING = "Hola, soy KAT IA. Estoy lista para apoyarte. ¿Quieres preparar una visita, responder una objeción o hacer seguimiento?";

export default function App(){
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scroller = useRef<HTMLDivElement|null>(null)

  useEffect(()=>{
    // show initial greeting from bot — we'll fetch from server to remain consistent
    (async ()=>{
      setLoading(true)
      try{
        const res = await fetch('/api/chat', {method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({messages: []})})
        const data = await res.json()
        if(data && data.reply){
          setMessages([{role: 'model', text: data.reply}])
        }
      }catch(e){
        setMessages([{role:'model', text: INITIAL_GREETING}])
      }finally{setLoading(false)}
    })()
  },[])

  useEffect(()=>{
    if(scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight
  },[messages])

  async function send(){
    if(!input.trim()) return
    const userMsg: Message = {role:'user', text: input.trim()}
    setMessages((prev: Message[]) => [...prev, userMsg])
    setInput('')
    setLoading(true)
    try{
      const payload = {messages: [...messages, userMsg]}
      const res = await fetch('/api/chat', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)})
      const data = await res.json()
      const reply = data.reply || 'No response'
      setMessages((prev: Message[]) => [...prev, {role:'model', text: reply}])
    }catch(e){
      setMessages((prev: Message[]) => [...prev, {role:'model', text: 'Error al conectar con el servidor.'}])
    }finally{setLoading(false)}
  }

  return (
    React.createElement('div',{className:'fixed bottom-6 right-6 w-96 z-50'},
      React.createElement('div',{className:'bg-white rounded-lg shadow-lg overflow-hidden flex flex-col', style:{height: '480px'}},
        React.createElement('div',{className:'p-3 border-b flex items-center justify-between bg-blue-600 text-white'},
          React.createElement('div',null,'KAT IA — Asistente de ventas'),
          React.createElement('div',null, loading ? '...' : '')
        ),
        React.createElement('div',{ref: scroller, className:'flex-1 p-3 overflow-auto', style:{background:'#f7fafc'}},
          messages.map((m: Message, i: number)=> (
            React.createElement('div',{key:i, style:{marginBottom:12}},
              React.createElement('div',{className: m.role==='user' ? 'text-right' : 'text-left'},
                React.createElement('div',{className: m.role==='user' ? 'inline-block bg-blue-500 text-white px-3 py-2 rounded-lg' : 'inline-block bg-white text-gray-900 px-3 py-2 rounded-lg shadow-sm'}, m.text)
              )
            )
          ))
        ),
        React.createElement('div',{className:'p-3 border-t flex gap-2'},
          React.createElement('input',{value: input, onChange: (e: React.ChangeEvent<HTMLInputElement>)=>setInput(e.target.value), onKeyDown:(e: React.KeyboardEvent<HTMLInputElement>)=>{ if((e as React.KeyboardEvent<HTMLInputElement>).key==='Enter'){ send() } }, className:'flex-1 px-3 py-2 border rounded', placeholder:'Escribe tu consulta...'}),
          React.createElement('button',{onClick: send, className:'bg-blue-600 text-white px-4 py-2 rounded'}, 'Enviar')
        )
      )
    )
  )
}
