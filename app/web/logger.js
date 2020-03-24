const Telegram = require("node-telegram-bot-api");
const appConfigs = require('./../../config/appConfigs');
const TelegramToken = '938534440:AAHgnnoYOLd8YGs_ILP4q8e0cnqxMvzojZM';
const InfoRoomId = appConfigs.telegramInfoGroup;
const ErrorRoomId = appConfigs.telegramErrorGroup;

const telegramLogger = {
    isEnabled: appConfigs.enabledLogs && appConfigs.enabledTelegramLogger,
    start: () => {
        //TelegramBot.sendMessage(InfoRoomId, `Logger started at ${new Date()}`);
        telegramLogger.TelegramBot = new Telegram(TelegramToken, { polling: appConfigs.enabledLogs });
    },
    log: (message) => {
        telegramLogger.TelegramBot && telegramLogger.TelegramBot.sendMessage(InfoRoomId, message);
    },
    logError: (exception) => {
        telegramLogger.TelegramBot && telegramLogger.TelegramBot.sendMessage(ErrorRoomId, exception);
    }
};

const Sentry = require("@sentry/node");
const sentryLogger = {
    isEnabled: appConfigs.enabledLogs,
    start: () => {
        Sentry.init({
            dsn: appConfigs.sentryUrl,
            maxValueLength: 5000
        });

        Sentry.captureMessage(`Logger started at ${new Date()}`);
    },

    log: (message) => {
        Sentry.captureMessage(message);
    },

    logError: (exception) => {
        Sentry.captureException(exception);
    },

    composeBeforeCallMessage: (session, params) => {
        if (appConfigs.enabledApiLog) {
            return `Before Action: \n\tSession: ${JSON.stringify(session)} \n\tParams:${JSON.stringify(params)}`;
        }

        return '';
    },
    logAfterSendToApi: (action, params, result, beforeMessage) => {
        if (appConfigs.enabledApiLog) {

            const messages = [
                `${params.SiteId}_${params.ObCustId} ${action} ${new Date()}`,
                beforeMessage,
                `\nResult: ${JSON.stringify(result)}`
            ];

            Sentry.captureMessage(messages.join('\n'));
        }
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
    },
    getLogger: (id) => {
        if (id == 'telegram') {
            return telegramLogger;
        }

        return sentryLogger;
    }
}