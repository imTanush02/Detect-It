require('dotenv').config();
const { analyzeImage } = require('./services/imageAnalysis');
const axios = require('axios');

async function test() {
  const fileRes = await axios.get("https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/transformers/rabbit.png", { responseType: 'arraybuffer' });
  const fileBuffer = Buffer.from(fileRes.data);
  const result = await analyzeImage(fileBuffer, "image/png");
  require('fs').writeFileSync('test_result_direct.json', JSON.stringify(result, null, 2));
  console.log("Done");
}
test();
