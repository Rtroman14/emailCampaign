require("dotenv").config();

const axios = require("axios");

module.exports = async (channel, text) => {
    // notify me about this in Slack
    await axios.post(channel, {
        text,
    });
};
