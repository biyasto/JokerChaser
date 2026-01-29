import { _decorator, Component, Node, tween, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('RuleUIController')
export class RuleUIController extends Component {
    @property(Node)
    container: Node = null!;

    @property(Node)
    blur: Node = null!;
    private isVisible: boolean = false;


    showUI() {
        if (!this.container) return;
        if (!this.isVisible && this.container){
            this.container.active = true;
            this.blur.active=true;
        // Move to left by 400 units (relative)
        const startPos = this.container.getPosition();
        const endPos = new Vec3(startPos.x - 420, startPos.y, startPos.z);
        tween(this.container)
            .to(0.3, { position: endPos })
            .start();}
    }

    hideUI() {
        console.debug("Hide UI");
        if (!this.container) return;
        if (this.isVisible && this.container){
        // Move to right by 400 units (relative), then hide
        const startPos = this.container.getPosition();
        const endPos = new Vec3(startPos.x + 420, startPos.y, startPos.z);
        tween(this.container)
            .to(0.3, { position: endPos })
            .call(() => {
                this.container.active = false;
                this.blur.active=false;

            })
            .start();}
    }
}