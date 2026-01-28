import { _decorator, Component } from 'cc';
import { CardDisplayController } from './CardDisplayController';
const { ccclass, property } = _decorator;

const SUIT_NAMES = ['spade', 'club', 'diamond', 'heart'];

@ccclass('CardController')
export class CardController extends Component {
    @property(CardDisplayController)
    displayController: CardDisplayController = null!;

    rank: number = 0;
    suit: number = 0; // 0-3

    setup(rank: number, suit: number, isFaceUp: boolean = true) {
        this.rank = rank;
        this.suit = suit;
        this.setupDisplay(isFaceUp);
    }

    setupDisplay(isFaceUp: boolean = true) {
        if (!this.displayController) {
            console.warn('displayController is not assigned');
            return;
        }
        const suitName = SUIT_NAMES[this.suit] ?? 'spade';
        this.displayController.setupCard(this.rank, suitName, isFaceUp);
    }

    start() {
        // const randomRank = Math.floor(Math.random() * 13) + 1; // 1-13
        // const randomSuit = Math.floor(Math.random() * 4); // 0-3
        // this.setup(randomRank, randomSuit, true);
    }
}