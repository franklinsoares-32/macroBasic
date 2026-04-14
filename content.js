let typedText = "";

// O segredo está no "true" ao final: ouvimos o evento antes do site (Fase de Captura)
document.addEventListener('keydown', (e) => {
  const el = document.activeElement;
  if (!el.isContentEditable && !["TEXTAREA", "INPUT"].includes(el.tagName)) return;

  // Se apertar Espaço ou Enter, processamos o comando
  if (e.key === " " || e.key === "Enter") {
    // Regex para pegar o último comando digitado (ex: /nome)
    const match = typedText.match(/\/(\w+)$/);
    
    if (match) {
      const fullCommand = match[0]; // "/nome"
      const commandName = match[1]; // "nome"
      
      chrome.storage.local.get({ macros: [] }, (result) => {
        const macro = result.macros.find(m => m.title.toLowerCase() === commandName.toLowerCase());
        
        if (macro) {
          // Bloqueia o WhatsApp de receber esse "Espaço" ou "Enter"
          e.preventDefault();
          e.stopImmediatePropagation();
          
          replaceTextOnPage(el, fullCommand, macro.text);
          typedText = ""; // Limpa o rastro
        }
      });
    } else {
      typedText = ""; // Não era um comando, limpa para a próxima
    }
  } 
  else if (e.key.length === 1) {
    typedText += e.key;
  }
  else if (e.key === "Backspace") {
    typedText = typedText.slice(0, -1);
  }
}, true); // ESTE "TRUE" É VITAL PARA O WHATSAPP

chrome.runtime.onMessage.addListener((request) => {
  if (request.action === 'pasteText') {
    replaceTextOnPage(document.activeElement, "", request.text);
  }
});

function replaceTextOnPage(element, oldText, newText) {
  if (element.isContentEditable) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    const range = selection.getRangeAt(0);

    // Deleta o comando (/nome) voltando exatamente o número de caracteres dele
    if (oldText.length > 0) {
      const offset = Math.max(0, range.startOffset - oldText.length);
      range.setStart(range.startContainer, offset);
      range.deleteContents();
    }

    // Cria o bloco de texto com quebras de linha
    const fragment = document.createDocumentFragment();
    newText.split('\n').forEach((line, i, arr) => {
      fragment.appendChild(document.createTextNode(line));
      if (i < arr.length - 1) fragment.appendChild(document.createElement('br'));
    });
    
    range.insertNode(fragment);
    selection.collapseToEnd();
    
    // Notifica o WhatsApp que o texto mudou para ativar o botão de enviar
    element.dispatchEvent(new Event('input', { bubbles: true }));
  } else {
    // Fallback para campos simples
    const start = element.selectionStart;
    const startPos = Math.max(0, start - oldText.length);
    element.setRangeText(newText, startPos, start, 'end');
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }
}