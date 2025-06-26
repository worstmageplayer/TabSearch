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
  if (score === null) return 0;
  return score;
}

function scoreTermAgainstFields(term, domain, url, title) {
  const dScore = fuzzyScore(term, domain);
  const tScore = fuzzyScore(term, title);
  const uScore = fuzzyScore(term, url);

  return baseScore(dScore) * 2.0 +
         baseScore(tScore) * 1.5 +
         baseScore(uScore) * 1.0;
}

function getFuzzyMatches(tabs, input, maxResults = 10) {
  const terms = input.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];

  const results = [];

  for (const tab of tabs) {
    const urlRaw = tab.url || '';
    const titleRaw = tab.title || '';
    const domain = getDomain(urlRaw);

    const url = urlRaw.toLowerCase();
    const title = titleRaw.toLowerCase();
    const domainLower = domain.toLowerCase();

    let totalScore = 0;

    for (const term of terms) {
      totalScore += scoreTermAgainstFields(term, domainLower, url, title);
    }

    if (totalScore === 0) continue;
    results.push({ tab, score: totalScore });
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map(r => r.tab);
}

