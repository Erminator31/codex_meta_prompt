#!/usr/bin/env node
const fs = require('fs');
const espree = require("espree");
const estraverse = require('estraverse');
const escomplexCore = require('escomplex/src/core');
const escomplexWalker = require('escomplex/src/walker');
const glob = require('glob');
const { spawnSync } = require('child_process');

const ROOT = "C:/Users/ermin/WebstormProjects/codex_monolith"

function getFiles(dir, pattern){
  return glob.sync(pattern, {cwd: dir, absolute: true, nodir: true, ignore:['**/tools/**','**/node_modules/**','**/cypress/**','**/plato-report/**','**/cypress.config.js/**']});
}

function computeFunctionMetrics(fn){
  let complexity = 1;
  let maxDepth = 0;

  function traverse(node, depth){
    if(!node || typeof node !== 'object') return;
    if(Array.isArray(node)) return node.forEach(n => traverse(n, depth));

    // Skip nested functions
    if(['FunctionDeclaration','FunctionExpression','ArrowFunctionExpression'].includes(node.type)){
      return;
    }

    maxDepth = Math.max(maxDepth, depth);

    switch(node.type){
      case 'IfStatement':
        complexity++;
        traverse(node.test, depth);
        traverse(node.consequent, depth + 1);
        traverse(node.alternate, depth + 1);
        break;
      case 'ForStatement':
      case 'ForInStatement':
      case 'ForOfStatement':
      case 'WhileStatement':
      case 'DoWhileStatement':
        complexity++;
        traverse(node.body, depth + 1);
        break;
      case 'SwitchStatement':
        complexity += node.cases.filter(c => c.test).length;
        node.cases.forEach(c => traverse(c, depth + 1));
        break;
      case 'SwitchCase':
        traverse(node.consequent, depth + 1);
        break;
      case 'TryStatement':
        traverse(node.block, depth + 1);
        if(node.handler){
          complexity++;
          traverse(node.handler, depth + 1);
        }
        if(node.finalizer) traverse(node.finalizer, depth + 1);
        break;
      case 'CatchClause':
        traverse(node.body, depth + 1);
        break;
      case 'LogicalExpression':
        if(node.operator === '&&' || node.operator === '||') complexity++;
        traverse(node.left, depth);
        traverse(node.right, depth);
        break;
      case 'ConditionalExpression':
        complexity++;
        traverse(node.test, depth);
        traverse(node.consequent, depth + 1);
        traverse(node.alternate, depth + 1);
        break;
      default:
        Object.keys(node).forEach(key => {
          const child = node[key];
          if(child && typeof child === 'object') traverse(child, depth);
        });
    }
  }

  if(fn.body){
    traverse(fn.body, 0);
  }

  const loc = fn.loc ? fn.loc.end.line - fn.loc.start.line + 1 : 0;
  return {cyclomatic: complexity, depth: maxDepth, loc};
}

function analyzeJS(file){
  const src = fs.readFileSync(file, 'utf8');
  console.log("Analyzing", file);
  const ast = espree.parse(src, {ecmaVersion: "latest", sourceType: "module", comment:true, loc:true});
  const commentLines = (ast.comments||[]).reduce((s,c)=>s + (c.loc.end.line - c.loc.start.line + 1),0);
  const lines = src.split(/\r?\n/).length;
  const stats = escomplexCore.analyse(ast, escomplexWalker, {});
  const tokens = espree.tokenize(src, {ecmaVersion: "latest"});
  const varNames = tokens.filter(t=>t.type==="Identifier").map(t=>t.value);

  const functionNodes = [];
  estraverse.traverse(ast, {
    enter(node){
      if(['FunctionDeclaration','FunctionExpression','ArrowFunctionExpression'].includes(node.type)){
        functionNodes.push(node);
      }
    }
  });

  const metrics = functionNodes.map(fn => computeFunctionMetrics(fn));
  const ccValues = metrics.map(m => m.cyclomatic);
  const cognitiveVals = ccValues.slice();
  const locs = metrics.map(m => m.loc);
  const depths = metrics.map(m => m.depth);

   
  const nameScore = varNames.filter(n=>n.length>=3).length / (varNames.length || 1);
  const bugs = stats.aggregate ? stats.aggregate.halstead.bugs : 0;


  return {
    file,
    lines,
    commentLines,
    ccAverage: ccValues.reduce((a,b)=>a+b,0) / (ccValues.length || 1),
  
    cognitiveMax: Math.max(0, ...cognitiveVals),

    overlong: locs.filter(l => l > 30).length,
    maxDepth: Math.max(0, ...depths),
    nameQuality: nameScore,
    bugs
  };
}

function scoreCommentRatio(r){
  if(r >= 0.25) return 5;
  if(r >= 0.18) return 4;
  if(r >= 0.12) return 3;
  if(r >= 0.08) return 2;
  if(r >= 0.04) return 1;
  return 0;
}

function scoreCognitive(c){
  if(c < 3) return 5;
  if(c < 5) return 4;
  if(c < 8) return 3;
  if(c < 12) return 2;
  if(c < 20) return 1;
  return 0;
}

function scoreNameQuality(q){
  if(q >= 0.90) return 5;
  if(q >= 0.80) return 4;
  if(q >= 0.60) return 3;
  if(q >= 0.40) return 2;
  if(q >= 0.20) return 1;
  return 0;
}

function scoreStructure(over, depth){
  if(over === 0 && depth <= 2) return 5;
  if(over <= 1 && depth <= 4) return 4;
  if(over <= 2 && depth <= 6) return 3;
  if(over <= 3 && depth <= 8) return 2;
  if(over <= 5 && depth <= 10) return 1;
  return 0;
}

function scoreBugs(b){
  if(b <= 0.10) return 5;
  if(b <= 1.10) return 4;
  if(b <= 3.00) return 3;
  if(b <= 6.00) return 2;
  if(b <= 10.00) return 1;
  return 0;
}

function scoreCyclomatic(c){
  if(c < 3) return 5;
  if(c < 5) return 4;
  if(c < 10) return 3;
  if(c < 20) return 2;
  if(c < 50) return 1;
  return 0;
}

function scoreSyntaxErrors(e){
  if(e === 0) return 5;
  if(e <= 2) return 4;
  if(e <= 5) return 3;
  if(e <= 10) return 2;
  if(e <= 20) return 1;
  return 0;
}

function countSyntaxErrors(){
  let total = 0;

  const run = (cmd, args) => spawnSync(cmd, args, {cwd: ROOT, encoding: 'utf8'});

  try{
    const es = run('npx', ['eslint', '**/*.js', '-f', 'json']);
    if(es.status > 1) return {errors: Infinity};
    if(es.stdout){
      try{
        const data = JSON.parse(es.stdout);
        data.forEach(f => {
          (f.messages||[]).forEach(m => {
            if(m.fatal || /Parsing error/i.test(m.message)) total++;
          });
        });
      }catch{ return {errors: Infinity}; }
    }

    const st = run('npx', ['stylelint', '**/*.css', '--formatter', 'json']);
    if(st.status > 2) return {errors: Infinity};
    if(st.stdout){
      try{
        const data = JSON.parse(st.stdout);
        data.forEach(f => { total += (f.parseErrors||[]).length; });
      }catch{ return {errors: Infinity}; }
    }

    const ht = run('npx', ['htmllint', '**/*.html']);
    if(ht.status > 1) return {errors: Infinity};
    if(ht.stdout){
      total += ht.stdout.split(/\r?\n/).filter(l => /line\s+\d+/i.test(l)).length;
    }
  }catch{
    return {errors: Infinity};
  }

  return {errors: total};
}

const jsFiles = getFiles(ROOT, '**/*.js');
const results = jsFiles.map(analyzeJS);

const totalLines = results.reduce((a,r)=>a + r.lines, 0);
const commentLines = results.reduce((a,r)=>a + r.commentLines, 0);
const avgCc = results.reduce((a,r)=>a + r.ccAverage, 0) / (results.length || 1);
const maxCognitive = Math.max(...results.map(r=>r.cognitiveMax), 0);
const overlong = results.reduce((a,r)=>a + r.overlong, 0);
const maxDepth = Math.max(...results.map(r=>r.maxDepth), 0);
const nameQuality = results.reduce((a,r)=>a + r.nameQuality, 0) / (results.length || 1);
const totalBugs = results.reduce((a,r)=>a + r.bugs, 0);
const bugsPerK = totalLines > 0 ? (totalBugs * 1000) / totalLines : 0;
const {errors: syntaxErrors} = countSyntaxErrors();

console.log('Comment ratio:', commentLines / totalLines);
console.log('Max cognitive complexity:', maxCognitive);
console.log('Naming quality:', nameQuality);
console.log('Overlong functions:', overlong, 'Max depth:', maxDepth);
console.log('Bugs per KLOC:', bugsPerK);
console.log('Average cyclomatic:', avgCc);
console.log('Syntax errors:', syntaxErrors);

const scores = {
  comment: scoreCommentRatio(commentLines / totalLines),
  cognitive: scoreCognitive(maxCognitive),
  name: scoreNameQuality(nameQuality),
  structure: scoreStructure(overlong, maxDepth),
  bugs: bugsPerK,
  cyclomatic: scoreCyclomatic(avgCc),
  syntax: syntaxErrors
};

console.log('Scores:', scores);

