require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

async function test() {
  const { HUGGINGFACE_API_KEY } = process.env;
  console.log("Key exists:", !!HUGGINGFACE_API_KEY);

  try {
    // real image fetch
    const imgRes = await axios.get(
      "https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/transformers/rabbit.png",
      { responseType: 'arraybuffer' }
    );

    const imgBuffer = Buffer.from(imgRes.data);

    console.log("Sending request to HF...");

    const hfRes = await axios.post(
      "https://api-inference.huggingface.co/models/google/vit-base-patch16-224",
      imgBuffer,
      {
        headers: {
          "Authorization": `Bearer ${HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/octet-stream"
        }
      }
    );

    console.log("Response:", hfRes.data);

    fs.writeFileSync("out.json", JSON.stringify(hfRes.data, null, 2));

  } catch(e) {
    console.error("Error:", e.message);
    console.error("Details:", e.response?.data);
  }
}

test();