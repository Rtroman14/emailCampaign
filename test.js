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
        const getCampaigns = await Airtable.getCampaigns("appGB7S9Wknu6MiQb", "Email - HL");
        let accounts = _.accountsToRun(getCampaigns);

        // for each account - Promise.all();

        const arrayEmailOutreach = accounts.map((account) => emailOutreach(account));

        // const results = Promise.all(arrayEmailOutreach);

        // results == [{ recordID: asdfe, status: "Need More Contacts" }, ...]

        for (let result of results) {
            await Airtable.updateCampaign(result.recordID, {
                "Campaign Status": result.status,
                "Last Updated": today,
            });
        }

        // console.log(
        //     `Account: ${account.Account} | Campaign: ${account.Campaign} - Need More Contacts`
        // );
    } catch (error) {
        console.log(error);
    }
})();
