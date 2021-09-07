require("dotenv").config();

const moment = require("moment");
const today = moment(new Date()).format("MM/DD/YYYY");

const AirtableApi = require("./src/Airtable");
const HighlevelApi = require("./src/Highlevel");

const Airtable = new AirtableApi(process.env.AIRTABLE_API_KEY);

const slackNotification = require("./src/slackNotification");

const { liveCampaigns, campaignsToRun, campaignsDueToday } = require("./src/helpers");

exports.emailCampaign = async (req, res) => {
    try {
        const getCampaigns = await Airtable.getCampaigns();
        let campaigns = liveCampaigns(getCampaigns);
        campaigns = campaignsDueToday(campaigns);
        campaigns = campaignsToRun(campaigns);

        for (let campaign of campaigns) {
            let view = "Email";

            if ("Tag" in campaign) {
                view = `Email - ${campaign.Tag}`;
            }

            const contacts = await Airtable.getContacts(campaign["Base ID"], view);

            if (contacts) {
                const Highlevel = new HighlevelApi(campaign["API Token"]);

                for (let contact of contacts) {
                    const hlContact = await Highlevel.makeHighlevelContact(contact);

                    const addedContact = await Highlevel.outreachContact(
                        hlContact,
                        campaign["Campaign ID"]
                    );

                    if (addedContact) {
                        await Airtable.updateCampaign(campaign.recordID, { "Last Updated": today });

                        const updatedFields = {
                            "In Campaign": true,
                            Campaign: campaign.Campaign,
                        };
                        await Airtable.updateContact(
                            campaign["Base ID"],
                            contact.recordID,
                            updatedFields
                        );

                        console.log(
                            `Client: ${campaign.Client} | Campaign: ${campaign.Campaign} - SUCCESS`
                        );
                    }
                }
            } else {
                // check if need more contacts
                const prospects = await Airtable.hasProspects(campaign["Base ID"], view);

                if (!prospects) {
                    await Airtable.updateCampaign(campaign.recordID, {
                        "Campaign Status": "Need More Contacts",
                        "Last Updated": today,
                    });

                    console.log(
                        `Client: ${campaign.Client} | Campaign: ${campaign.Campaign} - Need More Contacts`
                    );
                }
            }
        }

        await slackNotification("Emails were sent for campaigns in *view=Email - HL*.");

        res.status(200).send(campaigns);
    } catch (error) {
        res.status(500).send(error);

        console.log("EMAILCAMPAIGN ---", error);
    }
};
