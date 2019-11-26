const CronJob = require("cron").CronJob;
const cheerio = require("cheerio");
const holiday_jp = require("@holiday-jp/holiday_jp");
const request = require("request");

const MAIN_CHANNEL_ID = "436013570866806799";

let newsList = [];
let posted = [];
const morningWords = ["Dò", "Ò hái dó", "Ồ hái dò", "o2yo"];
var myBot;

const remindHolidayJob = new CronJob(
    "0 0 16 * * *",
    function() {
        let today = new Date();
        let tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);
        if (tomorrow.getDay() % 6) {
            let holidays = holiday_jp.between(tomorrow, tomorrow);
            if (holidays.length != 0) {
                myBot.channels
                    .get(MAIN_CHANNEL_ID)
                    .send(`<@Bủ#1605> Mai là ngày đỏ nha`);
            }
        } else {
            console.log(`<@Bủ#1605> Mai là cúi từng nha`);
        }
    },
    null,
    true,
    "Asia/Bangkok"
);

const crawDataJob = new CronJob(
    "0 */20 10-11 * * 1-6",
    function() {
        crawl_data()
            .then(function(threadList) {
                sortNewsList(newsList);
                let topThread = newsList[0];
                newsList.splice(0, 1);
                posted.push(topThread.id);
                myBot.channels.get(MAIN_CHANNEL_ID).send(topThread.url);
            })
            .catch(function(err) {
                console.error(err.stack);
            });
    },
    null,
    true,
    "Asia/Bangkok"
);

const morningJob = new CronJob(
    "0 0 9 * * *",
    function() {
        newsList = [];
        posted = [];

        let morningWord =
            morningWords[Math.floor(Math.random() * morningWords.length)];

        myBot.channels.get(MAIN_CHANNEL_ID).send(morningWord);
    },
    null,
    true,
    "Asia/Bangkok"
);

function crawl_data() {
    return new Promise(function(resolve, reject) {
        let customHeaderRequest = request.defaults({
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36"
            }
        });
        customHeaderRequest.get(
            "https://forums.voz.vn/forumdisplay.php?f=33",
            function(err, resp, body) {
                let $ = cheerio.load(body);
                let threads = $("table#threadslist > tbody#threadbits_forum_33 tr");
                threads.each(function(i, thread) {
                    let link = $(thread).find("td:nth-of-type(2) > div > a");
                    let title = $(link).text();
                    let url = $(link).attr("href");
                    let id = url.substring(url.indexOf("t=") + 2);

                    let icon = $(thread).find(
                        "td:nth-of-type(2) > div img.inlineimg[src='images/misc/sticky.gif']"
                    );
                    let isSticky = $(icon).attr("alt") == "Sticky Thread";

                    let isToday = $(thread)
                        .find("td:nth-of-type(3) > div")
                        .text()
                        .includes("Today");
                    let replyCount = parseInt(
                        $(thread)
                        .find("td:nth-of-type(4) > a")
                        .text()
                        .replace(",", "")
                    );
                    let viewCount = parseInt(
                        $(thread)
                        .find("td:nth-of-type(5)")
                        .text()
                        .replace(",", "")
                    );
                    let news = {
                        id: id,
                        url: "https://forums.voz.vn/" + url,
                        isToday: isToday,
                        title: title,
                        reply: replyCount,
                        view: viewCount
                    };
                    if (!isSticky &&
                        url.toLowerCase().includes("showthread") &&
                        isToday
                    ) {
                        if (newsList.map(thread => thread.id).includes(news.id)) {
                            newsList.splice(
                                newsList.map(thread => thread.id).indexOf(news.id),
                                1
                            );
                        }
                        if (!posted.includes(news.id)) newsList.push(news);
                    }
                });
                resolve(newsList);
            }
        );
    });
}

function sortNewsList(newsList) {
    newsList.sort(function(a, b) {
        return b.reply * 0.7 + b.view * 0.3 - (a.reply * 0.7 + a.view * 0.3);
    });
}

module.exports = function(bot) {
    myBot = bot;
    return { remindHolidayJob: remindHolidayJob, crawDataJob: crawDataJob, morningJob: morningJob };
};