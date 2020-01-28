const pkg = require("../package.json");

function normalizeEntries(entries) {
  return entries.map(normalizeEntry);
}

function normalizeEntry(entry) {
  if (!entry.fields) {
    return entry;
  }

  const isAsset = entry.sys.type === "Asset";

  let fields;

  if (isAsset) {
    const file = Object.values(entry.fields.file)[0];

    fields = {
      contentType: file.contentType,
      fileName: file.fileName,
      url: `https:${file.url}`
    };
  } else {
    fields = Object.keys(entry.fields).reduce(
      (fieldsWithoutLocale, fieldName) => {
        const value = Object.values(entry.fields[fieldName])[0];

        fieldsWithoutLocale[fieldName] = Array.isArray(value)
          ? value.map(item => normalizeEntry(item))
          : normalizeEntry(value);

        return fieldsWithoutLocale;
      },
      {}
    );
  }

  const metadata = {
    id: entry.sys.id,
    source: pkg.name,
    modelName: isAsset ? "__asset" : entry.sys.contentType.sys.id,
    projectId: entry.sys.space.sys.id,
    projectEnvironment: entry.sys.environment.sys.id,
    createdAt: entry.sys.createdAt,
    updatedAt: entry.sys.updatedAt
  };

  return Object.assign({}, fields, { __metadata: metadata });
}

function resolveLinks(entry, assets, entries) {
  if (!entry.fields) return entry;

  const resolvedFields = Object.keys(entry.fields).reduce(
    (result, fieldName) => {
      const localeKey = Object.keys(entry.fields[fieldName])[0];

      let value = entry.fields[fieldName][localeKey];

      if (value.sys && value.sys.type === "Link") {
        const searchPool = value.sys.linkType === "Asset" ? assets : entries;
        const match = searchPool.find(
          item => item.sys && item.sys.id === value.sys.id
        );

        if (match) {
          value = match;
        }
      }

      result[fieldName] = {
        [localeKey]: value
      };

      return result;
    },
    {}
  );

  return {
    ...entry,
    fields: resolvedFields
  };
}

module.exports = {
  normalizeEntries,
  normalizeEntry,
  resolveLinks
};
