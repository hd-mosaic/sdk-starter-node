const Twilio = require('twilio').Twilio;
const Q = require('q');
const config = require('../config');
const datasource = require('../../db');

const SERVER_MODULE = 'server';
const USER_MODULE = 'user';
const prefix = 'ChatService';

module.exports.getService = (cid) => {
  //var client = new Twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN);
  let servers = datasource.loader(SERVER_MODULE);
  let sid = servers[cid];
  if(sid) {
    return Q(sid);
  } else {
    return Q(null);
  }
};

module.exports.createChatService = (cid) => {
  var client = new Twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN);
  return client.chat.services.create({
    friendlyName: prefix + cid
  }).then(function(response) {
    console.log(response);
    let data = {};
    data[cid] = response.sid;
    datasource.setter(SERVER_MODULE, data);
    return response.sid;
  }).catch(function(error) {
    console.log(error);
  });
};

module.exports.getUser = (pid) => {
  let servers = datasource.loader(USER_MODULE);
  let sid = servers[pid];
  if(sid) {
    return Q(sid);
  } else {
    return Q(null);
  }
};

module.exports.createUser = (pid, serverId) => {
  var client = new Twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN);
  var service = client.chat.services(serverId);
  service.users.create({
    identity: pid
  }).then(function(response) {
    console.log(response);
    let data = {};
    data[pid] = response.sid;
    datasource.setter(USER_MODULE, data);
    return response.sid;
  }).catch(function(error) {
    console.log(error);
  });
};