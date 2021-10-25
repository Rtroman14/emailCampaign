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
        const getCampaigns = await Airtable.getCampaigns("Email - HL");
        let accounts = _.accountsToRun(getCampaigns);

        // accounts = accounts.filter(
        //     (account) =>
        //         account.Account === "Red Leaf Solutions" ||
        //         account.Account === "Roper Roofing" ||
        //         account.Account === "Summa Media" ||
        //         account.Account === "Valley Hill Roofing" ||
        //         account.Account === "XL Roofing" ||
        //         account.Account === "Splashtacular"
        // );

        const arrayEmailOutreach = accounts.map((account) => emailOutreach(account));

        const results = await Promise.all(arrayEmailOutreach);

        for (let result of results) {
            await Airtable.updateCampaign(result.recordID, {
                "Campaign Status": result.status,
                "Last Updated": today,
            });
        }
    } catch (error) {
        console.log(error);
    }
})();
