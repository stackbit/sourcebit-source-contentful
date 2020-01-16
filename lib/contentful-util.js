const pkg = require("../package.json");

function normalizeEntries(entries) {
  return entries.map(normalizeEntry);
}

function normalizeEntry(entry) {
  const fields = Object.keys(entry.fields).reduce(
    (fieldsWithoutLocale, fieldName) => {
      const value = Object.values(entry.fields[fieldName])[0];

      fieldsWithoutLocale[fieldName] = Array.isArray(value)
        ? value.map(item => resolveLink(item))
        : resolveLink(value);

      return fieldsWithoutLocale;
    },
    {}
  );
  const metadata = {
    id: entry.sys.id,
    source: pkg.name,
    modelName:
      entry.sys.type === "Asset" ? "__asset" : entry.sys.contentType.sys.id,
    projectId: entry.sys.space.sys.id,
    projectEnvironment: entry.sys.environment.sys.id,
    createdAt: entry.sys.createdAt,
    updatedAt: entry.sys.updatedAt
  };

  return Object.assign({}, fields, { __metadata: metadata });
}

function resolveLink(entry) {
  if (entry.sys && entry.fields) {
    return normalizeEntry(entry);
  }

  return entry;
}

module.exports = {
  normalizeEntries,
  normalizeEntry
};
