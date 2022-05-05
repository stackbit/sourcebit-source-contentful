const plugin = require('../index');

const MOCK_ENTRIES = [
    {
        sys: {
            space: {
                sys: {
                    type: 'Link',
                    linkType: 'Space',
                    id: '123456789'
                }
            },
            type: 'Entry',
            id: '7IU1qx73bBkSP2vd0cQQNn',
            contentType: {
                sys: {
                    type: 'Link',
                    linkType: 'ContentType',
                    id: 'blog_post'
                }
            },
            revision: 2,
            createdAt: '2020-07-13T14:19:20.704Z',
            updatedAt: '2020-07-13T15:25:13.692Z',
            environment: {
                sys: {
                    id: 'master',
                    type: 'Link',
                    linkType: 'Environment'
                }
            }
        },
        fields: {
            title: {
                'en-US': 'This Is A Blog Post'
            },
            subtitle: {
                'en-US': 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam a metus quis lorem malesuada luctus.'
            },
            authors: {
                'en-US': [
                    {
                        sys: {
                            type: 'Link',
                            linkType: 'Entry',
                            id: '1zWlz1f7Wcna8MHzOBySD6'
                        }
                    },
                    {
                        sys: {
                            type: 'Link',
                            linkType: 'Entry',
                            id: '4CHFtqh7Zj87GnH09Vwg2o'
                        }
                    }
                ]
            }
        }
    },
    {
        sys: {
            space: {
                sys: {
                    type: 'Link',
                    linkType: 'Space',
                    id: '123456789'
                }
            },
            type: 'Entry',
            id: '1zWlz1f7Wcna8MHzOBySD6',
            contentType: {
                sys: {
                    type: 'Link',
                    linkType: 'ContentType',
                    id: 'person'
                }
            },
            revision: 2,
            createdAt: '2020-07-13T14:19:20.704Z',
            updatedAt: '2020-07-13T15:25:13.692Z',
            environment: {
                sys: {
                    id: 'master',
                    type: 'Link',
                    linkType: 'Environment'
                }
            }
        },
        fields: {
            firstName: {
                'en-US': 'John'
            },
            lastName: {
                'en-US': 'Doe'
            }
        }
    },
    {
        sys: {
            space: {
                sys: {
                    type: 'Link',
                    linkType: 'Space',
                    id: '123456789'
                }
            },
            type: 'Entry',
            id: '4CHFtqh7Zj87GnH09Vwg2o',
            contentType: {
                sys: {
                    type: 'Link',
                    linkType: 'ContentType',
                    id: 'person'
                }
            },
            revision: 2,
            createdAt: '2020-07-13T14:19:20.704Z',
            updatedAt: '2020-07-13T15:25:13.692Z',
            environment: {
                sys: {
                    id: 'master',
                    type: 'Link',
                    linkType: 'Environment'
                }
            }
        },
        fields: {
            firstName: {
                'en-US': 'Jane'
            },
            lastName: {
                'en-US': 'Doe'
            }
        }
    }
];

const MOCK_ASSETS = [
    {
        sys: {
            space: {
                sys: {
                    type: 'Link',
                    linkType: 'Space',
                    id: '123456789'
                }
            },
            id: '7orLdboQQowIUs22KAW4U',
            type: 'Asset',
            createdAt: '2022-04-30T14:30:48.053Z',
            updatedAt: '2022-04-30T14:32:40.219Z',
            environment: {
                sys: {
                    id: 'master',
                    type: 'Link',
                    linkType: 'Environment'
                }
            },
            revision: 2
        },
        fields: {
            title: 'Sparkler',
            description: 'John with Sparkler',
            file: {
                url: '//images.ctfassets.net/spaceId/7orLdboQQowIUs22KAW4U/e237faf0c6a0c89f8dce3e35e552176e/matt-palmer-254999.jpg',
                details: {
                    size: 2293094,
                    image: {
                        width: 3000,
                        height: 2000
                    }
                },
                fileName: 'matt-palmer-254999.jpg',
                contentType: 'image/jpeg'
            }
        }
    }
];

describe('`transform()`', () => {
    test('resolves links and normalizes entries', () => {
        const context = {
            assets: MOCK_ASSETS,
            contentTypes: [],
            locales: [{ code: 'en-US', default: true }],
            entries: MOCK_ENTRIES
        };
        const output = plugin.transform({
            data: {
                models: [],
                objects: []
            },
            getPluginContext: () => context,
            options: {
                environment: 'master',
                spaceId: '123'
            }
        });

        const { objects } = output;

        expect(objects.length).toBe(4);

        expect(objects[0].title).toBe(MOCK_ENTRIES[0].fields.title['en-US']);
        expect(objects[0].subtitle).toBe(MOCK_ENTRIES[0].fields.subtitle['en-US']);
        expect(objects[0].authors[0].firstName).toBe(MOCK_ENTRIES[1].fields.firstName['en-US']);
        expect(objects[0].authors[0].lastName).toBe(MOCK_ENTRIES[1].fields.lastName['en-US']);
        expect(objects[0].authors[1].firstName).toBe(MOCK_ENTRIES[2].fields.firstName['en-US']);
        expect(objects[0].authors[1].lastName).toBe(MOCK_ENTRIES[2].fields.lastName['en-US']);

        expect(objects[1].firstName).toBe(MOCK_ENTRIES[1].fields.firstName['en-US']);
        expect(objects[1].lastName).toBe(MOCK_ENTRIES[1].fields.lastName['en-US']);

        expect(objects[2].firstName).toBe(MOCK_ENTRIES[2].fields.firstName['en-US']);
        expect(objects[2].lastName).toBe(MOCK_ENTRIES[2].fields.lastName['en-US']);

        expect(objects[3].url).toContain(MOCK_ASSETS[0].fields.file.url);
        expect(objects[3].fileName).toContain(MOCK_ASSETS[0].fields.file.fileName);
        expect(objects[3].contentType).toContain(MOCK_ASSETS[0].fields.file.contentType);
        expect(objects[3].details).toBeDefined();
        expect(objects[3].details.size).toEqual(MOCK_ASSETS[0].fields.file.details.size);
    });
});
