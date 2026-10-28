
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

const imagePath = path.join(
    __dirname,
    "..",
    "ml",
    "dataset",
    "plantvillage dataset",
    "color",
    "Apple___Apple_scab",
    "00075aa8-d81a-4184-8541-b692b78d398a___FREC_Scab 3335.JPG"
);

async function testDiseasePrediction() {
    try {
        const form = new FormData();

        form.append("image", fs.createReadStream(imagePath));

        const response = await axios.post(
            "http://localhost:5000/api/disease/predict",
            form,
            {
                headers: form.getHeaders()
            }
        );

        console.log("Prediction successful!");
        console.log(response.data);

    } catch (error) {
        console.error(
            "Test failed:",
            error.response?.data || error.message
        );
    }
}

testDiseasePrediction();
