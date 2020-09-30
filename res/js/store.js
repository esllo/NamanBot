const fs = require('fs');
const path = require('path');
const electron = require('electron');

class Store {
  constructor(opts) {
    const userDataPath = (electron.app || electron.remote.app).getPath('userData');
    this.path = path.join(userDataPath, opts.configName + '.json');
    this.data = parseDataFile(this.path, opts.defaults);
  }
  
  get(key) {
    return this.data[key];
  }

  del(key){
    delete this.data[key];
    this.save();
  }
  
  set(key, val) {
    this.data[key] = val;
    this.save();
  }

  save(){
    fs.writeFileSync(this.path, JSON.stringify(this.data));
  }
}

function parseDataFile(filePath, defaults) {
  try {
    return JSON.parse(fs.readFileSync(filePath));
  } catch(error) {
    return defaults || {};
  }
}

module.exports = Store;