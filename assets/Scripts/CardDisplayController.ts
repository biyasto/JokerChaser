import { _decorator, Component, Node, Sprite, SpriteFrame, resources, tween, Vec3 } from 'cc';
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
     * \@param rankNumber 1 (Ace) through 13 (King)
     * \@param suitName \`spade\`, \`club\`, \`heart\`, or \`diamond\`
     */
    public setupCard(rankNumber: number, suitName: string, isFaceUp: boolean = true) {
        const isRed = suitName === 'heart' || suitName === 'diamond';
        const suffix = isRed ? 'R' : 'B';

        const rankPath = `Ranks/${rankNumber}_${suffix}`;
        const suitPath = `Suits/${suitName}`;

        this.loadSprite(rankPath, this.rankSprite);
        this.loadSprite(suitPath, this.suitSprite);
        this.loadSprite(suitPath, this.suitMiddleSprite);

        // Immediate state if not using flip animation
        if (!isFaceUp) {
            this.frontNode.active = false;
            this.backNode.active = true;
            this.node.setScale(new Vec3(1, 1, 1));
            return;
        }

        // Flip animation: start showing back, end showing front
        this.frontNode.active = false;
        this.backNode.active = true;

        // Ensure starting scale
        this.node.setScale(new Vec3(0.7, 0.7, 0.7));

        tween(this.node)
            // scale X to 0
            .to(0.15, { scale: new Vec3(0, 0.7, 0.7) })
            .call(() => {
                // swap faces at the "thin" point
                this.frontNode.active = true;
                this.backNode.active = false;
            })
            // scale X back to normal
            .to(0.15, { scale: new Vec3(0.7, 0.7, 0.7) })
            .start();
    }

    private loadSprite(path: string, sprite: Sprite) {
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