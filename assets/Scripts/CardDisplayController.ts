import { _decorator, Component, Node, Sprite, SpriteFrame, resources } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('CardDisplayController')
export class CardDisplayController extends Component {
    @property(Sprite)
    rankSprite: Sprite = null!;

    @property(Sprite)
    suitSprite: Sprite = null!;

    @property(Sprite)
    suitMiddleSprite: Sprite = null!;

    @property(Node)
    frontNode: Node = null!;

    @property(Node)
    backNode: Node = null!;

    /**
     * @param rankNumber 1 (Ace) through 13 (King)
     * @param suitName 'spade', 'club', 'heart', or 'diamond'
     */
    public setupCard(rankNumber: number, suitName: string, isFaceUp: boolean = true) {
        const isRed = suitName === 'heart' || suitName === 'diamond';
        const suffix = isRed ? 'R' : 'B';

        const rankPath = `Ranks/${rankNumber}_${suffix}`;
        const suitPath = `Suits/${suitName}`;

        this.loadSprite(rankPath, this.rankSprite);
        this.loadSprite(suitPath, this.suitSprite);
        this.loadSprite(suitPath, this.suitMiddleSprite);

        this.frontNode.active = isFaceUp;
        this.backNode.active = !isFaceUp;
    }

    private loadSprite(path: string, sprite: Sprite) {
        // Adding '/spriteFrame' to the end of the path
        const spriteFramePath = `${path}/spriteFrame`;

        resources.load(spriteFramePath, SpriteFrame, (err, sf) => {
            if (err) {
                console.error(`[PreviewInEditor] FAILED to load at path: resources/${spriteFramePath}`);
                return;
            }
            if (sprite && sprite.isValid) {
                sprite.spriteFrame = sf;
            }
        });
    }


}