
// `assets/Scripts/SoundManager.ts`
import { _decorator, Component, AudioSource, resources, Node, director, AudioClip } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SoundManager')
export class SoundManager extends Component {
    private static _instance: SoundManager | null = null;

    private bgmSource: AudioSource | null = null;
    private sfxSource: AudioSource | null = null;

    // keep last BGM path so we can replay it
    private currentBgmPath: string = 'Audio/BGM';

    public bgmEnabled: boolean = true;
    public sfxEnabled: boolean = true;

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

    start() {
        this.playBGM(this.currentBgmPath);
    }

    setBGMEnabled(enabled: boolean) {
        this.bgmEnabled = enabled;
        if (!this.bgmSource) return;

        if (!enabled) {
            this.bgmSource.stop();
        } else {
            // when turning on, play current BGM again
            this.playBGM(this.currentBgmPath);
        }
    }

    setSFXEnabled(enabled: boolean) {
        this.sfxEnabled = enabled;
    }

    playBGM(path: string) {
        if (!this.bgmEnabled) return;
        this.currentBgmPath = path;

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