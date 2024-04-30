const fs = require('fs');
const path = require('path');
const id = require('../util/id');
const serialization = require('../util/serialization');

//  ________________________________________
// / NOTE: You should use absolute paths to \
// | make sure they are agnostic to where   |
// | your code is running from! Use the     |
// \ `path` module for that purpose.        /
//  ----------------------------------------
//         \   ^__^
//          \  (oo)\_______
//             (__)\       )\/\
//                 ||----w |
//                 ||     ||

const store = {};

store.get = (name, cb) => {
  const nid = id.getNID(global.nodeConfig);
  if (name === null) {
    // better error-checking
    const keys = fs.readdirSync(path.join(__dirname,
        `../../store/${nid}/local`));
    cb(null, keys);
  } else if (typeof name === 'object') {
    if (name.key === null) {
      // better error-checking - also assumes no gid will be 'local'
      if (fs.existsSync(path.join(__dirname,
          `../../store/${nid}/${name.gid}`))) {
        const keys = fs.readdirSync(path.join(__dirname,
            `../../store/${nid}/${name.gid}`));
        cb(null, keys);
      } else {
        cb(null, []);
      }
    } else {
      fs.readFile(path.join(__dirname,
          `../../store/${nid}/${name.gid}/${name.key}`),
      'utf8', (err, data) => {
        if (err) {
          cb(new Error(err), null);
        } else {
          const obj = serialization.deserialize(data);
          cb(null, obj);
        }
      });
    }
  } else {
    fs.readFile(path.join(__dirname, `../../store/${nid}/local/${name}`),
        'utf8', (err, data) => {
          if (err) {
            cb(new Error(err), null);
          } else {
            const obj = serialization.deserialize(data);
            cb(null, obj);
          }
        });
  }
};

store.put = (obj, name, cb) => {
  const nid = id.getNID(global.nodeConfig);
  if (name === null) {
    name = id.getID(obj);
  }
  const serialized = serialization.serialize(obj);
  if (typeof name === 'object') {
    if (name.key === null) {
      name.key = id.getID(obj);
    }
    name.key = name.key.replace(/[^a-zA-Z0-9,:_.?-]/g, '');
    if (!fs.existsSync(path.join(__dirname, `../../store/${nid}`))) {
      fs.mkdirSync(path.join(__dirname, `../../store/${nid}`));
    }
    if (!fs.existsSync(path.join(__dirname,
        `../../store/${nid}/${name.gid}`))) {
      fs.mkdirSync(path.join(__dirname, `../../store/${nid}/${name.gid}`));
    }
    fs.writeFile(path.join(__dirname,
        `../../store/${nid}/${name.gid}/${name.key}`),
    serialized, (err) => {
      if (err) {
        cb(new Error(err), null);
      } else {
        cb(null, obj);
      }
    });
  } else {
    name = name.replace(/[^a-zA-Z0-9,:_.?-]/g, '');
    if (!fs.existsSync(path.join(__dirname, `../../store/${nid}`))) {
      fs.mkdirSync(path.join(__dirname, `../../store/${nid}`));
    }
    if (!fs.existsSync(path.join(__dirname, `../../store/${nid}/local`))) {
      fs.mkdirSync(path.join(__dirname, `../../store/${nid}/local`));
    }
    fs.writeFile(path.join(__dirname, `../../store/${nid}/local/${name}`),
        serialized, (err) => {
          if (err) {
            cb(new Error(err), null);
          } else {
            cb(null, obj);
          }
        });
  }
};

store.append = (obj, name, cb) => {
  const nid = id.getNID(global.nodeConfig);
  if (name === null) {
    name = id.getID(obj);
  }
  if (typeof name === 'object') {
    if (name.key === null) {
      name.key = id.getID(obj);
    }
    name.key = name.key.replace(/[^a-zA-Z0-9,:_.?-]/g, '');
    if (!fs.existsSync(path.join(__dirname, `../../store/${nid}`))) {
      fs.mkdirSync(path.join(__dirname, `../../store/${nid}`));
    }
    if (!fs.existsSync(path.join(__dirname,
        `../../store/${nid}/${name.gid}`))) {
      fs.mkdirSync(path.join(__dirname, `../../store/${nid}/${name.gid}`));
    }
    if (!fs.existsSync(path.join(__dirname,
        `../../store/${nid}/${name.gid}/${name.key}`))) {
      // initialize empty object
      fs.writeFileSync(path.join(__dirname,
          `../../store/${nid}/${name.gid}/${name.key}`),
      serialization.serialize({}));
    }
    const data = fs.readFileSync(path.join(__dirname,
        `../../store/${nid}/${name.gid}/${name.key}`), 'utf8');
    const dataObj = serialization.deserialize(data);
    for (const key of Object.keys(obj)) {
      if (!dataObj[key]) {
        dataObj[key] = [];
      }
      dataObj[key].push(...obj[key]);
    }
    const serializedDataObj = serialization.serialize(dataObj);
    fs.writeFileSync(path.join(__dirname,
        `../../store/${nid}/${name.gid}/${name.key}`), serializedDataObj);
    cb(null, obj);
  } else {
    name = name.replace(/[^a-zA-Z0-9,:_.?-]/g, '');
    if (!fs.existsSync(path.join(__dirname, `../../store/${nid}`))) {
      fs.mkdirSync(path.join(__dirname, `../../store/${nid}`));
    }
    if (!fs.existsSync(path.join(__dirname, `../../store/${nid}/local`))) {
      fs.mkdirSync(path.join(__dirname, `../../store/${nid}/local`));
    }
    if (!fs.existsSync(path.join(__dirname,
        `../../store/${nid}/local/${name}`))) {
      // initialize empty object
      fs.writeFileSync(path.join(__dirname,
          `../../store/${nid}/local/${name}`), serialization.serialize({}));
    }
    const data = fs.readFileSync(path.join(__dirname,
        `../../store/${nid}/local/${name}`), 'utf8');
    const dataObj = serialization.deserialize(data);
    for (const key of Object.keys(obj)) {
      if (!dataObj[key]) {
        dataObj[key] = [];
      }
      dataObj[key].push(...obj[key]);
    }
    const serializedDataObj = serialization.serialize(dataObj);
    fs.writeFileSync(path.join(__dirname,
        `../../store/${nid}/local/${name}`), serializedDataObj);
    cb(null, obj);
  }
};

store.del = (name, cb) => {
  const nid = id.getNID(global.nodeConfig);
  store.get(name, (e, v) => {
    if (e) {
      cb(e, null);
    } else {
      if (typeof name === 'object') {
        fs.unlink(path.join(__dirname,
            `../../store/${nid}/${name.gid}/${name.key}`), (err) => {
          if (err) {
            cb(new Error(err), null);
          } else {
            cb(null, v);
          }
        });
      } else {
        fs.unlink(path.join(__dirname,
            `../../store/${nid}/local/${name}`), (err) => {
          if (err) {
            cb(new Error(err), null);
          } else {
            cb(null, v);
          }
        });
      }
    }
  });
};

module.exports = store;
