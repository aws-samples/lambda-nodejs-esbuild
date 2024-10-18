const { Request, Response, Headers, default: fetch } = require("node-fetch");
globalThis.fetch = fetch;
globalThis.Request = Request;
globalThis.Response = Response;
globalThis.Headers = Headers;

const crypto = require("crypto").webcrypto;
globalThis.crypto = crypto;

const { AwsClient } = require("aws4fetch");

const aws = new AwsClient({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

exports.handler = async (event) => {
    const res = await aws.fetch(`https://dynamodb.us-east-1.amazonaws.com`, {
        aws: {
            target: "DynamoDB_20120810.PutItem",
        },
        body: JSON.stringify({
            TableName: process.env.TABLE_NAME,
            Item: {
                id: {
                    S: Math.random().toString(36).substring(2),
                },
                name: {
                    S: event.name || "Test",
                },
                price: {
                    N: `${event.price || "0"}`,
                },
            },
        }),
    });
};
