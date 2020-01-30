# sourcebit-source-contentful

[![npm version](https://badge.fury.io/js/sourcebit-source-contentful.svg)](https://badge.fury.io/js/sourcebit-source-contentful)

> A [Contentful](https://contentful.com) source plugin for [Sourcebit](https://github.com/stackbithq/sourcebit)

## 👩‍🏫 Introduction

With this plugin, you can add Contentful as a data source for Sourcebit. To connect your Contentful account, you need a [Personal Access Token](https://www.contentful.com/r/knowledgebase/personal-access-tokens/).

## 🏗 Installation

To install the plugin and add it to your project, run:

```
npm install sourcebit-source-contentful --save
```

> 💡 You don't need to run this command if you start Sourcebit using the [interactive setup process](#%EF%B8%8F-interactive-setup-process), as the CLI will install the plugin for you and add it as a dependency to your project.

## ⚙️ Configuration

The plugin accepts the following configuration parameters. They can be supplied in any of the following ways:

- In the `options` object of the plugin configuration block inside `sourcebit.js`, with the value of the _Property_ column as a key;
- As an environment variable named after the _Env variable_ column, when running the `sourcebit fetch` command;
- As part of a `.env` file, with the value of the _Env variable_ column separated by the value with an equals sign (e.g. `MY_VARIABLE=my-value`);
- As a CLI parameter, when running the `sourcebit fetch` command, using the value of the _Parameter_ column as the name of the parameter (e.g. `sourcebit fetch --my-parameter`).

| Property          | Type    | Visibility  | Default value                                   | Env variable              | Parameter | Description                                                                                                                                                                                                                                    |
| ----------------- | ------- | ----------- | ----------------------------------------------- | ------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `accessToken`     | String  | **Private** |                                                 | `CONTENTFUL_ACCESS_TOKEN` |           | The Contentful Personal Access Token.                                                                                                                                                                                                          |
| `environment`     | String  | Public      |                                                 |                           |           | The name of the Contentful [space environment](https://www.contentful.com/faq/environments/).                                                                                                                                                  |
| `host`            | String  | Public      | The default value defined by the Contentful SDK | `CONTENTFUL_HOST`         |           | The value of the `host` option of the [Contentful SDK](https://contentful.github.io/contentful.js/contentful/7.13.1/).                                                                                                                         |
| `preview`         | Boolean | Public      | `true` if `{watch: true}`, `false` otherwise.   |                           |           | Whether to use the [Contentful Preview API](https://www.contentful.com/developers/docs/references/content-preview-api/) as opposed to the [Content Delivery API](https://www.contentful.com/developers/docs/references/content-delivery-api/). |
| `pollingInterval` | Number  | Public      | `5000`                                          |                           |           | The interval of time (in milliseconds) between API calls to Contentful to poll for content changes. Only applicable when `watch` is enabled.                                                                                                   |
| `projectId`       | String  | Public      |                                                 |                           |           | The ID of the Contentful [space](https://www.contentful.com/r/knowledgebase/spaces-and-organizations/).                                                                                                                                        |
| `watch`           | Boolean | Public      |                                                 |                           | `watch`   | Whether to poll Contentful for content changes.                                                                                                                                                                                                |

### 👀 Example configuration

_sourcebit.js_

```js
module.exports = {
  plugins: [
    {
      module: require("sourcebit-source-contentful"),
      options: {
        accessToken: process.env["CONTENTFUL_ACCESS_TOKEN"],
        environment: "master",
        spaceId: "1abcdefgh2ij"
      }
    }
  ]
};
```

_.env_

```
CONTENTFUL_ACCESS_TOKEN=CFPAT-123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ
```

### 🧞‍♂️ Interactive setup process

This plugin offers an interactive setup process via the `npx create-sourcebit` command. It asks users for their Contentful Personal Access Token and allows them to select their Contentful space and environment.

## 📥 Input

_N/A_

## 📤 Output

This plugin adds normalized entries to the `objects` data bucket and normalized model objects to the `models` data bucket.
