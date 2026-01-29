// File: assets/Scripts/BotStrategy.ts
import { CardController, isCardAHigher } from './CardController';
import { HandCardsController } from './HandCardsController';

export class BotStrategy {
    static pickCard(
        botIndex: number,
        botHand: HandCardsController,
        allHands: HandCardsController[]
    ): CardController | null {
        if (botHand.getHp() <= 0) return null;
        const cards = botHand.getCards();
        if (cards.length === 0) return null;

        // Gather all cards left in all hands (excluding this bot)
        const allOtherCards: number[] = [];
        for (let j = 0; j < allHands.length; j++) {
            if (j !== botIndex && allHands[j].getHp() > 0) {
                allOtherCards.push(...allHands[j].getCards().map(c => c.rank));
            }
        }
        // Find cards in bot's hand whose rank is unique among all hands
        const safeCards = cards.filter(c => !allOtherCards.includes(c.rank));
        let cardToRemove: CardController;
        if (botHand.getHp() === 1) {
            // If low HP, always play the lowest card (Ace is highest)
            cardToRemove = cards.reduce((min, c) => isCardAHigher(min, c) ? c : min, cards[0]);
        } else if (safeCards.length > 0 && Math.random() < 0.5) {
            // 50% chance to care about duplicates
            cardToRemove = safeCards[Math.floor(Math.random() * safeCards.length)];
        } else {
            // Fallback: each bot behaves differently
            if (botIndex === 1) {
                // Bot 1: play lowest
                cardToRemove = cards.reduce((min, c) => isCardAHigher(min, c) ? c : min, cards[0]);
            } else if (botIndex === 2) {
                // Bot 2: play highest
                cardToRemove = cards.reduce((max, c) => isCardAHigher(c, max) ? c : max, cards[0]);
            } else {
                // Bot 3: play random
                const randomIdx = Math.floor(Math.random() * cards.length);
                cardToRemove = cards[randomIdx];
            }
        }
        return cardToRemove;
    }
}