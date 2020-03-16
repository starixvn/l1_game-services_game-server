const Sentry = require("@sentry/node");

module.exports = () => {
    Sentry.init({
        dsn: "https://a1de1347c11841bebb9177b370d6da61@sentry.io/3533509"
    });
}