const Telegram = require("node-telegram-bot-api");
const appConfigs = require('./../../config/appConfigs');
const TelegramToken = '938534440:AAHgnnoYOLd8YGs_ILP4q8e0cnqxMvzojZM';
const InfoRoomId = appConfigs.telegramInfoGroup;
const ErrorRoomId = appConfigs.telegramErrorGroup;
const TelegramBot = new Telegram(TelegramToken, { polling: true });


const telegramLogger = {
    isEnabled: appConfigs.enabledLogs,
    start: () => {
        TelegramBot.sendMessage(InfoRoomId, `Logger started at ${new Date()}`);
    },
    log: (message) => {
        TelegramBot.sendMessage(InfoRoomId, message);
    },
    logError: (exception) => {
        TelegramBot.sendMessage(ErrorRoomId, exception);
    }
};

const Sentry = require("@sentry/node");
const sentryLogger = {
    isEnabled: appConfigs.enabledLogs,
    start: () => {
        Sentry.init({
            dsn: "https://04c69fcdb51e40cd8be587d247ea2cb9@sentry.io/5166815"
        });

        Sentry.captureMessage(`Logger started at ${new Date()}`);
    },
    log: (message) => {
        Sentry.captureMessage(message);
    },
    logError: (exception) => {
        Sentry.captureException(exception);
    }
};

const loggers = [
    telegramLogger,
    sentryLogger
]

const execute = function (cb, parameters) {
    for (let index = 0; index < loggers.length; index++) {
        const logger = loggers[index];
        if (logger.isEnabled) {
            cb(logger, parameters);
        }
    }
}

module.exports = {
    start: () => {
        execute((logger, parameters) => {
            logger.start();
        });
    },
    log: (message) => {
        execute((logger, parameters) => {
            logger.log(parameters);
        }, message);
    },
    logError: (exception) => {
        execute((logger, parameters) => {
            logger.logError(parameters);
        }, exception);
    }
}