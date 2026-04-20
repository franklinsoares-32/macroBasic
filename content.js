// 🔥 DETECÇÃO EM TEMPO REAL (SEM DELAY)
document.addEventListener('input', (e) => {
  const el = e.target;

  if (!el.isContentEditable && !["TEXTAREA", "INPUT"].includes(el.tagName)) return;

  const text = el.isContentEditable ? el.innerText : el.value;

  const match = text.match(/\/(\w+)$/);

  if (match) {
    const fullCommand = match[0];
    const commandName = match[1];

    chrome.storage.local.get({ macros: [] }, (result) => {
      const macro = result.macros.find(m =>
        m.title.toLowerCase() === commandName.toLowerCase()
      );

      if (macro) {
        replaceTextOnPage(el, fullCommand, macro.text);
      }
    });
  }

}, true);


// 🔄 RECEBER TEXTO DO POPUP (SE USAR)
chrome.runtime.onMessage.addListener((request) => {
  if (request.action === 'pasteText') {
    replaceTextOnPage(document.activeElement, "", request.text);
  }
});


// 🔥 FUNÇÃO PRINCIPAL (REMOVE "/" E INSERE MACRO PERFEITO)
function replaceTextOnPage(element, oldText, newText) {

  if (element.isContentEditable) {
    element.focus();

    let currentText = element.innerText;

    // Remove o comando (/nome)
    if (oldText) {
      const escaped = oldText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped + "$");
      currentText = currentText.replace(regex, "").trimEnd();
    }

    const finalText = currentText + (currentText ? " " : "") + newText;

    // Limpa tudo
    element.innerHTML = "";

    // Reinsere com quebra de linha
    const lines = finalText.split("\n");

    lines.forEach((line, index) => {
      element.appendChild(document.createTextNode(line));
      if (index < lines.length - 1) {
        element.appendChild(document.createElement("br"));
      }
    });

    // Cursor no final
    const range = document.createRange();
    const sel = window.getSelection();
    range.selectNodeContents(element);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);

    // Notifica o sistema (ESSENCIAL)
    element.dispatchEvent(new Event("input", { bubbles: true }));

  } else {
    // INPUT / TEXTAREA
    const start = element.selectionStart;
    const startPos = Math.max(0, start - oldText.length);

    element.setRangeText(newText, startPos, start, "end");
    element.dispatchEvent(new Event("input", { bubbles: true }));
  }
}
