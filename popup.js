let tabs = [];
let selectedIndex = 0;
let mouseMoved = false;

const searchInput = document.getElementById('search');
const resultsList = document.getElementById('results');

chrome.tabs.query({}, (foundTabs) => {
  tabs = foundTabs;
});

window.addEventListener('DOMContentLoaded', () => {
  searchInput.style.marginBottom = '0px';
  setTimeout(() => searchInput.focus(), 10);
});

window.addEventListener('mousemove', () => {
  mouseMoved = true;
}), { once: true };

searchInput.addEventListener('input', onInput);
searchInput.addEventListener('keydown', onKeyDown);

function onInput(e) {
  const query = e.target.value.trim();
  resultsList.innerHTML = '';

  if (!query) {
    selectedIndex = 0;
    tabs.forEach(renderTabEntry);
    updateSelection()
    return;
  }

  resultsList.style.display = 'block';
  searchInput.style.marginBottom = '10px';
  selectedIndex = 0;

  const matchedTabs = getFuzzyMatches(tabs, query);
  matchedTabs.forEach(renderTabEntry);
  renderSearchEntry(query);
  updateSelection();
}

function onKeyDown(e) {
  const items = document.querySelectorAll('#results li');

  if (e.key === 'Enter' && items[selectedIndex]) {
    items[selectedIndex].click();
    window.close();
  }

  if (e.key === 'Escape') {
    window.close();
  }

  if (e.altKey && e.key === 'j') {
    e.preventDefault();
    if (selectedIndex < items.length - 1) selectedIndex++;
    updateSelection();
  }

  if (e.altKey && e.key === 'k') {
    e.preventDefault();
    if (selectedIndex > 0) selectedIndex--;
    updateSelection();
  }

  if (e.altKey && e.key === 'g') {
    e.preventDefault();
    const items = document.querySelectorAll('#results li');

    if (selectedIndex === items.length - 1) {
      selectedIndex = 0;
    } else {
      selectedIndex = items.length - 1;
    }
    updateSelection();
  }
}

function renderTabEntry(tab) {
  const li = createResultItem(tab.favIconUrl || 'icon.png', tab.title || tab.url);

  li.addEventListener('click', () => {
    chrome.tabs.update(tab.id, { active: true });
    chrome.windows.update(tab.windowId, { focused: true });
    window.close();
  });

  li.addEventListener('mouseenter', () => {
    if (!mouseMoved) return;
    selectedIndex = Array.from(resultsList.children).indexOf(li);
    updateSelection();
  });

  resultsList.appendChild(li);
}

function renderSearchEntry(query) {
  const isDomain = /^[a-zA-Z0-9.-]+\.[a-z]{2,}$/.test(query);
  const targetUrl = isDomain
    ? `https://${query}`
    : `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  const iconUrl = isDomain
    ? `https://www.google.com/s2/favicons?sz=64&domain=${query}`
    : `https://www.google.com/s2/favicons?sz=64&domain=google.com`;
  const label = isDomain ? `Open ${query}` : `Search "${query}" on Google`;

  const li = createResultItem(iconUrl, label);

  li.addEventListener('click', () => {
    chrome.tabs.create({ url: targetUrl });
    window.close();
  });

  selectedIndex = 0;
  updateSelection();

  resultsList.appendChild(li);
}

function createResultItem(iconSrc, labelText) {
  const li = document.createElement('li');
  li.style.display = 'flex';
  li.style.alignItems = 'center';

  const icon = document.createElement('img');
  icon.src = iconSrc;
  icon.width = 16;
  icon.height = 16;
  icon.style.marginRight = '8px';
  icon.style.borderRadius = '2px';
  icon.style.objectFit = 'cover';

  const label = document.createElement('span');
  label.textContent = labelText;

  li.appendChild(icon);
  li.appendChild(label);
  return li;
}

function updateSelection() {
  const items = document.querySelectorAll('#results li');
  items.forEach((item, i) => {
    item.style.backgroundColor = i === selectedIndex ? '#444' : '#2a2a2a';
  });

  if (selectedIndex >= 0 && items[selectedIndex]) {
    items[selectedIndex].scrollIntoView({ block: 'nearest' });
  }
}
