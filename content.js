let typedText = "";

// Evento principal (captura antes do site)
document.addEventListener('keydown', (e) => {
  const el = document.activeElement;
  if (!el.isContentEditable && !["TEXTAREA", "INPUT"].includes(el.tagName)) return;

  // Detecta comando ao apertar Espaço ou Enter
  if (e.key === " " || e.key === "Enter") {

    // 🔥 MAIS CONFIÁVEL: pega o texto real do campo
    const text = el.isContentEditable ? el.innerText : el.value;
    const match = text.match(/\/(\w+)$/);

    if (match) {
      const fullCommand = match[0]; // "/nome"
      const commandName = match[1]; // "nome"

      chrome.storage.local.get({ macros: [] }, (result) => {
        const macro = result.macros.find(m => 
          m.title.toLowerCase() === commandName.toLowerCase()
        );

        if (macro) {
          e.preventDefault();
          e.stopImmediatePropagation();

          replaceTextOnPage(el, fullCommand, macro.text);
          typedText = "";
        }
      });

    } else {
      typedText = "";
    }

  } 
  else if (e.key.length === 1) {
    typedText += e.key;
  }
  else if (e.key === "Backspace") {
    typedText = typedText.slice(0, -1);
  }

}, true); // CAPTURA (importante para chats como WhatsApp)


// Recebe comando externo (popup, etc.)
chrome.runtime.onMessage.addListener((request) => {
  if (request.action === 'pasteText') {
    replaceTextOnPage(document.activeElement, "", request.text);
  }
});


// 🔥 FUNÇÃO CORRIGIDA (REMOVE "/" E INSERE MACRO PERFEITO)
function replaceTextOnPage(element, oldText, newText) {

  if (element.isContentEditable) {
    element.focus();

    let currentText = element.innerText;

    // Remove o comando digitado (/nome)
    if (oldText) {
      const escaped = oldText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped + "$");
      currentText = currentText.replace(regex, "").trimEnd();
    }

    const finalText = currentText + (currentText ? " " : "") + newText;

    // Limpa tudo
    element.innerHTML = "";

    // Reinsere corretamente com quebra de linha
    const lines = finalText.split("\n");

    lines.forEach((line, index) => {
      element.appendChild(document.createTextNode(line));
      if (index < lines.length - 1) {
        element.appendChild(document.createElement("br"));
      }
    });

    // Move cursor pro final
    const range = document.createRange();
    const sel = window.getSelection();
    range.selectNodeContents(element);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);

    // Notifica o sistema (essencial pra WhatsApp e similares)
    element.dispatchEvent(new Event("input", { bubbles: true }));

  } else {
    // INPUT / TEXTAREA
    const start = element.selectionStart;
    const startPos = Math.max(0, start - oldText.length);

    element.setRangeText(newText, startPos, start, "end");
    element.dispatchEvent(new Event("input", { bubbles: true }));
  }
}
