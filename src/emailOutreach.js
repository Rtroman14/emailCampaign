require("dotenv").config();

const moment = require("moment");
const today = moment(new Date()).format("MM/DD/YYYY");

const slackNotification = require("./slackNotification");

const AirtableApi = require("./Airtable");
const HighlevelApi = require("./Highlevel");
const HelperApi = require("./Helpers");

const Airtable = new AirtableApi(process.env.AIRTABLE_API_KEY);
const _ = new HelperApi();

module.exports = async (account) => {
    let view = "Email";

    if ("Tag" in account) {
        view = `Email - ${account.Tag}`;
    }

    try {
        const contacts = await Airtable.getContacts(account["Base ID"], view);

        if (contacts) {
            const Highlevel = new HighlevelApi(account["API Token"]);

            for (let contact of contacts) {
                const hlContact = await Highlevel.makeHighlevelContact(contact);

                const addedContact = await Highlevel.outreachContact(
                    hlContact,
                    account["Campaign ID"]
                );

                if (addedContact) {
                    const updatedFields = {
                        "In Campaign": true,
                        Campaign: account.Campaign,
                    };
                    await Airtable.updateContact(
                        account["Base ID"],
                        contact.recordID,
                        updatedFields
                    );

                    console.log(
                        `Account: ${account.Account} | Campaign: ${account.Campaign} - SUCCESS`
                    );
                }
            }

            // await slackNotification("Emails were sent for campaigns in *view=Email - HL*.");

            return {
                recordID: account.recordID,
                status: "Live",
            };
        } else {
            // check if need more contacts
            const prospects = await Airtable.hasProspects(account["Base ID"], view);

            if (!prospects) {
                return {
                    recordID: account.recordID,
                    status: "Need More Contacts",
                };
            }
        }
    } catch (error) {
        // await slackNotification(`Error sending emails - ${error}`);

        console.log("EMAILCAMPAIGN ---", error);

        return {
            recordID: account.recordID,
            status: "Error",
        };
    }
};
