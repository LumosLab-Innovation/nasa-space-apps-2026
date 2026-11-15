import './discoveryFlyIn.css';
import { reducedCameraMotion } from '../core/accessibility';

const SHOW_MS = 2500;
const LEAVE_MS = 350;

/** `credit` marks `photo` as a NASA image: shown whole (not cropped) on paper, with its credit line. */
export interface FlyInEntry { id: string; title: string; photo: string | null; credit?: string | null }
interface Moment { entries: FlyInEntry[]; quiet: boolean }

/**
 * One polaroid per photo moment: the first card in front with its title, up to two blank papers behind
 * it and a "+N" badge when the moment holds more cards. Quiet moments (knowledge cards) have no flash.
 */
export function createDiscoveryFlyIn(): {
  show(batch: FlyInEntry[], opts?: { quiet?: boolean }): void;
  develop(id: string, jpeg: string): void;
  dispose(): void;
} {
  const queue: Moment[] = [];
  let current: { moment: Moment; el: HTMLElement; snap: HTMLElement } | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let disposed = false;
  // Photos that arrived for an id whose polaroid is not on screen yet or is already gone.
  const early = new Map<string, string>();

  function paint(snap: HTMLElement, el: HTMLElement, jpeg: string, nasa = false): void {
    snap.toggleAttribute('data-nasa', nasa);
    snap.style.backgroundImage = `url("${jpeg}")`;
    el.setAttribute('data-developed', '');
  }

  function div(className: string): HTMLDivElement {
    const d = document.createElement('div');
    d.className = className;
    return d;
  }

  function next(): void {
    if (disposed || current) return;
    const moment = queue.shift();
    if (!moment) return;
    const front = moment.entries[0];
    const reduced = reducedCameraMotion();
    if (!reduced && !moment.quiet) {
      const flash = div('discovery-flash');
      flash.setAttribute('aria-hidden', 'true');
      document.body.appendChild(flash);
      setTimeout(() => flash.remove(), 400);
    }
    const el = div('discovery-pol');
    if (reduced) el.setAttribute('data-reduced', '');
    el.setAttribute('role', 'status');
    const count = moment.entries.length;
    if (count >= 3) el.append(div('paper back b2'));
    if (count >= 2) el.append(div('paper back b1'));
    const face = div('paper face');
    const snap = div('snap');
    const cap = div('cap');
    cap.textContent = front.title;
    face.append(snap, cap);
    if (front.credit && front.photo) {
      const credit = div('credit');
      credit.textContent = front.credit;
      face.append(credit);
    }
    el.append(face);
    if (count > 1) {
      const badge = div('badge');
      badge.textContent = `+${count - 1}`;
      el.append(badge);
    }
    document.body.appendChild(el);
    current = { moment, el, snap };
    const photo = front.photo ?? early.get(front.id) ?? null;
    if (photo) paint(snap, el, photo, !!front.credit && photo === front.photo);
    for (const e of moment.entries) early.delete(e.id);
    timer = setTimeout(() => {
      el.setAttribute('data-leaving', '');
      timer = setTimeout(() => {
        el.remove();
        current = null;
        timer = null;
        next();
      }, LEAVE_MS);
    }, SHOW_MS);
  }

  return {
    show(batch, opts) {
      if (disposed || batch.length === 0) return;
      queue.push({ entries: batch.map((e) => ({ ...e })), quiet: !!opts?.quiet });
      next();
    },
    develop(id, jpeg) {
      if (disposed) return;
      if (current) {
        const i = current.moment.entries.findIndex((e) => e.id === id);
        if (i >= 0) {
          current.moment.entries[i].photo = jpeg;
          if (i === 0) {
            paint(current.snap, current.el, jpeg);
            current.el.querySelector('.credit')?.remove();
          }
          return;
        }
      }
      for (const m of queue) {
        const e = m.entries.find((x) => x.id === id);
        if (e) { e.photo = jpeg; return; }
      }
      early.set(id, jpeg);
    },
    dispose() {
      disposed = true;
      if (timer) clearTimeout(timer);
      current?.el.remove();
      current = null;
      queue.length = 0;
      early.clear();
    },
  };
}
