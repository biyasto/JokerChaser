import { _decorator, Component, Node, Sprite, Color, tween } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('AvatarsController')
export class AvatarsController extends Component {
    @property([Sprite])
    heartSprites: Sprite[] = [];

    @property(Node)
    HPbar: Node = null;

    @property(Node)
    Warning: Node = null;

    start() {
        if (this.heartSprites.length === 0) {
            this.heartSprites = new Array(4);
        }
        this.setHeartSprite(4);
    }

    setHeartSprite(count: number) {
        for (let i = 0; i < this.heartSprites.length; i++) {
            const sprite = this.heartSprites[i];
            if (!sprite) continue;

            const targetColor = (i < this.heartSprites.length - count)
                ? Color.BLACK
                : Color.RED;

            if (!sprite.color.equals(targetColor)) {
                tween(sprite)
                    .to(1, { color: targetColor })
                    .start();
            }
        }

        // After updating all hearts, if HP is 0, disable this whole avatar node
        if (count === 0) {
            tween(this.node)
                .delay(1) // match the hearts tween duration
                .call(() => {
                    this.node.active = false;
                })
                .start();
        } else {
            // ensure it is enabled again if HP goes back above 0
            this.node.active = true;
        }
    }

    turnOnWarning() {
        if (this.HPbar) this.HPbar.active = false;
        if (this.Warning) this.Warning.active = true;
    }
}