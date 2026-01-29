// In assets/Scripts/SoundManager.ts
import { _decorator, Component, AudioSource, resources, Node, director, AudioClip } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SoundManager')
export class SoundManager extends Component {
    private static _instance: SoundManager | null = null;

    private bgmSource: AudioSource | null = null;
    private sfxSource: AudioSource | null = null;

    private bgmEnabled: boolean = true;
    private sfxEnabled: boolean = true;

    public static get instance(): SoundManager {
        if (!this._instance) {
            const node = new Node('SoundManager');
            this._instance = node.addComponent(SoundManager);
            director.addPersistRootNode(node);
        }
        return this._instance;
    }

    onLoad() {
        if (SoundManager._instance && SoundManager._instance !== this) {
            this.node.destroy();
            return;
        }
        SoundManager._instance = this;
        director.addPersistRootNode(this.node);

        this.bgmSource = this.node.addComponent(AudioSource);
        this.sfxSource = this.node.addComponent(AudioSource);
    }

    setBGMEnabled(enabled: boolean) {
        this.bgmEnabled = enabled;
        if (!enabled && this.bgmSource) {
            this.bgmSource.stop();
        }
    }

    setSFXEnabled(enabled: boolean) {
        this.sfxEnabled = enabled;
    }

    playBGM(path: string) {
        if (!this.bgmEnabled) return;
        resources.load(path, AudioClip, (err, clip) => {
            if (err || !clip) {
                console.error('Failed to load BGM:', path);
                return;
            }
            if (this.bgmSource) {
                this.bgmSource.stop();
                this.bgmSource.clip = clip;
                this.bgmSource.loop = true;
                this.bgmSource.play();
            }
        });
    }

    playSFX(path: string) {
        if (!this.sfxEnabled) return;
        resources.load(path, AudioClip, (err, clip) => {
            if (err || !clip) {
                console.error('Failed to load SFX:', path);
                return;
            }
            if (this.sfxSource) {
                this.sfxSource.playOneShot(clip as AudioClip);
            }
        });
    }
}