#!/usr/bin/env node
let program = require('commander'),
    path = require('path'),
    fs = require('fs'),
    chalk = require('chalk'),
    _ = require('lodash');

program
    .arguments('<old> <new>')
    .option('-o, --output <path>', 'Path to output file to. Defaults to compare/')
    .action(function (oldStats, newStats) {
        let output = program.output || 'compare/',
            oldPath = path.resolve(process.cwd(), oldStats),
            newPath = path.resolve(process.cwd(), newStats),
            outputPath = path.resolve(process.cwd(), output);

        function checkPathExists(p) {
            if (!fs.existsSync(p)) {
                console.error(chalk.red(`Error: ${p} does not exist!`));
                process.exit(1);
            }
        }

        checkPathExists(oldPath);
        checkPathExists(newPath);

        function reducer(acc, value) {
            acc[value.name] = value.size;
            return acc;
        }

        oldAssets = require(oldPath).assets.reduce(reducer, {});
        newAssets = require(newPath).assets.reduce(reducer, {});

        // function convert(o, n) {
        //     return {
        //         oldSize: o ? `${(o / 1024).toFixed(2)} KB` : '',
        //         newSize: n ? `${(n / 1024).toFixed(2)} KB` : '',
        //         diff: (o && n) ? `${((n - o) / 1024).toFixed(2)} KB` : '',
        //         pdiff: (o && n) ? `${((1 - (n / o)) * -100).toFixed(2)}%` : '',
        //         class: (o - n) >= 0 ? 'smaller' : (o && n) ? 'bigger' : ''
        //     };
        // }

        function convert(o, n) {
            return {
                oldSize: o / 1024,
                newSize: n / 1024,
                diff: (n - o) / 1024,
                pdiff: (1 - (n / o)) * -100
            }
        }

        // Ensures that old assets not represented in the new build are still included on the report
        // _.mergeWith(oldAssets, newAssets, convert)

        oldAssets = _.mapValues(oldAssets, (value) => { return { oldSize: value } });
        newAssets = _.mapValues(newAssets, (value) => { return { newSize: value } });

        _.merge(oldAssets, newAssets);

        oldAssets = _.mapValues(oldAssets, (value) => {
            return {
                oldSize: value.oldSize / 1024,
                newSize: value.newSize / 1024,
                diff: (value.newSize - value.oldSize) / 1024,
                pdiff: (1 - (value.newSize / value.oldSize)) * -100
            }
        })

        let bigger = {},
            smaller = {},
            noChange = {},
            onlyInOld = {},
            onlyInNew = {};

        _.forEach(oldAssets, (value, key) => {

            if (Math.abs(value.pdiff) < 5) {
                noChange[key] = value;
                return;
            }

            if (value.diff > 0) {
                bigger[key] = value;
                return;
            }

            if (value.diff < 0) {
                smaller[key] = value;
                return;
            }

            if (value.oldSize && !value.newSize) {
                onlyInOld[key] = value;
                return;
            }

            if (value.newSize && !value.oldSize) {
                onlyInNew[key] = value;
                return;
            }
        });

        function format(value) {
            let ret = {
                oldSize: value.oldSize ? `${value.oldSize.toFixed(2)} KB` : '',
                newSize: value.newSize ? `${value.newSize.toFixed(2)} KB` : '',
                diff: value.diff ? `${value.diff.toFixed(2)} KB` : '',
                pdiff: value.pdiff ? `${value.pdiff.toFixed(2)}%` : ''
            };

            return ret;
        }

        bigger = _.mapValues(bigger, format);
        smaller = _.mapValues(smaller, format);
        noChange = _.mapValues(noChange, format);
        onlyInOld = _.mapValues(onlyInOld, format);
        onlyInNew = _.mapValues(onlyInNew, format);

        function convertToString(obj) {
            let st = '';
            _.forEach(obj, function (value, key) {
                let row = `<tr><td>${key}</td><td>${value.oldSize}</td><td>${value.newSize}</td><td>${value.diff}</td><td>${value.pdiff}</td></tr>`;
                st += row;
            });

            return st;
        }

        if (!fs.existsSync(outputPath)) fs.mkdirSync(outputPath);

        fs.writeFileSync(path.resolve(outputPath, 'styles.css'), fs.readFileSync(path.resolve(__dirname, 'styles.css')));

        let tmpl = _.template(fs.readFileSync(path.resolve(__dirname, 'index.html')));

        fs.writeFileSync(path.resolve(outputPath, 'index.html'), tmpl({
            bigger: convertToString(bigger),
            smaller: convertToString(smaller),
            same: convertToString(noChange),
            onlyOld: convertToString(onlyInOld),
            onlyNew: convertToString(onlyInNew)
        }));


        process.exit(0);
    })
    .parse(process.argv);