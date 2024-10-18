import {
    DynamoDBClient,
    DescribeEndpointsCommand,
} from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const ddbClient = new DynamoDBClient();
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

await ddbClient.send(new DescribeEndpointsCommand());

export const handler = async (event) => {
    await ddbDocClient.send(
        new PutCommand({
            TableName: process.env.TABLE_NAME,
            Item: {
                id: Math.random().toString(36).substring(2),
                content: JSON.stringify(event),
            },
        })
    );

    return {
        statusCode: 200,
        body: "OK",
    };
};
