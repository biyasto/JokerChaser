// File: assets/Scripts/HandCardsController.ts
import { _decorator, Component, Node, Vec3 } from 'cc';
import { CardController } from './CardController';
const { ccclass, property } = _decorator;

const CARD_SPACING = 50;

@ccclass('HandCardsController')
export class HandCardsController extends Component {
    private cards: CardController[] = [];

    addCard(card: CardController) {
        if (this.cards.indexOf(card) === -1) {
            card.inHand = true; // Mark as in hand
            this.cards.push(card);
            this.sortAndArrange();
        }
    }

    removeCard(card: CardController) {
        const idx = this.cards.indexOf(card);
        if (idx !== -1) {
            card.inHand = false; // Mark as not in hand
            this.cards.splice(idx, 1);
            this.sortAndArrange();
        }
    }

    private sortAndArrange() {
        // Sort by rank, then by suit
        this.cards.sort((a, b) => {
            if (a.rank !== b.rank) {
                return a.rank - b.rank;
            }
            return a.suit - b.suit;
        });

        // Center the hand
        const n = this.cards.length;
        const totalWidth = (n - 1) * CARD_SPACING;
        const startX = -totalWidth / 2;

        for (let i = 0; i < n; i++) {
            const cardNode = this.cards[i].node;
            cardNode.setPosition(new Vec3(startX + i * CARD_SPACING, 0, 0));
            cardNode.setSiblingIndex(i); // Ensure stacking order matches hand order
        }
    }

    getCards(): CardController[] {
        return this.cards.slice();
    }
}