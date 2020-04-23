
function convertBauCua(linhVat) {
    return linhVat + 1;
}

function convertTaiXiu(isTai) {
    return isTai ? 1 : 2;
}

function convertChanLe(isChan) {
    return isChan ? 1 : 2;
}

function convertXocXoc(choiceName) {
    if (choiceName == 'chan') {
        return 1;
    }

    if (choiceName == 'le') {
        return 2;
    }

    if (choiceName == 'red3') {
        return 3;
    }

    if (choiceName == 'red4') {
        return 4;
    }

    if (choiceName == 'white3') {
        return 5
    }

    if (choiceName == 'white4') {
        return 6;
    }

    return 0;
}



module.exports = {
    convertBauCua,
    convertTaiXiu,
    convertXocXoc,
    convertChanLe
}