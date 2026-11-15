"""Fetch notebook NASA photos and write card content. Run: python -I scripts/fetch-notebook-photos.py
Idempotent: reuses already-downloaded originals cached outside the repo is not needed; re-downloads are cheap."""
import io, json, os, sys, urllib.request
FORCE = '--force' in sys.argv  # re-download the originals and re-encode every image
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RES = os.path.join(ROOT, 'docs', 'superpowers', 'research')
OUT = os.path.join(ROOT, 'public', 'textures', 'notebook')
CARDS = {'en': os.path.join(ROOT, 'src', 'content', 'cards.en.json'), 'vi': os.path.join(ROOT, 'src', 'content', 'cards.vi.json')}


def load(p):
    with open(p, encoding='utf-8') as f:
        return json.load(f)


def eol_of(p):
    with open(p, 'rb') as f:
        return '\r\n' if b'\r\n' in f.read() else '\n'


def save_json(p, data, eol):
    text = json.dumps(data, ensure_ascii=False, indent=2) + '\n'
    with open(p, 'wb') as f:
        f.write(text.replace('\n', eol).encode('utf-8'))


def fetch(url):
    url = url.replace(' ', '%20')
    req = urllib.request.Request(url, headers={'User-Agent': 'notebook-photo-fetch/1.0'})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def resized(im, side):
    im = im.copy()
    im.thumbnail((side, side), Image.LANCZOS)
    return im


def main():
    photos = {e['id']: e['photo'] for e in load(os.path.join(RES, '2026-11-15-notebook-photos.json'))}
    notes = {e['id']: e for e in load(os.path.join(RES, '2026-11-15-pip-notes.json'))}
    os.makedirs(OUT, exist_ok=True)
    meta = {}
    for cid, ph in photos.items():
        if not ph:
            continue
        full, thumb = os.path.join(OUT, cid + '.webp'), os.path.join(OUT, cid + '.thumb.webp')
        if FORCE or not (os.path.exists(full) and os.path.exists(thumb)):
            im = Image.open(io.BytesIO(fetch(ph['downloadUrl']))).convert('RGB')
            resized(im, 960).save(full, 'WEBP', quality=58, method=6)
            resized(im, 256).save(thumb, 'WEBP', quality=60, method=6)
        with Image.open(full) as s:
            meta[cid] = s.size
        print('ok', cid, meta[cid])
    for lang, p in CARDS.items():
        eol = eol_of(p)
        cards = load(p)
        for c in cards:
            c['pipNote'] = notes[c['id']][lang]
            ph = photos.get(c['id'])
            if ph:
                w, h = meta[c['id']]
                c['photo'] = {
                    'file': f"textures/notebook/{c['id']}.webp",
                    'thumb': f"textures/notebook/{c['id']}.thumb.webp",
                    'caption': ph['captionEn' if lang == 'en' else 'captionVi'],
                    'credit': ph['credit'], 'nasaId': ph['nasaId'], 'url': ph['pageUrl'],
                    'width': w, 'height': h,
                }
            else:
                c['photo'] = None
        save_json(p, cards, eol)
    rows = ['# Notebook photo sources', '',
            'NASA images used under NASA media guidelines (https://www.nasa.gov/nasa-brand-center/images-and-media/).', '',
            '| Card id | NASA id | Page URL | Credit | Licence |', '|---|---|---|---|---|']
    for cid, ph in photos.items():
        if ph:
            rows.append(f"| {cid} | {ph['nasaId']} | {ph['pageUrl']} | {ph['credit']} | NASA media guidelines |")
    with open(os.path.join(OUT, 'SOURCES.md'), 'wb') as f:
        f.write(('\n'.join(rows) + '\n').encode('utf-8'))


if __name__ == '__main__':
    sys.exit(main())
