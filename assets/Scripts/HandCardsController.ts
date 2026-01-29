
import { _decorator, Component, Node, Vec3 } from 'cc';
import { CardController, getCardRankValue } from './CardController';
import { AvatarsController } from './AvatarsController';

const { ccclass, property } = _decorator;
const CARD_SPACING = 50;

@ccclass('HandCardsController')
export class HandCardsController extends Component {
    private cards: CardController[] = [];
    private hp: number = 4;

    @property(AvatarsController)
    avatarController: AvatarsController | null = null;

    addCard(card: CardController) {
        if (this.cards.indexOf(card) === -1) {
            card.inHand = true;
            this.cards.push(card);
            this.sortAndArrange();
        }
    }

    removeCard(card: CardController) {
        const idx = this.cards.indexOf(card);
        if (idx !== -1) {
            card.inHand = false;
            this.cards.splice(idx, 1);
            this.sortAndArrange();
        }
    }

    private sortAndArrange() {
        this.cards.sort((a, b) => {
            const rankDiff = getCardRankValue(a.rank) - getCardRankValue(b.rank);
            if (rankDiff !== 0) return rankDiff;
            return a.suit - b.suit;
        });

        const n = this.cards.length;
        const totalWidth = (n - 1) * CARD_SPACING;
        const startX = -totalWidth / 2;

        for (let i = 0; i < n; i++) {
            const cardNode = this.cards[i].node;
            cardNode.setPosition(new Vec3(startX + i * CARD_SPACING, 0, 0));
            cardNode.setSiblingIndex(i);
        }
    }

    getCards(): CardController[] {
        return this.cards.slice();
    }

    // HP system
    getHp(): number {
        return this.hp;
    }

    setHp(value: number) {
        this.hp = Math.max(0, value);
        this.avatarController?.setHeartSprite(this.hp);
    }

    addHp(amount: number) {
        this.hp += amount;
        this.avatarController?.setHeartSprite(this.hp);
    }

    reduceHp(amount: number) {
        this.hp = Math.max(0, this.hp - amount);
        this.avatarController?.setHeartSprite(this.hp);
    }
}