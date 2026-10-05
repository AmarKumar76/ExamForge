const http = require('http');
const express = require('express');

const testLoginAPI = async () => {
  const app = require('../app');
  const { connectDB, disconnectDB } = require('../config/db');

  await connectDB();

  const server = app.listen(5099, async () => {
    console.log('🧪 Test server listening on port 5099');

    const testAccounts = [
      { email: 'amar@gmail.com', password: 'Instructor@123', expectedRole: 'INSTRUCTOR' },
      { email: 'admin@examforge.org', password: 'Admin@123', expectedRole: 'SUPER_ADMIN' },
      { email: 'student@examforge.org', password: 'Student@123', expectedRole: 'STUDENT' },
    ];

    for (const acc of testAccounts) {
      const postData = JSON.stringify({ email: acc.email, password: acc.password });

      await new Promise((resolve) => {
        const req = http.request(
          {
            hostname: 'localhost',
            port: 5099,
            path: '/api/v1/auth/login',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(postData),
            },
          },
          (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
              console.log(`\n----------------------------------------`);
              console.log(`Testing Login for: ${acc.email}`);
              console.log(`HTTP Status: ${res.statusCode}`);
              console.log(`Content-Type: ${res.headers['content-type']}`);
              
              try {
                const parsed = JSON.parse(data);
                console.log(`Success Flag: ${parsed.success}`);
                console.log(`Returned User Role: ${parsed.data?.user?.role}`);
                console.log(`JWT Token Received: ${!!parsed.data?.token}`);
                if (res.statusCode === 200 && parsed.success && parsed.data?.token) {
                  console.log(`✅ PASSED for ${acc.email}`);
                } else {
                  console.error(`❌ FAILED for ${acc.email}: ${parsed.message}`);
                }
              } catch (e) {
                console.error(`❌ Failed to parse JSON response:`, data);
              }
              resolve();
            });
          }
        );

        req.on('error', (err) => {
          console.error(`Request error:`, err);
          resolve();
        });

        req.write(postData);
        req.end();
      });
    }

    server.close(async () => {
      await disconnectDB();
      console.log('\n🏁 API Testing Complete.');
    });
  });
};

testLoginAPI();
