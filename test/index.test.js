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

describe('`transform()`', () => {
    test('resolves links and normalizes entries', () => {
        const context = {
            assets: [],
            contentTypes: [],
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

        expect(objects.length).toBe(3);

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
    });
});
