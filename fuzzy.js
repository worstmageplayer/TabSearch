function getDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

function fuzzyScore(input, target) {
  input = input.toLowerCase();
  target = target.toLowerCase();

  let score = 0;
  let targetIndex = 0;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    const foundIndex = target.indexOf(char, targetIndex);
    if (foundIndex === -1) return null;
    score += (foundIndex - targetIndex);
    targetIndex = foundIndex + 1;
  }

  return score;
}

function scoreTermAgainstFields(term, domain, url, title) {
  const maxScore = 100;

  function baseScore(score, exact, field) {
    if (exact) return maxScore;
    if (score === null) return 0;
    return Math.max(0, maxScore - score);
  }

  const dExact = domain.includes(term);
  const tExact = title.includes(term);
  const uExact = url.includes(term);

  const dScore = fuzzyScore(term, domain);
  const tScore = fuzzyScore(term, title);
  const uScore = fuzzyScore(term, url);

  return baseScore(dScore, dExact, domain) * 1.5 +
         baseScore(tScore, tExact, title) * 1.2 +
         baseScore(uScore, uExact, url);
}

function getFuzzyMatches(tabs, input, maxResults = 10) {
  const terms = input.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];

  const results = [];

  for (const tab of tabs) {
    const url = (tab.url || '').toLowerCase();
    const title = (tab.title || '').toLowerCase();
    const domain = getDomain(url).toLowerCase();

    let totalScore = 0;
    let allMatched = true;

    for (const term of terms) {
      const score = scoreTermAgainstFields(term, domain, url, title);
      if (score === 0) {
        allMatched = false;
        break;
      }
      totalScore += score;
    }

    if (allMatched) {
      results.push({ tab, score: totalScore });
    }
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map(r => r.tab);
}
