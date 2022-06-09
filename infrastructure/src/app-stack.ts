import {
    aws_docdb,
    CfnOutput,
    Duration,
    RemovalPolicy,
    Stack,
    StackProps,
} from "aws-cdk-lib";
import path from "path";
import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import * as ddb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigatewayv2 from "@aws-cdk/aws-apigatewayv2-alpha";
import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import { RetentionDays } from "aws-cdk-lib/aws-logs";

const SHARED_FUNCTION_PROPS = {
    runtime: lambda.Runtime.NODEJS_16_X,
    logRetention: RetentionDays.ONE_WEEK,
    memorySize: 256,
    timeout: Duration.seconds(28),
};

const ARCH_ARRAY = [lambda.Architecture.X86_64, lambda.Architecture.ARM_64];

const capitalize = (value: string) =>
    `${value.charAt(0).toUpperCase()}${value.slice(1)}`;

export class AppStack extends Stack {
    createDDbFunctions = (
        httpApi: apigatewayv2.HttpApi,
        table: ddb.Table,
        functionData: Record<string, string>
    ) => {
        Object.entries(functionData).forEach(([route, dir]) => {
            ARCH_ARRAY.forEach((architecture) => {
                const archName =
                    architecture === lambda.Architecture.X86_64 ? "x86" : "arm";
                const baseName = `${capitalize(
                    dir.replace("Handler", "")
                )}${capitalize(archName)}`;

                console.log(path.resolve("..", "dist", dir));

                const bundled = new lambda.Function(
                    this,
                    `${baseName}Function`,
                    {
                        ...SHARED_FUNCTION_PROPS,
                        handler: "index.handler",
                        architecture,
                        code: lambda.Code.fromAsset(
                            path.resolve("..", "dist", dir)
                        ),
                        environment: {
                            TABLE_NAME: table.tableName,
                        },
                    }
                );
                const unbundled = new lambda.Function(
                    this,
                    `${baseName}UnbundledFunction`,
                    {
                        ...SHARED_FUNCTION_PROPS,
                        architecture,
                        handler: `src/${dir}.handler`,
                        code: lambda.Code.fromAsset(
                            path.resolve("..", "unbundled.zip")
                        ),
                        environment: {
                            TABLE_NAME: table.tableName,
                        },
                    }
                );
                table.grantWriteData(bundled);
                table.grantWriteData(unbundled);
                httpApi.addRoutes({
                    path: `/${archName}${route}`,
                    methods: [apigatewayv2.HttpMethod.GET],
                    integration: new HttpLambdaIntegration(
                        `${baseName}BundledLambdaIntegration`,
                        bundled
                    ),
                });
                httpApi.addRoutes({
                    path: `/${archName}${route}-unbundled`,
                    methods: [apigatewayv2.HttpMethod.GET],
                    integration: new HttpLambdaIntegration(
                        `${baseName}UnbundledLambdaIntegration`,
                        unbundled
                    ),
                });
            });
        });
    };

    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const httpApi = new apigatewayv2.HttpApi(this, "HttpApi", {
            description: "HTTP API",
        });

        const table = new ddb.Table(this, "LambdaTable", {
            billingMode: ddb.BillingMode.PAY_PER_REQUEST,
            removalPolicy: RemovalPolicy.DESTROY,
            partitionKey: { name: "id", type: ddb.AttributeType.STRING },
        });

        this.createDDbFunctions(httpApi, table, {
            "/v2": "ddbV2Handler",
            "/v2-top-level": "ddbV2TopLevelHandler",
            "/v3": "ddbV3Handler",
        });

        const helloFunction = new lambda.Function(this, "HelloFunction", {
            ...SHARED_FUNCTION_PROPS,
            handler: "helloHandler.handler",
            code: lambda.Code.fromAsset(path.resolve("..", "src")),
        });

        const helloLargeFunction = new lambda.Function(
            this,
            "HelloLargeFunction",
            {
                ...SHARED_FUNCTION_PROPS,
                handler: "src/helloHandler.handler",
                code: lambda.Code.fromAsset(path.resolve("..", "large.zip")),
            }
        );

        httpApi.addRoutes({
            path: "/hello",
            methods: [apigatewayv2.HttpMethod.GET],
            integration: new HttpLambdaIntegration(
                "HelloLambdaIntegration",
                helloFunction
            ),
        });

        httpApi.addRoutes({
            path: "/hello-large",
            methods: [apigatewayv2.HttpMethod.GET],
            integration: new HttpLambdaIntegration(
                "HelloLargeLambdaIntegration",
                helloLargeFunction
            ),
        });

        // const ddbV3Function = new lambda.Function(this, "DDBV3Function", {
        //     ...SHARED_FUNCTION_PROPS,
        //     handler: "index.handler",
        //     code: lambda.Code.fromAsset(
        //         path.resolve("..", "dist/ddbV3Handler")
        //     ),
        //     environment: {
        //         TABLE_NAME: table.tableName,
        //     },
        // });

        // const unbundledDdbV3Function = new lambda.Function(
        //     this,
        //     "UnbundledDDBV3Function",
        //     {
        //         ...SHARED_FUNCTION_PROPS,
        //         handler: "src/ddbV3Handler.handler",
        //         code: lambda.Code.fromAsset(
        //             path.resolve("..", "unbundled.zip")
        //         ),
        //         environment: {
        //             TABLE_NAME: table.tableName,
        //         },
        //     }
        // );

        // const ddbV2Function = new lambda.Function(this, "DDBV2Function", {
        //     ...SHARED_FUNCTION_PROPS,
        //     handler: "src/ddbV2Handler.handler",
        //     code: lambda.Code.fromAsset(path.resolve("..", "unbundled.zip")),
        //     environment: {
        //         TABLE_NAME: table.tableName,
        //     },
        // });

        // const ddbV2TopLevelFunction = new lambda.Function(
        //     this,
        //     "DDBV2Function",
        //     {
        //         ...SHARED_FUNCTION_PROPS,
        //         handler: "src/ddbV2Handler.handler",
        //         code: lambda.Code.fromAsset(
        //             path.resolve("..", "unbundled.zip")
        //         ),
        //         environment: {
        //             TABLE_NAME: table.tableName,
        //         },
        //     }
        // );

        // const ddbV3ArmFunction = new lambda.Function(this, "DDBV3ArmFunction", {
        //     ...SHARED_FUNCTION_PROPS,
        //     handler: "index.handler",
        //     architecture: lambda.Architecture.ARM_64,
        //     code: lambda.Code.fromAsset(
        //         path.resolve("..", "dist/ddbV3Handler")
        //     ),
        //     environment: {
        //         TABLE_NAME: table.tableName,
        //     },
        // });

        // const unbundledDdbV3ArmFunction = new lambda.Function(
        //     this,
        //     "UnbundledDDBV3ArmFunction",
        //     {
        //         ...SHARED_FUNCTION_PROPS,
        //         handler: "src/ddbV3Handler.handler",
        //         architecture: lambda.Architecture.ARM_64,
        //         code: lambda.Code.fromAsset(
        //             path.resolve("..", "unbundled.zip")
        //         ),
        //         environment: {
        //             TABLE_NAME: table.tableName,
        //         },
        //     }
        // );

        // const ddbV2ArmFunction = new lambda.Function(this, "DDBV2ArmFunction", {
        //     ...SHARED_FUNCTION_PROPS,
        //     handler: "src/ddbV2Handler.handler",
        //     architecture: lambda.Architecture.ARM_64,
        //     code: lambda.Code.fromAsset(path.resolve("..", "unbundled.zip")),
        //     environment: {
        //         TABLE_NAME: table.tableName,
        //     },
        // });

        // table.grantWriteData(ddbV3Function);
        // table.grantWriteData(unbundledDdbV3Function);
        // table.grantWriteData(ddbV2Function);

        // table.grantWriteData(ddbV3ArmFunction);
        // table.grantWriteData(unbundledDdbV3ArmFunction);
        // table.grantWriteData(ddbV2ArmFunction);

        // httpApi.addRoutes({
        //     path: "/x86/ddb-v3",
        //     methods: [apigatewayv2.HttpMethod.GET],
        //     integration: new HttpLambdaIntegration(
        //         "BundledDDBLambdaIntegration",
        //         ddbV3Function
        //     ),
        // });

        // httpApi.addRoutes({
        //     path: "/x86/ddb-v2",
        //     methods: [apigatewayv2.HttpMethod.GET],
        //     integration: new HttpLambdaIntegration(
        //         "DDBV2LambdaIntegration",
        //         ddbV2Function
        //     ),
        // });

        // httpApi.addRoutes({
        //     path: "/x86/ddb-unbundled",
        //     methods: [apigatewayv2.HttpMethod.GET],
        //     integration: new HttpLambdaIntegration(
        //         "UnbundledDDBLambdaIntegration",
        //         unbundledDdbV3Function
        //     ),
        // });

        // httpApi.addRoutes({
        //     path: "/arm/ddb-bundled",
        //     methods: [apigatewayv2.HttpMethod.GET],
        //     integration: new HttpLambdaIntegration(
        //         "BundledDDBLambdaArmIntegration",
        //         ddbV3ArmFunction
        //     ),
        // });

        // httpApi.addRoutes({
        //     path: "/arm/ddb-v2",
        //     methods: [apigatewayv2.HttpMethod.GET],
        //     integration: new HttpLambdaIntegration(
        //         "DDBV2LambdaArmIntegration",
        //         ddbV2ArmFunction
        //     ),
        // });

        // httpApi.addRoutes({
        //     path: "/arm/ddb-unbundled",
        //     methods: [apigatewayv2.HttpMethod.GET],
        //     integration: new HttpLambdaIntegration(
        //         "UnbundledDDBLambdaArmIntegration",
        //         unbundledDdbV3ArmFunction
        //     ),
        // });

        new cdk.CfnOutput(this, "HttpApiUrlOutput", {
            value: httpApi.apiEndpoint,
            exportName: "httpApiEndpoint",
        });
    }
}