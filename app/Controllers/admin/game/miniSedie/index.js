module.exports = (client, data) => {
    if (data.view != null) {
        client.gameEvent.viewMiniSedie = data.view;
    }

    if (data.sync != null) {
        const miniSedie = client.redT.miniSedie;
        const { remainingTime, roundId } = miniSedie;

        client.red({ miniSedie: { remainingTime, roundId } });
    }
};