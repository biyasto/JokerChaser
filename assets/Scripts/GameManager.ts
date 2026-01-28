// File: assets/Scripts/GameManager.ts
import { _decorator, Component, Node, Prefab, instantiate, input, Input, KeyCode, EventKeyboard, Vec3, UITransform } from 'cc';
import { CardController } from './CardController';
import { HandCardsController } from './HandCardsController';
const { ccclass, property } = _decorator;

export enum GameState {
    SetUp,
    WaitToSubmit,
    Result,
    Pause,
    Over
}

@ccclass('GameManager')
export class GameManager extends Component {
    public static instance: GameManager;

    @property({ type: Prefab })
    cardPrefab: Prefab = null!;

    @property([Node])
    cardParents: Node[] = [];

    @property([HandCardsController])
    handCardsControllers: HandCardsController[] = [];

    @property(Node)
    summitArea: Node = null!; // Assign in editor

    private chosenCard: CardController | null = null;
    private removedCardsOnTable: CardController[] = [];
    private summitPos: Vec3 = new Vec3();

    public gameState: GameState = GameState.SetUp;

    onLoad() {
        GameManager.instance = this;
    }

    start() {
        this.summitPos = this.summitArea.getWorldPosition();

        for (let handIdx = 0; handIdx < 4; handIdx++) {
            const suit = handIdx;
            for (let rank = 1; rank <= 13; rank++) {
                const cardNode = instantiate(this.cardPrefab);
                cardNode.parent = this.cardParents[handIdx];
                const cardController = cardNode.getComponent(CardController);
                if (cardController) {
                    const isFaceUp = handIdx === 0;
                    cardController.setup(rank, suit, isFaceUp);
                    if (handIdx === 0) {
                        cardController.inHand = true;
                        cardController.setDragCallback((card) => this.onCardDragged(card));
                        cardController.returnToHand = () => {
                            cardNode.parent = this.cardParents[0];
                            cardController.inHand = true;
                            cardNode.setPosition(0, 0, 0);
                            // Add back to hand and sort
                            this.handCardsControllers[0].addCard(cardController);
                            (this.handCardsControllers[0] as HandCardsController).sortAndArrange();
                        };
                    } else {
                        cardController.inHand = false;
                        cardController.node.active = false;
                    }
                    this.handCardsControllers[handIdx].addCard(cardController);
                }
            }
        }
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        this.gameState= GameState.WaitToSubmit;
    }

    onCardDragged(card: CardController) {
        // Check overlap with summit area
        const cardBox = card.node.getComponent(UITransform)!.getBoundingBoxToWorld();
        const summitBox = this.summitArea.getComponent(UITransform)!.getBoundingBoxToWorld();
        if (!cardBox.intersects(summitBox)) {
            card.returnToHand();
            return;
        }
        if (this.chosenCard && this.chosenCard !== card) {
            this.handCardsControllers[0].addCard(this.chosenCard);
            (this.handCardsControllers[0] as HandCardsController).sortAndArrange();
            this.chosenCard.returnToHand();
        }
        // Remove from hand, move and set as chosen
        this.handCardsControllers[0].removeCard(card);
        this.chosenCard = card;
        card.node.setWorldPosition(350, 400, 0);

        // Sort and arrange the player's hand after moving the card
        (this.handCardsControllers[0] as HandCardsController).sortAndArrange();
    }

    refillHands() {
        // Remove all cards from each hand
        for (let i = 0; i < this.handCardsControllers.length; i++) {
            const hand = this.handCardsControllers[i];
            const cards = hand.getCards();
            for (const card of cards) {
                card.node.destroy();
            }
            // Clear the internal array
            (hand as any).cards = [];
        }

        // Refill each hand with 13 cards
        for (let handIdx = 0; handIdx < 4; handIdx++) {
            const suit = handIdx;
            for (let rank = 1; rank <= 13; rank++) {
                const cardNode = instantiate(this.cardPrefab);
                cardNode.parent = this.cardParents[handIdx];
                const cardController = cardNode.getComponent(CardController);
                if (cardController) {
                    const isFaceUp = handIdx === 0;
                    cardController.setup(rank, suit, isFaceUp);
                    if (handIdx === 0) {
                        cardController.inHand = true;
                        cardController.setDragCallback((card) => this.onCardDragged(card));
                        cardController.returnToHand = () => {
                            cardNode.parent = this.cardParents[0];
                            cardController.inHand = true;
                            cardNode.setPosition(0, 0, 0);
                            this.handCardsControllers[0].addCard(cardController);
                            (this.handCardsControllers[0] as HandCardsController).sortAndArrange();
                        };
                    } else {
                        cardController.inHand = false;
                        cardController.node.active = false;
                    }
                    this.handCardsControllers[handIdx].addCard(cardController);
                }
            }
        }
    }

    onKeyDown(event: EventKeyboard) {
        if (event.keyCode === KeyCode.KEY_A && this.chosenCard) {
            const removedCards: CardController[] = [];
            this.chosenCard.setupDisplay(true);
            removedCards.push(this.chosenCard);

            for (let i = 1; i < 4; i++) {
                const botHand = this.handCardsControllers[i];
                const cards = botHand.getCards();
                if (cards.length > 0) {
                    const randomIdx = Math.floor(Math.random() * cards.length);
                    const cardToRemove = cards[randomIdx];
                    botHand.removeCard(cardToRemove);
                    cardToRemove.node.active = true;
                    cardToRemove.setupDisplay(true);
                    removedCards.push(cardToRemove);
                }
            }

            removedCards.sort((a, b) => a.rank - b.rank);

            const positions = [
                { x: 350, y: 400, z: 0 },
                { x: 550, y: 400, z: 0 },
                { x: 750, y: 400, z: 0 },
                { x: 950, y: 400, z: 0 }
            ];
            for (let i = 0; i < removedCards.length; i++) {
                const card = removedCards[i];
                const pos = positions[i];
                card.node.setWorldPosition(pos.x, pos.y, pos.z);
                card.node.setSiblingIndex(999);
            }

            this.removedCardsOnTable = removedCards;
            this.chosenCard = null;
        }

        if (event.keyCode === KeyCode.KEY_D) {
            for (const card of this.removedCardsOnTable) {
                card.node.destroy();
            }
            this.removedCardsOnTable = [];
        }
    }
}