(function(){
  const chatContainer = document.querySelector('#chat-container');
  const chatWindow = document.querySelector('#chat-window');
  const messagesEl = document.querySelector('#messages');
  const inputEl = document.querySelector('#chat-input');
  const sendBtn = document.querySelector('#chat-send');
  const openBtn = document.querySelector('#chatbot-open-button');
  const closeBtn = document.querySelector('#chat-close-button');
  let chatMessages = [];
  let currentChatType = 'comercial'; // 'comercial' o 'training'
  let showMenu = false;
  let currentUserId = null;

  // Obtener ID del usuario actual
  function getCurrentUserId() {
    if (!currentUserId) {
      // Intentar obtener el ID del usuario desde sessionStorage
      let userId = sessionStorage.getItem('current_user_id');
      
      if (!userId) {
        // Si no hay ID, generar uno temporal
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem('current_user_id', userId);
      }
      
      currentUserId = userId;
    }
    return currentUserId;
  }

  // Cargar mensajes guardados según el tipo de chat y usuario
  function loadMessages(){
    const userId = getCurrentUserId();
    const storageKey = `chatMessages_${userId}_${currentChatType}`;
    const saved = localStorage.getItem(storageKey);
    if(saved){
      try {
        chatMessages = JSON.parse(saved);
      } catch(e){
        chatMessages = [];
      }
    }
    // Cargar mensajes guardados
    chatMessages.forEach(msg => {
      const d = document.createElement('div');
      d.className = 'message ' + msg.cls;
      d.textContent = msg.text;
      messagesEl.appendChild(d);
    });
  }

  function appendMessage(text, cls, save = true){
    const d = document.createElement('div');
    d.className = 'message ' + cls;
    d.textContent = text;
    messagesEl.appendChild(d);
    messagesEl.parentElement.scrollTop = messagesEl.parentElement.scrollHeight;
    
    // Guardar en localStorage si no es un mensaje de error
    if (save && !text.includes('Debes iniciar sesión') && !text.includes('Error')) {
      chatMessages.push({text, cls, timestamp: Date.now()});
      const userId = getCurrentUserId();
      const storageKey = `chatMessages_${userId}_${currentChatType}`;
      localStorage.setItem(storageKey, JSON.stringify(chatMessages));
    }
  }

  function clearChat(){
    Swal.fire({
      title: '¿Estás seguro?',
      text: "¡No podrás revertir esto!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminarlo!',
      target: '#chat-window',
      customClass: {
        container: 'chat-modal-container',
        popup: 'chat-modal-popup'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        messagesEl.innerHTML = '';
        chatMessages = [];
        const userId = getCurrentUserId();
        const storageKey = `chatMessages_${userId}_${currentChatType}`;
        localStorage.removeItem(storageKey);
        appendMessage('Conversación eliminada. ¡Podemos empezar de nuevo!', 'bot', false);
        
        Swal.fire({
          title: "Eliminado",
          text: 'La conversación ha sido eliminada.',
          icon: "success",
          target: '#chat-window',
          customClass: {
            container: 'chat-modal-container',
            popup: 'chat-modal-popup'
          }
        });
      }
    });
  }

  function disableChatbot(){
    Swal.fire({
      title: '¿Estás seguro?',
      text: "¡No podrás revertir esto! El chatbot será eliminado completamente.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminarlo!',
      target: '#chat-window',
      customClass: {
        container: 'chat-modal-container',
        popup: 'chat-modal-popup'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        fetch('/api/chat/disable', {
          method: 'DELETE',
          credentials: 'include'
        })
        .then(res => res.json())
        .then(data => {
          if(data.success){
            // Limpiar todo y ocultar chat
            messagesEl.innerHTML = '';
            chatMessages = [];
            const userId = getCurrentUserId();
            const storageKey = `chatMessages_${userId}_${currentChatType}`;
            localStorage.removeItem(storageKey);
            if(chatContainer) chatContainer.style.display = 'none';
            
            Swal.fire({
              title: "Eliminado",
              text: 'El chatbot ha sido eliminado correctamente.',
              icon: "success",
              target: '#chat-window',
              customClass: {
                container: 'chat-modal-container',
                popup: 'chat-modal-popup'
              }
            });
          } else {
            Swal.fire({
              title: "Error",
              text: data.error || 'No se pudo eliminar el chatbot',
              icon: "error",
              target: '#chat-window',
              customClass: {
                container: 'chat-modal-container',
                popup: 'chat-modal-popup'
              }
            });
          }
        })
        .catch(e => {
          Swal.fire({
            title: "Error",
            text: 'Error de conexión al eliminar el chatbot',
            icon: "error",
            target: '#chat-window',
            customClass: {
              container: 'chat-modal-container',
              popup: 'chat-modal-popup'
            }
          });
        });
      }
    });
  }

  async function sendMessage(){
    const text = inputEl.value && inputEl.value.trim();
    if(!text) return;
    appendMessage(text, 'user');
    inputEl.value = '';

    try{
      const res = await fetch('/get_response', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        credentials: 'include',
        body: JSON.stringify({
          message: text,
          chat_type: currentChatType
        })
      });
      const data = await res.json();
      if(!res.ok){
        if(res.status === 401){
          // Error de autenticación - mostrar mensaje sin redirigir
          appendMessage('Debes iniciar sesión para usar el chatbot. Por favor, inicia sesión en la página principal.', 'bot');
        } else {
          appendMessage('Error: ' + (data?.detail || data?.error || JSON.stringify(data)), 'bot');
        }
      } else {
        appendMessage(data.response || data.reply || 'Sin respuesta', 'bot');
      }
    }catch(e){
      appendMessage('Error de red: '+e.message, 'bot');
    }
  }

  sendBtn.addEventListener('click', sendMessage);
  inputEl.addEventListener('keydown', function(e){ if(e.key === 'Enter'){ sendMessage(); } });
  // Close button inside chat window
  if (closeBtn){
    closeBtn.addEventListener('click', ()=>{ if(chatContainer) chatContainer.style.display = 'none'; });
  }

  // Open button toggles chat visibility (open/close) and focuses input when opening
  if(openBtn){
    openBtn.addEventListener('click', ()=>{
      if(!chatContainer) return;
      const isVisible = window.getComputedStyle(chatContainer).display !== 'none';
      if(isVisible){
        chatContainer.style.display = 'none';
      } else {
        chatContainer.style.display = 'block';
        inputEl.focus();
        // Cargar mensajes guardados cuando se abre el chat
        if (messagesEl.children.length === 0) {
          loadMessages();
        }
      }
    });
  }

  // Agregar botón de limpiar conversación si no existe
  function addControlButtons(){
    const chatHeader = document.querySelector('#chat-header');
    if (chatHeader && !chatHeader.querySelector('.clear-chat-btn')) {
      // Botón de limpiar conversación
      const clearBtn = document.createElement('button');
      clearBtn.className = 'clear-chat-btn';
      clearBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>';
      clearBtn.title = 'Eliminar conversación';
      clearBtn.style.cssText = `
        background: none;
        border: none;
        cursor: pointer;
        margin-left: 10px;
        padding: 4px;
        border-radius: 4px;
        transition: background-color 0.2s;
      `;
      clearBtn.addEventListener('mouseenter', () => clearBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.1)');
      clearBtn.addEventListener('mouseleave', () => clearBtn.style.backgroundColor = 'transparent');
      clearBtn.addEventListener('click', clearChat);
      
      // Insertar botón antes del botón de cerrar
      const closeBtn = chatHeader.querySelector('.chat-close');
      if (closeBtn) {
        chatHeader.insertBefore(clearBtn, closeBtn);
      } else {
        chatHeader.appendChild(clearBtn);
      }
    }
  }

  // Inicializar
  document.addEventListener('DOMContentLoaded', function(){
    addControlButtons();
  });
})();
