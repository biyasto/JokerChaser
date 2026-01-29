
import { _decorator, Component, Sprite, Vec3, tween } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ChaserUIController')
export class ChaserUIController extends Component {
    @property([Sprite])
    icons: Sprite[] = [];

    @property(Sprite)
    joker: Sprite | null = null;

    @property
    moveDuration: number = 0.5;

    start() {
    }

    reset() {
        for (const icon of this.icons) {
            if (!icon) continue;
            icon.node.setPosition(Vec3.ZERO);
        }

        if (this.joker) {
            this.joker.node.setPosition(new Vec3(-100, 0, 0));
        }
    }

    moveIcon(index: number, posX: number) {
        const icon = this.icons[index];
        if (!icon) return;

        const node = icon.node;
        const currentPos = node.getPosition();
        const targetPos = new Vec3(posX, currentPos.y, currentPos.z);

        tween(node)
            .to(this.moveDuration, { position: targetPos })
            .start();
    }

    private getUniqueSortedIndices(values: number[]): number[] {
        const countMap = new Map<number, number>();

        for (const v of values) {
            countMap.set(v, (countMap.get(v) || 0) + 1);
        }

        const pairs: { index: number; value: number }[] = [];
        for (let i = 0; i < values.length; i++) {
            const v = values[i];
            if ((countMap.get(v) || 0) === 1) {
                pairs.push({ index: i, value: v });
            }
        }

        pairs.sort((a, b) => a.value - b.value);
        return pairs.map(p => p.index);
    }

    typescript
// joker moves based on value pattern:
// - all same  -> stay still
// - has dup   -> x = 0
// - all diff  -> x = 100
    private moveJokerAfterIcons(
        values: number[],
        totalIconAnimTime: number,
        movedTargetXs: number[]
    ) {
        if (!this.joker) return;
        if (values.length === 0) return;

        const first = values[0];
        const allSame = values.every(v => v === first);
        if (allSame) {
            // all values same -> joker stays
            return;
        }

        // detect if there is any duplicate
        const seen = new Set<number>();
        let hasDup = false;
        for (const v of values) {
            if (seen.has(v)) {
                hasDup = true;
                break;
            }
            seen.add(v);
        }

        // choose target X based on dup or all-different
        const targetX = hasDup ? 0 : 100;

        const jokerNode = this.joker.node;
        const jokerPos = jokerNode.getPosition();
        const targetPos = new Vec3(targetX, jokerPos.y, jokerPos.z);

        tween(jokerNode)
            .delay(totalIconAnimTime)
            .to(this.moveDuration, { position: targetPos })
            .start();
    }
    checkValue(values: number[]) {
        if (!values || values.length === 0) return;

        // Filter out dead players (value 0) and track original indices
        const aliveEntries = values
            .map((value, originalIndex) => ({ value, originalIndex }))
            .filter(entry => entry.value !== 0);

        if (aliveEntries.length === 0) {
            console.log('[ChaserUIController] All players dead - no icons to move');
            return;
        }

        const aliveValues = aliveEntries.map(entry => entry.value);
        const aliveIndices = aliveEntries.map(entry => entry.originalIndex);

        // Replace any value == 1 with 14 (only for alive players)
        const normalized = aliveValues.map(v => v === 1 ? 14 : v);
        console.log('[ChaserUIController] normalized values (alive only):', normalized);
        console.log('[ChaserUIController] corresponding alive indices:', aliveIndices);

        const uniqueIndices = this.getUniqueSortedIndicesForAlive(normalized, aliveIndices);
        const baseTargets = [400, 300, 200, 100];

        if (uniqueIndices.length === 0) {
            this.moveJokerAfterIcons(normalized, 0, []);
            return;
        }

        const targetXs = baseTargets.slice(0, Math.min(uniqueIndices.length, baseTargets.length));

        let delay = 0;
        for (let i = 0; i < targetXs.length; i++) {
            const iconIndex = uniqueIndices[i];
            const icon = this.icons[iconIndex];
            if (!icon) continue;

            const node = icon.node;
            const currentPos = node.getPosition();
            const targetPos = new Vec3(targetXs[i], currentPos.y, currentPos.z);

            tween(node)
                .delay(delay)
                .to(this.moveDuration, { position: targetPos })
                .start();

            delay += this.moveDuration;
        }

        this.moveJokerAfterIcons(normalized, delay, targetXs);
    }

    private getUniqueSortedIndicesForAlive(values: number[], originalIndices: number[]): number[] {
        const countMap = new Map<number, number>();

        for (const v of values) {
            countMap.set(v, (countMap.get(v) || 0) + 1);
        }

        const pairs: { index: number; value: number }[] = [];
        for (let i = 0; i < values.length; i++) {
            const v = values[i];
            if ((countMap.get(v) || 0) === 1) {
                pairs.push({ index: originalIndices[i], value: v });
            }
        }

        pairs.sort((a, b) => a.value - b.value);
        return pairs.map(p => p.index);
    }
}