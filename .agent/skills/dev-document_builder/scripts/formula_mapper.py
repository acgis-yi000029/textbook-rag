"""
Mathematical Formula Mapper - 数学公式映射器

Maps garbled characters from PDF to proper LaTeX/Unicode math symbols
"""

import re
from typing import Dict, Tuple

# Garbled character to LaTeX mapping
GARBLED_TO_LATEX: Dict[str, str] = {
    # Variables (italic)
    '𝑥': 'x',
    '𝑦': 'y', 
    '𝑧': 'z',
    '𝑤': 'w',
    '𝑏': 'b',
    '𝑐': 'c',
    '𝑑': 'd',
    '𝑎': 'a',
    '𝑛': 'n',
    '𝑚': 'm',
    '𝑝': 'p',
    '𝑞': 'q',
    '𝑟': 'r',
    '𝑠': 's',
    '𝑡': 't',
    '𝑢': 'u',
    '𝑣': 'v',
    '𝑖': 'i',
    '𝑗': 'j',
    '𝑘': 'k',
    '𝑙': 'l',
    '𝑔': 'g',
    'ℎ': 'h',
    'ȉ': 'i',
    
    # Bold variables
    '𝒙': '**x**',
    '𝒚': '**y**',
    '𝒛': '**z**',
    '𝒘': '**w**',
    '𝒃': '**b**',
    '𝒄': '**c**',
    '𝒅': '**d**',
    '𝒂': '**a**',
    '𝒏': '**n**',
    '𝒎': '**m**',
    '𝒑': '**p**',
    '𝒒': '**q**',
    '𝒓': '**r**',
    '𝒔': '**s**',
    '𝒕': '**t**',
    '𝒖': '**u**',
    '𝒗': '**v**',
}

# Common math patterns that can be recognized
MATH_PATTERNS = [
    # Simple equations: x = y, a + b = c
    (r'^([a-z𝑥𝑦𝑧𝑤𝑏𝑐𝑑𝑎𝒙𝒚𝒛𝒘𝒃𝒄𝒅𝒂]+)\s*=\s*([a-z𝑥𝑦𝑧𝑤𝑏𝑐𝑑𝑎𝒙𝒚𝒛𝒘𝒃𝒄𝒅𝒂\d\+\-\*/\s]+)$', 'equation'),
    
    # Inequalities: x > 0, y ≥ 1
    (r'^([a-z𝑥𝑦𝑧𝑤𝑏𝑐𝑑𝑎𝒙𝒚𝒛𝒘𝒃𝒄𝒅𝒂]+)\s*([><≥≤])\s*([\d\-]+)$', 'inequality'),
    
    # Function notation: f(x), g(x, y)
    (r'^([a-z])\(([a-z𝑥𝑦𝑧𝑤𝒙𝒚𝒛𝒘,\s]+)\)$', 'function'),
    
    # Subscripts: x_i, w_0
    (r'^([a-z𝑥𝑦𝑧𝑤𝑏𝑐𝑑𝑎𝒙𝒚𝒛𝒘𝒃𝒄𝒅𝒂]+)_([a-z\d]+)$', 'subscript'),
    
    # Superscripts: x^2, a^n
    (r'^([a-z𝑥𝑦𝑧𝑤𝑏𝑐𝑑𝑎𝒙𝒚𝒛𝒘𝒃𝒄𝒅𝒂]+)\^([\d]+)$', 'superscript'),
]


class FormulaMapper:
    """Maps garbled formulas to readable math notation"""
    
    def __init__(self):
        self.garbled_chars = set(GARBLED_TO_LATEX.keys())
    
    def has_garbled_chars(self, text: str) -> bool:
        """Check if text contains garbled characters"""
        return any(char in text for char in self.garbled_chars)
    
    def try_map_formula(self, text: str) -> Tuple[bool, str]:
        """Try to map garbled text to readable formula
        
        Returns:
            (success, mapped_text) - success=True if mapping worked
        """
        if not self.has_garbled_chars(text):
            return (False, text)
        
        # Try to map garbled characters
        mapped = text
        for garbled, latex in GARBLED_TO_LATEX.items():
            mapped = mapped.replace(garbled, latex)
        
        # Check if result looks like a valid formula
        if self._is_valid_formula(mapped):
            return (True, mapped)
        
        # If mapping didn't produce valid formula, return failure
        return (False, text)
    
    def _is_valid_formula(self, text: str) -> bool:
        """Check if mapped text looks like a valid formula"""
        
        # Check for remaining unmapped special characters (garbage)
        # If there are still weird characters, it's not a valid mapping
        garbage_chars = re.findall(r'[�•◦▪▫]', text)
        if len(garbage_chars) > 0:
            return False
        
        # Check for excessive asterisks (from bold mapping gone wrong)
        if text.count('*') > 6:
            return False
        
        # Check against known patterns
        for pattern, _ in MATH_PATTERNS:
            if re.match(pattern, text.strip()):
                return True
        
        # Check if it has reasonable math structure
        # (variables, operators, numbers, but not too much random text)
        has_math_ops = any(op in text for op in ['=', '+', '-', '*', '/', '^', '_', '>', '<', '≥', '≤'])
        has_vars = any(c.isalpha() for c in text)
        word_count = len(re.findall(r'\b[a-zA-Z]{4,}\b', text))  # Long words
        
        # Must be short and clean
        if len(text) > 50:
            return False
        
        # Valid if has math operators and variables, but not too many long words
        return has_math_ops and has_vars and word_count < 2
    
    def format_formula(self, text: str) -> str:
        """Format a formula for markdown display"""
        success, mapped = self.try_map_formula(text)
        
        if success:
            # Wrap in inline code or math notation
            return f"`{mapped}`"
        else:
            # Use placeholder
            return "*[Mathematical formula - see image above]*"


# Example usage
if __name__ == "__main__":
    mapper = FormulaMapper()
    
    test_cases = [
        "𝑥 = 5",
        "𝒘 · 𝒙 + 𝑏 = 0",
        "𝑦 > 0",
        "f(𝑥)",
        "𝑥_𝑖",
        "completely garbled ℎȉ𝒙𝒚𝒛 nonsense text",
    ]
    
    print("Formula Mapping Tests:\n")
    for test in test_cases:
        success, result = mapper.try_map_formula(test)
        status = "✓" if success else "✗"
        print(f"{status} '{test}' -> '{result}'")
