#!/usr/bin/env node
/**
 * Visual QA Grading System for Sundown Dashboard
 * Takes screenshots, measures quantitative metrics, outputs graded report.
 *
 * Usage:
 *   node scripts/visual-grade.js [--reference path/to/reference.png]
 *
 * Requires: pixelmatch, pngjs, playwright
 */

const { chromium } = require('playwright');
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.TEST_URL || 'http://localhost:5001';
const AUTH_STATE = path.resolve(__dirname, '../playwright/.auth/user.json');
const OUTPUT_DIR = path.resolve(__dirname, '../screenshots/visual-qa');
const REFERENCE_ARG = process.argv.find((a) => a.startsWith('--reference='));
const REFERENCE_PATH = REFERENCE_ARG ? REFERENCE_ARG.split('=')[1] : null;

// Sundown CSS tokens — the canonical values
const SD_TOKENS = {
  '--sd-shell-bg': 'rgba(45, 22, 28, 0.75)',
  '--sd-shell-pad': '6px',
  '--sd-face-bg': 'rgba(85, 48, 52, 0.50)',
  '--sd-tray-bg': 'rgba(18, 10, 14, 0.5)',
  '--sd-text-primary': '#F0DEC7',
  '--sd-text-secondary': '#D9B79A',
  '--sd-text-muted': '#A9826A',
  '--sd-text-accent': '#E1A45C',
  '--sd-goal-shell': 'rgba(52, 28, 32, 0.6)',
  '--sd-goal-face': 'rgba(85, 48, 50, 0.4)',
};

// WCAG contrast helpers
function hexToRgb(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
  };
}

function relativeLuminance({ r, g, b }) {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(c1, c2) {
  const l1 = relativeLuminance(c1);
  const l2 = relativeLuminance(c2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function parseColor(colorStr) {
  if (!colorStr) return null;
  // Handle rgb(r, g, b) and rgba(r, g, b, a)
  const rgbMatch = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    return { r: parseInt(rgbMatch[1]), g: parseInt(rgbMatch[2]), b: parseInt(rgbMatch[3]) };
  }
  // Handle hex
  if (colorStr.startsWith('#')) return hexToRgb(colorStr);
  // Named colors — approximate common ones
  const named = { white: { r: 255, g: 255, b: 255 }, black: { r: 0, g: 0, b: 0 } };
  return named[colorStr.toLowerCase()] || null;
}

async function run() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });

  // Desktop viewport
  const desktopContext = await browser.newContext({
    storageState: AUTH_STATE,
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const desktopPage = await desktopContext.newPage();

  // Mobile viewport
  const mobileContext = await browser.newContext({
    storageState: AUTH_STATE,
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 2,
  });
  const mobilePage = await mobileContext.newPage();

  console.log('Navigating to Sundown dashboard...');
  await desktopPage.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 60000 });
  await mobilePage.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 60000 });

  // Wait for content to render
  await desktopPage.waitForTimeout(2000);
  await mobilePage.waitForTimeout(2000);

  // Take screenshots
  const desktopScreenshot = path.join(OUTPUT_DIR, 'sundown-desktop.png');
  const mobileScreenshot = path.join(OUTPUT_DIR, 'sundown-mobile.png');

  await desktopPage.screenshot({ path: desktopScreenshot, fullPage: true });
  await mobilePage.screenshot({ path: mobileScreenshot, fullPage: true });
  console.log(`Screenshots saved to ${OUTPUT_DIR}/`);

  // ═══════════════════════════════════════════════
  // 1. REFERENCE MATCH (pixelmatch)
  // ═══════════════════════════════════════════════
  let referenceScore = null;
  let referenceFix = 'No reference image provided — use --reference=path/to/reference.png';

  if (REFERENCE_PATH && fs.existsSync(REFERENCE_PATH)) {
    const refImg = PNG.sync.read(fs.readFileSync(REFERENCE_PATH));
    const testImg = PNG.sync.read(fs.readFileSync(desktopScreenshot));

    // Resize to match if needed
    const width = Math.min(refImg.width, testImg.width);
    const height = Math.min(refImg.height, testImg.height);

    const diff = new PNG({ width, height });
    const numDiff = pixelmatch(refImg.data, testImg.data, diff.data, width, height, {
      threshold: 0.1,
    });

    const totalPixels = width * height;
    const matchPct = ((1 - numDiff / totalPixels) * 100).toFixed(1);
    referenceScore = parseFloat(matchPct);

    // Save diff image
    const diffPath = path.join(OUTPUT_DIR, 'diff-desktop.png');
    fs.writeFileSync(diffPath, PNG.sync.write(diff));
    referenceFix = `${numDiff} pixels differ (${(100 - referenceScore).toFixed(1)}%) — see diff at ${diffPath}`;
  }

  // ═══════════════════════════════════════════════
  // 2. CONTRAST (WCAG AA)
  // ═══════════════════════════════════════════════
  console.log('Checking WCAG contrast ratios...');
  const contrastResults = await desktopPage.evaluate(() => {
    const results = [];
    const textElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, a, button, label, td, th, li, div');
    const seen = new Set();

    for (const el of textElements) {
      const text = el.textContent?.trim();
      if (!text || text.length > 100 || seen.has(text)) continue;
      seen.add(text);

      const style = window.getComputedStyle(el);
      const color = style.color;
      const bgColor = style.backgroundColor;
      const fontSize = parseFloat(style.fontSize);
      const fontWeight = parseInt(style.fontWeight) || 400;
      const tagName = el.tagName.toLowerCase();

      // Skip invisible
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;

      results.push({
        text: text.slice(0, 50),
        tag: tagName,
        color,
        bgColor,
        fontSize,
        fontWeight,
      });
    }
    return results.slice(0, 60); // cap at 60 elements
  });

  let contrastPasses = 0;
  let contrastTotal = 0;
  const contrastFails = [];

  for (const el of contrastResults) {
    const fg = parseColor(el.color);
    const bg = parseColor(el.bgColor);
    if (!fg || !bg) continue;

    contrastTotal++;
    const ratio = contrastRatio(fg, bg);

    // Large text: >= 18px or >= 14px bold
    const isLarge = el.fontSize >= 18 || (el.fontSize >= 14 && el.fontWeight >= 700);
    const required = isLarge ? 3.0 : 4.5;

    if (ratio >= required) {
      contrastPasses++;
    } else {
      contrastFails.push({
        text: el.text,
        tag: el.tag,
        ratio: ratio.toFixed(2),
        required,
        color: el.color,
        bgColor: el.bgColor,
      });
    }
  }

  const contrastScore = contrastTotal > 0 ? ((contrastPasses / contrastTotal) * 100).toFixed(1) : 'N/A';

  // ═══════════════════════════════════════════════
  // 3. SPACING CONSISTENCY
  // ═══════════════════════════════════════════════
  console.log('Measuring spacing consistency...');
  const spacingData = await desktopPage.evaluate(() => {
    const sections = document.querySelectorAll('[class*="sd-"], [class*="sundown"]');
    const gaps = [];

    for (const section of sections) {
      const children = Array.from(section.children);
      for (let i = 1; i < children.length; i++) {
        const prevRect = children[i - 1].getBoundingClientRect();
        const currRect = children[i].getBoundingClientRect();
        const gap = currRect.top - prevRect.bottom;
        if (gap > 0 && gap < 200) gaps.push(Math.round(gap));
      }
    }
    return gaps;
  });

  let spacingStdDev = 0;
  let spacingFix = 'No measurable gaps found';
  if (spacingData.length > 1) {
    const mean = spacingData.reduce((a, b) => a + b, 0) / spacingData.length;
    const variance = spacingData.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / spacingData.length;
    spacingStdDev = Math.sqrt(variance);

    // Find outliers
    const outliers = spacingData.filter((g) => Math.abs(g - mean) > spacingStdDev * 1.5);
    spacingFix = outliers.length > 0
      ? `${outliers.length} outlier gaps (mean=${mean.toFixed(0)}px): ${outliers.join(', ')}px`
      : 'All gaps within 1.5σ of mean';
  }

  // ═══════════════════════════════════════════════
  // 3B. ALIGNMENT (measures actual element positions)
  // ═══════════════════════════════════════════════
  console.log('Checking element alignment...');
  const alignmentData = await desktopPage.evaluate(() => {
    const issues = [];

    // Find all CSS grid and flexbox containers
    const allEls = document.querySelectorAll('*');
    for (const container of allEls) {
      const style = window.getComputedStyle(container);
      const isGrid = style.display === 'grid' || style.display === 'inline-grid';
      const isFlex = (style.display === 'flex' || style.display === 'inline-flex') && style.flexDirection === 'row';

      if (!isGrid && !isFlex) continue;

      const children = Array.from(container.children).filter(c => {
        const cs = window.getComputedStyle(c);
        return cs.display !== 'none' && cs.position !== 'absolute' && cs.position !== 'fixed';
      });

      if (children.length < 2) continue;

      const rects = children.map(c => {
        const r = c.getBoundingClientRect();
        return {
          top: Math.round(r.top),
          bottom: Math.round(r.bottom),
          left: Math.round(r.left),
          right: Math.round(r.right),
          height: Math.round(r.height),
          width: Math.round(r.width),
          text: (c.textContent || '').trim().slice(0, 30),
          tag: c.tagName.toLowerCase(),
          className: (c.className || '').toString().slice(0, 40),
        };
      });

      // Group children into rows (same approximate top position, within 5px)
      const rows = [];
      const used = new Set();
      for (let i = 0; i < rects.length; i++) {
        if (used.has(i)) continue;
        const row = [rects[i]];
        used.add(i);
        for (let j = i + 1; j < rects.length; j++) {
          if (used.has(j)) continue;
          if (Math.abs(rects[j].top - rects[i].top) < 20) {
            row.push(rects[j]);
            used.add(j);
          }
        }
        if (row.length > 1) rows.push(row);
      }

      // Check each row for height misalignment
      for (const row of rows) {
        const heights = row.map(r => r.height);
        const maxH = Math.max(...heights);
        const minH = Math.min(...heights);
        const heightDiff = maxH - minH;

        if (heightDiff > 8) {
          const containerClass = (container.className || '').toString().slice(0, 40);
          issues.push({
            type: 'height_mismatch',
            container: containerClass || container.tagName.toLowerCase(),
            items: row.map(r => ({ text: r.text, height: r.height, tag: r.tag })),
            maxHeight: maxH,
            minHeight: minH,
            diff: heightDiff,
          });
        }

        // Check top alignment
        const tops = row.map(r => r.top);
        const topSpread = Math.max(...tops) - Math.min(...tops);
        if (topSpread > 3) {
          const containerClass = (container.className || '').toString().slice(0, 40);
          issues.push({
            type: 'top_misaligned',
            container: containerClass || container.tagName.toLowerCase(),
            items: row.map(r => ({ text: r.text, top: r.top, tag: r.tag })),
            spread: topSpread,
          });
        }
      }
    }

    return issues;
  });

  const alignmentTotal = alignmentData.length;
  const alignmentScore = alignmentTotal === 0 ? '100.0'
    : Math.max(0, 100 - alignmentTotal * 12).toFixed(1);

  // ═══════════════════════════════════════════════
  // 4. TOUCH TARGETS
  // ═══════════════════════════════════════════════
  console.log('Checking touch target sizes...');
  const touchResults = await desktopPage.evaluate(() => {
    const interactives = document.querySelectorAll('a, button, input, select, textarea, [role="button"], [role="tab"], [role="checkbox"]');
    const results = [];

    for (const el of interactives) {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      const text = el.textContent?.trim().slice(0, 30) || el.getAttribute('aria-label') || el.tagName;
      results.push({
        text,
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        minDim: Math.min(Math.round(rect.width), Math.round(rect.height)),
      });
    }
    return results;
  });

  const touchTotal = touchResults.length;
  const touchPasses = touchResults.filter((t) => t.minDim >= 44).length;
  const touchFails = touchResults.filter((t) => t.minDim < 44);
  const touchScore = touchTotal > 0 ? ((touchPasses / touchTotal) * 100).toFixed(1) : 'N/A';

  // ═══════════════════════════════════════════════
  // 5. TOKEN COMPLIANCE
  // ═══════════════════════════════════════════════
  console.log('Scanning for hardcoded colors...');
  const sundownDir = path.resolve(__dirname, '../client/src/components/sundown');
  const sundownCss = path.resolve(__dirname, '../client/src/sundown.css');
  const sundownFiles = fs.readdirSync(sundownDir).filter((f) => f.endsWith('.tsx'));

  const tokenViolations = [];
  const hardcodedPattern = /(?:rgba?\([^)]+\)|#[0-9a-fA-F]{3,8})\b/g;
  // Known OK values (inside className strings or Tailwind classes are fine, but inline style hardcodes are not)
  const okPatterns = [/\/\//, /\*/, /console\./, /var\(--sd-/]; // comments, console, token refs

  for (const file of sundownFiles) {
    const filePath = path.join(sundownDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Skip comments and lines that already use tokens
      if (okPatterns.some((p) => p.test(line))) continue;

      const matches = line.match(hardcodedPattern);
      if (matches) {
        for (const match of matches) {
          // Skip if inside a CSS variable reference or className
          if (line.includes('var(--sd-')) continue;
          // Skip if inside a Tailwind class (bg-[], text-[], etc.)
          if (/className.*\[/.test(line) && line.indexOf(match) > line.indexOf('className')) continue;

          tokenViolations.push({
            file: file,
            line: i + 1,
            value: match,
          });
        }
      }
    }
  }

  const totalStyleLines = sundownFiles.reduce((acc, f) => {
    const content = fs.readFileSync(path.join(sundownDir, f), 'utf-8');
    return acc + content.split('\n').filter((l) => /style|color|background|rgba|#[0-9a-f]/i.test(l)).length;
  }, 0);

  const tokenScore = totalStyleLines > 0
    ? (((totalStyleLines - tokenViolations.length) / totalStyleLines) * 100).toFixed(1)
    : '100.0';

  // ═══════════════════════════════════════════════
  // 6. RESPONSIVE (mobile overflow)
  // ═══════════════════════════════════════════════
  console.log('Checking responsive overflow...');
  const responsiveData = await mobilePage.evaluate(() => {
    const body = document.body;
    const docWidth = document.documentElement.clientWidth;
    const scrollWidth = document.documentElement.scrollWidth;
    const hasHorizontalOverflow = scrollWidth > docWidth;

    // Find overflowing elements
    const overflowing = [];
    const allEls = document.querySelectorAll('*');
    for (const el of allEls) {
      const rect = el.getBoundingClientRect();
      if (rect.right > docWidth + 2) { // 2px tolerance
        const id = el.id || el.className?.toString().slice(0, 30) || el.tagName;
        overflowing.push({
          element: id,
          right: Math.round(rect.right),
          overflow: Math.round(rect.right - docWidth),
        });
      }
    }

    return {
      viewport: docWidth,
      scrollWidth,
      hasHorizontalOverflow,
      overflowing: overflowing.slice(0, 10),
    };
  });

  const responsivePasses = responsiveData.hasHorizontalOverflow ? 0 : 1;
  const responsiveScore = responsiveData.hasHorizontalOverflow ? '0.0' : '100.0';

  // ═══════════════════════════════════════════════
  // 7. PERFORMANCE (image sizes, DOM count)
  // ═══════════════════════════════════════════════
  console.log('Checking performance metrics...');
  const perfData = await desktopPage.evaluate(() => {
    const images = Array.from(document.querySelectorAll('img'));
    const largeImages = images.filter((img) => {
      return img.naturalWidth > 2000 || img.naturalHeight > 2000;
    }).map((img) => ({
      src: img.src.split('/').pop(),
      width: img.naturalWidth,
      height: img.naturalHeight,
    }));

    const domCount = document.querySelectorAll('*').length;
    const entries = performance.getEntriesByType('navigation');
    const navTiming = entries[0];

    return {
      domCount,
      largeImages,
      loadTime: navTiming ? Math.round(navTiming.loadEventEnd - navTiming.startTime) : null,
    };
  });

  // DOM > 1500 is concerning, > 3000 is bad
  const domPenalty = perfData.domCount > 3000 ? 20 : perfData.domCount > 1500 ? 10 : 0;
  const imagePenalty = perfData.largeImages.length * 5;
  const perfScore = Math.max(0, 100 - domPenalty - imagePenalty).toFixed(1);

  // ═══════════════════════════════════════════════
  // 8. ACCESSIBILITY (aria, alt, roles)
  // ═══════════════════════════════════════════════
  console.log('Checking accessibility...');
  const a11yData = await desktopPage.evaluate(() => {
    const issues = [];

    // Images without alt
    const images = document.querySelectorAll('img');
    for (const img of images) {
      if (!img.alt && !img.getAttribute('aria-label') && !img.getAttribute('role')) {
        issues.push({ element: 'img', src: img.src?.split('/').pop(), issue: 'missing alt text' });
      }
    }

    // Buttons without labels
    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
      if (!btn.textContent?.trim() && !btn.getAttribute('aria-label') && !btn.getAttribute('title')) {
        issues.push({ element: 'button', issue: 'no accessible label' });
      }
    }

    // Inputs without labels
    const inputs = document.querySelectorAll('input, select, textarea');
    for (const input of inputs) {
      const id = input.id;
      const hasLabel = id && document.querySelector(`label[for="${id}"]`);
      const hasAria = input.getAttribute('aria-label') || input.getAttribute('aria-labelledby');
      if (!hasLabel && !hasAria && input.type !== 'hidden') {
        issues.push({ element: input.tagName.toLowerCase(), type: input.type, issue: 'no associated label' });
      }
    }

    // Check heading hierarchy
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let lastLevel = 0;
    for (const h of headings) {
      const level = parseInt(h.tagName[1]);
      if (level > lastLevel + 1 && lastLevel > 0) {
        issues.push({ element: h.tagName, text: h.textContent?.slice(0, 30), issue: `skipped from h${lastLevel} to h${level}` });
      }
      lastLevel = level;
    }

    // Check for missing lang attribute
    if (!document.documentElement.lang) {
      issues.push({ element: 'html', issue: 'missing lang attribute' });
    }

    return issues;
  });

  const a11yTotal = a11yData.length;
  // Score based on issues found (0 issues = 100%)
  const a11yBaseItems = 20; // assume ~20 checkable items
  const a11yScore = Math.max(0, ((a11yBaseItems - a11yTotal) / a11yBaseItems) * 100).toFixed(1);

  // ═══════════════════════════════════════════════
  // COMPUTE TOTAL SCORE
  // ═══════════════════════════════════════════════
  const dimensions = [
    { name: 'REFERENCE MATCH', score: referenceScore, target: 95, weight: 15 },
    { name: 'CONTRAST (WCAG AA)', score: parseFloat(contrastScore) || 0, target: 100, weight: 15 },
    { name: 'SPACING CONSISTENCY', score: null, target: null, weight: 5, raw: spacingStdDev },
    { name: 'ALIGNMENT', score: parseFloat(alignmentScore), target: 100, weight: 15 },
    { name: 'TOUCH TARGETS', score: parseFloat(touchScore) || 0, target: 100, weight: 5 },
    { name: 'TOKEN COMPLIANCE', score: parseFloat(tokenScore), target: 100, weight: 15 },
    { name: 'RESPONSIVE', score: parseFloat(responsiveScore), target: 100, weight: 15 },
    { name: 'PERFORMANCE', score: parseFloat(perfScore), target: 95, weight: 10 },
    { name: 'ACCESSIBILITY', score: parseFloat(a11yScore), target: 95, weight: 10 },
  ];

  // Convert spacing σ to a score: σ=0 → 100, σ=2 → 100, σ=5 → 70, σ=10 → 40, σ>15 → 0
  const spacingScore = spacingData.length > 1
    ? Math.max(0, Math.min(100, 100 - Math.max(0, spacingStdDev - 2) * 7.5)).toFixed(1)
    : 'N/A';
  dimensions[2].score = parseFloat(spacingScore) || 0;
  dimensions[2].target = 100;

  // Weighted total
  let totalWeighted = 0;
  let totalWeight = 0;
  for (const d of dimensions) {
    if (d.score !== null && !isNaN(d.score)) {
      totalWeighted += d.score * d.weight;
      totalWeight += d.weight;
    }
  }
  const totalScore = totalWeight > 0 ? (totalWeighted / totalWeight).toFixed(1) : 'N/A';
  const totalInt = Math.round(parseFloat(totalScore));

  // Letter grade
  const grade = totalInt >= 95 ? 'A+' : totalInt >= 90 ? 'A' : totalInt >= 85 ? 'A-'
    : totalInt >= 80 ? 'B+' : totalInt >= 75 ? 'B' : totalInt >= 70 ? 'B-'
    : totalInt >= 65 ? 'C+' : totalInt >= 60 ? 'C' : totalInt >= 55 ? 'C-'
    : totalInt >= 50 ? 'D' : 'F';

  // ═══════════════════════════════════════════════
  // OUTPUT REPORT
  // ═══════════════════════════════════════════════
  console.log('\n' + '═'.repeat(65));
  console.log(`VISUAL QA GRADE: ${grade} (${totalScore}/100) → TARGET: A+ (95+)`);
  console.log('═'.repeat(65));
  console.log('');
  console.log('DIMENSION                  SCORE     TARGET    GAP');
  console.log('─'.repeat(65));

  // Reference Match
  if (referenceScore !== null) {
    const gap = Math.max(0, 95 - referenceScore).toFixed(1);
    console.log(`REFERENCE MATCH            ${referenceScore}%     95%       ▼${gap}%`);
    console.log(`  ${referenceFix}`);
  } else {
    console.log(`REFERENCE MATCH            N/A       95%       —`);
    console.log(`  ${referenceFix}`);
  }

  // Contrast
  const contrastGap = Math.max(0, 100 - parseFloat(contrastScore)).toFixed(1);
  console.log(`CONTRAST (WCAG AA)         ${contrastScore}%    100%      ▼${contrastGap}%`);
  console.log(`  ${contrastTotal} elements checked, ${contrastFails.length} failures`);
  for (const fail of contrastFails.slice(0, 5)) {
    console.log(`  FAIL: <${fail.tag}> "${fail.text}" ratio=${fail.ratio} (need ${fail.required}:1)`);
    console.log(`        fg=${fail.color} bg=${fail.bgColor}`);
  }
  if (contrastFails.length > 5) console.log(`  ... and ${contrastFails.length - 5} more`);

  // Spacing
  const spacingGapVal = Math.max(0, spacingStdDev - 2).toFixed(1);
  console.log(`SPACING CONSISTENCY        σ=${spacingStdDev.toFixed(1)}px   σ<2px     ▼${spacingGapVal}px`);
  console.log(`  ${spacingFix}`);
  if (spacingData.length > 0) {
    console.log(`  Measured gaps: [${spacingData.slice(0, 15).join(', ')}${spacingData.length > 15 ? '...' : ''}]`);
  }

  // Alignment
  const alignGap = Math.max(0, 100 - parseFloat(alignmentScore)).toFixed(1);
  console.log(`ALIGNMENT                  ${alignmentScore}%    100%      ▼${alignGap}%`);
  console.log(`  ${alignmentTotal} alignment issues found`);
  for (const issue of alignmentData.slice(0, 8)) {
    if (issue.type === 'height_mismatch') {
      const items = issue.items.map(i => `${i.text || i.tag}(${i.height}px)`).join(' vs ');
      console.log(`  FAIL: Height mismatch in ${issue.container}: ${items} — diff=${issue.diff}px`);
    } else if (issue.type === 'top_misaligned') {
      const items = issue.items.map(i => `${i.text || i.tag}(top:${i.top})`).join(' vs ');
      console.log(`  FAIL: Top misaligned in ${issue.container}: ${items} — spread=${issue.spread}px`);
    }
  }
  if (alignmentData.length > 8) console.log(`  ... and ${alignmentData.length - 8} more`);

  // Touch Targets
  const touchGap = Math.max(0, 100 - parseFloat(touchScore)).toFixed(1);
  console.log(`TOUCH TARGETS              ${touchScore}%    100%      ▼${touchGap}%`);
  console.log(`  ${touchPasses}/${touchTotal} elements ≥ 44px`);
  for (const fail of touchFails.slice(0, 5)) {
    console.log(`  FAIL: "${fail.text}" ${fail.width}x${fail.height}px (min dim=${fail.minDim}px → need 44px)`);
  }
  if (touchFails.length > 5) console.log(`  ... and ${touchFails.length - 5} more`);

  // Token Compliance
  const tokenGap = Math.max(0, 100 - parseFloat(tokenScore)).toFixed(1);
  console.log(`TOKEN COMPLIANCE           ${tokenScore}%    100%      ▼${tokenGap}%`);
  console.log(`  ${tokenViolations.length} hardcoded color values in sundown components`);
  for (const v of tokenViolations.slice(0, 8)) {
    console.log(`  FAIL: ${v.file}:${v.line} → hardcoded ${v.value} → use var(--sd-*)`);
  }
  if (tokenViolations.length > 8) console.log(`  ... and ${tokenViolations.length - 8} more`);

  // Responsive
  const responsiveGap = Math.max(0, 100 - parseFloat(responsiveScore)).toFixed(1);
  console.log(`RESPONSIVE                 ${responsiveScore}%    100%      ▼${responsiveGap}%`);
  if (responsiveData.hasHorizontalOverflow) {
    console.log(`  FAIL: Mobile (${responsiveData.viewport}px) has horizontal overflow → scrollWidth=${responsiveData.scrollWidth}px`);
    for (const o of responsiveData.overflowing.slice(0, 5)) {
      console.log(`  FAIL: ${o.element} overflows by ${o.overflow}px`);
    }
  } else {
    console.log(`  No horizontal overflow at ${responsiveData.viewport}px`);
  }

  // Performance
  const perfGap = Math.max(0, 95 - parseFloat(perfScore)).toFixed(1);
  console.log(`PERFORMANCE                ${perfScore}%     95%       ▼${perfGap}%`);
  console.log(`  DOM nodes: ${perfData.domCount}${perfData.domCount > 1500 ? ' (high!)' : ''}`);
  if (perfData.loadTime) console.log(`  Load time: ${perfData.loadTime}ms`);
  for (const img of perfData.largeImages) {
    console.log(`  WARN: ${img.src} is ${img.width}x${img.height} — consider compressing`);
  }

  // Accessibility
  const a11yGap = Math.max(0, 95 - parseFloat(a11yScore)).toFixed(1);
  console.log(`ACCESSIBILITY              ${a11yScore}%     95%       ▼${a11yGap}%`);
  console.log(`  ${a11yTotal} issues found`);
  for (const issue of a11yData.slice(0, 5)) {
    const desc = issue.src ? `<${issue.element}> (${issue.src})` : `<${issue.element}>`;
    console.log(`  FAIL: ${desc} — ${issue.issue}`);
  }
  if (a11yData.length > 5) console.log(`  ... and ${a11yData.length - 5} more`);

  // Summary
  console.log('');
  console.log('─'.repeat(65));

  let totalChanges = contrastFails.length + touchFails.length + tokenViolations.length
    + a11yData.length + alignmentData.length + (responsiveData.hasHorizontalOverflow ? responsiveData.overflowing.length : 0);

  console.log(`TOTAL: ${grade} (${totalScore}/100) → CHANGES NEEDED: ${totalChanges} fixes`);
  console.log('');
  console.log(`Screenshots: ${OUTPUT_DIR}/`);
  console.log('═'.repeat(65));

  await browser.close();
}

run().catch((err) => {
  console.error('Visual QA failed:', err);
  process.exit(1);
});
