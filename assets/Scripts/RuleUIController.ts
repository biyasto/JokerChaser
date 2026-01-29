import { _decorator, Component, Node, tween, Vec3 } from 'cc';
import GameManager from "./GameManager";
import {SoundManager} from "db://assets/Scripts/SoundManager";
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
            this.blur.active = true;

            const startPos = this.container.getPosition();
            const endPos = new Vec3(startPos.x - 420, startPos.y, startPos.z);

            tween(this.container)
                .to(0.3, { position: endPos })
                .call(() => { this.isVisible = true; }) // Set to true here
                .start();
        }
    }

    hideUI() {
        console.debug("Hide UI attempt..."); // Move this outside the IF to verify the click
        if (!this.container) return;

        if (this.isVisible && this.container){
            const startPos = this.container.getPosition();
            const endPos = new Vec3(startPos.x + 420, startPos.y, startPos.z);

            SoundManager.instance?.playSFX('Audio/Hit')

            tween(this.container)
                .to(0.3, { position: endPos })
                .call(() => {
                    this.container.active = false;
                    this.blur.active = false;
                    this.isVisible = false;
                    if(GameManager.instance!=null){
                        GameManager.instance.resumeGame();
                    }
                })
                .start();
        }

    }
}