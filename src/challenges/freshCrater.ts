import type { Astronaut } from '../player/astronaut';
import type { DialogueBox } from '../ui/dialogueBox';
import type { Hud } from '../ui/hud';
import { zone } from '../world/zones';
import { tr } from '../i18n/i18n';

/**
 * Fresh Crater (spec v3 §7, stop 5): sunlit rocks reach ~115 °C while the shadow beside them is ~−150 °C.
 * The glass beads only stand out through Pip's thermal view (they hold heat differently from the dust).
 */
export function glassBeadsVisible(thermalOn: boolean, distM: number): boolean {
  return thermalOn && distM <= 25;
}

export function createFreshCrater(dialogue: DialogueBox, hud: Hud): { update(player: Astronaut, thermalOn: boolean): void } {
  let hinted = false;
  let explained = false;
  return {
    update(player, thermalOn) {
      const c = zone('freshCrater');
      const d = Math.hypot(player.position.x - c.x, player.position.z - c.z);
      if (d > c.radius) return;
      if (!thermalOn && !hinted) {
        hinted = true;
        hud.toast(tr('Pip: "Something here looks odd in infrared. Try my thermal view (T)."'), 5);
      }
      if (thermalOn && !explained) {
        explained = true;
        void dialogue.play('crater_thermal');
      }
    },
  };
}
