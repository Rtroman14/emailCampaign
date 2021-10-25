require("dotenv").config();

const moment = require("moment");
const today = moment(new Date()).format("MM/DD/YYYY");

const AirtableApi = require("./src/Airtable");
const HighlevelApi = require("./src/Highlevel");

const Airtable = new AirtableApi(process.env.AIRTABLE_API_KEY);

const HelperApi = require("./src/Helpers");
const _ = new HelperApi();

const slackNotification = require("./src/slackNotification");

(async () => {
    try {
        await slackNotification(process.env.SLACK_TWO_PERCENT, `*Account:* TEST`);
    } catch (error) {
        console.log(error);
    }
})();
