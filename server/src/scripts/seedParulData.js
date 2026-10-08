const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Institution = require('../models/Institution');
const Course = require('../models/Course');
const CourseMaterial = require('../models/CourseMaterial');
const MaterialChunk = require('../models/MaterialChunk');
const Question = require('../models/Question');
const QuestionFolder = require('../models/QuestionFolder');
const Exam = require('../models/Exam');
const User = require('../models/User');

async function seedParulData() {
  console.log('Connecting to MongoDB database...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected.');

  // 1. Create or update Parul Institutions
  const parulInsts = [
    {
      code: 'PIT',
      name: 'Parul Institute of Technology',
      departments: ['Computer Science & Engineering', 'Information Technology', 'Artificial Intelligence']
    },
    {
      code: 'PIET',
      name: 'Parul Institute of Engineering Technology',
      departments: ['Computer Science', 'Electronics & Communication', 'Mechanical Engineering']
    },
    {
      code: 'PBCA',
      name: 'Parul BCA',
      departments: ['Computer Applications', 'Software Development']
    }
  ];

  const instMap = {};
  for (const item of parulInsts) {
    let inst = await Institution.findOne({ code: item.code });
    if (!inst) {
      inst = await Institution.create({
        name: item.name,
        code: item.code,
        status: 'ACTIVE',
        departments: item.departments,
      });
      console.log(`✅ Created Institution: [${inst.code}] ${inst.name}`);
    } else {
      inst.name = item.name;
      inst.status = 'ACTIVE';
      inst.departments = item.departments;
      await inst.save();
      console.log(`🔄 Updated Institution: [${inst.code}] ${inst.name}`);
    }
    instMap[item.code] = inst._id;
  }

  const pitId = instMap['PIT'];

  // 2. Identify primary CS301 course (6ac4015d8e4ad98f2e27cd13)
  const primaryCs301Id = new mongoose.Types.ObjectId('6ac4015d8e4ad98f2e27cd13');
  let primaryCourse = await Course.findById(primaryCs301Id);
  if (!primaryCourse) {
    primaryCourse = await Course.findOne({ code: 'CS301' });
  }

  // Merge assets from secondary CS301 course 6ac3be8ccaf2216efa881164 to primary course
  const secondaryCs301Id = new mongoose.Types.ObjectId('6ac3be8ccaf2216efa881164');
  if (primaryCourse && primaryCourse._id.toString() !== secondaryCs301Id.toString()) {
    await CourseMaterial.updateMany({ courseId: secondaryCs301Id }, { $set: { courseId: primaryCourse._id, institutionId: pitId } });
    await MaterialChunk.updateMany({ courseId: secondaryCs301Id }, { $set: { courseId: primaryCourse._id, institutionId: pitId } });
    await Question.updateMany({ courseId: secondaryCs301Id }, { $set: { courseId: primaryCourse._id, institutionId: pitId } });
    await QuestionFolder.updateMany({ courseId: secondaryCs301Id }, { $set: { courseId: primaryCourse._id, institutionId: pitId } });
    await Exam.updateMany({ courseId: secondaryCs301Id }, { $set: { courseId: primaryCourse._id, institutionId: pitId } });
    console.log('Merged secondary CS301 course assets into primary CS301 course.');
  }

  // Update primary CS301 course to belong to PIT
  if (primaryCourse) {
    primaryCourse.institutionId = pitId;
    primaryCourse.code = 'CS301';
    primaryCourse.name = 'Data Structures & Algorithms';
    primaryCourse.title = 'Data Structures & Algorithms';
    primaryCourse.department = 'Computer Science & Engineering';
    primaryCourse.status = 'ACTIVE';
    await primaryCourse.save();
    console.log(`Primary CS301 course updated under PIT: ID [${primaryCourse._id}]`);
  }

  // 3. Define intended CSE Academic Courses
  const cseCourses = [
    {
      code: 'CS301',
      name: 'Data Structures & Algorithms',
      department: 'Computer Science & Engineering',
      description: 'Core data structures, algorithmic complexity, tree, graph, sorting and searching algorithms.'
    },
    {
      code: 'CS302',
      name: 'Web Development',
      department: 'Computer Science & Engineering',
      description: 'Modern full-stack web application development with React, Node.js, Express, and REST APIs.'
    },
    {
      code: 'CS303',
      name: 'Java Programming',
      department: 'Computer Science & Engineering',
      description: 'Object-oriented programming principles, multi-threading, collections framework, and JVM memory layout.'
    },
    {
      code: 'CS304',
      name: 'System Design',
      department: 'Computer Science & Engineering',
      description: 'Scalable system architecture, microservices, load balancing, caching strategies, and database sharding.'
    },
    {
      code: 'CS305',
      name: 'Database Management Systems',
      department: 'Computer Science & Engineering',
      description: 'Relational database theory, SQL optimization, ACID transactions, indexing, and NoSQL architecture.'
    }
  ];

  // Find instructors to assign
  const instructors = await User.find({ role: { $in: ['INSTRUCTOR', 'SUPER_ADMIN'] } });
  const instructorIds = instructors.map((u) => u._id);

  // Link users to PIT
  await User.updateMany({}, { $set: { institutionId: pitId } });

  const validCourseIds = [];
  if (primaryCourse) validCourseIds.push(primaryCourse._id);

  for (const item of cseCourses) {
    if (item.code === 'CS301' && primaryCourse) {
      primaryCourse.instructorIds = instructorIds;
      await primaryCourse.save();
      continue;
    }

    let crs = await Course.findOne({ code: item.code, institutionId: pitId });
    if (!crs) {
      crs = await Course.create({
        institutionId: pitId,
        code: item.code,
        name: item.name,
        title: item.name,
        department: item.department,
        description: item.description,
        status: 'ACTIVE',
        instructorIds,
      });
      console.log(`✅ Created Course: [${crs.code}] ${crs.name}`);
    } else {
      crs.name = item.name;
      crs.title = item.name;
      crs.department = item.department;
      crs.status = 'ACTIVE';
      crs.instructorIds = instructorIds;
      await crs.save();
      console.log(`🔄 Updated Course: [${crs.code}] ${crs.name}`);
    }
    validCourseIds.push(crs._id);
  }

  // Update all materials, chunks, questions, folders, exams to reference PIT institutionId
  await CourseMaterial.updateMany({}, { $set: { institutionId: pitId } });
  await MaterialChunk.updateMany({}, { $set: { institutionId: pitId } });
  await Question.updateMany({}, { $set: { institutionId: pitId } });
  await QuestionFolder.updateMany({}, { $set: { institutionId: pitId } });
  await Exam.updateMany({}, { $set: { institutionId: pitId } });

  // 4. Delete unneeded test/generated courses that have no assets
  const coursesToDelete = await Course.find({ _id: { $nin: validCourseIds } });
  console.log(`🗑️ Deleting ${coursesToDelete.length} unneeded test/generated course documents...`);
  await Course.deleteMany({ _id: { $nin: validCourseIds } });

  // 5. Delete unneeded test institutions (keeping PIT, PIET, PBCA)
  const validInstIds = Object.values(instMap);
  const instsToDelete = await Institution.find({ _id: { $nin: validInstIds } });
  console.log(`🗑️ Deleting ${instsToDelete.length} unneeded test/generated institution documents...`);
  await Institution.deleteMany({ _id: { $nin: validInstIds } });

  // 6. Verify final database state
  const finalInsts = await Institution.find({}).lean();
  const finalCourses = await Course.find({}).lean();
  const finalUsers = await User.find({}).lean();
  const finalQuestions = await Question.countDocuments({});
  const finalExams = await Exam.countDocuments({});

  console.log('\n=== FINAL CLEAN DATABASE STATUS ===');
  console.log(`Institutions (${finalInsts.length}):`, finalInsts.map((i) => `${i.code} (${i.name})`).join(', '));
  console.log(`Courses (${finalCourses.length}):`, finalCourses.map((c) => `${c.code} (${c.name || c.title})`).join(', '));
  console.log(`Users: ${finalUsers.length}`);
  console.log(`Questions: ${finalQuestions}`);
  console.log(`Exams: ${finalExams}`);

  await mongoose.disconnect();
}

if (require.main === module) {
  seedParulData().catch((err) => {
    console.error('Fatal error in seed script:', err);
    mongoose.disconnect();
    process.exit(1);
  });
}

module.exports = seedParulData;
