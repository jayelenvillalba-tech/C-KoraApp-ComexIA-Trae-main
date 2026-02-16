
console.log('Testing Parser Import...');

try {
    const { StructuredOutputParser } = await import('@langchain/core/output_parsers');
    console.log('✅ Success: Imported from @langchain/core/output_parsers');
} catch (e: any) {
    console.log('❌ Failed @langchain/core/output_parsers:', e.message);
}

try {
    const { StructuredOutputParser } = await import('langchain/output_parsers');
    console.log('✅ Success: Imported from langchain/output_parsers');
} catch (e: any) {
    console.log('❌ Failed langchain/output_parsers:', e.message);
}
