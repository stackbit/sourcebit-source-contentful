const { documentToHtmlString } = require('@contentful/rich-text-html-renderer');
const pkg = require('../package.json');

function normalizeEntries({ contentTypes, entries, defaultLocaleCode, options }) {
    return entries.map(entry => normalizeEntry({ contentTypes, entry, defaultLocaleCode, options }));
}

function normalizeEntry({ contentTypes, entry, defaultLocaleCode, options }) {
    if (!entry) {
        return null;
    }
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
        if (!entry.fields.file) {
            return null;
        }
        const file = getLocalizedFieldValue(entry.fields.file, defaultLocaleCode);

        fields = {
            contentType: file.contentType,
            fileName: file.fileName,
            url: `https:${file.url}`
        };
    } else {
        fields = Object.keys(entry.fields).reduce((fieldsWithoutLocale, fieldName) => {
            const value = getLocalizedFieldValue(entry.fields[fieldName], defaultLocaleCode);
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
                    ? value.map(item => normalizeEntry({ contentTypes, entry: item, defaultLocaleCode, options }))
                    : normalizeEntry({ contentTypes, entry: value, defaultLocaleCode, options })
            };
        }, {});
    }

    const tags = (entry && entry.metadata && entry.metadata.tags || []).map((tag) => {
        return tag.sys.id;
    });

    const metadata = {
        id: entry.sys.id,
        source: pkg.name,
        modelName: isAsset ? '__asset' : entry.sys.contentType.sys.id,
        projectId: entry.sys.space.sys.id,
        projectEnvironment: entry.sys.environment.sys.id,
        tags: tags,
        createdAt: entry.sys.createdAt,
        updatedAt: entry.sys.updatedAt
    };

    return Object.assign({}, fields, { __metadata: metadata });
}

function resolveLink(value, entries, assets, defaultLocaleCode) {
    if (Array.isArray(value)) {
        return value.map(childValue => resolveLink(childValue, entries, assets, defaultLocaleCode));
    }

    if (value && value.sys && value.sys.type === 'Link') {
        const searchPool = value.sys.linkType === 'Asset' ? assets : entries;
        const match = searchPool.find(item => item.sys && item.sys.id === value.sys.id);

        return match ? resolveLinksInEntry(match, entries, assets, defaultLocaleCode) : null;
    }

    return value;
}

function resolveLinksInEntry(entry, entries, assets, defaultLocaleCode) {
    if (!entry.fields) return entry;

    const resolvedFields = Object.keys(entry.fields).reduce((result, fieldName) => {
        const field = entry.fields[fieldName];
        const localeKey = getFieldLocale(field, defaultLocaleCode);
        const localizedFieldValue = field[localeKey];
        const value = resolveLink(localizedFieldValue, entries, assets, defaultLocaleCode);

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

function getDefaultLocale(locales = []) {
    return locales.find((locale) => {
        return locale.default;
    });
}

function getFieldLocale(field, defaultLocaleCode) {
    return (defaultLocaleCode in field) ? defaultLocaleCode : Object.keys(field)[0];
}

function getLocalizedFieldValue(field, defaultLocaleCode) {
    return (defaultLocaleCode in field) ? field[defaultLocaleCode] : Object.values(field)[0];
}

async function syncWithRetry(client, parameters, maxRetries = 5, currentRetry = 1) {
    try {
        const result = await client.sync(parameters);

        return result;
    } catch (error) {
        if (
            error.response &&
            error.response.data &&
            error.response.data.sys &&
            error.response.data.sys.id === 'AccessTokenInvalid' &&
            currentRetry < maxRetries
        ) {
            await new Promise(resolve => setTimeout(resolve, 1000));

            return syncWithRetry(client, parameters, maxRetries, currentRetry + 1);
        }

        throw error;
    }
}

module.exports = {
    normalizeEntries,
    normalizeEntry,
    resolveLinksInEntry,
    getDefaultLocale,
    syncWithRetry
};
