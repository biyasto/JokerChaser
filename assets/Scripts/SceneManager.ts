// File: assets/Scripts/SceneManager.ts
import { _decorator, Component, Node, director } from 'cc';
const { ccclass } = _decorator;

@ccclass('SceneManager')
export class SceneManager extends Component {
    private static _instance: SceneManager | null = null;

    public static get instance(): SceneManager {
        if (!this._instance) {
            const node = new Node('SceneManager');
            this._instance = node.addComponent(SceneManager);
            director.addPersistRootNode(node);
        }
        return this._instance;
    }

    onLoad() {
        if (SceneManager._instance && SceneManager._instance !== this) {
            this.node.destroy();
            return;
        }
        SceneManager._instance = this;
        director.addPersistRootNode(this.node);
        this.goToMenuScene()
    }

    goToGameplayScene() {
        director.loadScene('GameplayScene');
    }

    goToMenuScene() {
        director.loadScene('MenuScene');
    }
}