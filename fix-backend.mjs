import fs from 'fs';

let code = fs.readFileSync('backend/server-sqlite.ts', 'utf8');

// 1. Update destructuring in register
const target1 = "const { name, email, password, companyName, companyType } = req.body;";
const replace1 = `const { name, email, password, companyName, companyType, _termsAccepted } = req.body;
    
    // Compliance Extraction
    const acceptanceIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
    const termsVersion = "1.0"; 
    const termsAcceptedAt = new Date();`;

code = code.replace(target1, replace1);

// 2. Update insert statement
const target2 = `const [newUser] = await db.insert(users).values({
      name,
      email,
      password: hashedPassword, 
      companyId,
      role: req.body._sanctionsFlag ? 'pending_review' : 'admin',
      verified: false
    }).returning();`;

const replace2 = `const [newUser] = await db.insert(users).values({
      name,
      email,
      password: hashedPassword, 
      companyId,
      role: req.body._sanctionsFlag ? 'pending_review' : 'admin',
      verified: false,
      termsAcceptedAt: termsAcceptedAt,
      termsVersion: termsVersion,
      acceptanceIp: acceptanceIp.toString()
    }).returning();`;

code = code.replace(target2, replace2);
// Trying with varying newlines if first one fails
const target2Linux = `const [newUser] = await db.insert(users).values({\n      name,\n      email,\n      password: hashedPassword, \n      companyId,\n      role: req.body._sanctionsFlag ? 'pending_review' : 'admin',\n      verified: false\n    }).returning();`;
code = code.replace(target2Linux, replace2);

// 3. Append Delete route
const target3 = "app.listen(PORT, () => console.log(`Che.Comex API + SQLite running on port ${PORT}`));";
const replace3 = `// ── GDPR COMPLIANCE ────────────────────────────────────────────────────────
// DELETE /api/user/:userId/delete-account - Right to be forgotten
import { complianceLog, messages } from '../shared/schema-sqlite.js';

app.delete('/api/user/:userId/delete-account', authenticateToken, async (req: any, res) => {
  try {
    const { userId } = req.params;
    
    // Ensure user can only delete themselves unless admin
    if (req.user.userId !== userId && req.user.role !== 'system_admin') {
      return res.status(403).json({ error: 'Unauthorized to delete this account.' });
    }

    // 1. Log the deletion action in compliance
    await db.insert(complianceLog).values({
      action: 'account_deletion_gdpr',
      userId: userId,
      details: 'User requested right to be forgotten. PII anonymized.',
      ip: (req.headers['x-forwarded-for']?.toString() || req.socket?.remoteAddress || 'unknown').toString()
    });

    // 2. Anonymize user profile (soft delete for fiscal/db integrity but scrub PII)
    await db.update(users).set({
      name: 'Usuario_Eliminado_' + userId.substring(0, 5),
      email: \`deleted_\${userId}@anonymized.comex\`,
      password: 'DELETED',
      phone: null,
      deletedAt: new Date(),
      role: 'deleted'
    }).where(eq(users.id, userId));

    // 3. Delete Physical Chat Messages to clear trace
    await db.delete(messages).where(eq(messages.senderId, userId));

    // 4. Anonymize/Close active marketplace posts
    await db.update(marketplacePosts).set({
      status: 'closed',
      descriptionLong: 'Anonymized due to user deletion.',
      requirements: null,
      certifications: null
    }).where(eq(marketplacePosts.userId, userId));

    res.json({ success: true, message: 'Account and associated PII successfully deleted.' });
  } catch (error: any) {
    console.error('GDPR Delete error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => console.log(\`Che.Comex API + SQLite running on port \${PORT}\`));`;

code = code.replace(target3, replace3);

fs.writeFileSync('backend/server-sqlite.ts', code);
console.log('Backend sync complete');
