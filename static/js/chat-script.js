(function(){
  const messagesEl = document.getElementById('messages');
  const inputEl = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send');
  const openBtn = document.getElementById('chatbot-open-button');
  const chatContainer = document.getElementById('chat-container');

  function appendMessage(text, cls){
    const d = document.createElement('div');
    d.className = 'message ' + cls;
    d.textContent = text;
    messagesEl.appendChild(d);
    messagesEl.parentElement.scrollTop = messagesEl.parentElement.scrollHeight;
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
        body: JSON.stringify({message: text})
      });
      const data = await res.json();
      if(!res.ok){
        appendMessage('Error: ' + (data?.detail || data?.error || JSON.stringify(data)), 'bot');
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
  const closeBtn = document.getElementById('chat-close-button');
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
      }
    });
  }
})();
