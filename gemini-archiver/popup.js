document.addEventListener('DOMContentLoaded', () => {
  const listEl = document.getElementById('list');
  const searchInput = document.getElementById('search');
  let archivedData = {};

  function renderList(filter = '') {
    listEl.innerHTML = '';
    const items = Object.values(archivedData).filter(item =>
      item.title.toLowerCase().includes(filter.toLowerCase())
    );

    if (items.length === 0) {
      listEl.innerHTML = `<div class="empty-state">No archived conversations found.</div>`;
      return;
    }

    items.forEach(item => {
      const div = document.createElement('div');
      div.className = 'chat-item';

      const a = document.createElement('a');
      a.className = 'chat-title';
      a.href = item.url;
      a.target = '_blank';
      a.innerText = item.title;

      const unarchiveBtn = document.createElement('button');
      unarchiveBtn.className = 'unarchive-btn';
      unarchiveBtn.innerText = '↩️';
      unarchiveBtn.title = 'Unarchive';
      unarchiveBtn.addEventListener('click', () => unarchive(item.id));

      div.appendChild(a);
      div.appendChild(unarchiveBtn);
      listEl.appendChild(div);
    });
  }

  function loadArchives() {
    chrome.storage.local.get(['archivedChats'], (res) => {
      archivedData = res.archivedChats || {};
      renderList(searchInput.value);
    });
  }

  function unarchive(id) {
    delete archivedData[id];
    chrome.storage.local.set({ archivedChats: archivedData }, () => {
      renderList(searchInput.value);
      // Notify content script to update Gemini sidebar
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'refreshSidebar' });
        }
      });
    });
  }

  searchInput.addEventListener('input', (e) => renderList(e.target.value));
  loadArchives();
});