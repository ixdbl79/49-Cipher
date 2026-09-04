#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Convert quran_output.txt to a book‑like format using chapters_name.json:
- Continuous verses with bracketed numbers: [1] [2] ...
- Header: "{<number>} s°°r-t \"<translit_from_json>\""
- Basmala (hardcoded 49‑E.Z. transliteration) before each surah (except 1 and 9)
- All text uses the 49‑E.Z. system
Usage: python quran_book.py [input_file] [output_file]
Default: data/quran_output.txt -> data/quran_book.txt
"""

import sys
import json
import os

# Get the directory where this script is located
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# The data folder is one level up from scripts/
DATA_DIR = os.path.join(os.path.dirname(BASE_DIR), "data")

# Default file paths (inside data/ folder)
INPUT_FILE = os.path.join(DATA_DIR, "quran_output.txt")
OUTPUT_FILE = os.path.join(DATA_DIR, "quran_book.txt")
CHAPTERS_FILE = os.path.join(DATA_DIR, "chapters_name.json")

# ---- Hardcoded Basmala transliteration (as you provided) ----
BASMALA_49EZ = "b_¯(1)~sm_ L.²-h_ (L.)¨~r²-7m--n_ (L.)¨~r²-7__m_"

# ---- Load surah transliterations from JSON ----
with open(CHAPTERS_FILE, 'r', encoding='utf-8') as f:
    CHAPTERS = json.load(f)   # expects {"1": {"arabic": "...", "translit": "..."}, ...}

def get_surah_translit(num):
    """Return transliteration for surah number from JSON, or fallback."""
    key = str(num)
    if key in CHAPTERS:
        return CHAPTERS[key].get("translit", f"s°r-{num}")
    return f"s°r-{num}"  # fallback

def convert():
    input_file = sys.argv[1] if len(sys.argv) > 1 else INPUT_FILE
    output_file = sys.argv[2] if len(sys.argv) > 2 else OUTPUT_FILE

    # Read transliterated verses
    verses = {}
    with open(input_file, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            parts = line.split('|')
            if len(parts) != 2:
                continue
            ref, translit = parts
            try:
                surah, verse = map(int, ref.split(':'))
            except:
                continue
            verses.setdefault(surah, {})[verse] = translit

    # Hardcoded 49‑E.Z. for "Surah"
    SURAH_WORD = "s°°r-t"

    with open(output_file, 'w', encoding='utf-8') as out:
        for surah in sorted(verses.keys()):
            # ---- Header: {1} s°°r-t "L.f--t_7-" ----
            surah_translit = get_surah_translit(surah)
            out.write(f"{{{surah}}} {SURAH_WORD} \"{surah_translit}\"\n")

            # ---- Basmala (skip Surah 1 and Surah 9) ----
            if surah not in [1, 9]:
                out.write(f"{BASMALA_49EZ}\n")

            # ---- Verses (continuous, with bracketed numbers) ----
            verse_texts = []
            for v in sorted(verses[surah].keys()):
                verse_texts.append(f"[{v}] {verses[surah][v]}")
            surah_text = " ".join(verse_texts)
            out.write(surah_text + "\n\n")

    print(f"✅ Book‑style output saved to '{output_file}'.")

if __name__ == "__main__":
    convert()