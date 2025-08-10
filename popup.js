let tabs = [];
let selectedIndex = 0;
let mouseMoved = false;
let currentResults = [];

const searchInput = document.getElementById('search');
const resultsList = document.getElementById('results');

chrome.tabs.query({}, (foundTabs) => {
    tabs = foundTabs;
});

window.addEventListener('DOMContentLoaded', () => {
    searchInput.style.marginBottom = '0px';
    setTimeout(() => searchInput.focus(), 50);
});

window.addEventListener('mousemove', () => {
    mouseMoved = true;
}, { once: true });

resultsList.addEventListener('click', handleResultClick);
resultsList.addEventListener('mouseenter', handleResultMouseEnter, true);

searchInput.addEventListener('input', debounce(onInput, 50));
searchInput.addEventListener('keydown', onKeyDown);

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function onInput(e) {
    const query = e.target.value.trim();
    clearResults();

    if (!query) {
        selectedIndex = 0;
        searchInput.style.marginBottom = '10px';
        currentResults = tabs.map((tab, index) => ({ type: 'tab', data: tab, index }));
        tabs.forEach((tab, index) => renderTabEntry(tab, index));
        updateSelection();
        return;
    }

    resultsList.style.display = 'block';
    searchInput.style.marginBottom = '10px';
    selectedIndex = 0;

    const matchedTabs = getFuzzyMatches(tabs, query);
    currentResults = [];

    matchedTabs.forEach((tab, index) => {
        const originalTab = tabs.find(t => t.id === tab.id) || tab;
        currentResults.push({ type: 'tab', data: tab, index });
        renderTabEntry(originalTab, index);
    });

    const searchEntry = { type: 'search', data: { query }, index: currentResults.length };
    currentResults.push(searchEntry);
    renderSearchEntry(query, currentResults.length - 1);

    updateSelection();
}

function onKeyDown(e) {
    const items = document.querySelectorAll('#results li');

    if (e.key === 'Enter' && items[selectedIndex]) {
        handleResultClick({ target: items[selectedIndex] });
        window.close();
        return;
    }

    if (e.key === 'Escape') {
        window.close();
        return;
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
        if (selectedIndex === items.length - 1) {
            selectedIndex = 0;
        } else {
            selectedIndex = items.length - 1;
        }
        updateSelection();
    }
}

function isDomain(str) {
    if (typeof str !== 'string') return false;
    const domain = str.split('/')[0];
    const domainRegex = /^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;
    return domainRegex.test(domain);
}

function handleResultClick(e) {
    const closeBtn = e.target.closest('.close-btn');
    if (closeBtn) {
        const tabId = parseInt(closeBtn.dataset.tabId);
        chrome.tabs.remove(tabId, () => {
            tabs = tabs.filter(t => t.id !== tabId);
            onInput({ target: searchInput });
        });
        return;
    }

    const li = e.target.closest('li');
    if (!li) return;

    const index = parseInt(li.dataset.index);
    const result = currentResults[index];

    if (!result) return;

    if (result.type === 'tab') {
        chrome.tabs.update(result.data.id, { active: true });
        chrome.windows.update(result.data.windowId, { focused: true });
    } else if (result.type === 'search') {
        const targetUrl = isDomain(result.data.query)
            ? `https://${result.data.query}`
            : `https://www.google.com/search?q=${encodeURIComponent(result.data.query)}`;
        chrome.tabs.create({ url: targetUrl });
    }

    window.close();
}

function handleResultMouseEnter(e) {
    if (!mouseMoved) return;

    const li = e.target.closest('li');
    if (!li) return;

    const index = parseInt(li.dataset.index);
    if (index >= 0) {
        selectedIndex = index;
        updateSelection();
    }
}

function renderTabEntry(tab, index) {
    const li = createResultItem(
        tab.favIconUrl || 'icon.png',
        tab.title || tab.url,
        index,
        true,
        tab.id
    );
    resultsList.appendChild(li);
}

function renderSearchEntry(query, index) {
    let iconUrl, label;

    if (isDomain(query)) {
        iconUrl = `https://www.google.com/s2/favicons?sz=64&domain=${query}`;
        label = `Open ${query}`;
    } else {
        iconUrl = `https://www.google.com/s2/favicons?sz=64&domain=google.com`;
        label = `Search "${query}" on Google`;
    }

    const li = createResultItem(iconUrl, label, index);
    resultsList.appendChild(li);
}

function createResultItem(iconSrc, labelText, index, isTab = false, tabId = null) {
    const li = document.createElement('li');
    li.className = 'result-item';
    li.dataset.index = index;

    const icon = document.createElement('img');
    icon.src = iconSrc;
    icon.width = 16;
    icon.height = 16;
    icon.className = 'result-icon';

    icon.onerror = () => {
        icon.src = 'icon.png';
    };

    const label = document.createElement('span');
    label.textContent = labelText;
    label.className = 'result-label';

    li.appendChild(icon);
    li.appendChild(label);

    if (isTab) {
        const closeBtn = document.createElement('span');
        closeBtn.innerHTML = '&#10006';
        closeBtn.className = 'close-btn';
        closeBtn.dataset.tabId = tabId;
        li.appendChild(closeBtn);
    }

    return li;
}

function clearResults() {
    resultsList.innerHTML = '';
    currentResults = [];
}

function updateSelection() {
    const items = document.querySelectorAll('#results li');
    items.forEach((item, i) => {
        if (i === selectedIndex) {
            item.classList.add('selected');
        } else {
            item.classList.remove('selected');
        }
    });

    if (selectedIndex >= 0 && items[selectedIndex]) {
        items[selectedIndex].scrollIntoView({ block: 'nearest' });
    }
}
