const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Institution = require('../models/Institution');
const Course = require('../models/Course');
const User = require('../models/User');
const courseService = require('../services/course.service');

async function testRelationships() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB.');

  // 1. Fetch PIT institution
  const pit = await Institution.findOne({ code: 'PIT' });
  const piet = await Institution.findOne({ code: 'PIET' });
  console.log('PIT ID:', pit._id.toString());
  console.log('PIET ID:', piet._id.toString());

  // 2. Fetch CS301 course
  const cs301 = await Course.findOne({ code: 'CS301', institutionId: pit._id });
  console.log('CS301 Course ID:', cs301._id.toString(), 'Institution:', cs301.institutionId.toString());

  // 3. Fetch instructor belonging to PIT
  const pitInstructor = await User.findOne({ email: 'amar@gmail.com' });
  console.log('PIT Instructor ID:', pitInstructor._id.toString(), 'Institution:', pitInstructor.institutionId.toString());

  // 4. Test assigning PIT instructor to CS301 (Same Institution)
  console.log('\n--- TEST 1: Same Institution Assignment ---');
  const updatedCourse = await courseService.manageInstructors(cs301._id.toString(), [pitInstructor._id.toString()], 'set');
  console.log('SUCCESS: Assigned instructor count:', updatedCourse.instructorIds.length);
  console.log('Assigned Instructor Name:', updatedCourse.instructorIds[0].name);

  // 5. Test assigning cross-institution instructor (Should fail with 400)
  console.log('\n--- TEST 2: Cross Institution Assignment ---');
  let pietInstructor = await User.findOne({ email: 'piet_faculty@parul.edu' });
  if (!pietInstructor) {
    pietInstructor = await User.create({
      name: 'PIET Faculty Member',
      email: 'piet_faculty@parul.edu',
      passwordHash: 'dummyhash',
      role: 'INSTRUCTOR',
      status: 'ACTIVE',
      institutionId: piet._id,
    });
  }
  console.log('PIET Instructor ID:', pietInstructor._id.toString(), 'Institution:', pietInstructor.institutionId.toString());

  try {
    await courseService.manageInstructors(cs301._id.toString(), [pietInstructor._id.toString()], 'set');
    console.error('FAILED: Cross-institution assignment should have thrown an error!');
    process.exit(1);
  } catch (err) {
    console.log('SUCCESS: Caught expected error:', err.message, '| Code:', err.code);
  }

  // 6. Test Object format array passing (e.g. [{ id: '...' }])
  console.log('\n--- TEST 3: Object ID normalization ---');
  const objUpdated = await courseService.manageInstructors(cs301._id.toString(), [{ id: pitInstructor._id.toString() }], 'set');
  console.log('SUCCESS: Object normalized assignment count:', objUpdated.instructorIds.length);

  await mongoose.disconnect();
  console.log('\n=== ALL RELATIONSHIP & ASSIGNMENT TESTS PASSED ===');
}

testRelationships().catch((err) => {
  console.error('Test Failed:', err);
  process.exit(1);
});
