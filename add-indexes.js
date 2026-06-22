const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'prisma/schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

const models = schema.split(/model\s+\w+\s+\{/);
const parsedModels = [];
let currentIndex = 0;

const regex = /(model\s+\w+\s+\{)([\s\S]*?)(\n\})/g;

let newSchema = schema.replace(regex, (match, p1, p2, p3) => {
  let newBody = p2;
  
  const hasDeletedAt = newBody.includes('deleted_at');
  const hasOrgId = newBody.includes('org_id');
  const hasCreatedAt = newBody.includes('created_at');
  
  if (hasDeletedAt && !newBody.includes('@@index([deleted_at])')) {
    newBody += '\n  @@index([deleted_at])';
  }
  
  if (hasOrgId && hasCreatedAt && !newBody.includes('@@index([org_id, created_at])')) {
    newBody += '\n  @@index([org_id, created_at])';
  }
  
  return p1 + newBody + p3;
});

fs.writeFileSync(schemaPath, newSchema, 'utf8');
console.log('Indexes added successfully.');
