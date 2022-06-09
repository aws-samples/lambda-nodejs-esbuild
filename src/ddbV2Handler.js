const { DocumentClient } = require("aws-sdk/clients/dynamodb");
const ddbDocClient = new DocumentClient();

exports.handler = async (event) => {
    await ddbDocClient
        .put({
            TableName: process.env.TABLE_NAME,
            Item: {
                id: Math.random().toString(36).substring(2),
                content: JSON.stringify(event),
            },
        })
        .promise();

    return {
        statusCode: 200,
        body: "OK",
    };
};
