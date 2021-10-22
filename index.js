require("dotenv").config();

const moment = require("moment");
const today = moment(new Date()).format("MM/DD/YYYY");

const AirtableApi = require("./src/Airtable");
const HighlevelApi = require("./src/Highlevel");
const HelperApi = require("./src/Helpers");

const Airtable = new AirtableApi(process.env.AIRTABLE_API_KEY);
const _ = new HelperApi();

const slackNotification = require("./src/slackNotification");

exports.emailCampaign = async (req, res) => {
    try {
        const getCampaigns = await Airtable.getCampaigns("appGB7S9Wknu6MiQb", "Email - HL");
        let accounts = _.accountsToRun(getCampaigns);

        for (let account of accounts) {
            let view = "Email";

            if ("Tag" in account) {
                view = `Email - ${account.Tag}`;
            }

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
                        await Airtable.updateCampaign(account.recordID, { "Last Updated": today });

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
                            `Client: ${account.Client} | Campaign: ${account.Campaign} - SUCCESS`
                        );
                    }
                }
            } else {
                // check if need more contacts
                const prospects = await Airtable.hasProspects(account["Base ID"], view);

                if (!prospects) {
                    await Airtable.updateCampaign(account.recordID, {
                        "Campaign Status": "Need More Contacts",
                        "Last Updated": today,
                    });

                    console.log(
                        `Client: ${account.Client} | Campaign: ${account.Campaign} - Need More Contacts`
                    );
                }
            }
        }

        await slackNotification("Emails were sent for campaigns in *view=Email - HL*.");

        res.status(200).send(accounts);
    } catch (error) {
        res.status(500).send(error);

        console.log("EMAILCAMPAIGN ---", error);
    }
};
