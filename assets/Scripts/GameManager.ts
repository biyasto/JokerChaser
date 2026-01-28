import { _decorator, Component, Node, Prefab, instantiate, Vec3 } from 'cc';
import { CardController } from './CardController';
const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {
    @property({ type: Prefab })
    cardPrefab: Prefab = null!;

    @property(Node)
    cardParent: Node = null!;

    start() {
        const randomSuit = Math.floor(Math.random() * 4); // 0-3

        for (let i = 0; i < 13; i++) {
            const cardNode = instantiate(this.cardPrefab);
            cardNode.parent = this.cardParent;
            cardNode.setPosition(new Vec3(i*50, 0, 0));

            const cardController = cardNode.getComponent(CardController);
            if (cardController) {
                cardController.setup(i + 1, randomSuit, true);
            }
        }
    }
}