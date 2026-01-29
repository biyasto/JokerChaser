import { _decorator, Component } from 'cc';
import { SettingUIController } from './SettingUIController';
import { RuleUIController } from './RuleUIController';
import {SceneManager} from "db://assets/Scripts/SceneManager";
import {SoundManager} from "db://assets/Scripts/SoundManager";
const { ccclass, property } = _decorator;

@ccclass('MenuController')
export class MenuController extends Component {
    @property(SettingUIController)
    settingUI: SettingUIController = null!;

    @property(RuleUIController)
    ruleUI: RuleUIController = null!;

    openSetting() {
        console.log('showUI Setting');

        if (this.settingUI) {
            SoundManager.instance?.playSFX('Audio/Hit')
            this.settingUI.showUI();
        }
    }

    openRule() {
        console.log('showUI Rule');
        SoundManager.instance?.playSFX('Audio/Hit')

        if (this.ruleUI) {
            this.ruleUI.showUI();
        }
    }
    onPlayButtonClicked() {
        console.log('Play button clicked');
        SoundManager.instance?.playSFX('Audio/Hit')
        SceneManager.instance.goToGameplayScene();
    }
}