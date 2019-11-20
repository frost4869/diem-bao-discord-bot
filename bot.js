let Discord = require("discord.js");
let logger = require("winston");
let auth = require("./auth.json");
let request = require("request");
const jobs = require("./job");

const MAIN_CHANNEL_ID = "436013570866806799";

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console(), {
  colorize: true
});
logger.level = "debug";

let bot = new Discord.Client();

function rep(message, customMess) {
  message.delete(1000);
  message.channel.send(customMess || `<@${message.author.id}> Genk cc nè`);
}

function isURL(str) {
  let pattern = new RegExp(
    "^(https?:\\/\\/)?" + // protocol
    "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
    "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
    "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
    "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
      "(\\#[-a-z\\d_]*)?$",
    "i"
  ); // fragment locator
  return !!pattern.test(str);
}

bot.on("ready", function() {
  logger.info("Connected");
  const ayy = bot.emojis.find(emoji => emoji.name === "pepe_thug");
  bot.channels
    .get(MAIN_CHANNEL_ID)
    .send(`Tao lại vừa thông minh hơn xíu dòi! ${ayy} `);
  jobs.crawDataJob.start();
  jobs.morningJob.start();
  jobs.remindHolidayJob.start();
});

bot.on("message", function(message) {
  if (message.content.toLowerCase().includes("genk.vn")) {
    rep(message);
  } else {
    if (isURL(message.content)) {
      request({ url: message.content, followRedirect: false }, function(
        error,
        response,
        body
      ) {
        if (response.statusCode >= 300 && response.statusCode < 400) {
          const realLink = response.headers.location;
          const isGenkLink = realLink.toLowerCase().includes("genk.vn");
          if (isGenkLink) {
            rep(message, `<@${message.author.id}> Uh có cố gắng, genk clmm`);
          }
        }
      });
    }
  }
});

bot.login(process.env.BOT_TOKEN || auth.token);
