#!/bin/sh

URL=$1

function loadtest() {
    artillery run -t "$URL" -v '{ "url": '"\"$1\""' }' loadtest.yml
}

loadtest /arm/v2
loadtest /arm/v2-unbundled
loadtest /arm/v2-top-level
loadtest /arm/v2-top-level-unbundled
loadtest /arm/v3
loadtest /arm/v3-unbundled
loadtest /x86/v2
loadtest /x86/v2-unbundled
loadtest /x86/v2-top-level
loadtest /x86/v2-top-level-unbundled
loadtest /x86/v3
loadtest /x86/v3-unbundled
loadtest /hello
loadtest /hello-large