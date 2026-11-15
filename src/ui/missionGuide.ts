import { getLang, tr } from '../i18n/i18n';
import type { Objective } from '../story/objective';
import './missionGuide.css';

/** Optional process hints. Reading pauses play; no route automation or puzzle solutions. */
export function createMissionGuide(onOpen: (open: boolean) => void) {
  const root = document.createElement('aside');
  root.className = 'mission-guide';
  root.hidden = true;
  const button = document.createElement('button');
  button.type = 'button';
  button.setAttribute('aria-expanded', 'false');
  const title = document.createElement('strong');
  const direction = document.createElement('span');
  const action = document.createElement('span');
  button.append(title, direction, action);
  const details = document.createElement('div');
  details.hidden = true;
  const hint = document.createElement('p');
  const controls = document.createElement('p');
  const sources = document.createElement('a');
  sources.href = `${import.meta.env.BASE_URL}sources.html`;
  sources.target = '_blank'; sources.rel = 'noopener noreferrer';
  details.append(hint, controls, sources);
  root.append(button, details);
  document.body.append(root);
  let open = false;
  const setOpen = (value: boolean) => {
    if (open === value) return;
    open = value; details.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
    onOpen(open);
    if (open) button.focus();
    else (document.getElementById('game') as HTMLElement | null)?.focus();
  };
  button.onclick = () => setOpen(!open);
  const key = (e: KeyboardEvent) => {
    if (root.hidden) return;
    if (e.code === 'KeyJ' || (open && e.code === 'Escape')) {
      e.preventDefault(); e.stopImmediatePropagation(); if (!e.repeat) setOpen(!open);
    } else if (open) {
      // Keep menu keys away from movement and dialogue, while retaining native button/link activation.
      e.stopPropagation();
      if (e.key === 'Tab') {
        e.preventDefault(); (document.activeElement === button ? sources : button).focus();
      }
    }
  };
  window.addEventListener('keydown', key, true);
  return {
    get open() { return open; },
    update(o: Objective, p: { x: number; z: number }, cameraYaw: number, visible: boolean, module: string) {
      root.hidden = !visible;
      if (!visible) { setOpen(false); return; }
      const vi = getLang() === 'vi';
      title.textContent = tr(o.title);
      hint.textContent = tr(o.hint, { module: tr(module) });
      action.textContent = open ? (vi ? 'J / Esc — đóng · đang tạm dừng' : 'J / Esc — close · paused') : (vi ? 'J — gợi ý cách làm' : 'J — how to approach this');
      controls.textContent = vi ? 'WASD: đi · Shift: chạy · E: tương tác · Q: nhờ PIP. Đọc lời nhắc gần vật thể vì thao tác thay đổi theo tình huống. Tab: sổ khoa học. Bạn tự chọn đáp án và phương án tài nguyên.' : 'WASD: walk · Shift: lope · E: interact · Q: ask PIP. Read the nearby prompt: actions depend on context. Tab: science notebook. You choose the answers and resource plan.';
      sources.textContent = vi ? 'Nguồn NASA và phần được đơn giản hóa ↗' : 'NASA sources and model limitations ↗';
      if (o.target) {
        const dx = o.target.x - p.x, dz = o.target.z - p.z;
        const distance = Math.hypot(dx, dz);
        const a = Math.atan2(dx, dz) - cameraYaw;
        const arrow = ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖'][((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8];
        direction.textContent = distance < 5 ? (vi ? 'Đã gần mục tiêu — đọc lời nhắc' : 'Nearby — read the interaction prompt') : `${arrow} ${Math.round(distance)} m · ${vi ? 'hướng tới điểm đến, không phải đường đi' : 'bearing, not a safe route'}`;
      } else direction.textContent = vi ? 'Quan sát và tự quyết định' : 'Observe and decide';
    },
    dispose() { setOpen(false); root.remove(); window.removeEventListener('keydown', key, true); },
  };
}
