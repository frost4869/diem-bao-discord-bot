
var Discord = require('discord.js');
var logger = require('winston');
var auth = require('./auth.json');
var request = require("request");

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
  colorize: true
});
logger.level = 'debug';

var bot = new Discord.Client();

function rep(message, customMess) {
  message.delete(1000)
  message.channel.send(customMess || 'Genk cc nè')
}

function isURL(str) {
  var pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
    '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
  return !!pattern.test(str);
}

bot.on('ready', function (evt) {
  logger.info('Connected');
});
bot.on('message', function (message) {
  if (message.content.toLowerCase().includes('genk.vn')) {
    rep(message)
  } else {
    if (isURL(message.content)) {
      request({ url: message.content, followRedirect: false }, function (error, response, body) {
        if (response.statusCode >= 300 && response.statusCode < 400) {
          const realLink = response.headers.location;
          const isGenkLink = realLink.toLowerCase().includes('genk.vn')
          if (isGenkLink) {
            rep(message, 'Uh có cố gắng, genk cc')
          }
        }
      });
    }
  }
});

bot.login(process.env.BOT_TOKEN || auth.token);
