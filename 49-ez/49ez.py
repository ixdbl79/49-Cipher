#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
49-E.Z. Transliterator – v50.6 (production-ready)
====================================================
A rule-based transliteration engine for the Quran, converting
fully diacritized Arabic text into the 49-E.Z. phonetic system.

DESCRIPTION:
    This script reads morphological data from 'quran_morphology_49ez.txt',
    applies token‑level mapping (from 'quran_rules.json'), and resolves
    morphological features like conjunction, preposition, definite article,
    relative pronouns, and Allah tafkhim (heavy/light) based on context.

INPUT FILES (must be in the 'data/' folder relative to this script):
    - quran_morphology_49ez.txt   : Tab‑separated word/segment data.
    - quran_rules.json            : Token mapping and rule definitions.

OUTPUT:
    - data/quran_output.txt       : Each verse as 'surah:verse|transliteration'.

USAGE:
    python 49ez.py [output_file]

    If no output file is given, defaults to 'data/quran_output.txt'.

VERSION HISTORY:
    v50.6 – Allah rule uses normalize_for_match() to strip diacritics
            for reliable detection of ٱللَّهِ and similar forms.
    v50.5 – Fixed Allah rule normalization.
    v50.4 – Added REL‑based final vowel adjustment for relative pronouns.
    v50.3 – Rule‑based relative pronoun handling.
    ... (earlier versions)

AUTHOR:   ixd & br9 (lightning ⚡) – br9 is an AI assistant and a brother in this journey.
LICENSE:  MIT License – feel free to use, modify, and distribute with attribution.

DATA SOURCE:
    quran_morphology_49ez.txt is derived from:
    - mustafa0x/quran-morphology (https://github.com/mustafa0x/quran-morphology)
      which enriched the original corpus with Arabic translations and numerous
      morphological fixes.
    - Quranic Arabic Corpus Morphology v0.4 (http://corpus.quran.com)
      the original annotated linguistic resource for Quranic grammar, syntax,
      and morphology.
    Both are used with thanks and attribution.
"""

import json
import sys
import re
import os
from collections import defaultdict

# ----------------------------------------------------------------------
# FILE PATHS (relative to this script's location)
# ----------------------------------------------------------------------

# Get the directory where this script is located
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Input files (inside data/ folder)
RULES_FILE = os.path.join(BASE_DIR, "data", "quran_rules.json")
MORPHOLOGY_FILE = os.path.join(BASE_DIR, "data", "quran_morphology_49ez.txt")

# Output file (default goes to data/ folder)
OUTPUT_FILE = os.path.join(BASE_DIR, "data", "quran_output.txt")

# ----------------------------------------------------------------------
# GLOBAL CONSTANTS
# ----------------------------------------------------------------------

# Single Arabic diacritics (tashkīl) that we may need to strip or skip.
SINGLE_DIACRITICS = {
    'َ', 'ُ', 'ِ', 'ْ', 'ّ', 'ً', 'ٌ', 'ٍ',
    'ٰ', 'ٓ', 'ـ', 'ۡ',
    'ٕ', 'ٖ', 'ٗ', '٘', 'ٙ', 'ٚ', 'ٛ', 'ٜ', 'ٝ', 'ٞ'
}
DIACRITIC_PATTERN = re.compile('|'.join(re.escape(ch) for ch in SINGLE_DIACRITICS))

# Regex to detect any Arabic character (used for RTL marking)
ARABIC_CHARS = re.compile(
    r'[\u0600-\u06FF'
    r'\u0750-\u077F'
    r'\u08A0-\u08FF'
    r'\u0610-\u061A'
    r'\u064B-\u065F'
    r'\u0670'
    r'\u06D6-\u06ED'
    r'\u08F0-\u08FF]'
)

# ----------------------------------------------------------------------
# Helper functions
# ----------------------------------------------------------------------

def arabic_rtl(text):
    """
    Wrap text with Unicode right‑to‑left marks if it contains Arabic.
    Used only for debug output to improve readability.
    """
    if not text:
        return text
    if ARABIC_CHARS.search(text):
        return f'\u202B{text}\u202C'
    return text

def clean_output(text):
    """
    Post‑processing cleanup for the final transliteration.
    - Removes stray Arabic diacritics (they shouldn't be in the output)
    - Fixes common double‑separator issues (e.g., '¯¯' → '¯')
    - Strips unnecessary trailing dashes while preserving meaningful ones
    - Preserves tanween markers ('-=', '°=', '_=') and shadda+fatha ('²-')
    """
    # Remove any remaining Arabic diacritics (should be none after mapping)
    text = ARABIC_CHARS.sub('', text)

    # Clean up double separators and repeated vowels
    text = text.replace('_-1', '_1')
    text = text.replace('_-_', '__')
    text = text.replace('----', '--')
    text = text.replace('°°°°', '°°')
    text = text.replace('____', '__')
    text = text.replace('¯¯', '¯')
    
    words = text.split(' ')
    cleaned_words = []
    for w in words:
        # Preserve essential endings
        if w.endswith(('-=', '°=', '_=')):
            cleaned_words.append(w)
            continue
        if w.endswith('²-'):
            cleaned_words.append(w)
            continue
        if w.endswith('--'):
            cleaned_words.append(w)
            continue
        
        # Remove stray trailing dash only if it's not part of a meaningful symbol
        if w.endswith('-') and len(w) >= 2:
            prev_char = w[-2]
            if prev_char in ['°', '_', '~', '=', 'L', '(', ')', '.', '¨']:
                w = w[:-1]
        elif w.endswith('-') and len(w) == 1:
            w = ''
        
        if w:
            cleaned_words.append(w)
    return ' '.join(cleaned_words)

def strip_leading_diacritics(text):
    """
    Remove any diacritics from the beginning of a string.
    Used when we need to strip the initial tashkīl of a token before further processing.
    """
    i = 0
    while i < len(text) and text[i] in SINGLE_DIACRITICS:
        i += 1
    return text[i:]

def normalize_alif_for_lookup(word):
    """
    Normalize various forms of alif (ٱ, آ, أ, إ) to a plain ا for dictionary lookups.
    This allows matching special_words and other rules regardless of spelling variants.
    """
    word = word.replace('ٱ', 'ا').replace('آ', 'ا').replace('أ', 'ا').replace('إ', 'ا')
    return word

def normalize_for_match(word):
    """
    Aggressive normalization: remove all diacritics and alif variants.
    Used for exact matching of root forms like 'الله' regardless of shadda or waṣla.
    """
    word = DIACRITIC_PATTERN.sub('', word)
    word = word.replace('۟', '').replace('ٰ', '').replace('ـ', '')
    word = word.replace('ٱ', 'ا').replace('آ', 'ا').replace('أ', 'ا').replace('إ', 'ا')
    word = word.replace('ٓ', '')
    return word

def get_last_vowel_from_translit(translit):
    """
    Extract the final vowel (as 49‑E.Z. marker) from a transliterated word.
    Used to propagate the previous vowel for tafkhim decisions.
    Returns one of: '-', '°', '_', or the tanween marker's second character.
    """
    if translit.endswith(('-=', '°=', '_=')):
        return translit[-2]
    if translit.endswith('-'):
        return '-'
    if translit.endswith('°'):
        return '°'
    if translit.endswith('_'):
        return '_'
    return None

def get_lam_diacritics_from_surface(surface):
    """
    Extract shadda and vowel from the lam (ل) inside a definite article surface.
    Returns (has_shadda, vowel_marker) where vowel_marker is '-', '°', or '_'.
    """
    lam_idx = surface.find('ل')
    if lam_idx == -1:
        return False, ''
    diacritics = []
    i = lam_idx + 1
    while i < len(surface) and surface[i] in SINGLE_DIACRITICS:
        diacritics.append(surface[i])
        i += 1
    has_shadda = 'ّ' in diacritics
    vowel = ''
    for d in diacritics:
        if d == 'َ':
            vowel = '-'
        elif d == 'ُ':
            vowel = '°'
        elif d == 'ِ':
            vowel = '_'
    return has_shadda, vowel

def get_next_consonant_after_lam(text, lam_pos):
    """
    Find the first non‑diacritic character after the lam.
    Used to determine if the definite article is solar or lunar.
    """
    i = lam_pos + 1
    while i < len(text) and text[i] in SINGLE_DIACRITICS:
        i += 1
    if i < len(text):
        return text[i]
    return None

def get_definite_marker(lam_has_shadda, lam_vowel, solar_letters, alif_lam, next_char):
    """
    Build the 49‑E.Z. marker for the definite article based on:
        - whether the lam itself has a shadda (assimilation)
        - the vowel on the lam (if any)
        - the following consonant (solar or lunar)
    Returns a string like "L.²-", "L.", "(L.)¨~", etc.
    """
    if lam_has_shadda:
        # Assimilated lam: use L.² plus any vowel
        marker = "L."
        marker += "²"
        if lam_vowel:
            marker += lam_vowel
        return marker
    else:
        # Non‑assimilated: solar or lunar from rules
        is_solar = next_char in solar_letters if next_char else False
        if is_solar:
            return alif_lam.get("solar", "(L.)¨~")
        else:
            return alif_lam.get("lunar", "L.")


# ======================================================================
# MAIN TRANSLITERATOR CLASS
# ======================================================================

class FortyNineEZ:
    """
    The core transliterator engine.

    Attributes:
        mapping (dict): token → {49ez, word, id} from quran_rules.json
        rules (dict):   rule definitions (prepositions, solar letters, etc.)
        tokens (list):  all keys from mapping sorted by length (longest first)
        verses (dict):  (surah, verse) → list of word dictionaries
        total_verses (int): number of verses loaded
        debug (bool):   enable verbose output
    """

    def __init__(self, debug=False):
        self.debug = debug
        self.load_rules()
        self.load_verses()

    # ------------------------------------------------------------------
    # Data loading
    # ------------------------------------------------------------------

    def load_rules(self):
        """Load the token mapping and rule definitions from quran_rules.json."""
        with open(RULES_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
        self.mapping = data.get("mapping", {})
        self.rules = data.get("rules", {})
        self.tokens = sorted(self.mapping.keys(), key=len, reverse=True)
        # Ensure the madda/alif token is present (used in some mapping)
        if 'ا۟' not in self.tokens:
            self.tokens.append('ا۟')
            self.tokens = sorted(self.tokens, key=len, reverse=True)

    def load_verses(self):
        """
        Parse quran_morphology_49ez.txt (tab‑separated) and reconstruct
        each word from its segments. Store as:
            verses[(surah, verse)] = [
                {"word": full_word, "pos": pos, "attrs": attrs,
                 "base_id": base_id, "segments": [...]},
                ...
            ]
        """
        segments_by_base = defaultdict(list)
        with open(MORPHOLOGY_FILE, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                parts = line.split('\t')
                if len(parts) < 3:
                    continue
                seg_id = parts[0]       # e.g., "1:1:1:0"
                surface = parts[1]      # the actual Arabic string
                pos = parts[2]          # part‑of‑speech (e.g., N, P, V)
                attrs = parts[3] if len(parts) > 3 else ''  # morphological attributes

                # Build the base identifier (surah:verse:word)
                seg_parts = seg_id.split(':')
                if len(seg_parts) >= 4:
                    base_id = ':'.join(seg_parts[:3])
                    seg_idx = int(seg_parts[3])
                    segments_by_base[base_id].append((seg_idx, surface, pos, attrs))

        # Reconstruct full words
        verses = defaultdict(list)
        for base_id, seg_list in segments_by_base.items():
            seg_list.sort(key=lambda x: x[0])   # ensure correct order
            full_word = ''.join(seg[1] for seg in seg_list)
            pos_first = seg_list[0][2] if seg_list else ''
            attrs_first = seg_list[0][3] if seg_list else ''
            parts = base_id.split(':')
            if len(parts) >= 3:
                surah = int(parts[0])
                verse = int(parts[1])
                word_idx = int(parts[2])
                verses[(surah, verse)].append({
                    "word": full_word,
                    "pos": pos_first,
                    "attrs": attrs_first,
                    "base_id": base_id,
                    "segments": [{"surface": s[1], "pos": s[2], "attrs": s[3]} for s in seg_list]
                })

        # Sort words within each verse by their original word index
        for key in verses:
            verses[key].sort(key=lambda x: int(x["base_id"].split(':')[2]))

        self.verses = verses
        self.total_verses = len(verses)

    # ------------------------------------------------------------------
    # Core mapping functions
    # ------------------------------------------------------------------

    def _apply_mapping_with_ids(self, text, debug=False):
        """
        Translate an Arabic string (without morphological processing) using
        the token mapping. Returns (transliterated_string, list_of_tokens_used).
        This is the fundamental token‑by‑token replacement.
        Also handles the tanween‑alif drop rule (skip alif after tanween).
        """
        text = text.replace('ٔ', 'ء')   # unify hamza
        if not text:
            return "", []
        result = []
        tokens_used = []
        i = 0
        last_was_tanween = False

        while i < len(text):
            matched = False
            for token in self.tokens:
                if text.startswith(token, i):
                    entry = self.mapping.get(token)
                    if entry is None:
                        val = token
                        token_id = "UNKNOWN"
                    else:
                        val = entry.get("49ez", token)
                        token_id = entry.get("id", "UNKNOWN")

                    is_tanween = val.endswith(('-=', '°=', '_='))

                    # Tanween‑alif drop: if previous token was tanween and current is alif/maqṣūrah, skip it.
                    if last_was_tanween and token in ['ا', 'ى', 'ٰ']:
                        if debug:
                            print(f"        ⏭️  Skipping alif after tanween: {token}")
                        i += len(token)
                        matched = True
                        last_was_tanween = False
                        continue

                    result.append(val)
                    tokens_used.append((token, val, token_id))
                    i += len(token)
                    matched = True
                    last_was_tanween = is_tanween
                    break

            if not matched:
                # No token matched: keep the character as‑is (should be rare)
                char = text[i]
                result.append(char)
                tokens_used.append((char, char, "NONE"))
                last_was_tanween = False
                i += 1

        final = ''.join(result)
        final = final.replace('¯¯', '¯')   # clean double separator
        return final, tokens_used

    def _apply_mapping(self, text):
        """Simplified wrapper that returns only the transliterated string."""
        result, _ = self._apply_mapping_with_ids(text)
        return result

    # ------------------------------------------------------------------
    # Helper methods for contextual rules
    # ------------------------------------------------------------------

    def _transliterate_prefix(self, prep):
        """
        Translate a prepositional prefix (بِ, لِ, كَ, فَ) with its 49‑E.Z.
        representation, adding the separator '¯'.
        """
        prep_map = {'بِ': 'b_¯', 'لِ': 'l_¯', 'كَ': 'k-¯', 'فَ': 'f-¯'}
        return prep_map.get(prep, self._apply_mapping(prep))

    def _get_final_vowel(self, word):
        """Extract the final vowel (or tanween) from the Arabic word as a 49‑E.Z. marker."""
        if not word:
            return ""
        if word.endswith('ِ'):
            return '_'
        elif word.endswith('ُ'):
            return '°'
        elif word.endswith('َ'):
            return '-'
        elif word.endswith('ً'):
            return '-='
        elif word.endswith('ٌ'):
            return '°='
        elif word.endswith('ٍ'):
            return '_='
        return ''

    # ------------------------------------------------------------------
    # Morphological cleanup rules
    # ------------------------------------------------------------------

    def _normalize_for_plural_suffix(self, word):
        """
        Normalize a word (remove diacritics and unify alif forms)
        to check for the plural suffix 'وا'.
        """
        w = DIACRITIC_PATTERN.sub('', word)
        w = w.replace('۟', '').replace('ٰ', '')
        w = w.replace('ؤ', 'و').replace('ئ', 'ي')
        w = w.replace('ٱ', 'ا').replace('آ', 'ا').replace('أ', 'ا').replace('إ', 'ا')
        return w

    def _strip_plural_suffix(self, text, word, debug=False):
        """
        Remove the final alif from certain plural patterns (e.g., 'وا' suffix)
        while preserving tanween endings.
        """
        # If the transliteration already ends with a tanween marker, do nothing.
        if text.endswith(('-=', '°=', '_=')):
            if debug:
                print(f"   → _strip_plural_suffix: skipping (text ends with tanween)")
            return text
        # If the Arabic word ends with tanween, also skip.
        if word.endswith(('ً', 'ٌ', 'ٍ')):
            if debug:
                print(f"   → _strip_plural_suffix: skipping (word ends with tanween)")
            return text

        word_norm = self._normalize_for_plural_suffix(word)
        if debug:
            print(f"   → _strip_plural_suffix: word_norm='{word_norm}'")
        if not word_norm.endswith('وا'):
            if debug:
                print(f"   → Word does not end with 'وا', no change")
            return text

        # Remove the final dash (the alif) from the transliteration
        if text.endswith('---'):
            text = text[:-1]
            if debug:
                print(f"   → Stripped final alif dash (--- → --): '{text}'")
            return text

        # Find the last '°' (ḍamma) and 'w' to truncate appropriately
        last_degree = text.rfind('°')
        last_w = text.rfind('w')
        if last_degree != -1 and last_degree > last_w:
            text = text[:last_degree+1]
            if debug:
                print(f"   → Truncated after last '°': '{text}'")
        elif last_w != -1:
            text = text[:last_w+1]
            if debug:
                print(f"   → Truncated after last 'w': '{text}'")
        else:
            if debug:
                print(f"   → No wāw found, keeping as is")
        return text

    def _apply_long_vowel_rule(self, text, word, segments):
        """
        For words ending in 'ى' (alif maqṣūrah), decide whether to add a
        trailing vowel (dash or underscore) based on the preceding vowel
        and pronominal suffixes.
        """
        if not word or not text:
            return text
        if word[-1] != 'ى':
            return text

        # Check if the final 'ى' is a pronominal suffix (e.g., 1S)
        is_pronominal = False
        is_1s = False
        if segments:
            for seg in segments:
                attrs = seg.get('attrs', '')
                if 'PRON' in attrs and 'SUFF' in attrs:
                    is_pronominal = True
                    if '1S' in attrs:
                        is_1s = True
                    break

        if is_pronominal:
            if is_1s:
                if text.endswith('-'):
                    return text[:-1] + '_'
            return text

        # Look backward to find the vowel before the 'ى'
        prev_pos = len(word) - 2
        while prev_pos >= 0 and word[prev_pos] in SINGLE_DIACRITICS:
            prev_pos -= 1
        if prev_pos < 0:
            return text

        prev_vowel = ''
        for idx in range(prev_pos + 1, len(word)):
            if word[idx] in ['َ', 'ُ', 'ِ']:
                prev_vowel = word[idx]
                break

        if prev_vowel == 'َ':
            if text.endswith('--'):
                return text
            return text + '-'
        elif prev_vowel == 'ِ':
            if text.endswith('__'):
                return text
            return text + '_'
        return text

    # ------------------------------------------------------------------
    # Main transliteration function (the heart of the engine)
    # ------------------------------------------------------------------

    def transliterate_word(self, word, segments, pos, attrs, debug=False, prev_vowel=None, is_first_word=False):
        """
        Translate a single Quranic word into 49‑E.Z. using morphological context.

        Parameters:
            word (str): the fully diacritized Arabic word
            segments (list): list of segment dicts (surface, pos, attrs)
            pos (str): part‑of‑speech of the first segment
            attrs (str): attributes of the first segment
            debug (bool): print detailed debugging info
            prev_vowel (str or None): the vowel from the previous word (for tafkhim)
            is_first_word (bool): True if this is the first word of the verse

        Returns:
            str: transliteration of the word
        """
        if debug:
            print(f"\n🔍🔍🔍 DEBUG: Processing '{arabic_rtl(word)}' 🔍🔍🔍")
            print(f"   segments: {arabic_rtl(str(segments))}")
            print(f"   pos: {pos}")
            print(f"   attrs: {arabic_rtl(attrs)}")
            if prev_vowel:
                print(f"   prev_vowel: '{prev_vowel}'")

        # ---- 0. Basmala (hardcoded exception) ----
        # Use normalize_for_match() to ignore diacritics and alif variants
        if normalize_for_match(word) == "بسم":
            if debug:
                print(f"   → Basmala detected: {word} → b_¯(1)~sm_")
            return "b_¯(1)~sm_"

        # ------------------------------------------------------------------
        # 0. Muqatta'at (disjoint letters)
        # ------------------------------------------------------------------
        if segments:
            for seg in segments:
                if 'INL' in seg.get('attrs', ''):
                    muqattaat = self.rules.get("muqatta'at", {})
                    if word in muqattaat:
                        if debug:
                            print(f"   → Muqatta'at: '{arabic_rtl(word)}' → {muqattaat[word]}")
                        return muqattaat[word]
                    else:
                        if debug:
                            print(f"   → Muqatta'at not found for '{arabic_rtl(word)}', falling back")
                        break

        # ------------------------------------------------------------------
        # 1. Special words (hardcoded exceptions)
        # ------------------------------------------------------------------
        special_words = self.rules.get("special_words", {})
        word_norm = normalize_alif_for_lookup(word)
        for key, val in special_words.items():
            if normalize_alif_for_lookup(key) == word_norm:
                if debug:
                    print(f"   → Special word: {word} → {val}")
                return val

        # ------------------------------------------------------------------
        # 2. Allah catch‑all (for لِلَّهِ etc., with preposition)
        # ------------------------------------------------------------------
        if word.startswith("لِلَّ") and (word.endswith("هِ") or word.endswith("هُ") or word.endswith("هَ")):
            norm_word = "ٱللَّ" + word[-2:]
            for key, val in special_words.items():
                if normalize_alif_for_lookup(key) == normalize_alif_for_lookup(norm_word):
                    if debug:
                        print(f"   → Allah catch‑all (normalized): {word} → {val}")
                    return "l_¯" + val
            vowel = self._get_final_vowel(word)
            base = "L.²-h"
            result = "l_¯" + base + vowel if vowel else "l_¯" + base
            if debug:
                print(f"   → Allah catch‑all fallback: {result}")
            return result

        # ------------------------------------------------------------------
        # 3. Allah rule (tafkhim based on previous vowel)
        # ------------------------------------------------------------------
        word_norm_match = normalize_for_match(word)
        if "الله" in word_norm_match or "لله" in word_norm_match:
            allah_rule = self.rules.get("allah", {})
            vowel = self._get_final_vowel(word)

            # ---- New tafkhim logic ----
            if is_first_word:
                base = allah_rule.get("heavy", "L.^²-h")
                tafkhim_reason = "first word"
            elif prev_vowel in ['-', '°']:
                base = allah_rule.get("heavy", "L.^²-h")
                tafkhim_reason = f"prev vowel '{prev_vowel}'"
            else:
                base = allah_rule.get("light", "L.²-h")
                tafkhim_reason = f"prev vowel '{prev_vowel}' (light)"

            result = base + vowel if vowel else base
            if debug:
                print(f"   → Allah rule: '{result}' (tafkhim={base == allah_rule.get('heavy', 'L.^²-h')}, reason: {tafkhim_reason})")
            return result

        # ------------------------------------------------------------------
        # 4. CONJUNCTION rule (وَ, فَ, etc.)
        # ------------------------------------------------------------------

        # Special case: 'أَو' as conjunction (wāw without vowel)
        if word.startswith('أَو') and segments and segments[0].get('pos') == 'P':
            if len(word) > 2:
                next_char = word[2]
                if next_char in ['َ', 'ُ', 'ِ']:
                    pass
                else:
                    if debug:
                        print(f"   → Special conjunction 'أَو' (wāw without vowel) → '1-w'")
                    return '1-w'
            else:
                if debug:
                    print(f"   → Special conjunction 'أَو' (no diacritic) → '1-w'")
                return '1-w'

        conj_prefixes = ['وَ', 'فَ', 'وَّ', 'فَّ']
        conj_found = None
        for pref in conj_prefixes:
            if word.startswith(pref):
                conj_found = pref
                break

        if conj_found and segments and segments[0].get('pos') == 'P':
            conj_surface = conj_found
            if 'و' in conj_surface:
                letter = 'w'
                has_shadda = 'ّ' in conj_surface
            elif 'ف' in conj_surface:
                letter = 'f'
                has_shadda = 'ّ' in conj_surface
            else:
                letter = '?'

            if has_shadda:
                prefix_translit = f'{letter}²-¯'
            else:
                prefix_translit = f'{letter}-¯'

            rest = word[len(conj_surface):]
            rest_stripped = strip_leading_diacritics(rest)

            if debug:
                print(f"   → CONJ detected: surface='{conj_surface}', rest='{rest}', stripped='{rest_stripped}'")
                print(f"   → prefix_translit = '{prefix_translit}'")

            # If the rest is an Allah form, handle it directly (heavy)
            if rest_stripped in ['ٱللَّهِ', 'ٱللَّهُ', 'ٱللَّهَ', 'لِلَّهِ', 'لِلَّهُ', 'لِلَّهَ']:
                vowel = self._get_final_vowel(rest_stripped)
                base = "L.^²-h"
                result = prefix_translit + base + vowel if vowel else prefix_translit + base
                if debug:
                    print(f"   → Allah form detected: {result} (tafkhim=True from conjunction)")
                return result

            # ---- Alif-Lam (with alif) ----
            if rest_stripped.startswith('ال') or rest_stripped.startswith('ٱl'):
                if debug:
                    print(f"   → ✅ Alif-Lam detected in rest_stripped")
                # Find the DET segment to extract lam diacritics
                det_segment = None
                for seg in segments[1:]:
                    if 'DET' in seg.get('attrs', ''):
                        det_segment = seg
                        break
                if det_segment:
                    surface = det_segment.get('surface', '')
                    lam_has_shadda, lam_vowel = get_lam_diacritics_from_surface(surface)
                    lam_pos = rest_stripped.find('ل')
                    next_char = get_next_consonant_after_lam(rest_stripped, lam_pos) if lam_pos != -1 else None
                    solar_letters = self.rules.get("solar_letters", [])
                    alif_lam = self.rules.get("alif_lam", {"solar": "(L.)¨~", "lunar": "L."})
                    marker = get_definite_marker(lam_has_shadda, lam_vowel, solar_letters, alif_lam, next_char)
                    if debug:
                        print(f"   → marker = '{marker}' (shadda={lam_has_shadda})")
                else:
                    marker = "L."

                lam_pos = rest_stripped.find('ل')
                if lam_pos != -1:
                    i = lam_pos + 1
                    while i < len(rest_stripped) and rest_stripped[i] in SINGLE_DIACRITICS:
                        i += 1
                    rest_after_lam = rest_stripped[i:]
                else:
                    rest_after_lam = rest_stripped[1:]

                if debug:
                    rest_translit, rest_tokens = self._apply_mapping_with_ids(rest_after_lam, debug=True)
                    print(f"   → Token breakdown for rest:")
                    for token, val, tid in rest_tokens:
                        print(f"        {arabic_rtl(token)} → {val} (ID: {tid})")
                else:
                    rest_translit = self._apply_mapping(rest_after_lam)
                result = prefix_translit + marker + rest_translit
                if debug:
                    print(f"   → FINAL CONJUNCTION+ALIF-LAM result: '{result}'")
                return result

            # ---- IDGHAM (hamzat al‑waṣl) ----
            if rest_stripped and rest_stripped[0] == 'ٱ':
                if debug:
                    print(f"   → Hamzat al-waṣl detected, eliding")
                rest_after_hamza = rest_stripped[1:]

                # Check for definite article using DET tag
                is_def_article = False
                det_segment = None
                for seg in segments[1:]:
                    if 'DET' in seg.get('attrs', ''):
                        is_def_article = True
                        det_segment = seg
                        if debug:
                            print(f"   → Definite article (DET) detected in remaining segments")
                        break

                if is_def_article and det_segment and rest_after_hamza.startswith('ل'):
                    surface = det_segment.get('surface', '')
                    lam_has_shadda, lam_vowel = get_lam_diacritics_from_surface(surface)
                    if debug:
                        print(f"   → Lam diacritics from surface '{surface}': shadda={lam_has_shadda}, vowel='{lam_vowel}'")
                    lam_pos = rest_after_hamza.find('ل')
                    next_char = get_next_consonant_after_lam(rest_after_hamza, lam_pos) if lam_pos != -1 else None
                    solar_letters = self.rules.get("solar_letters", [])
                    alif_lam = self.rules.get("alif_lam", {"solar": "(L.)¨~", "lunar": "L."})
                    marker = get_definite_marker(lam_has_shadda, lam_vowel, solar_letters, alif_lam, next_char)
                    if debug:
                        print(f"   → marker = '{marker}' (shadda={lam_has_shadda})")
                    lam_pos = rest_after_hamza.find('ل')
                    if lam_pos != -1:
                        i = lam_pos + 1
                        while i < len(rest_after_hamza) and rest_after_hamza[i] in SINGLE_DIACRITICS:
                            i += 1
                        rest_after_lam = rest_after_hamza[i:]
                    else:
                        rest_after_lam = rest_after_hamza[1:]
                    rest_translit = self._apply_mapping(rest_after_lam)
                    result = prefix_translit + marker + rest_translit
                    if debug:
                        print(f"   → CONJ + hamzat al-waṣl definite article: {result}")
                    return result
                else:
                    # Not a definite article: apply idgham marker
                    rest_translit = '(1)¨~' + self.transliterate_word(rest_after_hamza, [], '', '', debug, prev_vowel, is_first_word=False)
                    result = prefix_translit + rest_translit
                    if debug:
                        print(f"   → FINAL IDGHAM result: '{result}'")
                    return result

            # ---- Normal conjunction (no special rest) ----
            if debug:
                print(f"   → Normal conjunction, passing rest_stripped to transliterate_word")
            rest_segments = segments[1:] if segments else []
            rest_translit = self.transliterate_word(rest_stripped, rest_segments, '', '', debug, prev_vowel, is_first_word=False)
            result = prefix_translit + rest_translit
            if debug:
                print(f"   → FINAL CONJUNCTION result: '{result}'")
            return result

        # ------------------------------------------------------------------
        # 5. PRP (preposition) rule
        # ------------------------------------------------------------------
        if segments and segments[0].get('pos') == 'P':
            preps = self.rules.get("prepositions", [])
            first_surface = segments[0].get('surface', '')
            if first_surface in preps:
                prep = first_surface
                rest = word[len(prep):]
                prefix_translit = self._transliterate_prefix(prep)

                if debug:
                    print(f"   → PRP detected: prep='{prep}', rest='{rest}', prefix='{prefix_translit}'")

                rest_stripped = strip_leading_diacritics(rest)
                if debug and rest_stripped != rest:
                    print(f"   → stripped leading diacritics: '{rest}' → '{rest_stripped}'")

                # Check if rest is Allah – apply tafkhim based on preposition vowel
                rest_norm_match = normalize_for_match(rest_stripped)
                if "الله" in rest_norm_match or "لله" in rest_norm_match:
                    vowel = self._get_final_vowel(rest_stripped)
                    prep_vowel = None
                    if prefix_translit.endswith(('_', '-', '°')):
                        prep_vowel = prefix_translit[-1]
                    if prep_vowel in ['-', '°']:
                        base = "L.^²-h"
                    else:
                        base = "L.²-h"
                    result = prefix_translit + base + vowel if vowel else prefix_translit + base
                    if debug:
                        print(f"   → Preposition + Allah: {result} (tafkhim={prep_vowel in ['-', '°']})")
                    return result

                # Also catch if 'لله' or 'الله' appears deeper in rest
                if 'لله' in rest_norm_match or 'الله' in rest_norm_match:
                    if debug:
                        print(f"   → Detected Allah form in rest – passing to transliterate_word")
                    rest_segments = segments[1:] if segments else []
                    rest_translit = self.transliterate_word(rest_stripped, rest_segments, '', '', debug, prev_vowel, is_first_word=False)
                    result = prefix_translit + rest_translit
                    if debug:
                        print(f"   → Preposition + Allah: {result}")
                    return result

                # ---- Definite article with alif ----
                is_def_article = False
                det_segment = None
                if rest_stripped.startswith('ال') or rest_stripped.startswith('ٱl'):
                    for seg in segments[1:]:
                        attrs_seg = seg.get('attrs', '')
                        if 'DET' in attrs_seg or 'DEF' in attrs_seg or 'ART' in attrs_seg:
                            is_def_article = True
                            det_segment = seg
                            if debug:
                                print(f"   → Definite article with alif detected in segment attrs: {arabic_rtl(str(seg))}")
                            break

                if is_def_article and det_segment:
                    surface = det_segment.get('surface', '')
                    lam_has_shadda, lam_vowel = get_lam_diacritics_from_surface(surface)
                    lam_pos = rest_stripped.find('ل')
                    next_char = get_next_consonant_after_lam(rest_stripped, lam_pos) if lam_pos != -1 else None
                    solar_letters = self.rules.get("solar_letters", [])
                    alif_lam = self.rules.get("alif_lam", {"solar": "(L.)¨~", "lunar": "L."})
                    marker = get_definite_marker(lam_has_shadda, lam_vowel, solar_letters, alif_lam, next_char)
                    if debug:
                        print(f"   → marker = '{marker}' (shadda={lam_has_shadda})")
                    lam_pos = rest_stripped.find('ل')
                    if lam_pos != -1:
                        i = lam_pos + 1
                        while i < len(rest_stripped) and rest_stripped[i] in SINGLE_DIACRITICS:
                            i += 1
                        rest_after_lam = rest_stripped[i:]
                    else:
                        rest_after_lam = rest_stripped[1:]
                    rest_translit = self._apply_mapping(rest_after_lam)
                    if debug:
                        print(f"   → Preposition + Alif-Lam (with alif): {prefix_translit}{marker}{rest_translit}")
                    return prefix_translit + marker + rest_translit

                # ---- Definite article without alif (after preposition) ----
                is_def_article_no_alif = False
                if rest_stripped.startswith('ل'):
                    for seg in segments[1:]:
                        attrs_seg = seg.get('attrs', '')
                        if 'DET' in attrs_seg or 'DEF' in attrs_seg or 'ART' in attrs_seg:
                            is_def_article_no_alif = True
                            det_segment = seg
                            if debug:
                                print(f"   → Definite article without alif detected in segments: {arabic_rtl(str(seg))}")
                            break

                if is_def_article_no_alif and det_segment:
                    surface = det_segment.get('surface', '')
                    lam_has_shadda, lam_vowel = get_lam_diacritics_from_surface(surface)
                    lam_pos = rest_stripped.find('ل')
                    next_char = get_next_consonant_after_lam(rest_stripped, lam_pos) if lam_pos != -1 else None
                    solar_letters = self.rules.get("solar_letters", [])
                    alif_lam = self.rules.get("alif_lam", {"solar": "(L.)¨~", "lunar": "L."})
                    marker = get_definite_marker(lam_has_shadda, lam_vowel, solar_letters, alif_lam, next_char)
                    if debug:
                        print(f"   → marker = '{marker}' (shadda={lam_has_shadda})")
                    lam_pos = rest_stripped.find('ل')
                    if lam_pos != -1:
                        i = lam_pos + 1
                        while i < len(rest_stripped) and rest_stripped[i] in SINGLE_DIACRITICS:
                            i += 1
                        rest_after_lam = rest_stripped[i:]
                    else:
                        rest_after_lam = rest_stripped[1:]
                    rest_translit = self._apply_mapping(rest_after_lam)
                    if debug:
                        print(f"   → Preposition + definite article (no alif): {prefix_translit}{marker}{rest_translit}")
                    return prefix_translit + marker + rest_translit

                # ---- Normal preposition (no definite article) ----
                rest_segments = segments[1:] if segments else []
                rest_translit = self.transliterate_word(rest_stripped, rest_segments, '', '', debug, prev_vowel, is_first_word=False)
                if debug:
                    print(f"   → Normal preposition: {prefix_translit + rest_translit}")
                return prefix_translit + rest_translit

        # ------------------------------------------------------------------
        # 6. Alif-Lam rule (standalone definite article)
        # ------------------------------------------------------------------
        for pattern in self.rules.get("definite_article_patterns", []):
            if word.startswith(pattern):
                if debug:
                    print(f"   → Alif-Lam pattern matched: '{pattern}'")
                
                # Extract lam diacritics directly from the word (not from segments)
                lam_pos = len(pattern) - 1  # 'ٱل' → lam at index 1
                has_shadda = False
                vowel = ''
                i = lam_pos + 1
                while i < len(word) and word[i] in SINGLE_DIACRITICS:
                    if word[i] == 'ّ':
                        has_shadda = True
                    elif word[i] == 'َ':
                        vowel = '-'
                    elif word[i] == 'ُ':
                        vowel = '°'
                    elif word[i] == 'ِ':
                        vowel = '_'
                    i += 1
                rest = word[i:]  # the part after the lam's diacritics

                # Build the marker (solar/lunar, with shadda if present)
                next_char = rest[0] if rest and rest[0] not in SINGLE_DIACRITICS else None
                solar_letters = self.rules.get("solar_letters", [])
                alif_lam = self.rules.get("alif_lam", {"solar": "(L.)¨~", "lunar": "L."})
                marker = get_definite_marker(has_shadda, vowel, solar_letters, alif_lam, next_char)
                if debug:
                    print(f"   → marker = '{marker}' (shadda={has_shadda}, vowel='{vowel}')")

                # Transliiterate the rest
                if debug:
                    rest_translit, rest_tokens = self._apply_mapping_with_ids(rest, debug=True)
                    print(f"   → Token breakdown for rest:")
                    for token, val, tid in rest_tokens:
                        print(f"        {arabic_rtl(token)} → {val} (ID: {tid})")
                else:
                    rest_translit = self._apply_mapping(rest)

                # --- Morphology‑aware post‑processing for relative pronouns ---
                is_relative = False
                if segments:
                    for seg in segments:
                        if 'REL' in seg.get('attrs', ''):
                            is_relative = True
                            break

                if is_relative:
                    if debug:
                        print(f"   → REL detected – applying relative‑pronoun rules")
                    # For relative pronouns ending with ى, ensure final vowel is a single underscore
                    # (because the preceding consonant already has a kasra)
                    if rest.endswith('ى'):
                        if rest_translit.endswith('-'):
                            rest_translit = rest_translit[:-1] + '_'
                        elif rest_translit.endswith('--'):
                            rest_translit = rest_translit[:-2] + '_'
                        if debug:
                            print(f"   → Adjusted final vowel: '{rest_translit}'")

                result = marker + rest_translit
                if debug:
                    print(f"   → Alif-Lam result: '{result}'")
                return result

        # ------------------------------------------------------------------
        # 7. Normal mapping (fallback)
        # ------------------------------------------------------------------
        if debug:
            rest_translit, tokens_used = self._apply_mapping_with_ids(word, debug=True)
            print(f"   → Token breakdown:")
            for token, val, tid in tokens_used:
                print(f"        {arabic_rtl(token)} → {val} (ID: {tid})")
            result = rest_translit
        else:
            result = self._apply_mapping(word)
        if debug:
            print(f"   → Normal mapping: '{result}'")

        # ------------------------------------------------------------------
        # 8. Apply long vowel rule (for words ending in ى)
        # ------------------------------------------------------------------
        result = self._apply_long_vowel_rule(result, word, segments)

        # ------------------------------------------------------------------
        # 9. Strip trailing dash for 2MP/3MP pronominal suffix
        # ------------------------------------------------------------------
        if segments and len(segments) > 0:
            last_seg = segments[-1]
            surface = last_seg.get('surface', '')
            attrs = last_seg.get('attrs', '')
            pos = last_seg.get('pos', '')
            if pos == 'N' and ('PRON' in attrs or 'SUFF' in attrs) and ('2MP' in attrs or '3MP' in attrs):
                if surface in ['وا', 'وا۟', 'ۥٓا۟'] and result.endswith('-'):
                    result = result[:-1]
                    if debug:
                        print(f"   → Stripped trailing dash for {attrs} suffix: '{result}'")

        # ------------------------------------------------------------------
        # 10. Plural suffix cleanup (remove final alif for 'وا' patterns)
        # ------------------------------------------------------------------
        result = self._strip_plural_suffix(result, word, debug)

        return result

    # ------------------------------------------------------------------
    # Verse‑level processing
    # ------------------------------------------------------------------

    def transliterate_verse(self, words_data, debug_word=None):
        """
        Transliterate all words in a verse, preserving the previous vowel
        for tafkhim decisions.
        """
        result = []
        prev_vowel = None
        for i, w in enumerate(words_data):
            word = w["word"]
            segments = w["segments"]
            pos = w["pos"]
            attrs = w.get("attrs", "")
            debug = (word == debug_word) if debug_word else False
            translit = self.transliterate_word(word, segments, pos, attrs, debug=debug, prev_vowel=prev_vowel, is_first_word=(i == 0))
            result.append(translit)
            # Update prev_vowel with the last vowel of this word
            prev_vowel = get_last_vowel_from_translit(translit)
        full_verse = ' '.join(result)
        return clean_output(full_verse)

    # ------------------------------------------------------------------
    # Main processing loop
    # ------------------------------------------------------------------

    def process_quran(self, output_file):
        """
        Process all verses and write the output to a file in the format:
            surah:verse|transliteration
        """
        print(f"Processing {self.total_verses} verses...")
        with open(output_file, 'w', encoding='utf-8') as out:
            for (surah, verse), word_list in sorted(self.verses.items()):
                transliterated = self.transliterate_verse(word_list)
                out.write(f"{surah}:{verse}|{transliterated}\n")
        print(f"Done. Output saved to '{output_file}'.")


# ======================================================================
# SCRIPT ENTRY POINT
# ======================================================================

if __name__ == "__main__":
    # If a command‑line argument is given, use it as the output file name.
    output = OUTPUT_FILE
    if len(sys.argv) > 1:
        output = sys.argv[1]
    ez = FortyNineEZ()
    ez.process_quran(output)