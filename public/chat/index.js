$(function() {
  // Get handle to the chat div
  var $chatWindow = $('#messages');

  // Our interface to the Chat service
  var chatClient;

  // A handle to the "general" chat channel - the one and only channel we
  // will have in this sample app
  var generalChannel;

  // The server will assign the client a random username - store that value
  // here
  var username;

  // Helper function to print info messages to the chat window
  function print(infoMessage, asHtml) {
    var $msg = $('<div class="info">');
    if (asHtml) {
      $msg.html(infoMessage);
    } else {
      $msg.text(infoMessage);
    }
    $chatWindow.append($msg);
  }

  // Helper function to print chat message to the chat window
  function printMessage(fromUser, message) {
    var $user = $('<span class="username">').text(fromUser + ':');
    if (fromUser === username) {
      $user.addClass('me');
    }
    var $message = $('<span class="message">').text(message);
    var $container = $('<div class="message-container">');
    $container.append($user).append($message);
    $chatWindow.append($container);
    $chatWindow.scrollTop($chatWindow[0].scrollHeight);
  }

  function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
      results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
  }
  let cid = getParameterByName('cid');
  let pid = getParameterByName('pid');
  let channelId = getParameterByName('channelId');
  console.log('cid = ', cid, ' pid = ', pid, ' channelId = ', channelId);

  // Alert the user they have been assigned a random username
  print('Logging in...');

  // Get an access token for the current user, passing a username (identity)
  // and a device ID - for browser-based apps, we'll always just use the
  // value "browser"
  let data = {
    device: 'browser'
  };
  cid && (data.cid = cid);
  pid && (data.pid = pid);
  channelId && (data.channelId = channelId);
  $.getJSON('/token', data, function(data) {
    // Alert the user they have been assigned a random username
    username = data.identity;
    print('You have been assigned a random username of: '
    + '<span class="me">' + username + '</span>', true);

    // Initialize the Chat client
    let twClient = null;
    Twilio.Chat.Client.create(data.token).then((client) => {
      console.log('create client success: ', client);
      twClient = client;

      twClient.on('tokenExpired', (data) => {
        console.log('tokenExpired: ', data);
        twClient.updateToken(data.token);
      });

      twClient.on('userUpdated', (user) => {
        console.log('client user updated: ', user.state);
      });

      twClient.getSubscribedUsers().then((users) => {
        console.log('getSubscribedUsers: ', users);
        let userIds = ['a', 'b', 'c'];
        userIds.forEach((userId) => {
          twClient.getUser(userId).then((user) => {
            user.on('updated', (user) => {
              console.log('subscribed user updated: ', user);
            });
          });
        });
      });

      twClient.getSubscribedChannels().then((paginatorChannel)=> {
        let channels = paginatorChannel.items;
        console.log('getSubscribedChannels: ', channels);
      });

      return twClient.getChannelByUniqueName(channelId)
    }).then((channel)=> {
      if(channel) {
        generalChannel = channel;
        setupChannel();
      } else {
        twClient.createChannel({
          uniqueName: channelId,
          friendlyName: 'Custom Channel on Channel ' + channelId,
          isPrivate: false
        }).then((channel) => {
          console.log('channel: ', channel);
          generalChannel = channel;
          setupChannel();
        });
      }
    });
  });

  function createOrJoinGeneralChannel(paginator) {
    console.log('getSubscribedChannels: ', paginator);

    // Get the general chat channel, which is where all the messages are
    // sent in this simple application
    print('Attempting to join "general" chat channel...');
    var promise = chatClient.getChannelByUniqueName('general');
    promise.then(function(channel) {
      generalChannel = channel;
      console.log('Found general channel:');
      console.log(generalChannel);
      setupChannel();
    }).catch(function() {
      // If it doesn't exist, let's create it
      console.log('Creating general channel');
      chatClient.createChannel({
        uniqueName: 'general',
        friendlyName: 'General Chat Channel'
      }).then(function(channel) {
        console.log('Created general channel:');
        console.log(channel);
        generalChannel = channel;
        setupChannel();
      });
    });
  }

  // Set up channel after it has been found
  function setupChannel() {
    // Join the general channel
    generalChannel.join().then(function(channel) {
      print('Joined channel as '
      + '<span class="me">' + username + '</span>.', true);
    });

    // Listen for new messages sent to the channel
    generalChannel.on('messageAdded', function(message) {
      printMessage(message.author, message.body);
    });
  }

  // Send a new message to the general channel
  var $input = $('#chat-input');
  $input.on('keydown', function(e) {
    if (e.keyCode == 13) {
      generalChannel.sendMessage($input.val())
      $input.val('');
    }
  });
});
