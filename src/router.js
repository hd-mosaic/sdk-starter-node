const Router = require('express').Router;

const {registerBind, sendNotification} = require('./notification_handler');
const tokenGenerator = require('./token_generator');
const config = require('./config');
const twilioUtil = require('./util/twilio-util');
const Twilio = require('twilio').Twilio;
const datasource = require('../db');
const SERVER_MODULE = 'service';

const router = new Router();

// Convert keys to camelCase to conform with the twilio-node api definition contract
const camelCase = require('camelcase');
function camelCaseKeys(hashmap) {
  var newhashmap = {};
  Object.keys(hashmap).forEach(function(key) {
    var newkey = camelCase(key);
    newhashmap[newkey] = hashmap[key];
  });
  return newhashmap;
};

router.get('/token', (req, res) => {
  let pid = req.query.pid;
  let cid = req.query.cid;
  console.log('cid: ', cid);
  console.log('pid: ', pid);
  let channelId = req.params.channelId;
  let serverId;
  let token;
  tokenGenerator(pid, cid).then((t) => {
    token = t;
    return twilioUtil.getService(cid);
  }).then((sId) => {
    serverId = sId;
    return twilioUtil.getUser(pid);
  }).then((userId) => {
    if(userId) {
      //
    } else {
      twilioUtil.createUser(pid, serverId);
    }
    res.send(token);
  });
  //res.send(tokenGenerator());
});

router.post('/token', (req, res) => {
  const identity = req.body.identity;
  tokenGenerator(identity).then((token) => {
    res.send(token);
  });
  //res.send(tokenGenerator(identity));
});

router.post('/register', (req, res) => {
  var content = camelCaseKeys(req.body);
  registerBind(content).then((data) => {
    res.status(data.status);
    res.send(data.data);
  });
});

router.post('/send-notification', (req, res) => {
  var content = camelCaseKeys(req.body);
  sendNotification(content).then((data) => {
    res.status(data.status);
    res.send(data.data);
  });
});

router.get('/config', (req, res) => {
  res.json(config);
});

module.exports = router;
