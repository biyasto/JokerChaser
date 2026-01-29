// File: assets/Scripts/SettingUIController.ts
import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SettingUIController')
export class SettingUIController extends Component {
    @property(Node)
    container: Node = null!;
    @property(Node)
    blur: Node = null!;
    private isVisible: boolean = false;


    private isVisible: boolean = false;

    showUI() {
        if (!this.isVisible && this.container) {
            this.container.active = true;
            this.blur.active=true;
            this.isVisible = true;
        }
    }

    hideUI() {
        if (this.isVisible && this.container) {

            this.container.active = false;
            this.isVisible = false;
            this.blur.active=false;

        }
    }
}