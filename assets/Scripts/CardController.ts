import { _decorator, Component, Node, EventTouch } from 'cc';
import { CardDisplayController } from './CardDisplayController';
const { ccclass, property } = _decorator;

const SUIT_NAMES = ['spade', 'club', 'diamond', 'heart'];

@ccclass('CardController')
export class CardController extends Component {
    @property(CardDisplayController)
    displayController: CardDisplayController = null!;

    rank: number = 0;
    suit: number = 0; // 0-3

    // Only clickable if in hand
    inHand: boolean = false;

    // Callback to notify GameManager
    onCardSelected: ((card: CardController) => void) | null = null;

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

    onLoad() {
        this.node.on(Node.EventType.TOUCH_END, this.onCardClicked, this);
    }

    onCardClicked(event: EventTouch) {
        if (this.inHand && this.onCardSelected) {
            this.onCardSelected(this);
        }
    }
}