// File: `assets/Scripts/CardController.ts`
import { _decorator, Component, Node, EventTouch, Vec3, UITransform } from 'cc';
import { CardDisplayController } from './CardDisplayController';
const { ccclass, property } = _decorator;
import GameManager, { GameState } from './GameManager';

export function getCardRankValue(rank: number): number {
    return rank === 1 ? 14 : rank;
}

export function isCardAHigher(cardA: CardController, cardB: CardController): boolean {
    return getCardRankValue(cardA.rank) > getCardRankValue(cardB.rank);
}

@ccclass('CardController')
export class CardController extends Component {
    @property(Node)
    displayNode: Node = null!;

    public rank: number = 1;
    public suit: number = 0;
    public inHand: boolean = false;

    private dragCallback: ((card: CardController) => void) | null = null;
    private isDragging = false;

    setDragCallback(cb: (card: CardController) => void) {
        this.dragCallback = cb;
    }

    onLoad() {
        this.node.on(Node.EventType.TOUCH_START, this.onDragStart, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onDragMove, this);
        this.node.on(Node.EventType.TOUCH_END, this.onDragEnd, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onDragEnd, this);
    }

    setup(rank: number, suit: number, isFaceUp: boolean) {
        this.rank = rank;
        this.suit = suit;
        this.setupDisplay(isFaceUp);
    }

    setupDisplay(isFaceUp: boolean) {
        const suitNames = ['spade', 'club', 'heart', 'diamond'];
        const suitName = suitNames[this.suit] || 'spade';
        const display = this.getComponent(CardDisplayController) ||
            (this.displayNode && this.displayNode.getComponent(CardDisplayController));
        if (display) {
            display.setupCard(this.rank, suitName, isFaceUp);
        }
    }

    // Call this when bot plays the card to run flip animation
    revealWithFlip() {
        const suitNames = ['spade', 'club', 'heart', 'diamond'];
        const suitName = suitNames[this.suit] || 'spade';
        const display = this.getComponent(CardDisplayController) ||
            (this.displayNode && this.displayNode.getComponent(CardDisplayController));
        if (display) {
            display.setupCard(this.rank, suitName, true);
        }
    }

    onDragStart(event: EventTouch) {
        if (!this.inHand) return;
        if (!GameManager.instance || GameManager.instance.gameState !== GameState.WaitToSubmit) return;
        this.isDragging = true;
        this.node.setSiblingIndex(999);
        GameManager.instance.playerDraggingCard = this; // Track dragging
    }

    onDragMove(event: EventTouch) {
        if (!this.isDragging) return;
        if (!this.inHand || !GameManager.instance || GameManager.instance.gameState !== GameState.WaitToSubmit) {
            this.isDragging = false;
            this.returnToHand();
            GameManager.instance.playerDraggingCard = null;
            return;
        }
        const worldPos = event.getUILocation();
        const parent = this.node.parent!;
        const localPos = parent.getComponent(UITransform)!.convertToNodeSpaceAR(new Vec3(worldPos.x, worldPos.y, 0));
        this.node.setPosition(localPos);
    }

    onDragEnd(event: EventTouch) {
        if (!this.isDragging) return;
        this.isDragging = false;

        if (!this.inHand) return;

        const cardWorldPos = this.node.getWorldPosition();
        const submitArea = GameManager.instance.summitArea;
        const submitTransform = submitArea.getComponent(UITransform);
        const submitWorldPos = submitArea.getWorldPosition();
        const submitSize = submitTransform.contentSize;
        const submitAnchor = submitTransform.anchorPoint;

        const left = submitWorldPos.x - submitSize.width * submitAnchor.x;
        const right = left + submitSize.width;
        const bottom = submitWorldPos.y - submitSize.height * submitAnchor.y;
        const top = bottom + submitSize.height;

        if (
            cardWorldPos.x >= left &&
            cardWorldPos.x <= right &&
            cardWorldPos.y >= bottom &&
            cardWorldPos.y <= top
        ) {
            if (this.dragCallback) this.dragCallback(this);
        } else {
            if (this.returnToHand) this.returnToHand();
        }
        GameManager.instance.playerDraggingCard = null;
    }

    public forceStopDragging() {
        this.isDragging = false;
    }

    // This will be replaced by GameManager at runtime
    returnToHand() {
        this.inHand = true;
        this.node.setSiblingIndex(0);
    }
}