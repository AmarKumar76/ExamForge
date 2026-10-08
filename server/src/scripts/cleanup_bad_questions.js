const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const Question = require('../models/Question');
const textCleaningService = require('../services/textCleaning.service');

async function cleanupBadQuestions() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for bad question audit & cleanup');

    const questions = await Question.find();
    console.log(`Auditing ${questions.length} total questions...`);

    let rejectedCount = 0;
    let snippetCleanedCount = 0;

    for (const q of questions) {
      let isBad = false;
      let rejectReason = '';

      // Check 1: Filename or metadata question pattern check
      const metaCheck = textCleaningService.isFilenameOrMetadataQuestion(q.questionText, []);
      if (metaCheck.rejected) {
        isBad = true;
        rejectReason = `Metadata/Filename pattern detected (${metaCheck.reason})`;
      }

      // Check 2: Check if question text itself has unreadable garbage
      if (!isBad) {
        const textCheck = textCleaningService.isMeaningfulText(q.questionText);
        if (!textCheck.meaningful) {
          isBad = true;
          rejectReason = `Unmeaningful/Corrupted question text (${textCheck.reason})`;
        }
      }

      // If identified as bad question, reject it safely without deleting
      if (isBad) {
        if (q.status !== 'REJECTED') {
          q.status = 'REJECTED';
          q.explanation = `[Audit System]: Flagged as invalid metadata/filename/parser-artifact question (${rejectReason}).`;
          rejectedCount++;
          console.log(`[REJECTED] Question ID ${q._id}: "${q.questionText.substring(0, 60)}..." (Reason: ${rejectReason})`);
        }
      }

      // Sanitize source references snippets for all questions
      if (Array.isArray(q.sourceReferences) && q.sourceReferences.length > 0) {
        let snippetChanged = false;
        q.sourceReferences.forEach((ref) => {
          const cleanSnip = textCleaningService.sanitizeSourceSnippet(ref.snippet, 200);
          if (cleanSnip !== ref.snippet) {
            ref.snippet = cleanSnip;
            snippetChanged = true;
          }
        });
        if (snippetChanged) snippetCleanedCount++;
      }

      await q.save();
    }

    console.log(`\nCleanup complete:`);
    console.log(`- Questions newly marked REJECTED: ${rejectedCount}`);
    console.log(`- Questions with sanitized source snippets: ${snippetCleanedCount}`);

  } catch (err) {
    console.error('Error during bad question cleanup:', err);
  } finally {
    await mongoose.disconnect();
  }
}

cleanupBadQuestions();
