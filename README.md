# Lambda Node.js esbuild sample

This repo showcase how to use esbuild to bundle and minify your Node.js AWS Lambda functions

## Prerequisits

1. Node.js
2. AWS CDK
   This sample showcases how to use esbuild to minify and bundle your Node.js AWS Lambda functions

## Install deps

    npm i

## Build

    npm run build

## Deploy

    npm run deploy

## Measure performance

Execute the following command:

    ./loadtest.sh {YOUR_URL_TO_API_GATEWAY_HERE}

The URL can be found in the output of the deploy step.

1. Wait for the loadtest to complete running

2. In AWS Console, navigate to Cloudwatch and select **Logs Insights** from the navigation pane.

3. Search for esbuild in the "_Select log group(s)_" field and select the log groups you would like to see.

4. Paste the following query in the textfield and click on "_Run query_"

    ```SQL
    filter @type = "REPORT"
    | parse @log /\d+:\/aws\/lambda\/[\w\d]+-(?<function>[\w\d]+)Func[\w\d]+-[\w\d]+/
    | parse @log /\d+:\/aws\/lambda\/[\w\d]+-[\w\d]+(?<arm>Arm)[\w\d]+-[\w\d]+/
    | stats
    count(*) as invocations,
    pct(@duration+greatest(@initDuration,0), 0) as p0,
    pct(@duration+greatest(@initDuration,0), 25) as p25,
    pct(@duration+greatest(@initDuration,0), 50) as p50,
    pct(@duration+greatest(@initDuration,0), 75) as p75,
    pct(@duration+greatest(@initDuration,0), 90) as p90,
    pct(@duration+greatest(@initDuration,0), 95) as p95,
    pct(@duration+greatest(@initDuration,0), 99) as p99,
    pct(@duration+greatest(@initDuration,0), 100) as p100
    group by function, ispresent(@initDuration) as coldstart, ispresent(arm) as arm64
    | sort by function
    ```

## Cleanup

    npm run destroy

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.
