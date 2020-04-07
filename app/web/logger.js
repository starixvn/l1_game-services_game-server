const Telegram = require("node-telegram-bot-api");
const appConfigs = require('./../../config/appConfigs');
const InfoRoomId = appConfigs.telegramInfoGroup;
const ErrorRoomId = appConfigs.telegramErrorGroup;

const telegramLogger = {
    isEnabled: appConfigs.enabledLogs && appConfigs.enabledTelegramLogger,
    start: () => {
        if (telegramLogger.isEnabled) {
            telegramLogger.TelegramBot = new Telegram(appConfigs.telegramToken, { polling: appConfigs.enabledLogs });
            telegramLogger.TelegramBot.sendMessage(InfoRoomId, `Logger started at ${new Date()}`);
        }
    },
    log: (message) => {
        if (telegramLogger.isEnabled && message && message != '') {
            telegramLogger.TelegramBot && telegramLogger.TelegramBot.sendMessage(InfoRoomId, message);
        }
    },
    logWarning: (message) => {
        if (telegramLogger.isEnabled) {
            telegramLogger.log(message, 'warning');
        }
    },
    logError: (exception) => {
        if (telegramLogger.isEnabled && exception) {
            let messageLog = (typeof exception === 'string' || exception instanceof String) ? exception : '';

            if (exception.message) {
                messageLog += exception.message;
            }

            if (exception.stack) {
                messageLog += '\nstack: ' + exception.stack;
            }

            telegramLogger.TelegramBot && telegramLogger.TelegramBot.sendMessage(ErrorRoomId, messageLog);
        }
    }
};

const Sentry = require("@sentry/node");
const sentryLogger = {
    isEnabled: appConfigs.enabledLogs,
    start: () => {
        Sentry.init({
            dsn: appConfigs.sentryUrl,
            maxValueLength: 5000,
            environment: appConfigs.env
        });

        Sentry.captureMessage(`Logger started at ${new Date()}`);
    },

    log: (message, level = 'info') => {
        const messageLog = (typeof message === 'string' || message instanceof String) ? message : JSON.stringify(message);
        Sentry.captureMessage(messageLog, level);
    },

    logWarning: (message) => {
        sentryLogger.log(message, 'warning');
    },

    logCritical: (message) => {
        let messageLog = (typeof message === 'string' || message instanceof String) ? message : '';

        if (message.message) {
            messageLog += message.message;
        }

        if (message.stack) {
            messageLog += '\nstack: ' + message.stack;
        }

        sentryLogger.log(messageLog, 'critical');
    },

    logError: (exception) => {
        if ((typeof exception === 'string' || exception instanceof String)) {
            sentryLogger.log(exception, 'error');
        }
        else {
            Sentry.captureException(exception);
        }
    },

    composeBeforeCallMessage: (session, params) => {
        if (appConfigs.enabledApiLog) {
            return `Before Action at ${new Date()}: \n\tSession: ${JSON.stringify(session)} \n\tParams:${JSON.stringify(params)}`;
        }

        return '';
    },
    logAfterSendToApi: (action, params, result, beforeMessage, isError) => {
        if (appConfigs.enabledApiLog) {

            const messages = [
                `Account ${params.SiteId}_${params.ObCustId} performs ${action} at ${new Date()}`,
                '',
                beforeMessage,
                `\nAction Result: ${JSON.stringify(result)}`,
                '----------------------------------------------------------'
            ];

            const joinedMessages = messages.join('\n');
            Sentry.captureMessage(joinedMessages, isError ? 'error' : 'info');
            if (isError) {
                telegramLogger.logError(joinedMessages);
            }
            else {
                telegramLogger.log(joinedMessages);
            }
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
    log: (message, severity = 'info') => {
        execute((logger, parameters) => {
            logger.log(parameters, severity);
        }, message);
    },
    logCritical: (exception) => {
        execute((logger, parameters) => {
            logger.logCritical && logger.logCritical(parameters);
        }, exception);
    },
    logWarning: (exception) => {
        execute((logger, parameters) => {
            logger.logWarning && logger.logWarning(parameters);
        }, exception);
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