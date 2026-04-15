const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
// app.use("/", (req, res) => {
//     res.send("Hello World")
// });


app.use('/api/classify', async (req, res) => {
    try {
        const { name } = req.query;

        if (!name || name.trim() === "") {
            return res.status(400).json({
                status: "error",
                message: "Bad Request"
            });
        }

        if (typeof name !== "string") {
            return res.status(422).json({
                status: "error",
                message: "Unprocessable entity"
            });
        }

        const genderizeApi = await axios.get(
            `https://api.genderize.io?name=${encodeURIComponent(name)}`
        );

        const { gender, probability, count } = genderizeApi.data;

        if (gender == null || count == 0) {
            return res.status(200).json({
                status: "error",
                message: "No Prediction available for the name provided"
            });
        };

        const sample_size = count;

        const is_Confident = probability >= 0.7 && sample_size >= 100;

        const processed_at = new Date().toISOString();
        
        return res.status(200).json({
            "status": "success",
            "data": {
                "name": name,
                "gender": gender,
                "probability": probability,
                "sample_size": sample_size,
                "is_confident": is_Confident,
                "processed_at": processed_at
            }
        });
    } catch (error) {
        console.log("Error:", error.message)

        return res.status(500).json({
            status: "error",
            message: "internal server error"

        });
    }

});

app.get('/', (req, res) => {
    return res.json({ message: "server is running" })
});

app.listen(PORT, () => {
    console.log(`Server is live at ${"http://localhost:5000"}`);
});