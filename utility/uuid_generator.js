const uuid = require("uuid");

const generateUUID = () => {
  return uuid.v7();
};

module.exports = generateUUID;
