const { emailCampaign } = require("./index");

(async () => {
    try {
        await emailCampaign();
    } catch (error) {
        console.log(error);
    }
})();
