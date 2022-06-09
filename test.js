require("dotenv").config();

const moment = require("moment");
const today = moment(new Date()).format("MM/DD/YYYY");

const AirtableApi = require("./src/Airtable");
const HighlevelApi = require("./src/Highlevel");

const Airtable = new AirtableApi(process.env.AIRTABLE_API_KEY);

const HelperApi = require("./src/Helpers");
const _ = new HelperApi();

const emailOutreach = require("./src/emailOutreach");

(async () => {
    try {
        const contacts = await Airtable.getContacts("appRgFWQja3Z8rqLi", "Email - apartments");

        const Highlevel = new HighlevelApi(
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsb2NhdGlvbl9pZCI6Ik9xYnVEdVBZa2hyRWVrVG5LMVRnIiwiY29tcGFueV9pZCI6InVGeWhOME0wVVFMNTYzdFRWblo5IiwidmVyc2lvbiI6MSwiaWF0IjoxNjUxMDY4ODMyMTYzLCJzdWIiOiJHY3kyZktScFhLRVB3N0ZDOGFXTyJ9.tA8C2P4bLQFdUoljTzNMcy0-kft8vsC2CFvQZzw6wvc"
        );

        const hlContact = await Highlevel.makeHighlevelContact(contacts[0]);

        console.log(hlContact);
    } catch (error) {
        console.log(error);
    }
})();
