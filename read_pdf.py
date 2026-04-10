import fitz
import sys

def main():
    doc = fitz.open(r'C:\Users\nihar\OneDrive\Desktop\School POC\WinSpeak_School_POC_changes.pdf')
    text = []
    for i, page in enumerate(doc):
        text.append(f"\n--- PAGE {i} ---\n")
        text.append(page.get_text())
    
    with open('pdf_output.txt', 'w', encoding='utf-8') as f:
        f.write(''.join(text))

if __name__ == '__main__':
    main()
