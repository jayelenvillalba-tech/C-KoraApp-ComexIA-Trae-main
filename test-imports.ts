
console.log('Starting imports...');
try {
    const express = await import('express');
    console.log('✅ Express imported');
} catch (e) {
    console.error('❌ Express failed:', e);
}

try {
    const mongoose = await import('mongoose');
    console.log('✅ Mongoose imported');
} catch (e) {
    console.error('❌ Mongoose failed:', e);
}

try {
    const langchainOpenAI = await import('@langchain/openai');
    console.log('✅ @langchain/openai imported');
} catch (e) {
    console.error('❌ @langchain/openai failed:', e);
}

try {
    const langchainOutputParsers = await import('langchain/output_parsers');
    console.log('✅ langchain/output_parsers imported');
} catch (e: any) {
    console.error('❌ langchain/output_parsers failed:', e.message);
}
