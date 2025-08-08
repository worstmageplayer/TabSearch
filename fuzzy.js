function getDomain(url) {
  try {
    const host = new URL(url).hostname;
    return host.startsWith('www.') ? host.slice(4) : host;
  } catch {
    return '';
  }
}

function fuzzyScore(pattern, target) {
  let score = 0;
  let patternIndex = 0;
  let startMatch = false;
  const patternLength = pattern.length;
  const targetLength = target.length;

  for (let i = 0; i < targetLength && patternIndex < patternLength; i++) {
    if (target[i].toLowerCase() === pattern[patternIndex].toLowerCase()) {
      startMatch = true;
      if (i > 0 && target[i - 1].toLowerCase() === pattern[patternIndex - 1].toLowerCase()) {
        score += 20;
      } else {
        score += 10;
      }
      if (target[i] === pattern[patternIndex]) score += 3;
      patternIndex++;
    } else if (startMatch) {
      score -= 1;
    }
    if (targetLength - i < patternLength - patternIndex) return 0;
  }

  return patternIndex === patternLength ? score : 0;
}

function scoreTermAgainstFields(term, domain, title) {
  const dScore = fuzzyScore(term, domain);
  const tScore = fuzzyScore(term, title);
  return dScore * 1.5 > tScore ? dScore * 1.5 : tScore;
}

function getFuzzyMatches(tabs, input) {
  const terms = input.split(/\s+/).filter(Boolean);
  if (!terms.length) return [];

  const preprocessed = new Array(tabs.length);
  for (let i = 0; i < tabs.length; i++) {
    const tab = tabs[i];
    const url = tab.url || '';
    preprocessed[i] = {
      ...tab,
      domain: getDomain(url),
      title: tab.title || ''
    };
  }

  let candidates = preprocessed;
  for (const term of terms) {
    const matches = [];
    for (let i = 0; i < candidates.length; i++) {
      const tab = candidates[i];
      const score = scoreTermAgainstFields(term, tab.domain, tab.title);
      if (score > 0) matches.push({ tab, score });
    }
    if (!matches.length) return [];
    matches.sort((a, b) => b.score - a.score);
    candidates = matches.map(m => m.tab);
  }

  return candidates;
}
