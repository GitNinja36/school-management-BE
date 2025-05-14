import dotenv from "dotenv";
import app from "./middlewares/middleware.js";
dotenv.config();

const PORT = process.env.PORT;

app.listen(PORT, () => {
    console.log(`Server is running at PORT ${PORT}`);
});