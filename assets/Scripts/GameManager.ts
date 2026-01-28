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
    @property
    public debugTimerLog: boolean = true;

    private chosenCard: CardController | null = null;
    private removedCardsOnTable: CardController[] = [];
    private summitPos: Vec3 = new Vec3();

    private waitTimer: number = 0;
    private resultTimer: number = 0;
    private waitDuration: number = 10;
    private resultDuration: number = 5;

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
        this.startWaitToSubmit();
    }

    private lastWaitLogSec: number = -1;
    private lastResultLogSec: number = -1;

    update(dt: number) {
        // Snap back if not WaitToSubmit and player is dragging
        if (this.gameState !== GameState.WaitToSubmit && this.playerDraggingCard) {
            this.playerDraggingCard.returnToHand();
            this.playerDraggingCard = null;
        }

        if (this.gameState === GameState.WaitToSubmit) {
            this.waitTimer += dt;
            const waitLeft = Math.max(0, this.waitDuration - this.waitTimer);
            const waitSec = Math.floor(waitLeft);
            if (waitSec !== this.lastWaitLogSec) {
                if (this.debugTimerLog) {
                    console.log(`[STATE: WaitToSubmit] Time left: ${waitSec}s`);
                }
                this.lastWaitLogSec = waitSec;
            }
            if (this.waitTimer >= this.waitDuration) {
                // Finalize card selection
                let card = this.chosenCard;
                if (!card) {
                    // If player is dragging a card, pick that
                    if (this.playerDraggingCard) {
                        card = this.playerDraggingCard;
                        card.forceStopDragging(); 
                        this.handCardsControllers[0].removeCard(card);
                        this.playerDraggingCard = null;
                    } else {
                        // Otherwise, pick a random card from hand
                        const playerHand = this.handCardsControllers[0];
                        const cards = playerHand.getCards();
                        if (cards.length > 0) {
                            const randomIdx = Math.floor(Math.random() * cards.length);
                            card = cards[randomIdx];
                            playerHand.removeCard(card);
                        }
                    }
                }
                if (card) {
                    this.handleResultPhase(card);
                }
            }
        } else if (this.gameState === GameState.Result) {
            this.resultTimer += dt;
            const resultLeft = Math.max(0, this.resultDuration - this.resultTimer);
            const resultSec = Math.floor(resultLeft);
            if (resultSec !== this.lastResultLogSec) {
                if (this.debugTimerLog) {
                    console.log(`[STATE: Result] Time left: ${resultSec}s`);
                }
                this.lastResultLogSec = resultSec;
            }
            if (this.resultTimer >= this.resultDuration) {
                // Destroy cards on table
                for (const card of this.removedCardsOnTable) {
                    card.node.destroy();
                }
                this.removedCardsOnTable = [];
                // Check if player has cards left
                const playerHand = this.handCardsControllers[0];
                if (playerHand.getCards().length === 0) {
                    this.gameState = GameState.Over;
                } else {
                    this.startWaitToSubmit();
                }
            }
        }
    }    private startWaitToSubmit() {
        this.gameState = GameState.WaitToSubmit;
        this.waitTimer = 0;
        this.chosenCard = null;
    }
    private playerDraggingCard: CardController | null = null;


    onCardDragged(card: CardController) {
        if (this.gameState !== GameState.WaitToSubmit) return;

        // If a card was already chosen, return it to hand
        if (this.chosenCard) {
            this.chosenCard.returnToHand();
            this.handCardsControllers[0].addCard(this.chosenCard);
        }

        // Remove new card from hand and set as chosen
        this.handCardsControllers[0].removeCard(card);
        this.chosenCard = card;
        card.node.setWorldPosition(350, 400, 0);
        (this.handCardsControllers[0] as HandCardsController).sortAndArrange();

        // Track the dragging card
        this.playerDraggingCard = card;
    }

    private handleResultPhase(playerCard: CardController) {
        // Bots give a card
        const removedCards: CardController[] = [playerCard];
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
            const c = removedCards[i];
            const pos = positions[i];
            c.node.setWorldPosition(pos.x, pos.y, pos.z);
            c.node.setSiblingIndex(999);
        }
        this.removedCardsOnTable = removedCards;
        this.chosenCard = null;
        this.waitTimer = 0;
        this.resultTimer = 0;
        this.gameState = GameState.Result;
    }

    refillHands() {
        // Remove all cards from each hand
        for (let i = 0; i < this.handCardsControllers.length; i++) {
            const hand = this.handCardsControllers[i];
            const cards = hand.getCards();
            for (const card of cards) {
                card.node.destroy();
            }
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
            // For debug: force submit chosen card
            this.handleResultPhase(this.chosenCard);
        }

        if (event.keyCode === KeyCode.KEY_D) {
            for (const card of this.removedCardsOnTable) {
                card.node.destroy();
            }
            this.removedCardsOnTable = [];
        }
    }
}