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
  let consecutive = 0;
  let firstMatchIdx = -1;

  for (let i = 0; i < target.length && patternIdx < pattern.length; i++) {
    if (target[i] === pattern[patternIdx]) {
      if (firstMatchIdx === -1) firstMatchIdx = i;

      if (i > 0 && target[i - 1] === pattern[patternIdx - 1]) {
        consecutive += 1;
        score += 10;
      } else {
        score += 5;
        consecutive = 0;
      }

      patternIdx++;
    } else {
      score -= 1;
      consecutive = 0;
    }
  }

  if (patternIdx !== pattern.length) return null;

  score += Math.max(0, 20 - firstMatchIdx);

  return score;
}

function baseScore(score, exact, target, term) {
  const maxScore = 100;

  if (exact) return maxScore;
  if (score === null) return 0;

  if (target.startsWith(term)) return Math.max(maxScore - 5, score);

  return Math.max(0, score);
}

function scoreTermAgainstFields(term, domain, url, title) {
  const dExact = domain.includes(term);
  const tExact = title.includes(term);
  const uExact = url.includes(term);

  const dScore = fuzzyScore(term, domain);
  const tScore = fuzzyScore(term, title);
  const uScore = fuzzyScore(term, url);

  return baseScore(dScore, dExact, domain, term) * 3.0 +
         baseScore(tScore, tExact, title, term) * 1.5 +
         baseScore(uScore, uExact, url, term) * 1.0;
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

