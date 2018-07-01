module.exports = function(source) {
  const changelog = [];

  let current = null;

  source.split(/\r?\n/).forEach(/** @param {string} line */ (line) => {
    if (line.startsWith("# ")) {
      if (current) {
        changelog.push(current);
      }

      const match = /^# v?(Next|[\d.]+)( \((.*)\))?/.exec(line);

      if (match) {
        current = {
          version: match[1],
          date: match[3],
          changes: []
        };
      } else {
        this.emitWarning(new Error(`Unparseable changelog line: ${line}`));
      }
    } else if (line.startsWith("* ") && current) {
      current.changes.push(line.replace(/^\* /, ''));
    }
  });

  if (current) {
    changelog.push(current);
  }

  return `export default ${JSON.stringify(changelog)}`;
};
