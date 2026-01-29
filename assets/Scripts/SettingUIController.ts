import { _decorator, Component, Node, Button } from 'cc';
import { SoundManager } from './SoundManager';
const { ccclass, property } = _decorator;
import GameManager from './GameManager';


@ccclass('SettingUIController')
export class SettingUIController extends Component {
    @property(Node)
    container: Node = null!;

    @property(Node)
    blur: Node = null!;

    @property(Button)
    bgmOnButton: Button = null!;

    @property(Button)
    bgmOffButton: Button = null!;

    @property(Button)
    sfxOnButton: Button = null!;

    @property(Button)
    sfxOffButton: Button = null!;

    private isVisible: boolean = false;

    showUI() {
        if (!this.container) return;
        this.container.active = true;
        this.blur.active = true;
        this.isVisible = true;
        this.updateButtons();
    }

    hideUI() {
        if (!this.container) return;
        this.container.active = false;
        this.blur.active = false;
        this.isVisible = false;
        if(GameManager.instance!=null){
            GameManager.instance.resumeGame();
        }
        SoundManager.instance?.playSFX('Audio/Hit')

    }

    onBGMOn() {
        SoundManager.instance.setBGMEnabled(true);
        this.updateButtons();
        SoundManager.instance?.playSFX('Audio/Hit')

    }

    onBGMOff() {
        SoundManager.instance.setBGMEnabled(false);
        this.updateButtons();
        SoundManager.instance?.playSFX('Audio/Hit')

    }

    onSFXOn() {
        SoundManager.instance.setSFXEnabled(true);
        this.updateButtons();
        SoundManager.instance?.playSFX('Audio/Hit')

    }

    onSFXOff() {
        SoundManager.instance.setSFXEnabled(false);
        this.updateButtons();
        SoundManager.instance?.playSFX('Audio/Hit')

    }

    updateButtons() {
        const bgmEnabled = (SoundManager.instance as any).bgmEnabled;
        const sfxEnabled = (SoundManager.instance as any).sfxEnabled;

        if (this.bgmOnButton) this.bgmOnButton.node.active = bgmEnabled;
        if (this.bgmOffButton) this.bgmOffButton.node.active = !bgmEnabled;
        if (this.sfxOnButton) this.sfxOnButton.node.active = sfxEnabled;
        if (this.sfxOffButton) this.sfxOffButton.node.active = !sfxEnabled;
    }
}