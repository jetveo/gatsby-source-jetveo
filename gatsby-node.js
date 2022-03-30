const axios = require("axios").default;
const humps = require("humps");
const { createRemoteFileNode } = require(`gatsby-source-filesystem`);

const JETVEO = "jetveo";
const JETVEO_ASSET_TYPE = `${JETVEO}Assets`;
const AUTH_HEADER = "jv-api-key";

// constants for your GraphQL Post and Author types
exports.sourceNodes = async (
  {
    actions: { createNode, createTypes },
    createContentDigest,
    createNodeId,
    reporter,
  },
  { apiBaseUrl, apiKey, apiEndpoints }
) => {
  if (!apiKey) {
    return reportError(reporter, missingConfigMsg("apiKey"));
  }

  if (!apiBaseUrl) {
    return reportError(reporter, missingConfigMsg("apiBaseUrl"));
  }

  if (!apiEndpoints) {
    return reportError(reporter, missingConfigMsg("apiEndpoints"));
  }

  if (!apiEndpoints.length) {
    return reportError(reporter, "Please enter one api endpoint at least."); // TODO: better messages
  }

  for (const index in apiEndpoints) {
    const endpoint = apiEndpoints[index];

    reporter.info("Downloading data from endpoint " + endpoint);

    await processEndpoint(
      endpoint,
      apiBaseUrl,
      apiKey,
      reporter,
      createNode,
      createTypes,
      createContentDigest,
      createNodeId
    );
  }
};

async function processEndpoint(
  endpoint,
  apiBaseUrl,
  apiKey,
  reporter,
  createNode,
  createTypes,
  createContentDigest,
  createNodeId
) {
  const data = await loadData(`${apiBaseUrl}/${endpoint}`, apiKey, reporter);
  if (!data) {
    reporter.warn(`Endpoint ${endpoint} response is empty`);
    return;
  }

  if (!data.success) {
    reporter.error(
      `Endpoint ${endpoint} response error. ErrorMessage: ${data.message}`
    );
    return;
  }

  if (!data.items || !data.items.length) {
    reporter.warn(`Endpoint ${endpoint} response with empty data`);
    return;
  }

  const propertiesTransformedIntoAsset = [];

  data.items.forEach((item) => {
    const itemTypeUid = `${JETVEO}${humps.pascalize(endpoint)}`;
    transformAssetsOnObject(
      item,
      createNode,
      createContentDigest,
      propertiesTransformedIntoAsset,
      itemTypeUid
    );

    createNode({
      ...item,
      id: createNodeId(`${itemTypeUid}-${item.id}`),
      parent: null,
      children: [],
      internal: {
        type: itemTypeUid,
        contentDigest: createContentDigest(item),
      },
    });
  });

  // create schema types
  propertiesTransformedIntoAsset.forEach((p) => {
    createTypes(`
      type ${p.type} implements Node {
        ${p.property}: ${JETVEO_ASSET_TYPE} @link
      }
    `);
  });
}

function transformAssetsOnObject(
  object,
  createNode,
  createContentDigest,
  propertiesTransformedIntoAsset,
  itemTypeUid
) {
  for (let k in object) {
    const val = object[k];
    if (!val) {
      continue;
    }

    if (isAssetObj(val)) {
      object[k] = val.id;

      createNode({
        ...val,
        id: val.id,
        parent: null,
        children: [],
        internal: {
          type: JETVEO_ASSET_TYPE,
          contentDigest: createContentDigest(val),
        },
      });

      if (
        propertiesTransformedIntoAsset.findIndex(
          (p) => p.type === itemTypeUid && p.property === k
        ) === -1
      ) {
        propertiesTransformedIntoAsset.push({
          type: itemTypeUid,
          property: k,
        });
      }

      continue;
    }

    const currentType = `${itemTypeUid}${humps.pascalize(k)}`;

    if (typeof val === "object" && Array.isArray(val)) {
      val.forEach((v) =>
        transformAssetsOnObject(
          v,
          createNode,
          createContentDigest,
          propertiesTransformedIntoAsset,
          currentType
        )
      );
      continue;
    }

    if (typeof val === "object") {
      transformAssetsOnObject(
        val,
        createNode,
        createContentDigest,
        propertiesTransformedIntoAsset,
        currentType
      );
      continue;
    }
  }
}

async function loadData(url, apiKey, reporter) {
  const response = await axios.get(url, {
    headers: createAuthHeader(apiKey),
    validateStatus: false,
  });
  if (response.status !== 200) {
    reporter.error(`Url ${url} responded with status ${response.status}!`);
    return null;
  }

  return response.data;
}

function missingConfigMsg(configName) {
  return `Missing config ${configName}} value! Please set it in gatsby-config.js plugins section.`;
}

function reportError(reporter, message) {
  const errorMsg = `[Jetveo source plugin] ${message}`;
  reporter.panic(errorMsg, new Error(errorMsg));
}

exports.onCreateNode = async (
  { node, actions: { createNode, createNodeField }, createNodeId, getCache },
  { apiKey }
) => {
  const nodeType = node.internal.type;
  if (!nodeType || !nodeType.startsWith(JETVEO)) {
    return;
  }

  if (nodeType === JETVEO_ASSET_TYPE) {
    const url = node.url;
    const fileExtension = getFileExtension(url);

    const fileNode = await createRemoteFileNode({
      url: url,
      parentNodeId: node.id,
      createNode,
      createNodeId,
      getCache,
      httpHeaders: createAuthHeader(apiKey),
    });

    if (fileNode) {
      createNodeField({
        node: node,
        name: `localFile`,
        value: fileNode.id,
        ext: fileExtension,
      });
    }
  }
};

exports.createSchemaCustomization = ({ actions }) => {
  const { createTypes } = actions;

  createTypes(`
    type ${JETVEO_ASSET_TYPE} implements Node {
      localFile: File @link(from: "fields.localFile")
    }
  `);
};

function isAssetObj(val) {
  return val && typeof val === "object" && val.url && val.isAsset;
}

function createAuthHeader(apiKey) {
  const header = {};
  header[AUTH_HEADER] = apiKey;
  return header;
}

function getFileExtension(val) {
  if (val) {
    const index = val.lastIndexOf(".");
    if (index > -1) {
      return val.substring(index, val.length);
    }
  }

  return undefined;
}
