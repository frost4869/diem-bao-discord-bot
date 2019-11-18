var Discord = require('discord.js');
var logger = require('winston');
var auth = require('./auth.json');
var request = require("request");
var CronJob = require('cron').CronJob;
const cheerio = require('cheerio');
const fs = require('fs');
var threadList = [];
const mainChannel = '436013570866806799';

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';

var bot = new Discord.Client();

function rep(message, customMess) {
    message.delete(1000)
    message.channel.send(customMess || "<@" + message.author.id + "> " + 'Genk cc nè')
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

const job = new CronJob('0 */10 10-12 * * 1-5', function() {
    if (threadList !== undefined && threadList.length != 0) {
        // array empty or does not exist
        var thread = threadList.shift();
        // console.log(thread);
        bot.channels.get(mainChannel).send(thread);
    }
});

const morningJob = new CronJob('0 0 10 * * *', function() {
    bot.channels.get(mainChannel).send('Dò');
});

bot.on('ready', function(evt) {
    logger.info('Connected');
    crawl_data();
    job.start();
    morningJob.start();

});
bot.on('message', function(message) {
    if (message.content.toLowerCase().includes('genk.vn')) {
        rep(message)
    } else {
        if (isURL(message.content)) {
            request({ url: message.content, followRedirect: false }, function(error, response, body) {
                if (response.statusCode >= 300 && response.statusCode < 400) {
                    const realLink = response.headers.location;
                    const isGenkLink = realLink.toLowerCase().includes('genk.vn')
                    if (isGenkLink) {
                        rep(message, "<@" + message.author.id + "> " + 'Uh có cố gắng, genk clmm')
                    }
                }
            });
        }
    }
});

function crawl_data() {
    var customHeaderRequest = request.defaults({
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36' }
    })
    customHeaderRequest.get('https://forums.voz.vn/forumdisplay.php?f=33', function(err, resp, body) {
        var $ = cheerio.load(body);
        var threads = $('table#threadslist tr');
        $(threads).each(function(i, thread) {
            var link = $(thread).find('td:nth-of-type(2) > div > a');
            var url = $(link).attr('href');
            var isToday = $(thread).find('td:nth-of-type(3) > div').text().includes('Today');
            if (url != undefined && isToday && checkShowthread(url)) {
                logger.info(url);
                threadList.push("https://forums.voz.vn/" + url);
            }
        });
    });
}

function checkShowthread(url) {
    return url.toLowerCase().includes('showthread');
}

bot.login(process.env.BOT_TOKEN || auth.token);