// File: assets/Scripts/GameManager.ts
import { _decorator, RichText, Component, Node, Prefab, instantiate, input, Input, KeyCode, EventKeyboard, Vec3, UITransform, tween } from 'cc';
import { CardController, getCardRankValue } from './CardController';
import { HandCardsController } from './HandCardsController';
const { ccclass, property } = _decorator;
import { BotStrategy } from './BotStrategy';
import { SceneManager } from './SceneManager';
import { SettingUIController } from './SettingUIController';
import { RuleUIController } from './RuleUIController';
import {SoundManager} from "./SoundManager";
import { ChaserUIController } from './ChaserUIController';

export enum GameState {
    SetUp,
    WaitToSubmit,
    Result,
    Pause,
    Resume,
    Over
}
export enum GameMode {
    Normal,
    SuddenDeath
}

@ccclass('GameManager')
export class GameManager extends Component {
    public static instance: GameManager;

    @property(SettingUIController)
    settingUI: SettingUIController = null!;

    @property(RuleUIController)
    ruleUI: RuleUIController = null!;

    @property({ type: Prefab })
    cardPrefab: Prefab = null!;

    @property([Node])
    cardParents: Node[] = [];

    @property([HandCardsController])
    handCardsControllers: HandCardsController[] = [];

    @property(Node)
    summitArea: Node = null!; // Assign in editor

    // Node used as deck position for deal animation
    @property(Node)
    dealStartNode: Node = null!; // Assign a node in scene (e.g. deck)

    @property(ChaserUIController)
    chaserUI: ChaserUIController = null!;
    @property
    public debugTimerLog: boolean = true;

    private chosenCard: CardController | null = null;
    private removedCardsOnTable: CardController[] = [];
    private summitPos: Vec3 = new Vec3();

    private waitTimer: number = 0;
    private resultTimer: number = 0;
    private waitDuration: number = 20;
    private waitDurationSD: number = 10;
    private resultDuration: number = 5;

    public gameMode: GameMode = GameMode.Normal;
    private turnCount: number = 1;
    public gameState: GameState = GameState.SetUp;
    private prevState: GameState = GameState.SetUp;

    @property(RichText)
    turnText: RichText = null!;

    @property(RichText)
    timerText: RichText = null!;

    @property(Node)
    OverUI: RichText = null!;
    @property(RichText)
    OverText: RichText = null!;

    private lastWaitLogSec: number = -1;
    private lastResultLogSec: number = -1;

    private playerDraggingCard: CardController | null = null;

    onLoad() {
        GameManager.instance = this;
    }

    start() {
        this.summitPos = this.summitArea.getWorldPosition();
        this.updateTurnText();

        // Use animated dealing instead of instant placement
        this.dealInitialHands();

        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        this.startWaitToSubmit();
    }

    // \- \- \- Deal animation for initial hands \- \- \-
    private dealInitialHands() {
        // First, create all cards but keep behavior for bots
        for (let handIdx = 0; handIdx < 4; handIdx++) {
            const suit = handIdx;
            for (let rank = 1; rank <= 13; rank++) {
                const cardNode = instantiate(this.cardPrefab);
                const cardController = cardNode.getComponent(CardController);
                if (!cardController) {
                    continue;
                }

                const isPlayer = handIdx === 0;
                const isFaceUp = isPlayer;

                cardNode.setScale(0.7, 0.7, 0.7);
                cardController.setup(rank, suit, isFaceUp);

                if (isPlayer) {
                    // Player cards: animate from deck to hand
                    cardController.inHand = true;
                    cardController.setDragCallback((card) => this.onCardDragged(card));

                    // Define returnToHand behavior (used after dealing finishes)
                    cardController.returnToHand = () => {
                        cardNode.parent = this.cardParents[0];
                        cardController.inHand = true;
                        cardNode.setPosition(0, 0, 0);
                        this.handCardsControllers[0].addCard(cardController);
                        (this.handCardsControllers[0] as HandCardsController).sortAndArrange();
                    };

                    // Start under GameManager root so we can move in world space
                    this.node.addChild(cardNode);

                    // Start position: deck node world position (or origin)
                    const startPos = this.dealStartNode
                        ? this.dealStartNode.getWorldPosition()
                        : new Vec3(0, 0, 0);
                    cardNode.setWorldPosition(startPos);

                    const targetParent = this.cardParents[0];
                    const targetHand = this.handCardsControllers[0];

                    // Target world position: center of player hand parent
                    const handWorld = targetParent.getWorldPosition();
                    const targetWorld = new Vec3(handWorld.x, handWorld.y, handWorld.z);

                    const delay = 0.1 * rank; // adjust if you add more cards

                    tween(cardNode)
                        .delay(delay)
                        .to(0.3, { worldPosition: targetWorld }, { easing: 'quadOut' })
                        .call(() => {
                            // Reparent to hand and sort
                            cardNode.parent = targetParent;
                            cardNode.setPosition(0, 0, 0);
                            targetHand.addCard(cardController);
                            (targetHand as HandCardsController).sortAndArrange();
                            SoundManager.instance?.playSFX('Audio/Card-Shuffle');

                        })
                        .start();
                } else {
                    // Bots: no animation, keep face down and hidden for now
                    cardController.inHand = false;
                    cardController.node.active = false;
                    cardNode.parent = this.cardParents[handIdx];
                    cardNode.setPosition(0, 0, 0);
                    this.handCardsControllers[handIdx].addCard(cardController);
                }
            }
        }
    }

    getTurnCount(): number {
        return this.turnCount;
    }

    setTurnCount(value: number) {
        this.turnCount = value;
        this.updateTurnText();
        console.log('turn:' + this.turnCount);
    }

    private updateTurnText() {
        if (this.turnText) {
            this.turnText.string = `Turn: ${this.turnCount}`;
        }
    }

    update(dt: number) {
        // Snap back if not WaitToSubmit and player is dragging
        if (this.gameState !== GameState.WaitToSubmit && this.playerDraggingCard) {
            this.playerDraggingCard.returnToHand();
            this.playerDraggingCard = null;
        }

        if (this.gameState === GameState.WaitToSubmit) {
            this.waitTimer += dt;
            let dur = this.gameMode == GameMode.Normal ? this.waitDuration : this.waitDurationSD;
            const waitLeft = Math.max(0, dur - this.waitTimer);
            const waitSec = Math.floor(waitLeft);
            if (waitSec !== this.lastWaitLogSec) {
                if (this.debugTimerLog) {
                    console.log(`[STATE: WaitToSubmit] Time left: ${waitSec}s`);
                }
                this.timerText.string = `Time Left: ${waitSec}s`;
                this.lastWaitLogSec = waitSec;
            }
            dur = this.gameMode == GameMode.Normal ? this.waitDuration : this.waitDurationSD;
            if (this.waitTimer >= dur) {
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

                const aliveHands = this.handCardsControllers.filter(h => h.getHp() > 0);
                if (this.handCardsControllers[0].getHp() === 0) {
                    this.gameState = GameState.Over;
                    if (aliveHands.length >= 1) {
                        console.log('You Lose!');
                        this.OverUI.active = true;
                        this.OverText.string = '<b><color=#FFFFFF>You Lose!</color></b>'
                        return;
                    } else {
                        console.log('You Draw!');
                        this.OverUI.active = true;
                        this.OverText.string = '<b><color=#FFFFFF>You Draw!</color></b>'
                        return;
                    }
                } else if (aliveHands.length == 1) {
                    this.gameState = GameState.Over;
                    console.log('You Win!');
                    this.OverUI.active = true;
                    this.OverText.string = '<b><color=#FFFFFF>You Win!</color></b>'
                    return;
                }

                this.setTurnCount(this.turnCount + 1);
                if (this.turnCount > 19 && this.gameMode === GameMode.Normal) {
                    this.gameMode = GameMode.SuddenDeath;
                    console.log('Game mode changed to Sudden Death!');
                }

                this.removedCardsOnTable = [];
                // Check if player has cards left
                const playerHand = this.handCardsControllers[0];
                if (playerHand.getCards().length === 0) {
                    if (this.gameMode === GameMode.SuddenDeath) {
                        this.gameState = GameState.Over;
                        console.log('You Draw!');
                        this.OverUI.active = true;
                        this.OverText.string = '<b><color=#FFFFFF>You Draw!</color></b>'
                    } else {
                        this.refillHands();
                    }
                } else {
                    this.startWaitToSubmit();
                    this.chaserUI.reset();
                }
            }
        }
    }

    private startWaitToSubmit() {
        this.gameState = GameState.WaitToSubmit;
        this.waitTimer = 0;
        this.chosenCard = null;
    }

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

        // Get the number of alive players
        const aliveCount = this.handCardsControllers.filter(h => h.getHp() > 0).length;
        // Get centered positions
        const positions = this.getCenteredPositions(aliveCount);
        SoundManager.instance?.playSFX('Audio/Hit');        // Set the card to the first spot
        card.node.setWorldPosition(positions[0].x, positions[0].y, positions[0].z);
        (this.handCardsControllers[0] as HandCardsController).sortAndArrange();
        (this.handCardsControllers[0] as HandCardsController).sortAndArrange();

        // Track the dragging card
        this.playerDraggingCard = card;
    }

    private handleResultPhase(playerCard: CardController) {
        // Track removed cards and their hand indices
        const removedCards: CardController[] = [playerCard];
        const handIndices: number[] = [0]; // 0 = player, 1\-3 = bots

        for (let i = 1; i < 4; i++) {
            const botHand = this.handCardsControllers[i];
            const cardToRemove = BotStrategy.pickCard(i, botHand, this.handCardsControllers);
            if (cardToRemove) {
                botHand.removeCard(cardToRemove);
                cardToRemove.node.active = true;
                cardToRemove.revealWithFlip(); // run flip animation when bot gives card
                removedCards.push(cardToRemove);
                handIndices.push(i);
            }
        }
        SoundManager.instance?.playSFX('Audio/Card-Shuffle');

        // Pair cards with their hand index
        const combined = removedCards.map((card, idx) => ({ card, handIdx: handIndices[idx] }));
        // Sort using getCardRankValue so Ace is highest
        combined.sort((a, b) => getCardRankValue(a.card.rank) - getCardRankValue(b.card.rank));

        // Count ranks
        const rankCount: Record<number, number> = {};
        for (const entry of combined) {
            const rankValue = getCardRankValue(entry.card.rank);
            rankCount[rankValue] = (rankCount[rankValue] || 0) + 1;
        }
        const duplicatedRanks = Object.keys(rankCount)
            .filter(rank => rankCount[Number(rank)] > 1)
            .map(Number);

        if (duplicatedRanks.length > 0) {
            // Find which hands should lose HP
            const aliveHands = this.handCardsControllers
                .map((h, idx) => ({ h, idx }))
                .filter(x => x.h.getHp() > 0);

            const handsToLoseHp = combined
                .filter(entry => duplicatedRanks.includes(getCardRankValue(entry.card.rank)))
                .map(entry => entry.handIdx);

            // If all alive hands would lose HP, skip reduction (except SuddenDeath)
            const allWouldDie = aliveHands.every(x => handsToLoseHp.includes(x.idx));
            if (!allWouldDie || this.gameMode === GameMode.SuddenDeath) {
                for (const idx of handsToLoseHp) {
                    if (this.gameMode == GameMode.Normal) {
                        this.handCardsControllers[idx].reduceHp(1);
                    } else {
                        this.handCardsControllers[idx].reduceHp(this.handCardsControllers[idx].getHp());
                    }
                }
            }
        } else {
            // No duplicates: lowest card(s) lose HP (using getCardRankValue)
            const minRank = Math.min(...combined.map(entry => getCardRankValue(entry.card.rank)));
            const losers = combined.filter(entry => getCardRankValue(entry.card.rank) === minRank);
            const uniqueHandIdx = Array.from(new Set(losers.map(entry => entry.handIdx)));
            for (const idx of uniqueHandIdx) {
                if (this.gameMode == GameMode.Normal) {
                    this.handCardsControllers[idx].reduceHp(1);
                } else {
                    this.handCardsControllers[idx].reduceHp(this.handCardsControllers[idx].getHp());
                }
            }
        }

        // Arrange cards visually
        const positions = this.getCenteredPositions(combined.length);
        for (let i = 0; i < combined.length; i++) {
            const c = combined[i].card;
            const pos = positions[i];
            c.node.setWorldPosition(pos.x, pos.y, pos.z);
            c.node.setSiblingIndex(999);
        }
        this.chaserUI.reset();
        this.chaserUI.checkValue(handIndices);
        this.removedCardsOnTable = combined.map(x => x.card);
        this.chosenCard = null;
        this.waitTimer = 0;
        this.resultTimer = 0;

        for (let i = 0; i < this.handCardsControllers.length; i++) {
            console.log(`[DEBUG] Hand ${i} HP left: ${this.handCardsControllers[i].getHp()}`);
        }

        this.gameState = GameState.Result;
        this.timerText.string = ``;
    }

    getCenteredPositions(
        count: number,
        centerX: number = 650,
        y: number = 400,
        z: number = 0,
        spacing: number = 100
    ): { x: number; y: number; z: number }[] {
        const positions: { x: number; y: number; z: number }[] = [];
        const totalWidth = (count - 1) * spacing;
        const startX = centerX - totalWidth / 2;
        for (let i = 0; i < count; i++) {
            positions.push({ x: startX + i * spacing, y, z });
        }
        return positions;
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

        // Refill each hand with 13 cards (no animation here)
        for (let handIdx = 0; handIdx < 4; handIdx++) {
            const suit = handIdx;
            for (let rank = 1; rank <= 13; rank++) {
                const cardNode = instantiate(this.cardPrefab);
                cardNode.parent = this.cardParents[handIdx];
                cardNode.setScale(0.7, 0.7, 0.7);
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
                            // play SFX when refilling a card to player
                            if (handIdx === 0) {
                                SoundManager.instance?.playSFX('Audio/Card-Shuffle');
                            }
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

    openSettingUI() {
        if (this.settingUI) {
            this.pauseGame();
            this.settingUI.showUI();
            SoundManager.instance?.playSFX('Audio/Hit')
        }
    }

    openRuleUI() {
        if (this.ruleUI) {
            SoundManager.instance?.playSFX('Audio/Hit')
            this.pauseGame();
            this.ruleUI.showUI();
        }
    }

    returnToMenuScene() {
        SoundManager.instance?.playSFX('Audio/Hit')
        SceneManager.instance.goToMenuScene();
    }

    pauseGame() {
        console.log('Game Paused');
        this.prevState = this.gameState;
        this.gameState = GameState.Pause;
    }

    resumeGame() {
        console.log('Game Resumed');
        this.gameState = this.prevState;
    }
}