# gatsby-source-jetveo

Source plugin for pulling models and records into Gatsby from Jetveo.io.

<a href="https://jetveo.io/">
<img src="https://jetveo.io/img/logo_top.svg" height="60">
</a>

## Table of Contents

- [Install](#install)
- [How to use](#how-to-use)
- [How to query data](#how-to-query-data)
- [Integration with Gatsby Image](#integration-with-gatsby-image)
- [Sample project](#sample-project)

## Install

```bash
npm install --save gatsby-source-jetveo gatsby-plugin-image
```

## How to use

```javascript
// In your gatsby-config.js
plugins: [
  {
    resolve: `gatsby-source-jetveo`,
    options: {
      // You can find your application instance url on Jetveo Apps Overview
      apiBaseUrl: "https://[APPLICATON_INSTANCE_URL]/api",

      // Your application instance api key is in Jetveo App instance settings tab API
      apiKey: "[APPLICATION_INSTANCE_API_KEY]",

      // Configure your api endpoints which will be available in gatsby. The item of this array is tailing part of endpoint url.
      // For example set "pages" when your endpoint is https://[APPLICATON_INSTANCE_URL]/api/pages.
      apiEndpoints: ["[API_ENDPOINT_PATH_1]", "[API_ENDPOINT_PATH_2]"],
    },
  },
];
```

## How to query data

You can see imported data from api endpoints on gatsby graphql dev page http://localhost:8000/\_\_\_graphql as graphql nodes with prefix `jetveo`.
Use this nodes in your graphql query as you used to.

## Integration with Gatsby Image

### For Gatsby v3+

This plugin is compatible with the new [gatsby-plugin-image](https://www.gatsbyjs.com/docs/reference/built-in-components/gatsby-plugin-image/)

### Compatibility with the deprecated `gatsby-image` component

This plugin doesn't support gatsby-image, sorry for that.

## Sample project

TODO:
