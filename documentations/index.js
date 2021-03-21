const path = require('path');
const { readFileSync, readdirSync } = require('fs');

exports.loadPaths = () => {
  let yamls = '';
  const basePath = path.join(__dirname, 'paths');
  readdirSync(basePath).forEach(file => {
    yamls += readFileSync(`${basePath}/${file}`, 'utf8');
  });
  return yamls;
};

exports.loadDefinitions = () => {
  let yamls = '';
  const basePath = path.join(__dirname, 'definitions');
  readdirSync(basePath).forEach(file => {
    yamls += readFileSync(`${basePath}/${file}`, 'utf8');
  });
  return yamls;
};
