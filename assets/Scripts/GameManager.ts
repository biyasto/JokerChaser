// File: assets/Scripts/GameManager.ts
import { _decorator, Component, Node, Prefab, instantiate, input, Input, KeyCode, EventKeyboard } from 'cc';
import { CardController } from './CardController';
import { HandCardsController } from './HandCardsController';
const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {
    @property({ type: Prefab })
    cardPrefab: Prefab = null!;

    @property([Node])
    cardParents: Node[] = []; // 4 parent nodes for 4 hands

    @property([HandCardsController])
    handCardsControllers: HandCardsController[] = []; // 4 hand controllers

    private chosenCard: CardController | null = null;
    private chosenCardOriginalY: number = 0;

    start() {
        for (let handIdx = 0; handIdx < 4; handIdx++) {
            const suit = handIdx; // Each hand gets a unique suit
            for (let rank = 1; rank <= 13; rank++) {
                const cardNode = instantiate(this.cardPrefab);
                cardNode.parent = this.cardParents[handIdx];
                const cardController = cardNode.getComponent(CardController);
                if (cardController) {
                    // Only player hand (0) is face up, bots are face down
                    const isFaceUp = handIdx === 0;
                    cardController.setup(rank, suit, isFaceUp);
                    if (handIdx === 0) {
                        cardController.onCardSelected = this.onCardSelected.bind(this);
                        cardController.inHand = true;
                    } else {
                        cardController.onCardSelected = null;
                        cardController.inHand = false;
                    }
                    this.handCardsControllers[handIdx].addCard(cardController);
                }
            }
        }
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    onCardSelected(card: CardController) {
        if (this.chosenCard === card) {
            // Unselect the card
            card.node.setPosition(
                card.node.position.x,
                this.chosenCardOriginalY,
                card.node.position.z
            );
            this.chosenCard = null;
            return;
        }
        if (this.chosenCard && this.chosenCard !== card) {
            this.chosenCard.node.setPosition(
                this.chosenCard.node.position.x,
                this.chosenCardOriginalY,
                this.chosenCard.node.position.z
            );
        }
        this.chosenCard = card;
        this.chosenCardOriginalY = card.node.position.y;
        card.node.setPosition(
            card.node.position.x,
            this.chosenCardOriginalY + 70,
            card.node.position.z
        );
    }

    onKeyDown(event: EventKeyboard) {
        if (event.keyCode === KeyCode.KEY_A && this.chosenCard) {
            // Remove chosen card from player hand
            this.handCardsControllers[0].removeCard(this.chosenCard);
            this.chosenCard.setupDisplay(true); // Ensure card is face up
            this.chosenCard.node.setPosition(200, 200, 0);
            this.chosenCard = null;

            // Remove a random card from each bot hand
            for (let i = 1; i < 4; i++) {
                const botHand = this.handCardsControllers[i];
                const cards = botHand.getCards();
                if (cards.length > 0) {
                    const randomIdx = Math.floor(Math.random() * cards.length);
                    const cardToRemove = cards[randomIdx];
                    botHand.removeCard(cardToRemove);
                    cardToRemove.setupDisplay(true); // Ensure card is face up
                    cardToRemove.node.setPosition(200, 200, 0);
                }
            }
        }
    }
}