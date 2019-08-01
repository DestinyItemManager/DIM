function findMatch(sourceFileLine: string, regExToMatch: RegExp): string | undefined {
  if (!sourceFileLine || !sourceFileLine.length) {
    return undefined;
  }

  const matchResults = sourceFileLine.match(regExToMatch);

  if (!matchResults || matchResults.length !== 2) {
    return undefined;
  }

  console.log(matchResults);

  return matchResults[1];
}

function findTitle(sourceFileLine: string): string | undefined {
  return findMatch(sourceFileLine, /^title:(.*)/);
}

function findDescription(sourceFileLine: string): string | undefined {
  return findMatch(sourceFileLine, /^description:(.*)/);
}

/*
 * Will extract the title of a DIM wish list from a source file.
 * The title should follow the following format:
 * title:This Is My Source File Title.
 *
 * It will only look at the first 20 lines of the file for the title,
 * and the first line that looks like a title will be returned.
 */
export function getTitle(sourceFileText: string): string | undefined {
  if (!sourceFileText) {
    return undefined;
  }

  const sourceFileLineArray = sourceFileText.split('\n').slice(0, 20);

  return sourceFileLineArray.map(findTitle).find((s) => s);
}

/*
 * Will extract the description of a DIM wish list from a source file.
 * The description should follow the following format:
 * description:This Is My Source File Description And Maybe It Is Longer.
 *
 * It will only look at the first 20 lines of the file for the description,
 * and the first line that looks like a description will be returned.
 */
export function getDescription(sourceFileText: string): string | undefined {
  if (!sourceFileText) {
    return undefined;
  }

  const sourceFileLineArray = sourceFileText.split('\n').slice(0, 20);

  return sourceFileLineArray.map(findDescription).find((s) => s);
}
