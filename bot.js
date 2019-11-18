var Discord = require('discord.js');
var logger = require('winston');
var auth = require('./auth.json');
var request = require("request");
var CronJob = require('cron').CronJob;
const cheerio = require('cheerio');
const fs = require('fs');
var threadList = [];
const mainChannel = '436013570866806799';
var holiday_jp = require('@holiday-jp/holiday_jp');


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

function get_closest_holiday_in_week() {
    var holidays = holiday_jp.between(new Date('2010-09-14'), new Date('2010-09-21'));
    console.log(holidays[0]['name']); // 敬老の日
}

const job = new CronJob('0 */10 10-12 * * 1-5', function() {
    crawl_data();
    if (threadList !== undefined && threadList.length != 0) {
        // array empty or does not exist
        var thread = threadList.shift();
        // console.log(thread);
        bot.channels.get(mainChannel).send(thread);
    }
}, null, true, 'Asia/Bangkok');

const morningJob = new CronJob('0 0 10 * * *', function() {
    bot.channels.get(mainChannel).send('Ồ Hái Dò');
}, null, true, 'Asia/Bangkok');

const remindHolidayJob = new CronJob('0/10 * * * * *', function() {
    var today = new Date();
    var tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    if ((new Date('2019-11-23').getDay() % 6)) {
        var holidays = holiday_jp.between(new Date('2019-11-23'), new Date('2019-11-23'));
        if (holidays.length != 0) {
            console.log("<@" + "Bủ#1605" + "> " + "Mai là ngày đỏ nha");
        }
    } else {
        console.log("<@" + "Bủ#1605" + "> " + "Mai là cúi từng nha");
    }
}, null, true, 'Asia/Bangkok');

bot.on('ready', function(evt) {
    logger.info('Connected');
    job.start();
    morningJob.start();
    remindHolidayJob.start();
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