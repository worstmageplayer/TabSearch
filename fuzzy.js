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
        score += 10;
      } else score += 5;

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

  return dScore * 1.5 + tScore;
}

function getFuzzyMatches(tabs, input) {
  const terms = input.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];

  return tabs
    .map(tab => {
      const url = tab.url || '';
      const title = (tab.title || '').toLowerCase();
      const domain = getDomain(url).toLowerCase();

      const totalScore = terms.reduce(
        (score, term) => score + scoreTermAgainstFields(term, domain, title),
        0
      );

      console.log('Checking tab:', domain, title, '→ Score:', totalScore);
      return totalScore > 0 ? { tab, score: totalScore } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .map(r => r.tab);
}
