let Discord = require("discord.js");
let logger = require("winston");
let auth = require("./auth.json");
let request = require("request");

const MAIN_CHANNEL_ID = "436013570866806799";

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console(), {
    colorize: true
});
logger.level = "debug";

let bot = new Discord.Client();

const jobs = require("./job")(bot);

const botUpdateEmojis = [
    "pepe_thug",
    "pepe_gun",
    "shame",
    "pepe_up",
    "pepe_ok",
    "kappa",
    "PogChamp",
    "pepe_gun_2",
    "pepe_boss"
];

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
    const randomEmo =
        botUpdateEmojis[Math.floor(Math.random() * botUpdateEmojis.length)];
    const ayy = bot.emojis.find(emoji => emoji.name === randomEmo);
    // bot.channels
    //   .get(MAIN_CHANNEL_ID)
    //   .send(`Tao lại vừa thông minh hơn xíu dòi! ${ayy} `);
    jobs.crawDataJob.start();
    jobs.morningJob.start();
    jobs.remindHolidayJob.start();
});

bot.on("message", function(message) {
    const { content, author } = message;
    if (content.toLowerCase().includes("genk.vn")) {
        rep(message);
    } else {
        if (isURL(content)) {
            request({ url: content, followRedirect: false }, function(
                error,
                response,
                body
            ) {
                if (response.statusCode >= 300 && response.statusCode < 400) {
                    const realLink = response.headers.location;
                    const isGenkLink = realLink.toLowerCase().includes("genk.vn");
                    if (isGenkLink) {
                        rep(message, `<@${author.id}> Uh có cố gắng, genk clmm`);
                    }
                }
            });
        }
    }
});

bot.login(process.env.BOT_TOKEN || auth.token);