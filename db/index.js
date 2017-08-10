const fs = require('fs');
const _ = require('lodash');
const Q = require('q');
const path = require('path');
const config = {
  'service' : 'service.js',
  'channel': 'channel.js',
  'user': 'user.js'
};

module.exports.loader = (module) => {
  let file = config[module];
  return JSON.parse(fs.readFileSync(path.resolve(__dirname, './'+file), 'utf8'));
};

module.exports.setter = (module, data) => {
  let file = config[module];
  let content = this.loader(module);
  content = Object.assign(content, data);
  fs.writeFileSync(path.resolve(__dirname, './'+file), JSON.stringify(content), 'utf8', null, 4);
};