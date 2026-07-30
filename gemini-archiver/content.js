// Local cache of archived IDs/URLs
let archivedChats = {};

// Load existing archives
chrome.storage.local.get(['archivedChats'], (result) => {
  archivedChats = result.archivedChats || {};
  processSidebar();
});

// Observe DOM changes to handle dynamically loaded chats in sidebar
const observer = new MutationObserver(() => {
  processSidebar();
});

observer.observe(document.body, { childList: true, subtree: true });

function processSidebar() {
  // Select sidebar conversation containers in Gemini DOM
  const chatLinks = document.querySelectorAll('a[href*="/app/"]');

  chatLinks.forEach((link) => {
    const href = link.getAttribute('href');
    if (!href) return;

    // Extract unique conversation ID from link
    const match = href.match(/\/app\/([a-zA-Z0-9_-]+)/);
    if (!match) return;
    const chatId = match[1];

    // Hide if already archived
    if (archivedChats[chatId]) {
      const parentContainer = link.closest('li') || link.parentElement;
      if (parentContainer) parentContainer.style.display = 'none';
      return;
    }

    // Add Archive button if not already injected
    if (!link.querySelector('.gemini-archive-btn')) {
      const archiveBtn = document.createElement('button');
      archiveBtn.className = 'gemini-archive-btn';
      archiveBtn.title = 'Archive conversation';
      archiveBtn.style.cssText = `
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 0;
        margin-right: 8px;
        opacity: 0.75;
        flex-shrink: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: opacity 0.2s, transform 0.1s;
      `;

      // Create logo image element
      const iconImg = document.createElement('img');
      iconImg.src = chrome.runtime.getURL('icon.png');
      iconImg.style.cssText = `
        width: 16px;
        height: 16px;
        object-fit: contain;
        display: block;
      `;

      archiveBtn.appendChild(iconImg);

      // Hover effects
      archiveBtn.addEventListener('mouseenter', () => {
        archiveBtn.style.opacity = '1';
        archiveBtn.style.transform = 'scale(1.1)';
      });
      archiveBtn.addEventListener('mouseleave', () => {
        archiveBtn.style.opacity = '0.75';
        archiveBtn.style.transform = 'scale(1)';
      });

      // Handle archive action
      archiveBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const title = link.innerText.trim() || 'Untitled Chat';
        archiveConversation(chatId, title, href);
      });

      // Insert icon at the front of the chat link
      link.prepend(archiveBtn);
    }
  });
}

function archiveConversation(id, title, path) {
  archivedChats[id] = {
    id,
    title,
    url: `https://gemini.google.com${path}`,
    archivedAt: new Date().toISOString()
  };

  chrome.storage.local.set({ archivedChats }, () => {
    processSidebar(); // Re-process to hide item
  });
}

// Listen for Unarchive actions from popup
chrome.runtime.onMessage.addListener((request) => {
  if (request.action === 'refreshSidebar') {
    chrome.storage.local.get(['archivedChats'], (result) => {
      archivedChats = result.archivedChats || {};
      const chatLinks = document.querySelectorAll('a[href*="/app/"]');
      chatLinks.forEach((link) => {
        const href = link.getAttribute('href');
        const match = href ? href.match(/\/app\/([a-zA-Z0-9_-]+)/) : null;
        if (match && !archivedChats[match[1]]) {
          const parentContainer = link.closest('li') || link.parentElement;
          if (parentContainer) parentContainer.style.display = '';
        }
      });
    });
  }
});