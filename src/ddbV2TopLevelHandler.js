//AVOID require the entire sdk using a top level import, consider using a path import (see ddbV2Handler.js)
const AWS = require("aws-sdk");

const ddbDocClient = new AWS.DynamoDB.DocumentClient();

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
