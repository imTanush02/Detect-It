const axios = require('axios');

async function test() {
  try {
    const res = await axios.post('http://localhost:5000/api/analyze/url', {
      url: "https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/transformers/rabbit.png"
    });
    require('fs').writeFileSync('test_result.json', JSON.stringify(res.data, null, 2));
    console.log("Written to test_result.json");
  } catch (err) {
    console.error("API error:", err.response?.data || err.message);
  }
}
test();
