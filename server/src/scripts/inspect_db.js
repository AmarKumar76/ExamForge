const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const Question = require('../models/Question');
const QuestionFolder = require('../models/QuestionFolder');
const CourseMaterial = require('../models/CourseMaterial');
const MaterialChunk = require('../models/MaterialChunk');
const Course = require('../models/Course');

async function inspect() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const courses = await Course.find().lean();
    console.log(`\n--- COURSES (${courses.length}) ---`);
    courses.forEach(c => console.log(`Course: ${c.code} - ${c.name} (ID: ${c._id})`));

    const folders = await QuestionFolder.find().lean();
    console.log(`\n--- QUESTION FOLDERS (${folders.length}) ---`);
    folders.forEach(f => console.log(`Folder: "${f.title}" (CourseID: ${f.courseId}, ID: ${f._id})`));

    const materials = await CourseMaterial.find().lean();
    console.log(`\n--- COURSE MATERIALS (${materials.length}) ---`);
    materials.forEach(m => console.log(`Material: "${m.title}" / "${m.originalFileName}" (CourseID: ${m.courseId}, ID: ${m._id})`));

    const questions = await Question.find().lean();
    console.log(`\n--- QUESTIONS (${questions.length}) ---`);
    questions.forEach(q => {
      console.log(`\nQuestion ID: ${q._id}`);
      console.log(`  CourseID: ${q.courseId}`);
      console.log(`  FolderID: ${q.folderId}`);
      console.log(`  Status: ${q.status}`);
      console.log(`  Text: ${q.questionText.substring(0, 80)}...`);
      if (q.sourceReferences && q.sourceReferences.length > 0) {
        console.log(`  SourceRef[0] Snippet: ${JSON.stringify(q.sourceReferences[0].snippet.substring(0, 100))}`);
      }
    });

    const chunks = await MaterialChunk.find().limit(5).lean();
    console.log(`\n--- SAMPLE MATERIAL CHUNKS (${chunks.length}) ---`);
    chunks.forEach(c => {
      console.log(`Chunk [Index ${c.chunkIndex}, File: ${c.sourceFileName}]: ${JSON.stringify(c.text.substring(0, 100))}`);
    });

  } catch (err) {
    console.error('Inspection error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

inspect();
