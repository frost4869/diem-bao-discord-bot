var Discord = require('discord.js');
var logger = require('winston');
var auth = require('./auth.json');
var request = require("request");
var CronJob = require('cron').CronJob;
const cheerio = require('cheerio');
const fs = require('fs');
const mainChannel = '436013570866806799';
var holiday_jp = require('@holiday-jp/holiday_jp');
var morningWords = ['Dò', 'Ò hái dó', 'Ồ hái dò'];
var newsList = [];
var posted = [];

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

const job = new CronJob('* */10 10-11 * * 1-5', function() {
    crawl_data().then(function(threadList) {
        sortNewsList(newsList);
        var topThread = newsList[0];
        console.log(topThread.url);
        newsList.splice(0, 1);
        posted.push(topThread.id);
        bot.channels.get(mainChannel).send(topThread.url);
    }).catch(function(err) {
        console.error(err.stack);
    });
    // if (threadList !== undefined && threadList.length != 0) {
    //     // array empty or does not exist
    //     // var thread = threadList.shift();
    //     // console.log(thread);
    //     // bot.channels.get(mainChannel).send(thread);
    // }
}, null, true, 'Asia/Bangkok');

const morningJob = new CronJob('0 0 9 * * *', function() {
    newsList = [];
    posted = [];

    var morningWord = morningWords[Math.floor(Math.random() * morningWords.length)];

    bot.channels.get(mainChannel).send(morningWord);
}, null, true, 'Asia/Bangkok');

const remindHolidayJob = new CronJob('0/10 * * * * *', function() {
    var today = new Date();
    var tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    if ((tomorrow.getDay() % 6)) {
        var holidays = holiday_jp.between(tomorrow, tomorrow);
        if (holidays.length != 0) {
            bot.channels.get(mainChannel).send("<@" + "Bủ#1605" + "> " + "Mai là ngày đỏ nha");
        }
    } else {
        console.log("<@" + "Bủ#1605" + "> " + "Mai là cúi từng nha");
    }
}, null, true, 'Asia/Bangkok');

bot.on('ready', function(evt) {
    logger.info('Connected');
    const ayy = bot.emojis.find(emoji => emoji.name === "pepe_gun_2");
    bot.channels.get(mainChannel).send(`Tao lại vừa thông minh hơn xíu dòi! ${ayy} `);
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
    return new Promise(function(resolve, reject) {
        var customHeaderRequest = request.defaults({
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36' }
        })
        customHeaderRequest.get('https://forums.voz.vn/forumdisplay.php?f=33', function(err, resp, body) {
            var $ = cheerio.load(body);
            var threads = $('table#threadslist > tbody#threadbits_forum_33 tr');
            threads.each(function(i, thread) {
                var link = $(thread).find('td:nth-of-type(2) > div > a');
                var title = $(link).text();
                var url = $(link).attr('href');
                var id = url.substring(url.indexOf('=') + 1);

                var icon = $(thread).find("td:nth-of-type(2) > div img.inlineimg[src='images/misc/sticky.gif']");
                var isSticky = $(icon).attr('alt') == 'Sticky Thread';

                var isToday = $(thread).find('td:nth-of-type(3) > div').text().includes('Today');
                var replyCount = parseInt($(thread).find('td:nth-of-type(4) > a').text().replace(',', ''));
                var viewCount = parseInt($(thread).find('td:nth-of-type(5)').text().replace(',', ''));
                var news = { id: id, url: "https://forums.voz.vn/" + url, isToday: isToday, title: title, reply: replyCount, view: viewCount };
                if (!isSticky && url.toLowerCase().includes('showthread') && isToday) {
                    if (newsList.map(thread => thread.id).includes(news.id)) {
                        newsList.splice(newsList.map(thread => thread.id).indexOf(news.id), 1);
                    }
                    if (!posted.includes(news.id))
                        newsList.push(news);

                }
            });
            // console.log('chua sort');
            console.log(newsList.length);
            resolve(newsList);
        });
    });
}

function sortNewsList(newsList) {
    newsList.sort(function(a, b) { return ((b.reply * 0.7 + b.view * 0.3) - (a.reply * 0.7 + a.view * 0.3)) });
}


bot.login(process.env.BOT_TOKEN || auth.token);