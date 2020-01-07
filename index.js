const contentful = require("contentful");
const package = require("./package.json");

module.exports.bootstrap = async ({
  getContext,
  options,
  refresh,
  setContext
}) => {
  console.log("Hello from Contentful!");
};

module.exports.getOptionsFromSetup = ({ accessToken, spaceId }) => {
  return {
    accessToken,
    spaceId
  };
};

module.exports.getSetup = () => {
  return [
    {
      type: "input",
      name: "spaceId",
      message: "What is your Contentful space ID?"
    },
    {
      type: "input",
      name: "accessToken",
      message: "What is your Contentful access token?"
    }
  ];
};
