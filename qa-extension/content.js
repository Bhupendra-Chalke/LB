(() => {
  // This is an immediately-invoked function expression (IIFE) to avoid polluting the global scope.

  function generateReport() {
    let report = `QA Report for: ${window.location.href}\n`;
    report += "========================================\n\n";

    // --- SEO Checks ---
    report += "--- SEO Checks ---\n";
    report += checkTitle();
    report += checkMetaDescription();
    report += checkH1Tags();
    report += checkCanonicalUrl();
    report += "\n";

    // --- Accessibility Checks ---
    report += "--- Accessibility Checks ---\n";
    report += checkImageAltAttributes();
    report += checkHtmlLangAttribute();
    report += "\n";

    // --- Link Analysis ---
    report += "--- Link Analysis ---\n";
    report += listNewTabLinks();
    report += "\n";

    return report;
  }

  function checkTitle() {
    const title = document.title;
    if (!title) {
      return "- Title Tag: **FAIL** - No title tag found.\n";
    }
    const titleLength = title.length;
    if (titleLength >= 50 && titleLength <= 70) {
      return `- Title Tag: **PASS** - Title is descriptive and within the ideal length. (Length: ${titleLength})\n`;
    }
    return `- Title Tag: **WARN** - Title length is ${titleLength}. Recommended length is 50-70 characters. Title: '${title}'\n`;
  }

  function checkMetaDescription() {
    const metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc || !metaDesc.content) {
      return "- Meta Description: **FAIL** - Meta description not found.\n";
    }
    const descLength = metaDesc.content.length;
    if (descLength >= 150 && descLength <= 160) {
      return `- Meta Description: **PASS** - Meta description is within the ideal length. (Length: ${descLength})\n`;
    }
    return `- Meta Description: **WARN** - Meta description length is ${descLength}. Recommended length is 150-160 characters.\n`;
  }

  function checkH1Tags() {
    const h1Tags = document.querySelectorAll('h1');
    if (h1Tags.length === 1) {
      return `- H1 Tag: **PASS** - Exactly one H1 tag found: '${h1Tags[0].innerText.trim()}'\n`;
    }
    return `- H1 Tag: **FAIL** - Found ${h1Tags.length} H1 tags. There should be exactly one.\n`;
  }

  function checkCanonicalUrl() {
    const canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink && canonicalLink.href) {
      if (canonicalLink.href === window.location.href) {
        return `- Canonical URL: **PASS** - Canonical URL found and matches page URL: ${canonicalLink.href}\n`;
      }
      return `- Canonical URL: **WARN** - Canonical URL found but does not match page URL. Page: ${window.location.href}, Canonical: ${canonicalLink.href}\n`;
    }
    return "- Canonical URL: **WARN** - No canonical URL specified.\n";
  }

  function checkImageAltAttributes() {
    const images = document.querySelectorAll('img');
    if (images.length === 0) {
      return "- Image Alt Attributes: **INFO** - No images found on the page.\n";
    }
    const missingAlt = Array.from(images).filter(img => !img.alt || !img.alt.trim());
    if (missingAlt.length === 0) {
      return `- Image Alt Attributes: **PASS** - All ${images.length} images have alt attributes.\n`;
    }
    return `- Image Alt Attributes: **FAIL** - ${missingAlt.length} of ${images.length} images are missing alt attributes.\n`;
  }

  function checkHtmlLangAttribute() {
    const lang = document.documentElement.lang;
    if (lang) {
      return `- HTML Lang Attribute: **PASS** - Language is specified: '${lang}'\n`;
    }
    return "- HTML Lang Attribute: **FAIL** - The 'lang' attribute is missing from the <html> tag.\n";
  }

  function listNewTabLinks() {
    const newTabLinks = document.querySelectorAll('a[target="_blank"]');
    let report = "Links that open in a new tab:\n";
    if (newTabLinks.length === 0) {
      report += "- None found.\n";
      return report;
    }
    newTabLinks.forEach(link => {
      report += `- ${link.href}\n`;
    });
    return report;
  }

  // The value returned from an executeScript call is the last evaluated expression in the script.
  // So, we call our main function here to return the report.
  return generateReport();
})();