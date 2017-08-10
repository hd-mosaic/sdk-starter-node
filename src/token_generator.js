const Q = require('q');
const config = require('./config');
const nameGenerator = require('../name_generator');
const twilioUtil = require('./util/twilio-util');

// Access Token used for Video, IP Messaging, and Sync
const AccessToken = require('twilio').jwt.AccessToken;
const IpMessagingGrant = AccessToken.IpMessagingGrant;
const VideoGrant = AccessToken.VideoGrant;
const SyncGrant = AccessToken.SyncGrant;


/**
 * Generate an Access Token for an application user - it generates a random
 * username for the client requesting a token or generates a token with an
 * identity if one is provided.
 *
 * @return {Object}
 *         {Object.identity} String random indentity
 *         {Object.token} String token generated
 */
function tokenGenerator(identity = 0, cid) {
  // Create an access token which we will sign and return to the client
  const token = new AccessToken(
    config.TWILIO_ACCOUNT_SID,
    config.TWILIO_API_KEY,
    config.TWILIO_API_SECRET
  );

  // Assign the provided identity or generate a new one
  token.identity = identity || nameGenerator();

  cid = cid || (Date.now() % 5) + '';
  return twilioUtil.getService(cid).then((sid) => {
    if(sid) {
      return Q(sid);
    } else {
      return twilioUtil.createChatService(cid);
    }
  }).then((sid) => {
    console.log('get sid: ', sid);
    let ipmGrant = new IpMessagingGrant({
      serviceSid: sid
    });
    token.addGrant(ipmGrant);

    return {
      identity: token.identity,
      token: token.toJwt()
    };
  });

  /*
  // Assign the provided identity or generate a new one
  token.identity = identity || nameGenerator();

  // Grant the access token Twilio Video capabilities
  const videoGrant = new VideoGrant();
  token.addGrant(videoGrant);

  if (config.TWILIO_CHAT_SERVICE_SID) {
    // Create a "grant" which enables a client to use IPM as a given user,
    // on a given device
    const ipmGrant = new IpMessagingGrant({
      serviceSid: config.TWILIO_CHAT_SERVICE_SID
    });
    token.addGrant(ipmGrant);
  }

  if (config.TWILIO_SYNC_SERVICE_SID) {
    // Create a "grant" which enables a client to use Sync as a given user,
    // on a given device
    const syncGrant = new SyncGrant({
      serviceSid: config.TWILIO_SYNC_SERVICE_SID
    });
    token.addGrant(syncGrant);
  }

  // Serialize the token to a JWT string and include it in a JSON response
  return {
    identity: token.identity,
    token: token.toJwt()
  };
  */
}

module.exports = tokenGenerator;
