const textCleaningService = require('../../src/services/textCleaning.service');

describe('TextCleaningService Unit Tests', () => {
  it('1. Should remove PDF syntax keywords, object references, and replacement characters', () => {
    const rawGarbage = `
      73 0 obj
      << /Type /Page /BitsPerComponent 8 /Length 277 >>
      stream
      277 556 0 222 556 556 556 556 556 556
      endstream
      endobj
      An algorithm is a step-by-step procedure for solving a problem or performing a computation.
      
    `;

    const cleaned = textCleaningService.cleanExtractedText(rawGarbage);
    expect(cleaned).not.toContain('73 0 obj');
    expect(cleaned).not.toContain('BitsPerComponent');
    expect(cleaned).not.toContain('endstream');
    expect(cleaned).toContain('An algorithm is a step-by-step procedure');
  });

  it('2. Should identify low-signal PDF artifact chunks vs meaningful text', () => {
    const pdfArtifactChunk = 'stream\n277 556 0 222 556 556 556 556 556 556\n/FontDescriptor 12 0 R\n<< /Type /Font >>';
    const cleanChunk = 'Binary search algorithm works by repeatedly dividing in half the portion of the list that could contain the item until you narrow down the possible locations to just one.';

    const artifactEval = textCleaningService.isMeaningfulText(pdfArtifactChunk);
    const cleanEval = textCleaningService.isMeaningfulText(cleanChunk);

    expect(artifactEval.meaningful).toBe(false);
    expect(cleanEval.meaningful).toBe(true);
  });

  it('3. Should detect and reject filename/metadata-based questions', () => {
    const badQuestion1 = 'What unit number is mentioned in the source filename Unit_1_Intro.pdf?';
    const badQuestion2 = 'What file format is used for the source material?';
    const goodQuestion = 'What is the worst-case time complexity of QuickSort?';

    expect(textCleaningService.isFilenameOrMetadataQuestion(badQuestion1, ['Unit_1_Intro.pdf']).rejected).toBe(true);
    expect(textCleaningService.isFilenameOrMetadataQuestion(badQuestion2, []).rejected).toBe(true);
    expect(textCleaningService.isFilenameOrMetadataQuestion(goodQuestion, ['Algorithms.pdf']).rejected).toBe(false);
  });

  it('4. Should sanitize source excerpts for safe frontend grounding display', () => {
    const excerpt = '73 0 obj << /Type /Page >> stream\nMerge sort operates in O(n log n) time complexity by dividing arrays recursively.';
    const sanitized = textCleaningService.sanitizeSourceSnippet(excerpt, 100);

    expect(sanitized).not.toContain('73 0 obj');
    expect(sanitized).toContain('Merge sort operates');
  });
});
