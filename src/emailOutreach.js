require("dotenv").config();

const axios = require("axios");

const slackNotification = require("./slackNotification");

const AirtableApi = require("./Airtable");
const HighlevelApi = require("./Highlevel");

const Airtable = new AirtableApi(process.env.AIRTABLE_API_KEY);

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

                if (addedContact.status === 200) {
                    const updatedFields = {
                        "In Campaign": true,
                        Campaign: account.Campaign,
                        id: addedContact.id,
                    };
                    await Airtable.updateContact(
                        account["Base ID"],
                        contact.recordID,
                        updatedFields
                    );
                }
            }

            console.log(`Account: ${account.Account} | Campaign: ${account.Campaign} - SUCCESS`);

            return {
                ...account,
                status: "Live",
            };
        } else {
            // check if need more contacts
            const prospects = await Airtable.hasProspects(account["Base ID"], view);

            if (!prospects) {
                console.log(
                    `Account: ${account.Account} | Campaign: ${account.Campaign} - Need More Contacts`
                );

                await slackNotification(
                    process.env.SLACK_EMAIL_NOTIFICATIONS,
                    `Account: *${account.Account}* | Campaign: ${account.Campaign} | Status: *Need More Contacts*`
                );

                return {
                    ...account,
                    status: "Need More Contacts",
                };
            }
        }
    } catch (error) {
        await slackNotification(
            process.env.SLACK_TWO_PERCENT,
            `Account: ${account.Account} threw an error: ${error.message}`
        );

        console.log(`Account: ${account.Account} | Campaign: ${account.Campaign} - ERROR`);

        console.log("EMAILCAMPAIGN ---", error);

        return {
            ...account,
            status: "Error",
        };
    }
};
