function getDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

const keyNeighbors = {
  a: ['s', 'q', 'w', 'z'], b: ['v', 'g', 'h', 'n'], c: ['x', 'd', 'f', 'v'],
  d: ['s', 'e', 'r', 'f', 'c', 'x'], e: ['w', 's', 'd', 'r'],
  f: ['d', 'r', 't', 'g', 'v', 'c'], g: ['f', 't', 'y', 'h', 'b', 'v'],
  h: ['g', 'y', 'u', 'j', 'n', 'b'], i: ['u', 'j', 'k', 'o'],
  j: ['h', 'u', 'i', 'k', 'm', 'n'], k: ['j', 'i', 'o', 'l', 'm'],
  l: ['k', 'o', 'p'], m: ['n', 'j', 'k'], n: ['b', 'h', 'j', 'm'],
  o: ['i', 'k', 'l', 'p'], p: ['o', 'l'], q: ['w', 'a'],
  r: ['e', 'd', 'f', 't'], s: ['a', 'w', 'e', 'd', 'x', 'z'],
  t: ['r', 'f', 'g', 'y'], u: ['y', 'h', 'j', 'i'],
  v: ['c', 'f', 'g', 'b'], w: ['q', 'a', 's', 'e'],
  x: ['z', 's', 'd', 'c'], y: ['t', 'g', 'h', 'u'], z: ['a', 's', 'x']
}

function fuzzyScore(input, target) {
  input = input.toLowerCase();
  target = target.toLowerCase();
  let score = 0, lastIndex = -1;

  for (let i = 0; i < input.length;) {
    const char = input[i];
    const directIndex = target.indexOf(char, lastIndex + 1);

    if (directIndex !== -1) {
      score += directIndex - lastIndex - 1;
      lastIndex = directIndex;
      i++;
      continue;
    }

    let foundNeighbor = false;
    for (let j = lastIndex + 1; j < target.length; j++) {
      if (keyNeighbors[char]?.includes(target[j])) {
        score += 2 + (j - lastIndex - 1);
        lastIndex = j;
        foundNeighbor = true;
        break;
      }
    }

    if (foundNeighbor) {
      i++;
      continue;
    }

    if (i + 1 < input.length && lastIndex + 2 < target.length &&
        input[i] === target[lastIndex + 2] &&
        input[i + 1] === target[lastIndex + 1]) {
      score += 3;
      lastIndex += 2;
      i += 2;
      continue;
    }
    return null;
  }
  return score + (target.length - input.length);
}

function levenshteinDistance(a, b) {
  const dp = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(0));

  for (let i = 0; i <= a.length; i++) dp[i][0] = i;

  for (let j = 0; j <= b.length; j++) dp[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

function scoreTermAgainstFields(term, domain, url, title) {
  const maxScore = 100;

  function baseScore(fuzzy, exactMatch, fieldText) {
    if (exactMatch) return maxScore;
    if (fuzzy === null) return 0;

    const dist = levenshteinDistance(term, fieldText);
    const editPenalty = Math.max(0, maxScore - dist * 5);

    return (maxScore - fuzzy) * 0.7 + editPenalty * 0.3;
  }

  const dExact = domain.includes(term);
  const tExact = title.includes(term);
  const uExact = url.includes(term);

  const dFuzzy = fuzzyScore(term, domain);
  const tFuzzy = fuzzyScore(term, title);
  const uFuzzy = fuzzyScore(term, url);

  return baseScore(dFuzzy, dExact, domain) * 1.5 +
         baseScore(tFuzzy, tExact, title) * 1.2 +
         baseScore(uFuzzy, uExact, url);
}


function getFuzzyMatches(tabs, input, maxResults = 10) {
  const terms = input.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];

  const results = [];

  for (const tab of tabs) {
    const url = (tab.url || '').toLowerCase();
    const title = (tab.title || '').toLowerCase();
    const domain = getDomain(url).toLowerCase();

    let totalScore = 0, allMatched = true;

    for (const term of terms) {
      const score = scoreTermAgainstFields(term, domain, url, title);

      if (score === 0) {
        allMatched = false;
        break;
      }
      totalScore += score;
    }
    if (allMatched) results.push({ tab, score: totalScore });
  }
  return results.sort((a, b) => b.score - a.score).slice(0, maxResults).map(r => r.tab);
}
