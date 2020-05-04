const Actions = {
  receiveTwoCards: "receiveTwoCards",
  playerReceiveThirdCard: "playerReceiveThirdCard",
  bankerReceiveThirdCard: "bankerReceiveThirdCard",
  finalComparison: "finalComparison"
};

class BaccaratPlayer {
  constructor() {
    this.card1 = null;
    this.card2 = null;
    this.card3 = null;
  }

  getCardValue(card) {
    let cardValue = (card.number || -1) + 1;

    if (cardValue >= 10) {
      // Card 10, J, Q, K
      cardValue = 0;
    }

    return cardValue;
  }

  getTotalScore() {
    return [this.card1, this.card2, this.card3].reduce((result, card) => {
      const cardValue = this.getCardValue(card);

      return (result + cardValue) % 10;
    }, 0);
  }

  getThirdCardValue() {
    return this.getCardValue(this.card3);
  }

  numberOfCards() {
    return [this.card1, this.card2, this.card3].filter(card => !!card).length;
  }
}

class BaccaratGame {
  constructor(cards) {
    this.player = new BaccaratPlayer();
    this.banker = new BaccaratPlayer();
    this.cards = cards;
  }

  receiveTwoCards() {
    const fourCards = this.cards.splice(4);

    this.player.card1 = fourCards[0];
    this.banker.card1 = fourCards[1];
    this.player.card2 = fourCards[2];
    this.banker.card2 = fourCards[3];
  }

  playerReceiveThirdCard() {
    const card = this.cards.splice(1);

    this.player.card3 = card;
  }

  bankerReceiveThirdCard() {
    const card = this.cards.splice(1);

    this.banker.card3 = card;
  }

  finalComparison() {
    const score = this.getTotalScore();
    const numberOfCards =
      this.player.numberOfCards() + this.banker.numberOfCards();

    return {
      player: score.player > score.banker,
      banker: score.player < score.banker,
      tie: score.player === score.banker,
      big: numberOfCards === 5 || numberOfCards === 6,
      small: numberOfCards === 4
    };
  }

  getTotalScore() {
    return {
      player: this.player.getTotalScore(),
      banker: this.banker.getTotalScore()
    };
  }

  getNumberOfCards() {
    return {
      player: this.player.getNumberOfCards(),
      banker: this.banker.getNumberOfCards()
    };
  }

  getAction() {
    const numberOfCards = this.getNumberOfCards();
    const score = this.getTotalScore();

    if (numberOfCards.player < 2 || numberOfCards.banker < 2) {
      return Actions.receiveTwoCards;
    } else if (numberOfCards.player === 2 && numberOfCards.banker === 2) {
      if (score.player >= 8 || score.banker >= 8) {
        return Actions.finalComparison;
      }

      if (score.player <= 5) {
        return Actions.playerReceiveThirdCard;
      }

      // Player score: 6 or 7
      if (score.banker <= 5) {
        return Actions.bankerReceiveThirdCard;
      }

      return Actions.finalComparison;
    } else if (numberOfCards.player === 3 && numberOfCards.banker === 2) {
      const thirdCardOfPlayer = this.player.getThirdCardValue();
      const hasBankerReveiceThirdCard =
        score.banker <= 2 ||
        (score.banker === 3 && thirdCardOfPlayer !== 8) ||
        (score.banker === 4 &&
          thirdCardOfPlayer >= 2 &&
          thirdCardOfPlayer <= 7) ||
        (score.banker === 5 &&
          thirdCardOfPlayer >= 4 &&
          thirdCardOfPlayer <= 7) ||
        (score.banker === 6 &&
          thirdCardOfPlayer >= 6 &&
          thirdCardOfPlayer <= 7);

      if (hasBankerReveiceThirdCard) {
        return Actions.bankerReceiveThirdCard;
      } else {
        return Actions.finalComparison;
      }
    } else {
      return Actions.finalComparison;
    }
  }
}

BaccaratGame.Actions = Actions;

module.exports = BaccaratGame;
