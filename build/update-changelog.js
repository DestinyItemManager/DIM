#!/usr/bin/env node

import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function extractChangelogEntries(commits) {
  const entries = [];

  if (!Array.isArray(commits)) {
    console.error('Commits is not an array:', typeof commits);
    return entries;
  }

  for (const commit of commits) {
    if (!commit || typeof commit.message !== 'string') {
      console.error('Invalid commit object:', commit);
      continue;
    }

    const message = commit.message;
    const lines = message.split('\n');

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.toLowerCase().startsWith('changelog:')) {
        // Extract text after "Changelog:" and trim whitespace
        const changelogText = trimmedLine.substring(10).trim();
        if (changelogText) {
          entries.push(changelogText);
        }
      }
    }
  }

  return entries;
}

function updateChangelog(entries, originalChangelog) {
  if (entries.length === 0) {
    // No entries to add, return original content unchanged
    return originalChangelog;
  }

  // Find the "## Next" section
  const nextSectionRegex = /^## Next\s*$/m;
  const nextMatch = originalChangelog.match(nextSectionRegex);

  if (!nextMatch) {
    console.error('Could not find "## Next" section in CHANGELOG.md');
    process.exit(1);
  }

  // Find the position after the "## Next" line
  const nextSectionIndex = nextMatch.index + nextMatch[0].length;

  // Look for the next section (next "##" header) or end of file
  const afterNextSection = originalChangelog.substring(nextSectionIndex);
  const nextHeaderMatch = afterNextSection.match(/^## /m);

  let insertPosition;
  let existingContent = '';

  if (nextHeaderMatch) {
    // There's another section after "## Next"
    const nextHeaderIndex = nextSectionIndex + nextHeaderMatch.index;
    existingContent = originalChangelog.substring(nextSectionIndex, nextHeaderIndex).trim();
    insertPosition = nextHeaderIndex;
  } else {
    // "## Next" is the last section
    existingContent = originalChangelog.substring(nextSectionIndex).trim();
    insertPosition = originalChangelog.length;
  }

  // Format new entries as bullet points
  const newEntries = entries.map((entry) => `* ${entry}`).join('\n');

  // Build the new content for the "## Next" section
  let newNextContent = '';
  if (existingContent) {
    // Preserve existing content and add new entries
    newNextContent = `\n\n${existingContent}\n${newEntries}\n\n`;
  } else {
    // No existing content, just add new entries
    newNextContent = `\n\n${newEntries}\n\n`;
  }

  // Construct the new changelog content
  const newChangelogContent =
    originalChangelog.substring(0, nextSectionIndex) +
    newNextContent +
    originalChangelog.substring(insertPosition);

  return newChangelogContent;
}

async function readStdin() {
  const chunks = [];
  process.stdin.setEncoding('utf8');

  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }

  return chunks.join('');
}

async function main() {
  try {
    // Read commits JSON from stdin
    const commitsData = await readStdin();
    const commits = JSON.parse(commitsData);

    console.error(`Processing ${commits.length} commits...`);

    // Extract changelog entries from commit messages
    const changelogEntries = extractChangelogEntries(commits);

    // Read the current changelog
    const changelogPath = join(__dirname, '..', 'docs', 'CHANGELOG.md');
    let changelog = readFileSync(changelogPath, 'utf8');

    // Update the changelog content

    if (changelogEntries.length > 0) {
      changelog = updateChangelog(changelogEntries, changelog);
    }

    // Output the updated changelog to stdout
    process.stdout.write(changelog);

    console.error(`Successfully processed ${changelogEntries.length} changelog entries:`);
    changelogEntries.forEach((entry) => console.error(`  * ${entry}`));
  } catch (error) {
    console.error('Error processing commits:', error.message);
    process.exit(1);
  }
}

main();
