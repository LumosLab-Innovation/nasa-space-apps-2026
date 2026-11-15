import type { Music } from '../audio/musicEngine';
import { pickMusic, type MusicInputs } from '../audio/musicMood';

/**
 * Dev-only listening page (?music=test): switch between every mood of the adaptive score with the keyboard,
 * without playing through the game.
 */
export function runMusicSampler(music: Music): void {
  const el = document.createElement('div');
  el.style.cssText =
    'position:fixed;inset:0;background:#05070c;color:#fff;font:18px system-ui,sans-serif;padding:32px;line-height:1.7;overflow:auto';
  el.innerHTML = `
    <div style="font-size:30px;font-weight:bold">Nghe thử nhạc nền · Pip &amp; Mica</div>
    <div style="color:#9fe8ff">Bấm một phím bất kỳ để bật âm thanh, rồi chọn:</div>
    <div style="margin-top:12px">
      <b>1</b> — Thư thả (khám phá, ở trại) · 60 BPM<br>
      <b>2</b> — Kỳ vĩ (bay qua Biển Tĩnh Lặng, tới điểm dừng mới) · 72 BPM<br>
      <b>3</b> — Căng thẳng (Hố tối, sắp cạn oxy, kéo Mica) · 90 BPM<br>
      <b>4</b> — Dồn dập (hãm tốc, bão Mặt Trời, tàu hàng) · 128 BPM<br>
      <b>5</b> — Bão Mặt Trời đếm ngược 30 giây (nhịp nhanh dần tới 140 BPM)<br>
      <b>6</b> — Đêm dài (thưa, có chuông của Mica) · 54 BPM<br>
      <b>7</b> — Bình minh qua khe núi (organ dâng, kết ở D trưởng)<br>
      <b>8</b> — Cất cánh, chia tay (chủ đề chính đầy đủ)<br>
      <b>9</b> — Im lặng (lúc tìm thấy Mica)<br>
      <b>T</b> — Chạm đất: nín thở 2 giây rồi hợp âm · <b>P</b> — motif của Pip · <b>M</b> — chuông của Mica · <b>K</b> — tìm thấy thẻ kiến thức<br>
      <b>B</b> — bật/tắt nhạc
    </div>
    <div id="msNow" style="margin-top:18px;color:#ffcc66;font-size:22px"></div>`;
  document.body.appendChild(el);
  const now = el.querySelector('#msNow') as HTMLDivElement;

  let inputs: Partial<MusicInputs> = {};
  let label = 'Thư thả';
  let countdown = -1;
  let holdT = -1;
  const set = (i: Partial<MusicInputs>, l: string) => {
    inputs = i;
    label = l;
    countdown = -1;
  };

  window.addEventListener('keydown', (e) => {
    switch (e.code) {
      case 'Digit1': set({}, 'Thư thả'); break;
      case 'Digit2': set({ wonder: true }, 'Kỳ vĩ'); break;
      case 'Digit3': set({ tense: true }, 'Căng thẳng'); break;
      case 'Digit4': set({ landing: 'braking' }, 'Dồn dập'); break;
      case 'Digit5': set({}, 'Bão Mặt Trời'); countdown = 30; break;
      case 'Digit6': set({ act5: 'night' }, 'Đêm dài'); break;
      case 'Digit7': set({ act5: 'dawn' }, 'Bình minh'); break;
      case 'Digit8': set({ act5: 'liftoff' }, 'Cất cánh'); break;
      case 'Digit9': set({ micaSilent: true }, 'Im lặng'); break;
      case 'KeyT': set({ touchdownHold: true }, 'Chạm đất: nín thở…'); holdT = 2; break;
      case 'KeyP': music.motif('pip'); break;
      case 'KeyM': music.motif('mica'); break;
      case 'KeyK': music.stinger('discovery'); break;
      case 'KeyB': music.setOn(!music.on); break;
    }
  });

  let last = performance.now();
  const loop = () => {
    const t = performance.now();
    const dt = Math.min(0.1, (t - last) / 1000);
    last = t;
    if (countdown >= 0) {
      countdown = Math.max(0, countdown - dt);
      // 30 real seconds stand for the game's 150 s warning.
      inputs = countdown > 0 ? { storm: 'warning', stormLeftS: (countdown / 30) * 150 } : { storm: 'storm', stormLeftS: 30 };
    }
    if (holdT >= 0) {
      holdT -= dt;
      if (holdT < 0) {
        music.stinger('touchdown');
        set({}, 'Chạm đất: hợp âm, rồi về thư thả');
      }
    }
    music.setTarget(pickMusic(inputs));
    music.update(dt);
    const d = music.debug;
    now.textContent = `Đang phát: ${label}${countdown > 0 ? ` (còn ${countdown.toFixed(0)} s)` : ''} · ${d.bpm} BPM${music.on ? '' : ' · NHẠC TẮT'}${d.running ? '' : ' · bấm một phím để bật âm thanh'}`;
    requestAnimationFrame(loop);
  };
  loop();
}
