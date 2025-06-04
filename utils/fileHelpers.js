const fs = require('fs').promises;

async function safeReadJSON(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return data ? JSON.parse(data) : [];
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    console.error(`Error reading or parsing ${filePath}:`, err);
    return [];
  }
}

async function safeWriteJSON(filePath, data) {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error(`Error writing to ${filePath}:`, err);
    throw err;
  }
}

module.exports = { safeReadJSON, safeWriteJSON };
