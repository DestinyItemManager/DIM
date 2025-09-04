#!/usr/bin/env node

import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// GitHub API functions
async function fetchCommitFromAPI(owner, repo, sha, token) {
  const url = `https://api.github.com/repos/${owner}/${repo}/commits/${sha}`;
  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'DIM-Changelog-Updater',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch commit ${sha}: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

async function fetchAssociatedPRsFromGraphQL(owner, repo, sha, token) {
  const query = `
    query associatedPRs($sha: String!, $repo: String!, $owner: String!) {
      repository(name: $repo, owner: $owner) {
        commit: object(expression: $sha) {
          ... on Commit {
            associatedPullRequests(first: 5) {
              edges {
                node {
                  title
                  number
                  body
                  merged
                }
              }
            }
          }
        }
      }
    }
  `;

  const variables = { sha, repo, owner };

  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'DIM-Changelog-Updater',
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();

  if (result.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
  }

  // Extract the PRs from the GraphQL response
  const commit = result.data?.repository?.commit;
  if (!commit?.associatedPullRequests?.edges) {
    return [];
  }

  return commit.associatedPullRequests.edges.map((edge) => edge.node).filter((pr) => pr.merged); // Only return merged PRs
}

function extractChangelogEntries(commits) {
  const entries = [];

  if (!Array.isArray(commits)) {
    console.error('Commits is not an array:', typeof commits);
    return entries;
  }

  for (const commit of commits) {
    if (!commit || typeof commit.commit?.message !== 'string') {
      console.error('Invalid commit object:', commit);
      continue;
    }

    // Use the full commit message from the API response
    const message = commit.commit.message;
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

function extractChangelogEntriesFromText(text, source = 'unknown') {
  const entries = [];

  if (typeof text !== 'string') {
    console.error(`Invalid text from ${source}:`, typeof text);
    return entries;
  }

  const lines = text.split('\n');

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.toLowerCase().startsWith('changelog:')) {
      // Extract text after "Changelog:" and trim whitespace
      const changelogText = trimmedLine.substring(10).trim();
      if (changelogText) {
        console.error(`Found changelog entry from ${source}: ${changelogText}`);
        entries.push(changelogText);
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
    newNextContent = `\n${existingContent}\n${newEntries}\n\n`;
  } else {
    // No existing content, just add new entries
    newNextContent = `\n${newEntries}\n\n`;
  }

  // Construct the new changelog content
  const newChangelogContent =
    originalChangelog.substring(0, nextSectionIndex) +
    newNextContent +
    originalChangelog.substring(insertPosition);

  return newChangelogContent;
}

async function fetchCommitsFromAPI(commitShas, githubToken, githubRepository) {
  const [owner, repo] = githubRepository.split('/');
  const commits = [];

  for (const sha of commitShas) {
    if (sha.trim()) {
      try {
        const commit = await fetchCommitFromAPI(owner, repo, sha.trim(), githubToken);
        commits.push(commit);
        console.error(
          `Fetched commit ${sha.substring(0, 7)}: ${commit.commit.message.split('\n')[0]}`,
        );
      } catch (error) {
        console.error(`Failed to fetch commit ${sha}: ${error.message}`);
      }
    }
  }

  return commits;
}

async function main() {
  try {
    // Get commit SHAs from command line arguments
    const commitShas = process.argv.slice(2);

    if (commitShas.length === 0) {
      console.error('No commit SHAs provided');
      process.exit(1);
    }

    // Get GitHub token and repository from environment
    const githubToken = process.env.GITHUB_TOKEN;
    const githubRepository = process.env.GITHUB_REPOSITORY;

    if (!githubToken) {
      console.error('GITHUB_TOKEN environment variable is required');
      process.exit(1);
    }

    if (!githubRepository) {
      console.error('GITHUB_REPOSITORY environment variable is required');
      process.exit(1);
    }

    const [owner, repo] = githubRepository.split('/');

    console.error(`Processing ${commitShas.length} commit SHAs...`);

    // Fetch commits from GitHub API
    const commits = await fetchCommitsFromAPI(commitShas, githubToken, githubRepository);

    console.error(`Successfully fetched ${commits.length} commits`);

    // Extract changelog entries from commit messages
    let changelogEntries = extractChangelogEntries(commits);

    // For each commit, check for associated PRs using GraphQL
    const processedPRs = new Set(); // Avoid duplicate PR processing

    for (const sha of commitShas) {
      if (sha.trim()) {
        try {
          console.error(`Checking for associated PRs for commit ${sha.substring(0, 7)}...`);
          const associatedPRs = await fetchAssociatedPRsFromGraphQL(
            owner,
            repo,
            sha.trim(),
            githubToken,
          );

          for (const pr of associatedPRs) {
            // Only process each PR once
            if (!processedPRs.has(pr.number)) {
              processedPRs.add(pr.number);
              console.error(`Found associated PR #${pr.number}: ${pr.title}`);

              const prEntries = extractChangelogEntriesFromText(pr.body || '', `PR #${pr.number}`);
              changelogEntries = changelogEntries.concat(prEntries);
            }
          }
        } catch (error) {
          console.error(`Failed to fetch associated PRs for commit ${sha}: ${error.message}`);
        }
      }
    }

    console.error(`Processed ${processedPRs.size} unique associated PRs`);

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
