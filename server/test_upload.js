const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

async function testUpload() {
  try {
    const filePath = 'e:\\SHRiyans\\Detect-It\\client\\public\\vite.svg'; // some dummy image
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));

    console.log("Sending file to API...");
    const res = await axios.post('http://localhost:5000/api/analyze/file', form, {
      headers: form.getHeaders(),
    });
    console.log("Success:", res.data);
  } catch(e) {
    console.error("Error from API:", e.message, e.response?.data);
  }
}
testUpload();
