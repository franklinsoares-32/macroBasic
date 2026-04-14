document.addEventListener('DOMContentLoaded', () => {
  const saveBtn = document.getElementById('save');
  const searchInput = document.getElementById('search');
  const list = document.getElementById('macroList');
  const editIndexInput = document.getElementById('editIndex');
  let allMacros = [];

  renderMacros();

  saveBtn.addEventListener('click', () => {
    const title = document.getElementById('title').value.trim();
    const text = document.getElementById('text').value;
    const index = parseInt(editIndexInput.value);

    if (title && text) {
      chrome.storage.local.get({ macros: [] }, (result) => {
        let macros = result.macros;
        if (index === -1) {
          macros.push({ title, text });
        } else {
          macros[index] = { title, text };
          editIndexInput.value = "-1";
          saveBtn.innerText = "Salvar Macro";
          saveBtn.style.background = ""; 
        }
        chrome.storage.local.set({ macros }, () => {
          resetFields();
          renderMacros();
        });
      });
    }
  });

  function renderMacros() {
    chrome.storage.local.get({ macros: [] }, (result) => {
      allMacros = result.macros;
      displayMacros(allMacros);
    });
  }

  function displayMacros(macros) {
    list.innerHTML = ''; 
    macros.forEach((macro, index) => {
      const div = document.createElement('div');
      div.className = 'macro-item';
      div.innerHTML = `
        <button class="macro-btn" title="Clique para colar">${macro.title}</button>
        <button class="edit-btn" title="Editar">✏️</button>
        <button class="delete-btn" title="Excluir">✖</button>
      `;

      div.querySelector('.macro-btn').addEventListener('click', () => autoPaste(macro.text));
      
      div.querySelector('.edit-btn').addEventListener('click', () => {
        document.getElementById('title').value = macro.title;
        document.getElementById('text').value = macro.text;
        editIndexInput.value = index;
        saveBtn.innerText = "Atualizar Macro";
        saveBtn.style.background = "#10b981";
      });

      div.querySelector('.delete-btn').addEventListener('click', () => {
        if(confirm("Excluir esta macro?")) {
          chrome.storage.local.get({ macros: [] }, (result) => {
             let macros = result.macros;
             macros.splice(index, 1);
             chrome.storage.local.set({ macros }, renderMacros);
          });
        }
      });
      list.appendChild(div);
    });
  }

  searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = allMacros.filter(m => 
      m.title.toLowerCase().includes(term) || m.text.toLowerCase().includes(term)
    );
    displayMacros(filtered);
  });

  async function autoPaste(text) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      chrome.tabs.sendMessage(tab.id, { action: 'pasteText', text: text });
    }
  }

  // IMPORT / EXPORT (Mantido conforme original)
  document.getElementById('exportBtn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(allMacros, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "macros_backup.json";
    a.click();
  });

  document.getElementById('importBtn').addEventListener('click', () => document.getElementById('fileInput').click());

  document.getElementById('fileInput').addEventListener('change', (e) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (Array.isArray(data)) {
          chrome.storage.local.set({ macros: data }, renderMacros);
        }
      } catch(e) { alert("Erro ao importar arquivo."); }
    };
    reader.readAsText(e.target.files[0]);
  });

  function resetFields() {
    document.getElementById('title').value = '';
    document.getElementById('text').value = '';
    editIndexInput.value = "-1";
    saveBtn.innerText = "Salvar Macro";
    saveBtn.style.background = "";
  }  
});