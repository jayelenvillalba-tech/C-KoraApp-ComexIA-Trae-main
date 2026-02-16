async function testSearch(query) {
  try {
    const res = await fetch(`http://localhost:3000/api/hs-codes/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    console.log(`Search for "${query}":`);
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error fetching search:', e.message);
  }
}
testSearch('trigo');
