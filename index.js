const contentful = require('contentful');
const contentfulManagement = require('contentful-management');
const { normalizeEntries, resolveLinksInEntry, getDefaultLocale, syncWithRetry } = require('./lib/contentful-util');
const pkg = require('./package.json');

module.exports.name = pkg.name;

module.exports.options = {
    accessToken: {
        env: 'CONTENTFUL_ACCESS_TOKEN',
        private: true
    },
    deliveryToken: {
        env: 'CONTENTFUL_DELIVERY_TOKEN',
        private: true
    },
    previewToken: {
        env: 'CONTENTFUL_PREVIEW_TOKEN',
        private: true
    },
    environment: {},
    host: {
        env: 'CONTENTFUL_HOST'
    },
    pollingInterval: {
        default: 5000
    },
    preview: {},
    spaceId: {},
    richTextOutputFormat: {
        default: 'html'
    },
    watch: {
        default: false,
        runtimeParameter: 'watch'
    },
    resolveLinks: {
        default: false
    }
};

module.exports.bootstrap = async ({ getPluginContext, options, refresh, setPluginContext }) => {
    const isPreview = options.preview !== undefined ? options.preview : options.watch;
    const host = options.host || (isPreview ? 'preview.contentful.com' : undefined);
    const environment = options.environment || 'master';

    let accessToken;

    if (!isPreview && options.deliveryToken) {
        accessToken = options.deliveryToken;
    } else if (isPreview && options.previewToken) {
        accessToken = options.previewToken;
    } else {
        const clientManagement = contentfulManagement.createClient({
            accessToken: options.accessToken
        });
        const space = await clientManagement.getSpace(options.spaceId);
        const { items: apiKeys } = await (isPreview ? space.getPreviewApiKeys() : space.getApiKeys());

        let apiKey = apiKeys.find(({ name }) => name === pkg.name);

        if (!apiKey) {
            apiKey = await space.createApiKey({
                name: pkg.name,
                environments: [
                    {
                        sys: {
                            type: 'Link',
                            linkType: 'Environment',
                            id: environment
                        }
                    }
                ]
            });
        }

        accessToken = apiKey.accessToken;
    }

    const client = contentful.createClient({
        accessToken,
        host,
        space: options.spaceId,
        environment: environment
    });
    const { assets, entries, nextSyncToken } = await syncWithRetry(client, {
        initial: true,
        resolveLinks: options.resolveLinks
    });
    const { items: contentTypes } = await client.getContentTypes();
    const { items: locales } = await client.getLocales();

    setPluginContext({
        entries,
        assets,
        contentTypes,
        locales,
        nextSyncToken
    });

    if (options.watch) {
        setInterval(async () => {
            const { assets, entries, nextSyncToken } = getPluginContext();
            const response = await client.sync({
                nextSyncToken,
                resolveLinks: options.resolveLinks
            });

            if (response.nextSyncToken === nextSyncToken) {
                return;
            }

            // Handling deleted assets.
            response.deletedAssets.forEach((asset) => {
                const index = assets.findIndex(({ sys }) => sys.id === asset.sys.id);

                if (index !== -1) {
                    assets[index] = null;
                }
            });

            // Handling updated assets.
            response.assets.forEach((asset) => {
                const index = assets.findIndex(({ sys }) => sys.id === asset.sys.id);

                if (index === -1) {
                    assets.push(asset);
                } else {
                    assets[index] = asset;
                }
            });

            // Handling deleted entries.
            response.deletedEntries.forEach((entry) => {
                const index = entries.findIndex(({ sys }) => sys.id === entry.sys.id);

                if (index !== -1) {
                    entries[index] = null;
                }
            });

            // Handling updated entries.
            response.entries.forEach((entry) => {
                const index = entries.findIndex(({ sys }) => sys.id === entry.sys.id);

                if (index === -1) {
                    entries.push(entry);
                } else {
                    entries[index] = entry;
                }
            });

            setPluginContext({
                assets: assets.filter(Boolean),
                entries: entries.filter(Boolean),
                nextSyncToken: response.nextSyncToken
            });

            refresh();
        }, options.pollingInterval);
    }
};

module.exports.transform = ({ data, getPluginContext, options }) => {
    const { entries = [], assets, contentTypes = [], locales = [] } = getPluginContext();
    const defaultLocale = getDefaultLocale(locales);
    const entriesWithResolvedLinks = entries.map((entry) => resolveLinksInEntry(entry, entries, assets, defaultLocale.code));
    const normalizedEntries = normalizeEntries({
        contentTypes,
        entries: entriesWithResolvedLinks.concat(assets),
        defaultLocaleCode: defaultLocale.code,
        options
    });
    const models = contentTypes.map((contentType) => ({
        source: pkg.name,
        modelName: contentType.sys.id,
        modelLabel: contentType.name || contentType.sys.id,
        projectId: options.spaceId,
        projectEnvironment: options.environment,
        fieldNames: contentType.fields.map((field) => field.id)
    }));

    return {
        ...data,
        models: data.models.concat(models),
        objects: data.objects.concat(normalizedEntries)
    };
};

module.exports.getOptionsFromSetup = ({ answers }) => {
    return {
        accessToken: answers.accessToken,
        environment: answers.environment,
        spaceId: answers.spaceId
    };
};

module.exports.getSetup = ({ chalk, currentOptions, inquirer, ora }) => {
    return async () => {
        const answers = {};
        const { accessToken } = await inquirer.prompt([
            {
                type: 'input',
                name: 'accessToken',
                message: `What is your Contentful Personal Access Token? ${chalk.reset(
                    'To create one, see https://www.contentful.com/r/knowledgebase/personal-access-tokens/.'
                )}`,
                validate: (value) => (value.length > 0 ? true : 'The Personal Access Token cannot be empty.'),
                default: currentOptions.accessToken
            }
        ]);

        answers.accessToken = accessToken;

        const client = contentfulManagement.createClient({
            accessToken: answers.accessToken
        });
        const spacesSpinner = ora('Looking for Contentful spaces').start();

        try {
            const { items: spaces } = await client.getSpaces();

            spacesSpinner.succeed();

            if (spaces.length === 1) {
                answers.spaceId = spaces[0].sys.id;

                ora(`The only space in the account has been selected: ${chalk.bold(spaces[0].name)}.`).info();
            } else {
                const { spaceId } = await inquirer.prompt([
                    {
                        type: 'list',
                        name: 'spaceId',
                        message: 'Which Contentful space do you want to use?',
                        choices: spaces.map((space) => ({
                            name: space.name,
                            value: space.sys.id
                        }))
                    }
                ]);

                answers.spaceId = spaceId;
            }
        } catch (error) {
            spacesSpinner.fail();

            throw error;
        }

        const environmentsSpinner = ora('Looking for environments').start();
        const space = await client.getSpace(answers.spaceId);
        const { items: environments } = await space.getEnvironments();

        environmentsSpinner.succeed();

        if (environments.length === 1) {
            answers.environment = environments[0].sys.id;

            ora(`The only environment in the space has been selected: ${chalk.bold(environments[0].name)}.`).info();
        } else {
            const { environment } = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'environment',
                    message: 'What environment do you want to use?',
                    choices: environments.map((environment) => ({
                        name: environment.name,
                        value: environment.sys.id
                    })),
                    default: environments[0].sys.id
                }
            ]);

            answers.environment = environment;
        }

        return answers;
    };
};
