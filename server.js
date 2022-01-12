const http = require("http");
const Koa = require("koa");
const Router = require("koa-router");
const cors = require("koa2-cors");
const { streamEvents } = require("http-event-stream");
const uuid = require("uuid");

const app = new Koa();
const router = new Router();

app.use(cors());

const randomInt = (min, max) =>
    Math.trunc(Math.random() * (max - min + 1)) + min;

const events = [{
        event: "action",
        text: "Игра началась",
    },
    {
        event: "action",
        text: "Арбитр кашляет, чихает... Какой дриблинг!",
    },
    {
        event: "action",
        text: "Удар! Мяч отбит, ну, у вратаря ж опыта больше",
    },
    {
        event: "action",
        text: "Нападающий Хировато обходит защитника... и наносит удар по воротам! Да, не очень хорошо сыграл японский футболист...",
    },
    {
        event: "action",
        text: "Все сделал, только ударить забыл... Ну и немудрено: столько бежать — имя своё забыть можно",
    },
    {
        event: "action",
        text: "И вот мяч попадает в оператора! Это очень понравилось взыскательным болельщикам",
    },
    {
        event: "goal",
        text: "Отличный удар! И Г-О-О-О-Л!",
    },
    {
        event: "freekick",
        text: "И снова Насри нарушает правила... Насри - это фамилия",
    },
    {
        event: "freekick",
        text: "Нарушение правил, будет штрафной удар",
    },
    {
        event: "freekick",
        text: "Одиннадцатиметровый!",
    },
    {
        event: "freekick",
        text: "Кажется, судья сейчас назначит штрафной... Ага, назначил",
    },
];

const eventsBuffer = [];
const maxCount = 50;

const generateEvents = () => {
    if (eventsBuffer.length >= maxCount) {
        return;
    }

    const event = {};
    const index = eventsBuffer.length ? randomInt(1, 10) : 0;
    event.event = events[index].event;
    event.data = JSON.stringify({
        text: events[index].text,
        time: Date.now(),
    });
    event.id = uuid.v4();

    eventsBuffer.push(event);
    setTimeout(generateEvents, randomInt(1, 20) * 1000);
};
generateEvents();

router.get("/sse", async(ctx) => {
    let index = 0;

    streamEvents(ctx.req, ctx.res, {
        async fetch(lastEventId) {
            const i = eventsBuffer.findIndex(({ id }) => id === lastEventId) + 1;
            index = eventsBuffer.length;
            return i < index ? eventsBuffer.slice(i) : [];
        },
        stream(sse) {
            const interval = setInterval(() => {
                if (index < eventsBuffer.length) {
                    sse.sendEvent(eventsBuffer[index]);
                    index++;
                }
            }, 500);
            return () => clearInterval(interval);
        },
    });
    ctx.respond = false;
});

app.use(router.routes());
app.use(router.allowedMethods());

const port = process.env.PORT || 7070;
const server = http.createServer(app.callback());
server.listen(port);