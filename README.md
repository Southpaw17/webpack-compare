# Webpack Compare

## Install
`npm i -g webpack-compare`

## Introduction
Ever wonder if a change you made, either to your build configuration or source, had a positive impact on the size of your Webpack bundles?  `webpack-compare` aims to provide an easy-to-read comparison between a previous build and your latest build.  Just use the StatsWriterPlugin to collect some info about your build and pass the stats.json into webpack-compare to see how your bundle sizes have changed over time.

## Usage
Run your Webpack build to produce a stats.json from the StatsWriterPlugin.  Store that somewhere so it doesn't get overwritten by a future build.  Make whatever changes you want to test and run the Webpack build again to generate an updated stats.json.  Then, run the cli to produce a report.

`webpack-compare stats-old.json stats.json`

Then open up `compare/index.html` in your favorite browser.  If you want to change the output path just do the following:

`webpack-compare stats-old.json stats.json -o /sweet/new/path`

And you'll find your report at `/sweet/new/path/index.html`.
