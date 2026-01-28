import { _decorator, Component, Node, EventTouch, Vec3, UITransform } from 'cc';
import { CardDisplayController } from './CardDisplayController';
const { ccclass, property } = _decorator;
import { GameManager, GameState } from './GameManager'; // Add this import


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

    onDragStart(event: EventTouch) {
        if (!this.inHand) return;
        if (!GameManager.instance || GameManager.instance.gameState !== GameState.WaitToSubmit) return;
        this.isDragging = true;
        this.node.setSiblingIndex(999);
        GameManager.instance.playerDraggingCard = this; // Track dragging
    }

    onDragMove(event: EventTouch) {
        if (!this.isDragging) return;
        // Stop dragging if card is no longer in hand (picked by timer)
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

    typescript
    onDragEnd(event: EventTouch) {
        if (!this.isDragging) return;
        this.isDragging = false;

        // Stop if card is no longer in hand (picked by timer)
        if (!this.inHand) return;

        // Get card world position
        const cardWorldPos = this.node.getWorldPosition();

        // Get submit area and its world rect
        const submitArea = GameManager.instance.summitArea;
        const submitTransform = submitArea.getComponent(UITransform);
        const submitWorldPos = submitArea.getWorldPosition();
        const submitSize = submitTransform.contentSize;
        const submitAnchor = submitTransform.anchorPoint;

        // Calculate submit area rect in world space
        const left = submitWorldPos.x - submitSize.width * submitAnchor.x;
        const right = left + submitSize.width;
        const bottom = submitWorldPos.y - submitSize.height * submitAnchor.y;
        const top = bottom + submitSize.height;

        // Check if card is inside submit area
        if (
            cardWorldPos.x >= left &&
            cardWorldPos.x <= right &&
            cardWorldPos.y >= bottom &&
            cardWorldPos.y <= top
        ) {
            if (this.dragCallback) this.dragCallback(this);
        } else {
            // Return to hand if not in submit area
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
        // Reset sibling index so hand controller can arrange it
        this.node.setSiblingIndex(0);
    }
}