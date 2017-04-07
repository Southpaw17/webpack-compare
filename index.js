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

        if (!fs.existsSync(oldPath)) {
            console.error(chalk.red(`Error: ${oldPath} does not exist!`));
            process.exit(1);
        }

        if (!fs.existsSync(newPath)) {
            console.error(chalk.red(`Error: ${newPath} does not exist!`));
            process.exit(1);
        }

        function reducer(acc, value) {
            acc[value.name] = value.size;
            return acc;
        }

        function convert(o, n) {
            return {
                oldSize: o ? `${(o / 1024).toFixed(2)} KB` : '',
                newSize: n ? `${(n / 1024).toFixed(2)} KB` : '',
                diff: (o && n) ? `${((n - o) / 1024).toFixed(2)} KB` : '',
                pdiff: (o && n) ? `${((1 - (n / o)) * -100).toFixed(2)}%` : '',
                class: (o - n) >= 0 ? 'smaller' : (o && n) ? 'bigger' : ''
            };
        }

        oldAssets = require(oldPath).assets.reduce(reducer, {});
        newAssets = require(newPath).assets.reduce(reducer, {});

        _.mergeWith(oldAssets, newAssets, convert)

        let st = '';
        _.forEach(oldAssets, function (value, key) {
            value = _.isNumber(value) ? convert(value) : value;
            let row = `<tr class='${value.class}'><td>${key}</td><td>${value.oldSize}</td><td>${value.newSize}</td><td>${value.diff}</td><td>${value.pdiff}</td></tr>`;
            st += row;
        });

        if (!fs.existsSync(outputPath)) fs.mkdirSync(outputPath);

        fs.writeFileSync(path.resolve(outputPath, 'styles.css'), fs.readFileSync(path.resolve(__dirname, 'styles.css')));

        let tmpl = _.template(fs.readFileSync(path.resolve(__dirname, 'index.html')));

        fs.writeFileSync(path.resolve(outputPath, 'index.html'), tmpl({ rows: st }));


        process.exit(0);
    })
    .parse(process.argv);