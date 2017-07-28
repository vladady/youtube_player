var alexa = require('alexa-app');
var rp = require('request-promise');
var config = require('./config');

// Allow this module to be reloaded by hotswap when changed
module.change_code = 1;

// Define an alexa-app
var app = new alexa.app('youtube_player');
app.id = require('./package.json').alexa.applicationId;

app.launch(function(req, res) {
  console.log('app.launch');
  var prompt = "Welcome to Youtube Player! What video do you want to play?";
  //res.say().send();
  res.say(prompt).reprompt(prompt).shouldEndSession(false);
});

app.intent('PlayIntent', {
  "slots": {"song": "AMAZON.LITERAL"},
  "utterances": [
//    "{-|song}",
    "Play {-|song}"
  ],
}, function(req, res) {
  var song = req.slot("song");

  console.log("Slot: " + song);

  return getVideoID(song).then(function(result) {
    res.say("Now playing, " + result.title);

    var stream = {
      "url": config.endpoint + "?videoID=" + result.vidID,
      "token": "some_token",
      "offsetInMilliseconds": 0
    };
    console.log("Now playing " + config.endpoint + "?videoID=" + result.vidID);
    res.audioPlayerPlayStream("REPLACE_ALL", stream);
    res.send();
  });
});

app.intent('AMAZON.PauseIntent', {},
  function(req, res) {
    console.log('app.AMAZON.PauseIntent');
    res.audioPlayerStop();
    res.send();
  }
);

app.audioPlayer("PlaybackNearlyFinished", function(request, response) {
  response.say("The end is near");
});

module.exports = app;

function getVideoID(query) {
  var url = "https://www.googleapis.com/youtube/v3/search?";
  var token = config.yt_api_key;
  var query = {
    part: "snippet",
    q: query,
    type: "video",
    key: token
  };

  for (part in query) {
    url += part + "=" + query[part] + "&";
  }

  var options = {
      uri: url,
      json: true
  };

  console.log("Request sending to youtube");
  return rp(options)
    .then(function (htmlString) {
      var items = htmlString.items;
      for (item in items) {
        var result = {
          title: items[item].snippet.title,
          vidID: items[item].id.videoId
        }
        break;
      }

      console.log("Matched video: " + result.title);
      return result;
    })
    .catch(function (err) {

    });
}
