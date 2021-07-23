require("dotenv").config();

const moment = require("moment");
const today = moment(new Date()).format("MM/DD/YYYY");

const AirtableApi = require("./src/Airtable");
const HighlevelApi = require("./src/Highlevel");

const Airtable = new AirtableApi(process.env.AIRTABLE_API_KEY);

const { liveCampaigns, campaignsToRun, mapContact, campaignsDueToday } = require("./src/helpers");

(async () => {
    try {
        const getCampaigns = await Airtable.getCampaigns();
        let campaigns = liveCampaigns(getCampaigns);
        campaigns = campaignsDueToday(campaigns);
        campaigns = campaignsToRun(campaigns);

        const campaign = campaigns[0];

        let view = "First Lines";

        if ("Tag" in campaign) {
            view = `First Lines - ${campaign.Tag}`;
        }

        let contacts = await Airtable.getContacts(campaign["Base ID"], view);

        contacts = contacts.slice(0, 1);

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
        }
    } catch (error) {
        console.log(error);
    }
})();
