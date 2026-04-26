#!/usr/bin/env node

/**
 * Appwrite Database Setup Script
 * Tạo lại tất cả collections cho Mobile Lifestyle app
 */

const https = require('https');

// Configuration
const CONFIG = {
  endpoint: 'https://sgp.cloud.appwrite.io/v1',
  projectId: '69b892550001509f1310',
  databaseId: '69b89465002bd1a4457f',
  apiKey: process.env.APPWRITE_API_KEY || '',
};

// Helper function untuk gọi Appwrite API
async function callAppwriteAPI(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(CONFIG.endpoint + path);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': CONFIG.projectId,
        'X-Appwrite-Key': CONFIG.apiKey,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode >= 400) {
            reject(new Error(`API Error: ${res.statusCode} - ${JSON.stringify(response)}`));
          } else {
            resolve(response);
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// Collections schema definition
const COLLECTIONS = {
  'user_profiles': {
    name: 'User Profiles',
    attributes: [
      { name: 'userId', type: 'string', size: 255, required: true },
      { name: 'dateOfBirth', type: 'string', size: 255, required: false },
      { name: 'gender', type: 'string', size: 50, required: false },
      { name: 'height', type: 'float', required: false },
      { name: 'weight', type: 'float', required: false },
      { name: 'bloodType', type: 'string', size: 10, required: false },
      { name: 'createdAt', type: 'datetime', required: false },
      { name: 'updatedAt', type: 'datetime', required: false },
    ],
  },

  'health_record': {
    name: 'Health Records',
    attributes: [
      { name: 'userId', type: 'string', size: 255, required: true },
      { name: 'diseaseId', type: 'string', size: 100, required: true },
      { name: 'diseaseName', type: 'string', size: 255, required: false },
      { name: 'value1', type: 'float', required: false },
      { name: 'value2', type: 'float', required: false },
      { name: 'value3', type: 'float', required: false },
      { name: 'value4', type: 'float', required: false },
      { name: 'unit1', type: 'string', size: 50, required: false },
      { name: 'unit2', type: 'string', size: 50, required: false },
      { name: 'unit3', type: 'string', size: 50, required: false },
      { name: 'unit4', type: 'string', size: 50, required: false },
      { name: 'notes', type: 'string', size: 1000, required: false },
      { name: 'recordDate', type: 'datetime', required: false },
      { name: 'createdAt', type: 'datetime', required: false },
      { name: 'updatedAt', type: 'datetime', required: false },
    ],
  },

  'health_alerts': {
    name: 'Health Alerts',
    attributes: [
      { name: 'userId', type: 'string', size: 255, required: true },
      { name: 'alertType', type: 'string', size: 50, required: false },
      { name: 'title', type: 'string', size: 255, required: true },
      { name: 'description', type: 'string', size: 1000, required: false },
      { name: 'severity', type: 'string', size: 50, required: false },
      { name: 'isRead', type: 'boolean', required: false },
      { name: 'createdAt', type: 'datetime', required: false },
      { name: 'readAt', type: 'datetime', required: false },
    ],
  },

  'chat_sessions': {
    name: 'Chat Sessions',
    attributes: [
      { name: 'userId', type: 'string', size: 255, required: true },
      { name: 'title', type: 'string', size: 255, required: false },
      { name: 'createdAt', type: 'datetime', required: false },
      { name: 'updatedAt', type: 'datetime', required: false },
    ],
  },

  'habits': {
    name: 'Habits',
    attributes: [
      { name: 'userId', type: 'string', size: 255, required: true },
      { name: 'name', type: 'string', size: 255, required: true },
      { name: 'description', type: 'string', size: 1000, required: false },
      { name: 'frequency', type: 'string', size: 50, required: false },
      { name: 'createdAt', type: 'datetime', required: false },
      { name: 'updatedAt', type: 'datetime', required: false },
    ],
  },

  'completions': {
    name: 'Completions',
    attributes: [
      { name: 'userId', type: 'string', size: 255, required: true },
      { name: 'habitId', type: 'string', size: 255, required: true },
      { name: 'completedAt', type: 'datetime', required: true },
      { name: 'notes', type: 'string', size: 500, required: false },
      { name: 'createdAt', type: 'datetime', required: false },
    ],
  },
};

// Main setup function
async function setupDatabase() {
  if (!CONFIG.apiKey) {
    console.error('❌ Error: APPWRITE_API_KEY environment variable not set!');
    console.error('\nHướng dẫn lấy API Key:');
    console.error('1. Truy cập: https://cloud.appwrite.io/console');
    console.error('2. Đăng nhập vào tài khoản');
    console.error('3. Chọn Project: "New project" (69295f1300338928dc78)');
    console.error('4. Vào Settings > API Keys');
    console.error('5. Nhấp "Create API Key"');
    console.error('6. Cấp quyền: databases.* và collections.*');
    console.error('7. Copy API Key và chạy lại:');
    console.error('   APPWRITE_API_KEY=your_api_key node scripts/setup-database.js');
    process.exit(1);
  }

  console.log('🚀 Bắt đầu setup database...\n');

  try {
    // Kiểm tra database tồn tại
    console.log('📦 Kiểm tra database...');
    try {
      await callAppwriteAPI('GET', `/databases/${CONFIG.databaseId}`);
      console.log('✅ Database tồn tại\n');
    } catch (e) {
      console.log('⚠️ Database không tồn tại, đang tạo...');
      await callAppwriteAPI('POST', '/databases', {
        databaseId: CONFIG.databaseId,
        name: 'Health Database',
      });
      console.log('✅ Database tạo thành công\n');
    }

    // Tạo collections
    for (const [collectionId, collectionConfig] of Object.entries(COLLECTIONS)) {
      console.log(`📝 Xử lý collection: ${collectionId}...`);

      // Kiểm tra collection tồn tại
      try {
        await callAppwriteAPI('GET', `/databases/${CONFIG.databaseId}/collections/${collectionId}`);
        console.log(`   ℹ️ Collection đã tồn tại, đang xóa...`);
        try {
          await callAppwriteAPI('DELETE', `/databases/${CONFIG.databaseId}/collections/${collectionId}`);
          console.log(`   ✓ Đã xóa collection cũ`);
        } catch (e) {
          console.log(`   ⚠️ Không thể xóa: ${e.message}`);
        }
      } catch (e) {
        // Collection chưa tồn tại, không sao
      }

      // Tạo collection mới
      try {
        await callAppwriteAPI('POST', `/databases/${CONFIG.databaseId}/collections`, {
          collectionId,
          name: collectionConfig.name,
          permissions: [
            'read("any")',
            'write("any")',
          ],
        });
        console.log(`   ✅ Collection tạo thành công`);
      } catch (e) {
        console.error(`   ❌ Lỗi tạo collection: ${e.message}`);
        continue;
      }

      // Tạo attributes
      for (const attr of collectionConfig.attributes) {
        try {
          let payload = {
            key: attr.name,
            type: attr.type,
            required: attr.required || false,
          };

          if (attr.type === 'string') {
            payload.size = attr.size || 255;
          }

          const endpointPath = `/databases/${CONFIG.databaseId}/collections/${collectionId}/attributes/${attr.type === 'datetime' ? 'datetime' : attr.type === 'boolean' ? 'boolean' : attr.type === 'float' ? 'float' : 'string'}`;
          
          await callAppwriteAPI('POST', endpointPath, payload);
          console.log(`   ✓ Attribute "${attr.name}" tạo thành công`);
        } catch (e) {
          console.log(`   ⚠️ Attribute "${attr.name}": ${e.message}`);
        }
      }

      // Tạo index cho userId
      try {
        await callAppwriteAPI('POST', `/databases/${CONFIG.databaseId}/collections/${collectionId}/indexes`, {
          key: 'idx_userId',
          type: 'key',
          attributes: ['userId'],
        });
        console.log(`   ✓ Index userId tạo thành công`);
      } catch (e) {
        console.log(`   ℹ️ Index userId: ${e.message}`);
      }

      console.log('');
    }

    console.log('✅ Setup database hoàn tất!\n');
    console.log('📋 Collections được tạo:');
    Object.entries(COLLECTIONS).forEach(([id, config]) => {
      console.log(`   • ${config.name} (${id})`);
    });

  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    process.exit(1);
  }
}

// Run setup
setupDatabase();
