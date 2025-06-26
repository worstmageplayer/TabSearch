function getDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function fuzzyScore(pattern, target) {
  pattern = pattern.toLowerCase();
  target = target.toLowerCase();

  let score = 0;
  let patternIdx = 0;

  for (let i = 0; i < target.length && patternIdx < pattern.length; i++) {
    if (target[i] === pattern[patternIdx]) {

      if (i > 0 && target[i - 1] === pattern[patternIdx - 1]) {
          score += 10;
      } else score += 5;

      patternIdx++;
    } else {
      score -= 1;
    }
  }

  return patternIdx === pattern.length ? score : null;
}

function baseScore(score) {
  return score ?? 0;
}

function scoreTermAgainstFields(term, domain, title) {
  const dScore = fuzzyScore(term, domain);
  const tScore = fuzzyScore(term, title);

  return baseScore(dScore) * 1.5 + baseScore(tScore)
}

function getFuzzyMatches(tabs, input) {
  const terms = input.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];

  const results = [];

  for (const tab of tabs) {
    const urlRaw = tab.url || '';
    const title = tab.title || '';
    const domain = getDomain(urlRaw);

    let totalScore = 0;

    for (const term of terms) {
      totalScore += scoreTermAgainstFields(term, domain, title);
    }

    if (totalScore === 0) continue;
    results.push({ tab, score: totalScore });
  }

  return results
    .sort((a, b) => b.score - a.score)
    .map(r => r.tab);
}

