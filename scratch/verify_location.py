import glob
import re

html_files = glob.glob('*.html')
print(f"Total HTML files found: {len(html_files)}")

issues = 0
for fpath in html_files:
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    labels = re.findall(r'<label', content, re.IGNORECASE)
    placeholders = re.findall(r'placeholder=["\']([^"\']+)["\']', content, re.IGNORECASE)
    bad_ph = [p for p in placeholders if len(p.strip().split()) > 3]
    golds = re.findall(r'(#b8860b|#f5eedc|#d4af37|btn-gold|btn-copper)', content, re.IGNORECASE)

    if labels or bad_ph or golds:
        print(f"[{fpath}] ISSUES:")
        if labels:
            print(f"  - Labels: {len(labels)}")
            issues += 1
        if bad_ph:
            print(f"  - Bad placeholders (>3 words): {bad_ph}")
            issues += 1
        if golds:
            print(f"  - Gold/Copper: {len(golds)}")
            issues += 1

if issues == 0:
    print("ALL HTML FILES PASS RULE VERIFICATION (0 labels, 0 bad placeholders, 0 gold/copper)!")
