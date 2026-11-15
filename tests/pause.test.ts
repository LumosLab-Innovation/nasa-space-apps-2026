import { describe, expect, it } from 'vitest';
import { escOpensPause, loadVolume, MenuHistory, saveVolume } from '../src/core/pause';
import { Keyboard } from '../src/player/keyboard';
import { getLang, loadLang, saveLang, setLang, tr } from '../src/i18n/i18n';

describe('pause and settings menu (plan 6a, task 1)', () => {
  it('Esc opens the pause menu except where Esc already means something', () => {
    expect(escOpensPause({ descentActive: false, horizonOpen: false })).toBe(true);
    expect(escOpensPause({ descentActive: true, horizonOpen: false })).toBe(true);
    expect(escOpensPause({ descentActive: false, horizonOpen: true })).toBe(false);
  });

  it('volume is remembered, clamped, and survives broken storage', () => {
    const mem = new Map<string, string>();
    const ok = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) };
    expect(loadVolume(ok)).toBe(1);
    saveVolume(ok, 0.4);
    expect(loadVolume(ok)).toBeCloseTo(0.4, 6);
    saveVolume(ok, 3);
    expect(loadVolume(ok)).toBe(1);
    const broken = { getItem: () => { throw new Error('x'); }, setItem: () => { throw new Error('x'); } };
    expect(loadVolume(broken)).toBe(1);
    expect(() => saveVolume(broken, 0.5)).not.toThrow();
  });

  it('language: tr substitutes variables and falls back to English; the choice is remembered', () => {
    setLang('en');
    expect(tr('Music {state} · B', { state: 'on' })).toBe('Music on · B');
    setLang('vi');
    expect(getLang()).toBe('vi');
    expect(tr('A sentence nobody translated')).toBe('A sentence nobody translated');
    expect(tr('Resume')).toBe('Tiếp tục');
    setLang('en');
    const mem = new Map<string, string>();
    const ok = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) };
    expect(loadLang(ok)).toBeNull();
    saveLang(ok, 'vi');
    expect(loadLang(ok)).toBe('vi');
    const broken = { getItem: () => { throw new Error('x'); }, setItem: () => { throw new Error('x'); } };
    expect(loadLang(broken)).toBeNull();
  });
});

describe('mission menu input', () => {
  it('keeps a mission paused when returning from Settings to Pause', () => {
    const changes: boolean[] = [];
    const menu = new MenuHistory<'pause' | 'settings'>((open) => changes.push(open));
    menu.open('pause');
    menu.open('settings');
    menu.back();
    expect(menu.current).toBe('pause');
    expect(changes).toEqual([true]);
    menu.back();
    expect(menu.current).toBeUndefined();
    expect(changes).toEqual([true, false]);
  });

  it('closes Settings opened directly without opening Pause', () => {
    const changes: boolean[] = [];
    const menu = new MenuHistory<'pause' | 'settings'>((open) => changes.push(open));
    menu.open('settings');
    menu.back();
    expect(menu.current).toBeUndefined();
    expect(changes).toEqual([true, false]);
  });

  it('requires a fresh thrust press after clearing the gameplay keyboard', () => {
    const target = new EventTarget();
    const keyboard = new Keyboard(target as unknown as Window);
    const press = (repeat = false) => target.dispatchEvent(Object.assign(new Event('keydown'), { code: 'Space', repeat }));
    press();
    expect(keyboard.isHeld('Space')).toBe(true);
    keyboard.reset();
    press(true);
    expect(keyboard.isHeld('Space')).toBe(false);
    expect(keyboard.consume('Space')).toBe(false);
    press();
    expect(keyboard.isHeld('Space')).toBe(true);
    keyboard.dispose();
  });
});
