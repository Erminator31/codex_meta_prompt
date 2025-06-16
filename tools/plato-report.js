#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const os = require('os');
const glob = require('glob');
const babel = require('@babel/core');
const plato = require('es6-plato');

const ROOT = "C:/Users/ermin/WebstormProjects/codex_monolith";
const OUTPUT = path.join(ROOT, 'plato-report');

function getFiles(dir, pattern){
  return glob.sync(pattern, {cwd: dir, absolute: true, nodir: true, ignore:['**/tools/**','**/node_modules/**','**/cypress/**','**/plato-report/**','**/cypress.config.js/**']});
}

const files = getFiles(ROOT, '**/*.js');

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'plato-'));

function transpile(file){
  const {code} = babel.transformFileSync(file, {presets: ['@babel/preset-env']});
  const out = path.join(TMP, path.relative(ROOT, file).replace(/[\\/]/g, '_'));
  fs.writeFileSync(out, code, 'utf8');
  return out;
}

const transpiledFiles = files.map(transpile);

if(files.length === 0){
  console.error('No JavaScript files found.');
  process.exit(1);
}

plato.inspect(transpiledFiles, OUTPUT, {title: 'Plato Report'}, () => {
  console.log('Plato report generated at', OUTPUT);
});
