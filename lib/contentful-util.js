const { documentToHtmlString } = require('@contentful/rich-text-html-renderer');
const pkg = require('../package.json');

function normalizeEntries({ contentTypes, entries, options }) {
    return entries.map(entry => normalizeEntry({ contentTypes, entry, options }));
}

function normalizeEntry({ contentTypes, entry, options }) {
    if (!entry.fields) {
        return entry;
    }

    const isAsset = entry.sys.type === 'Asset';
    const contentTypeId = entry.sys.contentType && entry.sys.contentType.sys && entry.sys.contentType.sys.id;
    const contentType =
        contentTypeId &&
        contentTypes.find(contentType => {
            return contentType.sys && contentType.sys.id === contentTypeId;
        });

    let fields;

    if (isAsset) {
        const file = Object.values(entry.fields.file)[0];

        fields = {
            contentType: file.contentType,
            fileName: file.fileName,
            url: `https:${file.url}`
        };
    } else {
        fields = Object.keys(entry.fields).reduce((fieldsWithoutLocale, fieldName) => {
            const value = Object.values(entry.fields[fieldName])[0];
            const fieldSchema = contentType && contentType.fields.find(({ id }) => id === fieldName);

            if (fieldSchema && fieldSchema.type === 'RichText' && options.richTextOutputFormat === 'html') {
                return {
                    ...fieldsWithoutLocale,
                    [fieldName]: documentToHtmlString(value)
                };
            }

            return {
                ...fieldsWithoutLocale,
                [fieldName]: Array.isArray(value)
                    ? value.map(item => normalizeEntry({ contentTypes, entry: item, options }))
                    : normalizeEntry({ contentTypes, entry: value, options })
            };
        }, {});
    }

    const metadata = {
        id: entry.sys.id,
        source: pkg.name,
        modelName: isAsset ? '__asset' : entry.sys.contentType.sys.id,
        projectId: entry.sys.space.sys.id,
        projectEnvironment: entry.sys.environment.sys.id,
        createdAt: entry.sys.createdAt,
        updatedAt: entry.sys.updatedAt
    };

    return Object.assign({}, fields, { __metadata: metadata });
}

function resolveLink(value, assets, entries) {
    if (Array.isArray(value)) {
        return value.map(childValue => resolveLink(childValue, assets, entries));
    }

    if (value.sys && value.sys.type === 'Link') {
        const searchPool = value.sys.linkType === 'Asset' ? assets : entries;
        const match = searchPool.find(item => item.sys && item.sys.id === value.sys.id);

        if (match) {
            return resolveLinksInEntry(match, assets, entries);
        }
    }

    return value;
}

function resolveLinksInEntry(entry, assets, entries) {
    if (!entry.fields) return entry;

    const resolvedFields = Object.keys(entry.fields).reduce((result, fieldName) => {
        const localeKey = Object.keys(entry.fields[fieldName])[0];
        const value = resolveLink(entry.fields[fieldName][localeKey], assets, entries);

        result[fieldName] = {
            [localeKey]: value
        };

        return result;
    }, {});

    return {
        ...entry,
        fields: resolvedFields
    };
}

module.exports = {
    normalizeEntries,
    normalizeEntry,
    resolveLinksInEntry
};
