require("dotenv").config();

const axios = require("axios");

module.exports = class HighlevelApi {
    constructor(token) {
        if (!token) {
            throw new Error("Using Highlevel requires an API key.");
        }

        this.token = token;
    }

    getConfig(method, url, data) {
        try {
            if (data) {
                return {
                    method,
                    url,
                    headers: {
                        Authorization: `Bearer ${this.token}`,
                    },
                    data,
                };
            }
            return {
                method,
                url,
                headers: {
                    Authorization: `Bearer ${this.token}`,
                },
            };
        } catch (error) {
            console.log("ERROR CONFIG ---", error);
        }
    }

    async createContact(contact) {
        try {
            const config = this.getConfig(
                "post",
                "https://rest.gohighlevel.com/v1/contacts/",
                contact
            );

            const { data } = await axios(config);

            return data.contact;
        } catch (error) {
            console.log("ERROR CREATECONTACT ---", error);
            return false;
        }
    }

    async updateContact(id, updatedFields) {
        try {
            const config = this.getConfig(
                "put",
                `https://rest.gohighlevel.com/v1/contacts/${id}`,
                updatedFields
            );

            const { data } = await axios(config);

            return data.contact;
        } catch (error) {
            console.log("ERROR CREATECONTACT ---", error);
        }
    }

    async deleteContact(id) {
        try {
            const config = this.getConfig(
                "delete",
                `https://rest.gohighlevel.com/v1/contacts/${id}`
            );

            const res = await axios(config);

            return res;
        } catch (error) {
            console.log("ERROR DELETECONTACT ---", error);
        }
    }

    async searchContact(email, phone) {
        try {
            const config = this.getConfig(
                "get",
                `https://rest.gohighlevel.com/v1/contacts/lookup?email=${email}&phone=${phone}`
            );

            const { data } = await axios(config);

            return data.contacts[0];
        } catch (error) {
            console.log("ERROR SEARCHCONTACT ---", error.message);
            return false;
        }
    }

    async addToCampaign(contactID, campaignID) {
        try {
            const config = this.getConfig(
                "post",
                `https://rest.gohighlevel.com/v1/contacts/${contactID}/campaigns/${campaignID}`
            );

            const res = await axios(config);

            return res;
        } catch (error) {
            console.log("ERROR ADDTOCAMPAIGN ---", error);
            return false;
        }
    }

    async outreachContact(contactData, campaignID) {
        try {
            const contact = await this.createContact(contactData);

            if (contact) {
                const res = await this.addToCampaign(contact.id, campaignID);

                return res;
            }

            return false;
        } catch (error) {
            console.log("ERROR TEXTCONTACT ---", error);
            return false;
        }
    }

    async jnToHlCampaign(highlevelContact, campainID) {
        try {
            const foundContact = await this.searchContact(
                highlevelContact.email,
                highlevelContact.phone
            );

            if (foundContact) {
                const updatedContact = await this.updateContact(foundContact.id, {
                    ...foundContact,
                    dnd: false,
                });

                await this.addToCampaign(updatedContact.id, campainID);
            } else {
                await this.outreachContact(highlevelContact, campainID);
            }

            return true;
        } catch (error) {
            console.log("ERROR JNTOHLCAMPAIGN ---", error);
            return false;
        }
    }

    async getCustomeFields(name) {
        try {
            const config = this.getConfig("get", "https://rest.gohighlevel.com/v1/custom-fields/");

            const { data } = await axios(config);

            const customField = data.customFields.find((field) => field.name === name);
            return customField;
        } catch (error) {
            console.log("ERROR GETCUSTOMEFIELDS ---", error);
            return false;
        }
    }

    async makeHighlevelContact(contact) {
        const firstLineField = await this.getCustomeFields("First Line");

        let firstLine = {};

        if (firstLineField) {
            if ("First Line" in contact) {
                firstLine = { [firstLineField.id]: contact["First Line"] };
            }
        }

        return {
            firstName: contact["First Name"] || "",
            lastName: contact["Last Name"] || "",
            name: `${contact["First Name"]} ${contact["Last Name"]}`,
            email: contact.Email || "",
            phone: contact["Phone Number"] || "",
            address1: contact.Street || "",
            city: contact.City || "",
            state: contact.State || "",
            postalCode: contact.Zip || "",
            customField: firstLine,
        };
    }
};
