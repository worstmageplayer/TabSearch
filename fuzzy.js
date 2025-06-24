function getDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

function fuzzyScore(input, text) {
  let inputLen = input.length;
  let textLen = text.length;
  let i = 0, j = 0, score = 0, lastMatch = -1;

  while (i < inputLen && j < textLen) {
    if (input[i] === text[j]) {
      if (lastMatch !== -1) score += (j - lastMatch - 1);
      lastMatch = j;
      i++;
    }
    j++;
  }

  return (i === inputLen) ? score + (textLen - inputLen) : null;
}

function getFuzzyMatches(tabs, input, maxResults = 10) {
  if (!input) return [];

  const lowerInput = input.toLowerCase();
  const results = [];

  for (const tab of tabs) {
    const title = (tab.title || '').toLowerCase();
    const url = (tab.url || '').toLowerCase();
    const domain = getDomain(url).toLowerCase();

    const scores = [
      { type: 'domain', score: fuzzyScore(lowerInput, domain), priority: 0 },
      { type: 'title', score: fuzzyScore(lowerInput, title), priority: 1 },
      { type: 'url', score: fuzzyScore(lowerInput, url), priority: 2 }
    ];

    const best = scores.find(s => s.score !== null);
    if (best) {
      results.push({ tab, score: best.score, priority: best.priority });
    }
  }

  results.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.score - b.score;
  });

  return results.slice(0, maxResults).map(r => r.tab);
}

