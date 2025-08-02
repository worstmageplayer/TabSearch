function getDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function fuzzyScore(pattern, target) {
  let score = 0;
  let patternIdx = 0;
  let startMatch = false;

  for (let i = 0; i < target.length && patternIdx < pattern.length; i++) {
    if (target[i] === pattern[patternIdx]) {
      startMatch = true;

      if (i > 0 && target[i - 1] === pattern[patternIdx - 1]) {
        score += 20;
      } else score += 10;

      patternIdx++;
    } else if (startMatch) {
      score -= 1;
    }
  }

  return patternIdx === pattern.length ? score : 0;
}

function scoreTermAgainstFields(term, domain, title) {
  const dScore = fuzzyScore(term, domain);
  const tScore = fuzzyScore(term, title);

  return Math.max(dScore * 1.5, tScore);
}

function getFuzzyMatches(tabs, input) {
  const terms = input.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];

  let filtered = tabs.map(tab => {
      const url = tab.url || '';
      return {
          ...tab,
          domain: getDomain(url).toLowerCase(),
          title: (tab.title || '').toLowerCase(),
      }
  });

  for (const term of terms) {
    const scored = filtered
      .map(item => {
        const score = scoreTermAgainstFields(term, item.domain, item.title);
        return score > 0 ? { tab: item, score } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score);

    filtered = scored.map(r => r.tab);
    if (filtered.length === 0) break;
  }

  return filtered;
}
